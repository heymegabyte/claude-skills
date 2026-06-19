---
name: "cf-do-rate-limiter"
priority: 2
pack: "architecture"
triggers:
  - "rate limit"
  - "rate limiter"
  - "sliding window"
  - "throttle"
  - "too many requests"
  - "429"
  - "abuse prevention"
  - "API rate"
  - "per-user limit"
paths:
  - "**/wrangler.{toml,jsonc}"
  - "**/middleware*"
  - "**/durable-objects/**"
  - "**/rate-limit*"
---

# CF DO Sliding-Window Rate Limiter

Production-grade per-user/per-IP rate limiter using Durable Objects. Each user gets their own DO shard — no global lock contention. Sliding window algorithm smooths burst spikes better than fixed windows. Cache API short-circuits blocked responses without hitting the DO.

Source: `OultimoCoder/cloudflare-planetscale-hono-boilerplate` (real implementation, not pseudocode). See `[[cloudflare-lock-in-is-leverage]]`.

## Algorithm

```
rate = (prevCount × (interval − distanceFromLastWindow)) / interval + currentCount
blocked = rate ≥ limit
```

Sliding window interpolates between the previous and current fixed windows, weighted by how far into the current window you are. This prevents the "double burst" problem of fixed windows (100 req at 11:59 + 100 req at 12:01 = 200 in 2 minutes with a 60s fixed window).

Composite storage key: `scope|key|limit|interval|windowTimestamp`

## wrangler.toml

```toml
[[durable_objects.bindings]]
name = "RATE_LIMITER"
class_name = "RateLimiter"

[[migrations]]
tag = "v1"
new_classes = ["RateLimiter"]
```

## Full DO class

```ts
// src/durable-objects/rate-limiter.do.ts
import dayjs from 'dayjs';
import { Context, Hono } from 'hono';
import { z, ZodError } from 'zod';
import { fromError } from 'zod-validation-error';

interface Config {
  scope: string;    // endpoint path — e.g. '/api/v1/send-email'
  key: string;      // user sub or IP
  limit: number;    // max requests per interval
  interval: number; // window size in seconds
}

const configSchema = z.object({
  scope: z.string(),
  key: z.string(),
  limit: z.number().int().positive(),
  interval: z.number().int().positive(),
});

export class RateLimiter {
  state: DurableObjectState;
  env: Env;
  app: Hono = new Hono();

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;

    this.app.post('/', async (c) => {
      await this.setAlarm();

      let config: Config;
      try {
        config = configSchema.parse(await c.req.json());
      } catch (err) {
        const msg = err instanceof ZodError ? fromError(err).toString() : String(err);
        return c.json({ error: msg }, 400);
      }

      const rate = await this.calculateRate(config);
      const blocked = this.isRateLimited(rate, config.limit);
      const headers = this.getHeaders(blocked, config);
      const remaining = blocked ? 0 : Math.max(0, Math.floor(config.limit - rate - 1));

      return c.json({ blocked, remaining, expires: headers.expires }, 200, headers);
    });
  }

  // Alarm fires every 6h — purge keys older than 2 intervals to bound storage growth
  async alarm() {
    const values = await this.state.storage.list<number>();
    const now = this.nowUnix();
    for (const [key] of values) {
      const parts = key.split('|');
      const interval = parseInt(parts[3]);
      const timestamp = parseInt(parts[4]);
      const currentWindow = Math.floor(now / interval);
      if (timestamp < currentWindow - 2) {
        await this.state.storage.delete(key);
      }
    }
  }

  async setAlarm() {
    const alarm = await this.state.storage.getAlarm();
    if (!alarm) {
      await this.state.storage.setAlarm(dayjs().add(6, 'hours').toDate());
    }
  }

  nowUnix(): number {
    return dayjs().unix();
  }

  async calculateRate(config: Config): Promise<number> {
    const keyPrefix = `${config.scope}|${config.key}|${config.limit}|${config.interval}`;
    const now = this.nowUnix();
    const currentWindow = Math.floor(now / config.interval);
    const distanceFromLastWindow = now % config.interval;

    const currentKey = `${keyPrefix}|${currentWindow}`;
    const previousKey = `${keyPrefix}|${currentWindow - 1}`;

    const currentCount = await this.getCount(currentKey);
    const previousCount = await this.getCount(previousKey);

    // Sliding window formula
    const rate =
      (previousCount * (config.interval - distanceFromLastWindow)) / config.interval +
      currentCount;

    if (!this.isRateLimited(rate, config.limit)) {
      await this.state.storage.put(currentKey, currentCount + 1);
    }

    return rate;
  }

  async getCount(key: string): Promise<number> {
    return ((await this.state.storage.get<number>(key)) ?? 0);
  }

  isRateLimited(rate: number, limit: number): boolean {
    return rate >= limit;
  }

  getHeaders(blocked: boolean, config: Config) {
    const expirySeconds = this.expirySeconds(config);
    const retryAfter = dayjs().add(expirySeconds, 'seconds').toString();
    const headers: Record<string, string> = { expires: retryAfter };
    if (blocked) {
      headers['cache-control'] =
        `public, max-age=${expirySeconds}, s-maxage=${expirySeconds}, must-revalidate`;
    }
    return headers;
  }

  expirySeconds(config: Config): number {
    const now = this.nowUnix();
    const currentWindowStart = Math.floor(now / config.interval);
    return (currentWindowStart + 1) * config.interval - now;
  }

  async fetch(request: Request): Promise<Response> {
    return this.app.fetch(request);
  }
}
```

## Hono middleware

