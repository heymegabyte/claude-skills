---
name: "structured-logging"
priority: 2
pack: "core"
triggers:
  - "log"
  - "logging"
  - "console.log"
  - "traceId"
  - "structured"
  - "observability"
  - "OTLP"
paths:
  - "src/worker/**"
  - "apps/*/src/**"
  - "worker/**"
  - "*.worker.ts"
---

# Structured Logging

Every log line is machine-parseable JSON. Freeform `console.log("some message")` is a build-fail-level drift violation per `drift-detection`.

## Required fields

```ts
{
  level: "trace" | "debug" | "info" | "warn" | "error" | "fatal",
  ts: number,          // Unix ms — Date.now()
  msg: string,         // human-readable description
  traceId: string,     // crypto.randomUUID() from middleware, propagated via c.var.traceId
  requestId: string,   // cf.request.id (Cloudflare) or new UUID if unavailable
  workerId: string,    // from env.WORKER_ID or wrangler.toml [vars].WORKER_ID
  env: string,         // "production" | "preview" | "development"
}
```

Optional fields (include when present):

```ts
{
  durationMs?: number,
  error?: { message: string, stack?: string, code?: string },
  userId?: string,     // only after redactPii() — never raw email/phone
  path?: string,
  status?: number,
  method?: string,
}
```

## Log levels

- **trace** — Sentry `debug`; hot-path breadcrumbs, never on by default in prod
- **debug** — Sentry `debug`; dev-only diagnostics, flag-gated off in production
- **info** — Sentry `info`; normal operations: requests, jobs, flag evaluations
- **warn** — Sentry `warning`; recoverable issues: retries, fallback paths, cache misses
- **error** — Sentry `error`; caught exceptions with full stack + context
- **fatal** — Sentry `fatal`; unrecoverable: process death, data corruption, panic

Production floor is `info`. Set `LOG_LEVEL=debug` env var to lower for a deploy.

## Worker-side implementation

- Use `console.log(JSON.stringify({...}))` — never `console.info`/`console.warn` for structured entries (they bypass OTLP aggregation in some collector versions).
- Logger lives at `src/worker/lib/logger.ts`; all handlers import `log()` from it.
- `error` and `fatal` levels MUST forward to `Sentry.captureException`.
- Spread the required `LogFields` interface across every call site — never construct the shape ad-hoc.

See `reference/structured-logging.md` for the full typed `log()` implementation.

## Per-request traceId via Hono middleware

- Register `traceMiddleware` before all routes: `app.use("*", traceMiddleware)`.
- Middleware propagates incoming `x-trace-id` header or mints a fresh UUID.
- Access downstream: `const traceId = c.get("traceId")`.

See `reference/structured-logging.md` for the full middleware implementation.

## PostHog event capture

- Every significant PostHog event MUST include `traceId` and `requestId` for cross-correlation with logs and Sentry traces.

See `reference/structured-logging.md` for the capture call pattern.

## PII handling

- Never log raw PII. Pass through `redactPii()` per `[[pii-handling-discipline]]`.
- `redactPii(s)` returns `"***"` for email/phone patterns, masked ID otherwise.

See `reference/structured-logging.md` for good/bad examples.

## Anti-patterns (build-fail drift)

- `console.log("message")` — no structure, no traceId, lost in OTLP
- `console.log(JSON.stringify({ msg }))` — missing required fields
- `console.error(err)` — not captured by OTLP as structured JSON
- Logging raw `req.body` or `user.email` — PII leak
- Logging in a hot loop without sampling — use `if (Math.random() < 0.01)` gate for trace-level hot paths
- Different log shapes per handler — define `LogFields` type, derive all loggers from it

## Workers Tracing OTLP field mapping

- **`level`** — `SeverityText` / `SeverityNumber`
- **`ts`** — `TimeUnixNano`
- **`msg`** — `Body`
- **remaining fields** — `Attributes`

No additional SDK configuration required — the Workers runtime handles export on request completion.

## Sentry severity mapping (numeric)

- **trace** — 5
- **debug** — 7
- **info** — 9
- **warn** — 13
- **error** — 17
- **fatal** — 21

## See also

- `production-observability-default-on` — observability must be on by default, not opt-in
- `pii-handling-discipline` — redaction requirements
- `contract-first-ai` — structured shapes for AI output logs
- `drift-detection` — freeform console.log = drift, fix in-turn
