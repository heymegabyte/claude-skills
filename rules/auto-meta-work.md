# Auto Meta-Work (EVERY PROMPT)

## Default behavior on every code prompt
- Improve error handling (`try/catch` → `onError` → Sentry breadcrumbs)
- Add JSDoc (intent not types)
- Wire Sentry + PostHog + GA4 events
- Remove dead code/imports
- Update stale docs
- Run parallel with feature work via background agent — default behavior, not extra

## Analytics auto-provision (***TIERED — pick the right stack per project***)

Default: don't bolt on all five. Cost + complexity + cookie banners matter. Match the stack to the project tier.

### Tier 1 — Solo SaaS / nonprofit / local business / portfolio
- Pick **TWO max**. Recommended pair:
  - **PostHog** — product analytics + error tracking + session replay + feature flags in one platform
  - **Workers Tracing** — free OTel I/O spans (KV/R2/D1/DO/fetch), zero-config
- Skip **Sentry** — PostHog covers errors + replay
- Skip **GA4** — PostHog covers analytics with better privacy posture (cookie-free `persistence:'memory'`)
- Skip **AI Gateway** unless LLM calls exceed 10k/mo

### Tier 2 — Enterprise / regulated industry / multi-team SaaS
- Full stack: **Sentry + PostHog + GA4 + Workers Tracing + AI Gateway**
- Auditability and compliance posture justify the cost + complexity
- Every action: GA4 event + PostHog event + Sentry breadcrumb + Workers Trace span + AI Gateway log

### Tier 3 — AI-heavy product (>10k LLM calls/mo)
- Add **AI Gateway** regardless of tier — caching + rate-limit + fallback pays for itself

### Vendor wiring details

1. **Sentry**
   - Install `@sentry/cloudflare` (Workers) or `@sentry/node` → `withSentry` wrapper
   - Create project via `mcp__sentry__create_project` (org:`megabyte-labs`, team:`megabyte-labs`, platform:`javascript`)
   - Set `SENTRY_DSN` via `wrangler secret put`
   - Pattern: `import { withSentry } from '@sentry/cloudflare'; export default withSentry(env => ({ dsn, tracesSampleRate: 1.0, sendDefaultPii: false }), worker);`
   - Use OIDC, not static DSN secrets
   - Focus on exceptions; let Workers Tracing handle I/O spans

2. **PostHog**
   - Add snippet to every HTML page with `persistence:'memory'` (cookie-free)
   - `capture_pageview` + `capture_pageleave` + `autocapture:true`
   - CSP `script-src` + `connect-src` for posthog domain
   - Unified platform: errors + session replay + feature flags + product analytics — pair errors with replay + flag state

3. **GA4/GTM**
   - Add GTM container snippet (head script + noscript iframe after body)
   - CSP for `googletagmanager.com` + `google-analytics.com` + `analytics.google.com` + `region1.google-analytics.com`

4. **Workers Tracing (OTLP)**
   - Enable `[observability] enabled = true` in `wrangler.jsonc` — zero-config OTel tracing of every I/O (KV, R2, D1, DO, fetch)
   - Free until Mar 1 2026 then billed
   - Export to Axiom (Cloudflare partner, cheapest at edge volumes), Honeycomb (BubbleUp anomaly detection), Grafana, or Datadog via `@opentelemetry/exporter-trace-otlp-http`

5. **AI Gateway**
   - Every LLM call routes through AI Gateway binding (`env.AI.run()` auto-routes)
   - For direct Anthropic: `https://gateway.ai.cloudflare.com/v1/{account}/{gateway}/anthropic/v1/messages`
   - For logging, caching, rate-limit, fallback

