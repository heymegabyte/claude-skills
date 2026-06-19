---
name: "12 build-breaking media+orchestration rules"
description: "Universal media gates: Media Slot Manifest + GPT Image 1.5 primary slot-fill + fail-CLOSED auto-regenerate, NotebookLM artifacts (podcast + infographic + explainer video), page-rendered image topic-relevance ≥8/10, blog featured image mandatory + GPT Image 1.5 fallback, migrated source-site asset R2 self-hosting, page media density (video + multi-source generation), full-width Google Maps Embed widget for physical addresses. 2026-05-11 EXTEND: 14 Ideogram leverage slots (logo triad + favicon set + per-route OG cards + hero typographic poster + chapter plates + editorial blog headers + branded 404/500 + PWA splashes + tier badges + chapter glyphs + pattern tile + stat numerals + share quote cards + iteration stamp), 16-source parallel multimedia fan-out (Pexels+Pixabay+Google CSE Image+Wikimedia+Internet Archive+LoC+NASA+Smithsonian+The Met+Europeana+Flickr Commons+YouTube+Vimeo+Coverr+Mixkit+Pexels Video), Google Custom Search Image API license-filtered, NotebookLM-generated + Podcast Index discovered podcast feeds (Google Podcasts API retired 2024), ATF hero video via Sora + Veo dual cascade with stock fallback, progressive media refresh per iteration, credits/colophon route. Migrated verbatim from rules/always.md 2026-05-03; extended per Brian directive 2026-05-11."
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

# 12 — Build-Breaking Media + Orchestration Rules

> **Model migration note (pass-75, 2026-06-09)**: References to `DALL-E 3` / `DALL-E` migrated to **GPT Image 1.5** (current OpenAI image-gen flagship); `GPT-4o` vision migrated to **GPT Image 2 vision** (current OpenAI multimodal flagship). Per `platform.openai.com/docs/deprecations`: DALL-E 2/3 removed from API 2026-05-12; GPT-4o retired 2026-02-13. 14-Ideogram leverage slot manifest, 16-source parallel multimedia fan-out, and topic-relevance ≥8/10 gates all unchanged — only API endpoint names updated. Cost ranges in this doc were computed against legacy DALL-E + GPT-4o pricing; re-verify against current GPT Image 1.5 / GPT Image 2 rates.

Migrated from `~/.claude/rules/always.md` 2026-05-03.

## Every image slot (***MEDIA SLOT MANIFEST + FAIL-CLOSED AUTO-REGENERATE — UNIVERSAL — BUILD-BREAKING — supersedes "fetch-some-images-and-pick-later" patterns***)

- Phase 0 step 1 enumerates EVERY image slot on EVERY route into `_media_slots.json` BEFORE any agent fans out.

### Slot record shape

```
{slot_id, route, section, role, aspect, min_dims, topic_keywords, topic_intent,
 brand_palette, preferred_motion, source_chain, dalle_prompt, negative_prompt,
 relevance_floor, filled_by, filled_url, filled_score, regen_attempts}
```

### Per-slot GPT Image 1.5 prompt — 6 mandatory fields

- Drafted in a single batched gpt-4o call (~$0.05/site). MUST encode:
  1. Page topic + intent verbatim
  2. Brand palette tokens inline hex
  3. Composition + aspect ratio
  4. Subject specificity (NEVER `"people"` — always `"octogenarian volunteer plating soup, soft window light, documentary style"`)
  5. Photographic technical specs (camera/lens/lighting/DoF — e.g. `"shot on Hasselblad, 85mm prime, golden hour, shallow DoF"`)
  6. Negative prompt block (`"no text, no watermarks, no logos, no extra fingers, no AI artifacts, no stock-photo cliches"`)

### Source-chain order

1. Real-entity sources (Places/uploads/scrape)
2. GPT Image 1.5
3. Pexels
4. Coverr
5. Flux
6. Brand-gradient

- GPT Image 1.5 is PRIMARY slot-fill engine after real-entity exhaustion. Stock APIs run as parallel speed-pass fallback (instant return if GPT Image 1.5 hangs >15s) but GPT Image 1.5 output preferred at curation.

### Acceptance

- Every slot MUST end with `filled_url != null AND filled_score >= relevance_floor` (default 8/10 GPT Image 2 vision).

### Failure handling

- Failure (Pexels empty, NSFW flag, broken scrape, vision below floor) → REFINED-prompt regen via GPT Image 1.5 (`(original_prompt, vision_critique, relevance_floor)`), max 5 attempts × $0.08/img = $0.40/slot worst case.
- After exhaustion: log to `_unfillable_slots.json`, ship brand-gradient floor, mark `published_with_warnings`, surface slot for manual replacement.
- NEVER silent skip. NEVER substitute brand-gradient unless 5 regen attempts exhausted.

### Validators

- `validate-media-slot-manifest.mjs` — every route enumerated, every slot record complete
- `validate-no-empty-slots.mjs` — no `_unfillable_slots.json` entries on clean build, no slot below relevance_floor, no fallback-gradient unless exhaustion logged
- `validate-dalle-slot-fill.mjs` — every GPT Image 1.5 prompt has all 6 mandatory fields
- Daily GPT Image 1.5 spend tracked in `_dalle_daily.json` against `OPENAI_DAILY_BUDGET` (default $50) — exhaustion triggers Flux fallback for remainder of day.

## Every site (***NOTEBOOKLM ARTIFACTS — PODCAST + INFOGRAPHIC + EXPLAINER VIDEO — UNIVERSAL — BUILD-BREAKING — `notebooklm-orchestrator` agent runs Phase 0***)

Every site ships THREE auto-generated NotebookLM-style artifacts before deploy:

1. **Two-host audio podcast** — rendered on `/about` via `<audio>` Plyr embed + collapsible inline transcript + dual JSON-LD (`PodcastSeries` + `PodcastEpisode` with `partOfSeries` + `associatedMedia` + `transcript`) + RSS feed `/podcast.xml` (RSS 2.0 + iTunes namespace + podcast namespace 1.0, `<enclosure type="audio/mpeg">` + `<itunes:duration>` + `<podcast:transcript>` + `<podcast:chapters>`) + 3000×3000 JPEG cover art (Apple-required)
2. **Infographic gallery** — rendered on `/about` via `[data-infographic-gallery]` containing ≥3 panels (mandatory mix: 1 data chart via Vega-Lite SVG from `_research.json.stats[]` + 1 process/flow panel via Recraft v3 SVG + 1 hero illustration via GPT Image 2 PNG with brand-converged per-slot prompt encoding all 6 mandatory fields per skill 12), each panel `data-zoomable` + `data-gallery="infographic"` + `data-caption-title` + `data-caption-description` per always.md "Every multi-image section" rule
3. **Explainer video** — rendered BTF (second `<section>` inside `<main>`, immediately after hero) on `/` homepage via `[data-section="explainer-btf"]` containing `<stream src="<UID>" controls preload="metadata" poster="<R2>" primary-color="<brand-accent>" defaultTextTrack="en">` (Cloudflare Stream embed) + `<figcaption>` + collapsible inline transcript + JSON-LD `VideoObject` with `name` + `description` + `thumbnailUrl` + `contentUrl` + `embedUrl` + `uploadDate` + `duration` + `transcript` + `hasPart` chapters array (3-7 `Clip` entries with `startOffset` + `endOffset` + `url#t=N`)

