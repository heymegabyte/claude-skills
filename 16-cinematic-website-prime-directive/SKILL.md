---
name: "cinematic-website-prime-directive"
description: "One-line-prompt → cinematic, gorgeous, functional, well-tested, deployed website. Pre-hydrated SPA + full PWA kit + JSON-LD rich snippets + third-party integrations. React 19+Vite default (Angular optional). 100 concrete improvements grouped into 10 categories that EVERY single-prompt site build must satisfy before being marked done. Trigger whenever the user says 'make a website for X', 'build a site for X', 'rebuild X.com', or any equivalent one-liner. Overrides earlier defaults — Angular is no longer mandatory; React 19+Vite is the default unless the request explicitly demands Angular or signal-heavy enterprise tooling."
when_to_use: "Any one-line website prompt: 'Make a website for X', 'Build a site for Y', 'Rebuild Z.com', or equivalent. Trumps generic 06-build-and-slice-loop."
paths: ["**/*"]
effort: "xhigh"
model: "inherit"
---

# Cinematic Website Prime Directive

When a one-line prompt arrives ("Make a website for X" / "Build a site for Y" / "Rebuild Z.com"), satisfy all 100 build-breaking rules across the 10 categories below before marking the work done. Anything less is in-progress.

## 1. Cinematic Visual Doctrine (1-10)

1. Dark-first (`#060610` base) with at least one bold accent (`#00E5FF` / `#7C3AED` / `#50AAE3`) — never neutral grey.
2. Fluid `clamp()` type — body 16-19px, display 64-128px, single ratio (1.25-1.333).
3. Typography pairing: Sora + Space Grotesk + JetBrains Mono (variable woff2 subsets preloaded).
4. Layered surfaces: opaque base + semi-transparent panels + glassmorph cards via `backdrop-filter`.
5. OKLCH palette with `color-mix(in oklch, ...)` derived shades — no static rgb tints.
6. `text-wrap: balance` on headings, `text-wrap: pretty` on body — no orphans.
7. One signature motion per page (scroll-driven hero parallax, view-transition page swap, popover anchor).
8. Hero must use AI-generated brand-aligned image, never stock photo placeholder.
9. Asymmetric hero grids, never centered-stack default.
10. Every section pair has clear visual rhythm: dense → breath → dense.

## 2. Pre-Hydrated SPA + Routing (11-20)

11. React 19 + Vite + Tailwind v4 + TanStack Router (default).
12. Astro 5 + React islands for marketing-static-heavy sites.
13. Next.js 15 App Router only when SSR / ISR adds real value.
14. Angular 21 + Ionic + PrimeNG only when user explicitly says "Angular" or signal-heavy enterprise.
15. View Transitions API (`@view-transition { navigation: auto; }`) for SPA page swaps.
16. Selective hydration per island (Astro) or RSC boundaries (Next).
17. Prefetch on link hover via TanStack Router or Astro `prefetch="hover"`.
18. Speculation Rules `<script type="speculationrules">` with `prerender` `eagerness:"moderate"`.
19. Route code-split via `React.lazy` + Vite `manualChunks` — no single chunk > 250KB gz.
20. Static HTML shell prerendered with H1 + meta tags — never script-injected.

## 3. PWA Kit Latest (21-30)

21. `site.webmanifest` with `name`, `short_name`, `description`, `theme_color`, `background_color`, `display:"standalone"`.
22. `screenshots[]` ≥3 entries with `form_factor:"wide"` + `form_factor:"narrow"` for store listings.
23. `shortcuts[]` for top 3 actions, `share_target`, `file_handlers`, `protocol_handlers` where relevant.
24. Maskable icons 192/512 + monochrome notification icon.
25. Workbox v7 service worker: `StaleWhileRevalidate` HTML / JS, `CacheFirst` + `ExpirationPlugin` images.
26. `offline.html` shell with branded copy + link to cached pages.
27. A2HS install banner driven by `beforeinstallprompt` (NOT deprecated — keep) + iOS separate UI.
28. iOS splash via `apple-touch-icon` 180×180 + `apple-touch-startup-image` link tags.
29. iOS Safari 18.4 Declarative Web Push opt-in (PWA-installed only).
30. Kill-switch service worker (unregister + clear caches) deployed as fallback.

