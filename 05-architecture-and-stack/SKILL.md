---
name: "architecture-and-stack"
description: "Cloudflare-first platform selection and architecture design. Decision trees for Workers, Pages, D1, R2, KV, Durable Objects, Queues, Vectorize. Default stack with override conditions. Auth via Clerk, data patterns, reliability structure, and complete API key reference."
submodules:
  - api-design-and-documentation.md
  - shared-api-pool.md
  - drizzle-orm-and-migrations.md
  - coolify-docker-proxmox.md
  - mcp-and-cloud-integrations.md
  - ai-technology-integration.md
  - auth-and-session-management.md
  - background-jobs-and-workflows.md
---

## Submodules

| File | Description |
|------|-------------|
| api-design-and-documentation.md | Hono RPC mode, error envelope, rate limiting, pagination, OpenAPI, versioning. |
| shared-api-pool.md | Centralized API key pool. Auto-integrates PostHog, Sentry, Postiz, all services. |
| drizzle-orm-and-migrations.md | Drizzle ORM for D1/Neon. Schema-first, auto migrations, type-safe queries. |
| coolify-docker-proxmox.md | Self-hosted services on Proxmox via Coolify API. Docker containers, env vars. |
| mcp-and-cloud-integrations.md | All MCP servers, cloud APIs, SaaS integrations. Secret discovery, AI API usage. |
| ai-technology-integration.md | AI APIs/models: GPT-4o vision, Workers AI edge inference, embeddings for RAG. |
| auth-and-session-management.md | Clerk auth: middleware, webhook sync, RBAC, protected routes, session tokens. |
| background-jobs-and-workflows.md | Inngest durable jobs, CF Cron Triggers, CF Queues, email drips, fan-out. |

# 05 — Architecture and Stack

## Default Stack

| Need | Default | Override When |
|------|---------|---------------|
| Hosting | CF Workers + Pages | Never |
| Backend | Hono on Workers | Complex GraphQL → Yoga |
| Frontend (simple) | Vanilla HTML/CSS/JS | >3 interactive pages |
| Frontend (complex) | Angular 19 + Ionic + PrimeNG + Nx | Simple marketing site |
| DB (simple) | D1 (SQLite) | Joins >3 tables |
| DB (complex) | Neon PostgreSQL | D1 sufficient |
| Cache | KV / Upstash Redis | Atomic ops → D1 |
| Storage | R2 | S3-specific SDK |
| Auth (SaaS) | Clerk | Custom auth requested |
| Auth (self-hosted) | Authentik | Clerk for customer-facing |
| Payments | Stripe + Stripe Link | Non-card/crypto |
| Email (transactional) | Resend | Bulk → Listmonk |
| Email (marketing) | Listmonk on Coolify | Simple → Resend |
| Runtime | Bun | Node.js for incompatible |
| Package Manager | pnpm | Legacy npm |
| Linting | Biome | Never ESLint+Prettier |
| Testing | Playwright + Vitest | Never Jest/Cypress |
| Analytics | GA4 via GTM + PostHog | Privacy-first → PostHog only |
| Errors | Sentry | PostHog errors sufficient |
| Validation | Zod | — |
| Search | CF Vectorize + Workers AI | Simple → D1 LIKE |
| Queues | CF Queues | — |
| Realtime | Durable Objects + WebSocket | Simple polling |
| Scheduling | CF Cron Triggers | — |
| AI/ML | Workers AI | Specific model → OpenAI/Anthropic |
| Workflows | Inngest / CF Workflows v2 | Simple cron → Cron Triggers |
| AI Agents | cloudflare/agents SDK (Think on DO) | No agent needed |
| IaC | Wrangler CLI + wrangler.toml | Multi-cloud → Pulumi |

