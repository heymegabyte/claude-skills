---
name: "media-acquisition"
description: "12+ API media sourcing strategy for site generation. Stock photos, AI-generated images, logos, videos, favicon sets. Collect 100 candidates → AI inspect → curate top 15."
updated: "2026-04-24"
---

# Media Acquisition

Collect 10x more assets than needed, curate down via AI visual inspection.

> **Model migration note (pass-73, 2026-06-09)**: `DALL-E 3` / `DALL-E` → **GPT Image 1.5**; `GPT-4o` vision → **GPT Image 2 vision**. Per `platform.openai.com/docs/deprecations`: DALL-E 2/3 removed 2026-05-12; GPT-4o retired 2026-02-13. Pipeline structure unchanged. Cost ranges were computed against legacy DALL-E pricing — re-verify against current GPT Image 1.5 / GPT Image 2 rates.

### Asset count scales with page count

- 6+ images on home; 4+ images on every sub-page; 1 logo + 5–10 AI originals + 3–5 videos
- 4-page rebuild ⇒ 30–50 images; 50-page ⇒ 200+; 500-page ⇒ 2000+
- Page count comes from source sitemap (1:N mapping, max 1000) — NEVER cap at 4-page-site numbers when source has more

## Media Slot Manifest

***PHASE 0 — BEFORE ANY GENERATION — UNIVERSAL — BUILD-BREAKING***

- Enumerate EVERY image slot on EVERY route into `_media_slots.json` before any agent fans out
- Each slot has: explicit identity, per-slot GPT Image 1.5 prompt, ordered source-resolution chain, final-fill commitment
- `_media_slots.json` with all slots filled = images guaranteed; without manifest = ships missing images

### Slot record schema (JSON)

```json
{
  "slot_id": "home.hero.bg",
  "route": "/",
  "section": "hero",
  "role": "background",
  "aspect": "16:9",
  "min_dims": [1920, 1080],
  "topic_keywords": ["soup kitchen volunteers serving", "warm community gathering"],
  "topic_intent": "people-actively-serving (NOT generic charity stock, NOT mixed adults if women+children focus)",
  "brand_palette": ["#7C2D12", "#FED7AA"],
  "preferred_motion": "video",
  "source_chain": ["original-source-hero", "pexels-video", "coverr", "dalle-photoreal", "flux-pro", "brand-gradient"],
  "dalle_prompt": "Photorealistic documentary-style overhead shot of volunteers serving soup at a community kitchen, warm window light, 85mm lens, brand palette burgundy #7C2D12 + cream #FED7AA, shallow depth of field, no text, no watermarks, no logos, hyperdetailed, 16:9 cinematic",
  "negative_prompt": "no text, no watermarks, no logos, no extra fingers, no AI artifacts, no stock-photo cliches",
  "relevance_floor": 8,
  "filled_by": null,
  "filled_url": null,
  "filled_score": null,
  "regen_attempts": 0
}
```

### Manifest generation (***runs ONCE per build, before any agent fans out***)

1. Parse sitemap → classify each route's section archetype (hero/services/team/blog-card/gallery/cta/about/testimonial/footer)
2. Instantiate slot records from `_slot_templates.json`
3. Populate `topic_keywords` + `topic_intent` + `dalle_prompt` via single batched LLM call across all slots (`gpt-4o` ~$0.05/site)

Manifest is the SINGLE source of truth — every downstream agent reads `_media_slots.json` and writes back `filled_url` + `filled_score`.

### Per-slot GPT Image 1.5 prompt mandatory fields

1. Page topic+intent verbatim from `topic_intent`
2. Brand palette tokens from `_brand.json.colors`
3. Composition + aspect ratio matching `aspect`
4. Subject specificity (NEVER "people" — always "octogenarian volunteer plating soup")
5. Photographic technical specs (camera, lens, lighting, DoF)
6. Negative prompt block

Generic "create a hero image for /about" prompts FAIL `validate-image-prompts.mjs`.

## Fail-CLOSED Auto-Regenerate

***ZERO MISSING IMAGES — NEVER SHIP BLANK SLOTS — UNIVERSAL — BUILD-BREAKING***

- Every slot MUST end the build with `filled_url != null AND filled_score >= relevance_floor`
- Failure modes triggering immediate auto-regeneration via GPT Image 1.5 with refined prompt: Pexels returns nothing, NSFW-flagged result, broken scraped image, GPT Image 2 vision relevance score ≤6/10
- NEVER silent skip; NEVER substitute brand-gradient unless 5 regen attempts exhausted

### Regen loop (per slot, max 5 attempts)

1. **Initial fill** via `source_chain` walk: original → Pexels Video → Coverr → GPT Image 1.5 → Flux → brand-gradient. First source returning a candidate gets vision-scored.
2. **If `filled_score < relevance_floor`** (default 8/10) OR 0 candidates → regen with GPT Image 1.5: feed `(original_prompt, vision_critique, relevance_floor)` to gpt-4o, get tightened prompt with what to ADD + REMOVE. Increment `regen_attempts`.
3. **Refined GPT Image 1.5 generation** (gpt-image-1 HD, ~$0.04–0.08) → vision-score → if pass, commit; if fail and `regen_attempts < 5`, GOTO 2.
4. **After 5 attempts**: log to `_unfillable_slots.json`, fall back to brand-gradient. Build completes but post-build report flags slot for manual review.

### Hard gate

- `_unfillable_slots.json` must be empty for a clean build
- ANY entry = build status `published_with_warnings`, dashboard surfaces slot, alert email to operator

