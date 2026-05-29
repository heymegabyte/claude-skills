# Supreme Polish + 100-Ideas Audit (***SUPREME — fires on every "pixel-perfect|meta-perfect|polish|audit|100 ideas|make it perfect|everything|the whole project" prompt + EVERY 5th prompt on a mature project***)

## Trigger
- Phrase detect: `pixel ?perfect|meta ?perfect|polish (everything|the whole|all)|audit (the whole|the entire|everything)|100 (ideas|features|improvements|upgrades|enhancements)|make it (perfect|amazing|beautiful)|everything well[- ]integrated|commonly forgotten|every step` ⇒ this rule fires
- ALSO auto-fires every 5th prompt on a project that's been touched ≥10 times (maturity threshold = polish window)
- The Monitor pattern from [[monitor-orchestration]] is the execution shell; this rule is the **CONTENT brief** — what to audit + ideate + ship

## Output shape (***NON-NEGOTIABLE — every supreme-polish prompt produces ALL of these in one turn***)
1. `_audit.md` written to repo root — full surface inventory + gap analysis
2. `_ideas-100.md` written to repo root — exactly 100 ideas across the 20 categories below, each with rationale + effort estimate + "just-feels-right" score 0-10
3. Parallel Agent fan-out to IMPLEMENT every idea scoring ≥7 (the "just-feels-right" threshold per [[proactive-improvements]])
4. Build + deploy + verify per [[verification-loop]]
5. Updated `_ideas-100.md` with implementation status (✅ shipped | ⏸ proposed | 🚫 rejected with reason)
6. Cross-link the surfaced gap-patterns back into this rule + sibling rules so the gap is caught at decomposition time on the next project

