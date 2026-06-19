---
name: "10 build-breaking experience+design rules"
description: "Universal experience/design gates: clickable card/tile deeplinks, detail-card deeplinks, multi-image lightbox + integrated captions, interactive functionality validator, blog/news/portfolio functional taxonomy filters + search + sort + URL-sync, filter-chip inverted active state, mega-menu hover-bridge + triangle-aim, pointer-cursor honesty, lightbox close scroll-position preservation, expandable card no content cropping, search input ≥50ch desktop, full-width visual section breakout, vertical-stack-leverages-full-real-estate (timelines+grids+dossiers never trapped in max-w-3xl prose container), comparison table full-bleed. Migrated verbatim from rules/always.md 2026-05-03."
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

# 10 — Build-Breaking Experience + Design Rules

Migrated from `~/.claude/rules/always.md` 2026-05-03.

## Every clickable card/tile (***UNIVERSAL — supersedes "tile-as-link" partial***)

- (a) Wrap the entire surface in `<a href>` (or `role="link" tabindex=0` with onClick).
- (b) `cursor: pointer` on the whole tile (NOT just the inner button).
- (c) Hover lift `transform: translateY(-3px)` + accent border glow.
- (d) Inner clickable elements (View button, org name, image) ALL point to the SAME deep target — never internal stub.
- Validator (`validate-card-deeplinks.mjs`): every `[data-card]` element has matching `href` AND `cursor: pointer` computed-style at 6bp.

## Every detail-card (publication | paper | case-study | person | portfolio item)

- MUST enrich with deep-link to canonical authoritative source — DOI/PubMed/arXiv/journal URL/external authority page (NEVER internal route stub when external source exists).
- Card body MUST hyperlink the institution/journal/conference/org name to its canonical URL.
- Visible action buttons (View, Read Full Paper, Download, Open) MUST point to the deeplink — never to an internal `/portfolio/slug` page that just re-displays the card.
- Build gate: research pipeline annotates each card item with `deeplink_url` in `_research.json`; missing deeplink for items typed `publication|paper|case-study` = fail.

## Every multi-image section (***ONE LIGHTBOX GROUP + INTEGRATED CAPTIONS — UNIVERSAL***)

- When a section contains ≥2 lightbox-eligible images on the SAME topic, ALL images MUST share ONE `data-gallery="<section-slug>"` ID — never split same-section images across multiple lightbox groups.
- Captions: every image carries `{ title: string, description: string, credit?: string, link?: string }` shipped in BOTH the section UI (card overlay or figcaption) AND the lightbox modal (visible bottom strip + `aria-describedby`).
- Validator (`validate-lightbox-grouping.mjs`): if section has ≥2 images and ≥2 distinct gallery IDs in same `<section>` ancestor = fail. Every `[data-zoomable]` MUST have `data-caption-title` AND `data-caption-description` = fail otherwise.

## Every interactive feature (***FUNCTIONALITY VALIDATOR — NOT JUST STYLING — UNIVERSAL — BUILD-BREAKING***)

- Every interactive UI element (filter chip, tab, accordion, search input, sort dropdown, toggle, modal, lightbox, mega-menu, infinite-scroll trigger, pagination link, "Load more" button) MUST functionally do what its label promises — never render as styled-but-stub UI.
- Filter chip "All Posts | News | Events" MUST actually filter the post grid; tab "Overview | Pricing | Reviews" MUST swap visible panel content; search input MUST filter results; sort dropdown MUST reorder children.
- Validator (`validate-interactive-functionality.mjs`): Playwright finds every `[data-filter], [role=tab], [aria-controls], [data-search], [data-sort], [data-load-more]`, simulates click/input, snapshots DOM before+after, asserts measurable difference (count change, attribute toggle, content swap, URL hash update); FAIL on any element where `state-after === state-before`.

## Every blog/news/portfolio listing (***FUNCTIONAL TAXONOMY FILTERS + SEARCH + SORT + URL-SYNC — UNIVERSAL — BUILD-BREAKING***)

Every page listing ≥2 posts/articles/case-studies/projects/products MUST ship working category filter + tag filter + free-text search + sort-by-date wired to real corpus data.

### Required behaviors

1. **Category click** — filters `[data-post-card]` to that category; updates URL `?category=<slug>`; sets `aria-pressed=true` on active chip; updates "Showing N of M posts" counter; deep-link-on-load reads `?category=<slug>` and pre-applies filter.
2. **Tag click** — same as category but `?tag=<slug>` (multi-tag = comma-separated).
3. **Free-text `[data-search]` input** — filters by title + excerpt + tags (case-insensitive substring) within 150ms debounce; updates URL `?q=<term>`.
4. **Sort dropdown** — reorders by `data-published-at` (newest | oldest | popular when popularity tracked).
5. **Empty-state** — friendly message + "Clear filters" CTA that strips URL params + refreshes listing.
6. **Keyboard + screen-reader** — Tab/Enter/Space/Esc; `aria-controls`, `aria-expanded`, `role=listbox/option`.

