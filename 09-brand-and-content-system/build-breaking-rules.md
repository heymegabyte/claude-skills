---
name: "09 build-breaking brand+content rules"
description: "Universal brand/content gates: social brand-hex, small-text WCAG AAA contrast, logo-vs-container contrast, hero scrim, transparent-bg logo variant, X-not-Twitter, institution-credentials row. Migrated verbatim from rules/always.md 2026-05-03."
metadata:
  version: "1.0.0"
  updated: "2026-05-03"
  effort: "high"
  context: "fork"
license: "Rutgers"
compatibility:
  claude-code: ">=2.0.0"
  agentskills: ">=1.0.0"
---

# 09 — Build-Breaking Brand + Content Rules

> **Model migration note (pass-79, 2026-06-09)**: `DALL-E` → **GPT Image 1.5** + `GPT-4o` → **GPT Image 2 vision**. Per `platform.openai.com/docs/deprecations`.

Migrated from `~/.claude/rules/always.md` 2026-05-03.

## Every social link

Hover / focus / active swaps to official brand hex:

- **FB** — `#1877F2`
- **LinkedIn** — `#0A66C2`
- **X** — `#000`
- **Instagram** — gradient `#F58529 → #DD2A7B → #8134AF → #515BD4`
- **YT** — `#FF0000`
- **TikTok** — `#000` with cyan / magenta dual-shadow
- **Pinterest** — `#BD081C`
- **GitHub** — `#181717`
- **Discord** — `#5865F2`
- **Bluesky** — `#0085FF`
- **Threads** — `#000`
- **WhatsApp** — `#25D366`
- **Reddit** — `#FF4500`
- **Snap** — `#FFFC00`

Encode as `social-brand-hex.json` shipped in template — never hardcode generic accent. See `social-brand-hex.md`.

## Every site (small text contrast — ***WCAG AAA FOR SMALL TEXT***)

- Text ≤14px MUST contrast ≥7:1 vs background (WCAG AAA).
- Body small muted text: minimum WCAG-AA (≥4.5:1).
- **Forbidden**: muted-foreground on muted-background for small text.
- **Build gate**: visual-qa samples computed-style of `font-size ≤ 14px` + bg, fails if contrast <7:1.

**Reference incident**: /services small-print on lone-mountain-global-3 (2026-05-01).

## Every logo render (***LOGO-VS-CONTAINER CONTRAST — UNIVERSAL — BUILD-BREAKING***)

- Every logo render (header, footer, hero, modal, splash, mobile menu, sidebar) MUST contrast its container background ≥4.5:1 measured on the logo's dominant chroma (NOT transparent pixels).

### Forbidden pairings

- White-text-logo on white/cream bg
- Dark-text-logo on dark/navy bg
- Low-saturation-logo on same-hue bg

### Resolution

- Header AND footer themes chosen AFTER logo luminance scan (skill 09 `logo-luminance-drives-theme`).
- Dual-theme site: ship TWO logo files (`brand-mark-light.svg` for dark bg, `brand-mark-dark.svg` for light bg) with CSS `<picture>/<source media>` swaps.

### Validator (`validate-logo-contrast.mjs`)

GPT Image 2 vision samples logo bbox + container computed bg at 6bp, fails if contrast <4.5:1.

**Reference incident**: lone-mountain-global-3 (2026-05-01) white-text-logo on white bg AND dark-text-logo on dark bg — both invisible.

## Every hero (***HERO TEXT CONTRAST SCRIM — UNIVERSAL — BUILD-BREAKING***)

Hero / page-banner backgrounds MUST guarantee ≥4.5:1 contrast for ALL hero text via mandatory scrim.

### Pattern

```css
.hero::before { content:""; position:absolute; inset:0; background: linear-gradient(180deg, rgba(0,0,0,.45) 0%, rgba(0,0,0,.65) 100%); z-index:1 }
.hero > .hero-content { position:relative; z-index:2 }
```

For dark text on light bg, invert to white-overlay.

