---
name: "supreme-polish"
priority: 3
pack: "polish"
triggers:
  - "polish"
  - "100 ideas"
  - "audit"
  - "pixel perfect"
  - "meta perfect"
paths:
  - "*"
---

# Supreme Polish + 100-Ideas Audit

## Trigger

- Phrase: `pixel ?perfect|meta ?perfect|polish (everything|the whole|all)|audit (the whole|the entire|everything)|100 (ideas|features|improvements|upgrades|enhancements)|make it (perfect|amazing|beautiful)|everything well[- ]integrated|commonly forgotten|every step`
- Auto every 5th prompt on a project touched ≥10 times.
- Monitor pattern (`monitor-orchestration.md`) is execution shell; this rule is content brief.

## Output (every supreme-polish prompt produces ALL in one turn)

1. `_audit.md` — full surface inventory + gap analysis
2. `_ideas-100.md` — exactly 100 ideas across 20 categories, each w/ rationale + effort + score 0-10
3. Parallel Agent fan-out implementing every idea ≥7 ("just-feels-right" threshold per `proactive-improvements.md`)
4. Build + deploy + verify per `verification-loop.md`
5. Updated `_ideas-100.md` with status (✅ shipped | ⏸ proposed | 🚫 rejected w/ reason)
6. Cross-link surfaced gap-patterns back into this rule + siblings

## Surface inventory (audit covers)

