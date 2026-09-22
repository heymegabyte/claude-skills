---
description: White text in logos must always be backed by a dark or contrasting background color
triggers:
  - logo
  - branding
  - navigation
  - header
  - site-design
---

# Logo Contrast — White Text Needs Dark Backing

Logos with white or light-colored text must ALWAYS render against a dark or sufficiently contrasting background. Never place a light-text logo on a light or transparent area where it becomes illegible.

## The Rule

- **White/light text logos** → place on dark backgrounds (`#002b38`, `#0D0F10`, dark images with overlay) or apply a dark backing behind the logo.
- **Transparent PNG logos with white text** → place inside a container with a dark `background-color` or use a dark variant of the logo.
- **Nav header logos** → if the header is transparent (overlaying a slider/image), use the **dark variant** of the logo (e.g., `logo-text-color-dark.png`) or add a dark backdrop behind the logo.
- **Light-background sections** → swap to a dark-text logo variant or ensure sufficient contrast ratio (≥4.5:1).

## Canonical Implementations

### React / Vite

```tsx
// Navigation — always visible against potentially transparent header
<header style={{ background: 'rgba(0,43,56,0.5)', backdropFilter: 'blur(16px)' }}>
  <img src="/logo-text-color-dark.png" alt="Logo" style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))' }} />
</header>
```

### CSS Fallback

```css
.logo-dark-backing {
  background: rgba(0, 0, 0, 0.4);
  padding: 0.5rem;
  border-radius: 4px;
}
```

## Navbar wordmark — single-line, prominent, NEVER multi-line

A text/HTML wordmark in a navbar must render on ONE line and take up a decent, legible amount of space — a business name that wraps to two lines looks broken. This is the sibling of the contrast rule: the wordmark must be both *legible* (contrast) AND *well-laid-out* (single-line, prominent).

- **Never let the wordmark wrap.** Use `truncate` (⇒ `white-space:nowrap` + ellipsis) or `whitespace-nowrap`. An HTML text wordmark with NO nowrap wraps to 2 lines the moment the name is long. The image (PNG) wordmark can't wrap, but its HTML fallback (the common case — most sites lack a generated wordmark PNG) will.
- **Size it prominently, and fluidly.** A fixed small size (`text-sm`/`text-xl`) either looks weak or overflows a phone. Use a fluid `text-[clamp(1.125rem,4.5vw,1.5rem)]` so it's big on desktop (~24px) and shrinks single-line on mobile (~18px) — decent presence at every width.
- **Let it shrink, don't let it overflow.** The brand link/container needs `min-w-0` so the wordmark can shrink+ellipsize instead of pushing the nav wider than the viewport; keep the icon mark `shrink-0` so ONLY the text ever shrinks. Retain the full name in the DOM + the link's `aria-label` (SEO/screen-reader) even when the visible text ellipsizes.
- **Halo parity across both render paths.** If the PNG wordmark carries a `drop-shadow` halo for legibility over a transparent-nav hero, the HTML text fallback needs the same via `[text-shadow:0_1px_3px_rgba(0,0,0,0.55)]` — otherwise the fallback is illegible over a mismatched hero while the PNG isn't.
- **Contrast is often solved upstream:** where logo luminance drives theme polarity (dark logo → light theme, light logo → dark theme), the navbar is already chosen to contrast the logo — the halo then only needs to cover the transparent-over-hero state.

<!-- grow-ok -->
<!-- Growth justified: added the LARGE-mark rule + the 2026-09-12 incident (AL-392 — Ideogram banner aspect ASPECT_3_1, strip-logo-bg trim, Header sizing) — net-new enforceable content, not redundancy. -->

## Logo must be LARGE + the wordmark a TIGHT banner (not a padded square)

A contrast-clean, single-line wordmark still looks broken if it renders TINY. The mark is the brand's first impression — "present but easy to miss" fails the gorgeous bar. Two failure modes, both fixed at the source:

- **Render the mark BIG enough to see.** Size the navbar icon + wordmark to fill a real chunk of the header — icon ~48–56px (`h-12 sm:h-14`) in a ~72–80px header, wordmark ~40–48px tall (`h-10 sm:h-12`) — never a timid 40–44px afterthought. Bigger is more legible AND more premium; keep `object-contain` + the halo + `shrink-0` icon / `min-w-0` brand link so it never overflows (verify 0 nav overflow @375 + @1280).
- **A generated wordmark MUST be a tight horizontal banner (~3:1+), never a near-square padded canvas.** An AI wordmark generator asked for a squarish aspect (e.g. Ideogram `ASPECT_16_9` = 1.78:1) centers short text with heavy margins; height-constraining that in the navbar shrinks the actual text to an illegible blob. Fix at BOTH ends: (1) request a banner aspect (`ASPECT_3_1`) + a "fill the frame edge-to-edge, single line, large legible lettering" prompt; (2) in the asset pipeline, `trim()` the transparent/solid margins (fail-soft + over-trim guard) so the ink fills the image regardless of what the generator emitted. Trimmed banner + rendered tall = large, legible, gorgeous. Verify with a REAL-browser screenshot, not just that the file 200s.

## Reference Incident (2026-09-12) — automated logo too small / hard to see

projectsites.dev cafe-dim-sum-burlington shipped a 44px icon + a 71×40 wordmark: the generated `logo-wordmark.png` was a padded near-square **1312×736 (1.78:1, from Ideogram `ASPECT_16_9`)**, so the Header's `h-9` height-constraint rendered "Cafe Dim Sum" as a tiny illegible smear (0 console errors — invisible to non-visual gates). Three root fixes (AL-392): Header render bumped (icon `h-11→h-12 sm:h-14`, wordmark `h-9→h-10 sm:h-12`, header 68→80px); `strip-logo-bg.mjs` now `trim()`s the wordmark (**1312×736 → 520×150 = 3.47:1**, verified locally); `ensureWordmark` aspect **`ASPECT_16_9 → ASPECT_3_1`** + fill-frame prompt. Real-browser verified: icon 56, wordmark 166×48, 0 overflow @390/1280.

## Reference Incident (2026-07-15)

lonemountainglobal.com clone — the original WordPress site used `logo-text-color-dark.png` (white text, 374×100px) in the transparent header. The white logo was backed by dark slider images underneath. The clone initially used a smaller icon-only logo that lost the text branding.

## Reference Incident (2026-09-11) — navbar wordmark wrapped to 2 lines

projectsites.dev template `Header.tsx` — the HTML text-wordmark fallback (`<span>{business}</span>`, rendered whenever `/logo-wordmark.png` is absent, i.e. most generated sites) had no `whitespace-nowrap`, so a long business name ("Harborline Coffee Roasters Collective", 37 chars) wrapped to two ugly lines in the navbar, and unlike the PNG it carried no contrast halo. Fix: `truncate` + `clamp(1.125rem,4.5vw,1.5rem)` + `[text-shadow]` halo on the span, `min-w-0` on the brand `<Link>`, `shrink-0` on the icon. Real-browser verified: `white-space:nowrap`, `lines:1` at BOTH 375px and 1280px, no overflow. Locked by `Header.wordmark.test.ts`.

## Cross-Links

- [[text-contrast]] — companion rule for text accessibility
- [[image-quality]] — logo sizing and format guidance
- [[text-contrast]] — brand color palette
