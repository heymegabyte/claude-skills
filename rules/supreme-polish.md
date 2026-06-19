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

Trigger a 100-point comprehensive audit and multi-agent polish sweep on the full project; fires on polish phrases or automatically every 5th prompt on mature projects.

## Trigger

- Phrase: `pixel ?perfect|meta ?perfect|polish (everything|the whole|all)|audit (the whole|the entire|everything)|100 (ideas|features|improvements|upgrades|enhancements)|make it (perfect|amazing|beautiful)|everything well[- ]integrated|commonly forgotten|every step`
- Auto every 5th prompt on a project touched ≥10 times.
- `monitor-orchestration.md` is the execution shell; this rule is the content brief.

## Output (ALL in one turn)

1. `_audit.md` — full surface inventory + gap analysis.
2. `_ideas-100.md` — exactly 100 ideas across 20 categories, each with rationale + effort + score 0-10.
3. Parallel Agent fan-out implementing every idea ≥7 (per `proactive-improvements.md`).
4. Build + deploy + verify per `verification-loop.md`.
5. Updated `_ideas-100.md` with status: ✅ shipped | ⏸ proposed | 🚫 rejected w/ reason.
6. Cross-link surfaced gap-patterns back into this rule + siblings SAME TURN.

## Surface inventory (audit covers)

- Every `App.tsx` branch + generated static-site route.
- Every Hono mount under `/api/*`.
- `src/shared/*`, `src/data/*`, scripts, migrations.
- Unit + E2E test inventory.
- Integrations: Sentry, PostHog, GA4, Stripe, Square, Resend, Twilio, Turnstile, Clerk, Workers Tracing, AI Gateway, CF bindings.
- Meta-files: manifest, robots, sitemap, humans.txt, security.txt, llms.txt, browserconfig, favicons, OG cards, apple-touch-icon, JSON-LD per route.
- Perf budgets per route; a11y per breakpoint × 6.
- Brand (palette, type, logo, voice); content (banned slop, citations, EEAT, FAQPage density, hyperlink density).
- Secrets + env coverage; deploy + rollback runbook freshness.
- CLAUDE.md, SPEC.md, README, `docs/*`.

## 20 categories (5 ideas each = 100)

1. Visual polish + cinematic motion.
2. Typography + reading rhythm + `clamp()` fluid scales.
3. A11y (WCAG 2.2 AA — all 9 new SC + axe 0).
4. Perf + CWV (LCP/CLS/INP + asset budgets).
5. SEO + structured data (5+ JSON-LD blocks/page incl FAQPage).
6. AI search / GEO (quotable answer, EEAT, llms.txt, citation arrays).
7. Third-party integrations (Sentry, PostHog, GA4, Workers Tracing, AI Gateway, Square+Stripe per `payments-routing.md`).
8. PWA (manifest screenshots + shortcuts + share_target + file_handlers, kill-switch SW, A2HS, push).
9. Forms + trust (Turnstile invisible, Zod, error microcopy, success microcopy, server validation, idempotency).
10. Security (CSP Level 3 strict-dynamic + nonce, Trusted Types, security.txt, OWASP 2025, per `secret-provisioning.md`).
11. Observability (Sentry + PostHog + GA4 + Workers Tracing + AI Gateway all firing, structured logs, requestId, Sentry release tracking).
12. Content polish (anti-slop per `copy-writing.md`, citations per `citations.md`, real-photo audit per `image-quality.md` + `timeline-authenticity.md`).
13. Hyperlink density per `always.md` (every email/phone/address/org/journal linked).
14. Microcopy (errors, empty, loading, success, tooltips, aria-labels).
15. i18n per `i18n-by-demographics.md`.
16. pSEO multipliers (city × service, integration × use-case, comparison, template galleries).
17. Conversion + CRO (sticky CTAs, scroll-progress, exit-intent, social proof, testimonials, urgency without dark patterns, `data-bcl-*`).
18. DX (CLAUDE.md freshness, SPEC.md coverage, `e2e/FEATURES.md`, unit-test coverage, build-validator coverage, type-safety).
19. Resilience (`error-recovery.md`, retry/backoff, idempotency, graceful degradation, rollback runbook, D1 Time Travel).
20. Brand (favicon set, OG 1200×630 BRANDED not scraped, apple-touch-icon, icon contrast per `logo-contrast.md`, color-scheme meta, dark-first audit, text-contrast per `text-contrast.md`).

## Idea scoring (0-10, ship ≥7)

Average of:

- **Risk** — 0=breaks shared infra · 5=isolated · 10=zero-risk.
- **Taste payoff** — 0=invisible · 5=nice · 10=demo-worthy.
- **Effort fit** — 0=days · 5=hours · 10=≤30min.

Thresholds: ≥7 ship inline · 5–6.9 Recs with next-prompt language · <5 reject with reason.

## Parallel fan-out (after `_ideas-100.md`)

Group ship-list into independent batches by file-conflict graph (per `monitor-orchestration.md` § Decomposition). 3-5 agents per batch; main thread handles CHANGELOG/README/MEMORY in foreground.

