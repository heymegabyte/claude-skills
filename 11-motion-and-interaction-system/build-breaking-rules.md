---
name: "11 build-breaking motion rules"
description: "Universal motion/interaction gates: stat counter roll-in, click ripple (no cursor follower), 4-state interactive (active/hover/focus/focus-visible) + universal underline-hover (single underline only), no-layout-shift image hover, no-white-flash card hover, View Transitions cross-fade, animate.css entrance, anti-FOUC fadeIn. Migrated verbatim from rules/always.md 2026-05-03."
metadata:
  version: "1.0.0"
  updated: "2026-05-03"
  effort: "high"
  context: "fork"
license: "Rutgers"
compatibility:
  claude-code: ">=2.0.0"
  agentskills: ">=1.0.0"
---

# 11 — Build-Breaking Motion + Interaction Rules

Migrated from `~/.claude/rules/always.md` 2026-05-03.

## Every stat block

`150+ Publications`, `30+ Years`, `$2.4M raised`:

- IntersectionObserver + rAF roll-in counter ≤1.6s ease-out; respects `prefers-reduced-motion`
- `+` / `%` / `x` suffix renders OUTSIDE animated digit node

## Every site (interactive 2 — 4 distinct states + universal underline-hover)

All 4 distinct + animated states required per button/link/input/tile: `:active`, `:hover`, `:focus`, `:focus-visible`. Build gate: visual-qa subagent verifies via DOM snapshot at 6 breakpoints.

**Tile-as-link** — entire tile is click target with hover lift, not just inner chip.

### Universal underline-hover for body+heading `<a>` (***EXACTLY ONE UNDERLINE — NEVER TWO — UNIVERSAL — BUILD-BREAKING***)

- Block MUST live at END of global stylesheet, OUTSIDE `@layer components` — Tailwind v4 layer order (base < components < utilities) means `text-decoration:none` inside components LOSES to Tailwind's `underline` utility, producing double-underline (fail)
- Auto-apply selectors set `text-decoration:none !important` + `position:relative` + transition ONLY — NEVER set `color` (hardcoded color overrides Tailwind parent classes, causing invisible dark-on-dark links)
- `::after` MUST use `background:currentColor` (NEVER a hardcoded brand var) — sweep matches link's text color in any context

```css
.underline-hover, .blog-paragraph a, main p a:not([class*="btn-"]):not([data-no-underline]):not(:has(img)):not(:has(svg)) {
  position:relative;
  text-decoration:none !important;
  transition:color .2s ease,opacity .2s ease
}
.underline-hover::after, ...::after {
  content:""; position:absolute; z-index:1;
  left:51%; right:51%; bottom:-2px;
  background:currentColor; height:1px;
  opacity:.6;
  transition:left .3s ease-out,right .3s ease-out,opacity .2s ease;
  pointer-events:none
}
.underline-hover:hover::after, .underline-hover:focus-visible::after {
  left:0; right:0; opacity:1
}
```

## Every desktop site (***CLICK RIPPLE ONLY — UNIVERSAL — megabyte.space reference***)

Desktop-only: `(min-width:768px) and (pointer:fine)` AND NOT `prefers-reduced-motion:reduce`.

- **NEVER** hide native cursor; **NO** cursor-ring/follower/dot/halo (removed 2026-05-02)
- `mousedown` spawns `<span class="cursor-ripple">` at click coords: 8px→60px expand, `border:1.5px solid var(--brand-accent)`, `position:fixed`, `pointer-events:none`, `z-index:9999`, `mix-blend-mode:difference`, opacity 0.6→0, 0.6s ease-out, removed on `animationend`
- Touch/`pointer:coarse` AND reduced-motion BOTH skip the ENTIRE system (no init)
- Template ships `src/lib/cursor.ts` + global CSS (ripple-only, ring code deleted) — never hand-rolled per site

Build gate `validate-cursor.mjs`: assert NO `.cursor-ring` element in DOM, AND `body{cursor:none}` rule absent, AND ripple spawns on mousedown.

## Every image hover (***NO LAYOUT-AFFECTING PROPERTIES — UNIVERSAL — BUILD-BREAKING***)

