---
name: "production-observability-default-on"
priority: 1
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

Every Worker ships telemetry from line 1. There is no "add observability later" phase —
later never arrives, and when something breaks you have no trace. Retrofitting PostHog,
OTLP spans, and Sentry to an existing Worker costs 4-8× more than the initial scaffold
because you are editing around live traffic, not a blank canvas.

Observability is not a feature. It is the minimum viable Worker.

## The four instrumentation pillars (all four, every Worker)

### 1. Structured JSON logging

Every `console.log` is a structured object, never a bare string. The log shape:

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

// Usage
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

Log strings are invisible to CF Workers Logpush and Axiom filters — structured JSON is the
only format that survives the pipeline. Every `console.error` call in a production handler
is a structured log with `level: 'error'`, never a bare `Error.message`.

### 2. PostHog capture on every significant action

"Significant action" = any state change, any external call, any feature flag evaluation.

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
PostHog calls in the hot path add 30-80ms latency.

### 3. OTLP trace spans via workers-tracing-otlp

Add the `workers-tracing-otlp` package to every new Worker. Configure via `wrangler.toml`
observability block:

```toml
[observability]
enabled = true
head_sampling_rate = 1

[[observability.logs]]
enabled = true
```

For custom spans (DB calls, AI calls, external fetches):

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('my-worker', '1.0.0');

// Wrap every D1 query and external fetch in a span
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

Every AI Gateway call, every D1 query, every R2 operation gets a span. These are the
exact calls that cause latency spikes; without spans you cannot distinguish a slow D1
query from a slow AI call.

### 4. Sentry for unhandled exceptions

```typescript
import * as Sentry from '@sentry/cloudflare';

// wrangler.toml entry:
// [vars]
// SENTRY_DSN = "https://..."

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

The `withSentry` wrapper catches every unhandled exception with full request context.
Without it, `500 Internal Server Error` responses are invisible in CF dashboard.

## Scaffold checklist (every new Worker)

Before the first commit:

- [ ] `posthog-node` in `package.json`
- [ ] `@sentry/cloudflare` in `package.json`
- [ ] `workers-tracing-otlp` in `package.json` (or equivalent OTLP package)
- [ ] `POSTHOG_API_KEY`, `SENTRY_DSN` in `wrangler.toml` `[vars]` + secret provisioning
- [ ] Structured JSON logger helper in `worker/lib/telemetry.ts`
- [ ] `withSentry` wrapper around exported handler
- [ ] At least one `posthog.capture` in the main request path
- [ ] `[observability] enabled = true` in `wrangler.toml`

## Observability tier routing

Per the global stack rules (`CLAUDE.md` § Observability):

- **Solo SaaS / nonprofit / portfolio** → PostHog + Workers Tracing OTLP (2 vendors)
- **Enterprise / regulated / multi-team** → add `@sentry/cloudflare` v9 + GA4/GTM + Axiom
- **LLM-heavy (>10k AI calls/month)** → add AI Gateway to either tier

Do NOT add all four tiers to a solo project "just in case." Vendor proliferation is its own
observability problem.

## Anti-patterns

- `console.log('User created: ' + userId)` — bare string, not queryable
- `await posthog.capture(...)` in hot path — adds latency, use `ctx.waitUntil`
- PostHog only on "important" routes — every route is important once it breaks
- Adding Sentry after the first production incident — too late, the trace is gone
- `head_sampling_rate = 0.1` on a low-traffic Worker — sample at 1.0 until you have data
- Skipping spans on D1/AI calls — those are the only calls slow enough to matter

## Drift detection

If a Worker route file (`src/worker/routes/**`) has no `posthog.capture`, no structured
log with `traceId`, or no Sentry wrapper on the handler export — that is observability
drift. Fix in the same turn per `[[drift-detection]]`.

## Cross-links

- `[[verification-loop]]` — prod verification requires observable prod (you need the logs to verify)
- `[[feature-flags]]` — every flag evaluation emits a PostHog capture; blind flag evals are unmonitorable
- `[[zod-everywhere]]` — Zod parse failures in prod handlers emit structured error logs, never crashes
- `[[fail-fast-build-fail-soft-prod]]` — observability is how "fail soft" is detectable; without it, degraded = silent
- `[[state-is-the-enemy]]` — stateless Workers are easier to trace because there is no ambient state to confuse the trace
