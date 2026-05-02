---
name: "media-orchestration"
description: "Section-by-section media planning and generation. Image generation (GPT Image 1.5 primary, built-in fallback), logo/icon generation (Ideogram v3 → favicon set), video generation (Sora), social preview images (OG 1200x630 + AI search optimization), stock photo curation (Unsplash, Pexels), critique/remix loops (max 3 rounds), asset compression pipeline, and media performance budgets."
metadata:
  version: "2.1.0"
  updated: "2026-04-23"
  context: "fork"
license: "Rutgers"
compatibility:
  claude-code: ">=2.0.0"
  agentskills: ">=1.0.0"
submodules:
  - media-prompts.md
  - compression-pipeline.md
  - og-image-generation.md
  - image-optimization.md
  - technical-diagramming.md
  - image-profiling.md
  - lightbox-classifier.md
  - social-brand-hex.md
---

# 12 -- Media Orchestration

Submodules: media-prompts.md (prompt templates, Ideogram v3 API), compression-pipeline.md (Python code, format tables, CF Image Transforms, CLS, broken image detection), og-image-generation.md (Satori edge-rendered OG images, KV/R2 cache, meta-tag helper), image-optimization.md (Sharp processing, responsive srcset, WebP/AVIF, blur placeholders, R2 pipeline), image-profiling.md (GPT-4o vision batch profiling — quality+placement+colors per image, pre-digest for builders), lightbox-classifier.md (per-image eligibility — kind!=logo + ≥1024×768 + score≥7, logo grids → hover-grayscale-to-color), social-brand-hex.md (canonical brand-color map per social platform, hover/focus/active states, per-platform CSS class generation).

## Strategy by Section
Hero: GPT Image 1.5/Sora. Features: GPT Image 1.5/SVG. How It Works: GPT Image 1.5. Testimonials: stock. About: stock/real. Blog: GPT Image 1.5. Social: Satori OG 1200x630. Icons: Ideogram v3+processing.

Pre-gen: communication goal? Brand style? Dimensions? Format? Budget? Stock or generated?

## Visual Inspection (MANDATORY)
Read every image before deploy. Check: blur, artifacts, watermarks, wrong colors, AI hallucinations, gibberish text. Failed: regenerate improved prompt. Quality: 2x retina, no artifacts, brand palette, consistent style, no uncanny valley.

## Brian's Style
Space/cosmic: #00E5FF + #7C3AED, deep black (#060610). Connections/dots: quantum, neural, constellation. "Ultra realistic" scenes. Transparent logos. Simpler always. Motifs: squirrels, turtles.

## Image Generation
GPT Image 1.5 preferred (best quality). GPT Image 1 for speed. GPT Image 1-mini for bulk/drafts. Fallback: scripts/image_gen.py. Be specific, include colors, specify avoidances. Product screenshots: browser rendering via Playwright on live URL.

**"DALL-E" terminology reconciliation:** when Brian or skill prose says "DALL-E", treat it as colloquial shorthand for the current OpenAI Images API (gpt-image-1.5 quality / gpt-image-1 balanced / gpt-image-1-mini bulk). The literal `dall-e-3` model id deprecated May 12, 2026 — never call that endpoint. Implementation always uses gpt-image-1.5 by default; the user-facing concept stays "DALL-E" because that's the brand language in user feedback. Sora video deprecates Sept 24, 2026.

**Per-slot purpose-crafted prompt requirement (***UNIVERSAL — BUILD-BREAKING — no generic prompts***):** every generated image gets a per-slot prompt that names: (1) route+section the image lives in (`/about hero`, `/services card-3`, `/blog/post-x feature`), (2) page topic+intent (subject specificity — "octogenarian volunteer plating soup, soft window light, documentary realism" NOT "people helping"), (3) brand palette tokens (e.g. "matte navy #060610 + cyan accent #00E5FF"), (4) composition+aspect ratio (16:9 hero / 1:1 card / 4:5 portrait / 3:2 editorial), (5) negative prompt (no text overlays, no watermarks, no extra fingers, no logos, no AI artifacts), (6) stylistic anchor (matched to brand-element extraction — "documentary photography" / "minimal editorial" / "warm golden-hour"). Generic prompts ("create a hero image for nonprofit") rejected at the prompt-prep step. Same per-slot prompt template applies across providers — gpt-image-1.5, Ideogram, Stability, Recraft — fallback chain reuses the slot prompt verbatim. Validator (`validate-image-prompts.mjs`): every entry in `_assets.json.generated[]` must include `slot_prompt: { route, section, intent, palette, aspect, negative, style }` — missing fields=fail.

