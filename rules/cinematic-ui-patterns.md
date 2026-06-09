---
name: "cinematic-ui-patterns"
priority: 3
pack: "design"
triggers:
  - "cinematic"
  - "rolling counter"
  - "stat"
  - "appReveal"
paths:
  - "*"
---

# Cinematic UI Patterns

## Standing rule

- Every numeric stat on every projectsites.dev surface (marketing, admin, generated sites, dashboards) renders through `<app-rolling-counter>` — NEVER a static text node
- Every section, card, stat, and CTA fades + translates 16px up on first paint via `[appReveal]` — NEVER ships static
- No exceptions without a stated reason inline (e.g. `<!-- no rolling-counter: SSR-critical above-the-fold integer -->`)
- Reusable components live in `src/app/components/` and `src/app/directives/` — every page imports them, never re-implements
- Drift = audit fail in Turn-3 visual QA + Playwright `e2e/cinematic-ui.spec.ts` regression

## Reusable components

- `<app-rolling-counter>` — `src/app/components/rolling-counter/rolling-counter.component.ts`
- `<app-before-after-slider>` — `src/app/components/before-after-slider/before-after-slider.component.ts`
- `appReveal` directive — `src/app/directives/reveal.directive.ts`
- `<app-trust-strip>` — `src/app/components/trust-strip/trust-strip.component.ts`

## Canonical usage — `<app-rolling-counter>`

```html
<!-- Integer with thousands separator + plus suffix -->
<app-rolling-counter [value]="2480" suffix="+" />

<!-- Decimal percentage -->
<app-rolling-counter [value]="99.99" [decimals]="2" suffix="%" />

<!-- Currency with custom duration -->
<app-rolling-counter [value]="50000" prefix="$" [duration]="1800" />

<!-- Seconds -->
<app-rolling-counter [value]="42" suffix="s" />
```

### Behavior contract

- Counts up from `0` to `value` via `requestAnimationFrame` with `easeOutQuart` easing
- Locale-formats via `Intl.NumberFormat` (default `en-US`, override with `locale`)
- Fires only when host enters viewport (IntersectionObserver, threshold `0.4`)
- `prefers-reduced-motion: reduce` → snap to final value, no animation
- `aria-live="off"` during animation; `aria-label` always reflects final formatted value (AT users hear truth on first focus, not the rolling intermediate)
- SSR-safe — snaps to final value when not in browser
- `font-variant-numeric: tabular-nums` baked in so digits don't reflow during count

## Canonical usage — `appReveal`

```html
<!-- Default: 16px rise + fade over 520ms, staggered 80ms by document order -->
<section appReveal>
  <h2>Bold headline</h2>
</section>

<!-- Custom additional delay (ms) on top of the auto stagger -->
<div appReveal [revealDelay]="120">Delayed reveal</div>

<!-- Tune stagger step for tighter / looser sequences -->
<div appReveal [revealStep]="40">Tighter</div>
```

### Behavior contract

- Web Animations API (`Element.animate`) — no CSS keyframes needed, no FOUC, no layout shift
- Above-the-fold hosts animate on first paint, staggered by document order × 80ms
- Below-the-fold hosts use IntersectionObserver fallback (threshold `0.12`, rootMargin `0px 0px -6%`)
- `prefers-reduced-motion: reduce` → host stays at final state, never hides content from reduced-motion users
- Module-scoped order counter resets per page reload — every first-paint re-staggers
- Safe-by-default — host's final state is visible; the animation only adds the entrance flourish

## Canonical usage — `<app-before-after-slider>`

```html
<app-before-after-slider
  beforeSrc="/images/compare/generic.svg"
  afterSrc="/images/compare/projectsites.svg"
  beforeLabel="Generic competitor"
  afterLabel="Built with projectsites.dev"
  [initial]="50"
/>
```

### Behavior contract

- Pointer (mouse + touch + pen) drag on divider or anywhere on surface
- Keyboard: `ArrowLeft`/`ArrowRight` ±2%, `Shift+Arrow` ±10%, `Home`/`End` to extremes, `PageUp`/`PageDown` ±10%
- ARIA: `role="slider"`, `aria-valuenow`, `aria-valuemin=0`, `aria-valuemax=100`, `aria-label`
- `touch-action: none` on surface — vertical scroll never conflicts with horizontal drag
- `clip-path: inset(0 X% 0 0)` reveals the after-image; cyan rule + circular grab-handle ring
- `prefers-reduced-motion: reduce` → instant snap, no clip-path transition

## Component checklist (every Angular component on projectsites.dev)

- Numeric stat → `<app-rolling-counter>` (not raw `{{ value }}`)
- Section root → `appReveal` (not static or pure `*ngIf` toggle)
- Image pair / comparison → `<app-before-after-slider>` (not stacked static `<img>`)
- Brand colors → `var(--ps-bg)` / `var(--ps-ink)` / `var(--ps-accent)` / `var(--ps-accent-secondary)` (never hardcoded hex)
- All animations gated by `prefers-reduced-motion: reduce`
- All interactive elements have `:focus-visible` outline of `var(--ps-accent)`