### Cost ceiling

- 5 attempts × $0.08/img = $0.40 worst case per slot
- ~30 slots/site at 0.3 regen rate average → worst-case GPT Image 1.5 spend ~$3.60/site (typical $0.50–1.50)
- Tracked per-build in `_dalle_spend.json`; daily rollup in `_dalle_daily.json` against `OPENAI_DAILY_BUDGET` env (default $50)
- Budget exhaustion triggers fallback to Flux for remainder of day

## Original Media Extraction

***FIRST STEP — EVERY BUILD WITH A SOURCE SITE***

Walk the source site and extract EVERYTHING before any stock/AI sourcing — original media is canonical brand voice.

### Walk-list (apply to every page in sitemap, in order)

1. **`<header>` + `<nav>` logos** via the Logo Discovery chain below
2. **ALL `<img src>`, `<img srcset>`, `<picture><source srcset>`, `<image href>` (SVG)** — download every srcset variant, keep largest
3. **CSS background-images** — parse computed styles via Playwright (`window.getComputedStyle(el).backgroundImage`) for every visible element
4. **Slider/carousel/swiper images** (***NEVER MISS — they hide from naive scrapers***):
   - Swiper.js (`.swiper-slide img`)
   - Slick (`.slick-slide img`)
   - Splide (`.splide__slide img`)
   - Glide (`.glide__slide img`)
   - WordPress Smart Slider (`.n2-ss-slide-background-image`)
   - Squarespace Gallery (`.sqs-gallery-image img, .sqs-gallery-block-grid img, [data-slide-url]`)
   - Wix Gallery (`[data-mesh-id*="gallery"] img`)
   - Elementor Slides (`.elementor-slide-bg`)
   - bxSlider/Owl/Flickity equivalents
   - Query each container, force JS via Playwright (`waitForLoadState('networkidle')`), extract every slide image
5. **`<video src>` + `<source src>`** + lazy-load placeholders (`data-src`, `data-original`, `data-lazy`, `data-srcset`, `loading="lazy"`)
6. **Downloadable documents** — `<a href$=".pdf">`, `.doc(x)`, `.ppt(x)`, `.xls(x)`, `.zip` (resumes, brochures, menus, annual reports — feature on new site per "Document Preservation" below)
7. **`og:image`, `twitter:image`, `og:video`, `msapplication-TileImage`, `<link rel="preload" as="image">` URLs**
8. **Inline SVGs** (copy `<svg>` markup verbatim — often custom brand illustrations)
9. **WordPress block images** (`wp-image-*` classes → `wp-json/wp/v2/media/{id}` returns full-size original)

### Group preservation (***NEVER FLATTEN — slider images stay sliders***)

- Store slider/carousel/gallery images with group identity: `public/images/sliders/{slider-id}/{order-index}-{filename}`
- Emit manifest entry `{group, order, aspect, autoplay, interval}`
- Rebuild the same slider with same images in same order — never dump into flat gallery grid

### 1.4x–2.0x augmentation rule (***NEVER FEWER IMAGES THAN ORIGINAL***)

- New site MUST ship `original_count × 1.4` minimum, `× 2.0` typical, `× 3.0` for thin sources (<10 originals)
- Augmentation = original + Pexels/Pixabay stock + GPT Image 1.5 originals + Google CSE

### Multimedia Agent Integration (***FIRST-CLASS PARALLEL AGENTS — every build runs all 4 in parallel during Phase 0***)

- Spawn Pexels, Google CSE, GPT Image 1.5, and Original-Site Crawler as first action of every build (before template clone)
- Each writes to `_assets/{agent}/` with metadata; main thread merges + dedupes via md5 + AI-rates via Workers AI Llama Vision (free) + curates final set

**Agent table**:

- **Pexels** — trigger: `PEXELS_API_KEY` | min output: 8 stills + 3 videos/site | 4–6 parallel queries (`{type} interior`, `{type} {city}`, `{service} professional`, `{atmosphere}`) | free commercial license
- **Google CSE** — trigger: `GOOGLE_CSE_KEY`+`GOOGLE_CSE_CX` | min output: 5 context shots | 3–5 queries (`"{name}" {city}`, `"{name}" team`, `"{name}" exterior`, `{neighborhood} {type}`) | filter `rights=cc_publicdomain,cc_attribute,cc_sharealike`; verify license before download
- **GPT Image 1.5** — trigger: `OPENAI_API_KEY` | min output: 5 originals/site | 5 parallel generations (1 hero HD 1024×1792 + 3 sections 1024×1024 + 1 OG 1024×1024) | PRIMARY for AI imagery — Brian's stated preference
- **Original-Site Crawler** — trigger: source URL provided | min output: every page crawled | Playwright concurrency 6, 1000-page cap | walks img/picture/CSS bg/sliders/lazy/og:image/PDFs

### Two GPT Image 1.5 modes (***use heavily — both modes per site***)

**(1) Ultra-real photography mode** — `"Photorealistic [scene], [brand color palette], [logo style adjective], shot on Hasselblad, golden hour, 85mm prime, no text/logos, hyperdetailed, cinematic"` — for hero backgrounds, service illustrations, atmospheric textures.

**(2) Creative narrative mode** — when source has unique brand story or strong logo motif, generate scene-by-scene narrative imagery extending that visual world (e.g. mountain motif → dawn climb, summit view, valley basecamp). Pair narrative scenes with site copy beats.

Cost: ~$0.04–0.08/image, total $0.30–0.50/site.

