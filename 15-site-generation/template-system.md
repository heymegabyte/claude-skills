---
name: "template-system"
description: "Vite+React+Tailwind+shadcn/ui starter template architecture. Pre-installed in container, customized per build. Component library, routing, animation presets."
updated: "2026-04-24"
---

# Template System

Container pre-bakes `~/template/` — a production-ready Vite+React+Tailwind+shadcn/ui starter. Claude Code copies it to `~/build/`, writes context files, then customizes. Never generates from scratch.

## Template Structure
```
template/
├── index.html          — entry point, meta tags, GTM snippet placeholder
├── package.json        — deps pre-installed (react, react-router, tailwind, shadcn, lucide)
├── vite.config.ts      — build config, path aliases (@/ → src/)
├── tailwind.config.ts  — brand color slots (primary/secondary/accent), font slots, dark mode
├── tsconfig.json       — strict mode, path aliases
├── postcss.config.js   — tailwind + autoprefixer
├── src/
│   ├── main.tsx        — router setup, scroll restoration
│   ├── App.tsx         — layout shell (header+outlet+footer), route definitions
│   ├── components/
│   │   ├── ui/         — shadcn components (button, card, badge, dialog, sheet, carousel)
│   │   ├── Header.tsx  — responsive nav, mobile sheet menu, logo slot
│   │   ├── Footer.tsx  — columns layout, social links, copyright, legal links
│   │   ├── Hero.tsx    — full-width, parallax-ready, gradient overlay, CTA slots
│   │   ├── Section.tsx — reusable section wrapper with IntersectionObserver animations
│   │   └── ContactForm.tsx — Turnstile-ready, Zod validation, submission handler
│   ├── pages/          — route pages (Home, About, Services, Gallery, Contact, FAQ, Blog)
│   ├── hooks/          — useScrollAnimation, useMediaQuery, useInView
│   ├── lib/            — utils.ts (cn helper), constants.ts (brand tokens)
│   └── styles/
│       └── globals.css — @layer reset/base/components/utilities, custom properties, animations
├── public/
│   ├── robots.txt      — template (SITE_URL placeholder)
│   └── sitemap.xml     — template (SITE_URL placeholder)
└── inspect.js          — post-build checker (validates build output, checks for placeholders)
```

## Customization Points

**Brand tokens** (tailwind.config.ts): `primary→_brand.json.colors.primary` | `secondary→colors.secondary` | `accent→colors.accent` | `background→colors.background` | `foreground→colors.foreground`. Font: `heading→_brand.json.fonts.heading` | `body→fonts.body`.

**Content slots**: SITE_NAME | HERO_HEADLINE | HERO_SUBTEXT | HERO_CTA | PHONE | EMAIL | ADDRESS | HOURS | All replaced with real data from `_research.json`.

**Page generation**: Claude Code reads `_scraped_content.json` to determine page count and structure. Minimum 4 pages (Home/About/Services/Contact). Maximum 8 for complex businesses. Each page gets its own route in App.tsx.

## Animation Presets (Pre-Built)

`fade-up` — translateY(20px)→0, opacity 0→1, 600ms ease-out, IntersectionObserver triggered. `fade-in` — opacity only, 400ms. `slide-left/slide-right` — translateX(±40px)→0, 800ms. `scale-in` — scale(0.95)→1, 500ms. `stagger-children` — each child delays 100ms. All presets respect `prefers-reduced-motion`. Scroll-driven hero parallax via `animation-timeline: scroll()` with `@supports` gate.

## inspect.js (Post-Build Validator)

Runs after `npm run build`. Checks: (1) dist/ exists with index.html (2) no SITE_NAME/HERO_HEADLINE/TODO/lorem placeholders remain (3) all images referenced exist in dist/assets/ (4) no console.error/console.warn in source (5) bundle size under 500KB gzip. Exit code 1 on any failure → Claude Code sees error → fixes → rebuilds.

## shadcn/ui Components Pre-Installed

Button (variants: default/outline/ghost/link) | Card (header/content/footer) | Badge | Dialog | Sheet (mobile nav) | Carousel (testimonials/gallery) | Accordion (FAQ) | Tabs (services) | Avatar (team) | Separator | ScrollArea. All styled via CSS variables matching brand tokens.

## Dep Versions (Pinned)
react 19 | react-router 7 | tailwindcss 4 | @shadcn/ui latest | lucide-react latest | vite 6 | typescript 5.8. Container runs `bun install` during image build — deps are cached, not fetched per build.
