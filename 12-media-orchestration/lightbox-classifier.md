---
name: "lightbox-classifier"
description: "Classifier for which images become lightbox-eligible. Logos NEVER lightbox; below-1024×768 NEVER lightbox; quality-score-<7 NEVER lightbox. Logo grids become hover-grayscale-to-color, not zoom carousels."
updated: "2026-05-01"
---

# Lightbox Eligibility Classifier (***NON-NEGOTIABLE — RUNS PER IMAGE***)

An image is lightbox-eligible if AND ONLY IF all three conditions met. Anything else is forbidden — clicking a logo to "zoom in" is a UX failure that cheapens the brand.

## Eligibility Rule (`inferLightboxEligibility(profile) → boolean`)
```ts
function inferLightboxEligibility(p: ImageProfile): boolean {
  if (p.kind === 'logo') return false;                    // RULE 1: logos never lightbox
  if (p.kind === 'institution_logo') return false;        // sponsor/credentials/trusted-by walls
  if (p.kind === 'social_icon') return false;
  if (p.kind === 'favicon') return false;
  if (p.width < 1024 || p.height < 768) return false;      // RULE 2: low-res looks bad zoomed
  if ((p.gpt4o_quality_score ?? 0) < 7) return false;      // RULE 3: ugly zoomed = stays small
  return true;
}
```

## Forbidden Combinations
NEVER lightbox: logos | institutional/sponsor/partner/trusted-by logo grids | social media icons | favicons | UI iconography | decorative SVGs | hero-as-decoration backgrounds | tile backgrounds | thumbnails of off-site videos | screenshots <1024px wide. Build gate: grep dist HTML/JSX/TSX for `data-gallery="logos"|"trusted"|"sponsors"|"partners"|"credentials"|"institutions"|"clients"` → any match fails build (skill 07).

## Lightbox-Eligible by Section
Hero photos (≥1280×720) | gallery sections | service detail photography | team headshots (only if ≥1024×1024 — most aren't, skip otherwise) | before/after sliders (separate UX, not lightbox) | press photo libraries | event photos | product photos | restaurant food photos. Each must pass all 3 rules.

## Same-Section Grouping + Integrated Captions (***UNIVERSAL — BUILD-BREAKING***)
When a section/page contains ≥2 lightbox-eligible images on the SAME topic (gallery, team, services, before/after, press, event, food, product, portfolio), ALL of them MUST share ONE `data-gallery="<section-slug>"` ID — never split into per-image groups, never mix unrelated topics in the same group. Section-slug = kebab-cased section heading or route segment (`hero-team` | `programs-2024-gala` | `services-pediatric` | `food-menu-mains`). Building separate galleries `data-gallery="img-1"`, `data-gallery="img-2"` (the lone-mountain-global-3 incident, 2026-05-01) defeats the purpose — user clicks one, can't navigate to siblings, has to close and re-open per image. Build gate (`validate-lightbox-grouping.mjs`): for every section element containing ≥2 `[data-zoomable]` descendants, assert all share ONE `data-gallery` value — multiple distinct values inside same `<section>` / `[data-section]` ancestor=fail. Cross-section grouping forbidden — never `data-gallery="all-photos"` spanning the whole page.
Every lightbox-eligible image MUST carry `{ title, description, credit?, link? }` caption metadata sourced from: source-site `<figcaption>` → source-site `alt` (when ≥6 words and not filename-like) → AI-generated 8-15 word description via GPT-4o vision → manual brand voice pass. Render captions in TWO places: (a) section UI as `<figcaption>` (gallery grid) OR overlay-on-hover (hero/cards) with `aria-describedby` linking image to caption text, AND (b) lightbox modal as bottom strip (NOT corner badge) with title (16px semibold) + description (14px regular) + credit if present + link button when source-cite URL exists. Render via `data-caption-title`, `data-caption-description`, `data-caption-credit`, `data-caption-link` attributes on `<img>` — lightbox JS reads them on open. Build gate same validator: `[data-zoomable]` without `data-caption-title`+`data-caption-description`=fail; captions must round-trip identically across section UI + modal (compare DOM text content, fail on mismatch). Captions must clear small-text contrast bar (≥7:1 vs scrim, see rules/always.md).

## Logo Grid Treatment (***INSTEAD OF LIGHTBOX***)
Logo grids (sponsors / trusted-by / partners / credentials / press / clients) render as hover-grayscale-to-color rows:
```css
.logo-grid img {
  filter: grayscale(1) brightness(1.1);
  opacity: 0.65;
  transition: filter 0.3s var(--ease-out), opacity 0.3s var(--ease-out);
}
.logo-grid img:hover, .logo-grid img:focus { filter: none; opacity: 1; }
```
Wrap each in `<a>` if logo points to source (journal homepage, sponsor site, client case study). `target="_blank" rel="noopener"`. Min target 24×24px (WCAG 2.5.8) — usually 80-120px logo height satisfies.

## ImageProfile Augmentation (skill 12 image-profiling.md)
Per-image GPT-4o vision call returns:
```ts
interface ImageProfile {
  width: number; height: number;
  kind: 'photo'|'illustration'|'logo'|'institution_logo'|'social_icon'|'favicon'|'icon'|'screenshot'|'diagram';
  gpt4o_quality_score: number;  // 1-10
  has_white_background: boolean;
  white_bg_corner_samples: [number, number, number, number];  // RGB avg per corner
  dominant_colors: string[];
  suggested_placement: string[];
  is_lightbox_eligible: boolean;  // computed via inferLightboxEligibility
}
```
Builder reads `profile.is_lightbox_eligible` and only wraps with `data-zoomable` / `data-gallery` when true.

## Edge Cases
Mixed grids (some photos + some logos): split into two grids — photo gallery (lightbox), logo strip (hover treatment). Never mix. Composite images (photo with logo overlay): treat as photo, lightbox-eligible if rules pass — but never crop logo onto a separate lightbox slide. Stock photos used as decoration: `kind='photo'` but if `gpt4o_quality_score<7`, `is_lightbox_eligible=false` → render small without zoom.

## Verification (skill 07)
Visual gate: Playwright clicks one logo from a `.logo-grid` element on the deployed site → asserts NO `[role="dialog"][aria-modal="true"]` appears. Click one image from `[data-gallery]` → asserts dialog appears. Both must hold for build to pass.

## Anti-Pattern Examples (***CAUGHT IN POST-DEPLOY VISUAL QA***)
lone-mountain-2 (2026-05-01): Boston University, Harvard, Colgate logos rendered into a `data-gallery="institutions"` lightbox carousel — clicking each opened a 1200×800 modal with a 200×80 grayscale logo centered on dark backdrop. Looked broken. Fix: classifier promotes these to `kind='institution_logo'` → forbidden from lightbox → render as hover-grayscale-to-color row under credentials list, each linking to the institution's homepage.