`<img>` / `<picture>` / `<svg>` `:hover` / `:focus` MUST NOT mutate `border | outline | padding | margin | width | height | border-width | inset | top | left | right | bottom`.

Allowed: `transform` (scale/translate), `filter` (brightness/saturate/blur), `box-shadow` (incl. `inset 0 0 0 2px var(--brand-accent)`), `opacity`. Default state must reserve final box (e.g. always-on `border:2px solid transparent`).

Build gate `validate-image-hover.mjs`: triggers `:hover` on every image, samples bounding-rect before+after — any dimension shift >0px = fail; CSS grep rejects `img:hover{border|outline|padding|margin|width|height: ...}`.

## Every card hover (***NO WHITE-FLASH ON FIRST HOVER — UNIVERSAL — BUILD-BREAKING***)

Card components MUST NOT flash white/transparent on first hover. Root cause: hover transitions on `background-color` or `box-shadow` without explicit FROM-state cause browser to interpolate from `initial` (transparent/none).

### Required pattern

```css
.card {
  background-color: var(--card-bg);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.card:hover {
  background-color: var(--card-bg-hover);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  transform: translateY(-3px);
}
```

- `will-change: transform, box-shadow` only when hover frequency justifies
- Prefer `transform:translateY` over `top/margin` for lift; prefer `opacity` change on pseudo-element overlay over `background-color` change

Validator (`validate-card-hover-no-flicker.mjs`): Playwright records 30fps video of cursor entering card; any single frame >20% brighter than rest-state followed by darker frames = white-flicker fail.

## Every page transition

View Transitions API cross-fade 220ms ease-out, `html{background-color:var(--bg-primary)}` — NEVER allow a white frame between routes.

## Every entrance animation

`animate.css` bundled globally (NOT CDN, no FOUT); prefer its classes (`animate__fadeInUp` / `animate__zoomIn` / `animate__slideInLeft`) for entrance/exit. Custom `@keyframes` only when `animate.css` insufficient.

## Every site (***ADVANCED BROWSER API INTEGRATION — MINIMUM 3 APIS BEYOND DOM — UNIVERSAL — BUILD-BREAKING***)

Every generated site MUST implement ≥3 advanced browser APIs providing genuine interactive value.

### Mandatory baseline (all sites)

1. **Web Audio API** — UI feedback sounds on primary CTA: button click 80ms 220Hz→440Hz; hover 20ms 880Hz 0.02 gain; total audio budget ≤200KB; opt-in respects `prefers-reduced-motion` + localStorage audio-mute toggle; `AudioContext` lazy-init on first user gesture (iOS); `gainNode.gain.value = 0.03`; implementation: `src/lib/audio.ts`
2. **IntersectionObserver v2** — upgrade to `trackVisibility:true, delay:100` for above-fold lazy-load of heavy assets (video, Three.js canvas, podcast player)
3. **Pointer Events API** — replace all `mouseenter`/`mouseleave` with `pointerenter`/`pointerleave`; card tilt on `pointermove`: `transform:perspective(800px) rotateX(${-y*6}deg) rotateY(${x*6}deg)` (x/y normalized to [-1,1]); disable when `prefers-reduced-motion`

### Required 4th API choice (pick by site type)

- **WebGL/Three.js** — tech/SaaS: hero particle field (Three.js instanced mesh, 2000 particles, `requestAnimationFrame`, GPU-composited)
- **Web Speech API** — service businesses: "Press / to search" voice command on desktop, graceful degradation when unavailable
- **Vibration API** — mobile-local-business: 40ms pulse on booking confirmation, 10ms on nav tap, 0ms on error
- **Web Share API** — content/blog: `navigator.share({title,text,url})` on mobile, fallback to `Clipboard API` copy
- **Payment Request API** — e-commerce/SaaS: native browser payment sheet on "Buy Now" on supported browsers
- **Gamepad API** — portfolio/interactive: konami-code easter egg (↑↑↓↓←→←→BA) triggering brand-moment animation + particle explosion