## 4. Structured Data + Rich Snippets (31-40)

31. 5+ JSON-LD blocks per route minimum.
32. Always: `WebSite` + `Organization` + `WebPage` + `BreadcrumbList` + `FAQPage`.
33. Page-type add-ons: `LocalBusiness`, `Product`, `BlogPosting`, `HowTo`, `Person`.
34. Author schema (`Person` + `sameAs`) + `dateModified` on every content page (EEAT).
35. JSON-LD facts MUST also appear as visible HTML body text (ChatGPT / Claude don't fetch JSON-LD directly).
36. Validate every route against Google Rich Results Test API before deploy.
37. Schema.org `citation: CreativeWork[]` array for every quantitative claim (boosts AI citation).
38. Itemprop attributes mirror JSON-LD on key elements.
39. No duplicate `@id` across blocks; use stable IRIs.
40. `inLanguage` set on every block; `isAccessibleForFree:true` on public content.

## 5. SEO + AI Search / GEO (41-50)

41. Title 50-60 chars HARD, meta desc 120-156 chars HARD, keyphrase 0.5-3%.
42. OG card 1200×630 ≤100KB BRANDED (not scraped photo).
43. Twitter Card meta on every route.
44. `sitemap.xml` with `<lastmod>` on every URL (no exceptions).
45. `robots.txt` triple-state: explicit Allow OR Disallow per GPTBot, ClaudeBot, Claude-User, Claude-SearchBot, PerplexityBot, Google-Extended, CCBot, Bytespider — never default.
46. `humans.txt`, `.well-known/security.txt`, `browserconfig.xml`, `llms.txt` (OPTIONAL — DX only).
47. Quotable answer blocks 40-60 words per page (LLM citation magnet).
48. `FAQPage` with 5+ Q&A blocks (highest AI citation rate across ChatGPT / Perplexity / AI Overviews).
49. Lead paragraph answers the search query directly in <40 words.
50. Per-route canonical URL (custom hostname when `primary_hostname` set).

## 6. Third-Party Integrations (51-60)

51. GA4 + GTM container snippet (head + noscript fallback).
52. PostHog snippet with `persistence:'memory'` (cookie-free), autocapture on.
53. Sentry `@sentry/cloudflare` v9 + `withSentry` wrapper + OIDC DSN.
54. Workers Tracing `[observability] enabled = true` + OTLP export to Axiom.
55. AI Gateway binding for every LLM call.
56. Turnstile invisible (`data-appearance="interaction-only"`) on every form — NEVER visible.
57. Stripe checkout / Resend transactional email / Clerk auth (M2M JWT) stubs where appropriate.
58. Calendly / Cal.com inline booking when applicable.
59. Google Maps embed via lightweight Maps Embed API, lazy-loaded.
60. Live chat (Crisp / Plain) only when support is a stated goal — otherwise skip. **Cmd+K (`Meta+K` / `Ctrl+K`) opens the AI chat or command palette AND focuses the text input on the same frame** — caret blinking, `autofocus` + `requestAnimationFrame(()=>inputRef.current?.focus({preventScroll:true}))` after open-state flip, re-press = re-focus + `select()`, Esc returns focus to trigger. Playwright build gate: `await page.keyboard.press('Meta+K'); await expect(input).toBeFocused();`.

## 7. Performance + Core Web Vitals (61-70)

61. LCP ≤2.0s (target ≤1.5s for cinematic).
62. CLS ≤0.05 — every image, iframe, ad slot has explicit dimensions.
63. INP ≤100ms (target — 200ms is fail).
64. `fetchpriority="high"` on LCP `<img>` AND its `<link rel="preload">`.
65. AVIF primary + WebP fallback + JPEG legacy — no JPEG XL (10% support).
66. Font woff2 subset with `unicode-range` per script.
67. JS budget ≤200KB gz / route, no single chunk >250KB gz.
68. CSS ≤50KB gz, fonts ≤100KB woff2 preload.
69. Largest image ≤200KB. Hero image ≤150KB.
70. Long Animation Frames API instrumented for INP debugging.

## 8. Accessibility WCAG 2.2 AA (71-80)

71. axe-core 0 violations at all 6 breakpoints (375, 390, 768, 1024, 1280, 1920).
72. Color contrast ≥4.5:1 body, ≥3:1 large text + UI components.
73. Target size ≥24px (2.5.8 — axe auto-tests).
74. Focus appearance (2.4.11) visible at every interactive element — manual review.
75. Focus not obscured (2.4.12 / 13) — sticky headers must not clip focused element.
76. Dragging alternative (2.5.7) — every drag has a click / tap equivalent.
77. Consistent help (3.2.6) — contact info / help link in same location every page.
78. Redundant entry (3.3.7) — never re-ask info already given.
79. Accessible auth (3.3.8 / 9) — no cognitive-test CAPTCHA; offer passkeys.
80. Lighthouse a11y ≥95.

## 9. Testing + Verification (81-90)

81. Playwright E2E 6bp covering homepage → key flow → conversion.
82. Tests start at homepage, navigate by clicking nav (never `page.goto` for internal).
83. Vitest 3 unit tests for utilities + Zod schemas.
84. Lighthouse CI: Perf ≥90, A11y ≥95, BP ≥95, SEO ≥95.
85. AI vision QA ≥9/10 per route (use visual-qa agent with Opus 4.7).
86. Percy AI Visual Review for full-page regression.
87. Yoast GREEN on every content page.
88. Build validator: every internal asset resolves, every hyperlink valid, every quantitative claim cited.
89. CSP report-uri capturing violations during E2E.
90. `wrangler tail` clean during smoke tests (no Worker errors).

## 10. Deploy + Observability + Done (91-100)

91. Atomic deploy via Workers Builds (preferred) or `wrangler deploy` + version metadata.
92. Gradual deployment (1% → 10% → 100%) with auto-rollback on error rate spike.
93. CDN purge paired with every deploy.
94. `/health` endpoint returns `{status, version, timestamp}`.
95. D1 backups: Time Travel 30-day PIT + R2 long-term archive.
96. `secrets.required` validated at deploy.
97. Self-Verify Statement written per route (URL + smoke test result + 3 screenshots).
98. Sentry / PostHog / Workers Tracing / AI Gateway / GA4 all firing — verify in dashboard.
99. Browser console: zero errors, zero CSP violations, zero failed resources.
100. DONE = deployed at a real URL + every Hard Gate green + Self-Verify per route + announced.

Anything less than all 100 is in-progress. No exceptions.

## 11. Source-Site Enhancement (101-110 — ***fires when prompt names an existing domain***)

101. **Phrase detect** — "rebuild | optimize | enhance | modernize | recreate | clone | better version of {domain}" OR bare-domain prompt where domain resolves 200 = enhancement mode. Output = `union(SOURCE_URLS, STANDARD_PAGE_SET[org_type], DEMOGRAPHIC_LOCALES, JEWELS) − CRUFT_URLS`. Never source-floor, never homepage-only. See `rules/source-site-enhancement.md`.

102. **Crawl FIRST** — `sitemap.xml → robots.txt → HTML BFS → Wayback fallback → CMS index endpoints (Squarespace /config/pages, WP wp-sitemap-posts-*.xml, Wix _api/v1/sitemap.xml)` → `_url_inventory.json`. Every URL classified `keep | merge | 301 | drop`. Sample for njsk.org: 182 source URLs → 8 keep + 50 random-slug → canonical 301s + 9 dead-page 301s + 115 blog kept.

103. **Org-type page-set floor** per `15-site-generation/page-set-expansion.md`:
   - nonprofit = 14 standard + 10 jewels (`/annual-report | /financials | /planned-giving | /ways-to-give | /parish-toolkit | /partners | /press | /testimonials | /alumni | /transcript`)
   - saas = 10 + 8
   - local = 12 + 8
   - portfolio = 5 + 6
   - church = 10 + 6
   - gov = 12 + 5
   - edu = 12 + 6
   - healthcare = 12 + 6
   - legal = 10 + 6
   - Source omissions = build opportunities, not excuses

104. **Demographic i18n auto-trigger** per `rules/i18n-by-demographics.md` — ACS B16001 lookup on service-area; every language ≥10% community share = full locale route mirror at `/{locale}/*`. Newark NJ → `en|es|pt`; Miami → `en|es|ht`; LA → `en|es|zh|ko|tl`. English stays unprefixed at `/`. hreflang cross-references mandatory on every page.

105. **IA normalize** — `/home → /`, `/our-mission | /our-mission-1 → /about`, `/our-team | /staff → /team`, `/health-clinic → /services/health-clinic` (flat → nested with `/services` index), `/new-page-* | /testpage | /-1 | /-2` → drop, Squarespace random-ID slugs `/blog/2019/.../[a-f0-9]{20,}` → `/blog/{semantic-slug-from-title}`. Every change emits `_redirects` 301.

106. **Jewel content authority — never stub**:
   - `/financials` pulls Form 990 via Candid API + Charity Navigator badge
   - `/annual-report` pulls 990 + Wayback + scraped impact stats
   - `/planned-giving` ships bequest language + IRA-QCD + DAF + stock-transfer instructions
   - `/parish-toolkit` ships bulletin-insert PDFs + sermon outlines + donation-drive guides
   - `/partners` pulls partner-org logos with verification + `<picture>` grayscale → color hover
   - `/press` scrapes news mentions + Newspapers.com archive
   - `/transcript` runs Whisper on every audio / video asset
   - Every quantitative claim APA-cited

107. **Service hierarchy nesting** — flat `/health-clinic | /the-mens-dining-hall-1 | /women-childrens-center` → nested `/services/health-clinic | /services/mens-dining-hall | /services/womens-center` with `/services` index aggregator listing all + cross-linking. Slug rename emits 301 from old flat path.

108. **Squarespace dedupe** — JSON API returns BOTH canonical + random-ID for every post — keep canonical, drop random-ID, emit 301. Wix `_compiler/page-data` dupes + WordPress `?p=123` permalinks handled same way. Hard gate: zero `/blog/\d{4}/\d{1,2}/\d{1,2}/[a-f0-9]{20,}` patterns surviving into deploy.

109. **Hard gate page-count** — deployed `route_count >= keep_count + standard_set + jewels + locale_count × (keep + standard + jewels)`. For Newark nonprofit with 8 keep + 14 standard + 10 jewels + 3 locales + 129 blog = ~474 routes minimum. Build fails with `_route_inventory_gap.json` listing every missing route. Reference: `njsk-org.manhattan.workers.dev` = 208 routes in sitemap.

110. **One-prompt success definition** — `re(build|optimize|enhance) X.com` produces a deployed site where (a) every source URL resolves to live content OR 301, (b) every standard-page-set entry exists with real content, (c) every demographic locale has full route mirror, (d) every jewel page exists with researched + cited content, (e) IA normalized + cruft 301'd + slugs deduped. Anything less = the prompt failed, not the rebuild.

   **MONITOR-FIRE mandate** — rebuild prompts are multi-faceted by definition (≥7 independent work units) — MUST fire `[[monitor-orchestration]]` pattern on FIRST tool-call message with parallel `Agent` spawns per `[[source-site-enhancement]]` § Parallel-agent playbook (crawler + demographics + org-type-inferrer + media-walker + brand-extractor + jewel-content-authors batch + i18n-translators per locale + IA-normalizer + Squarespace-dedup, all in ONE multi-tool message). Serial main-thread execution = build fail; user-issuing-follow-up-prompt = monitor-orchestration shortcoming-signal that MUST be logged to `[[monitor-orchestration]]` § Known shortcomings BEFORE the work proceeds (same turn, never deferred).

Reference incident (***2026-05-21 — njsk.org enhancement gap***) — user issued `create an optimized version of njsk.org`. Source Squarespace ships 8 unique non-blog routes + 50 random-slug blog dupes + 9 dead pages + ZERO i18n + ZERO jewels. Optimized clone at `njsk-org.manhattan.workers.dev` ships 8 + 14 + 10 = 32 unique routes × `en + es + pt` + 129 cleaned blog slugs + 50+ Squarespace 301s + 9 dead-page 301s = ~210 total. Single-prompt result MUST match this scope. Previous gap: produced homepage-only or source-floor; ≥30 follow-up prompts to assemble the jewels manually. Fixed via rules 101-110 + `rules/source-site-enhancement.md` + `rules/i18n-by-demographics.md` + `15-site-generation/page-set-expansion.md`.
