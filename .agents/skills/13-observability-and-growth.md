---
name: "observability-and-growth"
description: "Full instrumentation from day one. PostHog consolidates product analytics + feature flags + error tracking (one platform, one bill). GA4 via GTM (14-step automation, custom dimensions over events, server-side tagging). Sentry (deep error tracking + performance). Stripe (webhook-first with idempotent processing). Listmonk on Coolify (newsletters via Resend SMTP relay). PLG 7-layer framework. Programmatic SEO (5 page types). Incident auto-remediation via Sentry→Inngest pipeline. AI search (GEO) awareness. Local business conversions (phone_click, direction_click, form_submit, booking_click) with CRO patterns for both SaaS and local."
metadata:
  version: "2.1.0"
  updated: "2026-05-03"
  effort: "high"
  model: "sonnet"
license: "Rutgers"
compatibility:
  claude-code: ">=2.0.0"
  agentskills: ">=1.0.0"
submodules:
  - analytics-configuration.md
  - conversion-optimization.md
  - email-marketing-and-listmonk.md
  - feature-flags-and-experiments.md
  - sentry-alert-rules.md
  - square-payments.md
  - stripe-billing.md
  - user-feedback-collection.md
  - workers-tracing-otlp.md
priority: 2
pack: "backend"
triggers:
  - "posthog"
  - "sentry"
  - "analytics"
  - "stripe"
  - "growth"
paths:
  - "*"
---

# 13 — Observability and Growth

## Instrumentation tiers

Per `_kernel/standards.md#integrations`:

- **Tier 1 (solo)** — PostHog + Workers Tracing OTLP (2 vendors max, cookie-free, free tier covers <10k MAU)
- **Tier 2 (enterprise)** — + Sentry @sentry/cloudflare v9 + GA4/GTM + Axiom
- **Tier 3 (LLM-heavy >10k calls/mo)** — + AI Gateway

## PostHog (Tier 1 cornerstone)

- Snippet on every HTML page w/ `persistence:'memory'` (cookie-free)
- `capture_pageview` + `capture_pageleave` + `autocapture:true`
- Unified platform: product analytics + feature flags + session replay + error tracking
- CSP: `script-src` + `connect-src` for posthog domain
- Per-feature event naming: `<feature>:<action>` (`signup:complete`, `editor:save`, `share:copy`)

## Sentry (Tier 2)

- `@sentry/cloudflare` v9 + `withSentry` wrapper
- Project created via `mcp__sentry__create_project` (org:`megabyte-labs`)
- `SENTRY_DSN` via `wrangler secret put`
- Pattern: `withSentry(env => ({ dsn, tracesSampleRate: 1.0, sendDefaultPii: false }), worker)`
- Breadcrumbs before risky ops; capture exception w/ context tags (`worker` | `route` | `userId`)
- Release tracking via `SENTRY_RELEASE` env
- Focus on exceptions; Workers Tracing handles I/O spans

## Workers Tracing (Tier 1 + Tier 2)

- `[observability] enabled = true` in `wrangler.jsonc` — zero-config OTel I/O tracing
- Free until Mar 1 2026 then billed
- Export to Axiom (cheapest at edge), Honeycomb (BubbleUp), Grafana, Datadog via `@opentelemetry/exporter-trace-otlp-http`

## GA4 + GTM (Tier 2 only)

- GTM container snippet (head script + noscript iframe after body)
- CSP: `googletagmanager.com` + `google-analytics.com` + `analytics.google.com` + `region1.google-analytics.com`
- Server-side tagging when privacy-critical (EU traffic)
- Custom dimensions over custom events (cheaper, more queryable)

## AI Gateway (Tier 3)

- `env.AI.run()` auto-routes through Gateway
- Direct Anthropic: `https://gateway.ai.cloudflare.com/v1/{account}/{gateway}/anthropic/v1/messages`
- Caching + rate-limit + fallback + per-call logging

## Stripe (SaaS billing only — per `rules/payments-routing.md`)

