---
name: "quality-gates"
description: "Visual inspection via GPT Image 2 vision, SEO audit, accessibility checks, 10-dimension quality scoring. Criticism registry with universal + domain-specific rules."
updated: "2026-04-24"
---

# Quality Gates

## Visual Inspection (MANDATORY — ***COST-TIERED***)

### In-container `inspect.js`

> **Model migration note (pass-76, 2026-06-09)**: `DALL-E` → **GPT Image 1.5** + `GPT-4o` → **GPT Image 2 vision**. Per `platform.openai.com/docs/deprecations`. Quality gates unchanged.

- Takes HTML file path → sends first 14KB to vision model
- Persona: "senior Stripe web designer"
- **8 scoring categories**: color contrast, typography, layout/spacing, animations, images, mobile responsiveness, brand consistency, visual polish vs generic AI look
- Scale 1–10

### Tiered model selection

- **Draft rounds (1–2)** — Workers AI Llama Vision (FREE). Catches layout breaks, missing elements, broken images, contrast failures. Sufficient for 80% of issues.
- **Final round (homepage only)** — GPT Image 2 vision detail:low (~$0.02). Catches aesthetic nuance, brand harmony. Only if Workers AI scores ≥7.

### In-container loop

- After `npm run build`, run `node /home/cuser/inspect.js dist/index.html`
- If score <8: fix → rebuild → re-inspect; max 3 iterations
- Workers AI for rounds 1–2; GPT Image 2 vision for final homepage check only

### Post-deploy inspection

- Worker screenshots via `microlink.io` API → Workers AI Llama Vision for all pages → GPT Image 2 vision detail:low for homepage ATF only
- Logs score + issues to D1 `audit_logs`

## 10-Dimension Quality Scoring

| Dimension | Min | What |
|-----------|-----|------|
| visual_design | 0.85 | Layout balance, whitespace, color harmony, depth, animations |
| content_quality | 0.85 | Real content, no placeholder, accurate, comprehensive |
| completeness | 0.85 | All sections present, all images used, all pages linked |
| responsiveness | 0.85 | 375/768/1024px clean, no overflow, touch targets ≥44px |
| accessibility | 0.85 | WCAG AA contrast, heading hierarchy, alt text, ARIA, skip link |
| seo | 0.85 | JSON-LD, meta, canonical, OG, sitemap, keyword placement |
| performance | 0.85 | <100KB HTML, lazy images, font preconnect, no render blocking |
| brand_consistency | 0.85 | Matches research colors/fonts, logo prominent, NAP consistent |
| media_richness | 0.85 | 30+ unique images, 3–5 videos, no broken, no duplicates, proper sizing |
| text_contrast | 0.85 | 4.5:1 body, 3:1 large text, no washed-out combinations |

Overall must exceed **0.90** to auto-publish. Below 0.85 on any dimension → fix required.

## Universal Build Validators

***BUILD-BREAKING — runs on EVERY site***

Validators run in `build_validators.ts` between R2 upload and `published` status. New validators land in `report` mode for one build cycle then flip to `strict` once template ships clean.