- Implementation MUST be client-side state reading from a single `posts: Post[]` array — NEVER server round-trip per filter. Categories + tags rendered MUST be the actual unique values from `posts.flatMap(p => p.categories)` deduped — NEVER hand-authored chip lists.
- Validator (`validate-blog-filters.mjs`): for every route matching `/blog|/news|/articles|/posts|/press|/portfolio|/projects|/case-studies|/insights|/stories`, Playwright: (a) counts posts before filter; (b) clicks each category chip; (c) asserts post count after click is `<` initial AND `>` 0; (d) asserts URL contains `?category=<slug>`; (e) clicks "All", asserts count returns to initial; (f) types in search box, asserts count drops; (g) reloads with `?category=<slug>`, asserts pre-applied filter state. FAIL on any step where state-after === state-before OR URL doesn't sync OR pre-applied filter ignores query string.

## Every filter-chip

- **Inactive state** — outline + accent text on transparent bg.
- **Active/selected state** — **INVERTED** (filled accent bg, bg-color text — fg/bg swap), NEVER a different accent color. Selected state must visually FILL — not just shift color.

```css
.chip { color: var(--brand-accent); border: 1px solid var(--brand-accent); background: transparent }
.chip[aria-pressed="true"], .chip.is-active { color: var(--bg-primary); background: var(--brand-accent); border-color: var(--brand-accent) }
```

## Every mega-menu / multi-column nav (***HOVER-BRIDGE + TRIANGLE-AIM ALGORITHM — UNIVERSAL — desktop hover-driven nav***)

- **Hover-bridge** — invisible `::before` on dropdown panel: `position:absolute; top:-12px; left:0; right:0; height:12px` — fills cursor-traversal corridor.
- **Triangle-aim (Bostock 2013)** — JS tracks last 3 mousemove positions; if cursor moves INTO the triangle defined by current cursor + bottom-left + bottom-right of panel, delay close 300ms; if outside triangle, close 150ms.
- Open-delay: 100ms; close-delay: 300ms aimed at panel / 150ms aimed away.
- Touch (`pointer:coarse`): tap-to-open + tap-outside-to-close, NO hover bridge.
- Keyboard: Enter/Space opens; Esc closes; Arrow keys navigate items; Tab moves to next trigger.
- Validator (`validate-mega-menu-hover.mjs`): Playwright desktop — hover trigger → move cursor diagonally through gap → assert panel open after 250ms; second run moves cursor away → assert close within 200ms. Template ships `<MegaMenu>` component — never hand-rolled per site.

## Every clickable element (***POINTER-CURSOR HONESTY — UNIVERSAL — BUILD-BREAKING***)

- `cursor: pointer` MUST appear on AND ONLY ON elements that actually do something on click.
- Forbidden: decorative cards with pointer cursor + no onclick/href; stat-counter blocks; hero illustrations; plain `<p>`/`<div>` text blocks with pointer cursor inherited from parent.
- Required: every `<a href>` / `<button>` / `[role=button]` / element with attached onClick handler GETS `cursor: pointer`; every element WITHOUT click behavior gets `cursor: default`.
- Edge cases: text input/textarea/select — use native cursors; drag handles — `cursor: grab` → `cursor: grabbing`.
- Validator (`validate-pointer-cursor-honesty.mjs`): Playwright at 6bp — for each element with `cursor: pointer`, assert it has `[onclick]` OR `<a href>` ancestor OR `<button>` ancestor OR `[role=button]` OR `[role=link]` OR `[role=tab]` OR `[role=menuitem]` ancestor — FAIL on bare `<p>`/`<div>`/`<span>`/`<section>` with pointer cursor and no click handler.

## Every lightbox close (***SCROLL-POSITION PRESERVATION — UNIVERSAL — BUILD-BREAKING — extends "Every multi-image section"***)

- When lightbox modal closes (Esc, X button, backdrop click, swipe-down), the underlying page scroll position MUST snap back to the EXACT scrollY where the user was when they opened the lightbox — never reset to 0.
- **On open** — `const restoreY = window.scrollY` AND `document.body.style.cssText = 'position: fixed; top: -' + restoreY + 'px; left: 0; right: 0; overflow-y: scroll'`.
- **On close** — `document.body.style.cssText = ''` THEN `window.scrollTo({ top: restoreY, behavior: 'instant' })` (instant, NOT smooth).
- Same pattern applies to ANY full-screen modal (mobile menu, command palette, video player).
- Validator (`validate-modal-scroll-preservation.mjs`): Playwright opens lightbox/modal at `scrollY=2000`, closes via Esc, asserts `window.scrollY === 2000` within 50ms.

## Every expandable card / "Read More" toggle (***NO CONTENT CROPPING — UNIVERSAL — BUILD-BREAKING***)

