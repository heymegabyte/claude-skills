---
name: "auto-meta-work"
priority: 2
pack: "core"
triggers: []
paths:
  - "*"
---

# Auto Meta-Work

Automatically improve error handling, JSDoc, observability wiring, and type coverage alongside every code change without being asked.

## Default behavior on every code prompt

- Improve error handling (`try/catch` → `onError` → Sentry breadcrumbs)
- Add JSDoc (intent not types)
- Wire Sentry + PostHog + GA4 events
- Remove dead code/imports
- Update stale docs
- Run parallel w/ feature work via background agent — default, not extra

## Analytics auto-provision (TIERED)

### Tier 1 — Solo SaaS / nonprofit / local / portfolio

- Pick TWO max: **PostHog** + **Workers Tracing**
- Skip Sentry (PostHog covers errors + replay)
- Skip GA4 (use `persistence:'memory'`)
- Skip AI Gateway unless LLM calls exceed 10k/mo

### Tier 2 — Enterprise / regulated / multi-team SaaS

- Full stack: **Sentry + PostHog + GA4 + Workers Tracing + AI Gateway**
- Every action: GA4 event + PostHog event + Sentry breadcrumb + Workers Trace span + AI Gateway log

### Tier 3 — AI-heavy product (>10k LLM calls/mo)

- Add **AI Gateway** regardless of tier — caching + rate-limit + fallback pays for itself

### Vendor wiring

**1. Sentry**

- Install `@sentry/cloudflare` (Workers) or `@sentry/node` → `withSentry` wrapper
- Project via `mcp__sentry__create_project` (org:`megabyte-labs`, team:`megabyte-labs`, platform:`javascript`)
- `SENTRY_DSN` via `wrangler secret put`; use OIDC, not static DSN secrets
- Pattern: `import { withSentry } from '@sentry/cloudflare'; export default withSentry(env => ({ dsn, tracesSampleRate: 1.0, sendDefaultPii: false }), worker);`
- Focus on exceptions; Workers Tracing handles I/O spans

**2. PostHog**

- Snippet on every HTML page w/ `persistence:'memory'` (cookie-free); `capture_pageview` + `capture_pageleave` + `autocapture:true`
- **`api_host` MUST be the regional INGESTION host** (`https://us.i.posthog.com` US / `https://eu.i.posthog.com` EU) — NEVER `app.posthog.com` (deprecated UI host — captures silently no-op)
- **CSP must allow BOTH ingestion AND assets hosts** in `script-src` + `connect-src`: `https://us.i.posthog.com https://us-assets.i.posthog.com`
- **VERIFY BY QUERYING THE BACKEND, never the browser.** "requests fire" ≠ "events land" — confirm round-trip via PostHog MCP (`query-trends` for `$pageview`) or raw `fetch` to `…/i/v0/e/`. (njsk.org pass-235→237: snippet+requests fired but 0 events landed — CSP blocked ingestion host AND wrong `api_host`.)
- **HEADLESS PLAYWRIGHT CANNOT VERIFY POSTHOG CAPTURE** — posthog-js bot-filters automation (UA, `navigator.webdriver`, plugins, `window.chrome`). 0 events from Playwright = expected null, not a bug. Use real browser (Computer Use) or raw `fetch` to `…/i/v0/e/` to prove ingestion path. (njsk pass-239: 4 turns of "0 events" was headless artifact.)
- Each PROPERTY gets its OWN project — don't share one `phc_` key across N sites

**3. GA4/GTM**

- GTM container snippet (head script + noscript iframe after body)
- CSP for `googletagmanager.com` + `google-analytics.com` + `analytics.google.com` + `region1.google-analytics.com`

**4. Workers Tracing (OTLP)**

- `[observability] enabled = true` in `wrangler.jsonc` — zero-config OTel tracing of every I/O
- Export to Axiom / Honeycomb / Grafana / Datadog via `@opentelemetry/exporter-trace-otlp-http`

**5. AI Gateway**

