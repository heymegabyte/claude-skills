---
name: "media-acquisition"
description: "12+ API media sourcing strategy for site generation. Stock photos, AI-generated images, logos, videos, favicon sets. Collect 100 candidates → AI inspect → curate top 15."
updated: "2026-04-24"
---

# Media Acquisition

Collect 10x more assets than needed, curate down via AI visual inspection. A 4-page site needs 15-20 high-quality images + 1-2 videos minimum. Every site MUST have a logo and favicon set.

## API Priority Chain

| Priority | API | Key | Use | Rate | Confidence |
|----------|-----|-----|-----|------|------------|
| 1 | Google Places Photos | GOOGLE_PLACES_API_KEY | Actual business photos | 1000/day | 85-95 |
| 2 | User uploads | (form) | Submitted via /create | — | 95 |
| 3 | Website scrape | (fetch) | Images from existing site | — | 80-90 |
| 4 | Foursquare | FOURSQUARE_API_KEY | Venue-specific photos | — | 65-75 |
| 5 | Yelp Fusion | YELP_API_KEY | Business listing photos | — | 60-70 |
| 6 | Google CSE | GOOGLE_CSE_KEY+CX | Web image search | 100/day | 40-70 |
| 7 | Unsplash | UNSPLASH_ACCESS_KEY | Stock photos (landscape) | 50/hr | 55 |
| 8 | Pexels | PEXELS_API_KEY | Stock photos + videos | 200/hr | 50 |
| 9 | Pixabay | PIXABAY_API_KEY | Illustrations, vectors | 100/hr | 45 |
| 10 | GPT Image 1.5 | OPENAI_API_KEY | AI-generated hero/section | — | 75 |
| 11 | Ideogram v3 | IDEOGRAM_API_KEY | Logo generation | — | 70 |
| 12 | Stability AI | STABILITY_API_KEY | Backgrounds, patterns | — | 65 |

## Image Search Queries

Per business: construct 3-5 search queries combining: business type + city, business name + storefront, business type + interior, specific services + professional. Example for "Vito's Mens Salon, Lake Hiawatha NJ": `["mens salon interior modern", "barber shop Lake Hiawatha NJ", "men haircut professional", "salon storefront exterior"]`.

## Logo Discovery (***NON-NEGOTIABLE — every site needs a logo***)

Priority: 1. User upload 2. Scrape from existing site header/footer/og:image 3. Logo.dev (`LOGODEV_TOKEN`) 4. Brandfetch (`BRANDFETCH_API_KEY`) 5. Google favicon API 6. AI-generate as LAST resort.

**Logo font extraction:** When logo found, use GPT-4o vision to identify the font → reuse in site design. Logo graphic elements and colors influence ENTIRE site design.

**AI logo generation (if none found):** Ideogram v3 preferred for text-heavy logos. Generate 4-6 variants (2 lockup, 2 icon, 1 wordmark, 1 creative). A/B via GPT-4o (rate 1-10). Best <7: regenerate (max 3 rounds). Style: clean, modern, text-based with geometric accent. Brand colors + bold display font.

## Favicon Set (from logo)

From winning logo: `magick logo.png -fuzz 15% -trim +repage` then: 512x512 (android-chrome), 192x192 (android-chrome), 180x180 (apple-touch-icon), 32x32, 16x16, multi-size .ico (16+32+48). site.webmanifest with 192+512 refs. browserconfig.xml for MS tile. Head tags for all sizes.

**In-container alternative** (no ImageMagick): `buildPngIco()` — manual ICO construction: 6-byte header + 16-byte directory entry + raw PNG bytes. Width/height 0 (=256+), 32-bit, offset 22. Store full PNG as favicon.ico (browsers handle it).

## Video Discovery

YouTube Data API (`YOUTUBE_API_KEY`): search business name + city → top 3 results. Pexels Video API (`PEXELS_API_KEY`): search business type for generic B-roll. Store as video manifest JSON (URL, thumbnail, duration, title) — not downloaded. Embed via YouTube iframe or Pexels player.

## Image Profiling (GPT-4o Vision)

After collection, profile EVERY image via GPT-4o: description, keywords (3-5), quality_score (1-10), relevance_score (1-10), suggested_placement (hero|about|services|gallery|team|testimonials|background), alt_text, dominant_colors (3-5 hex). Batch 5 images/call, 3 batches parallel. Reject: quality <5, relevance <4, watermarks, inappropriate content, <1000 bytes (tracking pixels), >10MB.

Store profiles as `_image_profiles.json`. Claude Code reads this to know which image goes where.

## Image Storage

R2 path: `sites/{slug}/assets/discovered/{safeName}-{confidence}pct.{ext}`. Custom metadata: source, confidence, originalUrl. User uploads: `sites/{slug}/assets/uploaded/`. Generated: `sites/{slug}/assets/generated/`. Logo: `sites/{slug}/assets/logo.png`.

## Media for Different Site Types

**SaaS:** Product screenshots (Playwright on demo), feature illustrations (GPT Image 1.5), integration partner logos, abstract hero (gradient mesh or 3D), team photos.

**Portfolio:** Project screenshots/photos are THE content. High-res, properly cropped. Before/after comparisons. Process photos. Client headshots for testimonials.

**Restaurant:** Food photography is critical. Google Places photos, Yelp photos, menu item images. Interior ambiance shots. Chef/team photos. Prioritize appetizing, well-lit food images.

**Non-profit:** Impact photos (people helped, events), team/volunteer photos, partner logos, infographic-style impact stats. Warm, dignified — never poverty tourism.

**Real estate:** Property photos, neighborhood shots, market data visualizations. Virtual tour links. Agent headshots.

## Placeholder Strategy

If insufficient images: CSS gradients as backgrounds (never stock photos as placeholders). Gradient patterns: `linear-gradient(135deg, {brand_primary}22, {brand_secondary}11)`. SVG abstract patterns generated from brand colors. Never leave empty image slots — either fill with real content or use branded gradient.

## Performance Budget

Total images <500KB compressed. Largest single image <200KB. Hero: eager+preload+fetchpriority=high. Below fold: lazy+decoding=async. Prefer WebP (CF Image Transforms format=auto). srcset: 320/640/1280/1920w. Inline SVGs <2KB each.