| Validator | Source rule | Failure code |
|-----------|-------------|--------------|
| `validate-color-from-logo.mjs` | skill 09 color-extraction-second-pass | `color.hue_distance_from_logo` |
| `validate-logo-singularity.mjs` | skill 09 logo-singularity | `logo.multiple_in_container` |
| `validate-legal-page-consistency.mjs` | skill 09 LegalLayout-consistency | `legal.layout_inconsistent` |
| `validate-image-prompts.mjs` | skill 12 per-slot-prompts | `image.prompt_generic` |
| `validate-hero-media.mjs` | skill 12 hero-media-preference-order | `hero.no_media` |
| `validate-publication-imagery.mjs` | skill 12 publication-imagery | `publication.image_irrelevant` |
| `validate-lightbox-grouping.mjs` | skill 12 + always.md lightbox-grouping | `lightbox.group_split` / `lightbox.caption_missing` |
| `validate-social-brand-hex.mjs` | skill 12 social-brand-hex-map | `social.hover_color_wrong` |
| `validate-cursor.mjs` | always.md click-ripple-only (ring forbidden) | `cursor.ring_present` / `cursor.native_hidden` / `cursor.ripple_missing` |
| `validate-image-hover.mjs` | always.md image-hover-no-layout-shift | `image.hover_layout_shift` |
| `validate-google-maps-widget.mjs` | always.md google-maps-widget | `map.embed_missing` / `map.geo_mismatch` |
| `validate-links.mjs` | always.md zero-broken-links + zero-broken-images | `link.dead_blog_slug` / `link.unknown_route` / `asset.missing` |
| `validate-blog-filters.mjs` | always.md blog-listing-functional-filters (nyfoldingbox 2026-05-02) | `blog.filter_inert` / `blog.url_no_sync` / `blog.search_inert` / `blog.deep_link_ignored` / `blog.empty_state_missing` |
| `validate-html-entities.mjs` | always.md no-html-entities-in-jsx (njsk.org 2026-05-02) | `entity.literal_in_jsx` / `entity.literal_in_dist_html` |
| `validate-underline-hover.mjs` | always.md universal-underline-hover (njsk.org 2026-05-02) | `underline.double_render` / `underline.layer_components` / `underline.color_overrides_parent` |
| `validate-no-empty-slots.mjs` | skill 15 media-acquisition Media-Slot-Manifest + Fail-CLOSED auto-regenerate | `slot.unfilled` / `slot.below_relevance_floor` / `slot.fallback_gradient_used` |
| `validate-dalle-slot-fill.mjs` | skill 15 media-acquisition GPT Image 1.5-first slot-fill + per-slot prompt mandatory fields | `dalle.prompt_generic` / `dalle.missing_negative_prompt` / `dalle.missing_palette_token` / `dalle.missing_subject_specificity` |
| `validate-media-slot-manifest.mjs` | skill 15 media-acquisition Media-Slot-Manifest | `manifest.missing` / `manifest.route_uncovered` / `manifest.slot_record_incomplete` |
| `validate-podcast-on-about.mjs` | skill 12 notebooklm-pipeline + always.md "Every site (NotebookLM artifacts)" | `podcast.missing` / `podcast.no_jsonld` / `podcast.no_transcript` / `podcast.audio_404` |
| `validate-infographic-on-about.mjs` | skill 12 notebooklm-pipeline | `infographic.missing` / `infographic.fewer_than_three` / `infographic.caption_missing` |
| `validate-explainer-video-btf.mjs` | skill 12 notebooklm-pipeline + always.md "Every site (NotebookLM artifacts)" | `video.missing` / `video.not_btf` / `video.no_jsonld` / `video.no_chapters` / `video.stream_uid_invalid` |
| `validate-podcast-rss.mjs` | skill 12 notebooklm-pipeline | `rss.missing` / `rss.invalid_xml` / `rss.no_episodes` / `rss.missing_itunes_ns` / `rss.enclosure_404` |
| `validate-logo-transparent-variant.mjs` | always.md "Every nav/header/footer logo render" | `logo.solid_bg_on_white_nav` / `logo.transparent_variant_missing` |
| `validate-donation-stripe-first.mjs` | always.md "Every donation/give CTA" | `donate.no_stripe` / `donate.monthly_not_default` / `donate.preset_amounts_missing` / `donate.uses_paypal_primary` |
| `validate-no-cdn-hotlinks.mjs` | always.md "Every migrated source-site asset" | `asset.cdn_hotlink` / `asset.source_cdn_referenced` |
| `validate-pointer-cursor-honesty.mjs` | always.md "Every clickable element" | `cursor.pointer_on_non_clickable` / `cursor.missing_on_clickable` |
| `validate-modal-scroll-preservation.mjs` | always.md "Every lightbox close" — `body { position: fixed; top: -<scrollY>px }` | `modal.scroll_lost_on_close` / `modal.scroll_lost_on_open` |
| `validate-card-hover-no-flicker.mjs` | always.md "Every card hover" | `card.white_flash_on_hover` / `card.background_transition_misuse` |
| `validate-expandable-card-no-crop.mjs` | always.md "Every expandable card" — grow to fit content, never `overflow: hidden` clipping | `card.content_cropped` / `card.overflow_hidden_post_expand` |
| `validate-search-input-width.mjs` | always.md "Every search input" — `min-width: 50ch` desktop, `width: 100%` mobile | `search.input_too_narrow` / `search.placeholder_truncated` |
| `validate-full-bleed-sections.mjs` | always.md "Every full-width visual section" — `width: 100vw; margin-left: calc(50% - 50vw)` | `section.constrained_when_full_bleed_intended` / `section.no_breakout_pattern` |
| `validate-x-not-twitter.mjs` | always.md "Every X reference" — MUST be "X" (NEVER "Twitter") AND latest official X icon | `social.twitter_label` / `social.twitter_bird_icon` |
| `validate-blog-featured-images.mjs` | always.md "Every blog/article post" — every post MUST have a featured image | `blog.featured_image_missing` / `blog.placeholder_used` |
| `validate-comparison-table-fullbleed.mjs` | always.md "Every comparison table / data grid" — full-bleed with sticky first column on mobile | `table.constrained_layout` / `table.no_sticky_first_column_mobile` |
| `validate-contact-preservation.mjs` | always.md "Every site rebuild SOURCE-SITE CONTACT INFO PRESERVATION" | `contact.email_missing` / `contact.phone_missing` / `contact.address_missing` / `contact.social_handle_missing` / `contact.hours_missing` / `contact.dept_contact_missing` |
| `validate-page-set-completeness.mjs` (***strict, post-deploy***) | rules/source-site-enhancement.md HARD_GATE_PAGE_COUNT + 15/page-set-expansion.md per-org-type floor | `routes.missing_standard` / `routes.missing_jewel` / `routes.missing_locale_mirror` / `routes.below_floor_for_org_type` |
| `validate-locale-mirror.mjs` (***strict, post-deploy***) | rules/i18n-by-demographics.md `/{locale}/*` mandate + hreflang_audit phase 6 | `locale.partial_mirror` / `locale.hreflang_missing` / `locale.x_default_missing` / `locale.html_lang_wrong` / `locale.rtl_dir_missing` |
| `validate-jewel-content-authority.mjs` (***strict, post-deploy***) | 15/page-set-expansion.md "Content Authority per Page" + Jewel Content Authoring Playbook + rules/citations.md APA-mandate | `jewel.word_count_below_300` / `jewel.no_citation` / `jewel.no_outbound_source` / `jewel.jsonld_below_5` / `jewel.placeholder_content` |
| `validate-cruft-301.mjs` (***strict, post-deploy***) | rules/source-site-enhancement.md CRUFT_PATTERNS + SQUARESPACE_DEDUPE + IA-normalizer 301-emit mandate | `cruft.url_serving_200` / `cruft.redirect_missing` / `cruft.redirect_target_404` / `cruft.squarespace_dupe_kept` |

### Detailed validator notes

#### `validate-page-set-completeness.mjs`

- Deployed-route-count MUST equal `keep + STANDARD_SET[org_type] + JEWELS[org_type] + locale_count × (keep+standard+jewels)`
- Per-org-type floors: nonprofit 14+10, saas 10+8, local 12+8, portfolio 5+6, church 10+6, gov 12+5, edu 12+6, healthcare 12+6, legal 10+6
- Reads `_url_inventory.json`+`_research.json`+`_locales.json`+`_org_type.json`; diffs deployed routes (sitemap.xml OR `--deployed-url` fetch with REAL_UA)
- Emits `_route_inventory_gap.json` `{expected_routes[], deployed_routes[], missing[], cruft_still_serving[], pass_fail, summary}`
- njsk.org reference: 8+14+10+129 × 3 locales = ~210–480 floor

#### `validate-locale-mirror.mjs`

- Every locale in `_locales.json` MUST have full route mirror at `/{locale}/*` matching the English route set
- Every page MUST emit `<link rel="alternate" hreflang="{locale}">` cross-refs to every shipped locale PLUS `hreflang="x-default"` → English root
- Partial coverage (e.g. `/es/donate` exists but `/es/planned-giving` 404s) = build fail
- Newark `/es/*`+`/pt/*` njsk.org reference

#### `validate-jewel-content-authority.mjs`

Every jewel page MUST ship:

- ≥300 visible body words
- ≥1 APA inline cite resolving in `_citations.json`
- ≥1 outbound canonical-source `<a href>`
- ≥5 JSON-LD blocks (WebSite+Org+WebPage+BreadcrumbList+1 page-type-specific)
- Zero lorem/TODO/placeholder substrings; FAIL on stub

