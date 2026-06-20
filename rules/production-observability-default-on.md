---
name: "production-observability-default-on"
priority: 2
pack: "core"
triggers:
  - "new worker"
  - "new route"
  - "scaffold"
  - "observability"
  - "telemetry"
  - "logging"
  - "posthog"
  - "sentry"
  - "tracing"
paths:
  - "src/worker/**"
  - "workers/**"
  - "apps/*/src/worker/**"
  - "wrangler.toml"
---

# Production Observability Default-On

Every Worker ships telemetry from line 1. Retrofitting PostHog, OTLP spans, and Sentry to a live Worker costs 4-8× more than the initial scaffold.

## The four pillars (all four, every Worker)

### 1. Structured JSON logging

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

- Log strings are invisible to CF Workers Logpush and Axiom filters — structured JSON is the only format that survives the pipeline.
- Every `console.error` in a production handler is a structured log with `level: 'error'`, never a bare `Error.message`.

### 2. PostHog capture on every significant action

**Significant action** = any state change, any external call, any feature flag evaluation.

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

- Use `ctx.waitUntil()` for every PostHog call — never `await` it in the hot path.
- PostHog calls in the hot path add 30-80ms latency.

### 3. OTLP trace spans via workers-tracing-otlp

Add `workers-tracing-otlp` to every new Worker. Configure `wrangler.toml`:

```toml
[observability]
enabled = true
head_sampling_rate = 1

[[observability.logs]]
enabled = true
```

Wrap every D1 query, AI call, and external fetch in a span:

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

- Every AI Gateway call, every D1 query, every R2 operation gets a span — these are the exact calls that cause latency spikes.

### 4. Sentry for unhandled exceptions

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

- `withSentry` catches every unhandled exception with full request context.
- Without it, `500 Internal Server Error` responses are invisible in CF dashboard.

## Scaffold checklist (every new Worker)

- [ ] `posthog-node` in `package.json`
- [ ] `@sentry/cloudflare` in `package.json`
- [ ] `workers-tracing-otlp` in `package.json` (or equivalent OTLP package)
- [ ] `POSTHOG_API_KEY`, `SENTRY_DSN` in `wrangler.toml` `[vars]` + secret provisioning
- [ ] Structured JSON logger helper in `worker/lib/telemetry.ts`
- [ ] `withSentry` wrapper around exported handler
- [ ] At least one `posthog.capture` in the main request path
- [ ] `[observability] enabled = true` in `wrangler.toml`

## Observability tier routing

Per `CLAUDE.md` § Observability:

- **Solo SaaS / nonprofit / portfolio** — PostHog + Workers Tracing OTLP (2 vendors max)
- **Enterprise / regulated / multi-team** — add `@sentry/cloudflare` v9 + GA4/GTM + Axiom
- **LLM-heavy (>10k AI calls/month)** — add AI Gateway to either tier

Do NOT add all four tiers to a solo project. Vendor proliferation is its own observability problem.

## Anti-patterns

- `console.log('User created: ' + userId)` — bare string, not queryable
- `await posthog.capture(...)` in hot path — use `ctx.waitUntil`
- PostHog only on "important" routes — every route matters once it breaks
- Adding Sentry after the first production incident — the trace is already gone
- `head_sampling_rate = 0.1` on a low-traffic Worker — sample at 1.0 until you have data
- Skipping spans on D1/AI calls — those are the only calls slow enough to matter

## Drift detection

If a Worker route file (`src/worker/routes/**`) has no `posthog.capture`, no structured log with `traceId`, or no Sentry wrapper — that is observability drift. Fix in the same turn per `[[drift-detection]]`.

## Cross-links

- `[[verification-loop]]` — prod verification requires observable prod
- `[[feature-flags]]` — every flag evaluation emits a PostHog capture
- `[[zod-everywhere]]` — Zod parse failures emit structured error logs, never crashes
- `[[fail-fast-build-fail-soft-prod]]` — observability is how "fail soft" is detectable
- `[[state-is-the-enemy]]` — stateless Workers are easier to trace
