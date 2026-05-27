# Frontend Stack (***SUPREME — never write hand-rolled HTML files for any user-facing surface***)

## Mandate
- Every user-facing surface (marketing sites, web apps, dashboards, admin UIs, generated business sites, landing pages, microsites, blogs) MUST be built with ONE of two stacks:
  - **React 19 + Vite + SSR/SSG + TanStack Router + Tailwind v4** (default)
  - **Angular 21+ + Nx 20 + Ionic 8 + Capacitor 6 + PrimeNG + SSR (`@angular/ssr` on Cloudflare Workers) + Tailwind v4 + Angular CDK** (when explicitly chosen; ProjectSites.dev pinned here). RxJS-first at every backend edge per [[rxjs-first-angular]].
- Hand-rolling `public/index.html` + `public/pricing.html` + `public/about.html` etc. is a build failure. Period.
- No "just one static HTML file" exceptions. Even a 1-page site uses the React+Vite or Angular+Ionic scaffold.

## Why
- Component reuse, type safety, and route-aware metadata are not optional anymore.
- SSR/SSG is mandatory for SEO + AI search visibility (per `[[always]]` and `[[cinematic-website-prime-directive]]`).
- One CSS file per page diverges, drift compounds, and accessibility regressions ship silently.
- The two stacks above cover 99% of cases; deviation requires Brian's explicit "use X this time".

## React 19 + Vite + SSR (***default for one-line website prompts***)

### Core
- **Vite 6+** with the React plugin
- **React 19** (with Server Components when warranted)
- **TanStack Router** for type-safe client routing
- **TanStack Start** OR **vite-plugin-ssr / vike** OR **Vite SSG (`vite-ssg`)** for SSR/SSG
  - Default: `vite-ssg` for marketing sites (prerender at build time → static HTML + hydration)
  - For dashboards with auth: TanStack Start (server functions + SSR streaming)
- **Tailwind v4** with CSS-first config in `app.css`
- **shadcn/ui** components (Radix UI primitives) — copied in, not installed
- **TypeScript 5.9+** strict mode
- **Zod** at every API + form boundary

### Build output
- `dist/client/` — static HTML + JS + CSS bundles, per-route prerendered HTML
- `dist/server/` — SSR bundle if dynamic routes (skip for pure SSG)
- Upload to R2 marketing/ via `wrangler r2 object put` for Cloudflare-hosted sites
- OR deploy to Cloudflare Pages / Workers Sites directly

### Routing
- TanStack Router with file-based routes under `src/routes/`
- Layout components share header/footer (auth-aware) so the marketing surface knows when a user is signed in
- View Transitions API for nav (`document.startViewTransition`)
- Speculation Rules prerender on hover

### State + data
- TanStack Query for server state
- Zustand for client-only state (NEVER Redux for new code)
- TanStack Form for forms with Zod schemas

## Angular 21 + Ionic + Capacitor + Cordova (***when explicitly chosen***)

### Core
- **Angular 21** standalone components + signals + **zoneless change detection** (`provideZonelessChangeDetection()` — default in 21, drop Zone.js entirely)
- **`httpResource()`** (Angular 21 stable) — declarative HTTP→signal bridge for read-only endpoints; pair with full RxJS streams for mutations + WS + SSE per [[rxjs-first-angular]]
- **Incremental hydration** — `provideClientHydration(withIncrementalHydration())` — hydrate on viewport/interaction only
- **Nx 20+** workspace + `@nx/angular` generators + Angular CLI MCP wired
- **Ionic 8+** UI components (cross-platform: web, iOS, Android)
- **Capacitor 6+** for native iOS / Android wrapping; **Tauri 2** alongside for macOS/Windows/Linux desktop
- **Cordova plugins** for any native API not covered by Capacitor
- **`@angular/ssr` on Cloudflare Workers** — SSR at the edge, same origin as the API
- **PrimeNG** (latest) for admin density; **Spartan UI** (shadcn-for-Angular) for marketing surfaces
- **Tailwind v4** (OxIDE engine) + **Angular CDK** for overlays/drag-drop/virtual-scroll/a11y primitives
- **RxJS-first at every backend edge** per [[rxjs-first-angular]] — observables for HTTP/WS/SSE, `toSignal()` only at the template boundary
- **TypeScript 5.9+** with `"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`
- **Vitest** as the test runner (replaces Karma) via `@analogjs/vitest-angular`
- **Transloco** for i18n (replaces `@ngx-translate/core` for new projects)

### Build output
- Web: `dist/{app}/browser/` + `dist/{app}/server/`
- iOS: `npx cap sync ios` → Xcode project
- Android: `npx cap sync android` → Android Studio project

### When to pick Angular over React
- Brian's own SaaS work
- Native iOS/Android apps required (Capacitor)
- Signal-based reactivity is load-bearing
- Enterprise tooling (Angular CLI, schematics) needed
- Brian explicitly says "Angular"

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

- Never write hand-rolled `public/{page}.html` files for user-facing content.
- Never write hand-rolled `public/css/site.css` + `public/js/site.js` + 20 HTML pages. That's the failure mode this rule exists to prevent.
- Never use jQuery, Vue, Svelte, SolidJS, or Qwik for any new project (use only if maintaining legacy).
- Never use Next.js when Vite+SSR or Astro covers the use case (Brian's preference — but Next.js is OK when explicitly requested for ISR or middleware patterns).
- Never use plain `vanilla` JS modules in `public/js/` for new sites. Bolt.diy or generated business sites are React+Vite. Marketing surfaces are React+Vite+SSR.
- Never check in `node_modules/`. Always `.gitignore`.

## ALWAYS

- React+Vite default. Angular+Ionic+Capacitor+Cordova when chosen.
- SSR or SSG for every marketing surface (build-time prerender minimum).
- TypeScript strict. Zod at boundaries.
- Tailwind v4 + design tokens via CSS-first config.
- TanStack ecosystem (Router, Query, Form, Table) over alternatives.
- View Transitions API + Speculation Rules + `<picture>` AVIF + WebP fallback.
- Single shared layout component for auth-aware header + footer.

## Existing project audit
- If you find a project with hand-rolled `public/*.html` files for user-facing pages, that's a refactor backlog item — but don't compound the problem by adding MORE hand-rolled HTML. Either refactor to the canonical stack or, if the project is being deprecated, mark it for sunset.
- Generated business sites (`/sites/{slug}/`) shipped by ProjectSites already use Vite+React+Tailwind+shadcn — that pattern is the reference.

## E-commerce surfaces
- Any e-commerce site (product catalog + cart + checkout + inventory) pairs the React+Vite or Angular+Ionic frontend with **Medusa.js** as the headless commerce backend per [[ecommerce-stack]]
- Never roll your own cart/checkout/inventory schema for an e-commerce surface
- Medusa Next.js starter NOT permitted — Next.js stays banned here too

## See
- [[always]] — Hard Gates that EVERY marketing surface must satisfy (regardless of stack)
- [[ecommerce-stack]] — Medusa.js mandate for every e-commerce backend
- [[cinematic-website-prime-directive]] — skill 16, the 100-rule one-line-prompt build
- [[code-style]] — TypeScript style + lint config
- [[brian-preferences]] — pick ONE, never options
- [[verification-loop]] — deploy + E2E mandate (same for any stack)