### Scrim opacity tuned per bg luminance

- Bright bg — 55-70% scrim
- Mid bg — 35-50% scrim
- Dark bg — 25-35% scrim

### Companion

- `text-shadow: 0 1px 3px rgba(0,0,0,.5)` on hero h1 + subhead as belt-and-suspenders.
- NEVER ship hero text on raw image without scrim.

### Validator

visual-qa samples hero text + computed-bg-after-scrim at 6bp, fails if contrast <4.5:1.

**Reference incident**: lone-mountain-global-3 (2026-05-01) hero text on insufficiently-darkened bg.

## Every nav / header / footer logo render (***LOGO TRANSPARENT-BG VARIANT — UNIVERSAL — BUILD-BREAKING***)

When source logo PNG/JPG has a baked-in solid background AND the rebuild surface DIFFERS from that baked bg, produce a transparent-bg logo variant before render.

### Pipeline

1. Detect baked bg via Sharp `getDominantColor` + edge-pixel sample at 5px inset — ≥80% border pixels sharing one hue = baked bg.
2. Auto-strip via `sharp(logo).removeAlpha().threshold(...)` OR remove.bg API (`REMOVEBG_API_KEY`) for hard cases.
3. Ship `brand-mark-transparent.png` + `brand-mark-transparent.svg` alongside `brand-mark.png`.
4. `<picture><source srcset="brand-mark-transparent.png" media="(--surface-bg: transparent)"><img src="brand-mark.png"></picture>` with CSS `--surface-bg` per surface.

### Context rules

- Header on white nav → transparent variant
- Header on dark hero → dark-bg variant
- Footer on dark band → light-text variant

### Validator (`validate-logo-transparent-variant.mjs`)

For every site with detected baked bg: assert `public/brand-mark-transparent.png` exists AND header `<img>` references transparent variant when nav bg-luminance differs from logo baked-bg luminance by ≥0.3.

**Reference incident**: njsk.org rebuild (2026-05-02) white-card-bg logo on white nav.

## Every X (formerly Twitter) reference (***X-NOT-TWITTER + LATEST X ICON — UNIVERSAL — BUILD-BREAKING***)

Every mention / icon / aria-label / alt-text referencing the network formerly known as Twitter MUST use "X" branding (text="X", icon=current X logo SVG, brand color=`#000` with cyan/magenta dual-shadow).

### Forbidden text in dist/ HTML + ARIA

- "Twitter" (except "formerly Twitter" historical context)
- "Tweet" (except as past-tense in dated content)

### Forbidden icons

- Twitter bird SVG; `simple-icons:twitter`; `lucide-twitter`

### Required

- `simple-icons:x` OR custom inline:

  ```html
  <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  ```

- `aria-label` MUST be "X (formerly Twitter)" on first mention, plain "X" on repeat.

### Validator (`validate-x-not-twitter.mjs`)

Grep dist/ for `\bTwitter\b`, `tweet`, `tw-bird`, blue twitter-bird SVG path; fail outside whitelisted contexts.

**Reference incident**: nyfoldingbox.com (2026-05-02) shipped Twitter-bird icon + "Follow us on Twitter."

## Every bio mentioning notable institutions

BU | Harvard | MIT | Stanford | Oxford | Cambridge | Yale | Princeton | Columbia | UPenn | Cornell | Brown | Dartmouth | Caltech | UChicago | Northwestern | Duke | JHU | UMich | UCLA | UCB | CMU | T20 — credentials row with high-res transparent-PNG institution logos.

**Fetch chain**: Logo.dev → Wikipedia Commons SVG → Brandfetch.

## Every section with multiple CTAs (***PRIMARY vs SECONDARY VISUAL DISTINCTION — UNIVERSAL — BUILD-BREAKING***)

Each section: AT MOST one primary CTA (filled, high-contrast, brand-accent bg, white text) + optionally one secondary CTA (outlined/ghost). NEVER two primary CTAs in the same visual space.

### Design tokens

