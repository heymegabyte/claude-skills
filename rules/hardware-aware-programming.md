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

CF Workers run on V8 isolates. Cold-start ~5ms. Every I/O call must justify its existence.

Three questions before every I/O call — if you cannot answer "no" to all three, implement the optimization before shipping:

1. Can this be cached?
2. Can this be batched with adjacent calls in the same request?
3. Can this be deduplicated (same data already fetched this request)?

## Rules

- D1 reads sit behind KV (60s TTL) — never hit D1 twice for the same record in one request.
- PostHog events buffered and flushed via `ctx.waitUntil()` — never `await` analytics in the critical path.
- R2 object reads flow through the CF Cache API — CDN edge is the first cache layer.
- AI Gateway calls deduplicated by request hash — identical prompts in the same request get one upstream call.
- `fetch()` to external APIs uses a per-request `Map` as a dedup registry — same URL + body returns the in-flight promise.

## Correct patterns

- `cachedD1<T>(kv, key, ttlSeconds, fallback)` — KV get-or-fallback with `expirationTtl`. Place in `worker/lib/kv-cache.ts`.
- `trackEvent(ctx, event, props)` — wraps PostHog capture in `ctx.waitUntil(fetch(...))`. Never top-level `await`.
- R2 handler: check `caches.default.match(cacheKey)` first; on miss, set `Cache-Control: public, max-age=31536000, immutable` and `waitUntil(caches.default.put(...))`.
- `createDedupFetch()` — returns a closure over a per-request `Map<string, Promise<Response>>`; register as Hono middleware. Place in `worker/lib/dedup-fetch.ts`.
- `dedupAiCall<T>(env, model, messages)` — SHA-256 hash of `model + JSON.stringify(messages)` as dedup key. Place in `worker/lib/ai-gateway.ts`.

See `reference/hardware-aware-programming.md` for all implementations.

## Anti-patterns

- `db.select()` on every request with no KV cache layer.
- `await fetch('https://us.i.posthog.com/capture/', ...)` in the hot path — adds 50–200ms to every P99.
- Two identical `fetch()` calls to the same URL in one handler — two round trips, two billing units.

## Checklist

- Every `db.select()`: KV key assigned. If not, add one before merging.
- Every PostHog/analytics call: wrapped in `ctx.waitUntil()`, never top-level `await`.
- Every `env.BUCKET.get()`: CF Cache API checked first.
- Every external `fetch()` in a request handler: routed through `dedupFetch`.
- Every `env.AI.run()`: hash-deduplicated if called more than once per request lifecycle.
- `db.batch([])` used for any handler issuing ≥2 writes — never individual awaited inserts.
- KV TTLs by data freshness: user profiles 60s, config 300s, static catalog 3600s.
- No `await` on non-critical post-response work — use `ctx.waitUntil()`.

## Cold-start budget

- Isolate initialization to module-level (`const db = drizzle(env.DB)`) — not per-request constructors.
- Import only what the route needs; large SDK imports add parse time on cold start.
- Use `wrangler types` bindings — avoid runtime type coercion overhead on every binding access.
- CPU limit: free tier 10ms, paid default 50ms. A single uncached D1 read is ~8ms. Plan accordingly.

## See

- [[fetch-defaults]] — default headers, retry policy, timeout budget for external fetch calls
- [[prompt-cache]] — AI Gateway + Workers AI prompt caching to eliminate redundant token spend
- [[cloudflare-lock-in-is-leverage]] — why CF primitives (KV, R2, Cache API) are the feature, not the risk
- [[hono-api]] — `ctx.waitUntil()`, D1 batch API, and R2 lifecycle patterns in the Hono context