- Phase 0 step 2 enumerates `_notebooklm.json` manifest (mirrors Media Slot Manifest pattern) BEFORE Phase 1 page builds reference artifact URLs.

### Provider chains

- **Podcast** — ElevenLabs Studio Create Podcast (`POST /v1/studio/podcasts` with `mode: conversation` + two voice IDs) → AutoContent API → `teng-lin/notebooklm-py` headless wrapper (only when client demands NotebookLM-format proof) → skip-with-warning
- **Video** — HeyGen API ($1/min standard, $4/min Avatar IV 1080p, 60-90s talking-head) → Synthesia → Tavus → Veo 3.1 Fast 8s hero loop ($1.20) → skip-with-warning
- **Infographic** — Vega-Lite (free deterministic) + Recraft v3 ($0.04/SVG) + GPT Image 2 ($0.06/img); fallback to Napkin AI ($39/mo) when Recraft + GPT-Image saturated

### Budgets

- Per-site cost ceiling — $3.50
- Daily ceiling — `NOTEBOOKLM_DAILY_BUDGET` (default $300 = ~100 sites) — exhaustion degrades to cheapest providers, NEVER blocks deploy

### Acceptance

- Every artifact MUST end with `filled_url != null AND filled_score >= 8/10` (GPT Image 2 vision for cover art, gpt-4o-mini topical-relevance for transcript) OR exhausted-with-warning state — max 3 attempts per artifact.

### Source brief construction

- gpt-4o-mini condenses `_research.json` + top-N `_corpus.json` + `_pdf_facts.json` into 8-15K-char `_podcast_source.md`; same brief feeds 75-second `_video_script.md` synthesis (gpt-4o, structured Hook 10s → Problem 15s → Solution 30s → Proof 10s → CTA 10s).

### Submission automation (post-deploy)

- Apple Podcasts Connect (JWT API, `APPLE_PODCAST_KEY_ID` + `APPLE_PODCAST_PRIVATE_KEY`)
- Spotify for Podcasters (manual UI)
- Podcast Index (free instant `https://podcastindex.org/add`)
- Amazon Music Podcasters
- YouTube Music podcast directory (Google Podcasts deprecated 2024)

### Validators

- `validate-podcast-on-about.mjs` — `<audio>` + dual JSON-LD + transcript ≥500 chars on `/about`
- `validate-infographic-on-about.mjs` — `[data-infographic-gallery]` ≥3 panels with caption attrs on `/about`
- `validate-explainer-video-btf.mjs` — `[data-section="explainer-btf"]` is 2nd `<section>` of `<main>` on `/` + `<stream>` + VideoObject JSON-LD with hasPart chapters
- `validate-podcast-rss.mjs` — `/podcast.xml` 200 + valid RSS 2.0 + ≥1 `<item>` with audio enclosure

Pipeline spec: `~/.agentskills/12-media-orchestration/notebooklm-pipeline.md`. Agent: `~/.claude/agents/notebooklm-orchestrator.md`.

## Every page-rendered image (***TOPIC-RELEVANCE GATE — UNIVERSAL — BUILD-BREAKING — vision-LLM scored***)

- Every `<img>` on a route MUST score ≥8/10 on per-page semantic relevance via GPT Image 2 vision scoring: (a) page topic + intent, (b) image subject + composition, (c) brand-tone fit.
- Lightbulb on `/volunteer` = fail. Mixed-gender adults on `women-and-children-services` = fail. Generic corporate handshake on soup-kitchen page = fail.

### Hero image preference order (STRICT)

1. Original-source-hero IF quality ≥7/10
2. Pexels-video-loop matching topic
3. Pexels-image scoring ≥8
4. GPT Image 1.5 per-slot prompt naming page topic + brand palette + subject specificity
5. Brand-gradient fallback

- Validator (`validate-image-relevance.mjs`): post-build GPT Image 2 vision scores `(page_topic, image_description) → relevance 0-10` for every image on every route; FAIL any score <8.

## Every blog/article post (***FEATURED IMAGE MANDATORY + GPT Image 1.5 FALLBACK — UNIVERSAL — BUILD-BREAKING — extends "Every page-rendered image"***)

- Every blog/news/article/journal/case-study post MUST have a valid featured image (hero + OG card + listing thumbnail).

### Discovery chain

1. Source post `<img>` with class containing `featured`/`hero`/`thumb`
2. Source post first inline `<img>` ≥1024×768
3. Source post `og:image` meta
4. Source post `twitter:image` meta
5. Pexels search by post title keywords (≥3 stop-word-filtered nouns)
6. Pixabay search same keywords
7. GPT Image 1.5 generation with per-slot prompt naming: (a) post topic + 3 most-relevant nouns from title; (b) brand palette inline hex; (c) 16:9 aspect for hero / 1.91:1 for OG / 4:3 for listing thumbnail; (d) photographic specs (`"editorial photography, soft natural light, shallow DoF, documentary style"`); (e) negative prompt block (no text, no watermarks, no logos, no AI artifacts)

- When source-post-image is broken (404 / 5xx / mixed-content / blocked CDN), SKIP that source and continue chain — never ship a broken `<img>`.
- Vision-LLM scores final image ≥8/10 topic relevance before accepting; below 8 → regen with refined prompt up to 3 attempts.
- Validator (`validate-blog-featured-images.mjs`): every `_corpus.json.posts[]` entry MUST have `featured_image_url` set to a 200-OK file in build output; every `<article>` tile MUST have `<img>` ≥1024×768; OG card 1200×630 ≤100KB.

## Every migrated source-site asset (***R2 SELF-HOSTING — NEVER HOTLINK SQUARESPACE/WIX/WP CDNS — UNIVERSAL — BUILD-BREAKING***)

- Every image/video/PDF/font/CSS/JS reference inherited from the source site MUST be downloaded during scrape and re-uploaded to R2 under `sites/<slug>/assets/<deterministic-hash>.<ext>` BEFORE rebuild reaches `published`.
- NEVER ship: `<img src="https://images.squarespace-cdn.com/...">`, `<img src="https://static.wixstatic.com/...">`, `<img src="https://wp.com/...">`, `<source src="https://www.youtube.com/embed/<id>">` (YouTube embeds OK as iframes; raw assets NOT).
- YouTube/Vimeo iframes preserved as-is (intentional embeds, not asset hotlinks).

