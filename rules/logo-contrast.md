# Logo + Icon Contrast (***UNIVERSAL — every overlay/tile/badge/toast***)

## Core rule
- Every logo, icon, monogram, or brand mark placed onto a UI surface MUST be paired with a background that gives WCAG-grade contrast against the mark's dominant color
- Dark mark → light tile. Light mark → dark tile.
- Never let a dark monogram float on a dark surface (becomes invisible) or a light monogram float on a light surface (vanishes into the page)
- "Transparent PNG dropped wherever" = build fail in visual-QA review

## Detect-before-place
- Extract the dominant color of the asset (Sharp `.stats()` or eyeball the PNG) BEFORE choosing the host surface
- **Maroon/black/navy/forest-green/dark-purple monogram** → needs `background: #ffffff` (or near-white) tile with a tiny inset shadow + 1-2px padding to look intentional
- **White/cream/pastel/neon monogram** → needs `background: var(--dark-brand)` (maroon-900/navy-950/black) tile, ditto padding + ring

## Tile pattern
```css
background: <opposite>;
padding: 4-8px;
border-radius: 0.5rem;
box-shadow: 0 1px 2px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(<dominant>, 0.08);
object-fit: contain;
```
- Mark NEVER becomes the same color as its container even when the host theme switches
- Padding gives the mark breathing room — bare-flush logos look cheap

## Apply across
- PWA install prompts (mobile bottom bar, desktop side-rail)
- Favicon-derived avatars in notifications
- Share-card previews
- Footer logos on dark vs light themes
- OG cards (1200×630 — never extract-on-extract; always render the full brand card on a deliberate background)
- Service-worker push notification icons
- IndexedDB-cached profile photos
- AI chat assistant badges (bot avatar on dark drawer = needs light tile or a light glyph variant)

## Theme-shift safety
- If the host surface uses `color-scheme: light dark` or `prefers-color-scheme`, the icon tile MUST be theme-independent
- Either explicit `background: white` regardless OR a CSS-prop-driven tile that flips with the theme
- Never assume "the parent is white right now, the icon is dark, so we're fine" — the parent might invert tomorrow

## Reference incident (***2026-05-21***)
- njsk.org PWA install prompt (`/Users/Apple/emdash/repositories/njsk.org/src/components/pwa-install-prompt.tsx`) used the raw `/android-chrome-192x192.png` (maroon-on-transparent) on the prompt's white background
- The mark was readable on this specific prompt but the `.pwa-install-prompt__icon` CSS had no explicit background
- Any theme inversion (dark-mode toast, contrast media query, OS-level theme) would have rendered the maroon mark on an inverted dark surface = invisible
- **Fix**: explicit `background: #ffffff; padding: 4px; box-shadow: …` on the icon tile so the white surround is a property of the icon itself, not an inherited prop of the parent
- Same fix applies to favicon-derived badges everywhere

## Validator path
- `validate-icon-contrast.mjs` — **enforcement: WARNING** (console output, does not fail build)
- Parses shipped CSS, finds every `.icon|.avatar|.badge|.logo|.brand` class that renders an `<img>`, flags any without an explicit `background:` declaration when the source asset has transparency + dominant-color outside the parent's color range
- Rationale for warning tier: theme-inversion edge cases are rare enough that catching at code-review + visual-QA (see [[image-quality]] critique loop) beats blocking deploys

## See
- [[image-quality]] (asset extraction + critique)
- [[always]] (favicon/manifest icon mandate)
- [[09-brand-and-content-system]] (real-brand extraction)
- [[copy-writing]] (anti-AI-slop applies to brand assets too — extracted logo + wrong background = AI-slop)
