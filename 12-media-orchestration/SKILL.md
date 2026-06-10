---
name: "media-orchestration"
description: "Section-by-section media planning and generation. Image generation (GPT Image 1.5 primary, built-in fallback), logo/icon generation (Ideogram v3 → favicon set), video generation (Sora), social preview images (OG 1200x630 + AI search optimization), stock photo curation (Pexels, Pixabay), critique/remix loops (max 3 rounds), asset compression pipeline, and media performance budgets."
metadata:
  version: "2.1.0"
  updated: "2026-05-03"
  context: "fork"
  effort: "high"
  model: "sonnet"
license: "Rutgers"
compatibility:
  claude-code: ">=2.0.0"
  agentskills: ">=1.0.0"
submodules:
  - 30-ideogram-methods.md
  - build-breaking-rules.md
  - compression-pipeline.md
  - image-optimization.md
  - image-profiling.md
  - lightbox-classifier.md
  - media-prompts.md
  - notebooklm-pipeline.md
  - og-image-generation.md
  - social-brand-hex.md
  - technical-diagramming.md
priority: 3
pack: "media"
triggers:
  - "image gen"
  - "dalle"
  - "media"
  - "og image"
paths:
  - "org:website_build"
---

# 12 — Media Orchestration

> **Model migration note (pass-77, 2026-06-09)**: `DALL-E` → **GPT Image 1.5** + `GPT-4o` → **GPT Image 2 vision**. Per `platform.openai.com/docs/deprecations`. Media pipeline unchanged.

## Submodules

- **media-prompts** — prompt templates, Ideogram v3 API
- **compression-pipeline** — Python code, format tables, CF Image Transforms, CLS, broken image detection
- **og-image-generation** — Satori edge-rendered OG, KV / R2 cache, meta-tag helper
- **image-optimization** — Sharp processing, responsive srcset, WebP/AVIF, blur placeholders, R2 pipeline
- **image-profiling** — GPT Image 2 vision batch profiling
- **lightbox-classifier** — per-image eligibility — `kind!=logo` + ≥1024×768 + score≥7
- **social-brand-hex** — canonical brand-color map per social platform
- **notebooklm-pipeline** — per-site podcast via ElevenLabs Studio + infographic via Vega-Lite/Recraft/GPT-Image-2 + HeyGen video + CF Stream + RSS + JSON-LD + cost ceiling $3.50/site

## Strategy by Section

- **Hero** — GPT Image 1.5 / Sora
- **Features** — GPT Image 1.5 / SVG
- **How It Works** — GPT Image 1.5
- **Testimonials** — stock
- **About** — stock / real
- **Blog** — GPT Image 1.5
- **Social** — Satori OG 1200×630
- **Icons** — Ideogram v3 + processing

Pre-gen: communication goal? Brand style? Dimensions? Format? Budget? Stock or generated?

## Visual Inspection (MANDATORY)

Read every image before deploy. Check: blur, artifacts, watermarks, wrong colors, AI hallucinations, gibberish text. Failed = regenerate w/ improved prompt. Quality: 2× retina, no artifacts, brand palette, consistent style, no uncanny valley.

## Brian's Style

- Space/cosmic — `#00E5FF` + `#7C3AED`, deep black (`#060610`)
- Connections/dots — quantum, neural, constellation
- "Ultra realistic" scenes
- Transparent logos
- Simpler always
- Motifs — squirrels, turtles

## Image Generation

- **GPT Image 1.5** preferred (best quality)
- **GPT Image 1** for speed
- **GPT Image 1-mini** for bulk/drafts
- Fallback: `scripts/image_gen.py`
- Be specific, include colors, specify avoidances
- Product screenshots: browser rendering via Playwright on live URL

## GPT Image 1.5 First Slot-Fill (CANONICAL — UNIVERSAL)

GPT Image 1.5 (gpt-image-1.5 / gpt-image-1) is PRIMARY originator for every image slot the source-resolution chain didn't fill from real-entity sources (Places / uploads / scrape).

