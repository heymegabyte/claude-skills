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

The per-page / per-site / per-entity technical gates every projectsites.dev / Emdash site must satisfy. Extracted from `[[always]]` so this WEBSITE-specific detail loads only on site prompts (via the `website-build` pack) instead of taxing every non-website prompt's budget — `[[always]]` keeps only the universal cross-cutting rules. The `[[website-build-manifest]]` indexes these sections; this rule is the detail.

> Numeric stats + first-load animation → `[[cinematic-ui-patterns]]` (`<app-rolling-counter>` + `appReveal` mandatory on every projectsites.dev surface).

## Every page

- Keyphrase FIRST
- Title 50-60 chars
- Meta desc 120-156 chars
- One H1 in HTML shell (prerender)
- Canonical
- **`<head>` MUST be delivered server-side per-route, NEVER client-only.**
  - Client `PageHead`/Helmet (SPA, post-hydration) is INVISIBLE to Googlebot/ChatGPT/Perplexity/social scrapers — they read the raw shell.
  - Non-prerendered routes falling back to one `index.html` ship the HOMEPAGE title + `canonical=/` everywhere → whole site collapses to one indexable URL.
  - Fix: Worker `HTMLRewriter` keyed on `getMeta(pathname)` rewrites title/desc/og/twitter/canonical/`<html lang>` per route (base + locale, one source of truth).
  - Gate: RAW-HTTP spec (`request.get`, no JS) asserting the server shell — a post-hydration DOM check passes even when the shell is wrong.
  - Incident: njsk.org pass-10 (site-wide `canonical=/` on all 32 routes).
- JSON-LD per page only when accurate. WebPage is floor; add Organization/BreadcrumbList/FAQPage/Person/Product/Service ONLY when describing real entities. Never pad.
- FAQPage only when real Q&A exists. Don't fabricate.
- OG 1200×630 ≤100KB **branded card** (NOT scraped photo)
- 2+ internal links, 1+ outbound
- Yoast GREEN
- `<meta name="color-scheme">` present
- DNS-prefetch + preconnect for fonts/analytics
- Font woff2 preload for primary display + body
- Speculation Rules prerender when navigation dominant (multi-page funnels, doc sites). Skip on landing where analytics integrity matters — prerender double-counts GA4 pageviews + can fire conversions before user interaction
- `fetchpriority="high"` on LCP `<img>` AND its preload link

## Every site (REQUIRED)

- `site.webmanifest` w/ `screenshots[]` 3+ form_factor:"wide"|"narrow", `shortcuts[]`, `share_target`, `file_handlers`, `protocol_handlers` for store listings
- `robots.txt` — split AI crawlers by purpose, never blanket-block (blanket = removed from AI answers entirely):
  - **Allow (search/retrieval — keeps you cited in ChatGPT/Perplexity/AI Overviews)**: `OAI-SearchBot`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`
  - **Disallow (training-only — opt out of model training)**: `GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, `CCBot`, `Bytespider`
  - Explicit `Allow`/`Disallow` per UA — never default
  - **Cloudflare gotcha**: CF "AI Audit / Managed robots.txt" EDGE-INJECTS a `# BEGIN Cloudflare Managed content` block ABOVE origin robots.txt (`ai-train=no` + `Disallow: /` for training bots).
    - Origin ALLOWS the same bots → contradictory duplicate `User-agent` groups, undefined crawler behavior, possible drop from AI answers.
    - Fix: reconcile origin to AGREE with the managed block (disallow training, allow search/retrieval), or disable the managed feature in the dashboard.
    - Always `curl` the LIVE robots.txt (not the repo file) to catch the injected block.
    - Incident: music.megabyte.space 2026-06-10.
- `humans.txt`
- `sitemap.xml` (every `<url>` has `<lastmod>`)
  - **`<lastmod>` must reflect when the URL's CONTENT changed, NOT build time.**
    - Stamping `TODAY` on every URL each build tells Google the whole site changed today → Google STOPS TRUSTING the field (developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping), forfeiting crawl-priority. Same freshness-fabrication class as JSON-LD `dateModified: TODAY` or Google-News `publication_date` keyed on rewrite date.
    - Fix: committed `{ url: { hash, lastmod } }` store — hash each page's source, PRESERVE stored date while hash unchanged, bump to today only on new/changed URL.
    - Single-writer per URL — two generators re-signing the same `loc` mutually clobber back to always-today.
    - Gate so a raw `<lastmod>${TODAY}</lastmod>` inside a `<url>` can't reappear.
    - Reference impl: brickcitylabor `scripts/lib/sitemap-lastmod.mjs`.
