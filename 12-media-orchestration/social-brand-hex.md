---
name: "social-brand-hex"
description: "Canonical brand hex map for every social platform. Icons hover/focus/active to brand color, not generic accent. JSON map encoded for builder consumption. Footer + header + contact tiles all use this map."
updated: "2026-05-01"
---

# Social Media Brand-Hex Map (***NON-NEGOTIABLE — EVERY SOCIAL ICON***)

Every social icon link must hover to ITS brand color — not the generic accent. Generic accent on hover = AI slop. Brand-hex hover = polish. Same map applied in footer, header, contact tiles, share buttons, social proof rows.

## Canonical Hex Map (`src/data/social-brand-hex.ts`)

```ts
export const SOCIAL_BRAND_HEX: Record<string, string> = {
  facebook:  '#1877F2',
  linkedin:  '#0A66C2',
  twitter:   '#000000',  // X rebrand 2023
  x:         '#000000',
  instagram: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',  // gradient — apply via background-image + -webkit-background-clip on icon stroke
  youtube:   '#FF0000',
  tiktok:    '#000000',  // black icon, cyan/magenta accents on hover via filter shadow
  pinterest: '#BD081C',
  github:    '#181717',
  discord:   '#5865F2',
  threads:   '#000000',
  bluesky:   '#0085FF',
  mastodon:  '#6364FF',
  reddit:    '#FF4500',
  slack:     '#4A154B',
  whatsapp:  '#25D366',
  telegram:  '#26A5E4',
  snapchat:  '#FFFC00',
  twitch:    '#9146FF',
  vimeo:     '#1AB7EA',
  spotify:   '#1DB954',
  applemusic:'#FA243C',
  medium:    '#000000',
  substack:  '#FF6719',
  patreon:   '#F96854',
  email:     'var(--brand-accent)',
  phone:     'var(--brand-accent)',
  rss:       '#FFA500',
};
```

## Hover/Focus/Active CSS Pattern

Icon stays neutral (`var(--text-secondary)` or `currentColor`) by default; transitions to brand-hex on `:hover` AND `:focus` AND `:focus-visible` AND `:active`. Smooth transition via `--ease-out`.

```css
.social-link {
  color: var(--text-secondary);
  transition: color 0.2s var(--ease-out), transform 0.15s var(--ease-out);
}
.social-link:hover, .social-link:focus, .social-link:focus-visible, .social-link:active {
  color: var(--social-brand-hex);  /* set via inline style or per-platform class */
  transform: translateY(-2px);
}
.social-link:active { transform: translateY(0) scale(0.96); }
```

## TikTok / Instagram Special Cases

- **TikTok** — uses cyan+magenta accents; render the hover state as the primary black plus a `text-shadow: 2px 0 #FF0050, -2px 0 #00F2EA;` glitch effect for full brand fidelity.
- **Instagram** — is a gradient; apply via SVG `linearGradient` def on the icon path's `fill` AND use `background-image` + `-webkit-background-clip: text` on text labels.

## Per-Platform Class Generation

Build emits `.social-link--{platform}` per icon:

```html
<a class="social-link social-link--linkedin" style="--social-brand-hex: #0A66C2">
```

CSS variable indirection lets a single rule handle all platforms. Builder reads `_research.json.social[]` array, maps each to `SOCIAL_BRAND_HEX[platform]`, emits inline `--social-brand-hex` style.

## Aria-Labels (***ACCESSIBILITY***)

Every social icon link has descriptive aria-label including platform AND business name: `aria-label="Visit {BusinessName} on LinkedIn"` not just `aria-label="LinkedIn"`. Screen reader users get full context.

## Build Gate

`validate-social-brand-hex.mjs` — for every `<a>` matching `[class*="social-link--"]`, assert:

- `--social-brand-hex` CSS var resolves to a hex matching `SOCIAL_BRAND_HEX[platform]`
- Hover transition declared
- `focus-visible` state distinct from default
- `aria-label` contains both platform name AND business name

Fail build on any miss.

## Anti-Pattern (caught in lone-mountain-2)

LinkedIn + Twitter + Instagram icons all hovered to `var(--brand-accent)` (cyan) — every platform looked identical. Fix: import `SOCIAL_BRAND_HEX` from `src/data/social-brand-hex.ts`, render each icon with its own `--social-brand-hex` variable.