**Hero media preference order (***UNIVERSAL — full-multimedia experience***):** every hero/page-banner section ranks media in this order: (1) original-source-hero asset preserved at ≥7/10 quality, (2) **Pexels Video API** HD loop (free, MP4 ≤2MB, 4-8s, autoplay+muted+loop+playsinline+poster), (3) Coverr/Mixkit free video, (4) gpt-image-1.5 generated still with brand-converged prompt, (5) Pexels/Unsplash photo, (6) brand-gradient with motif overlay (LAST RESORT). Video-over-still preference holds whenever ≥1 Pexels Video result scores ≥0.7 topical-relevance — sites should feel cinematic, not catalog. Ship `<video autoplay muted loop playsinline preload="metadata" poster="...">` with `<source type="video/mp4">` + `prefers-reduced-motion: reduce` fallback to poster image. Pexels Video API: `https://api.pexels.com/videos/search?query=<topic>&orientation=landscape&size=large&per_page=10` requires `PEXELS_API_KEY`. Build gate (`validate-hero-media.mjs`): every `<section data-hero>` must have `<video>`, `<picture>`, OR `[style*=background-image]` — empty or solid-color hero=fail.

**Publication / journal imagery rule (***UNIVERSAL — BUILD-BREAKING — never irrelevant stock***):** publication / paper / case-study / press-mention tile imagery comes from EXACTLY one of three sources, in priority: (1) the source page's own asset (the journal's logo PNG, the paper's figure-1, the press article's hero image — extracted by skill 15 publication-deeplink-resolver during scrape), (2) the journal/publisher's official logo via Logo.dev / Brandfetch / Wikipedia og:image (when paper-specific asset unavailable), (3) gpt-image-1.5 generated abstract that visualizes the paper's topic with per-slot prompt referencing the paper's title+keywords (e.g. for "pharmaceutical corruption in developing countries" → "abstract visualization of medication and shadow over a globe, editorial illustration, matte navy + amber accent"). NEVER generic stock photos of doctors / books / labs / handshakes — they look templated and signal "AI slop". Validator (`validate-publication-imagery.mjs`): every `[data-card-type=publication] img[src]` must resolve to either `_publications.json[].source_image_url`, `_publications.json[].journal_logo_url`, or `_publications.json[].generated_image_url` — generic stock host=fail. Reference incident: lone-mountain-global-3 (2026-05-02) `/publications` shipped duplicate Unsplash doctor stock photos across 8 papers — drove this rule.

**Lightbox grouping consistency (***UNIVERSAL — BUILD-BREAKING — match design grouping***):** every lightbox-eligible image (kind!=logo AND ≥1024×768 AND quality≥7) inherits `data-gallery="<section-slug>"` from its enclosing section — services-section images all share `data-gallery="services"`, gallery-section images share `data-gallery="gallery"`, team images share `data-gallery="team"`. NEVER assign per-image unique gallery IDs (creates lightbox carousels of 1 image each = broken UX) and NEVER cross-group images from different topical sections into one carousel. Each `[data-zoomable]` MUST also carry `data-caption-title` + `data-caption-description` data attributes; lightbox modal renders them in a bottom strip and screen-reader `aria-describedby`. Validator (`validate-lightbox-grouping.mjs`): for every section with ≥2 lightbox-eligible images, all share the SAME data-gallery; missing caption attrs=fail. Reference incident: lone-mountain-global-3 (2026-05-02) gallery section split same-topic images across 4 separate lightbox groups — only 2 of 8 images visible per modal — drove this rule.