### Pipeline

1. Crawler enumerates all asset URLs into `_assets.json.external_refs[]`
2. Parallel `fetch` with REAL_UA + `Accept-Encoding: identity` for binary integrity
3. Compute SHA-256 → store under `sites/<slug>/assets/<hash>.<ext>`
4. Rewrite all dist HTML/CSS to point to `/assets/<hash>.<ext>`
5. Augment with augmented assets per skill 12 media-acquisition

- Validator (`validate-no-cdn-hotlinks.mjs`): grep dist/ HTML for hostnames matching `squarespace-cdn|squarespace.com|wixstatic|wix.com|wp.com|wpcomstaging|files.wordpress|cdn.shopify|images.weserv|res.cloudinary` — any match outside whitelist (analytics, fonts, Google CSE) = fail.

## Every page (media density — ***FAVOR VIDEO + MULTI-SOURCE GENERATION***)

Every page receives at minimum:

1. ALL original media from corresponding source URL (images, videos, PDFs preserved)
2. 1-2 supplemental GPT Image 1.5 / GPT-Image purpose-crafted originals (per-slot prompts per skill 12)
3. ≥1 Pexels Video API result for hero/module background (`<video autoplay muted loop playsinline poster>`)
4. Google Image Search top-3 HIGHLY-relevant images filtered by topic match score (vision-LLM ≥8)

- Hero background preference order: original-source-hero-image → Pexels-video-loop → Pexels-image → GPT Image 1.5-generated → solid-brand-gradient. Never ship a hero with no media.

## Every image (***BUSINESS-TYPE SEMANTIC MISMATCH — FAIL CLOSED — extends topic-relevance gate — BUILD-BREAKING***)

- GPT Image 2 vision topic-relevance ≥8/10 is necessary but NOT sufficient. A second binary check MUST run: "Is this image physically compatible with what a `<business_type>` business would show?"
- E.g. clothing/shirts on a box factory = fail; ambulance on a bakery = fail; tropical beach on an accounting firm = fail.
- Prompt: (a) business category from `_research.json.category`; (b) business type description from `_research.json.business_type_description`; (c) vision description of image. Answer YES/NO — any NO → regen with prompt refinement.
- Build gate (`validate-business-type-image-match.mjs`): every `[data-slot]` image runs a GPT Image 2 vision-mini YES/NO category-fit call — any NO = fail with slot ID, image URL, and rejection reason.

## Every site rebuild with known source domain (***PRIMARY DOMAIN MEDIA EXTRACTION MANDATORY — BEFORE ANY AI GENERATION***)

- Before invoking GPT Image 1.5 or any stock API, crawler MUST fully extract ALL media from the source business domain.

### Extraction pipeline

1. Firecrawl/Playwright deep crawl primary domain with REAL_UA
2. Extract every `<img src>`, `<picture>`, `<video poster>`, `<source src>`, CSS `background-image` URL, `og:image`, JSON `image` fields
3. Filter: keep ≥200×200px, ≥10KB, non-icon/sprite/tracking-pixel
4. Download + R2 self-host (never hotlink)
5. Run every extracted image through GPT Image 2 vision topic-relevance + business-type-match gate
6. Target: `source_image_count × 1.5` minimum total images in build

- NEVER start AI image generation until step 5 exhausted. `_media_slots.json` MUST show `filled_by: "source_extract"` for every slot filled by real extraction before `filled_by: "dalle"` or `filled_by: "pexels"` slots.
- Validator (`validate-source-media-extraction.mjs`): when `_research.json.source_domain` set, assert `_assets.json.extracted_images.length >= 1`.

## Every team headshot (***1:1 SQUARE CROP + CONSISTENT STYLE — UNIVERSAL — BUILD-BREAKING***)

- (a) Square aspect ratio (1:1), face centered, cropped at shoulder level — never portrait (4:5, 3:4) or landscape unless the full team page uses a SINGLE consistent non-square format.
- (b) Consistent style across ALL team members (same background tone, crop framing, shadow/border treatment) — never a mix of office photos + LinkedIn headshots + casual outdoor shots in the same grid.
- (c) Resolution ≥400×400px source, served at 200×200 minimum rendered size.
- (d) When source site has real headshots: download, AI-crop to 1:1 (Sharp `gravity: 'face'` or `sharp().resize(600,600,{fit:'cover', position:'face'})`), upload to R2.
- (e) When source has NO headshot: GPT Image 1.5 generates a professional headshot — prompt: `"Professional headshot of [gender]-presenting person in [industry-appropriate attire], neutral gray background, soft studio lighting, 1:1 square crop, photorealistic, Hasselblad quality, no text, no watermarks"` — NEVER ship a team card without a photo.
- (f) Face detection required — if Sharp face-detect returns 0 faces, reject and regenerate.
- Validator (`validate-team-headshots.mjs`): for every `[data-card-type=person]`, assert `<img>` natural aspect ratio between 0.9 and 1.1 AND rendered bounding-rect is square within 5%.

## Every listing-grid image (***CONSISTENT ASPECT RATIO WITHIN GRID — UNIVERSAL — BUILD-BREAKING***)

- All `<img>` elements within a single `[data-card-grid]` MUST share the SAME aspect ratio — 16:9 OR 4:3 OR 1:1 (portraits → 1:1; products → 4:3; hero/feature → 16:9).
- All images cropped to the grid's target aspect using Sharp `fit:'cover'` BEFORE upload to R2 — never CSS-cropped via `object-fit: cover` alone without actual crop.
- Each `<figure>` uses CSS `aspect-ratio: 16/9` (or equivalent) as a size placeholder.
- Validator (`validate-grid-image-aspect.mjs`): for every `[data-card-grid]`, compute `getBoundingClientRect()` of each `<img>` inside — if `max(width/height) - min(width/height) > 0.05` across images = fail.

## Every page render (***ALT-TEXT DEDUP BAN — UNIVERSAL — BUILD-BREAKING***)

- No two `<img>` elements on the same rendered route may share identical alt text (case-insensitive, whitespace-normalized).
- Template ships `src/lib/altText.ts` with `dedupeAltText<T>(assets)` that appends caption/context suffix on duplicate, and `findDuplicateAlts<T>()` for validation. `deriveAltFromSrc(src)` provides last-resort titleization fallback.
- Every loop rendering `<img>` from a data array MUST pipe the array through `dedupeAltText()` before mapping to JSX — never `.map(a => <img alt={a.alt} />)` raw.
- Validator (`validate-alt-dedup.mjs`): per-route DOM walk extracts every `<img alt>`, normalizes, fails on any duplicate AND on any empty alt that lacks `role="presentation"` or `aria-hidden="true"`.

