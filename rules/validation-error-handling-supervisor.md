---
name: "validation-error-handling-supervisor"
priority: 3
pack: "backend"
triggers:
  - "validation"
  - "error handler"
paths:
  - "*"
---

# Validation + Error-Handling Supervisor

Zod is the source of truth at every runtime boundary; errors are typed, human-readable on the surface, and developer-detailed in the logs. This is the validation arm of the supervisor knowledge system — the application of `zod-everywhere` + `contract-first-ai` to the dashboard revamp.

## When this fires

- Every API request + response handler
- Every form, env read, webhook, upload, AI output, editor save, CMS write, generated-site manifest
- Every error surfaced to a user OR written to a log

## Validate everywhere (the boundaries)

- **Client-side** — validate before submit (fast feedback) via Zod + Reactive Forms / `forms-editors-content-supervisor`
- **Server-side** — re-validate at the boundary; never trust the client
- **Critical server flows** — validate AGAIN inside billing / publish / deploy / auth flows (defense-in-depth)
- **API requests** — Zod-parse the body/params/query; reject malformed early
- **API responses** — validate where round-trip safety matters (typed client contracts)
- **Env vars** — `@t3-oss/env-core` + Zod; fail fast at boot on missing/invalid config
- **AI outputs** — Zod-parse every model result per `contract-first-ai`; repair-or-reject, never raw-through
- **Webhooks** — verify signature THEN Zod-parse payload per `notifications-email-webhooks-supervisor`
- **Uploads** — type + size + content per `media-file-document-supervisor`
- **Editor state** — Zod-validate saved JSON per `forms-editors-content-supervisor`
- **CMS content + generated-site manifests** — Zod-parse before render/publish
- **Phone numbers** — `libphonenumber-js` parse/format/validate (never a bare regex)

## Tooling

- **Zod** — the single schema source; infer types via `z.infer`, never hand-duplicate
- **zod-validation-error** — turn `ZodError` into a readable message for the surface
- **zod-to-json-schema** — derive JSON Schema for Formly forms, docs, AI tool input schemas, generated interfaces
- **@t3-oss/env-core** — env validation
- **libphonenumber-js** — phone validation

## Error contract (RFC7807-style envelope)

- Stable `code` (taxonomy) + `message` (user-safe) + `request_id`/`correlationId` + `errors[]` (field map for validation) + "what to do next"
- `zodIssueToHumanMessage(issue)` + `zodErrorToFieldMap(error)` helpers — never show raw Zod output to a human
- UI: inline field errors + one concise toast summary
- **Never expose** secrets, tokens, stack traces, SQL, or internal implementation detail in a user-facing error

## Logging

- Structured logs (pino per `observability-ops-supervisor`) carry `request_id` + `trace_id` + `tenantId` + error taxonomy code
- Redact secrets at the log boundary (`val.slice(0,7)…val.slice(-3)`)