- Every LLM call routes through binding (`env.AI.run()` auto-routes)
- Direct Anthropic: `https://gateway.ai.cloudflare.com/v1/{account}/{gateway}/anthropic/v1/messages`
- **Per-request `cacheKey` + `cacheTtl`** on Worker binding for LLM-call dedupe — stable hash of prompt+ctx; 30-70% hit rate on repeated surfaces
- **`env.AI.gateway().patchLog(id, {score, feedback, metadata})`** wires post-call eval scores back to gateway log → closes eval loop per `evals.md` § three-tier grading
- **Async batch via `env.AI.run(model, { queueRequest: true, messages: [...] })`** for Llama 3.3 70B + BGE embeddings — ~5-10× throughput on bulk content gen

## Security scan — OWASP Top 10:2025

1. Broken Access Control (incl SSRF)
2. Security Misconfiguration
3. Supply Chain
4. Injection
5. Cryptographic Failures
6. (new) #10 Mishandling Exceptional Conditions

**Check for:**

- Hardcoded secrets
- Missing auth checks
- SQL injection — use parameterized Drizzle queries
- XSS — sanitize user input; **Trusted Types** for DOM-XSS
- SSRF — validate URLs
- CSP Level 3 strict-dynamic + per-response random nonce (never reused)
- Every PR: `detect-secrets scan`
- Never `CLOUDFLARE_API_TOKEN` / `AWS_*` / `GCP_*` as long-lived secrets — use **OIDC** w/ `cloudflare/wrangler-action@v3` + GitHub OIDC trust policy

## Agents SDK stubs

- New projects get agent definitions in `.claude/agents/` (architect, test-writer, deploy-verifier minimum)
- Agent frontmatter (v2.1.33+): `description`, `prompt`, `tools`, `disallowedTools`, `model`, `permissionMode`, `mcpServers`, `hooks`, `skills`, `initialPrompt`, `memory` (`user|project|local`), `effort` (`low|medium|high|max|xhigh` — `xhigh` Opus-4.7-only, falls back to `high`), `background` (true=detached), `isolation: worktree`, `color`
- Match agent routing table in model-routing
- Skill frontmatter: `name`, `description`, `when_to_use`, `paths` (glob), `disable-model-invocation` (true→never auto-loads), `argument-hint`, `user-invocable` (default true)

## Memory primitives

- **Memory Tool** — API-layer persistent store for long-running agents
- **Subagent Memory** — scoped `user|project|local`
- Skills write durable context to `MEMORY.md` or memory tool, not inline
- **Server-side Context Compaction beta** (Opus 4.8/4.7/4.6/Sonnet 4.6) replaces manual `/compact` — trigger proactively at 70-90% context

## Built-in tools

- `web_search_20260209`
- `web_fetch_20260209` — dynamic filtering, Claude runs code in sandbox to post-process before context ingestion
- `code_execution_20260120`
- `code_execution` FREE when paired with `web_search_20260209` or `web_fetch_20260209`; standard charges otherwise
- Default new agents to bundle all three

## Structured Outputs + Citations

- Structured Outputs beta header `structured-outputs-2025-11-13` + `output_config.format` for strict JSON schema
- Incompatible with Citations (returns 400) — pick one per request
- Citations is GA across all active models except Haiku 3 — `citations: {enabled: true}` per document
- PDF=page, plain-text=char-index, custom=block-index; `cited_text` is free (not counted as output tokens)

## Template Scan (megabytespace/saas-starter — EVERY PROMPT)

- After any code change: "Would saas-starter have saved time here?" If yes → push improvement same prompt
- Template must reflect current best practices: same stack, same `.claude/` config, same standards
- **Bindings**: D1 (read-replicas) + KV + CACHE + R2 (IA lifecycle) + AI + Hyperdrive + Vectorize + Queue + DO (SQLite) + Container + Assets
- **Stubs**: Clerk auth (M2M JWT) · Square Web Payments SDK (accepting: donations/POS/subscriptions/tap-to-pay — DEFAULT for ALL inbound money) · Stripe Connect Express (payouts only: vendor/contractor/volunteer/marketplace splits — NEVER for accepting end-user money) · Inngest workflows · Workflows v2 step-based jobs · Turnstile · Resend · Health endpoint · `secrets.required` block · Workers Builds CI config
- Three artifacts checked every prompt: (1) template repo (2) E2E tests (3) skills+config
- Template = source of truth for `gh repo create --template megabytespace/saas-starter`
