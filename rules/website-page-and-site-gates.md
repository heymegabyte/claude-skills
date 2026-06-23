---
name: "website-page-and-site-gates"
priority: 2
pack: "website-build"
triggers:
  - "build a website"
  - "every page"
  - "every site"
  - "page gates"
  - "site gates"
paths:
  - "org:website_build"
---

# Website Page & Site Gates

> Numeric stats + first-load animation → `[[cinematic-ui-patterns]]` (`<app-rolling-counter>` + `appReveal` mandatory on every projectsites.dev surface).

## Every page

- Keyphrase FIRST
- Title 50–60 chars
- Meta desc 120–156 chars
- One H1 in HTML shell (prerender)
- Canonical
- **`<head>` AND `<body>` content MUST be server-rendered per-route, NEVER client-only.**
  - Client `PageHead`/Helmet (post-hydration) is invisible to Googlebot/ChatGPT/Perplexity/social scrapers.
  - Client SPA serves empty `<div id="root">` → crawlers see NO page content. Use `vite-ssg`/SSR so raw-HTTP body holds real H1 + copy per route.
  - Non-prerendered routes falling back to one `index.html` collapse whole site to one indexable URL with homepage title + `canonical=/`.
  - Fix: Worker `HTMLRewriter` keyed on `getMeta(pathname)` rewrites title/desc/og/twitter/canonical/`<html lang>` per route.
  - Gate: RAW-HTTP `curl` (no JS) must show the page's H1 + body text. Incident: njsk.org pass-10 (site-wide `canonical=/` on all 32 routes).
- JSON-LD per page only when accurate. WebPage is floor; add Organization/BreadcrumbList/FAQPage/Person/Product/Service ONLY when describing real entities. Never pad.
  - **MUST be server-rendered in raw HTML — NEVER client-injected only.** Gate: RAW-HTTP `curl` must show `<script type="application/ld+json">` per route.
- FAQPage only when real Q&A exists. Never fabricate.
- OG 1200×630 ≤100KB **branded card** (NOT scraped photo)
- 2+ internal links, 1+ outbound
- Yoast GREEN
- `<meta name="color-scheme">` present
- DNS-prefetch + preconnect for fonts/analytics
- Font woff2 preload for primary display + body
- Speculation Rules prerender when navigation dominant (multi-page funnels, doc sites). Skip on landing where analytics integrity matters — prerender double-counts GA4 pageviews + can fire conversions before user interaction.
- `fetchpriority="high"` on LCP `<img>` AND its preload link

## Every site (REQUIRED)

- `site.webmanifest` w/ `screenshots[]` 3+ form_factor:"wide"|"narrow", `shortcuts[]`, `share_target`, `file_handlers`, `protocol_handlers`
- `robots.txt` — split AI crawlers by purpose, never blanket-block:
  - **Allow (search/retrieval)**: `OAI-SearchBot`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`
  - **Disallow (training-only)**: `GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, `CCBot`, `Bytespider`
  - Explicit `Allow`/`Disallow` per UA — never default
  - **Cloudflare gotcha**: CF "AI Audit / Managed robots.txt" edge-injects `# BEGIN Cloudflare Managed content` block ABOVE origin robots.txt (`ai-train=no`, training-bot disallow). Origin that also allows/disallows the same bots = contradictory duplicates → undefined crawler behavior. Fix: reconcile origin to agree with managed block, or disable CF managed feature. Always `curl` the LIVE robots.txt. Incident: music.megabyte.space 2026-06-10.
- `humans.txt`
- `sitemap.xml` — every `<url>` has `<lastmod>`
  - **`<lastmod>` MUST reflect when the URL's content changed, NOT build time.** Stamping `TODAY` on every build → Google stops trusting the field (developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping).
  - Fix: committed `{ url: { hash, lastmod } }` store — preserve stored date while hash unchanged, bump to today only on new/changed URL. Single-writer per URL. Gate: raw `<lastmod>${TODAY}</lastmod>` inside `<url>` must not reappear.
  - Reference impl: brickcitylabor `scripts/lib/sitemap-lastmod.mjs`.
- `browserconfig.xml`
- `.well-known/security.txt`
  - **Cloudflare gotcha**: CF account-level managed `security.txt` edge-serves across EVERY zone, shadowing any `public/.well-known/security.txt` — repo file NEVER serves. Edit the **account security.txt dashboard setting**, not the asset; keep repo copy reconciled or delete it. Always `curl` the LIVE security.txt. Incident: pdf.megabyte.space 2026-06-12.
- `favicon.ico` + `favicon-16x16.png` + `favicon-32x32.png`
- `apple-touch-icon.png` (180×180)
- OG image
- Kill-switch service worker (unregisters + clears caches)

### Optional

- `llms.txt` — not a build gate, but Lighthouse `agentic-browsing` (Chrome DevTools 2026) scores it: missing/invalid drops the category. For AI-native/catalog sites, ship a data-driven one (llmstxt.org: H1 + summary + linked sections, generated from data). Verify by re-running `lighthouse_audit` (chrome-devtools MCP).

### Asset rules