## Security scan — OWASP Top 10:2025
1. **Broken Access Control** (incl. SSRF rolled in)
2. **Security Misconfiguration** (moved up from #5)
3. Supply Chain
4. Injection
5. Cryptographic Failures
6. (new) #10 Mishandling Exceptional Conditions

### Check for
- Hardcoded secrets
- Missing auth checks
- SQL injection — use parameterized Drizzle queries
- XSS — sanitize user input in templates, **Trusted Types** for DOM-XSS
- SSRF — validate URLs
- CSP Level 3 strict-dynamic + per-response random nonce (never reused)
- Every PR: `detect-secrets scan`
- Never `CLOUDFLARE_API_TOKEN` / `AWS_*` / `GCP_*` as long-lived secrets — use **OIDC** with `cloudflare/wrangler-action@v3` + GitHub OIDC trust policy

## Agents SDK stubs
- New projects get agent definitions in `.claude/agents/` (architect, test-writer, deploy-verifier minimum)
- Agent frontmatter (v2.1.33+): `description`, `prompt`, `tools`, `disallowedTools`, `model`, `permissionMode`, `mcpServers`, `hooks`, `skills`, `initialPrompt`, `memory` (`user|project|local`), `effort` (`low|medium|high|max|xhigh` — `xhigh` Opus-4.7-only, falls back to `high`), `background` (true=runs detached), `isolation: worktree` (separate git checkout per invocation, auto-cleaned unless dirty), `color`
- Match agent routing table in model-routing rule
- Skill frontmatter: `name`, `description`, `when_to_use`, `paths` (glob), `disable-model-invocation` (true→skill never auto-loads), `argument-hint`, `user-invocable` (default true)

## Memory primitives
- **Memory Tool** — API-layer persistent store for long-running agents
- **Subagent Memory** — scoped `user|project|local`
- Skills write durable context to `MEMORY.md` or memory tool, not inline
- **Server-side Context Compaction beta** (Opus 4.7/4.6/Sonnet 4.6) replaces manual `/compact` heuristics — trigger proactively at 70-90% context

## Built-in tools (latest versions)
- `web_search_20260209`
- `web_fetch_20260209` — dynamic filtering, Claude runs code in sandbox to post-process before context ingestion
- `code_execution_20260120`
- **`code_execution` is FREE when paired with `web_search_20260209` or `web_fetch_20260209`**; standard charges apply otherwise
- Default new agents to bundle all three

## Structured Outputs + Citations
- Structured Outputs beta header `structured-outputs-2025-11-13` + `output_config.format` for strict JSON schema
- **Incompatible with Citations** (returns 400) — pick one per request
- Citations is GA (not beta) across all active models except Haiku 3 — `citations: {enabled: true}` per document
- PDF=page, plain-text=char-index, custom=block-index
- `cited_text` is free (doesn't count toward output tokens)

## Template Scan (megabytespace/saas-starter — EVERY PROMPT)
- After implementing any code change, scan prompt+response: "Would saas-starter have saved time here?"
- If yes → push improvement to `megabytespace/saas-starter` in same prompt
- Template must always reflect current best practices: same stack, same `.claude/` config, same standards as any Emdash project (`~/emdash-projects/*`)
- **Bindings**: D1 (read-replicas) + KV + CACHE + R2 (IA lifecycle) + AI + Hyperdrive + Vectorize + Queue + DO (SQLite) + Container + Assets
- **Stubs**:
  - Clerk auth (M2M JWT)
  - **Square Web Payments SDK for accepting payments** (donations + POS + subscriptions + tap-to-pay — DEFAULT for ALL inbound money)
  - Stripe Connect Express stub for payouts ONLY (vendor/contractor/volunteer reimbursement, marketplace splits — NEVER for accepting end-user money)
  - Inngest workflows
  - Workflows v2 step-based jobs
  - Turnstile
  - Resend
  - Health endpoint
  - `secrets.required` block
  - Workers Builds CI config
- Three artifacts checked every prompt: (1) template repo (2) E2E tests (3) skills+config
- Template = source of truth for `gh repo create --template megabytespace/saas-starter`
