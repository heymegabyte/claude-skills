---
name: "state-is-the-enemy"
priority: 2
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

A Worker isolate boots, serves a request, and may be evicted at any time. Module-level `let`/`const` that accumulates mutable state across requests is a bug that only manifests under concurrent load — and CF Workers run concurrent requests in the same isolate during warm periods.

- If state must persist across requests → Durable Object, D1, KV, or R2.
- If state does not need to persist → compute on demand, cache at CDN — not in Worker memory.

## The three failure modes

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

- `requestCount` increments non-atomically under concurrency.
- `lastUser` is visible to the next request — data leak under load.
- **Fix:** eliminate both. Compute count from D1/KV. Pass user as a local variable.

### 2. In-memory cache with no isolation guarantee

```typescript
// BUG: correct in tests, broken under concurrent load
const featureCache = new Map<string, boolean>();

async function isEnabled(key: string, env: Env): Promise<boolean> {
  if (featureCache.has(key)) return featureCache.get(key)!;
  const flag = await env.DB.prepare('SELECT enabled FROM flags WHERE key = ?').bind(key).first();
  featureCache.set(key, flag?.enabled ?? false);
  return flag?.enabled ?? false;
}
```

- Two concurrent requests populate the cache simultaneously with different values.
- After isolate restart, the cache is empty → thundering herd of D1 queries.
- After a D1 flag toggle, the stale value is served until eviction (could be hours).
- **Fix:** KV with a 60-second TTL.

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
// BUG: per-isolate counter — user hitting 5 isolates gets 5×100 = 500 req/min
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
```

- **Fix:** Durable Object for per-user rate limiting.

```typescript
// worker/do/rate-limiter.ts
export class RateLimiter implements DurableObject {
  private state: DurableObjectState;
  constructor(state: DurableObjectState) { this.state = state; }

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

## Canonical state routing

- **Per-user rate limit** — Durable Object (not Worker Map, not Redis)
- **WebSocket session** — Durable Object (not Worker global)
- **Distributed lock** — Durable Object (not Worker boolean)
- **Feature flag value** — KV (60s TTL) (not Worker Map)
- **Per-request context** — local variable (not module-scope `let`)
- **User session / JWT** — Cookie + D1 (not Worker Map)
- **AI conversation history** — D1 + DO (not Worker array)
- **Tenant config** — KV (60s TTL) (not Worker object)
- **File/blob** — R2 (not Worker Buffer)

## Stateless design checklist (every Worker PR)

- [ ] No `let` or `var` at module scope accumulating state across requests
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

The rule applies to **mutable** state only.

## Durable Objects capabilities

- Per-entity serialized execution (no race conditions)
- Transactional SQLite storage (`this.state.storage`)
- Global singleton per ID (not per-isolate)
- WebSocket hibernation for long-lived connections
- Alarms for scheduled per-entity work

Use DOs without apology. `[[cloudflare-lock-in-is-leverage]]` explicitly endorses deep DO usage.

## Anti-patterns

- `const cache = new Map()` at module top level used as an LRU
- `let currentUser` at module scope "for performance"
- Rate limiter as a Worker-scope counter (broken under multi-isolate deployment)
- "We'll add DOs later when it becomes a problem" — the problem is invisible until prod breaks
- WebSocket session state in Worker memory (evicted = session lost)
- `setInterval` / `setTimeout` at module scope (does not work in CF Workers)

## Cross-links

- `[[cloudflare-lock-in-is-leverage]]` — DOs are the canonical CF stateful primitive
- `[[zod-everywhere]]` — stateless Workers validate all state at every boundary entry
- `[[production-observability-default-on]]` — stateless Workers produce clean traces; stateful ones produce confusing overlapping traces
- `[[fail-fast-build-fail-soft-prod]]` — stateful bugs fail softly in prod (wrong counts, stale caches); detect via observability
- `[[hono-api]]` — Hono middleware context (`c.set` / `c.get`) is request-scoped and safe; module scope is not