Jewel routes include: `/annual-report`, `/financials`, `/planned-giving`, `/ways-to-give`, `/donate/*`, `/parish-toolkit`, `/partners`, `/press`, `/testimonials`, `/transcript`, `/alumni`, `/changelog`, `/security`, `/status`, `/customers`, `/roadmap`, `/api`, `/sdk/*`, `/compare/*`, `/insurance`, `/financing`, `/before-after`, `/menu`, `/booking`, `/emergency`, `/service-area/*`, `/now`, `/uses`, `/colophon`, `/reading-list`, `/talks`, `/baptism`, `/sacraments`, `/prayer-requests`, `/missions`, `/library`, `/multilingual`, `/feedback`, `/jobs`, `/translate`, `/data`, `/tuition`, `/visit`, `/handbook`, `/board`, `/transcript-request`, `/billing`, `/forms`, `/conditions`, `/telehealth`, `/fees`, `/client-portal`, `/community`.

#### `validate-cruft-301.mjs`

- Every URL in `_url_inventory.json` matching `/home$|/testpage$|/new-page-\d+$|/-1$|/-2$|/page-\d+$|/blog-\d+$|.+-(copy|backup|old|draft|test|tmp)(-\d+)?$|/[a-f0-9]{20,}$|/blog/\d{4}/\d{1,2}/\d{1,2}/[a-f0-9]{20,}$` MUST have 301 entry in `_redirects` resolving to a live canonical route
- Fetching the cruft URL on deployed host MUST return `301`/`302`/`308` with `Location:` header (NOT `200`)
- njsk.org reference: 50+ Squarespace random-IDs + 9 dead pages all 301d

## Gorgeous-Loop Reinforcement

***FINAL CRITIQUE BEFORE DEPLOY — every site***

- GPT Image 2 vision (detail:high) reviews homepage + 2 highest-traffic sub-pages
- Prompt: "Make this even more gorgeous + beautiful + intuitive + concise + creative + witty + intelligent + confident — list 8–12 concrete edits, then apply them."
- Max 3 rounds of edit-rebuild-rescreenshot; each round MUST increase visual_design + brand_consistency by ≥0.03 OR exit early
- Output diff written to `_polish_log.json` for criticism-registry feedback

## Criticism Registry (chronological — generalized rules)

Each entry: user-feedback symptom on a specific site → universal rule that prevents the class of failure on every future build.

### 2026-05-02 cycle (lone-mountain-global-3.projectsites.dev)

- **Color hallucination** (green primary on burgundy/navy/cream logo) → logo-pixel hue-distance verification (skill 09 color-extraction-second-pass)
- **Header rendered icon-mark + wordmark as two adjacent `<img>` tags** → logo-singularity (skill 09)
- **/accessibility flat paragraphs while /privacy + /terms used boxed sections** → shared `<LegalLayout>` (skill 09)
- **/publications used irrelevant generic stock** → journal-logo / paper-figure / generated-only (skill 12 publication-imagery)
- **Hero with no video despite Pexels Video API availability** → hero-media preference order (skill 12)
- **Same-topic gallery images split across multiple lightbox groups** → `data-gallery` inheritance + caption presence (skill 12 + always.md)
- **Social-button hover used generic accent instead of brand hex** → canonical social-brand-hex map (skill 12)
- **Generic AI imagery** ("create a hero image") → per-slot purpose-crafted prompts (skill 12)
- **Plain-text address on /contact** → "Every address" Google Maps directions href (always.md)
- **No final polish pass** → Gorgeous-Loop Reinforcement (this file)
- **No embedded interactive map for local-business sites** → Google Maps Embed API widget (always.md google-maps-widget)

### 2026-05-02 cycle (njsk-light.projectsites.dev — 12 critiques generalized)

- **Pexels stock on hero when source had usable hero of its own** → hero-media preference order ENFORCES original-source-hero IF quality≥7/10 wins over Pexels/GPT Image 1.5 (skill 12 + always.md)
- **No impact stat-rollup section despite 30+ years / 150K+ meals / 25K volunteers** → "Every site IMPACT/STAT ROLLUP" + `validate-stat-counter-section.mjs` (always.md + this file)
- **Anchor links lacked underline-on-hover** → universal `.underline-hover` pattern + `validate-underline-hover.mjs` (skill 10 + always.md)
- **Modules popped into view without entrance animation** → universal in-viewport fadeIn ONCE on entry + `js-reveal-active` class + `validate-reveal-foud.mjs` (skill 11 + always.md)
- **Single-source GPT Image 1.5 imagery vs available Pexels/YouTube/Google stack** → multi-source media per page + per-page-floor mandate (skill 12 + always.md)
- **Lightbulb on /volunteer + mixed-gender adults on /women-and-children** → per-page topic-relevance vision scoring ≥8/10 + `validate-image-relevance.mjs` (skill 12)
- **Broken `/taryn-albania.jpg` 404s** → zero-broken-images rule + post-build crawl gate (always.md + skill 15)
- **Mega-menu snapped closed mid-diagonal traverse** → hover-bridge + Bostock 2013 triangle-aim + `validate-mega-menu-hover.mjs` (skill 10 + always.md)
- **/volunteer page imagery off-topic** → per-page topic-relevance gate (same as critique 6)
- **Original blog URLs 404 on rebuilt site** → "Every site rebuild CROSS-SITE _REDIRECTS" + `validate-cross-site-redirects.mjs` (always.md)
- **Filter-chip taxonomies rendered but did NOT filter** → "Every interactive feature" DOM-diff validator + `validate-interactive-functionality.mjs` (always.md)
- **Only 12 of 120+ source blog posts imported** → COMPLETE BLOG/CONTENT CORPUS mandate + `validate-blog-corpus-complete.mjs` (always.md + skill 15)

### 2026-05-02 cycle (lonemountainglobal/njsk/nyfoldingbox — 13 critiques generalized)