### Sora video agent (***when OPENAI_API_KEY present***)

- Generate 1–2 short narrative video loops per site (5–10s, muted, autoplay) for hero backgrounds; cost ~$0.20–0.40 each
- Falls back to Pexels Video API loops when Sora unavailable

### Image count scales with sitemap (***NEVER cap at 4-page-site numbers***)

- Required count = `max(30, original_image_count × 1.4, page_count × 6_home_or_4_sub)`
- Source sitemap.xml is ground truth; cap at 1000 pages

### Tier S Agents — beyond Pexels/CSE/GPT Image 1.5

***ALL first-class, all parallel in Phase 0 when keys present***

| # | Agent | Trigger | Use Case | License | Cost | Min Output |
|---|-------|---------|----------|---------|------|------------|
| 1 | **Wikimedia Commons** | always (no key) | Named buildings/landmarks/public figures, historical context | CC0/CC-BY/CC-BY-SA | free | scan every business name/location/founder for matches |
| 2 | **Wikipedia + Wikidata** | always (no key) | Entity-based imagery; infobox image + structured properties | CC | free | when entity exists |
| 3 | **Flickr Creative Commons** | `FLICKR_API_KEY` | Niche photography Pexels misses — filter `license=4,5,6,7,9,10` | CC-BY/CC-BY-SA/CC0 | free | 5–10 niche-relevant shots/build |
| 4 | **FLUX.1 (via fal.ai)** | `FAL_API_KEY` OR `REPLICATE_API_TOKEN` | Secondary AI — photoreal humans, complex multi-subject scenes. [pro] for hero, [schnell] for iteration | commercial OK | ~$0.025–0.05/img | 2–3 narrative variants per major section |
| 5 | **Recraft v3** | `RECRAFT_API_KEY` | Vector + raster AI — brand-adherent SVG icon sets, illustrations, infographics. Output = editable SVG | commercial OK | ~$0.04/img | full icon set when no Lucide match |
| 6 | **Mapbox Static Images** | `MAPBOX_TOKEN` | Custom-styled map PNGs (brand-color-matched, no JS) | commercial OK | free up to 50K/mo | 1 map per address-bearing page |
| 7 | **Cloudinary** | `CLOUDINARY_*` | Transform layer: auto-format (WebP/AVIF), auto-quality, AI-crop (`g_auto`), generative-fill, background-removal, upscale, color-cast correction. Apply to EVERY non-AI image post-fetch | — | free 25GB/mo | every image piped through |
| 8 | **Remove.bg / Photoroom** | `REMOVE_BG_API_KEY` OR `PHOTOROOM_API_KEY` | Background removal on team headshots, product shots, logos | commercial OK | ~$0.20–0.30/img | every team headshot + product shot |
| 9 | **Magnific / Real-ESRGAN** | `MAGNIFIC_API_KEY` OR local bin | AI upscale 4x–8x on low-res scraped originals | commercial OK | ~$0.10/img Magnific, free local | every scraped image <800px wide |
| 10 | **unDraw** | always (no key) | Free customizable SVG illustrations — brand-color-matched at fetch time via URL param | MIT-style | free | 5–10 brand-tinted SVGs/site |
| 11 | **Iconify** | always (no key) | 200K+ icons unified API — beats Lucide for niche/brand icons | various open | free | unlimited |
| 12 | **Coverr + Mixkit** | always (no key) | Free stock video supplement — Coverr (MP4 direct), Mixkit (MP4 + music) | commercial OK | free | 2–3 supplemental videos/site |
| 13 | **Internet Archive Wayback** | always (no key) | Source site dead/blocked — pull last good snapshot of every URL | PD/fair use | free | every dead-source rebuild |
| 14 | **ElevenLabs (audio)** | `ELEVENLABS_API_KEY` | AI voice narration — about-us voiceover, podcast intro, accessibility audio | commercial OK | ~$0.02/1K chars | 1 narration/site (about page) |
| 15 | **MusicGen / Suno / Udio** | `OPENAI_API_KEY` OR Replicate | AI background music for video heroes, brand sonic identity | commercial OK varies | ~$0.05–0.20/track or free | 1–2 brand-themed tracks/site |
| 16 | **Sora (video)** | `OPENAI_API_KEY` | AI video — short narrative loops extending logo motif | commercial OK | ~$0.20–0.40/clip | 1–2 narrative loops/site |
| 17 | **Public-domain archives (situational)** | always (no key) | NASA Image API, Smithsonian Open Access, Met Museum, Rijksmuseum, NOAA, USGS, Library of Congress, NYPL Digital Collections, Europeana — match to site narrative when topical | PD | free | when topical match exists |

### Source-attribution discipline (***license-by-license, render in image alt+JSON-LD***)

- Every non-PD image carries `{source, license, attribution_required, attribution_text, attribution_url}` in `_image_profiles.json`
- **CC-BY/CC-BY-SA** → render attribution in figcaption + JSON-LD `creditText`
- **CC0/PD** → no attribution required; record source for audit
- **Commercial stock** (Pexels/Pixabay) → optional credit; render when present
- **Build gate**: any CC-BY image without `attribution_text` in HTML = FAIL

### Phase 0 parallel execution architecture (***17-agent fan-out, single-thread merge***)

