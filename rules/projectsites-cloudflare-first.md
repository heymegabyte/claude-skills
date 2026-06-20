---
priority: 2
pack: core
triggers:
  - "projectsites"
  - "cloudflare-first"
  - "browser.projectsites"
  - "neon"
  - "upstash"
  - "skyvern"
  - "browserbase"
paths:
  - "concern:cloudflare-workers"
---

# ProjectSites.dev — Cloudflare-First Platform

ProjectSites.dev is a **Cloudflare-native multi-tenant website/application platform**. Cloudflare primitives are first-class and MUST be evaluated before any external service. Repo doctrine: `apps/project-sites/docs/architecture/cloudflare-first.md`.

## The infrastructure LAW (non-negotiable)

- **Allowed default infra: Cloudflare + Neon + Upstash + Fly.io.** Nothing else by default.
- **NEVER by default**: Google Cloud Run, AWS, GCP, Azure, Vercel, Supabase, Render, Railway, or any managed app platform. Only on an explicit Brian override.
- **Neon** = the Postgres escape hatch — only when D1 can't (true Postgres semantics, advanced SQL, RLS, extensions, customer-isolated Postgres, large relational app data).
- **Upstash** = the Redis escape hatch — only for Redis-shaped problems (pub/sub, streams, sorted sets, leaderboards, global token buckets, Redis locks). NEVER the default manifest cache — use KV/R2 first.
- **Fly.io** = the stateful-VM/container escape hatch — only when a true stateful VM is required AND Workers/DO/Containers/Queues/Workflows/R2/D1/KV/Hyperdrive/Browser Run/Agents/Sandbox cannot safely satisfy it.

## First-class Cloudflare primitives (reach for these first)

- **Runtime**: Workers (Hono) for every API/webhook/dispatch/billing-callback/telemetry/AI-orchestration/admin/site-serving. Service Bindings for Worker↔Worker (not public HTTP). Workers Static Assets where it fits.
- **Multi-tenant**: Cloudflare for SaaS (custom domains + SSL); Workers for Platforms + dispatch namespaces ONLY for customer/AI-authored custom code (not every static site); CF Access/Zero Trust for admin/staging/internal.
- **Data**: no DB when a static R2/KV manifest suffices · KV for hostname→site routing + manifest version + flag/plan/capability cache · D1 as the default relational DB (tenants/users/sites/hostnames/subs/flags/rollups/build status/db-allocation metadata) · Durable Objects for build locks/preview sessions/collab rooms/quota counters/webhook idempotency/WebSocket/presence · R2 for generated bundles/uploads/media/sourcemaps/screenshots/PDFs/HAR/exports/build logs/AI archives (+ R2 Data Catalog/R2 SQL for queryable data-lake).
- **Postgres path**: Hyperdrive for every Worker→Neon connection; **shard-level** Hyperdrive bindings, never one config per site; postgres.js/pg/Drizzle over Hyperdrive; raw Neon only for migrations/backups/restore/replication/long admin jobs; never expose Neon creds to customer code.
- **Async**: Queues (every critical queue has retries + DLQ) · Workflows for durable multi-step (claim/payment/domain/db-alloc/generation/QA/publish/promotion/rollback) · Cron Triggers for rollups/cleanup/domain-recheck/billing-sync/health/cache-warm/sitemaps.
- **AI**: Workers AI for cheap default tasks · **AI Gateway is MANDATORY for every model call** (logging/cache/limits/retries/fallback/tenant-attribution/budget/routing/eval-tags) · Vectorize as the default vector DB · AI Search for managed RAG · Agents SDK for durable agents · Agent Memory (tenant/user/site-isolated) · Sandbox SDK only for isolated code exec.
- **Edge services**: Turnstile on all public forms (validate server-side) · WAF/Rate-Limiting/Bot-Management/Rulesets before custom anti-abuse · Secrets Store/Worker secrets for all sensitive config · Analytics Engine for high-cardinality per-tenant metrics · Workers Logs/Tail Workers · CF Email Service + Email Routing · Zaraz for third-party scripts · Cloudflare Flagship for flags (D1/KV fallback) · Images/Stream/Realtime SFU-TURN for media + realtime.

## The hot path (public site request)

`CF DNS / Cloudflare-for-SaaS custom hostname → Worker dispatch → KV hostname/manifest lookup → R2/static asset response → Analytics Engine sample → async Queue for non-critical work.`

The hot path MUST NOT touch Neon · Upstash · Fly.io · Sentry · PostHog · Browserbase · Skyvern · external AI — unless the request is truly dynamic and requires it.

## Browser automation — the naming split (HARD)

- **`browser.projectsites.dev`** = the product browser-automation abstraction (Cloudflare-first). Product/agent code calls THIS, never Browserbase/Skyvern directly. Backend order: **CF Browser Run + Playwright → CF Browser Run + Stagehand → Browserbase fallback (managed session/replay/proxy only) → skyvern_internal (internal long-running only)**.
- **`mcp.megabyte.space/browserbase`** = internal Browserbase MCP bridge (Claude Code / internal agents / ops). Behind CF Access. Customer sites never depend on it.
- **`skyvern.megabyte.space`** = internal heavy-workflow agent (logged-in portals, 12-step flows, human-review queues). Behind CF Access. **NOT in the default ProjectSites architecture.** Never for routine screenshots/QA/forms/PDF/crawl/health — use `browser.projectsites.dev`.
- Rule of thumb: `browser.projectsites.dev` = product abstraction · Browserbase = internal MCP/fallback provider, **always driven via Stagehand** (`act`/`extract`/`observe`/`agent`), never the raw Browserbase API · Skyvern = internal heavy workflow agent.

## Observability (tenant-tagged, sampled, gated)

- **Worker observability gateway** `/monitoring/{sentry,posthog}`: validate hostname/site_id, attach tenant metadata, redact PII, sample, block noisy clients, enforce quotas, forward, write rollups to Analytics Engine, optionally archive to R2.
- **Sentry** = high-value errors only (payment/auth/build/deploy failures, sourcemaps, paid-tier traces). Shared projects + `{tenant_id,site_id,hostname,plan,template_id,release}` tags; virtual per-site property via filtering; dedicated project only for paid dev/pro tiers.
- **PostHog** = sampled + schema-controlled only (approved events; autocapture OFF by default; reverse-proxied through a Worker). NOT the default high-volume traffic backend — Analytics Engine is.

## Site capability manifest + DB allocation

- Signed `SiteCapabilityManifest` (D1 canonical → KV cache → R2 bundle): `{tenantId,siteId,hostname,plan,staticServing,db,storage,analytics,sentry,posthog,browserAutomation,aiGatewayBudgetMonthlyCents,vectorizeNamespace?,featureFlags,manifestVersion,release}`.
- DB allocation order: `none → d1_tenant_db → neon_shared_shard → neon_dedicated_project`. Every paid site gets DB capability, not every paid site a dedicated Neon project. D1 first; Neon only when Postgres is truly required; shard-level Hyperdrive. Table `site_database_allocations`; KV cache `site-db:{site_id}` / `hostname-db:{hostname}`.
- Tenant promotion `D1 → shared Neon shard → dedicated Neon` via Workflows+Queues when p95/volume/storage/connection/noisy-neighbor/plan thresholds trip.

## Cross-links

- `cloudflare-lock-in-is-leverage` — deep CF lock-in is the strategy, not the bug
- `cloudflare-hostable-supervisor` — isolate CF-specific behind adapters; portable-vs-CF documented
- `payments-routing` · `secret-provisioning` · `feature-flags` · `ai-agent-security`