## Every route (***PER-ROUTE OG IMAGE — UNIVERSAL — BUILD-BREAKING***)

- Every route MUST have a UNIQUE `og:image` and matching `twitter:image` — no shared site-wide `og-image.png` across routes. Each card is 1200×630 ≤100KB branded composition naming the page topic in headline + branded background + logomark + accent gradient.

### Discovery chain for per-route OG image

1. When route has a hero image meeting topic-relevance ≥8/10, composite hero into 1200×630 with branded gradient overlay + page title text + logomark
2. Else render branded card via Satori/Resvg SSR or Vercel OG Image API or Bannerbear API with template tokens `{title, eyebrow, accent, logo}` per `_brand.json`
3. Fallback: site-default OG card logged to `_unfillable_og.json` for manual replacement

- File path: `sites/<slug>/og/<route-hash>.png` (deterministic — `sha256(route)` first 8 chars).
- `og:image` MUST point to absolute URL; `og:image:width = 1200`; `og:image:height = 630`; `og:image:type = image/png`; `og:image:alt = "<page-specific-description>"`.
- Validator (`validate-route-og-image.mjs`): every route has og:image set; every og:image URL is unique across routes; every og:image URL HEAD-200 resolves; image dimensions exactly 1200×630; file size ≤100KB. Same checks apply to `twitter:image`.

## Every inline SVG in dist/ (***SVGO COMPRESSED — UNIVERSAL — BUILD-BREAKING***)

- All `<svg>` elements embedded inline in HTML or referenced as SVG files MUST pass SVGO optimization as a build step. Expected size reduction: 30-60%.
- Build pipeline MUST run `npx svgo --multipass` on all `.svg` source files AND on all `<svg>` blocks extracted from template HTML before final bundle.

### SVGO config

```js
{ plugins: ["preset-default", { name: "removeViewBox", active: false }] }
```

- Validator (`validate-svgo.mjs`): compute ratio `svgo_size / original_size` for every `.svg` in dist/ — if ratio >0.85 (less than 15% reduction), flag for review; if ratio === 1.0 (no optimization ran) = fail.

## Every page rendering a street address (***PROGRESSIVE-ENHANCEMENT MAPS CONTEXT — UNIVERSAL — BUILD-BREAKING — extends "Every site with a physical address"***)

- Every page that visually renders a street address (any `<address>` element OR `<AddressBlock>` OR string matching `\d+ [A-Z][a-z]+ (Street|St|Avenue|Ave|Road|Rd|Blvd|Lane|Ln|Drive|Dr)` rendered as page content — NOT just footer ambient NAP) MUST present that address with adjacent Google Maps visual context within the same DOM section.
- Progressive enhancement — keep `<address>` element + dir-link, ADD the visual.
- Required adjacency: map widget within same `<section>` or `<aside>` as the address OR within 1 viewport scroll on mobile (≤700px after the address).

### Three approved widget tiers

1. **MapTile** — 320×320 lazy-mounted thumbnail with one pin, `aspect-ratio: 1/1`; used inline beside contact cards / in `/we-need` tiles / service-page callouts (≤30KB rendered)
2. **MapBand** — full-bleed 16:9 or 21:9 banner with directions CTA overlay; used on `/contact` + service-detail pages + section dividers
3. **MapDossier** — split-screen 50/50 address+hours+phone left, interactive map right; used on `/contact` hero and "where to find us" features

- `<MapWidget variant="tile|band|dossier" address geo title aspectRatio>` shipped once in `src/components/map-widget.tsx`, never duplicated.
- Lazy-mount via IntersectionObserver — iframe injected only when section enters viewport. Placeholder: Sharp-rendered Maps Static API PNG OR brand-gradient SVG with pin glyph. Reduced-motion: no autoplay pan, static initial frame.
- NO MORE THAN 2 distinct map widgets per route; when 2 addresses on same page, single widget with 2 pins via `&q=` polyline encoding OR `place_id`.
- Same-page `LocalBusiness` / `Place` / `Organization` JSON-LD MUST include `geo: { latitude, longitude }` matching embed coords within 50m.
- Validator (`validate-address-map-adjacency.mjs`): for every page rendering an address, assert: (a) `<MapWidget>` OR `<iframe src*="google.com/maps/embed">` OR `<img src*="maps.googleapis.com/maps/api/staticmap">` OR `<noscript>` map fallback within same `<section>`/`<aside>`; (b) map widget count per route ≤2; (c) `LocalBusiness.geo` JSON-LD present. Fail codes: `address.map_adjacency_missing` | `address.map_widget_excess` | `address.geo_jsonld_missing`.
- **Footer NAP exemption** — the always-present footer-block address requires only the single small footer embed — does NOT trigger per-section adjacency rule.

## Every site with a physical address (***FULL-WIDTH GOOGLE MAPS WIDGET — UNIVERSAL — BUILD-BREAKING for local-business + non-profit + restaurant + medical + retail + any site with NAP***)

- Every site whose `_research.json` resolves a street address renders ONE full-width interactive map widget on `/contact` (mandatory) AND mirrors a smaller embed in the footer (recommended).
- MUST use Google Maps Embed API via `<iframe>` (no JS-API key required for basic embeds, free unlimited loads, no CSP `script-src` change needed) — NOT the Maps JavaScript API.

URL pattern:

```
https://www.google.com/maps/embed/v1/place?key=<MAPS_EMBED_KEY>&q=<urlencoded-address>&zoom=15&maptype=roadmap
```

- `MAPS_EMBED_KEY` set via `wrangler secret put MAPS_EMBED_KEY --env production`.
- `<MapWidget>` must include: `loading="lazy"`, `referrerpolicy="no-referrer-when-downgrade"`, `allowfullscreen`, `aria-label="Interactive map showing <address>"`, wrapped in `<figure>` with `<figcaption>` linking the address.
- `<noscript>` fallback renders Maps Static API image: `https://maps.googleapis.com/maps/api/staticmap?center=<lat>,<lng>&zoom=15&size=1200x675&markers=color:red%7C<lat>,<lng>&key=<MAPS_STATIC_KEY>`.
- For DASHBOARD CSP: append `frame-src https://www.google.com https://maps.google.com`.
- `LocalBusiness` JSON-LD on same page MUST include `geo: { @type: "GeoCoordinates", latitude, longitude }` matching embed coords exactly (rounded to 5 decimals = ~1.1m precision).
- Mapbox GL JS alternative when `_brand.json.theme==="dark" AND brand_consistency_priority>0.8` (50k loads/month free, requires `MAPBOX_TOKEN`).
- When `_brand.json.theme === "dark"` AND Mapbox NOT chosen, wrap `<iframe>` in `<div class="map-wrapper" data-theme="dark">` and apply: `filter: invert(90%) hue-rotate(180deg) saturate(0.5) contrast(1.1);`