- **LMG header logo with solid white bg against light hero → white-on-white merge** → "Every nav/header/footer logo render LOGO TRANSPARENT-BG VARIANT" + `validate-logo-transparent-variant.mjs`
- **NJSK donation CTA used PayPal primary, no recurring default, no preset amounts** → "Every donation/give CTA STRIPE-FIRST" with Stripe Checkout + Monthly default tab + $10/$25/$50/$100/$250/$500/Custom presets + `validate-donation-stripe-first.mjs`
- **NJSK kept Squarespace CDN hotlinks for migrated images** → "Every migrated source-site asset R2 SELF-HOSTING" + `validate-no-cdn-hotlinks.mjs`
- **NYFB decorative cards had `cursor: pointer` with no click handler** → "Every clickable element POINTER-CURSOR HONESTY" + `validate-pointer-cursor-honesty.mjs`
- **LMG lightbox close snapped page to top** → "Every lightbox close SCROLL-POSITION PRESERVATION" via `position: fixed; top: -<scrollY>px` + `validate-modal-scroll-preservation.mjs`
- **NYFB card hover triggered white-flash** → "Every card hover NO WHITE-FLASH" (transition only `transform/box-shadow/border-color`, explicit non-white bg) + `validate-card-hover-no-flicker.mjs`
- **NYFB expandable cards clipped content via `overflow: hidden`** → "Every expandable card NO CONTENT CROPPING" with `max-height: none; overflow: visible` + FLIP animation + `validate-expandable-card-no-crop.mjs`
- **NJSK blog search rendered as 12-char box** → "Every search input MIN VISIBLE WIDTH ≥50ch" desktop + 100% mobile + `validate-search-input-width.mjs`
- **NYFB hero constrained to 1200px container** → "Every full-width visual section FULL-VIEWPORT BREAKOUT" via `width: 100vw; margin-left: calc(50% - 50vw)` + `validate-full-bleed-sections.mjs`
- **NYFB social row used legacy bird Twitter icon labeled "Twitter"** → "Every X reference X-NOT-TWITTER + LATEST ICON" + `validate-x-not-twitter.mjs`
- **NJSK 80% of blog posts shipped without featured image** → "Every blog post FEATURED IMAGE MANDATORY + GPT Image 1.5 FALLBACK" + `validate-blog-featured-images.mjs`
- **NYFB comparison table cramped to 1200px, no mobile scroll** → "Every comparison table / data grid FULL-BLEED LAYOUT" with sticky first column + `validate-comparison-table-fullbleed.mjs`
- **NJSK rebuild dropped department contact info, Sunday hours, alternate volunteer email** → "Every site rebuild SOURCE-SITE CONTACT INFO PRESERVATION" diff-gate + `validate-contact-preservation.mjs`

## SEO Audit Checklist

- [ ] Title tag 50–60 chars with primary keyword
- [ ] Meta description 120–156 chars with keyword + CTA
- [ ] Canonical URL on every page
- [ ] One H1 per page containing primary keyword; logical H2→H3 hierarchy
- [ ] JSON-LD LocalBusiness with: name, address, phone, geo, hours, image, sameAs
- [ ] FAQPage schema on FAQ sections; BreadcrumbList on sub-pages
- [ ] OG title, description, image (1200×630), URL; Twitter card: `summary_large_image`
- [ ] robots.txt allowing all crawlers; sitemap.xml with all pages + lastmod
- [ ] Internal links: every page → 2+ other pages; image alt text with relevant keywords
- [ ] Primary keyword density 1–2% (natural, not stuffed)

## Accessibility Audit

WCAG 2.2 AA requirements:

- Color contrast ≥4.5:1 body text, ≥3:1 large text/UI
- Heading hierarchy: single H1, sequential H2→H3
- All images: descriptive alt text (not "image" or "photo")
- Form inputs: visible labels, not just placeholder
- Skip-to-content link; `lang` attribute on `<html>`
- Focus-visible on all interactive elements; touch targets ≥24px (WCAG 2.2 2.5.8)
- Focus appearance visible (2.4.11); dragging alternatives (2.5.7) for drag interactions
- ARIA roles on custom widgets only (semantic HTML preferred)

## Criticism Registry (evolving rules)

### Color & Contrast

- Never use washed-out, muddy, or generic palettes
- Every text/background combo checked for WCAG AA; dark overlays on image-backed text sections

### Typography

- Consistent font-weight hierarchy; hero headlines max 8 words; button text uses action verbs
- NAP (Name, Address, Phone) consistent everywhere

### Images

- No broken images (`naturalWidth > 0`); no duplicates; all images lazy except hero
- Proper width/height/aspect-ratio; loading shimmer placeholders; every image in `assets/` used somewhere

### Layout

- No horizontal scroll at 375px; all text readable at 375px (min 14px)
- Consistent card grid alignment; no orphaned sections; full-width on mobile, max-width on desktop

### Brand

- Logo in every page header; brand colors dominate (not generic Tailwind defaults)
- Font from logo/brand research used throughout; favicon set present

### Content

- No lorem ipsum, no TODO stubs, no "Coming Soon" pages
- Copyright year current; footer has Privacy + Terms links; contact info matches research data exactly

### Performance

- HTML under 100KB; no `console.log`; no render-blocking scripts; fonts preconnected
- Smooth scroll; back-to-top button

### Safety

- No inappropriate content; privacy notice on forms; footer compliance links
- `rel="noopener noreferrer"` on external links; COPPA compliance if child-facing
- ProjectSites.dev attribution in FAQ

### Animation & Motion (skill 11)

- `prefers-reduced-motion: reduce` on ALL `@keyframes` and transitions
- View Transitions API with `@supports` gate; `@starting-style` for modal/toast entry
- No animation longer than 300ms; parallax only via `animation-timeline: scroll()` (off main thread)

### Core Web Vitals (***NON-NEGOTIABLE***)

- **LCP ≤ 2.5s** — hero image preloaded, `fetchpriority="high"`
- **CLS ≤ 0.1** — all images have width/height/aspect-ratio
- **INP ≤ 200ms** — no blocking event handlers
- Fonts preconnected + `font-display:swap`; CSS `<link>` in `<head>`, JS deferred

### Image Optimization (***BUILD-BREAKING***)

- Every image in `assets/` MUST have WebP+AVIF variants at 320/640/1280/1920w
- `<picture>` with srcset on all `<img>` elements; blur placeholder (base64) on below-fold images
- Hero: `eager`+preload+`fetchpriority=high`; max single image: 200KB; total page: <500KB
- **Verify**: no `<img src="*.jpg">` or `<img src="*.png">` in dist/ HTML (must be inside `<picture>` with WebP source)

### Offline Capability