```ts
// src/middlewares/rate-limiter.ts
import dayjs from 'dayjs';
import { type MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

const FAKE_DOMAIN = 'http://rate-limiter.internal/';

function getRateLimitKey(c: any): string {
  // Prefer authenticated user sub; fall back to CF-connecting-ip
  const userSub = c.get('jwtPayload')?.sub;
  if (userSub) return userSub;
  return c.req.raw.headers.get('cf-connecting-ip') ?? 'unknown';
}

function getCacheKey(endpoint: string, key: string, limit: number, interval: number): string {
  return `${FAKE_DOMAIN}${endpoint}/${key}/${limit}/${interval}`;
}

/**
 * @param interval - window size in seconds (e.g. 60)
 * @param limit    - max requests per window (e.g. 10)
 *
 * Usage:
 *   route.post('/send-email', auth(), rateLimit(120, 1), handler)  // 1 req per 2 min
 *   route.get('/api/search',  auth(), rateLimit(60, 30), handler)  // 30 req per min
 */
export const rateLimit = (interval: number, limit: number): MiddlewareHandler => {
  return async (c, next) => {
    const key = getRateLimitKey(c);
    const endpoint = new URL(c.req.url).pathname;

    // Cache API short-circuit — if this key is blocked, skip the DO entirely
    const cache = await caches.open('rate-limiter');
    const cacheKey = getCacheKey(endpoint, key, limit, interval);
    const cached = await cache.match(cacheKey);

    let res: Response;
    if (cached) {
      res = cached;
    } else {
      // Route to the user's dedicated DO shard
      const id = c.env.RATE_LIMITER.idFromName(key);
      const stub = c.env.RATE_LIMITER.get(id);

      res = await stub.fetch(
        new Request(FAKE_DOMAIN, {
          method: 'POST',
          body: JSON.stringify({ scope: endpoint, key, limit, interval }),
        })
      );
    }

    const body = await res.clone().json<{
      blocked: boolean;
      remaining: number;
      expires: string;
    }>();

    const secondsExpires = dayjs(body.expires).unix() - dayjs().unix();

    // Set standard rate limit headers
    c.header('X-RateLimit-Limit', String(limit));
    c.header('X-RateLimit-Remaining', String(body.remaining));
    c.header('X-RateLimit-Reset', String(secondsExpires));
    c.header('X-RateLimit-Policy', `${limit};w=${interval};comment="Sliding window"`);

    if (body.blocked) {
      // Cache blocked responses — saves DO invocations for repeat offenders
      if (!cached) {
        c.executionCtx.waitUntil(cache.put(cacheKey, res));
      }
      throw new HTTPException(429, { message: 'Too many requests' });
    }

    await next();
  };
};
```

## Wiring into Hono routes

```ts
// src/worker/index.ts
import { Hono } from 'hono';
import { jwtMiddleware } from './middlewares/auth';
import { rateLimit } from './middlewares/rate-limiter';

const app = new Hono<{ Bindings: Env }>();

// 1 request per 2 minutes for email sending (prevent spam)
app.post('/api/send-verification-email',
  jwtMiddleware(),
  rateLimit(120, 1),
  emailController.sendVerification
);

// 30 requests per minute for search
app.get('/api/search',
  jwtMiddleware(),
  rateLimit(60, 30),
  searchController.query
);

// 5 requests per minute for AI generation (cost protection)
app.post('/api/generate',
  jwtMiddleware(),
  rateLimit(60, 5),
  aiController.generate
);

// Public endpoint — rate limit by IP only (no auth middleware)
app.post('/api/contact',
  rateLimit(3600, 3), // 3 per hour
  contactController.submit
);
```

## Bindings type declaration

```ts
// src/bindings.d.ts
export interface Env {
  RATE_LIMITER: DurableObjectNamespace;
  // ... other bindings
}
```

## How the alarm-based cleanup works

```
On every DO fetch:
  → setAlarm() called (no-op if alarm already scheduled)
  → alarm fires 6h later
  → iterates all storage keys
  → parses windowTimestamp from composite key
  → deletes any key where timestamp < currentWindow - 2
  → data older than 2 full intervals is purged

Storage grows at: O(active_users × 2 keys per user)
Two keys: current window + previous window (needed for sliding formula)
Cleanup cap: ≤2 intervals worth of data per DO instance
```

## Composite key anatomy

```
"scope|key|limit|interval|windowTimestamp"
 ↑      ↑    ↑     ↑        ↑
 path   sub  100   60       28645012  (unix_seconds / interval)

Example:
"/api/generate|user-abc123|5|60|28645012"
"/api/generate|user-abc123|5|60|28645011"  ← previous window, used for sliding calc
```

## Gotchas

- **One DO shard per user** — `idFromName(userSub)` means each user has isolated state. If you use `idFromName('global')`, you create a global bottleneck (hot DO)
- **Cache API is per-PoP** — the `caches.open()` short-circuit only caches within a single CF edge location. A user hitting different PoPs will bypass the cache. This is acceptable for rate limiting (slightly lenient across PoPs is better than a global lock)
- **`dayjs` import** — the original boilerplate uses `dayjs`. You can swap for `Date.now()` native math to drop the dependency: `const nowUnix = () => Math.floor(Date.now() / 1000)`
- **Don't use `idFromString(uuid)`** — `idFromName(key)` is stable (same name → same DO always). `idFromString` requires a pre-generated DO ID and doesn't deduplicate on key
- **Storage.put is synchronous in memory but async on disk** — the DO guarantees the put is committed before the response is returned when using `await`

## Cross-links

- `[[cf-agents-do-pattern]]` — same DO patterns; agents use DO for state, rate limiter uses DO for counters
- `[[cf-zero-trust-access]]` — even Access-protected admin routes benefit from rate limiting for service token abuse prevention
- `[[hono-api]]` — middleware composition, `HTTPException` for clean 429 responses
