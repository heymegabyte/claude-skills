# Hardware-Aware Programming — implementation reference

Sourced on demand by rules/hardware-aware-programming.md.

---

## D1 reads behind KV cache

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
  await kv.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
  return value;
}

// usage
const user = await cachedD1(
  env.KV,
  `user:${userId}`,
  60,
  () => db.select().from(users).where(eq(users.id, userId)).get(),
);
```

---

## PostHog events batched in `ctx.waitUntil()`

```ts
export function trackEvent(ctx: ExecutionContext, event: string, props: Record<string, unknown>) {
  ctx.waitUntil(
    fetch('https://us.i.posthog.com/capture/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: env.POSTHOG_API_KEY, event, properties: props, timestamp: new Date().toISOString() }),
    }),
  );
}
```

---

## R2 reads behind CF Cache API

```ts
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
  c.executionCtx.waitUntil(caches.default.put(cacheKey, response.clone()));
  return response;
});
```

---

## Per-request fetch deduplication

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

app.use('*', async (c, next) => {
  c.set('fetch', createDedupFetch());
  await next();
});
```

---

## AI Gateway call deduplication by hash

```ts
// worker/lib/ai-gateway.ts
import { createHash } from 'node:crypto';
const requestCache = new Map<string, Promise<unknown>>();

export async function dedupAiCall<T>(env: Env, model: string, messages: unknown[]): Promise<T> {
  const hash = createHash('sha256').update(model + JSON.stringify(messages)).digest('hex');
  if (requestCache.has(hash)) return requestCache.get(hash) as Promise<T>;
  const p = env.AI.run(model, { messages }) as Promise<T>;
  requestCache.set(hash, p);
  p.finally(() => requestCache.delete(hash));
  return p;
}
```