- Service worker registered in production; simulate offline → verify loads from cache
- Contact info (phone, address, hours) available offline; analytics gracefully degrade

### Analytics Verification

- PostHog snippet with `persistence:'memory'`; GTM container in head + noscript
- Local conversion events: `tel:` → `phone_click`, Maps → `direction_click`, form → `form_submit`
- Verify all three fire on page load

### Structured Data Validation

JSON-LD LocalBusiness with: `@type`, `name`, `address` (PostalAddress), `telephone`, `geo` (GeoCoordinates), `openingHoursSpecification`, `image`, `sameAs[]`, `aggregateRating` (if reviews), `priceRange`, `areaServed`, `hasMenu` (restaurants). FAQPage on FAQ sections. BreadcrumbList on sub-pages. Validate with Google Rich Results Test.

### Cross-Browser

- Test Chrome + Safari (80%+ local business visitors)
- Safari: `-webkit-` prefixes for `backdrop-filter`, scroll-snap; no Firefox-only CSS without fallback

### Lightbox Coverage (***BUILD-BREAKING***)

- `src/components/lightbox.tsx` MUST exist and be mounted in Layout
- Every page with 4+ content images MUST include at least one `[data-gallery]` wrapper
- **Build gate**: grep `dist/assets/*.js` for `data-zoomable` AND `data-gallery` — both required
- **Visual gate**: Playwright opens 3 random pages, clicks 1st content image, asserts `[role="dialog"][aria-modal="true"]` within 200ms, presses `→`, asserts image src changes, presses `Esc`, asserts dialog removed
- **Checklist**: prev/next buttons when gallery ≥2 images | counter `n/total` | figcaption from alt | 44×44 close button | swipe via Pointer Events | `prefers-reduced-motion` disables scale | neighbor image preload | focus-trap

### Asset Existence (***BUILD-BREAKING***)

- Every `<img src>`, `<source srcset>`, `<link href>`, `<script src>`, `<video src>`, `<source src>`, `url(...)` in dist/ HTML+CSS must resolve to a file in dist/ OR an allowed external host (https only; allowlist: googletagmanager.com, fonts.googleapis.com, fonts.gstatic.com, www.google.com/maps/embed, microlink.io, posthog.com)
- **Build gate**: `node validate-assets.js dist/` — fail if any reference 404s

### Image Format vs Size (***BUILD-BREAKING***)

- Any PNG over 200KB MUST be re-encoded to WebP (lossy q=85) or JPEG progressive (q=82) before R2 upload
- Hero photos: WebP+AVIF variants at 1920/1280/640/320w; logos: PNG only if <50KB transparent — otherwise SVG
- OG cards: PNG OK at 1200×630 ≤100KB; if larger, re-encode JPEG q=85
- **Build gate**: `node validate-image-budgets.js dist/` — flag any single >200KB, total >500KB

### OG Image Quality (***BUILD-BREAKING***)

- Every site MUST ship `/og-image.png` (or `.jpg`) at exactly 1200×630, ≤100KB
- Branded card: dark brand background, primary color accent bar, business name in display font, tagline, logo bottom-right
- NO scraped or stock photo as og-image — generate via Satori or GPT Image 1.5 with brand colors
- `<meta property="og:image:width" content="1200">` + `og:image:height content="630">` mandatory; Twitter `summary_large_image` mandatory

### Apple Touch Icon (***BUILD-BREAKING***)

- `/apple-touch-icon.png` at 180×180 mandatory at root, generated from logo
- `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">` in every page head

### Meta Description Strict (***BUILD-BREAKING***)

- Every page: meta description 120–156 chars HARD LIMIT; title 50–60 chars HARD LIMIT
- **Build gate**: `node validate-meta.js dist/**/index.html` — count chars (not bytes), fail outside ranges

### JSON-LD Count (***BUILD-BREAKING***)

- Every page MUST include 4+ `<script type="application/ld+json">` blocks
- Required minimum: WebSite + Organization/LocalBusiness + WebPage + BreadcrumbList
- Sub-pages add: Product, BlogPosting, FAQPage, Person, Article as applicable
- **Build gate**: count `application/ld+json` in dist HTML, fail if <4 on any indexed page

### H1 in HTML Shell (***BUILD-BREAKING — SEO***)

- SPAs MUST prerender hero H1 + first paragraph + meta into static `index.html` so crawlers see content without JS
- **Build gate**: `node validate-h1.js dist/index.html` — must find `<h1>` before any `<script>`

### Sitemap lastmod (***BUILD-BREAKING***)

- Every `<url>` in `sitemap.xml` MUST include `<lastmod>YYYY-MM-DD</lastmod>` set to build timestamp

### color-scheme Meta (***DARK SITES***)

- Dark-theme-primary sites MUST include `<meta name="color-scheme" content="dark light">`

### JS Code-Splitting (***PERFORMANCE GATE***)

- Vite config MUST include `build.rollupOptions.output.manualChunks` splitting React core, UI lib, route bundles
- Per-route chunks via `React.lazy()` for pages >50KB
- **Build gate**: largest single .js chunk <250KB gz; total JS <500KB gz

### DNS Prefetch + Font Preload (***PERFORMANCE — STANDARD***)

- `<link rel="dns-prefetch">` + `<link rel="preconnect" crossorigin>` for fonts.googleapis.com, fonts.gstatic.com, google-analytics.com
- `<link rel="preload" as="font" type="font/woff2" crossorigin>` for primary display + body font
- Hero image: `<link rel="preload" as="image" fetchpriority="high">`

### Custom Hostname Canonical (***SEO***)

- When representing a real brand with custom domain: canonical URL MUST point to custom domain once provisioned
- Pre-domain phase: canonical = projectsites.dev URL acceptable

### `tel:` in Nav for Local Business (***CONVERSION***)

- MUST include `<a href="tel:+...">` in primary navigation desktop + mobile + sticky mobile CTA bar at bottom
- Clicks trigger PostHog `phone_click` + GA4 `tel_click`

### Cookie Consent / GDPR

- EU-targeting sites: cookie banner with accept/reject
- PostHog `persistence:'memory'` = no cookies (compliant by default)
- GA4 requires consent mode v2 (`gtag('consent', 'default', {analytics_storage:'denied'})` until accepted)

### NAP Consistency (***BUILD-BREAKING***)

