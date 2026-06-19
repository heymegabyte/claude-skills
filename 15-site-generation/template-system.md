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
│   │   ├── ContactForm.tsx — Turnstile-ready, Zod validation, submission handler
│   │   ├── local/      — 16 local business components (see below)
│   │   ├── BlogList.tsx    — paginated blog listing with category filters
│   │   ├── BlogPost.tsx    — full post with TOC, sharing, related posts
│   │   └── DonationForm.tsx — one-time/monthly toggle, Stripe integration
│   ├── hooks/
│   │   ├── useInView.ts    — IntersectionObserver hook
│   │   ├── useSEO.ts       — meta tag management
│   │   └── useServiceWorker.ts — SW registration + offline detection
│   ├── pages/          — route pages (Home, About, Services, Gallery, Contact, FAQ, Blog)
│   ├── hooks/          — useScrollAnimation, useMediaQuery, useInView
│   ├── lib/            — utils.ts (cn helper), constants.ts (brand tokens)
│   └── styles/
│       └── globals.css — @layer reset/base/components/utilities, custom properties, animations
├── public/
│   ├── robots.txt      — template (SITE_URL placeholder)
│   ├── sitemap.xml     — template (SITE_URL placeholder)
│   ├── feed.xml        — Atom RSS feed (generated during build from blog posts)
│   ├── _redirects      — Cloudflare Pages redirect rules (301s for merged/renamed URLs)
├── inspect.js          — post-build checker (validates build output, checks for placeholders)
└── validate-urls.js    — compares original sitemap URLs against new routes + _redirects, exits 1 if any 404
```

## Customization Points

### Brand tokens (`tailwind.config.ts`)

- `primary` → `_brand.json.colors.primary`
- `secondary` → `colors.secondary`
- `accent` → `colors.accent`
- `background` → `colors.background`
- `foreground` → `colors.foreground`

### Font

- `heading` → `_brand.json.fonts.heading`
- `body` → `fonts.body`

### Content slots

SITE_NAME | HERO_HEADLINE | HERO_SUBTEXT | HERO_CTA | PHONE | EMAIL | ADDRESS | HOURS — all replaced with real data from `_research.json`.

### Page generation

- Read `_scraped_content.json` to determine page count and structure.
- **Minimum 4 pages** (Home/About/Services/Contact); never reduce vs original site.
- Blog posts get individual dynamic routes (`/blog/:slug`).
- Merged thin pages get 301 redirects in `public/_redirects`.
- Each page gets its own route in `App.tsx`.

## Animation Presets (Pre-Built)

- **`fade-up`** — translateY(20px)→0, opacity 0→1, 600ms ease-out, IntersectionObserver triggered
- **`fade-in`** — opacity only, 400ms
- **`slide-left/slide-right`** — translateX(±40px)→0, 800ms
- **`scale-in`** — scale(0.95)→1, 500ms
- **`stagger-children`** — each child delays 100ms

All presets respect `prefers-reduced-motion`. Scroll-driven hero parallax via `animation-timeline: scroll()` with `@supports` gate.

### Anti-FOUC reveal gate (***UNIVERSAL — every site with IntersectionObserver reveals***)

`index.html` — FIRST line inside `<head>`, before any `<link>` or `<style>`:

```html
<script>document.documentElement.classList.add('js-reveal-active');</script>
```

`src/index.css`:

```css
html.js-reveal-active main section:not(:has(.hero-rise)),
html.js-reveal-active main [data-reveal] {
  transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity, transform;
}
html.js-reveal-active main section:not(.reveal-visible):not(.no-reveal):not(:has(.hero-rise)),
html.js-reveal-active main [data-reveal]:not(.reveal-visible) {
  opacity: 0;
  transform: translateY(24px);
}
@media (prefers-reduced-motion: reduce) {
  html.js-reveal-active main section,
  html.js-reveal-active main [data-reveal] {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
```

- `.no-reveal` opt-out for sections whose children animate themselves (e.g. `.hero-rise` stagger).
- `js-reveal-active` required so gate only activates when JS will add `.reveal-visible` — non-JS users see content normally.

## inspect.js (Post-Build Validator)

Runs after `npm run build`. Checks:

1. `dist/` exists with `index.html`
2. No `SITE_NAME`/`HERO_HEADLINE`/`TODO`/lorem placeholders remain
3. All images referenced exist in `dist/assets/`
4. No `console.error`/`console.warn` in source
5. Bundle size under 500KB gzip

Exit code 1 on any failure → Claude Code sees error → fixes → rebuilds.

## shadcn/ui Components Pre-Installed

Button (variants: default/outline/ghost/link) | Card (header/content/footer) | Badge | Dialog | Sheet (mobile nav) | Carousel (testimonials/gallery) | Accordion (FAQ) | Tabs (services) | Avatar (team) | Separator | ScrollArea.

All styled via CSS variables matching brand tokens.

## Local Business Component Patterns (***CRITICAL***)

Pre-built in `template/src/components/local/`:

### HeroWithPhoto.tsx

- Full-viewport hero with actual business photo; `assets/hero-*` fills background `object-fit:cover`.
- Dark overlay `rgba(0,0,0,0.55)`.
- Business name in brand font; tagline from `_research.json.marketing.hero_slogans[0]`.
- Twin CTAs: "Call Now" (`tel:` primary gradient) + "Get Directions" (Maps link secondary).
- Mobile: CTAs stack full-width; sticky bottom bar with phone icon persists on scroll.

### ServiceCards.tsx

- Grid from `_research.json.offerings.services[]`; each card: image (keyword-matched from `_image_profiles.json`), name, 2-sentence description, price range.
- Glassmorphism: `bg-white/5 backdrop-blur-md border-white/10`; hover: border-brand-primary + shadow-glow.
- Mobile: horizontal scroll carousel.

### TestimonialCarousel.tsx

- Google Places reviews from `_research.json.trust.reviews[]`; star rating, name, date, truncated text + "Read more on Google →".
- Auto-advances 5s, pause on hover.
- Min 3 reviews or fallback CTA "Be the first to review us →" with Google review link.

### MapEmbed.tsx

- Google Maps iframe from `_research.json.operations.geo` (lat/lng); 100% width, 400px height, `loading="lazy"`.
- Below map: formatted address (clickable → directions), hours grid (today highlighted), parking/transit info.
- Dark mode: `&style=feature:all|element:geometry|color:0x212121`.

### StickyPhoneCTA.tsx

- Mobile-only (`@media (max-width: 768px)`), fixed bottom bar, brand-primary bg, `z-index:50`.
- Hides scroll-down, shows scroll-up; hides when footer visible (IntersectionObserver).
- Min 44px touch target.

### NAPFooter.tsx

- Name/Address/Phone matching JSON-LD exactly; logo, address (Maps link), `tel:`, `mailto:`, hours (collapsible mobile), social icons.
- Schema.org LocalBusiness microdata attributes on each element; canonical NAP source of truth.

### TrustBadges.tsx

- Horizontal row: Google rating, BBB, industry certs, "Licensed & Insured" from `_research.json.trust` + `_citations.json`.
- Lazy-loaded from `assets/badges/`; placed below hero and in footer.

### ReviewCTA.tsx

- "Leave us a review!" card with Google review QR code (`assets/review-qr.svg`) + direct link.
- Star-gate: 4+ → Google, <3 → private feedback form.
- Placed on thank-you and contact pages.

### GalleryGrid.tsx

- Masonry layout of all `assets/` images; lightbox on click (Dialog); lazy-loaded, srcset.
- Caption from `_image_profiles.json.description`; min 12 images visible without scrolling on desktop.

### BeforeAfterSlider.tsx

- CSS clip-path drag comparison; props: `beforeSrc`, `afterSrc`, `labels`; touch-enabled; `prefers-reduced-motion` disables transition; no external deps.

### QuickActions.tsx

- Mobile-only 2×2 grid (`md:hidden`): Phone, MapPin, Calendar, UtensilsCrossed; min 48px targets.
- Each fires `phone_click`, `direction_click`, `booking_click` tracking.

### EmergencyBanner.tsx

- Auto-detects after-hours from `_research.json.operations.hours` vs client timezone.
- Urgent red banner: "After Hours? Call {emergencyPhone}" with `tel:` + `after_hours:true` property.

### SpeedDial.tsx

- FAB bottom-right `z-index:55`; expands to 2-4 actions (phone/email/directions/booking); mobile-only.

### LocalSchemaGenerator.tsx

Utility module. Exports:

- `generateLocalBusinessSchema(research)` → full JSON-LD with `@type`, `name`, `PostalAddress`, `telephone`, `geo`, `openingHoursSpecification`, `image`, `sameAs`, `aggregateRating`, `priceRange`, `areaServed`, `hasMenu`, `paymentAccepted`, `knowsAbout`
- `generateFAQSchema(faqs)`
- `generateBreadcrumbSchema(items)`

### BookingEmbed.tsx

- Wraps Calendly/Acuity/Square iframe OR custom form; props: `provider`, `embedUrl`, `phone`.
- `booking_click` on all interactions; responsive iframe sizing.
- Custom form: name, phone, preferred date, service dropdown, message.

### DonationForm.tsx

- One-time + monthly toggle (defaults MONTHLY); suggested amounts ($10/$25/$50/$100/$250).
- Stripe Payment Links OR external donation URL; tribute fields; cover-fees checkbox (default ON).
- Fires `donation_click` + `donation_amount`; glassmorphism card.
- Props: `stripePaymentLink`, `externalDonationUrl`, `suggestedAmounts`, `defaultRecurrence`.

### BlogList.tsx

- Paginated grid (2-col desktop, 1-col mobile); props: `posts[]` (title, slug, excerpt, date, image, author, readingTime).
- Category filter tabs if >10 posts; RSS link icon in header.

### BlogPost.tsx

- Props: `title, content, date, author, image, readingTime, relatedPosts[]`.
- TOC sidebar for posts >1500 words; Web Share API with fallback; related posts grid.
- JSON-LD BlogPosting schema; `<link rel="canonical">`; previous/next nav.

### RSSFeed

- Not a component — generated as `public/feed.xml` during build; Atom 2.0.
- `<link rel="alternate" type="application/atom+xml">` in `index.html` `<head>`.

## Citation Components (***skill 15 + rules/citations.md***)

### Citation.tsx

- Inline superscript: `<span>children<sup><a href="#refId">[N]</a></sup></span>`.
- N = auto-numbered from `_citations.json`; click → smooth-scroll + 2s highlight.
- Keyboard accessible; mandatory wrapper for any quantitative claim.

## Universal Helper Components

***SHIP IN TEMPLATE — referenced by always.md, MUST exist as code***

`always.md` mandates `<MailLink>`/`<TelLink>`/`<AddressBlock>` + universal hyperlink + lightbox capture-restore + count-up + per-route metadata + route-conditional maps + inline markdown links. None work unless template ships the implementation.

### MailLink.tsx

```tsx
export function MailLink({email, className=''}: {email:string;className?:string}) {
  return <a href={`mailto:${email}`} className={`underline-hover ${className}`}>{email}</a>;
}
```

Never hand-code `<a href="mailto:...">` ad-hoc — always import this.

### TelLink.tsx

Strips formatting to E.164 in `href`, renders formatted display text:

```tsx
const e164 = '+1' + phone.replace(/\D/g,'').replace(/^1/,'');
return <a href={`tel:${e164}`} className={`underline-hover ${className}`}>{phone}</a>;
```

Pair with optional `sms:` button per always.md.

### AddressBlock.tsx

- Bordered card with map-pin SVG; three size variants.
- Props: `lines: string[]; label?: string; mapsQuery?: string; mapsMode?: 'dir'|'search'; size?: 'sm'|'md'|'lg'`
- `mapsMode='dir'` → `https://www.google.com/maps/dir/?api=1&destination=<urlencoded>` (default for street addresses)
- `mapsMode='search'` → `https://www.google.com/maps/search/?api=1&query=<urlencoded>` (PO Boxes / no-direction-target)
- Whole tile is click target (per always.md "tile-as-link" rule); `target="_blank" rel="noopener"`.

### Lightbox.tsx (overflow-lock + viewport-fixed root + explicit scroll-restore)

Fixes both lightbox-renders-at-page-top AND close-jumps-to-top bugs.

YARL portal mount with `overflow:hidden` body lock + scrollbar-gutter compensation + forced `position:fixed; inset:0; zIndex:9999` on YARL root + capture-scrollY-at-open + `window.scrollTo(0, scrollY)` on cleanup.

**NEVER use the `body.style.position='fixed'; top=-${scrollY}` shift pattern** — YARL's portal child resolves `position:fixed` against the displaced body's containing block, causing the lightbox to render at page-top (offset by `-scrollY`) instead of the viewport.

**Pure `overflow:hidden` alone is ALSO insufficient** — some browsers (Safari iOS, some Chrome variants) lose scroll position during YARL portal mount focus management.

**Belt-and-suspenders**: capture `scrollY` at open AND explicitly call `window.scrollTo(0, scrollY)` in cleanup.

Correct pattern:

```tsx
useEffect(() => {
  if (!open) return;
  const body = document.body; const html = document.documentElement;
  const scrollY = window.scrollY || window.pageYOffset || 0;
  const scrollbarWidth = window.innerWidth - html.clientWidth;
  const original = { htmlOverflow: html.style.overflow, bodyOverflow: body.style.overflow, paddingRight: body.style.paddingRight, scrollBehavior: html.style.scrollBehavior };
  html.style.scrollBehavior = 'auto';
  html.style.overflow = 'hidden'; body.style.overflow = 'hidden';
  if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
  return () => {
    html.style.overflow = original.htmlOverflow; body.style.overflow = original.bodyOverflow;
    body.style.paddingRight = original.paddingRight;
    window.scrollTo(0, scrollY); // explicit restore — defense against any browser/React state that lost the scroll
    html.style.scrollBehavior = original.scrollBehavior;
  };
}, [open]);
// YARL props:
// portal={{ root: document.body }}
// styles={{ root: { '--yarl__color_backdrop': 'rgba(8,0,12,0.94)', position: 'fixed', inset: 0, zIndex: 9999 } }}
```

- `paddingRight = scrollbarWidth` prevents content reflow when scrollbar disappears.
- `scrollBehavior='auto'` defeats global `html { scroll-behavior: smooth }` — set BEFORE `window.scrollTo()`.
- Mount in Layout; wrap all major image groups with `[data-gallery="<id>"]` (services|gallery|team|blog hero|testimonials|before-after).
- Bundle MUST contain `data-zoomable` AND `data-gallery` strings (verified by `build_validators.ts`).
- Lightbox-eligible: `kind!=logo AND dims≥1024×768 AND quality_score≥7` — logo grids use grayscale→color hover.

**Reference fixes**: njsk.org 2026-05-01 (body-shift → overflow-lock + viewport-fixed); njsk.org 2026-05-02 (added explicit `window.scrollTo` restore).

### FullWidthMap.tsx (route-conditional, per skill 15 §Quality Bar(2))

- Used ONLY on `/contact` AND `/mass-schedule` (or equivalent location-pages).
- Full-bleed (negative margin or `100vw` width); 560px height, `loading="lazy"`, `referrerpolicy="no-referrer-when-downgrade"`.
- Below map: `<AddressBlock size="lg">` + "Get Directions →" deep link + hours grid.
- NEVER use on home/about/services — those use `<MapEmbed>` with `max-w-*` or `<StylizedMap>`.

### StylizedMap.tsx (route-conditional alternate)

- Hand-drawn SVG neighborhood/region with brand-color paths, business pin, decorative streets — no iframe.
- Used on home hero overlay, footer mini-map, section thumbnails; renders at any size, no LCP cost.

### PageHead.tsx + page-meta.ts (HARD GATE per rules/per-route-metadata.md)

Central `RouteMetadata` registry for every route. Template ships `src/data/page-meta.ts`:

```ts
import type { RouteMetadata } from '@/types/route-metadata'; // matches per-route-metadata.md interface
export const routes: Record<string, RouteMetadata> = {
  '/':            { path:'/', title:'…', description:'…', canonical:'…', themeColor:'…', applicationName:'…', appleMobileWebAppTitle:'…', og:{…}, twitter:{…}, jsonLd:[…] },
  '/about':       { … },
  '/contact':     { … },
  '/donate':      { … },
  '/blog':        { … },
};
export function meta(path: string): RouteMetadata {
  if (routes[path]) return routes[path];
  // dynamic blog routes: /blog/:slug → derive from blog post data
  if (path.startsWith('/blog/')) return buildBlogMeta(path);
  return routes['/']; // fallback (validator catches missing entries pre-deploy)
}
```

- `PageHead.tsx` subscribes to `useLocation()`, swaps `document.title` + every `<meta>` + `<link rel="canonical">` + JSON-LD `<script>` tags.
- ALSO emit static `<head>` per route during build (vite-react-ssg or per-route HTML pre-render) — client swap is fallback only.
- Validator `scripts/validate-route-metadata.mjs` greps `dist/**/*.html` for required fields + uniqueness, fails build on miss.

### CountUp.tsx

- IntersectionObserver+rAF, `threshold:0.5`, ease-out cubic; `prefers-reduced-motion` jumps to final.
- Suffix (`+`/`%`/`x`) renders OUTSIDE animated digit node (NEVER inside — `5,000+` ticking through `1,234+` looks broken).
- Reuse from skill 11 reference impl.

### renderInline.ts (markdown link parser — FAQ/blog/donate-FAQ/AddressBlock children)

```ts
export function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = []; const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0; let m: RegExpExecArray | null; let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const [, label, url] = m; const ext = /^https?:/.test(url); const tel = url.startsWith('tel:'); const mail = url.startsWith('mailto:');
    parts.push(<a key={key++} href={url} className="underline-hover" {...(ext ? { target:'_blank', rel:'noopener noreferrer' } : {})}>{label}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
```

Auto-detects `mailto:`/`tel:`/`http`/internal. Plain-text mode if no matches.

### Universal underline-hover sweep (global CSS, ships in `src/index.css`)

***EXACTLY ONE UNDERLINE PER LINK, color follows context***

Three non-negotiable structural rules:

1. Block lives at END of `index.css` OUTSIDE `@layer components` so `text-decoration: none !important` beats Tailwind utilities.
2. `::after` uses `background: currentColor` NOT a hardcoded brand var — sweep matches link's text color in any context.
3. NEVER set `color` on the auto-apply selector — let the link inherit from parent.

Canonical block:

```css
/* OUTSIDE @layer components — at end of index.css */
.underline-hover,
.blog-paragraph a, .blog-lead a, .blog-heading a, .blog-quote a, .blog-callout a,
main p a:not([class*="btn-"]):not([data-no-underline]):not(:has(img)):not(:has(svg)),
main li a:not([class*="btn-"]):not([data-no-underline]):not(:has(img)):not(:has(svg)),
main h2 > a:not([class*="btn-"]):not([data-no-underline]):not(:has(img)):not(:has(svg)),
main h3 > a:not([class*="btn-"]):not([data-no-underline]):not(:has(img)):not(:has(svg)) {
  position: relative;
  text-decoration: none !important;
  transition: color 0.2s ease, opacity 0.2s ease;
}
.underline-hover::after,
.blog-paragraph a::after, .blog-lead a::after, .blog-heading a::after, .blog-quote a::after, .blog-callout a::after,
main p a:not([class*="btn-"]):not([data-no-underline]):not(:has(img)):not(:has(svg))::after,
main li a:not([class*="btn-"]):not([data-no-underline]):not(:has(img)):not(:has(svg))::after,
main h2 > a:not([class*="btn-"]):not([data-no-underline]):not(:has(img)):not(:has(svg))::after,
main h3 > a:not([class*="btn-"]):not([data-no-underline]):not(:has(img)):not(:has(svg))::after {
  content: "";
  position: absolute; z-index: 1; pointer-events: none;
  left: 51%; right: 51%; bottom: -2px;
  background: currentColor;
  height: 1px; opacity: 0.6;
  transition: left 0.3s ease-out, right 0.3s ease-out, opacity 0.2s ease;
}
.underline-hover:hover::after, .underline-hover:focus-visible::after,
.blog-paragraph a:hover::after, .blog-paragraph a:focus-visible::after,
/* …same group for every selector above… */ {
  left: 0; right: 0; opacity: 1;
}
@media (prefers-reduced-motion: reduce) {
  .underline-hover::after, .blog-paragraph a::after /* etc */ { transition: none; }
}
```

- `:not(:has(img)):not(:has(svg))` prevents sweep under image/icon links.
- `[data-no-underline]` escape hatch for per-component opt-out.
- Hash-link scroll-margin: `[id] { scroll-margin-top: 5.5rem } @media (min-width: 640px) { [id] { scroll-margin-top: 7rem } }` in `@layer base`.

## Three-Site Review Templates

***2026-05-02 cycle — lonemountainglobal/njsk/nyfoldingbox 13-critique generalization***

Ships in `template/src/components/` and `template/src/lib/`. Each maps to a `validate-*.mjs` gate.

### BrandLogo.tsx (transparent-variant `<picture>` swap)

Renders `<BrandLogo variant="auto"|"dark"|"light" container="header"|"footer"|"hero">` in every container with potential bg-luminance mismatch.

Reads `_brand.json.logo.{transparent_dark, transparent_light, original}`, emits `<picture>` with `<source media="(prefers-color-scheme: dark)">` swap.

Build pipeline MUST emit BOTH variants — if source logo has solid `<rect>` background, run `sharp.removeAlphaBackground()` + GPT Image 2 vision-verify transparent corners.

`_brand.json.logo` schema:

```ts
interface BrandLogo {
  original_url: string;             // full horizontal/wordmark
  original_icon_url: string;        // square icon-only
  transparent_dark_url: string;     // dark-text variant for light bgs (header on cream/white)
  transparent_light_url: string;    // light-text variant for dark bgs (footer on navy)
  font_family: string;              // extracted via vision, used for nav/H1
  dominant_luminance: number;       // 0-1, drives theme polarity
}
```

### XIcon.tsx (official X brand path)

```tsx
export function XIcon({ className = "h-5 w-5", ...props }: React.SVGAttributes<SVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="X (formerly Twitter)" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}
```

Social-icon barrel `template/src/components/icons/index.ts` exports `XIcon` NOT `TwitterIcon`.

**Validator** (`validate-x-not-twitter.mjs`) greps `dist/**/*.{html,js}` for `viewBox="0 0 24 24"` paths starting `M23.643 4.937` (legacy Twitter bird) — any match=fail.

### FullBleedSection.tsx

```tsx
export function FullBleedSection({ children, className = "", ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={`relative w-screen left-1/2 right-1/2 -mx-[50vw] ${className}`}
      style={{ marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)' }}
      {...props}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">{children}</div>
    </section>
  );
}
```

- Double-mechanism (Tailwind classes + inline `style`) survives Tailwind purge AND parent `overflow-x: hidden`.
- Inner `<div class="max-w-7xl">` re-centers content; outer `<section>` bg extends edge-to-edge.

**Validator** (`validate-full-bleed-sections.mjs`): every `<section data-fullbleed>` asserts `getBoundingClientRect().width === window.innerWidth` at 6bp.

### ExpandableCard.tsx (FLIP animation, no-crop-on-expand)

CSS Grid `grid-template-rows: 0fr → 1fr` transition; `onTransitionEnd` removes `overflow:hidden` after expand.

**Critical**: NEVER leave `overflow: hidden` on expanded state — absolute-positioned children get clipped.

```tsx
const [expanded, setExpanded] = useState(false);
const [transitionDone, setTransitionDone] = useState(false);
const overflowClass = expanded && transitionDone ? 'overflow-visible' : 'overflow-hidden';

<article className={`expandable-card grid transition-[grid-template-rows] duration-500 ease-out ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
  <div className={`${overflowClass}`} onTransitionEnd={() => setTransitionDone(expanded)}>
    {children}
  </div>
</article>
```

FLIP fallback for complex layouts:

- **First** — capture `getBoundingClientRect()`
- **Last** — set state
- **Invert** — via `transform: translateY(<delta>) scale(<ratio>)`
- **Play** — via `transition: transform 500ms`

**Validator** (`validate-expandable-card-no-crop.mjs`): Playwright clicks each `[data-expandable]`, waits 600ms, asserts `scrollHeight === clientHeight` AND no absolute descendant clipped by `overflow:hidden`.

### R2AssetRewriter (build-time CDN rewrite)

```js
// Vite plugin
export function r2AssetRewriter(): Plugin {
  return {
    name: 'r2-asset-rewriter',
    enforce: 'post',
    async transform(code, id) {
      if (!/\.(tsx?|jsx?|html|css)$/.test(id)) return null;
      const cdnHosts = ['cdn.shopify.com','squarespace-cdn.com','wp.com','wixstatic.com','imgix.net'];
      const re = new RegExp(`https?://([^/]*?)(${cdnHosts.join('|')})/[^"'\\s)]+`, 'g');
      const downloads: string[] = [];
      const out = code.replace(re, (match) => {
        const localPath = `/assets/migrated/${sha256(match).slice(0,16)}.${guessExt(match)}`;
        downloads.push(`${match}|${localPath}`);
        return localPath;
      });
      if (downloads.length) await batchDownload(downloads, 'public/assets/migrated/');
      return out;
    }
  };
}
```

Build pipeline: scrape source CDN URLs → download to `public/assets/migrated/<hash>.<ext>` → rewrite references → R2 self-host under `<slug>/assets/migrated/`.

**Validator** (`validate-no-cdn-hotlinks.mjs`) greps `dist/**/*.{html,js,css}` for `cdnHosts[]` — any match=fail.

### Stripe-first DonationForm (***supersedes prior spec — Stripe-Checkout-only, no PayPal fallback***)

Every non-profit `/donate` page MUST default to Stripe Checkout primary CTA; external-platform link demoted to "Other ways to give" footer.

**Implementation** (requires Stripe Connect OAuth — skill 06 stripe-first-donations.md):

1. Non-profit connects Stripe via Standard OAuth → stores `stripe_account_id` (acct_*) on `sites.stripe_connect_account`.
2. DonationForm POSTs to `/api/sites/<id>/donate-checkout` with `{amount_cents, recurrence, donor_email?, on_behalf_of?, in_memory_of?}`.
3. Worker creates Stripe Checkout Session with `application_fee_amount = round(amount * 0.029 + 30)` and `transfer_data.destination = <stripe_account_id>`.
4. Returns Checkout URL → `window.location.href` redirect.

**GiveDirectly preset amounts**: `[10, 25, 50, 100, 250, 500]` + Custom. Defaults `recurrence: 'monthly'`. Cover-fees checkbox defaults ON. Tribute fields map to `metadata.tribute_*`.

**DonationForm props (post-three-site-review)**:

```ts
interface DonationFormProps {
  siteId: string;                                    // for /api/sites/<id>/donate-checkout
  stripeConnectAccountId: string;                    // acct_* — required, build fails if missing
  ein: string;                                       // 501(c)(3) EIN, cited inline in tax-deductibility FAQ
  orgName: string;
  defaultRecurrence?: 'monthly' | 'one-time';        // defaults 'monthly'
  suggestedAmounts?: number[];                       // defaults [10,25,50,100,250,500]
  impactTiers: Array<{amount:number; outcome:string}>;
  allocations: Array<{label:string; pct:number; refId?:string}>;
  externalDonationUrl?: string;                      // demoted to "Other ways to give" footer ONLY
  mailingAddress?: string[];                         // for mail-in checks
  majorGiftsEmail?: string;
  liveGoalEnabled?: boolean;
}
```

**Validator** (`validate-donation-stripe-first.mjs`): for every `_research.json.category === 'non-profit'`, asserts `/donate` primary CTA posts to `/api/sites/<id>/donate-checkout`; external URL MUST appear only in `<section data-donate-section="other-ways">`.

## DonationForm — Non-Profit /donate Page Spec (***EXPANDED***)

Used by nonprofits at `/donate`, churches at `/give`.

### Composed sections (top-to-bottom)

1. **Hero** — Mission headline + 1-sentence impact statement; brand-primary CTA scrolls to form.
2. **Impact tiers (4 cards)** — From `_research.json.donations.impact_tiers` (soup-kitchen defaults: `$25→5 meals`, `$100→20 meals`, `$500→100 meals`, `$1,000→200 meals`; presets in `donation-tier-presets.json` for food-pantry|disaster-relief|education|medical|environmental|animal-welfare). Each card: amount, outcome, supporting line, "Give $X →" button pre-fills form.
3. **"Where Your Money Goes" — 4-bar breakdown** — Animated horizontal bars from `_research.json.donations.allocations[]`; default soup-kitchen: program 92%, admin 5%, fundraising 3%, infrastructure 1% (pull actual from Form 990/GuideStar, cite per rules/citations.md).
4. **Donation form** — One-time + monthly toggle (DEFAULT MONTHLY); suggested amounts; custom input; Stripe Payment Links or `externalDonationUrl`; tribute fields; cover-fees checkbox (default ON, adds ~3%); fires `donation_click` + `donation_amount` + `donation_recurrence`.
5. **Live Monthly Goal widget (CONDITIONAL — env-gated)** — Render ONLY when `import.meta.env.VITE_PROJECTSITES_API` is set; shows `$X of $Y raised this month`. When env NOT set: `null` — never render empty bar showing `$0 / $0`. (Pattern from njsk.org incident 2026-04.)
6. **Donor FAQ (16 accordions)** — Required topics: tax deductibility (EIN cited), recurring vs one-time, cancel/modify recurring, in-honor/in-memory, stock gifts, crypto gifts (PO Box via `<AddressBlock mapsMode='search'>`), DAF, corporate matching, IRA QCD, planned giving/bequests, gift acknowledgement timing, receipt sender domain, donor privacy, refunds, volunteer hours match, large-gift contact (`<MailLink>`). Each ≤120 words; runs through `renderInline`; generates `FAQPage` JSON-LD.
7. **Other ways to give** — Mail-in check (`<AddressBlock mapsMode='search'>`), planned giving anchor, in-kind contact (`<MailLink>`).

### DonationForm props (full)

```ts
stripePaymentLink?:string;
externalDonationUrl?:string;
suggestedAmounts:number[];
defaultRecurrence:'monthly'|'one-time';
impactTiers:Array<{amount:number;outcome:string}>;
allocations:Array<{label:string;pct:number;refId?:string}>;
ein:string;
orgName:string;
mailingAddress:string[];
majorGiftsEmail:string;
liveGoalEnabled?:boolean; // defaults to !!import.meta.env.VITE_PROJECTSITES_API
```

## Jewel + Locale Components

***ships with every nonprofit/multi-locale template — see [[page-set-expansion]]***

Per `[[page-set-expansion]]` § Nonprofit standard+jewel set + `[[i18n-by-demographics]]` ACS-driven locale mirrors + `[[source-site-enhancement]]` union-output rebuild rule. Pre-baked in `template/src/components/jewels/` + `template/src/components/locale/`.

Validator `validate-jewel-components.mjs` confirms every jewel exists pre-build for `_research.json.category === 'non-profit'`.

### FinancialBreakdown.tsx

- 4-bar program/admin/fundraising/infrastructure horizontal chart; bars animate via `<CountUp>` on IntersectionObserver.
- Percentages cited from Form 990/GuideStar/Charity Navigator (rules/citations.md APA refId).
- Form 990 PDF download `<a href="/documents/form-990-{year}.pdf" download>` with file-size + audit date.
- Charity Navigator badge linked to `https://www.charitynavigator.org/ein/{ein}`.
- **Props**: `allocations:Array<{label:string;pct:number;refId:string}>; form990Url:string; form990Year:number; charityNavigatorRating?:1|2|3|4; ein:string`

### PlannedGivingGrid.tsx

- 5-card grid (bequest | IRA-QCD | DAF | stock | charitable-gift-annuity); each: icon + 1-sentence pitch + tax-benefit + "Learn more →" link.
- Sample bequest language `<pre><code>` with copy-button.
- Planned-giving-officer contact card (`<MailLink>` + `<TelLink>` + headshot + bio).
- **Props**: `ein:string; orgName:string; officer:{name:string;email:string;phone:string;photo:string;bio:string}`

### WaysToGiveTaxonomy.tsx

- 10-path card grid linking `/donate` | `/donate/recurring` | `/donate/major-gift` | `/planned-giving` | `/donate/in-kind` | `/donate/stock` | `/donate/crypto` | `/donate/vehicle` | `/donate/employer-match` | `/donate/tribute`.
- Groups by giving-vehicle-class (cash/securities/legacy/non-cash/match); mobile: horizontal scroll.
- **Props**: `enabledPaths:Array<{slug:string;label:string;benefit:string;icon:LucideIcon}>`

### PartnerLogoWall.tsx

- Grayscale→color-on-hover logo grid grouped by partner-type (foundations | corporate | government | community | media).
- Hover reveals relationship tooltip + outbound link + verified-since year. Logos NEVER lightboxed.
- **Props**: `partners:Array<{type:string;name:string;logo:string;url:string;relationship:string;since:number}>`

### PressMentions.tsx

- Outlet logo + headline + date + 1-paragraph paraphrase + outbound link; reverse-chronological; filter by outlet; JSON-LD `NewsArticle` array.
- **Props**: `mentions:Array<{outlet:string;outletLogo:string;headline:string;date:string;paraphrase:string;url:string}>`

### TestimonialCarousel.tsx (extended)

Existing Google-reviews spec PLUS consent-tagged guest/volunteer/donor stories:

- Filter by `<source type="guest"|"volunteer"|"donor"|"alumni"|"partner">`.
- Each story: `consent:{signed_date:string; renewable:boolean}` — un-consented stories never render.
- Photo or initial-tile + name (or "Name withheld") + role + 2-sentence quote + outcome stat with citation.
- Auto-advances 5s, pause on hover, swipe on mobile.
- **Props**: `stories:Array<{source:string;name:string;photo?:string;role:string;quote:string;outcome?:{stat:string;refId:string};consent:{signed_date:string;renewable:boolean}}>`

### TranscriptPlayer.tsx

- Paired audio/video + transcript blocks `{timestamp; speaker; text}` as scrollable side panel with click-to-seek.
- Chapters on scrubber + chapter-list; VTT + SRT downloads; search-within-transcript; speaker-color-coding.
- **Props**: `mediaUrl:string; mediaType:'audio'|'video'; chapters:Array<{title:string;start:string}>; transcript:Array<{timestamp:string;speaker:string;text:string}>; vttUrl:string; srtUrl:string`

### AlumniGrid.tsx

- Card grid: past-role at org → current-role elsewhere → "still gives back" story; filter by program/decade.
- **Props**: `alumni:Array<{name:string;photo:string;pastRole:string;currentRole:string;currentOrg:string;story:string;linkedinUrl?:string;givesBack:string}>`

### CampaignThermometer.tsx

- Animated SVG thermometer + `<CountUp>` percentage ticker + raised-as-of-date.
- Named gift opportunities table (committed rows show donor name or "Anonymous donor").
- Match-grant callout banner ("Every $1 → $2 through {matchSponsor}, expires {date}").
- Stripe Checkout embed via `<DonationForm>` pass-through with `campaignId` metadata.
- **Props**: `campaignName:string; goal:number; raised:number; asOf:string; opportunities:Array<{level:string;amount:number;naming:string;committed:boolean;donor?:string}>; match?:{sponsor:string;ratio:string;expires:string}; stripeAccountId:string; siteId:string`

### ParishToolkitDownloads.tsx

- 4-section PDF grid (bulletin inserts | donation drive guides | sermon outlines | fundraiser templates).
- Thumbnail + title + use-case + file-size + `<a download>` + view-count; filter by season.
- **Props**: `sections:Array<{type:'bulletin'|'guide'|'sermon'|'template';items:Array<{title:string;useCase:string;url:string;sizeBytes:number;thumbnail?:string;season?:string}>}>`

### LocaleSwitcher.tsx

- Dropdown with flag emoji/SVG + native language name (e.g. "Español" not "Spanish").
- Auto-detect via `Accept-Language` + `navigator.languages[]`; persist in `localStorage['locale']` + `cookie 'NEXT_LOCALE'`.
- Manual override fires `locale_change` event + reloads to `/{locale}{currentPath}`.
- **Props**: `currentLocale:string; locales:Array<{code:string;nativeName:string;flag:string;rtl?:boolean}>`

### HrefLangHead.tsx

- Emits `<link rel="alternate" hreflang>` for every locale + `x-default` per route.
- Mounted inside `<PageHead>` — static-prerender required; NOT script-injected.
- Reads `locales[]` from `_research.json.i18n.locales` (populated by `[[i18n-by-demographics]]` ACS pipeline).
- **Props**: `baseUrl:string; locales:string[]; currentPath:string`

### Component count

39 total in template:

- 16 local
- BlogList + BlogPost + DonationForm[expanded]
- Citation + ReferencesList + SourcedStat
- MailLink + TelLink + AddressBlock + Lightbox
- FullWidthMap + StylizedMap + PageHead + CountUp + renderInline-helper
- 11 jewel/locale: FinancialBreakdown + PlannedGivingGrid + WaysToGiveTaxonomy + PartnerLogoWall + PressMentions + TranscriptPlayer + AlumniGrid + CampaignThermometer + ParishToolkitDownloads + LocaleSwitcher + HrefLangHead
- TestimonialCarousel extended in place

Update tailwind safelist + index exports + `validate-route-metadata.mjs` registry + `validate-jewel-components.mjs`. Validator `scripts/validate-template-components.mjs` greps `template/src/components/` to confirm every helper exists pre-build.

## Blog Routing (React Router)

```tsx
<Route path="/blog" element={<BlogListPage />} />
<Route path="/blog/:slug" element={<BlogPostPage />} />
<Route path="/blog/:year/:slug" element={<BlogPostPage />} />
```

- Claude Code generates page components from `_scraped_content.json`.
- Date-based URLs (e.g. `/blog/2024/summer-event`) → `:year/:slug`; flat URLs → `/blog/:slug`.
- `BlogListPage` imports all posts as a static array.

## PWA & Print (***EVERY SITE***)

### PWA manifest

- `public/site.webmanifest` with business name, brand colors, icons (192+512).
- `<link rel="manifest">` in `index.html`.
- Favicon set: ico (16+32+48), apple-touch-icon (180), android-chrome (192+512).
- Meta `theme-color` matches brand primary.

### Print stylesheet

`@media print` in `index.css`:

- Hide nav/footer/sticky-cta/speed-dial.
- White bg, black text; show link URLs via `a[href]::after`; `img max-width 100%`.

### Service worker

- `public/sw.js` caches app shell + images (cache-first, max 200) + HTML (network-first); excludes analytics.
- Registered in `main.tsx` (production only); critical for rural/poor-connectivity areas.
- Verify offline: disconnect → refresh → site loads.

### Responsive images

- `<ResponsiveImage>` in `src/components/local/`.
- `<picture>` with AVIF→WebP→fallback, srcset 320/640/1280/1920w, blur placeholder, dominant color.
- Hero: `eager` prop; everything else: lazy. Built on skill 12 image-optimization.md pipeline.

### SMS deep links

- Every `tel:` link paired with `sms:` option; track as `sms_click`.
- Mobile: "Call" and "Text" buttons side by side.

## Dual-Template Architecture

- **`megabytespace/template.projectsites.dev`** — local business (this template). 19 components, CSS var brand slots, conversion tracking, PWA.
- **`megabytespace/saas-starter`** — SaaS. Hono+D1+Clerk+Stripe+Inngest+Resend on CF Workers.

Container selects from `_form_data.json.category`: local categories → `~/template-local`; SaaS categories → `~/template-saas`.

See SKILL.md "Dual-Template Architecture" for full selection logic.

## Dep Versions (Pinned)

- react 19
- react-router 7
- tailwindcss 4
- @shadcn/ui latest
- lucide-react latest
- vite 6
- typescript 5.8

Container runs `bun install` during image build — deps are cached, not fetched per build.
