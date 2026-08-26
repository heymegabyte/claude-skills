---
last_reviewed: 2026-08-26
superseded_by: null
name: "brand-asset-pipeline"
priority: 2
pack: "website-build"
triggers:
  - "logo"
  - "favicon"
  - "og:image"
  - "app icon"
  - "brand asset"
paths:
  - "org:website_build"
---

# Brand Asset Pipeline — Real Logo First, AI-Enhance, Generate Every Meta Image

Every website build produces a COMPLETE, correct set of brand/meta images — sourced from the real brand when it exists, AI-enhanced, and generated fresh only as a fallback. Runs in a dedicated PARALLEL agent (`brand-asset-forge`) so it never blocks the main build and finishes fast without sacrificing quality. Brian directive 2026-08-26.

## The mandate (every single website, no exceptions)

- **Research the real brand first.** Web-research the business's actual logo / app icon / favicon before generating anything — a real mark beats any generated one for recognition.
- **AI-enhance what you find.** Upscale, clean, background-remove, and re-color the found asset to hit the sizes + contrast the meta set requires — never ship a blurry 32px favicon as the og:image.
- **Generate ONLY as fallback.** No real asset found → generate a gorgeous, simple, elegant, intuitive, creative logo/favicon with **Ideogram** (best text rendering), **DALL·E 3 backup**.
- **Emit the full set every time** (below). A build missing any is a build fail (`asset.missing` per the site-generation invariants).

## Required output set (complete meta-image coverage)

- **Navbar logo** — horizontal wordmark, transparent PNG + SVG; light AND dark variant (per `[[logo-contrast]]` — white-text marks need dark backing).
- **Favicon set** — `favicon.ico` + `favicon-16x16.png` + `favicon-32x32.png` + `favicon-48x48.png`.
- **apple-touch-icon** — 180×180 PNG at root.
- **android-chrome / "chrome icon"** — `android-chrome-192x192.png` + `android-chrome-512x512.png`, wired into `site.webmanifest` `icons[]`.
- **og:image** — 1200×630 branded CARD (logo + name + tagline on brand bg), ≤100KB — never a raw photo.
- **maskable icon** + **safari-pinned-tab.svg** + **mstile-150x150.png** + **browserconfig.xml**.
- All 11 favicon files come from the real-favicongenerator pipeline (RFG API → `sharp-cli`/`realfavicon` fallback) run against the icon-only mark.

## Source priority chain (deterministic, before any generation)

1. Header `<img>` with `logo` in class/alt → 2. `site.webmanifest` `icons[]` → 3. WordPress `cropped-*-icon-*`/`*-icon-512x512*` → 4. `<link rel="apple-touch-icon">` 180×180 → 5. `<link rel="icon">` 32×32 → 6. `og:image` (last resort) → 7. **Logo.dev** / **Brandfetch** API → 8. **Ideogram** (DALL·E 3 backup) generation.

- Persist BOTH `logo.original_url` (full/wordmark) AND `logo.original_icon_url` (square, no text). Verify `original_icon_url` HEAD-200s before declaring brand-research done.
- Logo luminance drives theme (dark mark → light theme, light mark → dark theme) per project CLAUDE.md § Logo Luminance.

## Parallel-agent design (`brand-asset-forge` — fast, quality-preserving)

- **Fires in Phase 2 (asset generation), concurrently with research + content** — never serialized into the critical path.
- **Internally parallel:** favicon set · og:image card · navbar logo (light+dark) · social/apple/android icons fan out as one batched step, not sequentially.
- **Brief (100-300 words):** role = source-or-forge every brand/meta image; scope = `public/` asset files + `_brand.json.logo`/`_assets.json`; non-goals = page HTML/copy; output = the full required set + a manifest of what was found-vs-generated.
- **Quality gate before return:** every file exists at the right dimensions, og:image ≤100KB + 1200×630, favicon renders at 16px AND 512px, navbar logo contrast ≥4.5:1 on header bg per `[[logo-contrast]]` + `[[text-contrast]]`.
- Model: media/image tier (`media-orchestrator`); safe to run on Sonnet — this is production media work, not architecture.

## Never

- Ship a placeholder/blank favicon or a text-only "LOGO" string.
- Use a raw photo as the og:image (must be a branded card).
- Skip the real-brand research and jump straight to generation.
- Generate a mark whose text is illegible at favicon size (Ideogram > DALL·E precisely because text renders cleaner).

## Cross-links

- `[[logo-contrast]]` — white-text marks need dark backing (rendering side of this rule).
- `[[image-quality]]` — AVIF/WebP, `fetchpriority`, dimension + compression budgets.
- `[[text-contrast]]` — navbar logo + card text must clear 4.5:1.
- Project impl: `apps/project-sites/CLAUDE.md` § Logo Extraction Priority Chain + real-favicongenerator Pipeline + Logo & App Icon Generation.