- Name+Address+Phone must match EXACTLY across: site header, NAPFooter, JSON-LD LocalBusiness, Google Maps embed, contact page, `_gbp_sync.json`
- `inspect.js` extracts NAP from all sources, diffs, fails on mismatch

### Component Completeness

All 16 local components must be available in template: HeroWithPhoto, ServiceCards, TestimonialCarousel, MapEmbed, StickyPhoneCTA, NAPFooter, TrustBadges, ReviewCTA, GalleryGrid, BeforeAfterSlider, QuickActions, EmergencyBanner, SpeedDial, BookingEmbed, LocalSchemaGenerator, ResponsiveImage. Missing = template drift.

### PWA Validation

- `site.webmanifest` with correct name/icons/theme_color; favicon set complete (ico+16+32+apple-touch+android-chrome 192+512)
- `<link rel="manifest">` in `index.html`

### Print Stylesheet

`@media print` rules in `index.css`: nav/footer/sticky hidden, body white bg, link URLs printed.

### Service Area Pages (if applicable)

- Each `/service-area/{city}` has unique H1, meta desc, localized content; no duplicate content; all pages in `sitemap.xml`

### URL Preservation (***BUILD-BREAKING***)

- Every original URL must return 200 (actual page) or 301 (redirect to new location); zero 404s for previously-indexed URLs
- Generate `_redirects` for Cloudflare Pages or equivalent redirect map
- **Build gate**: `node validate-urls.js` — fail if any original sitemap URL unaccounted

### Citations & Sources (***BUILD-BREAKING — rules/citations.md***)

- Every quantitative claim (%, N, $, ratio, comparison, year-claim) MUST cite source via `<Citation refId="...">` resolving to `_citations.json` (APA 7th ed)
- **Banned unsourced phrases**: "studies show|research suggests|most users|industry-leading|trusted by|proven|widely-recognized|recent studies|experts agree|countless|numerous|many|often|typically"
- JSON-LD Article/BlogPosting/FAQPage/Claim MUST include `citation: CreativeWork[]` per source
- **Build gate**: `node validate-citations.js dist/` greps `\d+%|\$\d+[MBK]|\d+x|\d+ users|since \d{4}` — any unsourced match fails build
- Source hierarchy: peer-reviewed > .gov/.edu > primary data > industry research; Wikipedia rejected; confidence ≥0.85 requires 2+ cites

### Content Migration Completeness

- New site word count MUST match or exceed original from `_scraped_content.json`
- All blog posts migrated as individual pages; blog listing with pagination present if original had blog
- RSS feed at `/feed.xml` or `/rss.xml`; no substantive content discarded without explicit user approval

### Donation Page (non-profit/church)

- `/donate` or `/give` with both one-time + monthly options; monthly selected by default
- Suggested amounts visible; Stripe integration or link to existing platform
- Donation CTA on 3+ pages

## Domain-Specific Quality Rules

- **Restaurant** — Menu must have prices. Food photos must look appetizing. Hours prominently displayed. Online ordering CTA if platform exists.
- **Salon/Barber** — Services with prices. Booking CTA prominent. Before/after gallery. Stylist profiles with photos.
- **Medical** — Provider credentials displayed. HIPAA-compliant form language. Emergency info. Insurance accepted list.
- **Legal** — Practice areas with descriptions. Attorney profiles with bar info. Free consultation CTA. Client testimonials with attribution.
- **Non-profit** — Donation CTA in hero + footer + every page. Impact counters animated. Volunteer signup. 501(c)(3) status visible.
- **SaaS** — Pricing tiers comparison. Free trial CTA. Integration logos. API docs link. Status page link. SOC2/GDPR badges if applicable.

## Generalization Principle

- Every site-specific criticism MUST be generalized into a rule for ALL future builds
- Pattern: site-specific symptom → name the class of failure → universal rule in `~/.claude/rules/always.md` → automated validator row in `## Automated Build Gates` → criticism-registry entry with date+site
- Future incidents matching an existing class extend (NOT duplicate) the existing rule

### Canonical generalization cases (njsk-light 2026-05-02 — 12 critiques → 12 universal rules + validators)

- "lightbulb image on /volunteer" → "Every page-rendered image scores ≥8/10 vs per-page topic via GPT Image 2 vision" → `validate-image-relevance.mjs`
- "no stat-rollup despite 30 years + 150K meals" → "Every site renders impact-stat section when ≥3 quantifiable stats resolve" → `validate-stat-counter-section.mjs`
- "mega-menu snaps closed mid-traverse" → "Every desktop mega-menu has hover-bridge + Bostock 2013 triangle-aim" → `validate-mega-menu-hover.mjs`
- "old blog URLs 404 on new site" → "Every site rebuild emits per-URL `_redirects` 301 covering original sitemap intersection" → `validate-cross-site-redirects.mjs`
- "filter chips do nothing" → "Every interactive feature mutates DOM measurably on click — styled-but-stub UI fails build" → `validate-interactive-functionality.mjs`
- "only 12 of 120 blog posts imported" → "Every site rebuild imports 100% of source blog/news/articles corpus — never subsample" → `validate-blog-corpus-complete.mjs`
- "stock hero when source had its own" → "Hero preference order: original-source ≥7/10 > Pexels-video > Pexels-image > GPT Image 1.5 per-slot > brand-gradient" → `validate-image-relevance.mjs`

## Automated Build Gates

***RUN POST-BUILD, FAIL HARD***

```bash
node scripts/validate-assets.mjs dist && node scripts/validate-meta.mjs dist && node scripts/validate-citations.mjs dist && node scripts/validate-h1.mjs dist && lhci autorun && playwright test --grep @gate
```