- Fork 17 agent processes via `Promise.all([...])` (or `xargs -P 17`)
- Each reads `_research.json` + `_form_data.json`, writes to `_assets/{agent}/`, exits
- Main thread merges into `_assets.json` + `_image_profiles.json`, runs Cloudinary transform pipeline, AI-rates via Workers AI Llama Vision, curates via score threshold
- Total wall-clock: ~30–60s (network-bound); cost: $0.50–2.00/site
- 4-agent baseline (Pexels/CSE/GPT Image 1.5/Crawler) is the floor; 17-agent stack is the ceiling

### GPT Image 1.5 first for originals (***Brian's stated preference — use it a lot***)

- Generate 3–5 hero variants per major section
- Prompt template: `"Photorealistic [scene], [brand color palette], [logo style adjective], shot on Hasselblad, golden hour, 85mm, no text, no logos, hyperdetailed, cinematic"`
- Cost: ~$0.04–0.08/image (HD 1024×1792)
- Reserve Stability AI for textures/patterns; Sora for short videos

## Document Preservation

***RESUMES, BROCHURES, ANNUAL REPORTS — FEATURE PROMINENTLY***

- Download every linked PDF/DOC/PPT/XLS to `public/docs/{slug}.{ext}` and feature on the new site
- **Team/About pages** — link CVs/resumes inline next to the person: "View {Name}'s Resume →" button
- **Generate a preview thumbnail** (first-page render via `pdftoppm` or `pdf2image`) → display as `<a href="...pdf"><img>` so document feels first-class
- **JSON-LD `DigitalDocument` schema** for each preserved document
- **Hard gate**: every PDF/DOC linked in the original sitemap MUST resolve 200/301 on the new site on the equivalent page

### PDF as Primary Research (***NOT JUST AN ASSET***)

- Process every linked PDF via `pdftotext -layout` → LLM structured-fact extraction (strict JSON schema) → `_pdf_facts.json` keyed by URL BEFORE Phase 1 build
- **Schema for CV/resume**: `{ name, headline, education[{degree,institution,year,location,url?}], positions[{title,org,start,end,location,description,url?}], publications[{title,authors,journal,year,doi?,url?,citations?}], grants[{title,funder,amount,years,role}], awards[{title,year,org,url?}], talks[{title,venue,year,url?}], skills[], languages[], affiliations[{org,role,url?}] }`
- For each `url?` blank, run web-research enrichment (Exa/Tavily/Perplexity) to find canonical link and populate

### Interactive Timeline Component (***GENERATED FROM CV facts***)

When `_pdf_facts.json` contains a CV with ≥3 timeline-eligible entries (positions OR education OR awards OR grants), render `<InteractiveTimeline>` on `/about` (or new `/cv` route):

- Vertical chronological line with year markers; role/event cards alternating sides
- Concise summary headline + 1–2 sentence body; supplementary metadata at ≥7:1 contrast
- Every institution/paper/grant/award hyperlinked to its canonical URL
- Expand-on-click; keyboard navigable (Tab through cards, Enter to expand)
- In-viewport `animate__fadeInUp` per card via IntersectionObserver
- ARIA `role="list"` + `aria-label="Career timeline"`; reduced-motion: skip stagger, render all cards visible

### Budget split

- GPT Image 2 vision QA capped at $1 (see completeness-verification)
- Media generation/acquisition is a SEPARATE budget
- Ideogram (~$0.05/logo), GPT Image 1.5 (~$0.04/image), Stability (~$0.03/image), stock APIs (free tiers)
- Typical media budget: $0.50–2.00/site

## R2 Self-Hosting Pipeline

***NO CDN HOTLINKS — UNIVERSAL — BUILD-BREAKING — 2026-05-02 lonemountainglobal.com cycle***

- Download every third-party CDN asset at build time, content-hash it, write to `public/assets/migrated/<sha256-prefix>.<ext>`, rewrite throughout source code so production bundle has zero outbound CDN dependencies
- Deployed site MUST self-host every asset on `<slug>.projectsites.dev` (R2-backed) — no `cdn.shopify.com`, `*.squarespace-cdn.com`, `*.wp.com`, `*.wixstatic.com`, `*.imgix.net`, `images.ctfassets.net`, `*.contentful.com`, `*.cloudinary.com`, random WordPress upload paths

### Vite plugin (`template/scripts/rewrite-cdn-assets.mjs`)

Runs as `enforce: 'post'` Vite transform on every `.tsx|.jsx|.ts|.js|.html|.css|.json` file.