Validator (`validate-advanced-apis.mjs`): grep dist/ JS bundle for `AudioContext|webkitAudioContext` + one of `PointerEvent|pointermove|pointerenter` + one type-specific API — any missing = fail.

## Every entrance animation (***DURATION CAP 600ms + TRANSFORM/OPACITY ONLY — UNIVERSAL — BUILD-BREAKING***)

All entrance/exit/reveal animations MUST:

- (a) Complete within 600ms total
- (b) Animate ONLY `transform` and `opacity` (GPU-composited) — NEVER `height`, `margin`, `padding`, `font-size`, `width`, `left`, `top`, `right`, `bottom`

- Allowed: `transform:translateY(20px) scale(0.96)` + `opacity:0→1`
- Forbidden: `height:0→auto` transitions (use `max-height` with fixed px + `overflow:hidden` if unavoidable)
- Stagger delay max 80ms per sibling (3 items = 0/80/160ms — never 0/200/400ms)

Build gate `validate-animation-timing.mjs`: parse dist/ CSS for `@keyframes` + `transition` + `animation` duration values — fail any individual step >600ms.

## Every font load (***FONT-DISPLAY SWAP + METRIC MATCHING — UNIVERSAL — BUILD-BREAKING***)

- All web fonts MUST use `font-display:swap` in `@font-face` to prevent FOIT
- `<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/{primary}.woff2">` in `<head>` BEFORE any `<link rel="stylesheet">`
- Google Fonts: use `?display=swap` param
- Fallback fonts MUST use metric-adjusted system fonts (`size-adjust` + `ascent-override` + `descent-override` + `line-gap-override`) to minimize FOUT CLS

```css
@font-face { font-family: 'Inter-Fallback'; src: local('Arial'); size-adjust: 100.06%; ascent-override: 90%; descent-override: 22%; line-gap-override: 0%; }
```

Then `font-family: 'Inter', 'Inter-Fallback', sans-serif`.

Build gate: Lighthouse `font-display:optional|swap` audit — any FOIT-causing font = fail; CLS from font-swap must be <0.05.

## Every site (anti-FOUC + universal in-viewport fadeIn — ***NO TEXT JUMPING ON LOAD***)

Every module MUST fadeIn ONCE when entering viewport (IntersectionObserver + animate.css `animate__fadeInUp animate__faster`, single trigger).

- Text MUST start at `opacity:0` (`@starting-style` OR `.reveal-init{opacity:0;transform:translateY(20px)}`) until JS attaches observer — NEVER flash visible then jump
- INLINE `<script>` in `<head>` (BEFORE any CSS `<link>`, blocking, not defer/async) adds `js-reveal-active` to `<html>` before first paint
- CSS: `html.js-reveal-active .reveal:not(.is-visible){opacity:0;transform:translateY(20px)}`; JS toggles `.is-visible` on `entry.isIntersecting`
- `prefers-reduced-motion:reduce` — observer MUST check `matchMedia(...).matches` and call `el.classList.add('is-visible')` synchronously on ALL reveal elements on DOMContentLoaded — NEVER leave content hidden for reduced-motion users
- Safety timeout: after 1500ms, if ANY `.reveal:not(.is-visible)` exists, auto-add `is-visible` to ALL (catches IntersectionObserver failures, SSR, noJS)

Validator: post-deploy E2E screenshots at t=0, t=200ms, t=2s — assert no text element has opacity <0.1 after 2s; assert no CLS spike between frames.

## Every `<img>` (***LAZY LOADING + DIMENSIONS + FETCHPRIORITY — UNIVERSAL — BUILD-BREAKING***)

Every `<img>` in dist/ MUST have:

- (a) `width` and `height` attributes set to natural dimensions (prevents CLS)
- (b) `loading="lazy"` on every non-ATF image
- (c) ATF images: `loading="eager" fetchpriority="high"` — NEVER `loading="lazy"` on hero/above-fold
- (d) `decoding="async"` on all non-hero images

### Required shapes