| Gate | Tool | Threshold | Fail Action |
|------|------|-----------|-------------|
| Asset existence | `validate-assets.mjs` (skill 15) | 9 mandatory files + every ref resolves | exit 1 |
| Meta length | `validate-meta.mjs` | title 50–60ch, desc 120–156ch | exit 1 |
| H1 in shell | `validate-h1.mjs` | `<h1>` present before `<script>` in raw HTML | exit 1 |
| Citations | `validate-citations.mjs` | every `\d+%`/`\$\d+[MBK]`/`\d+x` cited APA | exit 1 |
| URL preservation | `validate-urls.mjs` | every original URL → 200 or 301 | exit 1 |
| Source parity | `compare-source.ts` | new word count ≥ original × 1.0, image count ≥ original × 1.4 | exit 1 |
| Lighthouse | `@lhci/cli` v0.15+ | Perf≥75, A11y≥95, BestPractices≥95, SEO≥95 | exit 1 |
| Accessibility | `@axe-core/playwright` v4.11+ | 0 WCAG 2.2 AA violations | exit 1 |
| Visual regression | Percy AI Visual Review / pixelmatch | <0.1% pixel diff vs baseline | warn → review |
| Image budget | `validate-image-budgets.mjs` | single ≤200KB, total ≤500KB | exit 1 |
| Cross-browser smoke | Playwright Chrome+Safari | homepage loads, no console errors at 6 breakpoints | exit 1 |
| Pseudo-element positioning | `validate-pseudo-position.mjs` | every absolutely-positioned `::before/::after` has parent `position: relative\|absolute\|fixed\|sticky` | exit 1 |
| Lightbox-on-logos forbidden | `validate-lightbox-targets.mjs` | zero matches for `data-gallery="logos\|trusted\|sponsors\|partners\|institutions\|press\|publications\|awards"` — institutional logo grids MUST use hover-grayscale-to-color (skill 12) NOT lightbox | exit 1 |
| Per-route metadata | `validate-route-metadata.mjs` | 100% route coverage, no fallback `index.html` `<title>` on production routes | exit 1 |
| White-flash transition | Playwright 60fps video of route transition on dark-themed sites | no frame with average pixel-luminance >0.5 | exit 1 |
| PWA full kit | `validate-pwa.mjs` (skill 06) | site.webmanifest valid + ≥6 icon entries + ≥2 real screenshots + sw.js registered + offline.html ≤30KB with NAP + Lighthouse PWA ≥0.95 | exit 1 |
| Publication crawl depth | `validate-publications.mjs` (skill 15) | `_publications.json` length ≥ source index count; every entry has paraphrased summary + outbound URL + source logo + date | exit 1 |
| Logo transparency | `validate-logo-alpha.mjs` (Sharp corner-pixel sample) | every shipped logo PNG has alpha<255 on ≥1% of corner pixels | exit 1 |
| Institutional logos resolved | `validate-institutional-logos.mjs` | every name in `_research.json.affiliations[]\|publications[].source\|sponsors[]\|partners[]` has resolved logo in dist/ | exit 1 |
| Grammar audit | `validate-grammar.mjs` (skill 09 GPT Image 2 vision-mini final pass) | zero grammar/spelling/typography errors flagged on every rendered page | exit 1 |
| Brand-hex social hover | `validate-social-hex.mjs` (skill 12) | every social-link `<a>` has hover/focus/active CSS using canonical platform hex | exit 1 |
| Outbound link HEAD-200 | `validate-outbound-links.mjs` | every external `<a href>` HEAD with realistic UA, accept 200/206/301–308; FAIL on 404/410/451/5xx | exit 1 |
| Publication tile deeplinks | `validate-publication-deeplinks.mjs` | every `[data-card="publication"]` MUST have `deeplink_url` → canonical external source (DOI > PubMed > arXiv > journal > publisher); NEVER internal stub | exit 1 |
| Lightbox section grouping | `validate-lightbox-grouping.mjs` (skill 12) | every `<section>` with ≥2 `[data-zoomable]` descendants: ALL share ONE `data-gallery` value + every `[data-zoomable]` carries `data-caption-title` + `data-caption-description` | exit 1 |
| Anti-FOUC scroll-reveal | `validate-reveal-foud.mjs` (skill 11) | `<html>` carries inline `<script>` adding `js-reveal-active` BEFORE first paint; CSS rule `html.js-reveal-active .reveal:not(.is-visible){opacity:0}` exists; no `.reveal` flashes visible-then-jumped | exit 1 |
| 4-state interactive | `validate-4state.mjs` (skill 10) | every `<a>`, `<button>`, `[role=button]`, `<input>` cycled through `:default\|:hover\|:focus-visible\|:active`; FAIL if adjacent states differ <3px OR any lacks distinct `:focus-visible` vs `:hover` | exit 1 |
| Underline-hover canonical | `validate-underline-hover.mjs` (njsk.org 2026-05-02) | grep `.underline-hover::after`: `left:51%` AND `right:51%` initial, `left:0` AND `right:0` hover, `background: currentColor`, ships OUTSIDE `@layer components`, no `color:` on matched anchor, exactly ONE underline, contrast ≥4.5:1 | exit 1 |
| HTML entity literals | `validate-html-entities.mjs` (njsk.org 2026-05-02) | grep source AND dist for `&apos;\|&middot;\|&amp;[a-z]+;\|&ldquo;\|&rdquo;\|&hellip;\|&ndash;\|&mdash;\|&nbsp;\|&quot;\|&#\d+;` outside code/JSDoc; FAIL. Use raw Unicode: `'` `·` `&` `"` `"` `…` `–` `—` ` ` | exit 1 |
| Internal-link route enumeration | `validate-links.mjs` (njsk.org 2026-05-02) | `KNOWN_ROUTES` auto-generated from `src/app.tsx` AST; every `<Route path>` becomes known; hardcoded slug strings outside template-literal interpolation forbidden | exit 1 |
| Click ripple only (no ring) | `validate-cursor.mjs` (2026-05-02) | desktop: native cursor visible, `.cursor-ring` DOM forbidden, no `body{cursor:none}`, mousedown spawns `.cursor-ripple` animating+removing within 700ms; mobile: no `.cursor-ripple`; reduced-motion: ripple disabled | exit 1 |
| Image hover no-layout | `validate-image-hover.mjs` (skill 10) | trigger `:hover` on every `<img>`, FAIL if any dimension shifts >0px; allowlist: `transform`, `filter`, `opacity`, `box-shadow` | exit 1 |
| Image topic-relevance | `validate-image-relevance.mjs` (njsk-light 2026-05-02) | GPT Image 2 vision scores every `<img>` vs per-page topic; FAIL <8/10. Enforces hero preference order: original-source ≥7/10 wins over Pexels/GPT Image 1.5 | exit 1 |
| Stat rollup section | `validate-stat-counter-section.mjs` (njsk-light 2026-05-02) | when `_research.json.stats[]` resolves ≥3 quantifiable items: assert `<section data-section="stats">` with ≥3 `[data-stat-counter]` children with `data-stat-end` numeric, IntersectionObserver-driven roll-in | exit 1 |
| Mega-menu hover-bridge | `validate-mega-menu-hover.mjs` (njsk-light 2026-05-02) | desktop: hover trigger → wait 100ms → panel visible → move cursor diagonally through gap → assert panel still visible after 250ms; hover away → assert close within 200ms; touch: tap-to-open + tap-outside-to-close; keyboard: Enter/Space opens, Esc closes | exit 1 |
| Cross-site redirects | `validate-cross-site-redirects.mjs` (njsk-light 2026-05-02) | when `OLD_SITE_URL` OR `_research.json.source_url` resolves a different host: fetch original sitemap.xml, assert every path in `_redirects` as `<original-path> 301 https://<new-host><new-path>` | exit 1 |
| Interactive functionality | `validate-interactive-functionality.mjs` (njsk-light 2026-05-02) | every `[data-filter], [role=tab], [aria-controls], [data-search], [data-sort], [data-load-more], [data-toggle]` MUST measurably mutate DOM on click | exit 1 |
| Blog listing filters + search + URL-sync | `validate-blog-filters.mjs` (nyfoldingbox 2026-05-02) | every blog listing route: count N posts before filter; click each category-chip, assert count `<N AND >0` AND URL `?category=<slug>`; tag chips same; search debounce 200ms; sort dropdown; deep-link state pre-applied; empty-state with "Clear filters" CTA; categories+tags derived from corpus | exit 1 |
| Blog corpus completeness | `validate-blog-corpus-complete.mjs` (njsk-light 2026-05-02) | when source has blog (URL paths matching `/blog\|/news\|/articles\|/journal\|/posts\|/press\|/updates\|/insights\|/stories` OR sitemap ≥10 such URLs): assert `_corpus.json.posts.length >= source_blog_post_count * 1.0`; every post is a route with BlogPosting JSON-LD + author byline + publish date + tags + categories + reading time + ≥3 related-posts + share buttons | exit 1 |

