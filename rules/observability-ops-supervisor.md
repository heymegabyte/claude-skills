---
name: "observability-ops-supervisor"
priority: 3
pack: "backend"
triggers:
  - "observability"
  - "logging"
  - "tracing"
paths:
  - "*"
---

# Observability + Ops Supervisor

Major user actions emit telemetry; frontend errors and backend logs are captured and correlated by request/trace/workflow/AI IDs. Analytics stays optional so local dev is reproducible. The observability arm of the supervisor system.

## When this fires

- Any major user action, error path, workflow run, or admin health surface

## Tooling + when to use

- **posthog-js** — product analytics (privacy-aware event names, `persistence:'memory'` cookie-free where possible)
- **@sentry/angular** — frontend error capture + release tracking
- **pino** — backend structured logs
- **OpenTelemetry-compatible abstractions** — traces behind a vendor-neutral port (Workers Tracing OTLP is the CF-native exporter per `auto-meta-work`)
- **Cube** — analytics modeling per `database-data-supervisor`
- **Typesense** — log/search where useful

## Rules

- **Telemetry on major actions** — privacy-aware event names (no PII in the name), tenant-tagged
- **Frontend error capture** (Sentry) + **backend structured logs** (pino)
- **Correlate everything** — `request_id` + `trace_id` + `workflow_run_id` + `ai_trace_id` (where AI exists per `ai-agent-supervisor`) flow through every log line and span
- **Audit logs** for sensitive actions per `auth-permissions-security-supervisor`
- **Admin health/status panels** — surface workflow runs, error rates, queue depth, AI spend
- **Analytics optional for local reproducibility** — the app runs fully with telemetry disabled (no hard dependency on a vendor key)
- Tiered vendor stack per `auto-meta-work` (solo → PostHog + Workers Tracing; enterprise → add Sentry/GA4/Axiom)
