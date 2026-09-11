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

## Reference Incident (2026-07-15)
lonemountainglobal.com clone — the original WordPress site used `logo-text-color-dark.png` (white text, 374×100px) in the transparent header. The white logo was backed by dark slider images underneath. The clone initially used a smaller icon-only logo that lost the text branding.

## Reference Incident (2026-09-11) — navbar wordmark wrapped to 2 lines
projectsites.dev template `Header.tsx` — the HTML text-wordmark fallback (`<span>{business}</span>`, rendered whenever `/logo-wordmark.png` is absent, i.e. most generated sites) had no `whitespace-nowrap`, so a long business name ("Harborline Coffee Roasters Collective", 37 chars) wrapped to two ugly lines in the navbar, and unlike the PNG it carried no contrast halo. Fix: `truncate` + `clamp(1.125rem,4.5vw,1.5rem)` + `[text-shadow]` halo on the span, `min-w-0` on the brand `<Link>`, `shrink-0` on the icon. Real-browser verified: `white-space:nowrap`, `lines:1` at BOTH 375px and 1280px, no overflow. Locked by `Header.wordmark.test.ts`.

## Cross-Links
- [[text-contrast]] — companion rule for text accessibility
- [[image-quality]] — logo sizing and format guidance
- [[text-contrast]] — brand color palette
