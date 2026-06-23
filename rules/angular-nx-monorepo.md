---
name: "angular-nx-monorepo"
priority: 2
pack: "angular"
triggers:
  - "angular"
  - "nx"
  - "monorepo"
paths:
  - "stack:angular-nx"
---

# Angular + Nx Monorepo

When Angular is chosen (`frontend-stack.md`), build inside **Nx monorepo running Angular 21** with **Angular CLI MCP**. Standalone components only. Signals only. No NgModules. No Angular Material. No PrimeNG default. Tailwind v4 + Angular CDK + Spartan UI.

## Canonical stack

- **Angular 21** pinned `21.x` in `package.json` + `angular.json`.
- **Nx 20+** wrapper. `nx.json` at repo root. Apps under `apps/`, libs under `libs/`.
- **Standalone components** ONLY. NgModules banned. `provideRouter` / `provideHttpClient` / `provideAnimationsAsync` in `app.config.ts`.
- **Signals** (`signal`, `computed`, `effect`, `linkedSignal`, `resource`) for state. NO RxJS subjects for component state.
- **Typed Reactive Forms** (`FormGroup<T>`, `FormControl<T>`). No template-driven forms.
- **Lazy-loaded routes** via `loadComponent` / `loadChildren`.
- **`@defer` blocks** for below-the-fold + role-conditional rendering.
- **Zoneless** — `provideZonelessChangeDetection()` (default Angular 21). Drop Zone.js. Mandatory with signals.
- **Incremental hydration** — `provideClientHydration(withIncrementalHydration())`. Hydrate on viewport/interaction.
- **`httpResource()`** (Angular 21 stable) for declarative HTTP→signal on read-only endpoints. Pair with RxJS for mutations + multi-source compose + polling per `rxjs-first-angular.md`.
- **`provideHttpClient(withFetch(), withInterceptors([...]))`** with typed interceptors (auth / tenant / role / error).
- **RxJS-first** at every backend edge — services return `Observable<T>`, signals bridge at template only via `toSignal()`. Polling floor, SSE/WS ceiling. Full: `rxjs-first-angular.md`.
- **Angular CDK** + **Floating UI** for overlays/drag-drop/virtual scroll/positioning/a11y. Wrap in design-system components.
- **Spartan UI** (shadcn-for-Angular) — ONE primary kit for admin AND marketing. NO PrimeNG / Material / Taiga / NG-ZORRO / Kendo / Syncfusion / Ionic-as-UI. Mixing kits = build fail.
- **Tailwind v4** (OxIDE). Brand tokens via CSS custom properties + OKLCH.
- **esbuild application builder** (default since 17). **SSR via `@angular/ssr` on Cloudflare Workers** behind adapter for SEO-critical + large surfaces.
- **Ionic 8** + **Capacitor 6** for MOBILE NATIVE SHELLS ONLY. **Tauri 2** for desktop.
- **Angular built-in i18n** (`@angular/localize`). NOT ngx-translate, NOT Transloco.
- **ESLint 9 + Prettier + @angular-eslint + eslint-plugin-rxjs** w/ `"strict": true` + `"noUncheckedIndexedAccess": true` + `"exactOptionalPropertyTypes": true`.
- **Vitest** via `@analogjs/vitest-angular` (Karma deprecated as of 17). **Playwright** TDD-RED first per `e2e-tdd-organization.md`.
- **MSW** for API mocks unified across dev + Storybook + Playwright.
- **Storybook 8** for component library with auto-docs + interaction tests.

## Workspace creation

- New repo: `create-nx-workspace` with `--preset=angular-monorepo`, `--bundler=esbuild`, `--e2eTestRunner=playwright`, `--unitTestRunner=vitest`, `--packageManager=bun`.
- Existing repo: `npx nx@latest init` then `npx nx add @nx/angular@latest` then generate the app with `--standalone --bundler=esbuild --e2eTestRunner=playwright`.
- Use Angular CLI MCP tools (`mcp__angular-cli__generate`) for component/service generation; fall back to `npx nx g @nx/angular:*` bash commands for Nx-specific generators.

See `reference/angular-nx-monorepo.md` for exact commands, the standard app skeleton directory tree, routing/service/interceptor code examples, full Nx build + test command reference, and migration steps.

## Required Nx plugins

- `@nx/angular` — Angular generators + executors
- `@nx/playwright` — Playwright E2E
- `@nx/vite` — Vite/Vitest runner
- `@nx/eslint` — ESLint executor
- `@nx/js` — TS libs

## Banned

- ❌ NgModules (standalone only)
- ❌ Template-driven forms
- ❌ RxJS subjects for component state (signals)
- ❌ Any UI kit other than Spartan + CDK + Floating UI
- ❌ ngx-translate / Transloco (use `@angular/localize`)
- ❌ ts-node / nodemon (Node 22 native TS + Nx executors)
- ❌ Karma + Jasmine (Vitest)
- ❌ Protractor (Playwright)
- ❌ `[ngStyle]` / `[ngClass]` for static bindings (use `class` / `style`)
- ❌ `[(ngModel)]` in Reactive-Forms context