- Collapsed-by-default text + toggle MUST render the FULL expanded content visibly within the card's expanded box — never crop, never truncate after expand, never require scroll within the card.
- **Collapsed** — `max-height: <N>px; overflow: hidden; mask-image: linear-gradient(180deg, #000 70%, transparent 100%)`.
- **Expanded** — `max-height: none; overflow: visible; mask-image: none` — let the card grow to fit.
- NEVER expanded state with `max-height: 600px; overflow-y: scroll` (creates double-scroll UX).
- Animation: transition `max-height` from collapsed value to `scrollHeight + 'px'` then to `none` post-animation via `transitionend`.
- Validator (`validate-expandable-card-no-crop.mjs`): Playwright clicks every `[data-expandable]` toggle, samples post-expand `getBoundingClientRect().height` vs `scrollHeight` — if `clientHeight < scrollHeight` after expand = fail.

## Every search input (***MIN VISIBLE WIDTH ≥50ch DESKTOP — UNIVERSAL — BUILD-BREAKING — extends "Every interactive feature"***)

- Every `<input type="search">` / `<input data-search>` MUST render at minimum 50 visible characters (`min-width: clamp(20rem, 60vw, 40rem)`) on viewports ≥768px.
- On viewports <768px: stack to full width (`width: 100%`) below adjacent filter chips/sort controls — never crammed into a 200px sliver beside chips.
- Pattern: filter chips in `flex-wrap` container with `gap: 0.5rem`; search input as separate row with `width: clamp(20rem, 100%, 40rem)` and `font-size: 1rem` (≥16px on iOS to prevent input zoom); search results dropdown MUST be at least as wide as the input.
- Validator (`validate-search-input-width.mjs`): Playwright at 1280px — fail if `[type=search], [data-search]` bounding-rect width `<320px`; at 375px — fail if input shares row with chips.

## Every full-width visual section (***FULL-VIEWPORT BREAKOUT FOR HERO/MEDIA — UNIVERSAL — BUILD-BREAKING***)

- Text-content sections: constrained `max-width: 65ch / 1100px / clamp(min, content, 1280px)` with side gutters.
- Visual-impact sections (hero, image gallery, full-bleed video, immersive dividers, comparison-table, data-grid): MUST break out to full viewport width (`100vw`, edge-to-edge, no side gutters).
- Outer `<main>` has `padding-inline: clamp(1rem, 4vw, 3rem)`. Full-bleed sections use `margin-inline: calc(50% - 50vw); padding-inline: clamp(1rem, 4vw, 3rem)` to escape parent gutters.
- Hero images — full-bleed by default. Galleries with ≥6 images — full-bleed grid. Wide data-tables / comparison matrices — full-bleed when content needs >1100px. Text paragraphs / blog body — stay constrained at 65ch.
- Validator (`validate-full-bleed-sections.mjs`): fail if hero `<section>` width < `100vw` (allowing 1px scrollbar tolerance); fail if `<table data-comparison>` overflows container instead of breaking out; fail if `<p>` text-block exceeds 75ch.

## Every vertical-stack interactive section (***LEVERAGE FULL SCREEN REAL-ESTATE — UNIVERSAL — BUILD-BREAKING — extends "Every full-width visual section"***)

- When a section renders content that stacks vertically (timelines with alternating left/right cards, dossier/spotlight components, multi-card grids ≥6 items, stat-roll-up bars, partner-logo strips, pastor/team grids, founding-facts dl grids, photo galleries ≥4 items, comparison tables, FAQ accordions ≥6 entries, leadership/board grids) the OUTER container MUST be `max-w-6xl` / `max-w-7xl` / full-bleed — NEVER `max-w-3xl` / `max-w-prose` / `max-w-4xl`.
- `max-w-3xl` is reserved EXCLUSIVELY for body prose (≤65ch reading line). Any structured/interactive surface — even on a prose-heavy page — MUST break out of the prose container.
- Pattern: sibling `<section>` elements each with their own `max-w-*` based on content type: prose `<section className="max-w-3xl">`, structured `<section className="max-w-7xl">`, immersive media full-bleed. Do NOT wrap all content in a single `max-w-3xl`.
- Component-level heading inside a `max-w-7xl` section MAY use an inner `<div className="max-w-3xl">` for the heading copy — the interactive surface below it spans the full container.
- Validator (`validate-vertical-stack-width.mjs`): Playwright at 1280px finds `[data-timeline], [data-stat-rollup], [data-partner-strip], [data-pastor-grid], ol.grid, dl.grid, [data-dossier], details.accordion` — assert each parent `<section>` `width >= 1024px`. Fail code: `vertical-stack.constrained-by-prose-container`.

## Every site at every viewport (***FULL-SCREEN REAL-ESTATE UTILIZATION — UNIVERSAL — BUILD-BREAKING — supersedes hard pixel `max-width` shells***)

