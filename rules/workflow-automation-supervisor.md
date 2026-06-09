---
name: "workflow-automation-supervisor"
priority: 3
pack: "backend"
triggers:
  - "workflow"
  - "inngest"
  - "queue"
  - "cron"
paths:
  - "concern:cloudflare-workers"
---

# Workflow + Automation Supervisor

Durable, long-running, and scheduled work runs as typed workflows with status, retries, idempotency, logs, trace IDs, and a user-facing progress + admin debug surface. The automation arm of the supervisor system.

## When this fires

- Deployments, imports, crawls, AI jobs, notifications, billing events, scheduled jobs, any long-running operation

## Tooling + when to use

- **Cloudflare Workflows** / **Dynamic Workflows** — the DEFAULT durable step engine per `cloudflare-lock-in-is-leverage` (`step.do`/`step.sleep`/`step.waitForEvent`)
- **Inngest** — event-driven/fan-out workflows where its DX/observability fits; behind an adapter
- **svix** — webhook delivery within a workflow per `notifications-email-webhooks-supervisor`
- **Playwright** — browser automation steps per `crawling-testing-browser-supervisor`
- **Crawlee** — crawl/import/research steps (backend only)

## Every workflow MUST have

- **Typed input** + **Zod validation** at the entry per `validation-error-handling-supervisor`
- A **status model** (queued → running → succeeded/failed/cancelled)
- **Retry behavior** (backoff + jitter) + an **idempotency key** where useful
- **Logs** + **trace IDs** (`workflow_run_id`) flowing to `observability-ops-supervisor`
- **User-facing progress** where useful (event-sourced per `event-sourced-build-progress`)
- An **admin debugging panel** (inspect runs, replay, inspect step IO)

## Crawlee doctrine

- Use Crawlee for crawling, scraping, imports, SEO research, sitemap crawl, page analysis, competitor/reference ingestion, customer-site import, content discovery, metadata extraction, AI/RAG data prep
- Prefer Crawlee when reliable crawling is needed (HTTP / Cheerio / Playwright / Puppeteer modes)
- **Never in the frontend bundle** — run in backend jobs/workflows only
- **Validate + sanitize all crawled content** per `validation-error-handling-supervisor` (treat as untrusted)
- **Respect robots.txt, legal constraints, rate limits, customer authorization** per `fetch-defaults`
- **Store crawl runs** with status, logs, timing, errors, extracted artifacts, trace IDs
