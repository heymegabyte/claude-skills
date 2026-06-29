---
last_reviewed: 2026-06-29
superseded_by: null
name: "image-optimization"
priority: 2
pack: "media"
triggers:
  - "image optimization"
  - "avif"
  - "webp"
  - "srcset"
  - "responsive image"
  - "lazy load"
paths:
  - "org:website_build"
---

# Image Optimization

Optimize images by HOW THEY ARE USED — never a single fixed KB limit for every image. Prefer image quality that looks professional over an arbitrary file-size cap, but treat oversized images as a performance bug. Complements `image-quality` (sourcing: real vs cinematic-AI) and serves `ttfr-north-star` (LCP/CWV).

> Supersedes any fixed "largest image ≤200KB" rule (e.g. the old line in `quality-metrics`): use the use-based targets below instead.

## Use-based size targets (defaults)

- **Icons, logos, UI graphics** — 5–50KB (prefer SVG)
- **Small thumbnails / cards** — 40–120KB
- **Normal content images** — 80–250KB
- **Large hero images** — 250–500KB
- **Fullscreen / gallery images** — 400–900KB, only when visually justified
- **Never** ship raw camera uploads or multi-megabyte originals to production pages.

## Page budget (public marketing pages)

- Total **above-the-fold** image weight < **1MB**.
- Total **page** image weight < **2MB** when practical.
- Many images on one page → reduce individual sizes aggressively.

## Format rules (modern by default)

- **AVIF** for photos when quality is good.
- **WebP** as the broad fallback.
- **SVG** for logos, icons, simple illustrations.
- **PNG** only when transparency or exact pixel fidelity is required.
- **JPEG** only as a fallback for photos.

## Responsive rules

- Every non-trivial image is resized to its actual rendered dimensions.
- Generate multiple widths: **320w · 640w · 960w · 1280w · 1920w** (1920 only when needed).
- Use `srcset`/`sizes` (or `<picture>`) so mobile never downloads desktop-sized images.

## Quality starting points (then visually inspect)

- **AVIF** quality 45–65
- **WebP** quality 70–82
- **JPEG** quality 72–82
- Raise quality only if compression artifacts are visible at rendered size.

## Big-image exception

Large images allowed ONLY when essential to the design: hero backgrounds, before/after construction photos, galleries, detail-critical diagrams, portfolio screenshots. Even then: resize, compress, lazy-load.

## Loading rules

- **Eager** load only the primary above-the-fold hero image (`fetchpriority="high"`).
- **Lazy-load** every below-the-fold image (`loading="lazy"`).
- Set explicit `width`/`height` to prevent layout shift (CLS).
- Avoid background-images for important content unless necessary.
- **Never hotlink** external images in production — mirror approved assets to R2 / project storage.

## Acceptance (an image ships when)

1. Visually clear at its rendered size.
2. Not larger than needed (per use-based targets).
3. Served as AVIF/WebP when possible.
4. Responsive across screen sizes.
5. Not causing poor Lighthouse performance.

## Operationalize per project

- Pipeline: `sharp` (or CF Images / CF Image Resizing) generates AVIF + WebP + the responsive widths at build; components emit `<picture>`/`srcset`.
- Build gate: flag images exceeding their use-based target (warn, then fix) — analog of the `check-sitemap`/`check-llms` drift guards per `drift-detection`.
- Cleanup: delete orphaned/unreferenced images (grep callers first) per `repo-folder-hygiene`.

## See

- `image-quality` — sourcing (real primary-source vs cinematic AI; no clip-art/artifacts)
- `ttfr-north-star` — LCP ≤ 2.0s; image weight is the usual culprit
- `quality-metrics` — CWV budgets (this rule supersedes its fixed per-image KB cap)
- `repo-folder-hygiene` — orphaned-asset cleanup