## Surface inventory (***the audit half — covers everything***)
- Static-site routes (every `App.tsx` branch + every generated page)
- Worker routes (every Hono mount under `/api/*`)
- Shared libs (`src/shared/*`)
- Data sources (`src/data/*`)
- Scripts (`scripts/*` — generators + validators)
- Migrations (`migrations/*`)
- Tests (unit + E2E inventory)
- Third-party integrations (Sentry, PostHog, GA4, Stripe, Square, Resend, Twilio, Turnstile, Clerk, Workers Tracing, AI Gateway, Cloudflare bindings)
- Meta-files (manifest, robots, sitemap, humans.txt, security.txt, llms.txt, browserconfig, favicons, OG cards, apple-touch-icon, JSON-LD blocks per route)
- Performance budgets per route
- A11y audit per breakpoint × 6
- Brand consistency (palette, type, logo, voice)
- Content audit (banned slop words, citation coverage, EEAT signals, FAQPage schema density, hyperlink density)
- Secrets + env coverage
- Deploy + rollback runbook freshness
- Docs (CLAUDE.md, SPEC.md, README, docs/*)

## THE_20_CATEGORIES (***ideate 5 ideas per category to reach 100; never collapse categories***)
1. Visual polish + cinematic motion
2. Typography + reading rhythm + clamp() fluid scales
3. Accessibility (WCAG 2.2 AA — all 9 new criteria + axe 0 violations)
4. Performance + Core Web Vitals (LCP/CLS/INP + asset budgets)
5. SEO + structured data (5+ JSON-LD blocks/page incl. FAQPage)
6. AI search / GEO (quotable answer blocks, EEAT, llms.txt, citation arrays)
7. Third-party integrations (Sentry breadcrumbs, PostHog captures, GA4 events, Workers Tracing spans, AI Gateway, Square+Stripe routing per [[payments-routing]])
8. PWA (manifest screenshots + shortcuts + share_target + file_handlers, kill-switch SW, A2HS, push)
9. Forms + trust (Turnstile invisible, Zod, error microcopy, success microcopy, server-side validation, idempotency)
10. Security (CSP Level 3 strict-dynamic + nonce, Trusted Types, security.txt, OWASP 2025 top 10, secret hygiene per [[secret-provisioning]])
11. Observability (Sentry + PostHog + GA4 + Workers Tracing + AI Gateway all firing, structured logs, requestId, Sentry release tracking)
12. Content polish (anti-slop sweep per [[copy-writing]], citations per [[citations]], real-photo audit per [[image-quality]] + [[timeline-authenticity]])
13. Hyperlink density per [[always]] (every email/phone/address/org/journal linked)
14. Microcopy (errors, empty states, loading states, success states, tooltips, aria-labels)
15. i18n where demographics demand it per [[i18n-by-demographics]]
16. pSEO multipliers (city × service, integration × use-case, comparison pages, template galleries)
17. Conversion + CRO (sticky CTAs, scroll-progress, exit-intent, social proof, testimonials, urgency without dark patterns, phone_click/booking_click `data-bcl-*` attrs)
18. Developer experience (CLAUDE.md freshness, SPEC.md coverage matrix, e2e/FEATURES.md inventory, unit-test coverage, build-validator coverage, type-safety)
19. Resilience (error-recovery per [[error-recovery]], retry/backoff, idempotency, graceful degradation, rollback runbook, D1 Time Travel familiarity)
20. Brand surfaces (favicon set, OG cards 1200×630 branded NOT scraped, apple-touch-icon, install-prompt icon contrast per [[logo-contrast]], color-scheme meta, dark-first audit, accent-on-dark text-contrast per [[text-contrast]])

## Idea scoring rubric (***0-10, ship the ≥7***)
Average of three dimensions:
- **Risk**: 0 = breaks shared infra, 5 = isolated, 10 = zero-risk
- **Taste payoff**: 0 = invisible to user, 5 = nice, 10 = demo-worthy
- **Effort fit**: 0 = days, 5 = hours, 10 = ≤30min

Action:
- Score ≥7 = ship inline
- 5-6.9 = surface in Recs with one-line rationale + concrete next-prompt language
- <5 = reject with reason in `_ideas-100.md`

## Parallel-fan-out pattern (***fires immediately after `_ideas-100.md` written***)
Per [[monitor-orchestration]] § Decomposition, group the ship-list into independent batches by file-conflict graph. Canonical groupings:

- **Agent-A `meta-perfect`** — per-route title/desc/canonical/OG/JSON-LD/breadcrumb/FAQPage audit + fixes (touches `index.html` + page generators + `scripts/validate-route-metadata.mjs`)
- **Agent-B `pwa-completeness`** — manifest screenshots + shortcuts + share_target + file_handlers + protocol_handlers + iOS splash + Workbox `sw.js` + `offline.html` + kill-switch
- **Agent-C `observability-trifecta`** — Sentry breadcrumbs on every risky op + PostHog autocapture + capture_pageview + capture_pageleave + GA4/GTM snippet + Workers Tracing `[observability] enabled = true` + AI Gateway binding (touches worker entry + `index.html` + `wrangler.jsonc`)
- **Agent-D `a11y-sweep`** — axe-core 6bp run + fix every violation + WCAG 2.2 manual-review surfaces (focus appearance, focus not obscured, dragging, target size, consistent help, redundant entry, accessible auth)
- **Agent-E `performance-sweep`** — fetchpriority on LCP + preload critical fonts/heroes + Speculation Rules + AVIF/WebP/JPEG triplets via Sharp + chunk-size audit + INP debugging via Long Animation Frames
- **Agent-F `content-polish`** — banned-word sweep + citation coverage + microcopy audit + hyperlink density audit + alt-text audit + real-photo provenance audit
- **Agent-G `conversion-cta`** — `data-bcl-*` attrs + sticky CTA + scroll-progress + social proof + testimonials + booking-funnel friction audit
- **Agent-H `security-hardening`** — CSP Level 3 nonce + Trusted Types + security.txt + Permissions-Policy + COOP/COEP/CORP + OWASP 2025 scan
- **Agent-I `dx-improvements`** — CLAUDE.md freshness + SPEC.md coverage + `e2e/FEATURES.md` row-per-feature + unit-test gap-fill + build-validator additions

Fire 3-5 agents per parallel batch (never serialize what can parallelize per [[full-autonomy]]). Main thread does foreground edits (CHANGELOG, README index, MEMORY.md) while agents run.

## Self-critique filter (***rejection criteria — apply to every idea BEFORE shipping***)
- Does this serve the project goal? (no = reject)
- Would Brian wish it shipped on the PR? (no = reject)
- Is the change beyond the "just feels right" surface? (yes = surface in Recs, don't ship)
- Does it require a design conversation? (yes = surface in Recs)
- Does it set a new precedent (new framework / new state lib / new auth flow)? (yes = surface in Recs with one-line rationale)
- Is the wall-time >20% over the current change? (yes = surface in Recs)

Marking:
- Reject = 🚫 with reason in `_ideas-100.md`
- Surface = ⏸ with concrete next-prompt language

## Rule-update mandate (***SAME TURN, NOT NEXT***)
Per [[monitor-orchestration]] § Follow-up shortcoming feedback loop, every gap surfaced during the audit that is also a generalizable pattern (e.g., "no project has X yet and they all should") gets appended to the relevant rule in the SAME turn.

Examples:
- Missing `share_target` in every manifest ⇒ append to [[always]] PWA section
- Missing FAQPage on every content page ⇒ append to [[always]] JSON-LD section
- Missing AI Gateway binding ⇒ append to [[auto-meta-work]] analytics-auto-provision list

Per [[brian-preferences]] "How to improve? → always find 50 more things, explore every branch, never cap effort" — the supreme-polish rule itself accretes from every supreme-polish run.

## Commonly-forgotten checklist (***the menu — grep against repo, flag every miss***)

### Manifest + icons
- Manifest `screenshots[]` 3+ form_factor:"wide"|"narrow"
- Manifest `shortcuts[]` 3+ entries
- Manifest `share_target`
- Manifest `file_handlers`
- Manifest `protocol_handlers`
- iOS splash images
- `apple-touch-icon` 180×180
- `favicon-16` / `favicon-32` + `.ico` + maskable icons
- `browserconfig.xml` + Windows tiles

### Social + meta
- OG image 1200×630 BRANDED CARD (not raw photo, ≤100KB)
- Twitter Card meta
- `<meta name="color-scheme">`
- `<meta name="theme-color">` light + dark variants

### Resource hints + critical path
- DNS-prefetch + preconnect for fonts/analytics/CDN
- Font woff2 preload + unicode-range subset
- Speculation Rules `prerender` `eagerness:"moderate"`
- `fetchpriority="high"` on LCP img + preload link

### Discovery files
- `security.txt` at `.well-known/`
- `humans.txt`
- `llms.txt` (DX-only, not a build gate)
- `robots.txt` explicit Allow/Disallow per AI crawler (GPTBot, ClaudeBot, Claude-User, Claude-SearchBot, PerplexityBot, Google-Extended, CCBot, Bytespider)
- `sitemap.xml` with `<lastmod>` on every URL
- RSS feed for any blog
- Hreflang per locale + x-default
- Canonical on every page using custom hostname

### Structured data
- FAQPage JSON-LD on every content page (highest AI citation rate)
- Person schema with `sameAs` for every author
- BreadcrumbList on every nested route
- Organization + LocalBusiness JSON-LD on home
- Service / Product / BlogPosting per page type
- WebSite + SearchAction sitelinks search box
- Speakable JSON-LD on FAQ/explainer pages
- ImageObject license + creator on every hero

### PWA + offline
- Kill-switch service worker (unregisters + clears caches if SW removed)
- `offline.html` shell
- A2HS install prompt
- Push-notification permission UX (deferred ask, not on-load)

### Error boundaries
- Client error boundary + Sentry capture
- Server error boundary + Sentry + structured JSON log + requestId

### User-preference media queries
- `prefers-reduced-motion` on every animation
- `prefers-color-scheme` dark + light audit
- `prefers-contrast: more` audit
- `forced-colors: active` audit (Windows High Contrast)
- Print stylesheet

### Discovery extras
- RSS auto-discovery `<link rel="alternate">`
- OpenSearch description doc
- Webmentions endpoint (optional)
- Feed for podcasts/audio if applicable

### Compliance
- Structured data testing via Google Rich Results Test API + Schema.org Validator
- Accessibility statement page
- Privacy policy + terms updated dates
- Cookie banner if EU traffic
- GDPR data-export endpoint
- DSAR endpoint
- Vendor list page if using third parties

## HARD_GATES (***fail the run, do not declare DONE***)
- `_audit.md` exists
- `_ideas-100.md` exists with exactly 100 entries
- Each entry has score 0-10
- Ship-list (≥7) is fully implemented
- Every Hard Gate from [[always]] still green
- Every gap that's also a generalizable pattern is folded back into the relevant rule in the same turn

Anything less = supreme-polish run failed, not "good enough".

## See
- [[competitor-research]] — on website builds, the 100-ideas audit ranks ideas by "closes gap vs `_competitor_aggregate.json` MAX-per-dimension". An idea that closes a competitor gap > a generic polish idea. The audit feeds Phase 6 loop iterations until the competitor-beat gate passes
- [[monitor-orchestration]] — Monitor pattern is the execution shell
- [[proactive-improvements]] — the "just feels right" criterion in lighter form; supreme-polish is the heavyweight version
- [[always]] — the per-page Hard Gates that every audit measures against
- [[verification-loop]] — deploy + E2E mandate on every supreme-polish run
- [[auto-meta-work]] — Sentry + PostHog + GA4 + Tracing + AI Gateway auto-provision
- [[source-site-enhancement]] — when a rebuild prompt fires, supreme-polish fires concurrently on the rebuilt surface
- [[brian-preferences]] — never cap effort — explore every branch — find 50 more things
- [[full-autonomy]] — parallel-agent discipline
- [[copy-writing]] + [[citations]] + [[image-quality]] + [[timeline-authenticity]] + [[text-contrast]] + [[logo-contrast]] — the content-polish and brand-surface specifics
