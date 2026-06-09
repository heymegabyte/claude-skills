---
name: "text-contrast"
priority: 2
pack: "design"
triggers:
  - "contrast"
  - "wcag"
  - "color"
paths:
  - "*"
---

# Text Contrast on Backgrounds

## Core rule

- Dark surface → light text. Light surface → dark text.
- NEVER dark-on-dark or light-on-light.
- Includes runtime-injected colors (palette extraction, theme-from-album, JS-set custom properties).
- Naked accent on dark canvas often produces "dark blue on black" when accent gets palette-derived from cover art / brand image / user uploads.

## Pattern (CSS)

Every text-using accent gets TWO contrast-safe siblings — moderate-lift for body copy, hard-clamped NEON for HUD/badge/numeric overlays. Numeric overlays must read neon, never dull — palette extraction can yield muted olive/navy/wine; neon clamp lifts L+C up regardless.

```css
:root {
  --bg: #060610;
  --ink: #f4f4ff;
  --accent: #00e5ff;

  /* Moderate-lift: 70% accent + 30% near-ink in OKLCH. Brand-true tint
     preserved, contrast safely above WCAG AA. For inline copy, captions,
     tags, link text. */
  --ink-accent: color-mix(in oklch, var(--accent) 70%, var(--ink) 30%);
  --ink-album-accent: color-mix(in oklch, var(--album-accent, var(--accent)) 70%, var(--ink) 30%);

  /* NEON-clamped: OKLCH relative-color forces L ≥ 0.78 and C ≥ 0.22 while
     preserving input hue. Even a dull #1e3a8a navy lifts to vivid neon-blue.
     For HUD digits, badge counters, status pills, small numeric overlays
     where dullness reads broken. Requires `oklch(from ...)` — Chrome 119+,
     Safari 16.4+, Firefox 113+ (baseline); ship w/ fallback chain. */
  --ink-accent-neon: oklch(from var(--accent) max(l, 0.78) max(c, 0.22) h);
  --ink-album-accent-neon: oklch(from var(--album-accent, var(--accent)) max(l, 0.78) max(c, 0.22) h);
}
```

### Token usage

- Body text accents (inline copy, captions, tags, link text) → `--ink-accent` / `--ink-album-accent`
- HUD digits, badge counters, status pills, numeric overlays where dullness reads broken → `--ink-accent-neon` / `--ink-album-accent-neon` w/ fallback `color: var(--ink-accent-neon, var(--ink-accent, var(--accent)))`
- Borders, backgrounds, outlines, box-shadows, `accent-color`, `caret-color`, `text-decoration-color` → keep raw `--accent` / `--album-accent`

## Light-theme mirror

- `--ink-accent` as `color-mix(in oklch, var(--accent) 70%, #0a0a18 30%)` so accents pull TOWARD opposite-pole text, not toward white absolutely.

## Halo text-shadow for floating overlays

- Text floating over canvas/visualizer of ANY brightness needs halo
- Dark theme: `text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6)`
- Light theme: `text-shadow: 0 1px 2px rgba(255, 255, 255, 0.6)`
- Mandatory for: HUD/chip text over canvas, video, blurred backgrounds, generative imagery

## Opaque text-bg scrim (UNIVERSAL — every text element)

Every text element must have OPPOSITE-pole bg. Most text satisfies this via card/panel/dialog parents. Text without opaque parent — hero overlays, lyric overlays, badges on video, status pills on imagery, transport labels on translucent rails — needs per-text scrim.

```css
:root {
  --text-bg-dark:  rgba(6, 6, 16, 0.82);
  --text-bg-light: rgba(244, 244, 255, 0.88);
}

.text-bg,
[data-text-floating] {
  display: inline;
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--text-bg-dark);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}
.text-bg--light,
[data-text-floating='light'] {
  background: var(--text-bg-light);
  color: var(--bg);
}
```

### When to apply scrim

- ALWAYS: text on canvas/video/blurred-bg/generative imagery (hero titles, mode names, time-elapsed counters over visualizer, lyric overlays)
- ALWAYS: text on translucent rail (parent bg `rgba()` alpha < 0.9)
- NEVER: text inside already-opaque card/panel/dialog/sheet
- NEVER: body paragraphs in long-form prose (markdown in chat panel, blog post, settings field labels)
- NEVER: form input internal text

### Per-line backdrop, not bounding-rect

`box-decoration-break: clone` (Webkit-prefixed for Safari) makes scrim wrap EACH rendered line, so wide hero title w/ `text-wrap: balance` produces three line-wrapped scrims, not one fat rectangle.

### Light-theme mirror

Define `--text-bg-light` + apply via `.text-bg--light` for future light surface (admin dashboards, print views, press kits).

## Build gate (WARNING — doesn't fail build)

- axe-core color-contrast at AA (4.5:1 normal, 3:1 large) — warning
- Playwright `e2e/contrast.spec.ts` grabs computed `color` + `background-color` of every clickable + reading text, logs <4.5
- Palette-extracted color paths log check that mixed color hits ≥4.5:1
- Rationale for warning tier: `color-mix(in oklch, X 70%, --ink 30%)` token pattern prevents most failures at source
- axe-core color-contrast violation count IS tracked in Lighthouse A11y ≥95 hard gate (`quality-metrics.md`)

## Dark-on-dark hunting (UNIVERSAL audit)

- Grep CSS for `color: var(--accent)` or `color: var(--<token>)`
- If token resolves to luminance <0.4 on `--bg`, swap to `--ink-<token>` sibling
- Audit any JS calling `setProperty('--accent', extracted)` or `setProperty('--color-*', userInput)`
- MUST flow through token w/ ink-mix baked into consuming CSS rule, NOT into JS-set token (keeps source color intact for borders/backgrounds)

## Light-on-light hunting

- `color: white` / `color: var(--ink)` on light theme component fails same gate
- Mirror audit query

## Auto-fix recipe

- Contrast check fails on `selector { color: X }` over `background: Y` → mutate to `color: color-mix(in oklch, X 70%, <opposite-pole-ink> 30%)`
- Iterate mix percentage in 10% steps until passes
- Max 70% mix (heavier and brand intent is lost; swap to `var(--ink)` directly + brand-color underline/border for accent flavor)

## Component checklist (every is text-on-canvas-or-card)

- HUD/badges/chips
- Transport bars
- Lyric overlays
- Tooltip values
- Code highlight tokens
- AI chat message-body
- Settings field-labels
- Sidebar nav items
- Error toasts
- Status dots
- Breadcrumbs
- Footer credits
- Every JSON-LD-rendered factual answer block

## Never

- Ship `color: var(--accent)` for non-trivially-sized text on dark surface without `--ink-accent`
- Ship static brand color for body text on light theme below 4.5:1
- Rely on `text-shadow` alone for contrast (defensive layer, not primary)
- `mix-blend-mode: difference` for "guaranteed" contrast (breaks under prefers-contrast-high, looks broken on most palettes)