- **Primary CTA** — `background: var(--brand-accent); color: var(--bg-primary); border: none; font-weight: 700; padding: .75rem 1.75rem; border-radius: var(--radius-btn, 6px)`
- **Secondary CTA** — `background: transparent; color: var(--brand-accent); border: 1.5px solid var(--brand-accent); font-weight: 600`

### Rules

- Hover states required on both (per 4-state interactive rule).
- Icon `→` or `↗` on primary; no icon on secondary.
- **Mobile stacking**: flex row wraps to column on `<576px`; primary always first (top).
- **Hero exception**: video/tour secondary may be `<button role="button" aria-label="Watch overview video">▶ Watch 2-min overview</button>` ghost-styled.

### Validator (`validate-cta-hierarchy.mjs`)

Per `<section>`: count `[class*="btn-primary"]`, `[data-variant="primary"]` — assert count ≤1; assert second CTA has distinct visual weight.

**Reference incident**: nyfoldingbox — every section had two identically-styled "GET STARTED" + "LEARN MORE" buttons.

## Every testimonial (***COMPLETE ATTRIBUTION — UNIVERSAL — BUILD-BREAKING***)

Every testimonial MUST include:

1. `<blockquote>` with `cite` attribute (source URL when available).
2. `<cite>`: person first + last name (MANDATORY), job title/role (MANDATORY), company/org (MANDATORY when business context exists).
3. **Avatar**: source photo ≥40×40px → GPT Image 1.5 headshot → initials monogram (bg=brand-accent, text=bg-primary).
4. **Date** (year minimum: "2024") when derivable.
5. **Star rating** (1-5) when source had one.

### NEVER anonymous testimonials

- `"— Happy Customer"` — FORBIDDEN
- `"— Anonymous"` — FORBIDDEN
- `"— Satisfied Client"` — FORBIDDEN
- Fallback: `"[Name withheld by request] · Verified customer · 2024"`.

### Validator (`validate-testimonial-attribution.mjs`)

Every `<blockquote>` must contain `<cite>` with length >10 AND cite text must NOT match `/(anonymous|happy customer|satisfied client|a customer)/i`.

**Reference incident**: nyfoldingbox source had partial attribution ("— Mike, NJ") — rebuild stripped even that.

## Every external link in body content (***OPENS NEW TAB + EXTERNAL INDICATOR — UNIVERSAL — BUILD-BREAKING***)

Every `<a href>` pointing to an external domain in body content MUST:

1. `target="_blank"` to preserve reading context.
2. `rel="noopener noreferrer"` (security + privacy).
3. External-link indicator AFTER link text — `<span aria-hidden="true" class="ext-link-icon">↗</span>` 12×12.
4. `aria-label="[link text] (opens in new tab)"` on the `<a>`.

**Exception**: nav links to known sister sites (same org) may open in same tab.

### Validator (`validate-external-links.mjs`)

Every `<a>` with external href in content area has `target="_blank"` AND `rel` contains `noopener` AND sibling `<span class="ext-link-icon">` exists.

**Reference incident**: both sites linked publications in body text that opened same tab.

## Every Schema.org `@type` selection (***BUSINESS-CLASS GATING — UNIVERSAL — BUILD-BREAKING***)

`LocalBusiness` (and subtypes) MUST be reserved for businesses where customers physically visit a fixed-address premises.

### Allowlist for `@type=LocalBusiness`

Storefront retail | Restaurant/cafe/bar | Medical/dental/vet clinic | Salon/spa/barbershop | Gym/yoga studio | Auto repair/dealership | Hotel/lodging | Attorneys/CPAs with walk-in | Real estate brokerage with walk-in.

Everything else MUST use `@type=Organization` (or subtypes: NGO, Corporation, EducationalOrganization, GovernmentOrganization).

### Implementation

- Classify `_research.json.business_class` ∈ `storefront | restaurant | medical | salon | gym | auto-repair | hotel | legal-walkin | real-estate-walkin | organization | nonprofit | saas | portfolio | agency | research | foundation` BEFORE schema render.
- `buildBusinessJsonLd({ businessClass })` in `src/lib/businessSchema.ts` emits correct `@type` — never inline `@type: 'LocalBusiness'`.