- Every generated site at every viewport from 320px through 3840px MUST consume available screen real-estate — no dead margins on ultrawide, no cinematic content trapped in narrow prose columns, no single 600px column on a 1024px tablet.
- Outer container token: `--container: min(1680px, calc(100vw - clamp(1rem, 4vw, 3rem)))`. Ultrawide bumps: `@media (min-width: 1920px) { --container: min(1820px, calc(100vw - 4rem)); }` / `@media (min-width: 2400px) { --container: min(2000px, calc(100vw - 6rem)); }`.
- Inner section constraints (timeline, gallery-grid, team-grid, panel, feature frames) MUST scale with the outer container — fixed caps like `max-width: 960px` on a timeline waste canvas on 1920px.
- Mobile: `100vw - clamp(1rem, 4vw, 3rem)` so content uses 90%+ of small screens; never overflow on 360px phone.
- Structured/interactive surfaces (timeline, dossier, stat-rollup, gallery, team grid, comparison table, partner strip, FAQ, content cards) USE FULL CONTAINER WIDTH; only reading prose stays ≤78ch.
- Forbidden: hard pixel `max-width: 1120px` on shells when viewport is 2560px; hard `max-width: 640px` on cinematic prose blocks; `max-width: 960px` on timelines in widened containers; `width: 100%` on section while inner `<div class="content">` re-imposes narrower cap; static `padding-inline: 4rem` instead of `clamp(1rem, 4vw, 3rem)`; viewport units without `svh/dvh` fallback.
- Every shell/panel/section uses fluid `min(<cinema-cap>, <viewport-pct>)`.
- Validator (`validate-real-estate-usage.mjs`): Playwright at 6 breakpoints (375, 768, 1280, 1680, 1920, 2560) — fail if at 1920px+ widest content block uses <80% of viewport (excluding `[data-prose]` / `<article class="prose">` containers); fail if at 375px any block overflows (`scrollWidth > clientWidth`); fail if at 1280px canvas-utilization ratio across ALL non-prose sections averages <75%. Fail codes: `real-estate.dead-margin-ultrawide` | `real-estate.cramped-mobile` | `real-estate.fixed-pixel-shell` | `real-estate.inner-cap-overrides-container`.

## Every gallery image / carousel image (***LIGHTBOX MUST OPEN ON CLICK — UNIVERSAL — BUILD-BREAKING — extends "Every multi-image section"***)

- Every `<img>` inside a `[data-gallery]` container, `[class*="carousel"]`, `[class*="slider"]`, `[class*="gallery"]`, `.swiper-slide`, `.splide__slide`, `.glide__slide`, or any multi-image grid section MUST open a fullscreen lightbox modal when clicked.
- Lightbox MUST: (a) render within 300ms of click; (b) show full-resolution image (not thumbnail); (c) display caption from `data-caption-title` + `data-caption-description`; (d) support ←/→ arrows + Esc; (e) trap focus inside modal (WCAG 2.4.3); (f) restore scroll position on close; (g) announce `role="dialog" aria-modal="true" aria-label="Image lightbox"`.
- Images NOT in gallery context (inline editorial photos, single hero, logo, icon, avatar <200px) MUST NOT open lightbox — pointer cursor honesty.
- Lightbox eligibility: `kind != logo AND dims >= 200×200 AND inside multi-image parent`.
- Template ships `src/lib/lightbox.ts` — MUST use BOTH `DOMContentLoaded` AND `MutationObserver` to wire all `[data-gallery] img` elements (React renders images ASYNCHRONOUSLY after DOMContentLoaded fires).

```js
const wire = (img) => { if(!img.dataset.lightboxWired){ img.addEventListener('click',openLightbox); img.dataset.lightboxWired='1'; } };
document.querySelectorAll('[data-gallery] img').forEach(wire);
new MutationObserver(muts => muts.flatMap(m=>[...m.addedNodes]).filter(n=>n.nodeType===1).forEach(n=>{
  [...n.querySelectorAll('[data-gallery] img'), ...(n.matches('[data-gallery] img')?[n]:[])].forEach(wire);
})).observe(document.body,{subtree:true,childList:true})
```

- Every `<img>` inside `[data-gallery]` in static HTML output MUST have `data-zoomable data-caption-title="..." data-caption-description="..."` attributes — NOT added via JS after render. Lazy-loads full-res from `data-full-src` attr.
- NEVER: click navigates to new page instead of lightbox; click opens empty/broken lightbox; click does nothing; only first image opens lightbox.
- Validator (`validate-lightbox-opens-on-click.mjs`): Playwright on every route, finds ALL `[data-gallery] img`, clicks each, asserts `[role="dialog"]` appears within 500ms. `build_validators.ts validateLightboxPresence` checks ≥2 HTML img elements have `data-zoomable` attribute (not just JS bundle string). Fail codes: `lightbox.not_opened` | `lightbox.empty_modal` | `lightbox.html_wiring_incomplete`.

## Every site nav/header (***SOLID BACKGROUND — NEVER TRANSPARENT — UNIVERSAL — BUILD-BREAKING***)