```js
import { createHash } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import { fetch } from 'undici';

const CDN_HOSTS = [
  'cdn.shopify.com', 'squarespace-cdn.com', 'wp.com', 'wixstatic.com', 'imgix.net',
  'cloudinary.com', 'contentful.com', 'ctfassets.net', 'sanity.io', 'prismic.io',
  'shopifycdn.com', 'shopify.com/s/files', 'i0.wp.com', 'i1.wp.com', 'i2.wp.com', 'i3.wp.com',
  'amazonaws.com/wp-content', 'akamaized.net', 'cloudfront.net', 'fastly.net',
  'pexels.com/photos', 'pixabay.com/photo'
];

export function r2AssetRewriter() {
  const downloads = new Map();
  return {
    name: 'r2-asset-rewriter',
    enforce: 'post',
    async transform(code, id) {
      if (!/\.(tsx?|jsx?|html|css|json)$/.test(id)) return null;
      const re = new RegExp(`https?://([^/"'\\s)]*?(${CDN_HOSTS.join('|')}))/[^"'\\s)]+`, 'g');
      const out = code.replace(re, (match) => {
        const ext = guessExt(match);
        const hash = createHash('sha256').update(match).digest('hex').slice(0, 16);
        const localPath = `/assets/migrated/${hash}.${ext}`;
        downloads.set(localPath, match);
        return localPath;
      });
      return out === code ? null : { code: out, map: null };
    },
    async closeBundle() {
      await mkdir('public/assets/migrated', { recursive: true });
      const limit = pLimit(8);
      await Promise.all([...downloads].map(([local, remote]) => limit(async () => {
        const res = await fetch(remote, { headers: { 'User-Agent': REAL_UA } });
        if (!res.ok) throw new Error(`CDN download failed ${remote}: ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        await writeFile(`public${local}`, buf);
      })));
    }
  };
}
```

### Asset-extension detection

- Parse URL pathname; fall back to MIME from HEAD response
- Drop `?w=400&h=400` query strings; fetch bare URL for higher-res original
- Signed/expiring CDN URLs: fetch ONCE at build time — local mirror has no expiration

### Hash strategy

- sha256 of the *original URL* (not bytes) — guarantees byte-identical rewrites across multiple builds + dedupes multiple references to one file
- Bytes-hash forces re-download of every reference; URL-hash is the build-cache key

### Excluded hosts (KEEP as-is)

- `googletagmanager.com`, `google-analytics.com`, `googleapis.com/maps`
- `posthog.com`, `sentry.io`
- `js.stripe.com`
- `*.youtube.com/embed`, `*.vimeo.com/video`
- `fonts.gstatic.com`, `fonts.googleapis.com`

### Validator (`validate-no-cdn-hotlinks.mjs`)

Post-build, grep `dist/` for any URL matching `CDN_HOSTS` regex outside the excluded list — any match = fail with diagnostic showing HTML location + suggested local replacement path. Checks CSS `url(...)`, `<img src>`, and JS string literals.

### Build cache

- `.cdn-rewrite-cache.json` keyed by sha256-prefix → original URL + last-fetched-at + bytes-md5
- Skip re-download when file exists locally + cache entry <30d old + HEAD returns same `etag` or `content-length`
- Cuts incremental build CDN bandwidth ~95%

## Blog Featured-Image Fallback

***NEVER SKIP — UNIVERSAL — every imported blog post MUST have a featured image***

### Fallback chain

1. **Source `featured_image`/`og:image`** if HEAD-200 + bytes >5KB + dimensions ≥800×600
2. **First inline `<img>` from post body** if HEAD-200 + dimensions ≥800×600
3. **Pexels search** by post title + tags + categories: top 3 scored by GPT Image 2 vision vs `(post_title, post_excerpt, brand_palette)`, pick highest ≥7/10
4. **GPT Image 1.5 generation** with per-post prompt encoding all 6 mandatory fields; cost ~$0.04–0.08/post (~$2–4 per 50-post migration)
5. **Brand-gradient SVG** as hard-floor fallback — only when GPT Image 1.5 spend ceiling tripped

### Per-post prompt template

```
Photorealistic editorial-style image illustrating "<post_title>". Subject: <subject from post_excerpt + first paragraph>. Brand palette: <brand-primary hex> + <brand-accent hex>. Composition: 16:9 wide, hero-card aspect. Mood: <mood inferred from post_tags or default "warm documentary">. Lighting: natural soft, golden hour. Lens: 85mm prime, shallow DoF. Negative prompt: no text, no watermarks, no logos, no extra fingers, no AI artifacts, no stock-photo cliches, no busy backgrounds, no clip-art aesthetic.
```

### Vision validation

- Each fallback hero gets vision-scored before commit
- <7/10 triggers regen via GPT Image 1.5 with refined prompt (max 3 attempts per post)
- Final fallback: brand-gradient SVG; never ship a post with NO image

### Storage

- Generated heroes → `public/assets/blog/<post-slug>-hero.<ext>`
- JSON-LD `BlogPosting.image` references this path

### Validator (`validate-blog-featured-images.mjs`)

For every entry in `_corpus.json.posts[]`: assert `featured_image_url` non-null AND HEAD-200 in dist AND dimensions ≥800×600. FAIL on any post missing a hero.

## API Priority Chain

***GPT Image 1.5 ELEVATED — Brian's stated preference for slot-fill***

Real photos of the actual entity always win when they exist (slots 1–3). Beyond that, GPT Image 1.5 is the PRIMARY originator for every unfilled slot. Stock APIs are supplements + speed-passes, not the workhorse.

| Priority | API | Key | Use | Rate | Confidence |
|----------|-----|-----|-----|------|------------|
| 1 | Google Places Photos | GOOGLE_PLACES_API_KEY | Actual business photos | 1000/day | 85–95 |
| 2 | User uploads | (form) | Submitted via /create | — | 95 |
| 3 | Website scrape | (fetch) | Images from existing site | — | 80–90 |
| 4 | **GPT Image 1.5 HD / gpt-image-1** | OPENAI_API_KEY | **PRIMARY slot-fill engine** | — | 85 |
| 5 | Pexels | PEXELS_API_KEY | Stock photos + videos (speed-pass) | 200/hr | 60 |
| 6 | Pexels Video | PEXELS_API_KEY | Hero video loops | 200/hr | 70 |
| 7 | Google CSE | GOOGLE_CSE_KEY+CX | Web image search | 100/day | 40–70 |
| 8 | Pixabay | PIXABAY_API_KEY | Illustrations, vectors | 100/hr | 45 |
| 10 | Flux 1.1 Pro Ultra | FAL_API_KEY OR REPLICATE_API_TOKEN | Secondary AI (photoreal humans, complex scenes) | — | 85 |
| 11 | GPT Image 1.5 | OPENAI_API_KEY | Stylized illustrations, sections, OG | — | 80 |
| 12 | Ideogram 3.0 | IDEOGRAM_API_KEY | Logo + favicon set + text-heavy | — | 80 |
| 13 | Recraft V3 | RECRAFT_API_KEY | Editable SVG icon sets | — | 75 |
| 14 | Foursquare | FOURSQUARE_API_KEY | Venue-specific photos | — | 65–75 |
| 15 | Yelp Fusion | YELP_API_KEY | Business listing photos | — | 60–70 |
| 16 | Stability AI SD3 | STABILITY_API_KEY | Backgrounds, patterns, textures | — | 65 |
| 17 | Sora | OPENAI_API_KEY | 5–10s video loops | — | 70 |
| 18 | Cloudinary | CLOUDINARY_* | Transform layer (WebP/AVIF, AI-crop) | 25GB free | — |

### GPT Image 1.5-first slot-fill rule (***UNIVERSAL — for slots 4+ in the chain***)

- Once real-entity sources (Places/uploads/scrape) are exhausted, invoke GPT Image 1.5 BEFORE generic stock
- Stock APIs run in parallel as speed-pass fallback (instant if GPT Image 1.5 hangs >15s) but GPT Image 1.5 output is preferred at curation
- Brian's preference: "GPT Image 1.5 can literally create the ultra-realistic perfect photo for any given photo spot" — encoded as default behavior

### 2026 image-stack pricing reference

| Engine | Cost/img | Best For | License |
|--------|----------|----------|---------|
| Pexels | free | Stock photos + videos | commercial-OK |
| Wikimedia Commons | free | Named landmarks, historic, public figures | CC |
| Flickr CC | free | Niche/hyperlocal photography | CC-licensed-only |
| Ideogram Turbo | $0.025 | OG cards w/ tagline + logo | commercial-OK |
| Stability AI SD3 | $0.03 | Textures, patterns, abstract bg | commercial-OK |
| GPT Image 1.5 | $0.034 | Stylized illustrations, section dividers | commercial-OK |
| GPT Image 1.5 HD | $0.04–0.08 | Fallback for Flux when key absent | commercial-OK |
| Flux 1.1 Pro Ultra | $0.06 | Photoreal hero (humans, complex scenes, 4MP+) | commercial-OK |
| Recraft V3 | $0.08 | Editable SVG icon sets, brand-style adherence | commercial-OK |
| Ideogram 3.0 | $0.09 | Logo + favicon set + text-heavy graphics | commercial-OK |
| Sora | $0.20–0.40 | Short narrative video loops | commercial-OK |
| Google Street View | $0.007 | Storefront, signage | commercial-OK |

**Total typical media spend**: $0.50–2.00/site.

### Engine selection logic

- **Photoreal hero** → Flux 1.1 Pro Ultra
- **Stylized** → GPT Image 1.5
- **Logo** → Ideogram 3.0
- **SVG icons** → Recraft V3
- **OG card** → Ideogram Turbo
- **Video** → Pexels first, Sora when premium
- **Fallback** → GPT Image 1.5 HD when Flux key absent

### pHash dedup (***replaces md5 — visually identical but byte-different images dedupe correctly***)

- sharp 8×8 DCT → 64-bit hash → hamming distance ≤6 = duplicate
- Implementation in `~/.agentskills/15-site-generation/blog-import.mjs::phash()`
- md5 only as fallback when sharp unavailable

## Google Street View

***LOCAL BUSINESS MUST-HAVE***

Google Street View Static API (`GOOGLE_MAPS_API_KEY`): captures storefront/signage automatically.

### Three shots per business

1. `source=outdoor&heading=auto` — front-facing storefront (best for signage/brand extraction)
2. `source=outdoor&heading={heading+45}` — angled view showing context/neighboring businesses
3. `source=outdoor&heading={heading-45}` — opposite angle

URL: `https://maps.googleapis.com/maps/api/streetview?size=1200x800&location={lat},{lng}&source=outdoor&key={GOOGLE_MAPS_API_KEY}`

- Check `status` endpoint first — returns `ZERO_RESULTS` if no imagery available
- Cost: $7/1000 requests; cache aggressively in R2

### Use for

- Brand extraction (signage colors/fonts)
- Storefront hero image (if no better photo)
- Neighborhood context; building exterior for "Visit Us" section

## Interior + Staff Photo Acquisition

### Google Places photo types

Filter for `types: ["interior"]` for ambiance, `types: ["food"]` for restaurants, and owner-uploaded photos (often show staff/team). Download all.

### Yelp Fusion photos

- Business endpoint returns user-uploaded photos — often candid interior/food/service shots that feel authentic
- Rate: 5000 API calls/day

### Staff/team photos

- Search Google CSE: `"{business_name} team"` OR `"{business_name} staff"` with `searchType=image`
- Check business Facebook page cover photos and "About" section
- NEVER generate fake headshots — use real photos or skip team section entirely

## Image Search Queries

Per business: construct 3–5 queries combining business type + city, business name + storefront, business type + interior, specific services + professional.

**Example for "Vito's Mens Salon, Lake Hiawatha NJ"**:

```js
["mens salon interior modern", "barber shop Lake Hiawatha NJ", "men haircut professional", "salon storefront exterior"]
```

## Logo Discovery

***NON-NEGOTIABLE — KEEP ORIGINAL IN ALMOST ALL CASES***

### Priority chain

1. **User upload**
2. **Scrape from existing site**:
   - `<img>` in `<header>/<nav>` (alt/class/src contains `logo`|`brand`|`site-logo`|`custom-logo-link`)
   - `<link rel="icon">`, `<link rel="apple-touch-icon">`, `<link rel="mask-icon">`
   - `<meta property="og:image">`, `<meta name="msapplication-TileImage">`
   - `wp-content/uploads/*/logo*`
   - Squarespace `header-title-logo img`
   - `theme.json`/`customize.css` logo refs
3. **Logo.dev** (`LOGODEV_TOKEN`)
4. **Brandfetch** (`BRANDFETCH_API_KEY`)
5. **Google favicon API** (`https://www.google.com/s2/favicons?domain={d}&sz=256`)
6. **Wayback Machine snapshot** if live site down
7. **AI-generate** as LAST resort

### Original-asset retention (***DEFAULT BEHAVIOR — never replace a quality logo***)

- When source has a professional logo+favicon (quality score ≥7/10 via GPT Image 2 vision detail:low OR known good-design brand), KEEP both verbatim
- Replacement requires explicit user instruction OR quality score <7/10

### Logo font + visual element extraction (***GOLD MINE — drives ENTIRE site design***)

Single GPT Image 2 vision call extracts:

```ts
{
  font_family_guess: "(closest Google Font)",
  font_weight: "...",
  letterspacing: "...",
  has_icon: bool,
  icon_description: "...",
  icon_dominant_color: "...",
  accent_graphic_description: "...",
  accent_graphic_color: "...",
  logo_style: "modern|classic|serif|script|geometric|handdrawn",
  suggested_heading_font: "...",
  suggested_body_font: "..."
}
```

- Reuse matched Google Font as `--font-heading` site-wide
- Logo's graphic motif becomes the site's hero motif — extracted as standalone SVG/PNG, reused as background splash, divider, OG card element, loading spinner

### Background-asset-from-logo extraction (***LMG MOUNTAIN-SPLASH PATTERN — converts logo into hero***)

When logo contains a strong graphic element (mountain, wave, leaf, geometric mark), extract that element alone (no wordmark) as a hero background splash.

**Process**:

1. GPT Image 2 vision identifies bounding box of icon-only region
2. ImageMagick crops + alpha-trims (`magick logo.png -alpha extract -trim +repage`)
3. Upscale 2–4x via Real-ESRGAN or GPT Image 1.5 variation
4. Save `assets/brand-splash.png` (full-bleed hero bg) + `assets/brand-mark.png` (favicon-sized)

### AI logo generation (***LAST RESORT — only when scrape fails OR original quality <7/10***)

- Ideogram v3 preferred for text-heavy logos
- Generate exactly 3 variants: A=lockup, B=icon, C=wordmark
- Single GPT Image 2 vision detail:low call rates all 3 (1–10), picks winner
- Winner <7: regenerate losing slot only (max 2 rounds); cost: ~$0.05 total
- Style: clean, modern, text-based with geometric accent, brand colors + bold display font

## Favicon Set

***real-favicongenerator MANDATORY — every site, every build***

Use the icon-only logo region (no text wordmark — extract via GPT Image 2 vision bounding box) as input.

### Two execution paths

**(1) realfavicongenerator.net API (preferred — 30+ asset variants)**

- POST to `https://realfavicongenerator.net/api/favicon` with `api_key` (`REAL_FAVICON_GENERATOR_API_KEY`), base64-encoded master image (≥260×260 PNG transparent), and `favicon_design` config (iOS/Android/Windows/Safari colors from `_brand.json.colors`)
- Response includes ZIP → extract to `public/`; generates `favicon.ico` (16+24+32+48+64), `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png` (180×180), `android-chrome-192x192.png`, `android-chrome-512x512.png`, `mstile-144x144.png`, `mstile-150x150.png`, `mstile-310x150.png`, `mstile-310x310.png`, `safari-pinned-tab.svg`, `site.webmanifest`, `browserconfig.xml`, `manifest.json`, plus head HTML snippet
- Inject snippet into `index.html` `<head>` verbatim

**(2) Local fallback (no API key OR offline)**

- ImageMagick: `magick icon-master.png -fuzz 15% -trim +repage -resize 512x512 -background none -gravity center -extent 512x512 favicon-512.png` then derive each size
- Build `.ico` via `magick favicon-16.png favicon-32.png favicon-48.png favicon.ico`
- Hand-craft `site.webmanifest` (192+512 refs, theme_color, background_color), `browserconfig.xml`, `safari-pinned-tab.svg` (via `magick ... -threshold 50% -colorspace gray svg:`)
- 14 total files minimum

**In-container alt (no ImageMagick)**:

- `buildPngIco()` — manual ICO: 6-byte header + 16-byte directory entry + raw PNG bytes; width/height 0 (=256+), 32-bit, offset 22

### Hard gate

`public/` MUST contain ALL of: `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png`, `safari-pinned-tab.svg`, `site.webmanifest`, `browserconfig.xml`

Verify: `ls public/ | grep -E '(favicon|apple-touch|android-chrome|safari-pinned|site\.webmanifest|browserconfig)'` — count must be ≥9.

## AI-Generated Original Content

***AGGRESSIVE — EVERY SITE***

| Type | API | Use Case | Cost |
|------|-----|----------|------|
| Hero backgrounds | GPT Image 1.5 | Abstract brand-colored scenes, atmospheric gradients | ~$0.04 |
| Service illustrations | GPT Image 1.5 | Custom per-service illustrations | ~$0.04 |
| Section dividers | Stability AI | Geometric patterns, brand-colored abstract art | ~$0.03 |
| Texture overlays | Stability AI | Noise, grain, mesh gradients for glassmorphism | ~$0.03 |
| Team/about imagery | GPT Image 1.5 | Workplace scenes matching business type (NOT fake headshots) | ~$0.04 |
| Logo + variants | Ideogram v3 | A=lockup, B=icon, C=wordmark | ~$0.05 |
| OG preview image | GPT Image 1.5 | 1200×630 social share card with brand + name | ~$0.04 |
| Icon set | Ideogram v3 | Custom service icons matching brand style | ~$0.05 |

### Generation strategy

- Generate 3–5 hero candidates, 1 per service, 2–3 atmospheric textures, 1 OG image
- Pick best via GPT Image 2 vision detail:low (single batch call, all candidates in one request)
- Total generation: ~$0.30–0.50; with logo A/B/C: ~$0.35–0.55

### Prompt patterns for GPT Image 1.5

- **Hero**: `"Cinematic wide shot, {business_type} environment, {brand_primary} and {brand_secondary} color palette, dramatic lighting, professional photography style, no text, no people, 16:9"`
- **Service**: `"Clean modern illustration of {service_name}, {brand_colors}, minimal style, white/dark background, professional"`
- **Texture**: `"Abstract geometric pattern, {brand_primary} gradients, subtle depth, seamless tileable, dark background"`

## Video Discovery

***3-5 VIDEOS MINIMUM***

- **YouTube Data API** (`YOUTUBE_API_KEY`): search business name + city → top 3; search business type + "professional" → 2 more
- **Pexels Video API** (`PEXELS_API_KEY`): search business type for B-roll (3–5 clips)
- Store as video manifest JSON (URL, thumbnail, duration, title) — not downloaded; embed via YouTube iframe or Pexels player

### Video placement strategy

- **Hero background** — muted autoplay 4–8s loop from Pexels
- **Services section** — YouTube embed if business has channel
- **About section** — B-roll montage
- **Testimonials** — video reviews if available

## Image Profiling

***COST-TIERED***

### Tier 1 — Workers AI Llama Vision (FREE)

- Profile ALL images: description, keywords (3–5), quality_score (1–10), relevance_score (1–10), suggested_placement, alt_text, dominant_colors (3–5 hex)
- Batch 5 images/call, 3 batches parallel; sufficient for 90% of placement decisions

### Tier 2 — GPT Image 2 vision detail:low (~$0.02)

- Top 5 hero candidates only (sorted by Tier 1 combined score); single batch call
- Picks final hero, validates brand color extraction, confirms quality for above-the-fold placement

### Reject

- quality <5; relevance <4; watermarks; inappropriate content; <1000 bytes (tracking pixels); >10MB

Store profiles as `_image_profiles.json`.

## Image Storage

- **R2 path**: `sites/{slug}/assets/discovered/{safeName}-{confidence}pct.{ext}`
- **Custom metadata**: source, confidence, originalUrl
- **User uploads**: `sites/{slug}/assets/uploaded/`
- **Generated**: `sites/{slug}/assets/generated/`
- **Logo**: `sites/{slug}/assets/logo.png`

## Media for Different Site Types

- **SaaS** — Product screenshots (Playwright on demo), feature illustrations (GPT Image 1.5), integration partner logos, abstract hero, team photos
- **Portfolio** — Project screenshots/photos are THE content. High-res, properly cropped. Before/after comparisons. Process photos. Client headshots for testimonials.
- **Restaurant** — Food photography is critical. Google Places photos, Yelp photos, menu item images. Interior ambiance shots. Chef/team photos. Prioritize appetizing, well-lit food images.
- **Non-profit** — Impact photos (people helped, events), team/volunteer photos, partner logos, impact-stat infographics. Warm, dignified — never poverty tourism.
- **Real estate** — Property photos, neighborhood shots, market data visualizations. Virtual tour links. Agent headshots.

## Placeholder Strategy

- CSS gradients as backgrounds — never stock photos as placeholders
- Gradient pattern: `linear-gradient(135deg, {brand_primary}22, {brand_secondary}11)`
- SVG abstract patterns generated from brand colors
- Never leave empty image slots — fill with real content or branded gradient

## Hard Gates Summary

***BUILD-BREAKING — verified post-build***

- `public/images/` count ≥ `max(30, original_image_count × 1.4)` else FAIL
- `public/` contains all 9 favicon assets (favicon.ico, 16/32/180/192/512 PNGs, safari-pinned-tab.svg, site.webmanifest, browserconfig.xml) else FAIL
- ≥1 logo file in `public/` (`logo.{png,svg,webp}` AND `logo-header.png`) else FAIL
- Every original-site slider image group preserved with order + group manifest else FAIL
- Every original-site PDF/DOC linked in body content downloaded to `public/docs/` and surfaced on equivalent new page else FAIL
- ≥3 GPT Image 1.5-generated originals when OPENAI_API_KEY present else WARN (FAIL if 0 originals)
- ≥3 video assets (Pexels stock, YouTube embed, or original-site video) else WARN

## Performance Budget

- Total images <500KB compressed; largest single image <200KB
- Hero: eager+preload+`fetchpriority=high`; below fold: lazy+`decoding=async`
- Prefer WebP (CF Image Transforms `format=auto`)
- srcset: 320/640/1280/1920w
- Inline SVGs <2KB each
