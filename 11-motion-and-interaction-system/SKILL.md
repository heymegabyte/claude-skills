---
name: "motion-and-interaction-system"
description: "Meaning-first animation with 3-tier hierarchy. CSS scroll-driven (animation-timeline: scroll()), View Transitions API, @starting-style DOM-insert, container scroll-state queries, prefers-reduced-motion mandatory on all animations."
metadata:
  version: "2.1.0"
  updated: "2026-04-23"
license: "Rutgers"
compatibility:
  claude-code: ">=2.0.0"
  agentskills: ">=1.0.0"
submodules:
  - build-breaking-rules.md
---

# 11 — Motion and Interaction System

## Motion Hierarchy
**Tier 1 (always):** Page transitions, loading/skeleton, form validation, success/error, nav hover, smooth scroll, accordion, modal, tooltip.
**Tier 2 (usually):** Scroll-reveal, hover enhancements, staggered reveals, counters, progress, subtle parallax.
**Tier 3 (when appropriate):** CTA micro-interactions, confetti, animated illustrations, ambient motion, easter eggs.
Anti-slop: each animation serves one purpose — state change, attention direction, or brand reinforcement. Uniform fade-in on everything = red flag.

## Hero Drama (NON-NEGOTIABLE — every site)
Static hero = AI slop. Every hero MUST have ONE dramatic motion element layered on the brand-splash background: (a) Ken Burns slow-zoom (`scale(1) → scale(1.08)` over 18-24s, ease-in-out, infinite reverse) on the brand-splash image | (b) parallax scroll on splash (`animation-timeline: scroll(root block); transform: translateY(calc(var(--scroll) * 0.3))`) | (c) animated gradient mesh overlay (3-5 brand-color blobs, `filter: blur(80px)`, drifting via `@keyframes drift` 30-60s) | (d) particle field (canvas-based, `requestAnimationFrame`, ≤30 particles) | (e) split-text headline reveal (each word `@starting-style` translateY(40px) opacity:0 → 0 0, stagger 80ms via `sibling-index()`). Pick ONE per site (never stack — overload = noise). Pair with `prefers-reduced-motion` static fallback. The hero is the first impression — flat = forgettable.

