# Structured Logging — implementation reference

Sourced on demand by rules/structured-logging.md.

## Worker-side logger implementation

Full typed logger for `src/worker/lib/logger.ts`. Uses `console.log(JSON.stringify(...))` so
Workers Tracing OTLP captures the entry as structured JSON. Forwards `error`/`fatal` to Sentry.

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

## Per-request traceId middleware (Hono)

Attach at application root before all routes with `app.use("*", traceMiddleware)`.
Propagates incoming `x-trace-id` or mints a fresh UUID. Sets the response header so
clients can correlate their request with log entries.

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

Register: `app.use("*", traceMiddleware);`
Access downstream: `const traceId = c.get("traceId");`

## PostHog event capture with traceId

Every significant action emitted to PostHog MUST include `traceId` for cross-correlation:

```ts
posthog.capture({
  distinctId: userId,
  event: "payment.completed",
  properties: { traceId, requestId, amount, currency },
});
```

## PII redaction in log calls

```ts
// BAD
log("info", "user signed up", { ...base, email: user.email });

// GOOD
log("info", "user signed up", { ...base, email: redactPii(user.email) });
```

`redactPii(s)` returns `"***"` for email/phone patterns, masked ID otherwise.
Full contract: `rules/pii-handling-discipline.md`.