- **Agent-A `meta-perfect`** — per-route title/desc/canonical/OG/JSON-LD/breadcrumb/FAQPage.
- **Agent-B `pwa-completeness`** — manifest screenshots + shortcuts + share_target + file_handlers + protocol_handlers + iOS splash + Workbox `sw.js` + `offline.html` + kill-switch.
- **Agent-C `observability-trifecta`** — Sentry + PostHog autocapture/pageview/pageleave + GA4/GTM + Workers Tracing `[observability] enabled = true` + AI Gateway.
- **Agent-D `a11y-sweep`** — axe 6bp + WCAG 2.2 manual (focus appearance, focus not obscured, dragging, target size, consistent help, redundant entry, accessible auth).
- **Agent-E `performance-sweep`** — fetchpriority on LCP + preload fonts/heroes + Speculation Rules + AVIF/WebP/JPEG via Sharp + chunk audit + INP via LoAF.
- **Agent-F `content-polish`** — banned-word sweep + citation coverage + microcopy + hyperlink + alt-text + real-photo provenance.
- **Agent-G `conversion-cta`** — `data-bcl-*` + sticky CTA + scroll-progress + social proof + testimonials + booking-funnel friction.
- **Agent-H `security-hardening`** — CSP Level 3 nonce + Trusted Types + security.txt + Permissions-Policy + COOP/COEP/CORP + OWASP 2025.
- **Agent-I `dx-improvements`** — CLAUDE.md freshness + SPEC.md + `e2e/FEATURES.md` + unit-test gaps + build-validator additions.

## Self-critique filter (before shipping)

Reject (🚫 w/ reason) if any: doesn't serve project goal · Brian wouldn't want on PR.

Surface as Recs (⏸ w/ next-prompt language) if any: beyond "just feels right" · requires design conversation · sets new precedent (framework / state lib / auth flow) · wall-time >20% over current change.

## Rule-update mandate (SAME TURN)

Every generalizable gap → append to relevant rule SAME TURN (per `monitor-orchestration.md` § Follow-up loop). Examples: missing `share_target` everywhere → `always.md` PWA · missing FAQPage → `always.md` JSON-LD · missing AI Gateway → `auto-meta-work.md`.

## Commonly-forgotten checklist

### Manifest + icons

- `screenshots[]` 3+ with `form_factor: "wide"|"narrow"`.
- `shortcuts[]` 3+.
- `share_target`, `file_handlers`, `protocol_handlers`.
- iOS splash images; `apple-touch-icon` 180×180.
- `favicon-16` / `favicon-32` + `.ico` + maskable.
- `browserconfig.xml` + Windows tiles.

### Social + meta

- OG image 1200×630 BRANDED (≤100KB).
- Twitter Card meta.
- `<meta name="color-scheme">` and `<meta name="theme-color">` light + dark.

### Resource hints + critical path

- DNS-prefetch + preconnect for fonts/analytics/CDN.
- Font woff2 preload + unicode-range subset.
- Speculation Rules `prerender` `eagerness:"moderate"`.
- `fetchpriority="high"` on LCP img + preload link.

### Discovery

- `security.txt` at `.well-known/`.
- `humans.txt`, `llms.txt` (DX-only, not build gate).
- `robots.txt` per AI crawler: GPTBot, ClaudeBot, Claude-User, Claude-SearchBot, PerplexityBot, Google-Extended, CCBot, Bytespider.
- `sitemap.xml` with `<lastmod>`; RSS for any blog.
- Hreflang per locale + x-default; canonical with custom hostname.

### Structured data

- FAQPage per content page (highest AI citation rate).
- Person schema + `sameAs` for every author.
- BreadcrumbList on nested routes.
- Organization + LocalBusiness on home.
- Service / Product / BlogPosting per page type.
- WebSite + SearchAction; Speakable on FAQ/explainer pages.
- ImageObject license + creator on every hero.

### PWA + offline

- Kill-switch service worker (unregisters + clears caches).
- `offline.html` shell; A2HS install prompt.
- Push permission UX — deferred ask, not on-load.

### Error boundaries

- Client error boundary + Sentry capture.
- Server error boundary + Sentry + structured JSON + requestId.

### User-preference media queries

- `prefers-reduced-motion` on every animation.
- `prefers-color-scheme` dark + light; `prefers-contrast: more`.
- `forced-colors: active` (Windows High Contrast); print stylesheet.

### Discovery extras

- RSS auto-discovery `<link rel="alternate">`.
- OpenSearch description doc; Webmentions endpoint (optional).
- Feed for podcasts/audio.

### Compliance

- Structured data testing (Google Rich Results + Schema.org Validator).
- Accessibility statement page.
- Privacy + terms updated dates; cookie banner if EU traffic.
- GDPR data-export endpoint; DSAR endpoint.
- Vendor list page if third parties.

## Hard gates (fail run if missed)

- `_audit.md` exists.
- `_ideas-100.md` exists with exactly 100 entries, each scored 0-10.
- Ship-list (≥7) fully implemented.
- Every Hard Gate from `always.md` green.
- Every generalizable gap folded into relevant rule SAME TURN.