### Custom logo marker pin

- When `_research.json.address_lat` + `_research.json.address_lng` known AND `_brand.json.logo.original_icon_url` resolves HEAD-200: download logo icon; Sharp composite — 80×80 white circle bg, logo centered 50×50, SVG downward-pointing triangle 20×20 as pin stem (brand accent color); save as `sites/<slug>/assets/map-marker.png`; upload to R2; append `&markers=icon:<absolute-r2-url-to-marker>%7C<lat>,<lng>` to Embed URL OR inject via Mapbox `addImage`+`addLayer`.
- Fallback: `&markers=color:red%7C<lat>,<lng>` when logo unavailable.
- Validator (`validate-google-maps-widget.mjs`): for every site with `_research.json.address` set, assert: (a) `<iframe src*="google.com/maps/embed">` OR `<div data-mapbox>` present on `/contact`; (b) iframe `width` resolves to ≥90vw at desktop; (c) `LocalBusiness.geo` lat/lng matches embed `q` resolved coords within 50m; (d) when `_brand.json.theme==="dark"`, iframe has `filter` style applied. Fail codes: `map.embed_missing` | `map.not_full_width` | `map.geo_mismatch` | `map.dark_theme_filter_missing`.

## Every page (***MULTIMEDIA DENSITY #1 — ≥3 DISTINCT MEDIA TYPES PER ROUTE — UNIVERSAL — BUILD-BREAKING***)

- Every page-rendered route MUST present ≥3 distinct media types — text-only pages are BUILD FAIL.
- Allowed types: photograph (GPT Image 1.5 OR real-entity); illustration/icon system; video (hero OR embedded clip); audio (podcast OR voiceover OR ambient); data visualization (chart OR infographic OR animated counter); 3D/WebGL (Three.js OR Spline OR particle field); interactive widget (calculator OR quiz OR map OR timeline scrubber); generative SVG (animated brand pattern).
- Distribution: hero — 1 media; feature section — 1-2 media; final CTA section — 1 media.
- Validator (`validate-multimedia-density.mjs`): grep dist HTML per route, assert ≥3 distinct types in: `<img>`, `<video>`, `<audio>`, `<svg>` with animation, `<canvas>`, `<iframe data-media-embed>`.

## Every page (***MULTIMEDIA DENSITY #2 — VIDEO-FIRST IN HERO + 1 PER 1000 WORDS — UNIVERSAL — BUILD-BREAKING***)

- Every site MUST ship ≥1 hero video AND ≥1 additional embedded video per ~1000 words of body content.
- Source order: source-site original videos (R2 self-hosted) → Sora generation (premium tier) → Coverr royalty-free → Pexels free 4K → AI-generated explainer via HeyGen (founder profile only).
- All videos MUST be MP4 H.264 OR WebM VP9 ≤4MB, lazy-loaded via `<video preload="metadata">` + `loading="lazy"`, `autoplay+muted+playsinline+loop` ONLY for hero/ambient; embedded body videos require `<video controls>`. HLS permitted for videos >4MB.
- Validator (`validate-video-density.mjs`): assert hero video present AND ratio of `<video>` elements to word count ≥1:1500.

## Every page (***MULTIMEDIA DENSITY #3 — DATA VIZ FOR EVERY QUANTITATIVE CLAIM — UNIVERSAL — BUILD-BREAKING***)

- Every page with ≥3 quantitative claims (%, N, $, dates, comparisons) MUST surface ≥1 data visualization rendering those claims — bar chart OR line graph OR animated counter OR sparkline OR proportional treemap OR map heatmap.
- Chart.js (≤30KB CDN) OR vanilla SVG (zero JS) OR observablehq embed OR D3.js (premium tier); visualization MUST tie to APA-cited data per `~/.claude/rules/citations.md` — viz title cites source inline.
- Validator (`validate-quantitative-data-viz.mjs`): grep dist HTML for ≥3 quantitative patterns (`\d+%`, `\$\d+[KMB]`, `\d+x`, `\d+ (years|users|customers|countries)`) on a page, assert ≥1 `<canvas data-chart>` OR `<svg data-viz>` OR `<dl data-stat-grid>` AND viz includes APA citation in caption/footnote.

## Every page (***MULTIMEDIA DENSITY #4 — AUDIO PRESENCE — UNIVERSAL — BUILD-BREAKING — homepage minimum***)

- Every site's homepage MUST embed ≥1 audio asset: NotebookLM podcast episode OR ElevenLabs founder voiceover OR audio brief OR ambient brand sound OR audio testimonial.
- Player: `<audio controls preload="metadata">` with transcript expander for accessibility (WCAG 2.2 1.2.1). Audio plays only on user-gesture (no autoplay).
- Validator (`validate-audio-presence.mjs`): assert homepage `<audio>` present + has `controls` + `<details data-transcript>` OR linked `.txt` transcript file.

## Every site (***PRE-RENDER MEDIA #1 — MEDIA FETCH PARALLEL WITH RESEARCH — UNIVERSAL — BUILD-BREAKING***)

- Build orchestrator MUST kick off media-fetch tasks (logo extraction, source-site asset crawl, Pexels/Pixabay search, GPT Image 1.5 prompt drafting) in parallel with research phase — NOT sequentially after research completes.
- Container spawns 3 worker tasks at boot: `research_task`, `brand_extraction_task`, `media_prefetch_task` — all 3 must complete before `content_synthesis_task` fires.
- Validator (`validate-parallel-media-fetch.mjs`): parse build trace timestamps, assert `media_prefetch_task.started_at ≤ research_task.started_at + 5s` AND `media_prefetch_task.ended_at ≤ research_task.ended_at + 30s`.

## Every site (***PRE-RENDER MEDIA #2 — GPT Image 1.5 BATCH SUBMISSION — UNIVERSAL — BUILD-BREAKING***)

- GPT Image 1.5 slot fill MUST batch-submit all prompts in a single concurrent burst (`Promise.all([...slots].map(generateDALLE))`) with concurrency limit of 10 (OpenAI rate limit) — NEVER sequential one-at-a-time.
- Total time = max(slot generation time) ≈ 12-18s vs sum (5min+) sequential. Per-slot timeout 20s with retry-once on transient failure.
- Validator (`validate-dalle-batch.mjs`): parse build trace, assert all GPT Image 1.5 API calls have overlapping `started_at` windows + max concurrent ≥5 + total GPT Image 1.5 phase duration ≤30s for ≤20 slots.