### Validator (`validate-schema-type.mjs`)

Grep dist HTML for `"@type":"LocalBusiness"` — assert `_research.json.business_class` is in local-business allowlist; else fail.

**Reference incident**: lonemountainglobal (2026-05-07) global health consulting practice rendered as `LocalBusiness` with no street address.

## Every site with named founder / principal (***PERSON JSON-LD — UNIVERSAL — BUILD-BREAKING***)

Every site naming an individual as founder/principal/lead/director/author on homepage or `/about` MUST emit `Person` JSON-LD on that page:

- `name` (MANDATORY), `jobTitle` (MANDATORY), `worksFor: { '@type': 'Organization', name }` (MANDATORY when org named)
- `url`, `image`, `alumniOf`, `sameAs` (LinkedIn, ORCID, Google Scholar, Wikipedia, X, GitHub, Mastodon), `description`, `knowsAbout`

Use `<PersonJsonLd>` component — never hand-write Person JSON-LD inline.

### Validator (`validate-person-jsonld.mjs`)

For every dist page rendering `<h1>`/`<h2>` containing a person's name + job title within 100 characters: assert ≥1 `<script type="application/ld+json">` block of `@type=Person` with matching `name`. Missing = fail.

**Reference incident**: lonemountainglobal — founder named as global health expert with 30+ years, zero Person JSON-LD emitted.

## Every publication / article / news render (***ARTICLE JSON-LD — UNIVERSAL — BUILD-BREAKING***)

Every publication, article, blog post, news item, white paper MUST emit one of:

- `@type=ScholarlyArticle` (peer-reviewed) | `@type=BlogPosting` | `@type=NewsArticle` | `@type=Article`

With: `headline`, `url`, `datePublished` (ISO 8601), `dateModified`, `author: [{ @type: Person, name, url? }]`, `publisher: { @type: Organization, name, logo? }`, `mainEntityOfPage`, `inLanguage`, `keywords`, `citation: [{ @type: CreativeWork, name, url }]`.

Use `<ArticleJsonLd>` component covering all four type variants.

### Validator (`validate-article-jsonld.mjs`)

Every route matching `/blog/*`, `/publications/*`, `/news/*`, `/research/*`, `/articles/*`, `/papers/*`, `/case-studies/*` MUST emit one of the four article JSON-LD types; missing `author` + `datePublished` + `publisher` = fail.

**Reference**: lonemountainglobal listed publications inline on /about with no per-publication JSON-LD.

## Every page on a research-bearing site (***STYLIZED APA REFERENCES — UNIVERSAL — BUILD-BREAKING***)

≥80% of routes MUST surface 3-10 APA-7th-ed references via `<PageReferences refs={...} />` AND ≥1 inline `<Citation refId="...">` per section making a quantitative/factual claim.

### Pipeline per page

1. Before rewriting copy, spawn a research agent mining 5-10 APA-cited claims from peer-reviewed/.gov/.edu/primary sources.
2. Write `src/data/citations/<slug>.ts` exporting `{ id, apa, url, type }`.
3. Inject `<Citation refId>` markers around each quantitative claim.
4. Render `<PageReferences slug="<slug>" />` above footer.

### Exemptions (allowed to skip)

Pure transactional routes (`/checkout`, `/cart`, `/login`, `/signup`), interactive tools (`/contact`, `/admin`), pure-listing pages whose children carry citations.

### Page-level minimums

- Home — 3+ refs
- About — 8+ refs
- Services — 5+ refs
- Donate — 5+ refs
- Financials/annual-report — 5+ refs
- Press — 3+ refs
- FAQ — 5+ refs

### Stylized rendering REQUIRED — never a bare `<ol>` of plain text