**Social-button brand-hex hover/focus/active (***UNIVERSAL — BUILD-BREAKING — every social link uses canonical brand hex***):** every social-platform link (Facebook, X, LinkedIn, Instagram, YouTube, TikTok, Pinterest, GitHub, Discord, Bluesky, Threads, WhatsApp, Reddit, Snapchat) MUST swap to the platform's official brand hex on `:hover`, `:focus-visible`, AND `:active` — never a generic site-accent color. Canonical map (`social-brand-hex.json` shipped in template): FB=#1877F2, X=#000, LinkedIn=#0A66C2, Instagram=linear-gradient(45deg,#F58529→#DD2A7B→#8134AF→#515BD4), YouTube=#FF0000, TikTok=#000 with cyan/magenta dual-shadow `0 0 8px #00F2EA, 0 0 8px #FF0050`, Pinterest=#BD081C, GitHub=#181717, Discord=#5865F2, Bluesky=#0085FF, Threads=#000, WhatsApp=#25D366, Reddit=#FF4500, Snapchat=#FFFC00. Default state is monochrome (currentColor or `--text-muted`); hover/focus/active fills with brand hex (color OR background depending on icon-only vs filled-pill design). Validator (`validate-social-brand-hex.mjs`): for every `[data-social=<platform>]` element, force `:hover` via Playwright + sample computed-style — must match the canonical hex (or gradient for Instagram) within ΔE<5. Reference incident: lone-mountain-global-3 (2026-05-02) social row used generic brand-accent on hover for all 5 platforms instead of platform-specific colors — drove this rule. Cross-ref always.md "Every social link" — same data, this is the build gate that enforces it.

## Logo (NON-NEGOTIABLE)
**Discovery:** Logo.dev, Brandfetch, scrape header, Google Images, favicon, social. High quality: use. Low: AI-enhance. Favicon only: upscale.

**Generation (if none):** 3 Ideogram v3 variants (A=lockup, B=icon, C=wordmark). Single GPT-4o call rates all 3 (1-10). Winner <7: regenerate losing slot only (max 2 rounds). Cost: ~$0.05 total (3 Ideogram + 1 GPT-4o detail:low).

**Assets:** favicon.ico (16+32+48), 16/32/180/192/512 PNGs, logo-header, logo-mark, og-image 1200x630.

**Auto-favicon pipeline (EVERY NEW PROJECT):** Generate winning logo→`magick logo.png -fuzz 15% -trim +repage` then: `-resize 512x512 android-chrome-512x512.png`|`-resize 192x192 android-chrome-192x192.png`|`-resize 180x180 apple-touch-icon.png`|`-resize 32x32 favicon-32x32.png`|`-resize 16x16 favicon-16x16.png`|multi-size `.ico` with 16+32+48. Ensure `site.webmanifest` references 192+512. Head tags: `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"/>`|`<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"/>`|`<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"/>`|`<link rel="manifest" href="/site.webmanifest"/>`.

**Logo background transparency (NON-NEGOTIABLE):** every logo file shipped MUST be transparent-background PNG. Run `magick logo.png -fuzz 8% -transparent white -trim +repage logo-clean.png` after acquisition (whether scraped, generated, or uploaded). White-bg logos on dark hero = a white rectangle floating over the page = looks broken. Verify via Sharp: `(await sharp(buf).raw().toBuffer()).readUInt8(3) < 255` for ≥1% of corner pixels. Build gate: corner-pixel sample shows alpha<255 OR fail.

**Institutional logo lookup (NON-NEGOTIABLE — universities, journals, sponsors, partners):** when research data lists institutional names (Boston University, Harvard, Nature Journal, Forbes, Microsoft Partner), look up each via Logo.dev / Brandfetch / Wikipedia og:image / official site favicon scrape — NEVER text-only badges. Cache to `r2://logos/{slug-of-institution}.svg|.png`. Render in dedicated `.logo-grid` (skill 12 lightbox-classifier.md hover-grayscale-to-color). Aria-label includes full institutional name. Each links to official site (`target="_blank" rel="noopener"`). Build gate: every institution mentioned in `_research.json.affiliations[]|publications[].source|sponsors[]|partners[]` has a resolved logo file or fail with diagnostic listing missing names.