## Every site (***PRE-RENDER MEDIA #3 — MEDIA SLOT MANIFEST CACHED BY URL HASH — UNIVERSAL — BUILD-BREAKING — iter ≥2 incremental***)

- On rebuild at `iteration_count >= 2`, build orchestrator MUST hash source-site media URL list (`sha256(sorted(source_images[]))`) and compare against `_media_slots.json[previous].source_hash`. If match: skip source-image re-download + reuse prior GPT Image 1.5 generations whose source-data lineage hash matches.
- Only regenerate slots whose source data CHANGED OR whose vision-relevance score was below floor in prior iteration OR whose goody-queue entry mutates them.
- Validator (`validate-media-cache-reuse.mjs`): when `iteration_count >= 2`, assert `_media_slots.json[current].slots_reused_count > 50%` of total slots AND build's GPT Image 1.5 API call count is ≤ `slots_regenerated_count`.

## Every build (***IDEOGRAM LEVERAGE — CADENCE + REGISTRY — UNIVERSAL — BUILD-BREAKING***)

- Every build MUST generate ≥4 Ideogram v3 assets at slice 0; every progressive rebuild (iteration ≥2) MUST add ≥2 NEW Ideogram assets OR remix existing ones.
- Cadence: iteration 1 — 4-6 foundation assets; iteration 2+ — 2-3 incremental adds.
- Pipeline: brand extraction → `_brand.json` → Ideogram prompt template `(brand_name, palette, font_family, asset_role, dimensions, style="vector|editorial|stamp|poster")` → `ideogram.generate({ model: "v3-balanced", style_type, magic_prompt_option: "AUTO", rendering_speed: "QUALITY", color_palette, num_images: 4 })` → critique pass (GPT Image 2 vision ≥8/10) → R2 upload → log to `_ideogram_assets.json`.
- If Ideogram API quota exhausted, scan source-site Wayback/live for existing branded type/posters/banners — preserve + upscale before generating.
- Validator (`validate-ideogram-cadence.mjs`): assert `_ideogram_assets.json[iteration].length >= floor_for_iteration` AND every entry has `{role, prompt, r2_url, dimensions, critique_score, source: "ideogram_v3" | "source_site_preserved"}`.

## Every build (***IDEOGRAM SLOT #1 — LOGO + WORDMARK + MONOGRAM SUITE — UNIVERSAL — BUILD-BREAKING***)

- Slice 0 brand kit MUST include Ideogram-generated logo + wordmark + monogram triad: **Logo** (full lockup, icon + wordmark, header/footer); **Wordmark** (type-only, email signatures, watermarks); **Monogram** (initials/icon-only, favicon, app icon, social avatar, large faded BG watermark).
- Prompt template: `"<brand_name> logo design, <style_directive_from_brand_research>, <palette> color palette, vector style, transparent background, professional"`.
- Validator (`validate-logo-triad.mjs`): assert `_brand.json.logo.{full,wordmark,monogram}` all resolve 200 AND match brand palette ΔE≤5.

## Every build (***IDEOGRAM SLOT #2 — FAVICON-SET GENERATOR FROM MONOGRAM — UNIVERSAL — BUILD-BREAKING***)

- Every site MUST derive the 9-asset favicon set (`favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon-180x180.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png`, `mstile-150x150.png`, `safari-pinned-tab.svg`, `maskable-icon-1024x1024.png`) from Ideogram-rendered monogram — NEVER from automated resize of full logo (loses fidelity at 16x16).
- Pipeline: Ideogram monogram @ 1024×1024 → ImageMagick downscale + sharp recompress → realfavicon API verification.
- Validator (`validate-favicon-set.mjs`): assert all 9 files exist in `dist/` AND `favicon-16x16.png` retains recognizable mark (pHash distance ≤12 from 1024×1024 source).

## Every build (***IDEOGRAM SLOT #3 — OG/TWITTER CARD PER ROUTE — UNIVERSAL — BUILD-BREAKING***)

- Every route MUST ship its own Ideogram-generated OG card (1200×630) AND Twitter card (1200×675) — NEVER reuse a single site-wide card. Each card features the route's H1 in brand typography over branded background pattern + brand logo lockup.
- Prompt template per route: `"social share card design, headline '<route_h1>', <brand_name> logo bottom-right, <palette>, <font_family>, 1200x630, modern editorial"`.
- Validator (`validate-og-card-per-route.mjs`): assert `dist/og/<route-slug>.png` exists for every `RouteMetadata.path` AND `og:image` meta points to it AND image dims === 1200×630.

## Every build (***IDEOGRAM SLOT #4 — HERO TYPOGRAPHIC POSTER (THESIS PLATE) — UNIVERSAL — BUILD-BREAKING***)

- Every site MUST ship 1 hero typographic poster — large brand wordmark or thesis statement as editorial-poster typography for above-the-fold accent (sits behind/beside video BG OR replaces video on low-bandwidth fallback).
- Prompt template: `"editorial poster design, large bold typography '<one_line_thesis>', <brand_name>, <palette>, abstract <theme_from_research> background motif, minimalist, magazine-cover style"`.
- Validator (`validate-hero-poster.mjs`): assert `_ideogram_assets.json[].role === "hero_poster"` exists with critique ≥8/10.

## Every build (***IDEOGRAM SLOT #5 — SECTION-DIVIDER CHAPTER PLATES — UNIVERSAL — BUILD-BREAKING***)

- Long-form pages (about, history, services, blog post >2000 words) MUST insert Ideogram-generated chapter-divider plates between major sections — typographic art renderings of section H2s. Floor: 1 plate per 3 H2s on long pages.
- Prompt template: `"editorial chapter divider, large typography '<h2_text>', <brand_name> color palette, <font_family>, minimalist horizontal banner 1600x400, magazine-style section break"`.
- Validator (`validate-chapter-plates.mjs`): assert long-form route renders ≥`ceil(h2_count/3)` plates in DOM with `<figure data-role="chapter-plate">` AND each `<img>` resolves to a unique Ideogram asset.

## Every build (***IDEOGRAM SLOT #6 — EDITORIAL BLOG POST HEADERS — UNIVERSAL — BUILD-BREAKING***)

- Every blog/journal post MUST have an Ideogram-generated editorial header image (1600×900) combining post title typography + relevant visual motif — replaces default GPT Image 1.5 stock-photo header on content-rich routes.
- Prompt template: `"editorial article header, title '<post_title>', <subject_motif_from_post_body>, <palette>, <font_family>, magazine-cover composition, 16:9"`.
- Validator (`validate-blog-headers.mjs`): assert every `_blog.json[].featured_image` derived from Ideogram OR explicitly tagged `source: photographic` with justification.

## Every build (***IDEOGRAM SLOT #7 — 404 + 500 BRANDED ERROR PAGES — UNIVERSAL — BUILD-BREAKING***)