- Every internal asset ref must resolve to real file in build (**asset existence gate**)
- PNG >200KB → re-encode AVIF primary (20–30% smaller than WebP, 94% browser support) + WebP fallback + JPEG legacy
- Drop JPEG XL (10% support, Chrome flag-only)
- JS chunks ≤250KB gzip via route code-splitting (React.lazy + manualChunks)

## Every site (interactive)

- Full-featured Lightbox component mounted in Layout
- ALL major image groups wrapped in `[data-gallery="<id>"]` (services/gallery/team/blog hero/testimonials/before-after)
- Bundle MUST contain `data-zoomable` AND `data-gallery` strings — verified by `build_validators.ts`
- Lightbox: Esc/←→/Home/End/Tab focus-trap, swipe (Pointer Events ≥40px), pinch-zoom, double-tap, neighbor preload via `<link rel="preload" as="image">`, role="dialog" + aria-modal + aria-label + aria-live counter, `prefers-reduced-motion`
- Custom hostname canonical when `primary_hostname` set (not default `*.projectsites.dev`)
- For local businesses: `tel:` link in nav

## Every contact page WITH a headquarters / physical address (REQUIRED)

- **Full-width Google Maps widget is MANDATORY** on any contact/page showing HQ/address.
- Map MUST be pointed at the exact address (`?q=<urlencoded address>&output=embed` for keyless Embed iframe, or JS-API marker at geocoded address).
- Map MUST be **styled to the site**: brand-framed container (rounded corners, brand border/shadow), brand-tinted overlay, **floating branded info card overlaid on the map carrying the LOGO** + business name + full address + "Get directions" CTA (`maps/dir/?api=1&destination=<address>`).
- Keyless path: Google Maps Embed iframe + floating logo card satisfies "address + logo". Key path: Maps JavaScript API `AdvancedMarkerElement` with site logo as marker glyph.
- `loading="lazy"` + `title` on the iframe; never block LCP (place below the fold).
- Build-fail when a contact/HQ page renders an address but no embedded map.

## Every clickable entity

### Build-break (must link)

- Email → `<a href="mailto:user@domain">`
- Phone → `<a href="tel:+1NNNNNNNNNN">` (E.164, strip formatting)
- URL → `<a href>` w/ `target="_blank" rel="noopener noreferrer"` for external
- Product/service/feature w/ dedicated route → `<Link>` to that route
- Unlinked email or phone in shipped HTML = build fail

### Warnings (visible in console, not build-failing)

- Street address → `<a href="https://www.google.com/maps/dir/?api=1&destination=<urlencoded>">`
- PO Box / no-direction-target → `<a href="https://www.google.com/maps/search/?api=1&query=<urlencoded>">`
- Named institution/org/journal/conference/publication in body → hyperlinked to canonical URL (never "click here" / "learn more")
- SKU/EIN/DOI/ISBN/arXiv-id → linked to authoritative registry

### Validator

`validate-hyperlinks.mjs` greps dist/ HTML:

- Build-fail on unlinked email regex `[\w.+-]+@[\w-]+\.[\w.-]+`
- Build-fail on unlinked US phone `(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})`
- Warn on unlinked address `(P\.?O\.? Box \d+|\d+ [A-Z][a-z]+ (Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr))`
- Warn on unlinked named institutions in body copy

## Every form

- Turnstile (invisible, `data-appearance="interaction-only"`, NEVER visible widgets)
- Zod
- Resend — every send path passes the `[[email-deliverability]]` gate (SPF+DKIM+DMARC, RFC 8058 one-click unsub on marketing, spam <0.3%)

## Every historical timeline (`[[timeline-authenticity]]`)

- Photos ONLY from Wikimedia Commons / Library of Congress / NPGallery / NPS / NYPL Digital / state historical societies / institution's archives / verified press wire
- NEVER DALL·E, GPT Image, Midjourney, Ideogram, Stable Diffusion, "evocative" stock next to dated event
- NEVER decorative gray boxes or placeholder silhouettes
- Blank entry > faked entry
- Build gate: `validate-timeline-photos.mjs` rejects `/dall-?e/i|/ai-bank/|/midjourney/i|/ideogram/i|/stable-?diffusion/i|stock-site domains` without primary-source whitelist
- Required per photo: `image` URL, `imageAlt` (factual, never inventing), `imageCredit` ("Author · Source institution · License · Year")
- Contextual photos (1860 Brady portrait next to 1846 event) MUST disclose rhyme in alt ("representative of the era")

## Every Cmd+K (UNIVERSAL across site + app)

- `Meta+K` / `Ctrl+K` opens AI chat or command palette AND immediately focuses text input — caret blinking, zero extra clicks
- React: `requestAnimationFrame(() => inputRef.current?.focus({preventScroll:true}))` after open-state flips
- HTML: `autofocus` + post-mount `.focus()`
- `prefers-reduced-motion` → skip enter animation but STILL focus
- If already open, Cmd+K re-focuses + selects existing text
- Esc closes → returns focus to trigger element (a11y)
- Build gate: Playwright presses `Meta+K`, asserts `document.activeElement` matches chat/palette input — failure = build fail

## See

- `[[always]]` — universal cross-cutting rules
- `[[website-build-manifest]]` — indexes these gates · `[[email-deliverability]]` · `[[timeline-authenticity]]` · `[[legal-and-error-surfaces]]`