- Nav/header MUST have a solid, opaque background at ALL times — including homepage hero, hero-scroll overlap, mobile drawer open, any route.
- Allowed exception: hero-parallax scroll effect where header transitions transparent → solid at ≤50px scroll (MUST be SOLID by 50px — never stays transparent).
- Nav base CSS: `background-color: var(--nav-bg, var(--bg-primary)); backdrop-filter: blur(8px)` — blur adds depth but NEVER replaces a solid base. If hero uses full-bleed image behind nav area, nav MUST have an explicit solid band.
- Build gate: Playwright screenshots nav at scrollY=0 on every route — samples computed `background-color` at nav centroid — any `rgba(* * * / 0)` or `transparent` = fail. Nav text/logo must contrast nav bg by ≥4.5:1 at 6bp. Sticky nav must maintain solid bg on scroll.

## Every site nav/header (***Z-INDEX STACK + CLIP PREVENTION — UNIVERSAL — BUILD-BREAKING***)

- Nav MUST have `z-index: ≥100` and MUST NOT be clipped by hero sections, sliders (Swiper/Splide/Glide), or `overflow: hidden` parent wrappers.
- If any hero/slider sets its own stacking context (`transform`, `will-change`, `filter`, `isolation`), the nav MUST live OUTSIDE that stacking context in the DOM.
- Validator: at 6bp, Playwright samples nav `getBoundingClientRect().top` — assert nav always visible (top ≥ 0) AND nav element NOT contained inside any element with `overflow:hidden`.

## Every section (***VISUAL DISTINCTION — ALTERNATING TREATMENT — UNIVERSAL — BUILD-BREAKING***)

- Adjacent sections MUST have visually distinct treatment so users can perceive section boundaries.
- Allowed alternation strategies (pick ≥1 per boundary): (a) alternate bg `var(--bg-primary)` / `var(--bg-secondary)` / accent-tinted band; (b) geometric shape divider (wave, diagonal, angled clip-path); (c) `border-top 1px solid var(--border-subtle)`; (d) increased vertical padding creating visual breathing room.
- NEVER two consecutive sections with identical `background-color` AND no divider AND touching vertical padding.
- Validator: for each pair of sibling `<section>` elements, compute computed bg colors — if identical AND no `::before/::after` divider AND no border-top = fail.

## Every card grid (***UNIFORM IMAGE PRESENCE — UNIVERSAL — BUILD-BREAKING***)

- In any card/tile grid, ALL cards MUST have images or NONE do — never mixed.
- If ≥50% of items in corpus have images, ALL cards get images (augment missing ones via GPT Image 1.5 per-slot prompt). If <50% have images, render ALL cards without images (use icon/number/initial avatar as uniform accent).
- Validator (`validate-card-image-uniformity.mjs`): for each `[data-card-grid]`, compute `cards_with_img / total_cards` — if `> 0` and `< 1.0` = fail.

## Every lightbox (***CSS BACKGROUND-IMAGE EXCLUDED — UNIVERSAL — BUILD-BREAKING — extends "Every gallery image"***)

- CSS `background-image: url(...)` properties are NEVER lightbox-eligible — only `<img src>` and `<picture><source>` elements are eligible.
- Lightbox auto-wiring script MUST query `[data-gallery] img` (HTMLImageElement only) — NEVER walk `getComputedStyle(el).backgroundImage`.
- Validator: assert no `[data-gallery]` section has a lightbox click listener attached to a non-`<img>` DOM element.

## Every anchor-wrapped image (***LINK NAVIGATION WINS — UNIVERSAL — BUILD-BREAKING — extends "Every gallery image"***)

- Any `<img>` whose nearest ancestor is `<a href="...">` MUST navigate to the link target on click — NEVER open a lightbox.
- Lightbox handlers MUST early-return on `img.closest('a[href]')` and skip `cursor:zoom-in` marking.
- Exception ONLY: anchor itself carries `data-lightbox` or `data-gallery` (explicit opt-in). Cursor: linked images use `cursor: pointer`, not `zoom-in`.

### Lightbox eligibility check order

1. Reject in header/footer/data-no-zoom/button
2. Accept if explicit `[data-lightbox]/[data-gallery]` opt-in
3. Reject if inside `a[href]`
4. Accept if dims ≥80×80

- Validator (`validate-anchor-image-no-lightbox.mjs`): Playwright finds every `a[href] img` on `/blog`, `/news`, `/portfolio`, listing pages — clicks each, asserts URL changes (navigation) AND no `[role="dialog"]` opens within 300ms. Fail code: `lightbox.intercepts_link_navigation`.

## Every photo/image (***GROUPING LABEL + SECTION SLUG — UNIVERSAL — BUILD-BREAKING — extends "Every multi-image section"***)

- Every `data-gallery` attribute MUST have a companion `data-gallery-label` describing the photo set in 2-5 words.

```html
data-gallery="team-photos" data-gallery-label="Leadership Team"
```

- The label renders in the lightbox modal header AND as `aria-label` on the `<figure>` wrapping element.
- Every `img[data-zoomable]` in the section MUST share the section-slug as its `data-gallery` value.
- Section-slug derivation: `kebabCase(section.dataset.section || section.id || h2/h3.textContent.trim().slice(0,30))`.
- Validator: every `[data-gallery]` element in dist/ HTML must have a non-empty `data-gallery-label` attribute.

