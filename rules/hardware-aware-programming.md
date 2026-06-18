---
name: "hardware-aware-programming"
priority: 2
pack: "backend"
triggers:
  - "fetch"
  - "d1"
  - "kv"
  - "r2"
  - "waitUntil"
  - "cache"
  - "cold start"
paths:
  - "concern:cloudflare-workers"
  - "concern:hono-stack"
---

# Hardware-Aware Programming

CF Workers run on V8 isolates. Cold-start ~5ms. Every I/O call must justify its existence because there is no free network. The rule is cache-first, batch everything, deduplicate within the request lifecycle.

Three questions before every I/O call:

1. Can this be cached?
2. Can this be batched with adjacent calls in the same request?
3. Can this be deduplicated (same data already fetched this request)?

If you cannot answer "no" to all three, you must implement the optimization before shipping.

## The Rule

- D1 reads sit behind KV (60s TTL) — never hit D1 twice for the same record in one request.
- PostHog events are buffered and flushed via `ctx.waitUntil()` — never `await` analytics in the critical path.
- R2 object reads flow through the CF Cache API — the CDN edge is your first cache layer.
- AI Gateway calls are deduplicated by request hash — identical prompts in the same request get one upstream call.
- `fetch()` to external APIs uses a per-request `Map` as a dedup registry — same URL + body = return the in-flight promise.

## Correct Pattern

### D1 reads behind KV cache

```ts
// worker/lib/kv-cache.ts
export async function cachedD1<T>(
  kv: KVNamespace,
  key: string,
  ttlSeconds: number,
  fallback: () => Promise<T>,
): Promise<T> {
  const hit = await kv.get<T>(key, 'json');
  if (hit !== null) return hit;
  const value = await fallback();
  // fire-and-forget write so fallback latency is not doubled
  await kv.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
  return value;
}

// usage in a route handler
const user = await cachedD1(
  env.KV,
  `user:${userId}`,
  60,
  () => db.select().from(users).where(eq(users.id, userId)).get(),
);
```

### PostHog events batched in ctx.waitUntil()

```ts
// worker/lib/analytics.ts
export function trackEvent(
  ctx: ExecutionContext,
  event: string,
  props: Record<string, unknown>,
) {
  // never await — analytics cannot block the response
  ctx.waitUntil(
    fetch('https://us.i.posthog.com/capture/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: env.POSTHOG_API_KEY,
        event,
        properties: props,
        timestamp: new Date().toISOString(),
      }),
    }),
  );
}
```

### R2 reads behind CF Cache API

```ts
// worker/routes/assets.ts
app.get('/assets/:key', async (c) => {
  const cacheKey = new Request(c.req.url);
  const cached = await caches.default.match(cacheKey);
  if (cached) return cached;

  const obj = await c.env.ASSETS.get(c.req.param('key'));
  if (!obj) return c.notFound();

  const response = new Response(obj.body, {
    headers: {
      'Content-Type': obj.httpMetadata?.contentType ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });

  // populate edge cache for subsequent requests
  c.executionCtx.waitUntil(caches.default.put(cacheKey, response.clone()));
  return response;
});
```

### Per-request fetch deduplication

```ts
// worker/lib/dedup-fetch.ts
export function createDedupFetch() {
  const inflight = new Map<string, Promise<Response>>();

  return function dedupFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    const key = `${typeof input === 'string' ? input : input.url}:${JSON.stringify(init?.body ?? '')}`;
    if (inflight.has(key)) return inflight.get(key)!;
    const p = fetch(input, init).finally(() => inflight.delete(key));
    inflight.set(key, p);
    return p;
  };
}

// instantiate once per request in middleware, attach to context
app.use('*', async (c, next) => {
  c.set('fetch', createDedupFetch());
  await next();
});
```

### AI Gateway call deduplication by hash

```ts
// worker/lib/ai-gateway.ts
import { createHash } from 'node:crypto'; // available in Workers via the CF compat flag

const requestCache = new Map<string, Promise<unknown>>();

export async function dedupAiCall<T>(
  env: Env,
  model: string,
  messages: unknown[],
): Promise<T> {
  const hash = createHash('sha256')
    .update(model + JSON.stringify(messages))
    .digest('hex');

  if (requestCache.has(hash)) return requestCache.get(hash) as Promise<T>;

  const p = env.AI.run(model, { messages }) as Promise<T>;
  requestCache.set(hash, p);
  p.finally(() => requestCache.delete(hash));
  return p;
}
```

## Anti-Pattern

### Hitting D1 without a cache layer

```ts
// BAD — D1 query on every request with no caching
app.get('/profile/:id', async (c) => {
  // this executes a SQLite read on every single request
  const user = await db.select().from(users).where(eq(users.id, c.req.param('id'))).get();
  return c.json(user);
});
```

### Awaiting analytics in the hot path

```ts
// BAD — analytics blocks the response; adds 50-200ms to every P99
app.post('/submit', async (c) => {
  const result = await processForm(c);
  await fetch('https://us.i.posthog.com/capture/', { ... }); // blocks response
  return c.json(result);
});
```

### Fetching the same URL twice in one handler

```ts
// BAD — two identical fetch() calls, two round trips, two billing units
const profile = await fetch(`https://api.example.com/user/${id}`).then(r => r.json());
const perms   = await fetch(`https://api.example.com/user/${id}`).then(r => r.json());
// should be one call; pipe through dedupFetch or restructure
```

## Practical Checklist

- Every `db.select()` call: is a KV key assigned? If no, add one before merging.
- Every PostHog/analytics call: wrapped in `ctx.waitUntil()`, never `await`-ed at top level.
- Every `env.BUCKET.get()` call: CF Cache API checked first.
- Every external `fetch()` in a request handler: routed through `dedupFetch`.
- Every `env.AI.run()` call: hash-deduplicated if called more than once per request lifecycle.
- D1 batch API (`db.batch([])`) used for any handler that issues ≥2 writes — never individual awaited inserts.
- KV TTLs chosen by data freshness, not by convenience: user profiles 60s, config 300s, static catalog 3600s.
- No `await` on non-critical post-response work — that work belongs in `ctx.waitUntil()`.

## Cold-start budget

- Isolate initialization cost to module-level (`const db = drizzle(env.DB)`) — not per-request constructors.
- Import only what the route needs; large SDK imports add to parse time on cold start.
- Use `wrangler types` bindings — avoid the overhead of runtime type coercion on every binding access.
- CPU limit on free tier is 10ms; paid default 50ms. A single uncached D1 read is ~8ms. Plan accordingly.

## See

- [[fetch-defaults]] — default headers, retry policy, timeout budget for external fetch calls
- [[prompt-cache]] — AI Gateway + Workers AI prompt caching to eliminate redundant token spend
- [[cloudflare-lock-in-is-leverage]] — why CF primitives (KV, R2, Cache API) are the feature, not the risk
- [[hono-api]] — `ctx.waitUntil()`, D1 batch API, and R2 lifecycle patterns in the Hono context
