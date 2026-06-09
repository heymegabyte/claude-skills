---
name: "image-quality"
priority: 3
pack: "media"
triggers:
  - "image"
  - "photo"
  - "hero image"
paths:
  - "org:website_build"
---

# Image Sourcing + Generation Quality

## Mandate

Every image on every shipped page must be either:

- A real primary-sourced photograph downloaded into the repo, OR
- An AI-generated photograph crafted to be indistinguishable from a real, cinematic, gorgeously-lit one.

Generic, flat, "good enough" AI output, unrelated stock photography, or hot-linked third-party assets without provenance = rejected at build.

## Priority order (every image slot)

1. Real photo from the institution's own archive → `public/images/<area>/` with descriptive slug.
2. Real photo from Wikimedia Commons / Library of Congress / NPGallery / state historical society / verified press wire — DOWNLOAD into `public/images/<area>/` (never hot-link production-critical media — third-party CDNs disappear, rename files, change license terms).
3. AI-upscale a small but authoritative source (Real-ESRGAN, Gigapixel, Topaz Photo AI, hosted equivalent) when the only available primary photo is sub-spec.
4. AI-generated hyper-realistic photograph crafted specifically for the slot — last resort, decorative surfaces only, NEVER on historical timelines per `timeline-authenticity`.

## Web-sourcing cadence

Run a meticulous search BEFORE prompting any generator. Minimum 3 searches per slot. Save every candidate URL + Commons file page + author + license + capture-date into `public/images/<area>/_credits.json`.

Search order:

1. Wikipedia article on the subject
2. Wikimedia Commons category
3. Library of Congress / NARA / NPGallery / Internet Archive book scans
4. State/local archives (NJ Historical Society, NYPL Digital Collections, Newark Public Library Charles F. Cummings NJ Information Center)
5. Flickr Commons (institutional uploads only — Smithsonian, LoC, BPL)
6. Academic repositories (JSTOR-indexed scans)
7. Press wire (with documented permission)
8. The institution's own Flickr / Instagram / blog (download with credit)

## Download workflow

- Never `<img src="https://third-party-cdn/foo.jpg">` in shipped JSX.
- Curl/wget into `public/images/<area>/<slug>.{webp|avif|jpg}`.
- Run through Sharp: `sharp input.jpg --resize 1600 --webp --quality 82 -o output.webp` for an AVIF/WebP/JPEG triplet.
- Log source URL + author + license + date in `_credits.json` next to the file.
- Component renders `<img src="/images/<area>/<slug>.webp">` with companion `<picture>` AVIF source.
- Build validator `validate-image-provenance.mjs` — **enforcement: BUILD-BREAK**. Greps shipped JSX/TSX for any `src="https://"` image hot-link, fails the build, lists each violation + the local-mirror path it should use. Catastrophic if shipped (legal + reliability — third-party CDNs disappear, change license, rename files).

## AI upscaling

- For authoritative photos <1024px on long edge (e.g., a digitized 19th-century engraving from Internet Archive at 600px), upscale BEFORE shipping.
- **Real-ESRGAN** — open source. `realesrgan-ncnn-vulkan -i in.jpg -o out.png -s 4 -n realesrgan-x4plus`
- **Topaz Photo AI** — paid, sharper for portraits with hair/skin.
- Never ship a sub-800px hero.
- Tag the upscaled file's `_credits.json` entry with `upscaled: { tool: "Real-ESRGAN x4plus", from: 600, to: 2400 }`.
- Never alter historical content via inpainting/outpainting — that crosses into fabrication.

## DALL·E / GPT Image 1.5 / Sora prompt-craft

1. **Imagine the IDEAL frame.** Close your eyes, picture exactly what would belong in this slot for this audience: subject + composition + light + lens + emotion + era + palette. Write 2–3 sentences of cinematographer's language BEFORE touching the model.
2. **Lock the medium.** Default: "hyper-realistic editorial photograph, shot on a Leica SL3 with a 50mm Summilux f/1.4 lens, shallow depth of field, ISO 200, 1/250s, golden-hour natural side-lighting from a north-facing window, 35mm full-frame sensor look, color-graded warm midtones / desaturated shadows, fine 35mm-film grain, no motion blur, no posterization, no chromatic aberration, magazine-cover quality." Adjust lens/light for the moment but keep the realism contract intact.
3. **Render the subject as a single concrete sentence:** "An [age] [role] [verb] [object] in [setting]" — no abstractions, no "and also". Add 1–3 sensory specifics: "steam curling from the bowl", "flour on her forearm", "a single bead of condensation on the pitcher".
4. **Banish AI tells:** "no plastic skin, no waxy faces, no impossible anatomy, no hexagonal pupils, no extra fingers, no melted text, no duplicate features, no over-symmetrical composition, no center-framed mug-shot pose, no over-saturated color, no HDR-glow halos, no fake bokeh discs". Include this negative prompt block on every generation.
5. **Specify dimensions + crop.** Hero: 1600×1200 (4:3) or 1920×1080 (16:9). OG: 1200×630 (1.91:1). Cards: 1080×1080 (1:1). State in the prompt.
6. **Critique-and-remix.** Every generation graded 1–10 by AI vision pass (or human) against the imagined frame. <8 → remix with specific corrections (more side-light, less symmetry, warmer palette, real-skin texture). Max 3 critique rounds; if still <8, switch model or fall back to real photography.

## Brand-consistency

- Every AI image in a single project shares one lens, palette, and grading reference.
- Set once in `public/images/_house_style.md` and pass into every prompt verbatim:
  > HOUSE STYLE: Leica SL3 50mm Summilux f/1.4, natural golden-hour light, warm midtones / desaturated shadows, fine 35mm-film grain, magazine-editorial composition.
- Inconsistent lenses/light/grading across images on one page = build fail in visual-QA review.

## Quality bar (every image, AI or real, before shipping)

- Hyper-realistic. Cinematic. Gorgeous. Beautiful.
- If the picture wouldn't look at home on a New Yorker spread, National Geographic feature, Pentagram annual report, or Wieden+Kennedy campaign — needs another pass.
- "Looks AI-generated" = ship-blocking.
- "Generic stock" = ship-blocking.
- "Flat phone snapshot" = ship-blocking unless it's the institution's own archival document being honored as-is.

## Apply across

- Every hero, section header, blog post header, team-grid avatar, services-card image, donate-page evidence shot, annual-report cover, press-kit asset, OG card.

## Banned domains/sources without override

- Unsplash (generic stock — never represents a real institution)
- Pexels (same)
- Shutterstock
- Adobe Stock
- iStock
- Getty (without explicit licensed permission)
- AI generators for historical timelines (see `timeline-authenticity`)