- **Hero** — `<img src="/assets/hero.webp" width="1920" height="1080" loading="eager" fetchpriority="high" decoding="sync" alt="…">`
- **Card** — `<img src="/assets/card.webp" width="800" height="600" loading="lazy" decoding="async" alt="…">`

WebP primary with `<picture>` AVIF source:

```html
<picture><source type="image/avif" srcset="…"><img …></picture>
```

Every hero MUST have `srcset` at 640/1280/1920:

```html
srcset="/assets/hero-640.webp 640w, /assets/hero-1280.webp 1280w, /assets/hero-1920.webp 1920w" sizes="100vw"
```

Validator (`validate-img-attributes.mjs`): any `<img>` without `width` = fail; without `loading` = fail; ATF `<img>` with `loading="lazy"` = fail; ATF `<img>` without `fetchpriority="high"` = fail.

## Every hero `<video>` (***AUTOPLAY ATTRIBUTES + PRELOAD METADATA — UNIVERSAL — BUILD-BREAKING***)

Every background/hero `<video>` MUST have exactly: `autoplay muted loop playsinline preload="metadata"` — all five.

- `autoplay` without `muted` is browser-blocked; `playsinline` prevents iOS fullscreen hijack; `preload="metadata"` saves bandwidth
- NEVER `preload="auto"` on background videos
- ALWAYS include `poster="/assets/video-poster.webp"`
- `aria-hidden="true"` when purely decorative

When `prefers-reduced-motion:reduce`, pause via JS:

```js
const mql = matchMedia("(prefers-reduced-motion: reduce)");
if (mql.matches) video.pause()
```

MUST be self-hosted in R2 as `.mp4` (H.264 baseline, ≤8MB) + `.webm` (VP9):

```html
<source src="/assets/hero.webm" type="video/webm">
<source src="/assets/hero.mp4" type="video/mp4">
```

Validator (`validate-video-attributes.mjs`): every `<video>` — assert `muted`, `playsinline`, `preload` is `metadata` or `none` (never `auto`), `poster` set.

## Every third-party script (***DEFER OR ASYNC — UNIVERSAL — BUILD-BREAKING***)

Every external `<script src>` in `<head>` MUST use `defer` or `async`.

- `defer` for DOM-dependent ordered scripts (analytics, tag managers)
- `async` for independent scripts (chat widgets, pixels)
- GTM: `<script async src="https://www.googletagmanager.com/gtm.js?id=GTM-XXXXXX">`
- `type="module"` scripts are implicitly deferred
- EXCEPTION: anti-FOUC inline `<script>` (no src) MUST remain synchronous and blocking — all other inline scripts referencing DOM MUST move to `DOMContentLoaded`

Build gate `validate-script-defer.mjs`: every `<script src>` without `defer` | `async` | `type="module"` outside FOUC whitelist = fail.

## Every site (***CRITICAL CSS INLINED ≤14KB — UNIVERSAL — BUILD-BREAKING***)

ATF CSS MUST be inlined in `<style>` within `<head>` before any `<link rel="stylesheet">` — max 14KB compressed.

- Build step runs `critical` npm package (or `penthouse`) against each route URL → inlines in `<style id="critical-css">`
- Full stylesheet `<link>` gets `media="print" onload="this.media='all'"` + `<noscript><link rel="stylesheet" href="/styles.css"></noscript>` fallback
- Critical CSS must include: `body`/`html`, typography base, nav background, hero section, H1 styles, above-fold CTA button
- NEVER inline ALL CSS; NEVER skip critical inlining

Build gate: Lighthouse "Eliminate render-blocking resources" — zero `<link rel="stylesheet">` in critical path.

Validator (`validate-critical-css.mjs`): assert `<head>` contains `<style id="critical-css">` with `length > 500` AND full stylesheet `<link>` has `media="print"`.

## Every site (***LATEST-TECH FLEX #1 — VIEW TRANSITIONS ON EVERY NAV — UNIVERSAL — BUILD-BREAKING***)

Every site MUST use `document.startViewTransition()` for ALL internal navigation — never page reloads or instant swaps.

Per-route: `<meta name="view-transition" content="same-origin">` + `@view-transition{navigation:auto}` CSS.

