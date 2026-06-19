---
description: One-line SaaS — from a description, scaffold a complete CF-native multi-tenant SaaS (Hono + D1 + Drizzle + Better Auth + Stripe + shadcn) deployed to a real URL
argument-hint: <one-line-description-of-the-saas>
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, WebFetch, mcp__playwright__*
model: claude-opus-4-7
---

ULTRATHINK before responding. The user wants a complete SaaS: $ARGUMENTS

## Phase 0 — Brief

Per `[[02-goal-and-brief]]`:

- Infer org type, target user, revenue model, primary CTA, scope
- Confidence < 0.7? Surface 2-3 specific questions, then proceed

## Phase 1 — Fire Monitor fan-out (parallel agents)

Per `[[monitor-orchestration]]` + `[[source-site-enhancement]]` § Parallel-agent playbook. Spawn ALL in one multi-tool message:

| Agent | Role |
|---|---|
| `architect` | Project structure, file inventory, DO/D1/KV/R2/Vectorize decisions per `[[05-architecture-and-stack]]` |
| `auth-implementer` | Better Auth or Clerk wiring with D1 schema, social providers, magic links, session storage |
| `payments-implementer` | Square (default for accept) or Stripe (SaaS billing) per `[[payments-routing]]`, webhook handlers, idempotency |
| `feature-builder` (×3) | Per-domain features — one agent per domain (auth, billing, core feature) |
| `frontend-builder` | React 19 + Vite + TanStack Router + Tailwind v4 + shadcn/ui; SSR via vite-ssg or TanStack Start |
| `content-writer` | Marketing copy (Flesch≥60, active voice, anti-slop) per `[[copy-writing]]` |
| `seo-auditor` | Per-route metadata, JSON-LD, sitemap, robots.txt with explicit AI-crawler allow/disallow |
| `test-writer` | Failing Playwright specs BEFORE impl per `[[verification-loop]]` |

## Phase 2 — Stack defaults (Cloudflare-first, no portability layer)

Per `[[cloudflare-lock-in-is-leverage]]`:

- **Edge**: Workers + Hono
- **DB**: D1 with Drizzle v1 RQBv2 + Zod schemas (per `[[zod-everywhere]]`)
- **Auth**: Better Auth (D1 adapter) or Clerk (M2M JWT)
- **Payments**: Square (accept) + Stripe Connect (payouts) per `[[payments-routing]]`
- **AI**: Workers AI (Llama 3.3 70B FP8 free first-pass) + Anthropic via AI Gateway for polish per `[[model-routing]]`
- **State**: Durable Objects per tenant (sql\`\`-backed), KV for hot config, R2 for files
- **Workflows**: CF Workflows for durable multi-step (NOT Inngest unless explicit)
- **Vector**: Vectorize for RAG when AI search needed
- **Email**: Resend via @hono/resend or Workers binding
- **Observability**: PostHog (cookie-free) + Workers Tracing + Sentry @sentry/cloudflare v9 + AI Gateway logs
- **Forms**: Turnstile (invisible) + Zod + Resend

NO: Vercel, AWS, Supabase, PlanetScale, Inngest (unless explicit), Prisma. Per `[[cloudflare-lock-in-is-leverage]]`.

## Phase 3 — Page set (per `[[15-site-generation/page-set-expansion]]`)

SaaS standard set: `/`, `/pricing`, `/features`, `/docs`, `/blog` + `/blog/{slug}`, `/about`, `/contact`, `/privacy` + `/terms` + `/dpa` + `/cookies`, `/login`, `/signup`, `/dashboard`, `/settings`, `/billing`.

SaaS jewels: `/changelog`, `/security`, `/status`, `/customers`, `/roadmap`, `/api`, `/sdk/{lang}`, `/compare/{competitor}`.

## Phase 4 — Validate every gate (per `[[verification-loop]]` + `[[16-cinematic-website-prime-directive]]`)

100 build-breaking rules:

1. Cinematic Visual Doctrine — dark-first, OKLCH, clamp() type
2. SPA + Routing — React 19, TanStack Router, View Transitions
3. PWA Kit — manifest with screenshots/shortcuts/share_target
4. Structured Data — 5+ JSON-LD per route (accurate, never padded)
5. SEO + GEO — title 50-60ch, desc 120-156ch, robots AI-crawler explicit
6. Integrations — Stripe/Square/Resend/Clerk/Turnstile/Workers AI all configured
7. Performance — LCP ≤2.0s, CLS ≤0.05, INP ≤100ms
8. A11y — WCAG 2.2 AA, axe 0 violations × 6bp
9. Testing — Playwright 6bp + Vitest + Lighthouse + AI vision QA ≥9/10
10. Deploy — atomic, CDN purge, /health, D1 backups

## Phase 5 — Deploy + verify (per `[[verification-loop]]`)

1. Provision via wrangler: `wrangler d1 create`, `wrangler kv:namespace create`, `wrangler r2 bucket create`, secrets from `[[secret-provisioning]]`
2. `wrangler deploy` → real `.workers.dev` URL or custom domain
3. Playwright on PROD URL — full donor/signup/checkout flow
4. AI vision QA on every new route
5. Lighthouse CI all green

## Phase 6 — Done definition

Per `[[always]]` § Hard Gates and `[[16-cinematic-website-prime-directive]]` Done = deployed at a real URL + every Hard Gate green + Self-Verify Statement per route + announced.

## End-of-turn report

Include: deployed URL, route inventory (count), validation gate matrix (pass/fail per gate), token spend, model trace per `[[model-routing]]`.

## See also

- `[[02-goal-and-brief]]`, `[[05-architecture-and-stack]]`, `[[06-build-and-slice-loop]]`, `[[15-site-generation]]`, `[[16-cinematic-website-prime-directive]]`
- `[[source-site-enhancement]]` for rebuilds; `[[payments-routing]]`; `[[zod-everywhere]]`; `[[cloudflare-lock-in-is-leverage]]`
- `[[opus-quota-fallback]]` — degrade to Sonnet if Opus exhausted
