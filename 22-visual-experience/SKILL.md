---
name: "visual-experience"
description: "Gorgeous/cinematic requirements every delivered app's UI must meet — anti-slop premium bar, exact brand tokens, motion, logo/image quality, WCAG 2.2 visual accessibility."
triggers:
  - "design"
  - "ui"
  - "visual"
  - "motion"
  - "theme"
priority: 2
pack: "design"
stage: stable
---

# Visual & Experience — every app's UI must be gorgeous

## The bar

- Anti-AI-slop, premium, distinctive — investor-demo quality. Apple Test: two elements compete → remove one; crowded → add whitespace; final feel effortless, inevitable.
- Gorgeous-by-default: every iteration measurably more beautiful than the last. Never ship "functional but plain."

## Cinematic floor

- Hero: full-screen video or particle / gradient-mesh field — never a flat gradient placeholder.
- Scroll-driven section transitions + View Transitions on every public surface; `@starting-style` entrances; custom cursor / micro-interactions.
- Depth: layered surfaces, gradient meshes, glass + subtle grain.

## Brand (exact, non-inferable)

- Dark-first. `#060610` bg (never `#000`) · `#00E5FF` cyan (primary CTA) · `#50AAE3` blue (secondary) · `#7C3AED`/`#8B5CF6` purple. Text `#f0f0f5` (never `#fff`).
- Fonts: Space Grotesk (headings) · Sora (body) · JetBrains Mono (mono) · Clash Display (hero only). Self-hosted WOFF2 — never Google Fonts CDN.
- Fluid `clamp()` type scale; `text-wrap: balance` (headings) / `pretty` (body); max 65ch; border-radius never 0, never pill.

## Motion

- Purposeful, brand-locked; scroll-driven + View Transitions; always honor `prefers-reduced-motion` with a full non-animated path.

## Logo (non-negotiable)

- White/light-text logo only on dark/contrasting backing. Navbar wordmark: single line (never wraps), large + prominent (fluid), contrast halo over a transparent-nav hero. Mark rendered large (not a timid afterthought); a generated wordmark is a tight banner, not a padded square.

## Imagery

- Real, high-quality, relevant images — never gray placeholder boxes. Logos ship with alpha (no opaque box). Every image has meaningful alt text.

## Visual accessibility (WCAG 2.2 AA)

- Contrast ≥4.5:1 text / ≥3:1 large + UI — verify muted/accent tokens, not just defaults. Target size ≥24×24px. Focus ring 2px, ≥3:1, never obscured by sticky headers.
- 4-STATE distinction (NON-NEGOTIABLE): `default · hover · focus-visible · active` each visually distinct — never two identical.
- axe-core 0 violations at 6 breakpoints (375/390/768/1024/1280/1920). Theme toggle + persistence + system default.