- Every site MUST ship Ideogram-generated 404 + 500 hero art — typography-first error pages that feel brand-native.
- Prompt templates: **404** — `"playful '404' typography in <brand> style, friendly error illustration, <palette>, <brand_name> logo small bottom"`; **500** — `"abstract '500' typography in <brand> style, calm error illustration, <palette>"`.
- Validator (`validate-branded-error-pages.mjs`): assert `dist/404.html` + `dist/500.html` render Ideogram-sourced hero `<img>` AND status codes 404/500 served by worker route map.

## Every build (***IDEOGRAM SLOT #8 — PWA SPLASH SCREENS — UNIVERSAL — BUILD-BREAKING***)

- Every site MUST ship Ideogram-generated PWA splash screens at iOS + Android required sizes: **iOS** — 640x1136, 750x1334, 1242x2208, 1242x2688, 1536x2048, 1668x2388, 2048x2732; **Android** — 320x568, 360x640, 412x732, 480x800. Each splash = monogram centered on brand-gradient BG with brand wordmark below.
- Prompt template: `"PWA splash screen, <brand_name> monogram centered, <palette> gradient background, wordmark below, <dimensions>, mobile splash design"`.
- Validator (`validate-pwa-splashes.mjs`): assert all 11 splash sizes resolve in `dist/splash/` AND manifest references them via `apple-touch-startup-image` + Workbox precache.

## Every build (***IDEOGRAM SLOT #9 — PRICING TIER BADGES — SaaS/MEMBERSHIP MODE — BUILD-BREAKING***)

- SaaS / membership / non-profit-tier sites MUST ship Ideogram-generated tier badges (Starter/Pro/Patron/Founder/Sustainer) — embossed typographic seals NOT generic icon-pack medals.
- Prompt per tier: `"premium membership badge design, '<tier_name>' typography, embossed style, <palette>, <brand_name> mark, circular seal, gold/silver/bronze accent for tier hierarchy"`.
- Validator (`validate-tier-badges.mjs`): assert pricing-page renders Ideogram badge per pricing tier in `_pricing.json.tiers[]`. Skipped on portfolio/local-business builds.

## Every build (***IDEOGRAM SLOT #10 — NUMBERED CHAPTER GLYPHS — UNIVERSAL — BUILD-BREAKING***)

- Every feature/process/services section with ≥3 steps MUST render Ideogram-generated numbered chapter glyphs (`"01"`, `"02"`, `"03"`...) as section markers — bold numeral typography in brand style.
- Prompt template: `"large bold numeral '<NN>' typography, editorial magazine style, <brand_name> color palette, <font_family>, single-character, transparent background, vector"`.
- Validator (`validate-chapter-glyphs.mjs`): assert `_ideogram_assets.json[].role === "chapter_glyph"` count ≥ max(step_count, 3) across site.

## Every build (***IDEOGRAM SLOT #11 — BRAND PATTERN / WATERMARK TILE — UNIVERSAL — BUILD-BREAKING***)

- Every site MUST ship 1 Ideogram-generated repeating pattern tile (256×256 or 512×512) using brand monogram + secondary motif — applied as footer BG, large faded watermark, or section divider texture.
- Prompt template: `"seamless repeating pattern tile, <brand_name> monogram motif, <palette>, subtle texture, geometric or organic per brand voice, 512x512 tileable"`.
- Validator (`validate-pattern-tile.mjs`): assert `dist/assets/pattern.png` or `pattern.svg` exists AND used in CSS as `background-image: url(...)` with `background-repeat` in ≥1 route.

## Every build (***IDEOGRAM SLOT #12 — STAT-ROLLUP NUMERAL CARDS — UNIVERSAL — BUILD-BREAKING***)

- Every site with quantitative trust signals (years founded, members served, projects completed, $ raised) MUST render those numerals as Ideogram-generated typography cards — NOT plain CSS-rendered numbers.
- Prompt per stat: `"giant numeral '<value>' typography card, label '<unit>' below, <brand_name> palette, editorial poster style, 800x800, magazine cover"`.
- Validator (`validate-stat-numerals.mjs`): assert `_research.json.stats[]` items each have an Ideogram asset rendered in DOM with IntersectionObserver count-up animation (skill 11 rule).

## Every build (***IDEOGRAM SLOT #13 — SHAREABLE QUOTE / TESTIMONIAL CARDS — UNIVERSAL — BUILD-BREAKING***)

- Every site with testimonials/quotes/manifesto MUST render social-shareable quote cards via Ideogram — 1:1 (Instagram) + 9:16 (Stories/TikTok) + 16:9 (LinkedIn).
- Prompt template: `"social media quote card, '<quote_text>' typography in <brand_font>, attribution '<author>, <role>', <palette>, <aspect>, modern editorial design"`.
- Validator (`validate-share-quote-cards.mjs`): assert every testimonial in `_testimonials.json` has ≥2 aspect variants in `dist/share/` AND share buttons download or open-in-share-sheet the matching aspect.

## Every build (***IDEOGRAM SLOT #14 — PROGRESSIVE-BUILD ITERATION STAMP/SEAL — UNIVERSAL — BUILD-BREAKING***)

- Every progressive rebuild (iteration ≥1) MUST generate an Ideogram "iteration N" stamp/seal — embossed circular mark like `"Build vN · Refined 2026-05-11 · By AI + Brian"` surfaced on `/admin/build-trace` AND as Easter-egg footer watermark on hover.
- Prompt per iteration: `"vintage certification stamp, 'Build v<N>' typography, date '<iso_date>', <brand_name> monogram center, <palette>, circular seal, embossed gold/silver"`.
- Validator (`validate-iteration-stamp.mjs`): assert `_ideogram_assets.json[].role === "iteration_stamp"` increments per `sites.iteration_count`.

## Every build (***MULTIMEDIA DENSITY — FREE API MULTI-SOURCE — UNIVERSAL — BUILD-BREAKING***)

- Every build MUST populate every page-rendered experience with multimedia from ≥5 free/optimal APIs IN PARALLEL — concurrency floor: ≥7 API calls overlapping.
- Required APIs: Pexels, Pixabay, Google Custom Search Image API, Wikimedia Commons API, Internet Archive, Library of Congress, NASA Images, Smithsonian Open Access, The Met Open Access, Europeana, Flickr Commons, YouTube Data API, Vimeo, Coverr, Mixkit, Pexels Video.

### Pipeline

