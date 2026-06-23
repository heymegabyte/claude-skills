# Production Observability Default-On — implementation reference

Sourced on demand by rules/production-observability-default-on.md.

---

## Structured JSON logging — full type and example

Every `console.log` is a structured object, never a bare string.

```typescript
interface WorkerLog {
  level: 'debug' | 'info' | 'warn' | 'error';
  traceId: string;       // from incoming header or crypto.randomUUID()
  workerId: string;      // wrangler.toml `name`
  route?: string;        // matched Hono route pattern
  durationMs?: number;   // time from request start
  message: string;
  [extra: string]: unknown;
}

console.log(JSON.stringify({
  level: 'info',
  traceId,
  workerId: 'my-worker',
  route: '/api/users/:id',
  durationMs: Date.now() - startTime,
  message: 'User fetched',
  userId,
}));
```

Log strings are invisible to CF Workers Logpush and Axiom filters — structured JSON
is the only format that survives the pipeline. Every `console.error` in a production
handler is a structured log with `level: 'error'`, never a bare `Error.message`.

---

## PostHog setup and capture pattern

```typescript
// worker/lib/telemetry.ts
import PostHog from 'posthog-node';

export function initPosthog(env: Env) {
  return new PostHog(env.POSTHOG_API_KEY, {
    host: 'https://us.i.posthog.com',
    flushAt: 1,     // flush immediately in Workers (no persistent process)
    flushInterval: 0,
  });
}

// In every Hono handler that matters:
ctx.waitUntil(
  ph.capture({
    distinctId: userId ?? anonId,
    event: 'api.users.fetch',
    properties: {
      $ip: req.headers.get('CF-Connecting-IP'),
      route: '/api/users/:id',
      durationMs,
      status: 200,
    },
  }).then(() => ph.shutdown())
);
```

Use `ctx.waitUntil()` for every PostHog call — never `await` it in the hot path.
PostHog calls in the hot path add 30–80 ms latency.

---

## OTLP trace span setup

`wrangler.toml` config:

```toml
[observability]
enabled = true
head_sampling_rate = 1

[[observability.logs]]
enabled = true
```

Wrapping a D1 query in a span:

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('my-worker', '1.0.0');

const users = await tracer.startActiveSpan('d1.users.list', async (span) => {
  try {
    const result = await env.DB.prepare('SELECT * FROM users LIMIT ?').bind(50).all();
    span.setAttribute('db.row_count', result.results.length);
    return result.results;
  } catch (e) {
    span.recordException(e as Error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw e;
  } finally {
    span.end();
  }
});
```

Every AI Gateway call, every D1 query, every R2 operation gets a span — these are
the exact calls that cause latency spikes.

---

## Sentry withSentry wrapper

```typescript
import * as Sentry from '@sentry/cloudflare';

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: 'production',
  }),
  {
    fetch(request, env, ctx) {
      return app.fetch(request, env, ctx);
    },
  } satisfies ExportedHandler<Env>
);
```

`withSentry` catches every unhandled exception with full request context.
Without it, `500 Internal Server Error` responses are invisible in CF dashboard.