- Webhook-first w/ idempotent processing (D1 dedupe table `payment_events(event_id, source, processed_at)` UNIQUE)
- `Stripe-Signature` HMAC + 5-min replay window
- Mint products + prices via MCP (idempotent via `lookup_key`)
- Subscription state machine in D1
- `STRIPE_WEBHOOK_SECRET` via `POST /v1/webhook_endpoints`

## Square (accept-money default — per `rules/payments-routing.md`)

- Square Web Payments SDK card form + Apple Pay + Google Pay + Cash App Pay
- Square Subscriptions for recurring giving
- `Square-Signature` HMAC-SHA256 w/ 6-hr replay window
- Idempotency: `idempotency_key` UUID per request (24-hr dedupe)
- Nonprofit verified-501c3 discount (2.6%+10¢ vs 3.5%+15¢)

## Listmonk (newsletter — self-hosted on Coolify)

- Resend SMTP relay (`LISTMONK_FROM_EMAIL`)
- `listmonkSendTx(env, { templateAlias, ... })` via KV-cached alias→id map
- Templates in `emails/*.html` synced via `scripts/listmonk-sync.mjs`
- Auth: `Authorization: token <user>:<key>` (Listmonk 3.x API-user pattern)

## PLG 7-Layer Framework

1. **Discovery** — SEO + AI search + word-of-mouth + paid
2. **Sign-up** — passwordless preferred (Clerk M2M JWT)
3. **Activation** — first-value-in-X-min metric (aha moment per `rules/feature-flags.md` instrumentation)
4. **Engagement** — DAU/MAU ratio, session depth
5. **Retention** — D1/D7/D30 cohort
6. **Revenue** — upgrade trigger, expansion
7. **Referral** — viral coefficient, two-sided rewards

Instrument each layer with PostHog events. Funnel visible in PostHog dashboard.

## Programmatic SEO (5 page types)

- **Integration** (`/integrations/{tool}`)
- **Comparison** (`/compare/{a}-vs-{b}`)
- **Use-case** (`/for/{audience}`)
- **Template** (`/templates/{type}`)
- **Location** (`/{city}-{service}`)

Each unique H1 + meta desc + 800+ unique words + 1 unique image + 3+ internal links + 1+ outbound citation. Cap 200 pages per axis to avoid thin-content. Per `rules/copy-writing.md` § pSEO + `rules/thin-source-amplification.md`.

## GEO / AI search

- Quotable answer blocks 40-60 words (LLM citation magnet)
- FAQPage schema highest AI-citation rate (ChatGPT / Perplexity / Google AI Overviews)
- JSON-LD facts MUST also appear as visible HTML body text
- Lead paragraphs answer query in <40 words
- EEAT: author bio + `Person` schema + `sameAs` + dated revision + ownership statement
- `llms.txt` at site root (DX-only, <0.3% adoption — not build gate)

## Local-business conversions

Track per `local-conversions.md` submodule:

- `phone_click` — `tel:` link
- `direction_click` — Google Maps directions
- `form_submit` — contact / quote
- `booking_click` — Calendly / Cal.com / direct
- `chat_click` — live chat opened
- `review_click` — Google Business / Yelp redirect

Each fires PostHog + Sentry breadcrumb + (Tier 2) GA4 conversion event.

## CRO patterns

- Sticky CTA bar on mobile (phone + book)
- Scroll-progress bar (subtle)
- Exit-intent modal (only on cart/pricing pages, not blogs)
- Social proof near every CTA ("Trusted by N customers")
- Urgency without dark patterns ("3 spots left this week" if true)
- Trust strip above fold (logos, accreditations, real licenses)
- Single primary CTA per surface; secondaries de-emphasized

## Incident auto-remediation

Sentry → Inngest pipeline:

1. Sentry webhook on `event.alert.triggered`
2. Inngest function dispatches `incident-responder` agent
3. Agent reads event → traces to source file → proposes fix → opens PR via gh MCP
4. PR auto-merges if all CI gates pass per `rules/ai-seniority.md`

## See submodules: posthog, ga4-gtm, sentry, stripe-billing, square-payments, listmonk, plg-framework, programmatic-seo, incident-remediation, geo-ai-search, local-conversions.
