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

Every log line MUST include at minimum:

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

Optional fields included when present:

```ts
{
  durationMs?: number, // wall-clock time for the operation being logged
  error?: {
    message: string,
    stack?: string,
    code?: string,
  },
  userId?: string,     // only after redactPii() — never raw email/phone
  path?: string,       // HTTP path
  status?: number,     // HTTP status code
  method?: string,     // HTTP method
}
```

## Log levels (Sentry severity mapping)

| Level  | Sentry severity | Use case                                                    |
|--------|----------------|-------------------------------------------------------------|
| trace  | debug          | Hot-path breadcrumbs, never in prod by default              |
| debug  | debug          | Dev-only diagnostics, flag-gated off in production          |
| info   | info           | Normal operations: requests, jobs, flag evaluations         |
| warn   | warning        | Recoverable issues: retries, fallback paths, cache misses   |
| error  | error          | Caught exceptions with full stack + context                 |
| fatal  | fatal          | Unrecoverable: process death, data corruption, panic        |

Production floor is `info`. Set `LOG_LEVEL=debug` env var to lower for a deploy.

## Worker-side implementation

Workers Tracing OTLP captures `console.log` output as structured JSON automatically when the payload is valid JSON. Use `console.log(JSON.stringify({...}))` — never `console.info`/`console.warn` for structured entries (they are captured but bypass OTLP aggregation in some collector versions).

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

export function log(
  level: LogLevel,
  msg: string,
  fields: LogFields,
  err?: unknown,
) {
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

Register before all routes:
```ts
app.use("*", traceMiddleware);
```

Access downstream:
```ts
const traceId = c.get("traceId");
const requestId = c.get("requestId");
```

## PostHog event capture

Every significant action emitted to PostHog MUST include `traceId` so events can be correlated with logs and Sentry traces:

```ts
posthog.capture({
  distinctId: userId,
  event: "payment.completed",
  properties: {
    traceId,
    requestId,
    amount,
    currency,
  },
});
```

## PII handling

Never log raw PII. Pass through `redactPii()` per `[[pii-handling-discipline]]` before including in any log field:

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
- Logging in a hot loop without sampling — cost explosion; use `if (Math.random() < 0.01)` gate for trace-level hot paths
- Different log shapes per handler — define `LogFields` type, derive all loggers from it

## Workers Tracing OTLP shape

Workers Tracing exports spans + logs via OTLP to Cloudflare's collector. The JSON console output becomes a log record under the current span automatically. Fields map:

- `level` → `SeverityText` / `SeverityNumber`
- `ts` → `TimeUnixNano`
- `msg` → `Body`
- Remaining fields → `Attributes`

No additional SDK configuration required — the Workers runtime handles export on request completion.

## Sentry severity mapping (numeric)

| Level  | Sentry numeric |
|--------|---------------|
| trace  | 5             |
| debug  | 7             |
| info   | 9             |
| warn   | 13            |
| error  | 17            |
| fatal  | 21            |

## See also

- `production-observability-default-on` — observability must be on by default, not opt-in
- `pii-handling-discipline` — redaction requirements
- `contract-first-ai` — structured shapes for AI output logs
- `drift-detection` — freeform console.log = drift, fix in-turn
