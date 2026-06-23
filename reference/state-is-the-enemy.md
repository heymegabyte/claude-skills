# State Is the Enemy — Implementation Reference

Sourced on demand by rules/state-is-the-enemy.md.

---

## Failure mode 1: module-scope mutable variables

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
- Fix: eliminate both. Compute count from D1/KV. Pass user as a local variable.

---

## Failure mode 2: in-memory cache with no isolation guarantee

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

Two concurrent requests populate the cache simultaneously with different values.
After isolate restart, the cache is empty — thundering herd of D1 queries.
After a D1 flag toggle, the stale value is served until eviction (could be hours).

Fix — KV with a 60-second TTL:

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

---

## Failure mode 3: singleton that should be a Durable Object

```typescript
// BUG: per-isolate counter — user hitting 5 isolates gets 5×100 = 500 req/min
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
```

Fix — Durable Object for per-user rate limiting:

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

---

## Immutable module-scope constants (safe pattern)

```typescript
// CORRECT: immutable, stateless, safe at module scope
const ALLOWED_ORIGINS = new Set(['https://app.megabyte.space', 'https://megabyte.space']);
const UserSchema = z.object({ id: z.string(), email: z.string().email() });
const API_VERSION = 'v2';
```

The rule applies to **mutable** state only.