- After real-entity sources exhaust, GPT Image 1.5 invoked BEFORE generic stock — per-slot prompt produces tighter topic match than any stock library
- Stock APIs run parallel speed-pass fallback (instant return if GPT Image 1.5 hangs >15s) but GPT Image 1.5 output preferred at curation
- See skill 15 `media-acquisition` Media-Slot-Manifest + Fail-CLOSED auto-regenerate (5 attempts, prompt-refinement loop, $0.40 worst-case ceiling per slot)

## Per-Slot Prompt Mandatory Fields (BUILD-BREAKING — `validate-image-prompts.mjs` + `validate-dalle-slot-fill.mjs`)

Every GPT Image 1.5 call MUST encode 6 fields from `_media_slots.json`:

1. Page topic + intent verbatim from `topic_intent`
2. Brand palette tokens from `_brand.json.colors` (inline hex)
3. Composition + aspect ratio matching `aspect`
4. Subject specificity (NEVER "people" — always "octogenarian volunteer plating soup, soft window light, documentary style")
5. Photographic technical specs (camera, lens, lighting, DoF — "shot on Hasselblad, 85mm prime, golden hour, shallow DoF")
6. Negative prompt block ("no text, no watermarks, no logos, no extra fingers, no AI artifacts, no stock-photo cliches")

Generic prompts FAIL validator. Same template applies to FLUX, Recraft, Stability — reuse slot-prompt across providers w/ fallback chain.

## Fail-CLOSED Auto-Regenerate (BUILD-BREAKING — `validate-no-empty-slots.mjs`)

Every slot in `_media_slots.json` MUST end build w/ `filled_url != null AND filled_score >= relevance_floor` (default 8/10 via GPT Image 2 vision).

Failure modes (Pexels returns nothing, GPT Image 1.5 NSFW-flagged, scraped image broken, vision relevance below floor) trigger immediate auto-regeneration via GPT Image 1.5 w/ REFINED prompt — NEVER silent skip, NEVER substitute brand-gradient unless 5 regen attempts exhausted.

Build orchestrator's `media_pipeline_orchestrator` sub-agent owns this loop. Submodule: `media-acquisition.md` § Fail-CLOSED chain.

## Logo / Icon Generation

- **Ideogram v3** for logos (best text rendering)
- **Recraft V3** for vector-style icons
- Output: PNG transparent + SVG (if possible)
- Process: bg removal → favicon set (16/32/180/192/512 + maskable)
- Brand mark MUST be vector-clean — no AI artifacts on edges

## Video Generation

- **Sora** for primary cinematic content
- Veo for narrative stitching (7-8 × 8-sec clips → 60-sec arc)
- HeyGen for explainer + spokesperson
- All include captions VTT + transcript
- `prefers-reduced-motion` → static poster fallback

## OG Image (1200×630)

- Satori edge-rendered from template
- Per-route unique
- BRANDED CARD never raw photo
- ≤100KB
- Cached in KV 7d / R2 forever

## Stock Photography

- **Pexels** first (free, high quality, API)
- **Pixabay** second
- Never: Unsplash (generic, overused), iStock/Getty (paid, unnecessary)
- Critique-and-remix loop max 3 rounds
- AI vision rates each candidate; <7/10 = reject + regenerate

## Asset Compression Pipeline

- AVIF primary (94% browser support, 20-30% smaller than WebP)
- WebP fallback (Safari 14+)
- JPEG legacy
- Sharp: 320 / 640 / 1280 / 1920w responsive srcset
- Blur placeholder generation
- Dominant color extraction → CSS bg fill while loading
- R2 upload pipeline per-extension content-type

## Performance Budgets

- Total images per page ≤500KB
- Largest single image ≤200KB
- Hero LCP image `fetchpriority="high"` + preload link
- `loading="lazy"` on every other image
- `decoding="async"` always

## See submodules for: media-prompts, compression-pipeline, og-image-generation, image-optimization, image-profiling, lightbox-classifier, social-brand-hex, notebooklm-pipeline, build-breaking-rules.