## Every image element (***DESCRIPTIVE ALT TEXT — UNIVERSAL — BUILD-BREAKING***)

- Every `<img>` must have `alt` that: (a) is non-empty; (b) does NOT equal `"image"`, `"photo"`, `"picture"`, `"img"`, or the filename; (c) describes SUBJECT matter in 5-15 words.
- Decorative images (pure CSS decoration conveying no information) use `alt=""` (intentional empty string).
- Per-slot GPT Image 1.5 prompt must include `alt_text` in the JSON response schema — auto-applied to the generated img tag.
- Validator: grep dist/ HTML for `alt=""` on non-decorative images (any img inside `[data-gallery]`, article, `section:not([data-decorative])`) = fail; grep for `alt="image"` or `alt="photo"` = fail.

## Every comparison table / data grid (***FULL-BLEED LAYOUT WHEN >1100px CONTENT — UNIVERSAL — BUILD-BREAKING — extends "Every full-width visual section"***)

- Comparison tables (pricing tiers, feature matrices, product-spec tables) and data grids with ≥4 columns OR ≥1100px natural content width MUST render full-bleed AND MUST NOT use `overflow-x: scroll` to hide right columns on desktop.
- Mobile (≤768px) reflow pattern: stack table as cards, each card showing one row with column headers as labels (`<dl>` per row OR CSS `display: contents` + grid with `grid-template-areas`).
- Validator (`validate-comparison-table-fullbleed.mjs`): for every `<table data-comparison>` AND `[data-grid][data-cols≥4]`: at 1280px assert full-bleed (width ≥ container 100vw minus scrollbar) AND no right column clipped; at 375px assert table reflows to stacked cards (no horizontal scroll).

## Every page depth > 1 (***BREADCRUMBS — UNIVERSAL — BUILD-BREAKING***)

- Every route with URL depth ≥2 (e.g. `/blog/post-slug`, `/team/jane-doe`, `/services/consulting`) MUST render a visible breadcrumb nav immediately below the page header / above the page H1 — never inside hero, never inside footer.

```html
<nav aria-label="Breadcrumb">
  <ol itemscope itemtype="https://schema.org/BreadcrumbList">…</ol>
</nav>
```

Each breadcrumb item:

```html
<li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
  <a itemprop="item" href="/"><span itemprop="name">Home</span></a>
  <meta itemprop="position" content="1"/>
</li>
```

- Final item: `<span itemprop="name">Current Page</span>` (NOT a link — current location is not clickable).
- Visual separators via CSS `::after { content: "/" }` NOT embedded in HTML.
- Breadcrumb JSON-LD `BreadcrumbList` on same page MUST match visible breadcrumb exactly (same items, order, names).
- Validator (`validate-breadcrumbs.mjs`): for every route with URL depth ≥2, assert `nav[aria-label="Breadcrumb"]` present + `[itemtype*="BreadcrumbList"]` in head JSON-LD.

## Every site (***SKIP-TO-CONTENT FIRST FOCUSABLE — UNIVERSAL — BUILD-BREAKING — WCAG 2.4.1***)

- The FIRST focusable element in every HTML page MUST be `<a href="#main-content" class="skip-link">Skip to main content</a>` (or locale-equivalent).

```css
.skip-link { position: absolute; top: -60px; left: 0; z-index: 10000; background: var(--brand-accent); color: var(--bg-primary); padding: .5rem 1.5rem; font-weight: 700; border-radius: 0 0 4px 0; transition: top .15s ease }
.skip-link:focus { top: 0 }
```

- Visible only on keyboard focus (Tab), invisible at rest.
- `<main id="main-content" tabindex="-1">` MUST exist on every page; `tabindex="-1"` allows focus to land on main without showing outline.
- Every SPA route change MUST re-move focus to h1 (or `<main>`) after navigation.
- Validator (`validate-skip-link.mjs`): Playwright tabs to first focusable element, asserts `classList.contains("skip-link")` AND visible on focus AND `href` resolves to `#main-content` AND `#main-content` element exists. Fail codes: `a11y.skip_link_missing` | `a11y.skip_link_not_first` | `a11y.skip_target_missing`.

## Every site (***BACK-TO-TOP BUTTON — UNIVERSAL — BUILD-BREAKING***)

- Every site with any page whose scrollable content exceeds two viewports MUST include:

```html
<button class="back-to-top" aria-label="Back to top">↑</button>
```

- Rendered `position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 500`.
- Hidden at `scrollY === 0`; appears with `opacity: 0→1; transform: translateY(8px)→translateY(0)` 200ms ease when `scrollY > 300`; click `window.scrollTo({ top: 0, behavior: 'smooth' })`.
- `prefers-reduced-motion: reduce` — instant scroll, no appearance animation.
- Min 44×44px hit target; min 3:1 contrast vs page bg. Bottom-right placement only.
- Validator (`validate-back-to-top.mjs`): Playwright scrolls to `scrollY=1000`, asserts button visible + `aria-label="Back to top"` + click scrolls to 0 within 1s.

