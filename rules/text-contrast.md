# Text Contrast on Backgrounds (***UNIVERSAL — EVERY PROJECT, EVERY PAGE, EVERY COMPONENT***)

## Core rule
- Dark surface → light text. Light surface → dark text.
- NEVER dark-on-dark or light-on-light
- Includes runtime-injected colors (palette extraction, theme-from-album, JS-set custom properties)
- Naked accent on dark canvas often produces "dark blue on black" when the accent gets palette-derived from cover art / brand image / user uploads

## Pattern (CSS)
Always pair every text-using accent with TWO contrast-safe sibling tokens — a moderate-lift variant for body copy and a hard-clamped NEON variant for HUD/badge/numeric overlays. Numeric overlays must read as neon, never dull — when palette extraction yields a dim hue (any cover/avatar/brand image can produce muted olive/navy/wine swatches), the neon clamp must lift L+C up regardless of input.

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

  /* NEON-clamped: OKLCH relative-color syntax forces lightness ≥ 0.78
     and chroma ≥ 0.22 while preserving the input hue. Even a dull
     #1e3a8a palette-extracted navy lifts to a vivid neon-blue. For
     HUD digits, badge counters, status pills, small numeric overlays
     where dullness reads as broken. Requires `oklch(from ...)`
     relative-color syntax — Chrome 119+, Safari 16.4+, Firefox 113+
     (all baseline now); ship with fallback chain for older browsers. */
  --ink-accent-neon: oklch(from var(--accent) max(l, 0.78) max(c, 0.22) h);
  --ink-album-accent-neon: oklch(from var(--album-accent, var(--accent)) max(l, 0.78) max(c, 0.22) h);
}
```

### Token usage
- Body text accents (inline copy, captions, tags, link text) → `--ink-accent` / `--ink-album-accent`
- HUD digits, badge counters, status pills, small numeric overlays where dullness reads as broken → `--ink-accent-neon` / `--ink-album-accent-neon` with fallback chain: `color: var(--ink-accent-neon, var(--ink-accent, var(--accent)))`
- Borders, backgrounds, outlines, box-shadows, `accent-color`, `caret-color`, `text-decoration-color` → keep raw `--accent` / `--album-accent` (chrome tolerates muted hues; foreground text doesn't)

## Light-theme mirror
- Define `--ink-accent` as `color-mix(in oklch, var(--accent) 70%, #0a0a18 30%)` so accents always pull TOWARD the opposite-pole text color, not toward white absolutely

## Halo text-shadow for floating overlays
- Text floating over canvas/visualizer content of ANY brightness needs a halo so it never blends with bright regions
- Dark theme: `text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6)`
- Light theme: `text-shadow: 0 1px 2px rgba(255, 255, 255, 0.6)`
- Mandatory for: HUD/chip text rendered over canvas, video, blurred backgrounds, generative imagery

## Opaque text-bg scrim (***UNIVERSAL — every text element, every project***)
Literal contract: every text element must have a background of the OPPOSITE pole color (dark text → light bg, light text → dark bg). Most text already satisfies this implicitly because it sits inside cards/panels/dialogs with their own opaque background. Text that DOES NOT sit on an opaque parent — hero overlays, lyric overlays floating on canvas, badges on video, status pills on imagery, transport labels on translucent rails — needs an explicit per-text scrim.

```css
:root {
  --text-bg-dark:  rgba(6, 6, 16, 0.82);    /* opposite-pole bg for light text */
  --text-bg-light: rgba(244, 244, 255, 0.88); /* opposite-pole bg for dark text */
}

/* Utility: apply to any floating text element. Uses inline display +
   box-decoration-break: clone so multi-line strings get a per-line
   background wrap instead of one giant bounding-rect box. Padding
   wide enough to clear ascenders/descenders without crushing type. */
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

### When to apply the scrim
- ALWAYS: text floating directly on canvas/video/blurred-bg/generative imagery (hero titles, mode names, time-elapsed counters over visualizer, lyric overlays without a parent dim panel)
- ALWAYS: text on a translucent rail where the parent rail's background `rgba()` alpha < 0.9 (gives the rail enough opacity to satisfy contrast but still leaks color underneath)
- NEVER: text inside an already-opaque card/panel/dialog/sheet (the card's background IS the scrim; stacking another box reads as visual noise)
- NEVER: body paragraphs in long-form prose surfaces (markdown bodies in a chat panel, blog post copy, settings field labels) — these always sit on opaque cards by design
- NEVER: form input internal text (the input's own background is the scrim)

### Per-line backdrop, not bounding-rect
`box-decoration-break: clone` (Webkit-prefixed for Safari) makes the scrim wrap EACH rendered line of a multi-line block, so a wide hero title with `text-wrap: balance` produces three line-wrapped scrims, not one fat rectangle. Without this, wide titles get a giant box that breaks the cinematic feel.

### Light-theme mirror
Define `--text-bg-light` and apply via `.text-bg--light` for any future light surface (admin dashboards, print views, public press kits). Same `display: inline + box-decoration-break: clone` pattern; just swap the bg variable.

## Build gate (***WARNING — does not fail build***)
- axe-core color-contrast rule reports at AA (4.5:1 normal, 3:1 large) as a warning
- Playwright assertion in `e2e/contrast.spec.ts` grabs computed `color` + `background-color` of every clickable + every reading text element, logs anything <4.5
- Palette-extracted color paths log a check that the extracted color, mixed with `--ink` per the pattern above, hits ≥4.5:1
- Rationale for warning tier: the `color-mix(in oklch, X 70%, --ink 30%)` token pattern already prevents most failures at the source; build-blocking on residual axe edge cases stalls deploys for marginal gain
- The axe-core color-contrast violation count IS still tracked in the Lighthouse A11y ≥95 hard gate (see `quality-metrics.md`)

## Dark-on-dark hunting (***UNIVERSAL audit query***)
- Grep CSS for `color: var(--accent)` or `color: var(--<token>)` patterns
- If the token resolves to a luminance <0.4 on the design system's `--bg`, swap to the `--ink-<token>` sibling
- Audit any place a JS file calls `setProperty('--accent', extracted)` or `setProperty('--color-*', userInput)`
- These MUST flow through a token that has the ink-mix already baked into the consuming CSS rule, NOT into the JS-set token itself (keeps the source color intact for borders/backgrounds)

## Light-on-light hunting
- Any `color: white` / `color: var(--ink)` on a light theme component fails the same gate
- Mirror the audit query

## Auto-fix recipe
- When a contrast check fails on `selector { color: X }` over `background: Y`, mutate to `color: color-mix(in oklch, X 70%, <opposite-pole-ink> 30%)`
- Iterate the mix percentage in 10% steps until the contrast computation passes
- At most 70% mix (any heavier and the brand intent is lost; at that point swap to `var(--ink)` directly and add the brand-color underline/border for accent flavor)

## Component checklist (every one is text-on-canvas-or-card; every one is a contrast risk on user-supplied or palette-extracted color)
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
- Ship `color: var(--accent)` for a non-trivially-sized text block on a dark surface without also defining `--ink-accent`
- Ship a static brand color for body text on a light theme that drops below 4.5:1
- Rely on `text-shadow` alone for contrast (it's a defensive layer, not the primary contrast strategy)
- Use `mix-blend-mode: difference` for "guaranteed" contrast (breaks under prefers-contrast-high and looks broken on most palettes)

## See
- `rules/quality-metrics.md` (a11y thresholds)
- `rules/always.md` (skip-link + focus appearance gates)
