---
name: "state-is-the-enemy"
priority: 1
pack: "core"
triggers:
  - "let "
  - "module scope"
  - "in-memory"
  - "cache"
  - "singleton"
  - "global"
  - "durable object"
  - "stateful"
  - "rate limit"
  - "session"
  - "websocket"
paths:
  - "src/worker/**"
  - "workers/**"
  - "apps/*/src/worker/**"
---

# State Is the Enemy — Push to DOs or Eliminate

Stateful code in a Cloudflare Worker is the primary source of scaling and correctness
bugs. A Worker isolate is a stateless function: it boots, serves a request, and may be
evicted at any time. Module-level `let` and `const` that accumulate mutable state across
requests are bugs that only manifest under concurrent load — and CF Workers run concurrent
requests in the same isolate during warm periods.

The rule has two outcomes: if something must persist across requests, it lives in a
Durable Object, D1, KV, or R2. If it does not need to persist, it is computed on demand
and cached at the CDN layer — not in Worker memory.

## The three failure modes of Worker-scoped state

### 1. Module-scope mutable variables

```typescript
// BUG: module scope leaks across concurrent requests
let requestCount = 0;
let lastUser: User | null = null;

export default {
  async fetch(req) {
    requestCount++; // race condition under concurrency
    lastUser = await getUser(req); // next request sees previous user's data
    return new Response(`${requestCount}`);
  }
}
```

The `requestCount` increments for concurrent requests non-atomically. The `lastUser`
is visible to the NEXT request before it is cleared. Under load, this is a data leak.

Fix: eliminate both. Compute count from D1/KV if needed. Pass user as a local variable.

### 2. In-memory cache with no isolation guarantee

```typescript
// BUG: looks like a cache, actually a correctness hazard
const featureCache = new Map<string, boolean>();

async function isEnabled(key: string, env: Env): Promise<boolean> {
  if (featureCache.has(key)) return featureCache.get(key)!;
  const flag = await env.DB.prepare('SELECT enabled FROM flags WHERE key = ?').bind(key).first();
  featureCache.set(key, flag?.enabled ?? false);
  return flag?.enabled ?? false;
}
```

This works perfectly in tests and single-request scenarios. Under concurrent load, two
requests populate the cache simultaneously with different values. After an isolate
restart, the cache is empty and a thundering herd of D1 queries fires. After a flag
toggle in D1, the old value is served until the isolate is evicted (could be hours).

Fix: Use KV with a 60-second TTL as the caching layer, not a module-scope Map.

```typescript
async function isEnabled(key: string, env: Env): Promise<boolean> {
  const cached = await env.KV.get(`flag:${key}`, 'json') as boolean | null;
  if (cached !== null) return cached;
  const flag = await env.DB.prepare('SELECT enabled FROM flags WHERE key = ?').bind(key).first();
  const value = flag?.enabled ?? false;
  await env.KV.put(`flag:${key}`, JSON.stringify(value), { expirationTtl: 60 });
  return value;
}
```

### 3. Singleton that should be a Durable Object

```typescript
// BUG: rate limiter in Worker memory is per-isolate, not per-tenant
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const state = rateLimiter.get(userId) ?? { count: 0, resetAt: now + 60_000 };
  if (now > state.resetAt) state = { count: 0, resetAt: now + 60_000 };
  state.count++;
  rateLimiter.set(userId, state);
  return state.count <= 100;
}
```

CF Workers run in multiple isolates across many machines. Each isolate has its own
`rateLimiter` map. A user hitting 5 different isolates gets 5×100 = 500 requests/min.
The rate limiter is broken by design.

Fix: Use a Durable Object for per-user rate limiting.

```typescript
// worker/do/rate-limiter.ts
export class RateLimiter implements DurableObject {
  private state: DurableObjectState;
  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const count = (await this.state.storage.get<number>('count')) ?? 0;
    const resetAt = (await this.state.storage.get<number>('resetAt')) ?? 0;
    const now = Date.now();

    if (now > resetAt) {
      await this.state.storage.put('count', 1);
      await this.state.storage.put('resetAt', now + 60_000);
      return new Response('ok');
    }

    if (count >= 100) return new Response('rate-limited', { status: 429 });

    await this.state.storage.put('count', count + 1);
    return new Response('ok');
  }
}

// In handler:
const id = env.RATE_LIMITER.idFromName(userId);
const stub = env.RATE_LIMITER.get(id);
const res = await stub.fetch(request);
if (res.status === 429) return new Response('Too many requests', { status: 429 });
```

## What lives where (canonical routing table)

| State type | Correct primitive | Wrong primitive |
|---|---|---|
| Per-user rate limit | Durable Object | Worker Map, Redis |
| WebSocket session | Durable Object | Worker global |
| Distributed lock | Durable Object | Worker boolean |
| Feature flag value | KV (60s TTL) | Worker Map |
| Per-request context | Local variable | Module-scope let |
| User session / JWT | Cookie + D1 | Worker Map |
| AI conversation history | D1 + DO | Worker array |
| Tenant config | KV (60s TTL) | Worker object |
| File/blob | R2 | Worker Buffer |

## The stateless design checklist

Before every Worker PR:

- [ ] No `let` or `var` at module scope that accumulates state across requests
- [ ] No `Map` / `Set` / `Array` at module scope used as a cache
- [ ] Every cache goes through KV or CF Cache API, not Worker memory
- [ ] Rate limiters implemented as DOs
- [ ] WebSocket sessions implemented as DOs
- [ ] Every piece of "per-tenant" state routes through a DO stub or D1
- [ ] Module-scope `const` are immutable config only (URLs, regexes, Zod schemas)

## Immutable module-scope constants are fine

```typescript
// CORRECT: immutable, stateless, safe at module scope
const ALLOWED_ORIGINS = new Set(['https://app.megabyte.space', 'https://megabyte.space']);
const UserSchema = z.object({ id: z.string(), email: z.string().email() });
const API_VERSION = 'v2';
```

Zod schemas, `Set`s of config values, and immutable constants are safe at module scope.
The rule applies to mutable state only.

## Durable Objects are the correct CF primitive

DOs give you:

- Per-entity serialized execution (no race conditions)
- Transactional SQLite storage (`this.state.storage`)
- Global singleton per ID (not per-isolate)
- WebSocket hibernation for long-lived connections
- Alarms for scheduled per-entity work

Use them without apology. CF lock-in doctrine (`[[cloudflare-lock-in-is-leverage]]`)
explicitly endorses deep DO usage. The alternative (Redis, external session stores, "just
coordinate in D1") is slower, more expensive, and less correct.

## Anti-patterns

- `const cache = new Map()` at module top level used as an LRU
- `let currentUser` at module scope "for performance"
- Rate limiter as a Worker-scope counter (broken under multi-isolate deployment)
- "We'll add DOs later when it becomes a problem" — the problem is invisible until prod breaks
- Storing WebSocket session state in Worker memory (evicted = session lost)
- Any `setInterval` / `setTimeout` at module scope (does not work in CF Workers anyway)

## Cross-links

- `[[cloudflare-lock-in-is-leverage]]` — DOs are the canonical CF stateful primitive; embrace them
- `[[zod-everywhere]]` — stateless Workers validate all state at every boundary entry
- `[[production-observability-default-on]]` — stateless Workers are trivially traceable; stateful ones produce confusing overlapping traces
- `[[fail-fast-build-fail-soft-prod]]` — a Worker with stateful bugs fails softly in prod (wrong counts, stale caches) but never loudly; detect via observability
- `[[hono-api]]` — Hono middleware context (`c.set` / `c.get`) is request-scoped and safe; module scope is not