### Required treatments

- Cross-fade for unrelated routes (default)
- Shared-element morph for hero→detail (`view-transition-name:hero-<slug>` on source + destination images)
- Slide-from-right for forward nav; slide-from-left for back nav
- Fallback (Safari pre-18.2): instant swap with `@supports not (view-transition-name:x)`

Validator (`validate-view-transitions.mjs`): assert `@view-transition` CSS rule + ≥2 `view-transition-name` declarations + `<meta name="view-transition">` in `<head>`.

## Every site (***LATEST-TECH FLEX #2 — SCROLL-DRIVEN ANIMATIONS NATIVE — UNIVERSAL — BUILD-BREAKING***)

Every site MUST use CSS-native `animation-timeline:view()` AND `animation-timeline:scroll()` for scroll-progress bars, parallax sections, sticky hero zoom-outs, and section reveals — NOT JS IntersectionObserver where CSS suffices.

JS-driven scroll animations permitted ONLY for: (a) audio-reactive heroes, (b) WebGL particle fields, (c) interactive scrubbers requiring exact position.

Fallback (Safari): IntersectionObserver behind `@supports not (animation-timeline:view())`.

Validator (`validate-scroll-driven-css.mjs`): assert `animation-timeline:` CSS rules in `dist/**/*.css` ≥3 occurrences AND scroll-progress indicator on every long-form page (`<progress data-scroll-progress>` OR CSS-only fixed bar).

## Every site (***LATEST-TECH FLEX #3 — CSS @SCOPE FOR COMPONENT ISOLATION — UNIVERSAL — BUILD-BREAKING***)

Every component CSS MUST use `@scope` to isolate selectors to component subtree; cascade layers (`@layer`) in tandem for predictable specificity: `@layer reset,base,components,utilities`.

```css
@scope (.card) to (.card-content > *) {
  h2 { ... }
  p { ... }
}
```

Validator (`validate-css-scope.mjs`): assert ≥3 `@scope` blocks in `dist/**/*.css` AND `@layer` declarations at top of main stylesheet.

## Every site (***LATEST-TECH FLEX #4 — POPOVER + ANCHOR POSITIONING NATIVE — UNIVERSAL — BUILD-BREAKING***)

Every site with tooltips/dropdowns/menus/modals MUST use native Popover API (`<button popovertarget="menu">` + `<div popover="auto">`) AND native CSS anchor positioning (`position-anchor:--trigger;inset-area:bottom span-left`) — NOT third-party Floating UI/Popper.js where Popover suffices.

Modals via `<dialog>` + `showModal()` (native focus trap + Esc handling).

Validator (`validate-popover-api.mjs`): assert dist HTML contains ≥2 `popovertarget=` attributes AND `position-anchor` CSS rule present OR no third-party `floating-ui`/`popper` script tags.

## Every site (***LATEST-TECH FLEX #5 — SPECULATION RULES API — UNIVERSAL — BUILD-BREAKING***)

Every site MUST ship Speculation Rules block in `<head>`:

```html
<script type="speculationrules">
{
  "prerender": [{"where": {"href_matches": "/about|/services|/contact|/pricing"}}],
  "prefetch": [{"where": {"href_matches": "/*"}, "eagerness": "moderate"}]
}
</script>
```

- Nav links + hero CTA destinations → `prerender`; footer + body links → `prefetch`
- Chromium-only; graceful no-op in Safari/Firefox

Validator (`validate-speculation-rules.mjs`): assert `<script type="speculationrules">` in every route HTML + valid JSON + ≥1 prerender + ≥1 prefetch rule.

## Every site (***LATEST-TECH FLEX #6 — HTML INVOKER COMMANDS — UNIVERSAL — BUILD-BREAKING***)

Every site with ≥1 `<dialog>` OR `<div popover>` MUST use HTML invoker commands on corresponding buttons:

```html
<button commandfor="filter-modal" command="show-modal">Filter</button>
```

Validator (`validate-invoker-commands.mjs`): assert when `<dialog>` OR `<div popover>` exists, ≥1 corresponding `<button command="...">` exists.