## Lighthouse CI (***NON-NEGOTIABLE***)

`.lighthouserc.json` config:

```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:4173/", "http://localhost:4173/about", "http://localhost:4173/services", "http://localhost:4173/contact"],
      "numberOfRuns": 3,
      "settings": { "preset": "desktop", "throttling": { "cpuSlowdownMultiplier": 1 } }
    },
    "assert": {
      "preset": "lighthouse:no-pwa",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.75 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.95 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "interaction-to-next-paint": ["error", { "maxNumericValue": 200 }],
        "uses-text-compression": "error",
        "uses-responsive-images": "error",
        "modern-image-formats": "error",
        "uses-optimized-images": "error",
        "render-blocking-resources": ["warn", { "maxNumericValue": 200 }]
      }
    },
    "upload": { "target": "filesystem", "outputDir": "./.lighthouseci" }
  }
}
```

Mobile preset additionally enforced via second LHCI run with `"preset": "mobile"`. Both must pass.

For full-site coverage at scale, `unlighthouse` (parallel-crawls every route in sitemap, generates HTML report). Run on every PR via GitHub Action.

## Accessibility — axe-core via Playwright (***WCAG 2.2 AA, ZERO VIOLATIONS***)

`tests/accessibility.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = ['/', '/about', '/services', '/contact', '/blog', '/privacy', '/terms'];
const BREAKPOINTS = [375, 390, 768, 1024, 1280, 1920];

for (const route of ROUTES) {
  for (const width of BREAKPOINTS) {
    test(`a11y: ${route} @ ${width}px @gate`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .disableRules(['color-contrast-enhanced'])  // AAA, not required
        .analyze();
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    });
  }
}
```

### WCAG 2.2 new criteria (9 total)

axe-core v4.11+ checks all:

- Focus appearance (2.4.11); Focus not obscured min/enhanced (2.4.12/2.4.13)
- Dragging movements (2.5.7); Target size 24px (2.5.8)
- Consistent help (3.2.6); Redundant entry (3.3.7)
- Accessible auth min/enhanced (3.3.8/3.3.9)

ADA compliance deadline: 2027 state/local, 2028 federal.

## Source-Parity Diff (***FOR REBUILDS — `compare-source.ts`***)

```typescript
const original = await crawl(sourceUrl, { maxPages: 1000 });
const newSite = await crawl(deployUrl, { maxPages: 1000 });

assert(newSite.wordCount >= original.wordCount * 1.0, `Word count regression: ${original.wordCount} → ${newSite.wordCount}`);
assert(newSite.imageCount >= original.imageCount * 1.4, `Image count below augmentation floor`);
assert(newSite.routes.length >= original.routes.length, `Route count dropped: ${original.routes.length} → ${newSite.routes.length}`);
for (const r of original.routes) {
  const res = await fetch(deployUrl + r);
  assert(res.status === 200 || (res.status === 301 && res.headers.get('location')), `Lost URL: ${r}`);
}
for (const doc of original.documents) {  // PDFs/DOCs/PPTs
  const res = await fetch(deployUrl + doc.path);
  assert(res.ok, `Missing preserved document: ${doc.path}`);
}
```

## Visual Regression — 3-Tier Strategy

| Tier | Tool | When | Cost |
|------|------|------|------|
| Local dev | `pixelmatch` + golden screenshots | every save | free |
| PR | Chromatic via Storybook | per-PR per-component | free up to 5K snapshots/mo |
| Deploy | Percy AI Visual Review | per-deploy full-page 6 breakpoints | free up to 5K snapshots/mo |

- **Percy AI Visual Review** handles the per-deploy gate (40% false-positive filtering, 3× faster than legacy Percy)
- **Chromatic via Storybook** for component-level regression
- **`pixelmatch`** against golden PNGs in `tests/__golden__/` for local dev iteration

## Console-Error Gate (***POST-DEPLOY***)

```typescript
test(`console clean: ${route} @gate`, async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto(route);
  await page.waitForLoadState('networkidle');
  expect(errors, errors.join('\n')).toEqual([]);
});
```

CSP violations, JS errors, missing resource 404s — all caught here.

## Recommendations Loop (***ZERO-RECOMMENDATIONS GATE***)

- GPT Image 2 vision detail:high inspects deployed homepage + 3 random sub-pages
- Returns markdown list of every "could be improved" observation; loop: implement → redeploy → re-check
- Done when checker returns empty list; max 5 iterations