- Monospace refId chip (e.g. `[smith24]` in `var(--font-mono)`)
- APA-correct hanging indent (4ch)
- Italic journal/book titles
- Hover expands to 1-line abstract
- Copy-link button per ref (`navigator.clipboard.writeText(apa)`)
- Accordion collapse on mobile; IntersectionObserver fade-in

Component: `src/components/page-references.tsx` (shipped in template).

### Validator (`validate-stylized-citations.mjs`)

For every non-exempt route: assert ≥3 entries in `src/data/citations/<slug>.ts` AND ≥1 `<Citation` JSX call AND `<PageReferences` rendered.

**Reference incident**: njsk.org first audit (2026-05-11) — 14 pages with unsourced quantitative claims ("97 cents on the dollar", "23.4% poverty rate", "1 in 4 children").

**Companion**: `rules/citations.md` + skill 03-planning-and-research.

## Every site with analytics (***COOKIE CONSENT BANNER — UNIVERSAL — BUILD-BREAKING — GDPR + CCPA***)

Every site loading third-party analytics MUST render a cookie consent banner on first visit:

1. Bottom-bar or bottom-corner modal — NEVER full-screen block.
2. Minimum message: "We use analytics to improve your experience. [Accept All] [Manage Preferences] [Reject Non-Essential]" — all three options visible.
3. "Accept All" → `localStorage.setItem('cookie-consent', 'all')` + initialize analytics.
4. "Reject Non-Essential" → `localStorage.setItem('cookie-consent', 'essential-only')` + block all analytics (NEVER load GA4/PostHog before consent in EU).
5. Banner NEVER auto-dismissed; NEVER shown again after a choice is stored.
6. "Manage Preferences" opens modal with per-category toggles (Analytics, Marketing, Functional).

`src/lib/consent.ts` template module checks localStorage on load, conditionally initializes analytics.

### Validator (`validate-cookie-consent.mjs`)

Playwright clears localStorage, loads homepage, asserts `[data-cookie-banner]` visible within 2s AND has ≥2 interactive choice buttons.

**Reference incident**: both sites loaded PostHog + GTM before any consent — GDPR violation.

## Every site rebuild (***BRAND FIDELITY #1 — LOGO PIXEL-MATCH VALIDATOR — UNIVERSAL — BUILD-BREAKING***)

Source-site logo extraction MUST produce an asset whose perceptual hash (pHash) differs ≤8 from the original.

### Validator (`validate-logo-fidelity.mjs`)

Compute pHash of `_brand.json.logo.source_url` vs dist `assets/brand/logo.*`, fail if Hamming distance >8. Regenerate via Ideogram v3 ONLY when source is unrecoverable (404, redirect-loop, <64px); record `_brand.json.warnings: ["logo_regenerated_no_source"]`.

**Reference**: rec #17 (2026-05-10) — LMG iter-4 shipped Ideogram-regenerated logo while source SVG was 200-OK.

## Every site rebuild (***BRAND FIDELITY #2 — FONT-FAMILY EXTRACTION — UNIVERSAL — BUILD-BREAKING***)

Playwright MUST sniff source-site computed-style (`getComputedStyle(h1)` + `body`) — NOT inferred from category or guessed.

Write `_brand.json.fonts: { headline, body, mono?, sources: [google|adobe|self-hosted] }`.

### Validator (`validate-font-fidelity.mjs`)

Grep dist `<link href="https://fonts.googleapis.com/css2?family=...">` against `_brand.json.fonts.{headline,body}`, fail on missing or mismatch.

**Reference**: rec #18 (2026-05-10) — LMG iter-4 source uses Poppins+Hind, pipeline shipped Inter+Roboto.

## Every site rebuild (***BRAND FIDELITY #3 — COLOR EXTRACTION — UNIVERSAL — BUILD-BREAKING***)

Run TWO passes:

1. GPT Image 2 vision on source homepage screenshot → `primary, secondary, accent, bg_dark, bg_light` hex array.
2. `node-vibrant`/`Vibrant.js` on extracted logo PNG → palette.

