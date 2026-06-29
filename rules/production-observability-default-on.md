---
last_reviewed: 2026-06-29
superseded_by: null
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

Every Worker ships telemetry from line 1. Retrofitting PostHog, OTLP spans, and Sentry to a live Worker costs 4–8× more than the initial scaffold.

## The four pillars (all four, every Worker)

### 1. Structured JSON logging

- Every `console.log` MUST be a structured JSON object, never a bare string.
- Every `console.error` in a production handler uses `level: 'error'` with a `traceId` field — never a bare `Error.message`.
- Log strings are invisible to CF Workers Logpush and Axiom filters; structured JSON is the only format that survives the pipeline.
- Required fields: `level`, `traceId` (from incoming header or `crypto.randomUUID()`), `workerId` (wrangler.toml `name`), `message`.

See `reference/production-observability-default-on.md` for the full `WorkerLog` interface and example.

### 2. PostHog capture on every significant action

- **Significant action** = any state change, any external call, any feature flag evaluation.
- Every capture MUST use `ctx.waitUntil()` — never `await` in the hot path (adds 30–80 ms latency).
- `flushAt: 1` and `flushInterval: 0` are required in Workers (no persistent process to flush).

See `reference/production-observability-default-on.md` for the `initPosthog` helper and capture pattern.

### 3. OTLP trace spans via workers-tracing-otlp

- Add `workers-tracing-otlp` to every new Worker.
- Set `[observability] enabled = true` and `head_sampling_rate = 1` in `wrangler.toml`.
- Every D1 query, AI Gateway call, and R2 operation MUST be wrapped in a span — these are the exact calls that cause latency spikes.

See `reference/production-observability-default-on.md` for the `wrangler.toml` snippet and span wrapping pattern.

### 4. Sentry for unhandled exceptions

- Wrap every exported handler with `Sentry.withSentry` from `@sentry/cloudflare`.
- Without it, `500 Internal Server Error` responses are invisible in CF dashboard.

See `reference/production-observability-default-on.md` for the `withSentry` wrapper.

---

## Scaffold checklist (every new Worker)

- [ ] `posthog-node` in `package.json`
- [ ] `@sentry/cloudflare` in `package.json`
- [ ] `workers-tracing-otlp` in `package.json` (or equivalent OTLP package)
- [ ] `POSTHOG_API_KEY`, `SENTRY_DSN` in `wrangler.toml` `[vars]` + secret provisioning
- [ ] Structured JSON logger helper in `worker/lib/telemetry.ts`
- [ ] `withSentry` wrapper around exported handler
- [ ] At least one `posthog.capture` in the main request path
- [ ] `[observability] enabled = true` in `wrangler.toml`

---

## Observability tier routing

Per `CLAUDE.md` § Observability:

- **Solo SaaS / nonprofit / portfolio** — PostHog + Workers Tracing OTLP (2 vendors max)
- **Enterprise / regulated / multi-team** — add `@sentry/cloudflare` v9 + GA4/GTM + Axiom
- **LLM-heavy (>10k AI calls/month)** — add AI Gateway to either tier

Do NOT add all four tiers to a solo project. Vendor proliferation is its own observability problem.

---

## Anti-patterns

- `console.log('User created: ' + userId)` — bare string, not queryable
- `await posthog.capture(...)` in hot path — use `ctx.waitUntil`
- PostHog only on "important" routes — every route matters once it breaks
- Adding Sentry after the first production incident — the trace is already gone
- `head_sampling_rate = 0.1` on a low-traffic Worker — sample at 1.0 until you have data
- Skipping spans on D1/AI calls — those are the only calls slow enough to matter

---

## Drift detection

If a Worker route file (`src/worker/routes/**`) has no `posthog.capture`, no structured log with `traceId`, or no Sentry wrapper — that is observability drift. Fix in the same turn per `[[drift-detection]]`.

---

## Cross-links

- `[[verification-loop]]` — prod verification requires observable prod
- `[[feature-flags]]` — every flag evaluation emits a PostHog capture
- `[[zod-everywhere]]` — Zod parse failures emit structured error logs, never crashes
- `[[fail-fast-build-fail-soft-prod]]` — observability is how "fail soft" is detectable
- `[[state-is-the-enemy]]` — stateless Workers are easier to trace