```
media_orchestrator.fanOut(topic, palette, license=CC-BY-or-permissive)
  → Promise.all([pexels, pixabay, googleCSE, wikimedia, archiveOrg, loc, nasa, smithsonian, met, europeana, flickrCommons, youtube, vimeo, coverr, mixkit, pexelsVideo])
  → dedupe by pHash
  → license-filter (CC-BY+/CC0/public-domain only)
  → relevance score via GPT Image 2 vision (≥7/10)
  → R2 self-host
  → emit `_media_corpus.json[{source, license, attribution, r2_url, relevance_score, license_url}]`
```

- Validator (`validate-media-density.mjs`): assert every content section has ≥3 media items AND ≥5 distinct sources represented across build AND every asset has license metadata + attribution rendered in `/credits` page.

## Every build (***GOOGLE CUSTOM SEARCH IMAGE API — LICENSE-FILTERED — UNIVERSAL — BUILD-BREAKING***)

- Every build MUST query Google Custom Search JSON API with `searchType=image` + `rights=cc_publicdomain,cc_attribute,cc_sharealike,cc_noncommercial` for every topic in `_research.json.topics[]` + every named entity in `_corpus.json`.

API:

```
https://www.googleapis.com/customsearch/v1?key=<GOOGLE_CSE_KEY>&cx=<GOOGLE_CSE_CX>&q=<topic>&searchType=image&rights=cc_attribute&imgSize=large&safe=active
```

- Floor: ≥10 Google CSE Image queries per build; ≥3 candidates per query; ≥1 selected per page.
- Pair with reverse-image lookup (Tineye-free / Google Lens via Vision API) to verify license claims before R2-self-hosting.
- Validator (`validate-google-image-corpus.mjs`): assert `_media_corpus.json` contains ≥10 entries with `source: "google_cse"` AND every entry passes license verification.
- Required keys: `GOOGLE_CSE_KEY` (`https://console.cloud.google.com/apis/credentials`); `GOOGLE_CSE_CX` (`https://programmablesearchengine.google.com/controlpanel/all`).

## Every build (***PODCAST GENERATION — NOTEBOOKLM + PODCAST INDEX DUAL-MODE — UNIVERSAL — BUILD-BREAKING***)

- Every build MUST produce 1 NEW NotebookLM-generated "Deep Dive" podcast episode (2-host conversation, 8-15min) per iteration AND embed ≥3 DISCOVERED relevant existing podcast episodes via Podcast Index API. Google Podcasts API deprecated 2024.
- (a) **NotebookLM API** for generation — `_research.json` + `_corpus.json` uploaded as sources → trigger Audio Overview → poll → download MP3 → R2 self-host → embed via custom audio player on `/about` + `/podcast` route.
- (b) **Podcast Index API** (`https://podcastindex.org/`, free, no key required) for discovery — `GET /api/1.0/search/byterm?q=<topic_or_brand>` → filter by recency + relevance → embed top 3 via iframe player.
- (c) **YouTube Data API v3** for podcast discovery — `GET /search?q=<topic>+podcast&type=video&videoDuration=long`.
- Pipeline: parallel fan-out → assemble `_podcasts.json[{type:"generated|discovered", source, audio_url, transcript_url, duration_s, hosts, embed_html}]` → `/podcast` route renders chronological feed + RSS feed (`/podcast/feed.xml` per RFC 5005) → submit to Apple Podcasts + Spotify on first iteration.
- Validator (`validate-podcast-presence.mjs`): assert `_podcasts.json.generated.length >= 1` per iteration AND `_podcasts.json.discovered.length >= 3` AND `/podcast/feed.xml` validates against PodcastIndex spec.
- Required keys: `NOTEBOOKLM_API_KEY` (Google Cloud Vertex AI); `YOUTUBE_API_KEY` (`https://console.cloud.google.com/apis/credentials`).

## Every build (***ATF VIDEO BACKGROUND — SORA + VEO + STOCK FALLBACK — UNIVERSAL — BUILD-BREAKING***)

- Every site's homepage hero AND every long-form route hero MUST ship an above-the-fold video background.

### Generation cascade (parallel, take-first-success)

- (a) **OpenAI Sora 2** primary — `POST /v1/videos` with `prompt: "<brand_thesis_scene_description>, cinematic, 10s, 16:9, 1080p, no text"` + `duration_seconds: 10` + `aspect_ratio: "16:9"` → poll task → download MP4
- (b) **Google Veo 3** parallel — Vertex AI `predictLongRunning` with `prompt` + `aspectRatio:"16:9"` + `durationSeconds: 8` + `personGeneration: "allow_adult"` → poll → download
- (c) **Stock video fallback** (when generation quota/budget exhausted) — Pexels Video API `GET /videos/search?query=<theme>&orientation=landscape&size=large` OR Coverr `/api/v1/videos/search` OR Mixkit free-tier — must be CC0/permissive

- Encode to WebM (VP9) + MP4 (H.264) at 1920×1080 + mobile 854×480, total ≤4MB per video.

```html
<video autoplay muted loop playsinline preload="metadata" poster="<ideogram_hero_poster_fallback>">
  <source type="video/webm">
  <source type="video/mp4">
</video>
```

- Respect `prefers-reduced-motion` — render Ideogram poster instead. Lazy-load secondary route heroes via IntersectionObserver.
- Validator (`validate-atf-video.mjs`): assert homepage hero has `<video>` with valid src AND fallback poster AND total page weight ≤5MB AND `prefers-reduced-motion` gracefully degrades.
- Required keys: `OPENAI_API_KEY` (Sora); `GCP_VEO_KEY` or `GOOGLE_APPLICATION_CREDENTIALS` (Veo via Vertex AI); `PEXELS_API_KEY` (stock fallback).

## Every progressive build (***PROGRESSIVE MEDIA REFRESH — UNIVERSAL — BUILD-BREAKING***)

- Every iteration ≥2 MUST refresh ≥1 hero video + add ≥2 NEW Ideogram assets + expand `_media_corpus.json` by ≥10 items — never re-serve identical media across iterations.
- Iteration cadence: iteration 1 — baseline Sora hero; iteration 2 — Veo variant + new chapter plates; iteration 3 — Sora seasonal variant + new pattern tile + new tier badges.
- Validator (`validate-progressive-media.mjs`): for iteration ≥2, assert `_media_corpus.json[current].length >= _media_corpus.json[prior].length + 10` AND hero video pHash differs from prior iteration's pHash.

## Every build (***CREDITS + ATTRIBUTION PAGE — UNIVERSAL — BUILD-BREAKING***)

- Every site MUST ship a `/credits` (or `/colophon`) route rendering full attribution for every multimedia asset — image source + license + author + URL. Sourced from `_media_corpus.json` automatically. Required by Wikimedia/CC-BY licenses + ethical defaults.
- Validator (`validate-credits-page.mjs`): assert `/credits` renders ≥1 entry per `_media_corpus.json` item AND each entry has author link + license link + source URL AND robots = `index,follow`.
