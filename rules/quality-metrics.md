---
name: "quality-metrics"
priority: 2
pack: "testing"
triggers:
  - "lighthouse"
  - "perf"
  - "quality"
paths:
  - "*"
---

# Quality Thresholds

## Readability

- Flesch ≥ 60
- Sentences ≤ 25 words
- Paragraphs ≤ 150 words

## Performance

- LCP ≤ 2.5s (4-phase: TTFB → load delay → load time → render delay)
- CLS ≤ 0.1
- **INP ≤ 200ms** (3-phase: input delay → processing → presentation delay)
- 43% of sites fail INP — strict ≤ 100ms is the cinematic target
- Worker CPU ≤ 50ms p99 (free tier 10ms CPU cap; paid 30s wall + 50ms CPU default, configurable to 5min)
- Debug INP via **Long Animation Frames API** (`PerformanceObserver` type:`long-animation-frame`, web-vitals v4+ `longAnimationFrameEntries`)
- For SPA per-route CWV use **Soft Navigations API** (`softNavs:true` in web-vitals v4+)

## Budgets

- JS ≤ 200KB gz total/route
- No single chunk > 250KB gz (code-split React.lazy + manualChunks)
- CSS ≤ 50KB gz
- Fonts ≤ 100KB woff2 preload + unicode-range subset
- Images ≤ 500KB total, largest image ≤ 200KB
- PNG > 200KB → re-encode **AVIF primary** (20-30% smaller than WebP, 94% browser support) + WebP fallback + JPEG legacy
- Drop JPEG XL (10% support)
- og-image 1200×630 ≤ 100KB BRANDED CARD (not raw photo)
- apple-touch-icon 180×180 mandatory
- WebSocket payload up to 32 MiB (CF Workers + DOs, 2025-10-25)
- JSRPC payload up to 32 MiB

## A11y

- axe-core 0 violations — but **axe 0 ≠ AA conformance** (it auto-tests only 2.5.8 of the 9 new WCAG 2.2 SC, ~57% of issues by volume). Green axe is necessary, never sufficient.
- Lighthouse ≥ 95
- Contrast ≥ 4.5:1
- Target size ≥ 24px (WCAG 2.2 2.5.8 — the one criterion axe auto-tests)
- Focus Not Obscured (2.4.11, AA) — focused element never hidden behind sticky headers/footers
- **Manual review REQUIRED** (axe can't detect): 2.4.11 Focus Not Obscured (AA), 2.4.13 Focus Appearance (AAA), 2.5.7 Dragging (AA), 3.2.6 Consistent Help, 3.3.7 Redundant Entry, 3.3.8 Accessible Auth (AA). Run this checklist every a11y pass.

## Code

- Functions ≤ 50 lines
- Cyclomatic ≤ 10
- Params ≤ 3

## Security

### Required headers

- HSTS
- CSP Level 3 (strict-dynamic + per-response random nonce, never reused)
- Trusted Types (DOM-XSS prevention)
- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy
- Permissions-Policy
- COOP
- COEP
- CORP

### Remove

- X-XSS-Protection
- Expect-CT
- HPKP

### Cookies + integrity

- **CHIPS** — set `Partitioned` on any cross-site cookie (OAuth iframe, embedded widget) or the session silently breaks under third-party-cookie partitioning. Safari ignores the attribute but partitions independently; Firefox partitions via Total Cookie Protection — test all three.
- **SRI** — `integrity` (SHA-384) + `crossorigin="anonymous"` on every externally-hosted `<script>`/`<link rel="stylesheet">`; pair with CSP `require-sri-for script style`. Not applied to dynamically-injected scripts — guard those separately.
- **CSP reporting** — emit BOTH `report-to` AND `report-uri` until report-to has universal support; Trusted Types is Chromium-full / Firefox+Safari-partial.

## SEO strict

- Title 50-60 chars HARD
- Meta desc 120-156 chars HARD
- Keyphrase 0.5-3%
- JSON-LD per page only when accurate; never pad. WebPage is the floor; add Organization/BreadcrumbList/FAQPage/Person/Product/Service ONLY when they describe real entities on the page
- FAQPage only when real Q&A exists on the page. Don't fabricate Q&A to add the schema
- Exactly 1 H1 in HTML shell (prerender, NOT script-injected)
- Every internal asset ref resolves to real file in build output
- `sitemap.xml` every `<url>` has `<lastmod>`
- Canonical uses custom hostname when `primary_hostname` set
- `color-scheme` meta present
- JSON-LD claims should match visible content (don't lie via schema)
- Person + `sameAs` on author pages when there's a real author bio
- BreadcrumbList on multi-level routes (≥2 segments deep)

## Animation

- transform/opacity only
- `prefers-reduced-motion` on all
- `will-change` sparingly
- Scroll-driven off main thread (Chrome stable, Safari 26+, Firefox unsupported — pair with `prefers-reduced-motion` AND `animation-duration:1ms` Firefox fallback)

## CSS

- Cascade layers (`@layer reset, base, components, utilities`)
- Container queries for components (Baseline Widely Available 2025)
- `:has()` for parent selection (Baseline Newly Available)
- Native nesting
- View Transitions (same-document SPA / cross-document MPA both `@view-transition { navigation: auto; }`)
- Anchor Positioning (Chrome/Edge 133+ stable, Firefox late 2025, polyfill v0.7+ for Safari)
- Popover API (Baseline Newly Available)