**Merge**: vision-pass wins for primary/accent; vibrant wins for backgrounds. Write to `_brand.json.colors.{primary,secondary,accent,bg,fg,muted}`.

### Validator (`validate-brand-colors.mjs`)

Assert `_brand.json.colors.primary` differs ≤ΔE 5 from source-site primary (CIE Lab) AND no color is hand-guessed.

**Reference**: rec #19 (2026-05-10) — njsk.org burgundy incident (LLM guessed `#1e3a8a` blue, actual `#6b1d2e` burgundy).

## Every site rebuild (***BRAND FIDELITY #4 — CONTENT CORPUS DELTA — UNIVERSAL — BUILD-BREAKING***)

Source content corpus MUST be preserved with delta ≤15% — Jaccard similarity of token-bag per route.

Build cannot rewrite >15% of source paragraphs except (a) banned-word substitution per copy-writing rules, (b) explicit user-requested rewrite.

### Validator (`validate-content-fidelity.mjs`)

Per rebuilt route, compute Jaccard against `_content_corpus.json[path]`, fail if <0.85.

**Reference**: rec #20 (2026-05-10) — LMG iter-4 rewrote 40% of "About" page, lost authentic founder language.

## Every site rebuild (***BRAND FIDELITY #5 — INTERNAL ROUTE STRUCTURE PARITY — UNIVERSAL — BUILD-BREAKING***)

Every source URL becomes a real rendered route OR a 301 in `_redirects`.

Deep-crawl source via sitemap.xml + recursive link discovery → write `_routes.json.{ source_path, rebuild_path, status: 200|301, redirect_target? }`.

### Validator (`validate-route-parity.mjs`)

Every `_routes.json` entry resolves to a 200-OK rebuild HTML file OR appears in `_redirects` with target also 200-OK.

**Reference**: rec #21 (2026-05-10) — broken links from missing routes = SEO equity loss.

## Every site rebuild (***BRAND FIDELITY #6 — TONE-OF-VOICE VECTOR MATCH — UNIVERSAL — BUILD-BREAKING***)

Source copy MUST be vectorized (OpenAI `text-embedding-3-small`) per page; rebuild copy embedding MUST match source within cosine ≥0.78.

Source crawl → embed body text per route → `_voice_embeddings.json`. After rebuild: embed rebuild body text → compare.

### Validator (`validate-voice-fidelity.mjs`)

Fail any route with cosine <0.78 against its source counterpart.

**Reference**: rec #22 (2026-05-10) — LMG iter-4 rebuild reads like SaaS landing page, source reads like founder essay.

## Every site rebuild (***BRAND FIDELITY #7 — HERO IMAGE/VIDEO SOURCE-FIRST PRIORITY — UNIVERSAL — BUILD-BREAKING***)

Rebuild hero MUST attempt source-site reuse FIRST — fall back to Sora/GPT Image 1.5/Pexels only when source is unrecoverable.

Source hero: R2 self-host → `<picture>`/`<video>` slot. Upgrades quality (upscale, sharpen, recompress) but does NOT replace subject.

### Validator (`validate-hero-source-first.mjs`)

If `_media_extraction.json.hero_url` resolves 200, assert rebuild hero file is derived from same source (matching pHash or from same URL).

**Reference**: rec #23 (2026-05-10) — Mission Doctrine cinematic floor + brand fidelity together.

## Every site rebuild (***BRAND FIDELITY #8 — DESIGN-TOKEN DIFF ARTIFACT — UNIVERSAL — BUILD-BREAKING***)

Every rebuild MUST emit `_brand_diff.json`: per-token comparison source-extracted vs rebuild-shipped (logo pHash, font family, color hex, typescale, spacing scale, radius).

### Validator (`validate-brand-diff.mjs`)

Assert `_brand_diff.json` exists with fields `{logo_hash_distance, font_match, color_delta_e_max, token_delta_count}` AND a human-readable summary line per token.

**Reference**: rec #24 (2026-05-10) — auditability prevents silent regression.