## Every accordion / collapsible / "Read More" (***SMOOTH HEIGHT + ARIA STATE — UNIVERSAL — BUILD-BREAKING — extends "Every expandable card"***)

- **Collapsed** — `max-height: 0; overflow: hidden; opacity: 0`.
- **Expanded** — JS reads `panel.scrollHeight`, sets `max-height: panel.scrollHeight + 'px'; opacity: 1` with `transition: max-height .3s cubic-bezier(.4,0,.2,1), opacity .2s ease`; after `transitionend` set `max-height: none`.
- Trigger MUST have `aria-expanded="false"` (collapsed) / `aria-expanded="true"` (expanded) toggled on every click. Panel MUST have matching `aria-hidden="true"/"false"` + `role="region"` + `aria-labelledby="<trigger-id>"`.
- Keyboard: Enter/Space — toggles; Escape — collapses and returns focus to trigger.
- Animation disabled when `prefers-reduced-motion: reduce`. NEVER `display:none/block` toggle — use `aria-hidden`.
- Validator (`validate-accordion-aria.mjs`): Playwright clicks every `[aria-expanded]` button, asserts panel height grows from 0 AND `aria-expanded` toggles AND `aria-hidden` toggles AND content visible after animation.

## Every modal dialog (***FOCUS TRAP + RESTORATION — UNIVERSAL — BUILD-BREAKING — WCAG 2.4.3***)

- Every modal/dialog (`role="dialog"`, `role="alertdialog"`, lightbox, mobile menu overlay) MUST: (a) trap Tab cycle inside modal while open; (b) on open, move focus to first focusable OR `dialog.focus()`; (c) on close, return focus EXACTLY to the DOM element that triggered the open; (d) block background scroll via `document.body.style.cssText = "position:fixed;..."` pattern; (e) respond to Esc to close.
- Native `<dialog>` element preferred (use `showModal()`). Polyfill with `a11y-dialog` for custom implementations.
- Validator (`validate-modal-focus-trap.mjs`): Playwright opens each dialog/lightbox, presses Tab × 10, asserts focus stays within modal; closes via Esc, asserts focus returned to trigger. Fail codes: `a11y.focus_escapes_modal` | `a11y.focus_not_restored`.

## Every form (***ASSOCIATED LABELS + AUTOCOMPLETE + LOADING STATE — UNIVERSAL — BUILD-BREAKING***)

- Every `<input>`, `<select>`, `<textarea>` MUST: (a) have explicit `<label for="input-id">` (NEVER placeholder-only — placeholder disappears on focus, fails WCAG 1.3.1); (b) have appropriate `autocomplete` attribute: `given-name`, `family-name`, `email`, `tel`, `organization`, `street-address`, `postal-code`, `cc-number` etc.; (c) have `aria-required="true"` when required.
- Submit button MUST: show spinner + `aria-busy="true"` + `disabled` while in-flight (no double-submit); on success — replace form with success message telling user next step; on error — display inline field errors via `aria-describedby` linked to `<span role="alert">` per field, NOT just a generic toast.
- Every form gets invisible Turnstile CAPTCHA (`data-appearance="interaction-only"`).
- Validator (`validate-form-accessibility.mjs`): for every `<form>`, assert every `<input>:not([type="hidden"])` has `<label>` or `aria-label`, every field has `autocomplete` attr, submit button has loading-state implementation.

## Every `<table>` (***CAPTION + SCOPE HEADERS — UNIVERSAL — BUILD-BREAKING***)

- Every `<table>` MUST have: (a) `<caption>` as first child (visible text, NOT `aria-label` on the table); (b) column headers as `<th scope="col">` in `<thead><tr>`; (c) row headers (when present) as `<th scope="row">` in each `<tbody><tr>`; (d) complex tables with multiple header rows MUST use `id`/`headers` linking.
- Striped rows via `tbody tr:nth-child(even) { background: var(--row-alt) }`. Mobile reflow: stack as dl-cards via CSS `display: grid` with `data-label` attrs.
- Validator (`validate-table-accessibility.mjs`): grep dist/ for `<table` — assert every table has `<caption>`, every `<th>` has `scope`, no `<td>` in `<thead>`.

## Every SVG icon (***ACCESSIBLE LABELING — UNIVERSAL — BUILD-BREAKING***)

- Every `<svg>` conveying meaningful information MUST have: `role="img"` on the element; `<title id="icon-[name]-title">Descriptive text</title>` as first child; `aria-labelledby="icon-[name]-title"` on the element.
- Every decorative `<svg>` MUST have `aria-hidden="true"` AND `focusable="false"` (IE11 compat).
- Pattern: **Informative** — `<svg role="img" aria-labelledby="icon-email-title"><title id="icon-email-title">Send email</title>…</svg>`; **Decorative** — `<svg aria-hidden="true" focusable="false">…</svg>`.
- SVGs inside `<button>` or `<a>` where parent already has accessible text: always use decorative pattern.
- Validator (`validate-svg-accessibility.mjs`): for every `<svg>` NOT inside `<button>/<a>` with visible text — assert either `aria-hidden="true" focusable="false"` OR `role="img" aria-labelledby` present.

