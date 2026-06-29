---
last_reviewed: 2026-06-29
superseded_by: null
name: "proactive-improvements"
priority: 2
pack: "core"
triggers: []
paths:
  - "*"
---

# Proactive Improvements

After every edit, ask: "Is there an obvious improvement — polish, fix, accessibility, performance, SEO, analytics, copy, security, DX — that a senior would fold into the same PR without a separate ticket?" If yes and it "just feels right" (low risk, no design conversation, no days of work), implement it inline.

Bar: **would Brian wish I had just done this when he opens the PR?**

## WHEN_TO_FIRE

- Editing a component → fix nits in same file: deprecated API, missing aria, dead import, off-brand copy, missing `data-bcl-*` attr, hardcoded color, magic number.
- New route → add sitemap entry, OG card, JSON-LD, breadcrumb, mobile-first layout, analytics CTA wiring.
- After build → fix ORANGE/yellow 1-line meta-desc warnings in this turn.
- After sweep test → fix known-class failures (auth-fetch hang, useEffect-without-abort) in this turn.
- After writing a PDF/image/artifact → polish rough edges (cramped layout, missing logo, wrong palette, bad typography, missing QR, contact gap, banned copy).
- After deploy → adjust CSP/cache/Content-Disposition/X-Frame-Options/canonical/hreflang in `_headers` in same turn.
- After landing a feature → add `MEMORY.md` entry, `CLAUDE.md` update, `e2e/FEATURES.md` row, unit test, Sentry breadcrumb, PostHog capture, analytics attr, OpenAPI block as applicable.
- Typo, slop word, off-brand phrase, dead link, broken alt, missing image, double-tap-target, contrast issue → fix.
- Dead code, commented-out blocks, deprecated deps, `console.log`, resolvable TODO → clean.

## WHAT_TO_DO_PROACTIVELY

**Visual polish** — `rounded-lg|2xl`, `border-l-2 border-brand-accent` rail, hairline dividers, `font-mono uppercase tracking-wider text-brand-accent` eyebrow, gradient backdrops (`bg-gradient-to-br from-brand-accent/8`), focus-visible rings, `@starting-style` enter animations, `prefers-reduced-motion`.

**Accessibility** — `aria-label`, `aria-describedby`, `aria-keyshortcuts`, `role="dialog"` + `aria-modal`, focus traps, keyboard handlers, skip-link target, alt text, contrast bumps, `min-h-[44px]` tap targets, `prefers-color-scheme: dark` audit.

**Performance** — `loading="lazy"` on non-LCP images, `fetchpriority="high"` on LCP, `decoding="async"`, `<link rel="preload">` for critical fonts/heroes, `useMemo`/`useCallback` on hot paths, debounce on search, AbortController on fetch effects, Speculation Rules for likely-next nav.

**SEO** — per-route title 50-60 chars + desc 120-156, canonical, `og:image`, JSON-LD per page type (WebPage + BreadcrumbList + FAQPage + Service + LocalBusiness as applicable), hreflang on locale mirrors, sitemap entry, `noindex` on thin pages.

**Analytics + observability** — `data-bcl-*` on every CTA (phone, sms, schedule, quote, share, download), PostHog capture on key moments, Sentry breadcrumb before risky ops, GA4 event, Workers Tracing span, AI Gateway metadata on every LLM call.

**Copy** — drop banned slop words (per `copy-writing`), tighten desc 100-160 chars, replace passive voice, swap stat claims for cited numbers, drop em-dash overuse, add action-verb CTAs.

**Security** — validate at boundaries, rate-limit public endpoints, Turnstile on forms, never log raw tokens, parameterized SQL via Drizzle, `content-disposition` + X-Frame-Options on downloads, CSP audit when new domains appear.

**DX + maintenance** — short JSDoc on intent, update CLAUDE.md on stack-pattern shift, unit test any new pure function, update `e2e/FEATURES.md` on feature land, remove `console.log` + unused imports.

## WHEN_NOT_TO_FIRE

- Change requires a real design conversation (sidebar vs. modal, opinionated default) → flag in Recs.
- Touches shared infrastructure affecting other work (DB migrations, env-var renames, route 301s) → flag first.
- Sets new codebase precedent without buy-in (new state lib, CSS framework, test framework, auth flow).
- Proactive bit adds >20% wall-time to current change → finish current change, surface in Recs.
- "Just feels right" is actually "I want to flex" — the bit must serve user's apparent intent, not agent preferences.