Key reasoning: Hono over NestJS (native CF Workers), Angular over React (Brian's background), Neon over Supabase (multi-DB, lower cost), Drizzle over Prisma (lighter edge), Biome over ESLint (single Rust tool).

## CF-Only Assumption (***DEFAULT***)
Every feature MUST try CF-native first. Never reach for external services when CF has an equivalent. Template: megabytespace/saas-starter has stubs for all CF primitives.
AI→Workers AI (not OpenAI). Cache→KV/Cache API (not Redis). DB→D1 (not Postgres). Storage→R2 (not S3). Queue→CF Queues (not SQS). Realtime→DO+WebSocket (not Pusher). Schedule→Cron Triggers (not external cron). Search→Vectorize (not Algolia). Only escape to external when CF primitive insufficient (complex joins→Neon, specific model→OpenAI/Anthropic via AI Gateway).

## CF Platform Decision Trees

**Run code:** Static→Pages. API→Workers(Hono). Long-running→Workers+Queues/Workflows. Stateful→DO. Container→CF Containers. Scheduled→Cron Triggers. Browser→Browser Rendering API.

**Store data:** Config→KV. Relational simple→D1. Relational complex→Neon. Files→R2. Session→DO/KV. Search→Vectorize. Messages→Queues. Cache→KV(CACHE binding, TTL).

**Security:** Bots→Turnstile. DDoS→always-on free. WAF→CF WAF. Auth→Clerk. Rate limit→KV counters (src/lib/cache.ts). Secrets→wrangler secret put. Admin→CF Access.

## Architecture Patterns

**Marketing Site:** Worker(Hono) → static HTML/CSS/JS + R2 images + KV config + GA4+GTM + Turnstile + Resend

**SaaS App:** Pages(Angular+Ionic) → Workers API(Hono) → D1/Neon + R2 + KV + Queues + DO + Clerk + Stripe + Resend + Listmonk + PostHog+Sentry+GA4 + Playwright+Vitest

**API Service:** Worker(Hono) → D1/Neon + KV(rate limit/cache) + R2 + Queues + Workers AI + Sentry + PostHog

### Service Boundaries
Start monolith. Split when: different scaling needs, different deploy cadence, Worker size exceeded, isolation required. Angular frontend = separate Worker. Webhook handlers = separate. Cron = shared via scheduled handler.

## Auth: Clerk

User → Clerk widget → JWT → Worker middleware verifies → proceed. Metadata in D1 (Clerk ID as FK). Roles in D1, not Clerk metadata. Not needed for: public marketing, OSS docs, public APIs with rate limiting only.

## Data: Drizzle ORM

Schema in TypeScript, type-safe queries, auto migrations. D1 conventions: id=TEXT(ULID), created_at/updated_at=TEXT(ISO8601), deleted_at=TEXT(soft delete), explicit FKs, indexes on FKs+frequent columns.

**Neon when D1 isn't enough:** >3 table joins, full-text search, jsonb, complex aggregations, RLS, >500MB.

## API Keys

All keys: `/Users/apple/emdash-projects/worktrees/rare-chefs-film-8op/.env.local`
GCP: `/Users/apple/.config/emdash/gcp-service-account.json`
CF Global: blzalewski@gmail.com / 84fa0d1b16ff8086dd958c468ce7fd59

| Service | Env Var | Free Tier |
|---------|---------|-----------|
| Cloudflare | CLOUDFLARE_API_TOKEN | Yes |
| Stripe | STRIPE_API_KEY | Test free |
| Resend | RESEND_API_KEY | 100/day |
| PostHog | POSTHOG_API_KEY | 1M events/mo |
| Sentry | SENTRY_AUTH_TOKEN | 5K errors/mo |
| OpenAI | OPENAI_API_KEY | Pay-per-use |
| Anthropic | ANTHROPIC_API_KEY | Pay-per-use |
| Ideogram | IDEOGRAM_API_KEY | Pay-per-use |
| Unsplash | UNSPLASH_ACCESS_KEY | 50 req/hr |
| Pexels | PEXELS_API_KEY | 200 req/hr |
| GA4 | GCP service account | Free |
| Clerk | CLERK_SECRET_KEY | 10K MAU |

## Reliability

Error handler: `app.onError()` → log + Sentry + JSON envelope. Retry: idempotent 3x exponential backoff, non-idempotent no retry. Health: GET /health (version+timestamp), /health/db, /health/services.

## CF Infrastructure

Zone (megabyte.space): 75a6f8d5e441cd7124552976ba894f83. Deploy+purge always together (see CONVENTIONS.md).

| Product | Free Limit |
|---------|-----------|
| Workers | 100K req/day, 10ms CPU |
| Pages | 500 builds/mo |
| D1 | 5M rows, 5GB |
| R2 | 10GB, 10M req/mo |
| KV | 100K reads/day |
| Queues | 1M msg/mo |
| DO | 100K req/day |
| Vectorize | 5M vectors |
| Workers AI | 10K neurons/day |

Security headers, Turnstile, rate limiting, DNS management, wrangler.toml template — see CONVENTIONS.md.

## AI Agent Patterns (CF Agents SDK, April 2026)

Think class on DO: addressable entity with SQLite, zero compute when hibernated. Durable execution via Fibers (survives crashes). Dynamic Workers for sandboxed V8 isolates. Execution ladder: Workspace → Dynamic Worker → npm resolution → headless browser → full sandbox. Sub-agent coordination via Facets (colocated, typed RPC).

Code Mode MCP: 2 tools + <1K tokens (81% reduction vs traditional MCP).

Traffic reality: agentic actors = ~10% CF network (up 60% YoY). Design every API for human+agent consumers.
