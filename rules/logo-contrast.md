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

## Reference Incident (2026-07-15)
lonemountainglobal.com clone — the original WordPress site used `logo-text-color-dark.png` (white text, 374×100px) in the transparent header. The white logo was backed by dark slider images underneath. The clone initially used a smaller icon-only logo that lost the text branding.

## Cross-Links
- [[text-contrast]] — companion rule for text accessibility
- [[image-quality]] — logo sizing and format guidance
- [[text-contrast]] — brand color palette
