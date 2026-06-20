---
name: "frontend-stack"
priority: 2
pack: "frontend"
triggers:
  - "frontend"
  - "react"
  - "angular"
  - "ui"
paths:
  - "stack:react-vite"
  - "stack:angular-nx"
---

# Frontend Stack

Never write hand-rolled HTML files for any user-facing surface.

## Mandate

- Every user-facing surface (marketing, web apps, dashboards, admin, generated sites, landing, microsites, blogs) MUST use ONE of two stacks:
  - **React 19 + Vite + SSR/SSG + TanStack Router + Tailwind v4** (default)
  - **Angular 21+ + Nx 20 + Ionic 8 + Capacitor 6 + PrimeNG + SSR (`@angular/ssr` on Cloudflare Workers) + Tailwind v4 + Angular CDK** (when explicitly chosen; ProjectSites.dev pinned here). RxJS-first per `rxjs-first-angular.md`.
- Hand-rolling `public/index.html` + `public/pricing.html` + `public/about.html` etc. = build fail.
- No "just one static HTML file" exceptions. Even 1-page site uses the Vite or Angular scaffold.

## React 19 + Vite + SSR (default)

### Core

- **Vite 6+** w/ React plugin
- **React 19** (with Server Components when warranted)
- **TanStack Router** for type-safe client routing
- **TanStack Start** OR **vite-plugin-ssr / vike** OR **Vite SSG (`vite-ssg`)** for SSR/SSG
  - Default: `vite-ssg` for marketing sites (prerender at build → static HTML + hydration)
  - Dashboards w/ auth: TanStack Start (server functions + SSR streaming)
- **Tailwind v4** CSS-first config in `app.css`
- **shadcn/ui** (Radix primitives) — copied in, not installed; THE React design-system foundation per `[[shadcn-design-system]]` (parallel to Spartan UI for Angular below). NO MUI/Chakra/Ant.
- **TypeScript 5.9+** strict
- **Zod** at every API + form boundary

### Build output

- `dist/client/` — static HTML + JS + CSS + per-route prerendered HTML
- `dist/server/` — SSR bundle if dynamic routes (skip for pure SSG)
- Upload to R2 marketing/ via `wrangler r2 object put` for CF-hosted sites
- OR deploy to Cloudflare Pages / Workers Sites directly

### Routing

- TanStack Router w/ file-based routes under `src/routes/`
- Layout components share header/footer (auth-aware) so marketing surface knows when signed in
- View Transitions API for nav (`document.startViewTransition`)
- Speculation Rules prerender on hover

### State + data

- TanStack Query for server state
- Zustand for client-only state (NEVER Redux for new code)
- TanStack Form for forms w/ Zod schemas

## Angular 21 + Ionic + Capacitor + Cordova (when chosen)

### Core

- **Angular 21** standalone + signals + **zoneless** (`provideZonelessChangeDetection()`, default in 21, drop Zone.js)
- **`httpResource()`** (Angular 21 stable) — declarative HTTP→signal for read-only endpoints; pair with RxJS for mutations + WS + SSE per `rxjs-first-angular.md`
- **Incremental hydration** — `provideClientHydration(withIncrementalHydration())` — viewport/interaction only
- **Nx 20+** + `@nx/angular` + Angular CLI MCP wired
- **Ionic 8+** UI (cross-platform: web, iOS, Android)
- **Capacitor 6+** for native iOS / Android; **Tauri 2** for macOS/Windows/Linux desktop
- **Cordova plugins** for native APIs not covered by Capacitor
- **`@angular/ssr` on Cloudflare Workers** — SSR at edge, same origin as API
- **Spartan UI** (shadcn-for-Angular) — ONE primary kit for ALL Angular surfaces (admin + marketing). NO PrimeNG / Material / Taiga / NG-ZORRO / Kendo.
- **Tailwind v4** + **Angular CDK** + **Floating UI**
- **RxJS-first** at every backend edge per `rxjs-first-angular.md` — observables for HTTP/WS/SSE, `toSignal()` only at template
- **TypeScript 5.9+** w/ `"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`
- **Vitest** runner (replaces Karma) via `@analogjs/vitest-angular`
- **Angular built-in i18n** (`@angular/localize`) — only strategy

### Build output

- Web: `dist/{app}/browser/` + `dist/{app}/server/`
- iOS: `npx cap sync ios` → Xcode project
- Android: `npx cap sync android` → Android Studio project

### When to pick Angular over React

- Brian's own SaaS work
- Native iOS/Android required (Capacitor)
- Signal-based reactivity load-bearing
- Enterprise tooling (Angular CLI, schematics) needed
- Brian says "Angular"

## File structure (React+Vite — canonical)

```
{project}/
├── src/
│   ├── routes/
│   │   ├── __root.tsx          # Layout: header, footer, auth-aware
│   │   ├── index.tsx           # Homepage /
│   │   ├── press.tsx           # /press
│   │   ├── pricing.tsx         # /pricing
│   │   └── ...
│   ├── components/
│   │   ├── Header.tsx          # auth-aware
│   │   ├── Footer.tsx
│   │   ├── CmdK.tsx
│   │   └── walkthrough/
│   ├── lib/
│   │   ├── auth.ts
│   │   └── api.ts
│   ├── app.css                 # Tailwind + design tokens
│   └── main.tsx                # Hydration entry
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## File structure (Angular+Ionic — canonical)

```
{project}/
├── src/app/
│   ├── pages/
│   │   ├── home/
│   │   ├── press/
│   │   └── ...
│   ├── components/
│   │   ├── header/
│   │   └── footer/
│   ├── services/
│   │   └── auth.service.ts
│   └── app.routes.ts
├── ionic.config.json
├── capacitor.config.ts
└── angular.json
```

## NEVER

- Hand-rolled `public/{page}.html` for user-facing content
- Hand-rolled `public/css/site.css` + `public/js/site.js` + 20 HTML pages
- jQuery, Vue, Svelte, SolidJS, Qwik for new projects (legacy maintenance OK)
- Next.js when Vite+SSR or Astro covers (Brian's preference — Next.js OK only when explicitly requested for ISR or middleware patterns)
- Plain vanilla JS modules in `public/js/` for new sites. Bolt.diy or generated business sites are React+Vite. Marketing surfaces are React+Vite+SSR.
- Check in `node_modules/`. Always `.gitignore`.

## ALWAYS

- React+Vite default. Angular+Ionic+Capacitor+Cordova when chosen.
- SSR or SSG for every marketing surface (build-time prerender min).
- TypeScript strict. Zod at boundaries.
- Tailwind v4 + design tokens via CSS-first config.
- TanStack (Router, Query, Form, Table) over alternatives.
- View Transitions API + Speculation Rules + `<picture>` AVIF + WebP fallback.
- Single shared layout component for auth-aware header + footer.

## Existing project audit

- Hand-rolled `public/*.html` for user-facing → refactor backlog. Don't add MORE hand-rolled HTML. Refactor to canonical stack OR mark for sunset.
- Generated business sites (`/sites/{slug}/`) shipped by ProjectSites already use Vite+React+Tailwind+shadcn — reference pattern.

## E-commerce surfaces

- E-commerce (product catalog + cart + checkout + inventory) pairs React+Vite or Angular+Ionic frontend with **Medusa.js** headless commerce backend per `ecommerce-stack.md`
- Never roll your own cart/checkout/inventory schema
- Medusa Next.js starter NOT permitted