- `browserconfig.xml`
- `.well-known/security.txt`
  - **Cloudflare gotcha (same class as robots.txt above)**: CF account-level **managed `security.txt`** edge-serves one file across EVERY zone (`server: cloudflare`, CF-injected `report-to`/`nel`, no `cf-cache-status`), SHADOWING any `public/.well-known/security.txt` — the repo file NEVER serves.
    - Repo copy then silently drifts (stale contacts/expiry) and a future agent "fixes" a dead file.
    - Always `curl` the LIVE security.txt; if CF-managed, edit the **account security.txt dashboard setting**, not the asset; keep the repo copy reconciled or delete it.
    - Incident: pdf.megabyte.space 2026-06-12.
- `favicon.ico` + `favicon-16x16.png` + `favicon-32x32.png`
- `apple-touch-icon.png` (180×180)
- OG image
- Kill-switch service worker (unregisters + clears caches)

### Optional

- `llms.txt` — <0.3% adoption, no major LLM crawler requests it; DX-only for Cursor/Claude Code, **not a build gate**.
  - BUT Lighthouse `agentic-browsing` (Chrome DevTools 2026) SCORES it: missing/invalid (no H1, no links) drops the category (67→100 on music.megabyte.space 2026-06-10).
  - For AI-native/catalog sites, ship a data-driven one (llmstxt.org: H1 + summary + linked sections, generated from data so it never drifts).
  - Verify by re-running `lighthouse_audit` (chrome-devtools MCP), not by guessing.

### Asset rules

- Every internal asset ref must resolve to real file in build (**asset existence gate**)
- PNG >200KB → re-encode AVIF primary (20-30% smaller than WebP, 94% browser support) + WebP fallback + JPEG legacy
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

- **A full-width Google Maps widget is MANDATORY** on the contact page (or any page showing a HQ/address) whenever a physical address exists. Not optional.
- The map MUST be **pointed at the exact address** (`?q=<urlencoded address>&output=embed` for the keyless Embed iframe, or a JS-API marker at the geocoded address).
- The map MUST be **styled to the site** — not a raw default iframe: brand-framed container (rounded corners, brand border/shadow), brand-tinted overlay where it improves contrast, and a **floating branded info card overlaid on the map carrying the LOGO** + business name + full address + a "Get directions" CTA (`maps/dir/?api=1&destination=<address>`).
- Keyless path (default): Google Maps Embed iframe (`google.com/maps?q=…&output=embed`) drops a pin at the address — pair with the floating logo card to satisfy "address + logo" without an API key. Key path (when richer marker needed): Maps JavaScript API `AdvancedMarkerElement` with the site logo as the marker glyph.
- `loading="lazy"` + a `title` on the iframe; never block LCP with the map (place it below the fold).
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
- Named institution/org/journal/conference/publication mentioned in body → hyperlinked to canonical URL using institution name as anchor (never "click here" / "learn more")
- SKU/EIN/DOI/ISBN/arXiv-id → linked to authoritative registry

### Validator

- `validate-hyperlinks.mjs` greps dist/ HTML:
  - Build-fail on unlinked email regex `[\w.+-]+@[\w-]+\.[\w.-]+`
  - Build-fail on unlinked US phone `(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})`
  - Warn on unlinked address `(P\.?O\.? Box \d+|\d+ [A-Z][a-z]+ (Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr))`
  - Warn on unlinked named institutions in body copy

## Every form

- Turnstile (invisible, `data-appearance="interaction-only"`, NEVER visible widgets)
- Zod
- Resend — every send path passes the `[[email-deliverability]]` gate (SPF+DKIM+DMARC, RFC 8058 one-click unsub on marketing, spam <0.3%) or mail bounces at SMTP silently

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

- `[[always]]` — the universal cross-cutting rules (secrets, post-work, ethics, report) this was extracted from
- `[[website-build-manifest]]` — indexes these gates · `[[email-deliverability]]` · `[[timeline-authenticity]]` · `[[legal-and-error-surfaces]]`