## Number-Roll Counters (NON-NEGOTIABLE — every stat)
Every stat (review count, years in business, projects shipped, donors, students, square feet) MUST roll up from 0 to target on scroll-into-view. **Production default = JS IntersectionObserver+rAF** in a `<CountUp target n suffix='+'|'%'|'x'|'' duration={1400} locale='en-US'>` component (≤80 LOC, no lib, ships in template) — handles every browser, respects prefers-reduced-motion (skips animation, renders final value immediately), trigger ONCE via `entry.isIntersecting && !hasRun` flag, uses `Intl.NumberFormat` for thousand separators, suffix renders OUTSIDE the animated digit node (so `+`/`%`/`x` doesn't tick). CSS `animation-timeline: view()` + `counter-set` is **progressive enhancement** behind `@supports (animation-timeline: view())` — Chrome/Edge only as of 2026-05, Safari/Firefox fall back to JS. Duration: clamp(800ms, target * 8ms, 2000ms). Easing: `var(--ease-out)`. Pair `@starting-style` for opacity 0→1. NEVER static numbers in stat sections — counters communicate energy and momentum. NEVER suffix-inside-digit (renders `5,000+` as `0+ → 5,000+` ticking through `1,234+`, looks broken).
```tsx
// CountUp.tsx — production default
export function CountUp({target, suffix='', duration=1400}: {target:number;suffix?:string;duration?:number}) {
  const [n,setN] = useState(0); const ref = useRef<HTMLSpanElement>(null); const ran = useRef(false);
  useEffect(() => { const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting || ran.current) return; ran.current = true;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(target); return; }
    const t0 = performance.now(); const tick = (t:number) => { const p = Math.min(1,(t-t0)/duration);
      setN(Math.round(target * (1-Math.pow(1-p,3)))); if (p<1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }, {threshold: 0.5}); if (ref.current) io.observe(ref.current); return () => io.disconnect(); }, [target,duration]);
  return <span ref={ref}><span>{n.toLocaleString()}</span>{suffix}</span>;
}
```
```css
/* Progressive enhancement (Chrome 137+) */
@supports (animation-timeline: view()) {
  .stat-num { font-variant-numeric: tabular-nums; counter-set: stat var(--target); }
  .stat-num::after { content: counter(stat); animation: count-up 1.4s var(--ease-out) both; animation-timeline: view(); animation-range: entry 20% cover 60%; }
  @keyframes count-up { from { counter-set: stat 0; } to { counter-set: stat var(--target); } }
}
```

## animate.css (animate.style) — Tier 0 Pragmatic Default

## animate.css (animate.style) — Tier 0 Pragmatic Default (USE BEFORE HAND-ROLLING)
When the design calls for a stock entrance/exit (modals, toasts, alerts, dialog reveals, scroll reveals), reach for animate.css FIRST before writing custom @keyframes. ~70KB minified, BSD-licensed, zero JS, drop-in classes. Preferred over custom keyframes for: dialog enter/exit, toast slideIns, attention seekers (pulse/shake on validation errors), entrance staggers, scroll-revealed sections. Saves 200+ lines of custom CSS per site.
Install: `npm i animate.css` → wire global once via `angular.json:styles[]` or `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">` (prefer bundled — no extra DNS hop). Apply via `class="animate__animated animate__zoomIn animate__faster"`. Override duration with `--animate-duration: 0.25s;` on the element or `:root` for global. Programmatic exit: toggle class then `animationend` listener for cleanup.
Tier mapping: dialog open → `animate__zoomIn` 0.25s | toast → `animate__fadeInUp` 0.3s | error shake → `animate__headShake` | success → `animate__tada` (sparingly) | dialog close → `animate__fadeOut` 0.2s. Pair with `prefers-reduced-motion` block (already in this skill) — animate.css respects `--animate-duration` so the global reset auto-disables.
NEVER stack 3+ animate.css classes on the same element (collisions); NEVER use the `animate__infinite` modifier on attention seekers without intent.

## Transition Grammar
```css
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.25, 0.1, 0.25, 1);
}
```
Micro 100-150ms | Short 200-250ms | Medium 300-400ms | Long 500-700ms | Extended 800-1200ms. If in doubt: 200ms.

## CSS Scroll-Driven Animations (Chrome/Edge/Safari 26+ — off main thread)
```css
/* Tied to scroll position */
.progress-bar { animation: grow-width linear; animation-timeline: scroll(root block); }

/* Tied to element visibility */
.reveal {
  animation: slide-up linear both;
  animation-timeline: view();
  animation-range: entry 0% cover 50%;
}

/* Named timeline for cross-element sync */
.scroller { scroll-timeline: --page block; }
.synced { animation-timeline: --page; }

/* Firefox fallback (no native scroll-driven yet) */
@supports not (animation-timeline: scroll()) {
  .reveal { opacity: 1; transform: none; }
}
```
Stagger via `sibling-index()` (Chrome 129+): `.item { transition-delay: calc((sibling-index() - 1) * 80ms); }`. IntersectionObserver only when scroll-driven CSS is insufficient.

## @starting-style — Enter Animations
```css
.toast {
  opacity: 1; transform: translateY(0);
  transition: opacity 0.3s var(--ease-out), transform 0.3s var(--ease-out);
  @starting-style { opacity: 0; transform: translateY(20px); }
}
.modal[open] {
  opacity: 1; scale: 1;
  @starting-style { opacity: 0; scale: 0.95; }
}
```
Use for: modals, toasts, tooltips, drawers — anything inserted into DOM. Replaces JS add-class-on-mount patterns.

## Container Scroll-State Queries
```css
.header { container-type: scroll-state; }
@container scroll-state(stuck: top) {
  .header { box-shadow: 0 2px 8px rgba(0,0,0,0.15); backdrop-filter: blur(12px); }
}
.carousel { container-type: scroll-state; }
@container scroll-state(snapped: x) { .slide { scale: 1.02; } }
```
States: `stuck` | `snapped` | `scrollable` | `scrolled`. No JS sticky detection needed.

## View Transitions (Baseline Newly Available — Oct 2025)
```css
@view-transition { navigation: auto; }
::view-transition-old(root) { animation: fade-out 0.25s var(--ease-out); }
::view-transition-new(root) { animation: fade-in 0.25s var(--ease-out); }

/* Shared elements */
.card { view-transition-name: match-element; view-transition-class: card; }
::view-transition-group(.card) { animation-duration: 0.35s; }
```
`view-transition-name: match-element` (Chrome 137+) auto-names from identity — no manual names for list items. Nested groups (Chrome 140+) for clipping/3D. `element.startViewTransition()` for subtree-scoped (Chrome 140 experimental). <300ms total. Fade safe; slide for hierarchical nav only. Prerender: `<script type="speculationrules">{"prerender":[{"where":{"href_matches":"/details/*"}}]}</script>`

## White-Flash Fix (***NON-NEGOTIABLE — DARK SITES***)
Dark-themed sites suffer white-flash between route transitions because the browser paints `background-color: white` (default UA) before the new view's CSS arrives. Fix bundle: (a) `<html style="background:#060610">` + `<body style="background:#060610">` set inline in `index.html` BEFORE any external CSS loads — earliest possible paint. (b) `meta name="theme-color" content="#060610"` (matches viewport chrome). (c) `meta name="color-scheme" content="dark"` (browser allocates dark scrollbars + form controls). (d) `::view-transition-old(root) { background: var(--bg-primary); }` + `::view-transition-new(root) { background: var(--bg-primary); }` so the transition snapshot itself is dark. (e) For SPA route changes, render a backdrop div (`position:fixed; inset:0; background:var(--bg-primary); z-index:-1;`) in the root layout — covers any white-bg sub-route during async chunk load. Audit gate: Playwright records 60fps video of route transition → asserts NO frame contains average pixel-luminance >0.5 on a dark-themed site.

## Universal In-Viewport Reveal + Anti-FOUC (***NON-NEGOTIABLE — every site, every section, every element***)
Every module — text block, heading, image card, video, multimedia, section, stat, testimonial — MUST fade-in ONCE when entering viewport using animate.css `animate__animated animate__fadeInUp animate__faster` (or equivalent: zoomIn for cards, slideInLeft/Right for asymmetric reveals). Single trigger via IntersectionObserver, never re-runs on re-scroll. Anti-FOUC bundle (no exceptions): (a) `<html>` gets `js-reveal-active` class set BEFORE first paint via inline `<script>` in `<head>` — `document.documentElement.classList.add('js-reveal-active')`. (b) CSS rule `html.js-reveal-active .reveal:not(.is-visible){opacity:0;transform:translateY(20px);will-change:opacity,transform}` — assets are HIDDEN BY DEFAULT, never visible-then-jumped. (c) `@starting-style` belt-and-suspenders for browsers that race the inline script: `.reveal{opacity:1;transform:translateY(0);transition:opacity .6s var(--ease-out),transform .6s var(--ease-out)} .reveal{@starting-style{opacity:0;transform:translateY(20px)}}`. (d) JS observer toggles `.is-visible` on `entry.isIntersecting` ≥0.15 ratio → triggers animate.css class application. (e) Reduced-motion bypass: `prefers-reduced-motion: reduce` skips animation, renders visible immediately (`opacity:1;transform:none`). Audit gate (Playwright + visual-qa): `page.emulateMedia({reducedMotion:'reduce'})` then assert no `opacity:0` text persists 2s after load, AND non-reduced-motion run asserts `opacity:0` elements EXIST in initial DOM (no FOUC). Reference: express-heyo-ellicott-city (2026-05-02) shipped hero animation asset visible by default then snapped to animated state — ugly flicker visible in first 200ms paint. Cross-ref always.md "Every site (anti-FOUC + universal in-viewport fadeIn)". NEVER ship a section without the `.reveal` class — even if "the design has no animation," the reveal class is applied with a no-op fade so the FOUC contract holds.

## Custom Cursor — Transparent Ring + Click Ripple (***NON-NEGOTIABLE — every site, desktop only***)
Every desktop site (≥768px, pointer: fine) MUST render a custom cursor: a small transparent circular ring that follows mouse movement, plus a ripple burst on click. Reference implementation: megabyte.space. Pattern: hide native cursor (`html, body, *{cursor:none !important}` for pointer:fine devices, EXCEPT keep native cursor on inputs/textareas: `input,textarea,[contenteditable]{cursor:auto !important}`). Render two fixed-position elements globally: `<div class="cursor-ring"></div>` (16-20px transparent ring, 1.5px border in `var(--brand-accent)` at 60-70% opacity, `pointer-events:none`, `position:fixed`, `mix-blend-mode:difference` so it stays visible on every bg, `z-index:9999`, `transition:transform 0.05s linear`) — JS updates `transform: translate(x,y)` on `mousemove` (rAF-throttled, never per-event). On hover over interactive elements (`a, button, [role=button], input, [data-cursor=hover]`), the ring scales 1.6× + opacity:1 + accent color 100% — purely via class toggle, not per-frame writes. Click ripple: on `mousedown`, append a transient `<span class="cursor-ripple">` at click coords — 8px radius expanding to 60px, opacity 0.6→0, 0.6s ease-out, then `animationend` removes the node. Pattern: `.cursor-ripple{position:fixed;border-radius:50%;background:var(--brand-accent);opacity:.6;pointer-events:none;width:8px;height:8px;transform:translate(-50%,-50%);animation:cursor-ripple .6s ease-out forwards} @keyframes cursor-ripple{to{width:60px;height:60px;opacity:0}}`. Mobile/touch (`pointer: coarse`) and `prefers-reduced-motion: reduce` skip the entire cursor system — restore native cursor + skip ring rendering. Accessibility: ring MUST be supplemental — never replace focus-visible ring (3px cyan, 2px offset still required). Audit gate: Playwright desktop run asserts `document.body.style.cursor` resolves to `none` AND `.cursor-ring` element exists; mobile run asserts native cursor restored. Reference: megabyte.space cursor system. Implementation lives in template `src/lib/cursor.ts` shipped with every generated site. NEVER ship a desktop site without it — generic OS cursor on a polished site reads as unfinished.

## Text-Jump Prevention (***NON-NEGOTIABLE — every text reveal***)
Text reveals (`@starting-style` translate, fade-in, scroll-revealed headlines) MUST NOT cause layout shift. Reserve space FIRST: (a) parent has fixed `min-height` matching the post-animation height, OR (b) use `transform: translateY()` not `top/margin/padding` (transforms don't reflow), OR (c) `view-transition-name` so the browser handles size transitions. Pair with `text-wrap: balance` so headline width doesn't recompute mid-animation. Audit gate: CLS metric per route ≤0.1 (Core Web Vitals threshold). Lighthouse perf budget enforces. NEVER animate `font-size`, `letter-spacing`, `line-height` — they trigger expensive reflow + visible text-jump.

## Hover / Focus / Active
All interactive: `transition: color 0.2s, background 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.1s`. Button hover: `translateY(-1px)`. Active: `scale(0.98)`. Card: border-hover + shadow-glow + `translateY(-2px)`. Focus-visible: 3px cyan, 2px offset, no focus for mouse users.

## Loading
Skeleton: shimmer gradient 1.5s infinite. Spinner: 20px, cyan top border, 0.6s spin. Always reserve space with `aspect-ratio` or min-height — zero CLS.

## Reduced Motion (MANDATORY — every animation)
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  [data-animate] { opacity: 1 !important; transform: none !important; }
}
```
CSS `if()` alternative: `transition-duration: if(media(prefers-reduced-motion: reduce), 0s, 0.3s);`

## Performance
Only `transform` + `opacity`. Never width/height/margin/top/left. `will-change` sparingly, remove after animation ends. Max 10 simultaneous. Test 4× CPU throttle. JS scroll listeners banned — use CSS scroll-driven or IntersectionObserver. DOM <1500 nodes. `scheduler.yield()` / `setTimeout` for INP chunking.

## Motion by Section
Hero: fade 400ms, stagger CTA 200ms. Features: scroll-driven reveal, stagger 80ms. Stats: counter on view() timeline. Testimonials: fade 300ms. Pricing: hover lift. FAQ: accordion 250ms. Footer: none. Nav: blur on scroll-state(stuck), smooth active indicator.

## SVG Draw-On
`.scribble path { stroke-dasharray: 300; stroke-dashoffset: 300; animation: draw 1s var(--ease-out) forwards; }`

## Scroll Pseudo-Elements (Chrome 135+)
`::scroll-button(up)` / `::scroll-button(down)` — generated controls for scrollable containers. `::scroll-marker` — pagination dots. Style with CSS, no JS carousel boilerplate.

## Playwright Tests
Reduced motion: `page.emulateMedia({reducedMotion:'reduce'})` → assert 0 running animations. Scroll-driven: scroll container, wait for `animation-timeline` to progress, assert computed style. Hover: compare computed style before/after. View transition: `page.waitForURL()` + assert shared element position.