- Static-site routes (every `App.tsx` branch + generated page)
- Worker routes (every Hono mount under `/api/*`)
- Shared libs (`src/shared/*`)
- Data sources (`src/data/*`)
- Scripts (generators + validators)
- Migrations
- Tests (unit + E2E inventory)
- Third-party integrations (Sentry, PostHog, GA4, Stripe, Square, Resend, Twilio, Turnstile, Clerk, Workers Tracing, AI Gateway, CF bindings)
- Meta-files (manifest, robots, sitemap, humans.txt, security.txt, llms.txt, browserconfig, favicons, OG cards, apple-touch-icon, JSON-LD per route)
- Perf budgets per route
- A11y per breakpoint × 6
- Brand consistency (palette, type, logo, voice)
- Content (banned slop, citation coverage, EEAT, FAQPage density, hyperlink density)
- Secrets + env coverage
- Deploy + rollback runbook freshness
- Docs (CLAUDE.md, SPEC.md, README, docs/*)

## 20 categories (5 ideas each = 100)

1. Visual polish + cinematic motion
2. Typography + reading rhythm + clamp() fluid scales
3. A11y (WCAG 2.2 AA — all 9 new + axe 0)
4. Perf + CWV (LCP/CLS/INP + asset budgets)
5. SEO + structured data (5+ JSON-LD blocks/page incl FAQPage)
6. AI search / GEO (quotable answer, EEAT, llms.txt, citation arrays)
7. Third-party integrations (Sentry breadcrumbs, PostHog captures, GA4 events, Workers Tracing, AI Gateway, Square+Stripe per `payments-routing.md`)
8. PWA (manifest screenshots + shortcuts + share_target + file_handlers, kill-switch SW, A2HS, push)
9. Forms + trust (Turnstile invisible, Zod, error microcopy, success microcopy, server validation, idempotency)
10. Security (CSP Level 3 strict-dynamic + nonce, Trusted Types, security.txt, OWASP 2025, secret hygiene per `secret-provisioning.md`)
11. Observability (Sentry + PostHog + GA4 + Workers Tracing + AI Gateway all firing, structured logs, requestId, Sentry release tracking)
12. Content polish (anti-slop per `copy-writing.md`, citations per `citations.md`, real-photo audit per `image-quality.md` + `timeline-authenticity.md`)
13. Hyperlink density per `always.md` (every email/phone/address/org/journal linked)
14. Microcopy (errors, empty, loading, success, tooltips, aria-labels)
15. i18n per `i18n-by-demographics.md`
16. pSEO multipliers (city × service, integration × use-case, comparison, template galleries)
17. Conversion + CRO (sticky CTAs, scroll-progress, exit-intent, social proof, testimonials, urgency without dark patterns, phone_click/booking_click `data-bcl-*`)
18. DX (CLAUDE.md freshness, SPEC.md coverage, `e2e/FEATURES.md` inventory, unit-test coverage, build-validator coverage, type-safety)
19. Resilience (`error-recovery.md`, retry/backoff, idempotency, graceful degradation, rollback runbook, D1 Time Travel)
20. Brand (favicon set, OG 1200×630 BRANDED not scraped, apple-touch-icon, install-prompt icon contrast per `logo-contrast.md`, color-scheme meta, dark-first audit, accent-on-dark text-contrast per `text-contrast.md`)

## Idea scoring (0-10, ship ≥7)

Average of:

- **Risk**: 0=breaks shared infra, 5=isolated, 10=zero-risk
- **Taste payoff**: 0=invisible, 5=nice, 10=demo-worthy
- **Effort fit**: 0=days, 5=hours, 10=≤30min

Action:

- ≥7 → ship inline
- 5-6.9 → Recs w/ one-line rationale + next-prompt language
- <5 → reject w/ reason in `_ideas-100.md`

## Parallel fan-out (fires after `_ideas-100.md`)

Per `monitor-orchestration.md` § Decomposition, group ship-list into independent batches by file-conflict graph:

- **Agent-A `meta-perfect`** — per-route title/desc/canonical/OG/JSON-LD/breadcrumb/FAQPage audit + fixes
- **Agent-B `pwa-completeness`** — manifest screenshots + shortcuts + share_target + file_handlers + protocol_handlers + iOS splash + Workbox `sw.js` + `offline.html` + kill-switch
- **Agent-C `observability-trifecta`** — Sentry breadcrumbs + PostHog autocapture/pageview/pageleave + GA4/GTM + Workers Tracing `[observability] enabled = true` + AI Gateway binding
- **Agent-D `a11y-sweep`** — axe 6bp + WCAG 2.2 manual (focus appearance, focus not obscured, dragging, target size, consistent help, redundant entry, accessible auth)
- **Agent-E `performance-sweep`** — fetchpriority on LCP + preload critical fonts/heroes + Speculation Rules + AVIF/WebP/JPEG triplets via Sharp + chunk audit + INP via LoAF
- **Agent-F `content-polish`** — banned-word sweep + citation coverage + microcopy + hyperlink + alt-text + real-photo provenance
- **Agent-G `conversion-cta`** — `data-bcl-*` attrs + sticky CTA + scroll-progress + social proof + testimonials + booking-funnel friction
- **Agent-H `security-hardening`** — CSP Level 3 nonce + Trusted Types + security.txt + Permissions-Policy + COOP/COEP/CORP + OWASP 2025
- **Agent-I `dx-improvements`** — CLAUDE.md freshness + SPEC.md + `e2e/FEATURES.md` + unit-test gap-fill + build-validator additions

3-5 agents per parallel batch. Main thread does foreground edits (CHANGELOG, README, MEMORY) while running.

## Self-critique filter (before shipping)

- Serves project goal? (no=reject)
- Would Brian wish it shipped on PR? (no=reject)
- Beyond "just feels right"? (yes=Recs)
- Requires design conversation? (yes=Recs)
- Sets new precedent (new framework / state lib / auth flow)? (yes=Recs w/ rationale)
- Wall-time >20% over current change? (yes=Recs)

Reject = 🚫 w/ reason · Surface = ⏸ w/ next-prompt language

## Rule-update mandate (SAME TURN)

Per `monitor-orchestration.md` § Follow-up loop, every gap surfaced that's generalizable gets appended to relevant rule SAME TURN. Examples: missing `share_target` in every manifest → `always.md` PWA · missing FAQPage on every content page → `always.md` JSON-LD · missing AI Gateway binding → `auto-meta-work.md`.

## Commonly-forgotten checklist (grep repo, flag misses)

### Manifest + icons

- Manifest `screenshots[]` 3+ form_factor:"wide"|"narrow"
- Manifest `shortcuts[]` 3+
- Manifest `share_target`, `file_handlers`, `protocol_handlers`
- iOS splash images
- `apple-touch-icon` 180×180
- `favicon-16` / `favicon-32` + `.ico` + maskable
- `browserconfig.xml` + Windows tiles

### Social + meta

- OG image 1200×630 BRANDED CARD (≤100KB)
- Twitter Card meta
- `<meta name="color-scheme">`
- `<meta name="theme-color">` light + dark

### Resource hints + critical path

- DNS-prefetch + preconnect for fonts/analytics/CDN
- Font woff2 preload + unicode-range subset
- Speculation Rules `prerender` `eagerness:"moderate"`
- `fetchpriority="high"` on LCP img + preload link

### Discovery

- `security.txt` at `.well-known/`
- `humans.txt`
- `llms.txt` (DX-only, not build gate)
- `robots.txt` per AI crawler (GPTBot, ClaudeBot, Claude-User, Claude-SearchBot, PerplexityBot, Google-Extended, CCBot, Bytespider)
- `sitemap.xml` with `<lastmod>`
- RSS for any blog
- Hreflang per locale + x-default
- Canonical w/ custom hostname

### Structured data

- FAQPage per content page (highest AI citation rate)
- Person schema + `sameAs` for every author
- BreadcrumbList on nested routes
- Organization + LocalBusiness on home
- Service / Product / BlogPosting per page type
- WebSite + SearchAction
- Speakable on FAQ/explainer pages
- ImageObject license + creator on every hero

### PWA + offline

- Kill-switch service worker (unregisters + clears caches)
- `offline.html` shell
- A2HS install prompt
- Push permission UX (deferred ask, not on-load)

### Error boundaries

- Client error boundary + Sentry capture
- Server error boundary + Sentry + structured JSON + requestId

### User-preference media queries

- `prefers-reduced-motion` on every animation
- `prefers-color-scheme` dark + light
- `prefers-contrast: more`
- `forced-colors: active` (Windows High Contrast)
- Print stylesheet

### Discovery extras

- RSS auto-discovery `<link rel="alternate">`
- OpenSearch description doc
- Webmentions endpoint (optional)
- Feed for podcasts/audio

### Compliance

- Structured data testing (Google Rich Results + Schema.org Validator)
- Accessibility statement page
- Privacy + terms updated dates
- Cookie banner if EU traffic
- GDPR data-export endpoint
- DSAR endpoint
- Vendor list page if third parties

## Hard gates (fail run if missed)

- `_audit.md` exists
- `_ideas-100.md` exists w/ exactly 100 entries
- Each entry scored 0-10
- Ship-list (≥7) fully implemented
- Every Hard Gate from `always.md` green
- Every generalizable gap folded into relevant rule SAME TURN