## Every site (***LATEST-TECH EXPERIENCE #1 — CONTAINER QUERIES OVER MEDIA QUERIES — UNIVERSAL — BUILD-BREAKING***)

- Component-level responsive layouts MUST use CSS Container Queries (`container-type: inline-size; @container (min-width: 640px)`) — NOT viewport media queries — for any component that can appear in multiple layout slots. Media queries reserved ONLY for global page layout.

```css
.card { container-type: inline-size; }
@container (min-width: 400px) { .card-grid { grid-template-columns: 1fr 1fr; } }
```

- Validator (`validate-container-queries.mjs`): assert `@container` rule count ≥3 in `dist/**/*.css` AND any component CSS using width-based responsive logic uses `@container` not `@media (min-width:)`. Chrome 105+, Safari 16+, Firefox 110+.

## Every site (***LATEST-TECH EXPERIENCE #2 — :has() PARENT SELECTORS REPLACE JS CLASS-TOGGLING — UNIVERSAL — BUILD-BREAKING***)

- MUST use `:has()` parent selector for state-dependent styling instead of JS class-toggling where CSS suffices.

```css
form:has(input:invalid) .submit-btn { opacity: 0.5 }
.card:has(img[data-loading="true"]) { background: skeleton-gradient }
nav:has(.menu-open) .backdrop { display: block }
```

- Validator (`validate-has-selector.mjs`): assert ≥2 `:has(` occurrences in `dist/**/*.css` AND no JS `classList.add('is-invalid'|'is-loading'|'is-open')` patterns where `:has()` could replace them. Chrome 105+, Safari 15.4+, Firefox 121+.

## Every site (***LATEST-TECH EXPERIENCE #3 — @STARTING-STYLE FOR ENTER ANIMATIONS — UNIVERSAL — BUILD-BREAKING***)

- Every component that enters the DOM (dialog opening, popover showing, list item adding, route content mounting) MUST use `@starting-style` for enter animation — NOT JS-orchestrated requestAnimationFrame double-rAF hack.

```css
dialog { opacity: 1; @starting-style { opacity: 0; } }
```

- Pair with `transition-behavior: allow-discrete` for discrete property animations (display, visibility).
- Validator (`validate-starting-style.mjs`): assert ≥2 `@starting-style` blocks in `dist/**/*.css` AND any modal/dialog/popover has paired enter transition. Chrome 117+, Safari 17.5+.

## Every site (***LATEST-TECH EXPERIENCE #4 — text-wrap: balance + pretty — UNIVERSAL — BUILD-BREAKING***)

- MUST set `text-wrap: balance` on ALL headings (h1-h6) AND `text-wrap: pretty` on ALL body paragraphs (p, li, blockquote).

```css
@layer base {
  h1,h2,h3,h4,h5,h6 { text-wrap: balance }
  p,li,blockquote { text-wrap: pretty }
}
```

- Validator (`validate-text-wrap.mjs`): assert global `text-wrap: balance` targeting headings AND `text-wrap: pretty` targeting body text in `dist/**/*.css`. Chrome 114+ (balance), 117+ (pretty); Safari 17.5+.

## Every site (***LATEST-TECH EXPERIENCE #5 — OKLCH COLOR + COLOR-MIX — UNIVERSAL — BUILD-BREAKING***)

- Color palette MUST use OKLCH (`oklch(70% 0.15 240)`) — NOT hex/RGB/HSL — for design tokens. Hover/active/disabled variants derived via `color-mix(in oklch, var(--accent) 80%, transparent)` — NOT hand-tuned hex pairs. Hex emitted only at compile time for legacy fallback via PostCSS plugin.
- Validator (`validate-oklch-colors.mjs`): assert design-token CSS file uses `oklch(` ≥10 times AND ≥3 `color-mix(in oklch,` declarations for state variants. Chrome 111+, Safari 15.4+, Firefox 113+.

## Every site (***LATEST-TECH EXPERIENCE #6 — NATIVE CSS NESTING (no Sass) — UNIVERSAL — BUILD-BREAKING***)

- Every component CSS MUST use native CSS nesting (`.card { & h2 { ... } &:hover { ... } &[data-state="loading"] { ... } }`) — NEVER ship Sass/Less/Stylus preprocessor. PostCSS only for `oklch→hex` legacy fallback + CSS minification.
- Validator (`validate-native-nesting.mjs`): assert nested CSS blocks in `dist/**/*.css` parsed by browser-native CSS parser (no Sass `$var` or `@mixin` artifacts). Chrome 112+, Safari 16.5+, Firefox 117+.
