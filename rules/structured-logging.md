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

Workers Tracing OTLP captures `console.log` output as structured JSON when the payload is valid JSON. Use `console.log(JSON.stringify({...}))` — never `console.info`/`console.warn` for structured entries (they bypass OTLP aggregation in some collector versions).

```ts
// src/worker/lib/logger.ts
import * as Sentry from "@sentry/cloudflare";

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

interface LogFields {
  traceId: string;
  requestId: string;
  workerId: string;
  env: string;
  [key: string]: unknown;
}

export function log(level: LogLevel, msg: string, fields: LogFields, err?: unknown) {
  const entry = {
    level,
    ts: Date.now(),
    msg,
    ...fields,
    ...(err instanceof Error
      ? { error: { message: err.message, stack: err.stack, code: (err as any).code } }
      : {}),
  };
  console.log(JSON.stringify(entry));
  if (level === "error" || level === "fatal") {
    Sentry.captureException(err ?? new Error(msg), {
      tags: { traceId: fields.traceId, workerId: fields.workerId },
      extra: entry,
    });
  }
}
```

## Per-request traceId via Hono middleware

```ts
// src/worker/middleware/trace.ts
import { createMiddleware } from "hono/factory";

export const traceMiddleware = createMiddleware(async (c, next) => {
  const traceId = c.req.header("x-trace-id") ?? crypto.randomUUID();
  const requestId = (c.req.raw as any).cf?.requestId ?? crypto.randomUUID();
  c.set("traceId", traceId);
  c.set("requestId", requestId);
  c.res.headers.set("x-trace-id", traceId);
  await next();
});
```

Register before all routes: `app.use("*", traceMiddleware);`

Access downstream: `const traceId = c.get("traceId");`

## PostHog event capture

Every significant action emitted to PostHog MUST include `traceId` for cross-correlation with logs and Sentry traces:

```ts
posthog.capture({
  distinctId: userId,
  event: "payment.completed",
  properties: { traceId, requestId, amount, currency },
});
```

## PII handling

Never log raw PII. Pass through `redactPii()` per `[[pii-handling-discipline]]`:

```ts
// BAD
log("info", "user signed up", { ...base, email: user.email });

// GOOD
log("info", "user signed up", { ...base, email: redactPii(user.email) });
```

`redactPii(s)` returns `"***"` for email/phone patterns, masked ID otherwise.

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