**PWA manifest screenshots[] (***NON-NEGOTIABLE***):** every site ships a `site.webmanifest` with a `screenshots[]` array — desktop wide 1920×1080 + mobile narrow 390×844 + optional cover 1280×720. Captured via Playwright on `http://localhost:4173` (built site) AFTER prerender + before R2 upload. NEVER stock mockup PNGs — must be real screenshots of THIS site. Each ≤200KB JPEG q=85. See skill 06 pwa-kit.md for full manifest template + Playwright capture command.

**OpenAI key:** Load from `~/.claude/.env` via `source ~/.claude/.env`. Manage at https://platform.openai.com/api-keys. Replicate at https://replicate.com/account/api-tokens. Ideogram at https://developer.ideogram.ai/keys.

**Gates:** legible 32px+512px, transparent bg, brand palette, no artifacts, dark+light, GPT-4o >=7/10.

## Video (Sora)
Hero bg (4-8s muted autoplay loop), explainer (15-30s), demo (5-10s). Model: sora-2/sora-2-pro. 1280x720. Delivery: autoplay muted loop playsinline poster. <2MB hero. Lazy below fold. Sora deprecates Sept 24, 2026 -- evaluate alternatives before then.

## Social Previews + AI Search Optimization
PWA screenshots: Playwright on live URL (never mockups). Wide 1920x1080 + narrow 390x844. OG: 1200x630 per page (MANDATORY). Edge-rendered via Satori + resvg (see og-image-generation.md).

**AI Search (GEO):** OG images now consumed by ChatGPT, Perplexity, Google AI Overviews. Ensure: descriptive og:title (40-60 words quotable), structured JSON-LD on every page, FAQ sections for AI extraction, clear entity definitions. ChatGPT favors Wikipedia/G2; Perplexity favors Reddit/YouTube; Google AI Overviews favor traditionally ranked pages.

## Stock
Unsplash (UNSPLASH_ACCESS_KEY), Pexels (PEXELS_API_KEY). Review 5+, prefer candid/diverse/mood-matching. WebP, alt text.

## Critique Loop (max 3)
Communicates? Brand-matching? Strong composition? Consistent palette? Legible? Premium? No artifacts? Issues: adjust prompt, regenerate. Score 1-10 on 8 criteria (see templates/PROMPTS.md). Overall <7: regenerate.

## Performance Budget
Total images <500KB, largest <200KB, hero LCP <2.5s, total media <3MB, requests <15. Hero: eager+preload+fetchpriority=high. Others: lazy. All: decoding=async. WebP+AVIF via CF Image Transforms (format=auto). srcset 320/640/1280/1920w. Inline SVGs <2KB. 1s LCP delay = 7% conversion loss.

## Fallback Chain
1. GPT Image 1.5 (scenes/hero/OG -- best quality) 2. Ideogram v3 (logos/icons) 3. GPT Image 1-mini (bulk drafts) 4. Pexels (200/hr) 5. Unsplash (50/hr) 6. Pixabay (100/hr) 7. Replicate (specialty).
All keys: project .env.local or shared key pool. `~/.claude/.env` for shared keys (OPENAI_API_KEY, etc).

## Design Phase API Scan (EVERY NEW PROJECT)
Before first design: scan `get-secret` vault for available media APIs. Check: OPENAI_API_KEY (GPT Image)|PEXELS_API_KEY (stock photos)|UNSPLASH_ACCESS_KEY (stock)|REPLICATE_API_TOKEN (Flux/specialty)|IDEOGRAM_API_KEY (logos). Also scan for: embedded video APIs (YouTube Data API, Vimeo), background video sources (Pexels Video API supports free HD video), high-res content APIs (NASA/APOD for space themes, Giphy for motion). Map available APIs to section needs before generating any media. Always provide exact API key management URLs when prompting user for missing keys.
