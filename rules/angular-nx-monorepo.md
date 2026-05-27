# Angular + Nx Monorepo (***SUPREME — every Angular project, every workspace***)

Whenever Angular is the chosen frontend (per Brian's `~/.claude/CLAUDE.md` Frontend Stack rule — "explicitly says Angular" OR native iOS/Android shells OR signal-heavy enterprise), the project is built inside an **Nx monorepo running Angular 21** with the **Angular CLI MCP** wired into the toolchain. Standalone components only. Signals only. No NgModules. No Angular Material. No PrimeNG default. Tailwind v4 + Angular CDK + custom design system.

## Canonical stack
- **Angular 21** (current stable). Not 18, not 20, not "18+". Pin to `21.x` in `package.json` and `angular.json`.
- **Nx 20+** as the workspace wrapper. `nx.json` at repo root. Apps under `apps/`, libs under `libs/`.
- **Standalone components** ONLY. NgModules are banned. `provideRouter` / `provideHttpClient` / `provideAnimationsAsync` in `app.config.ts`.
- **Signals** (`signal`, `computed`, `effect`, `linkedSignal`, `resource`) for component + service state. NO RxJS subjects for component state. RxJS is acceptable for HTTP streams / WebSocket / interop only.
- **Typed Reactive Forms** (`FormGroup<T>`, `FormControl<T>`). No template-driven forms.
- **Lazy-loaded routes** via `loadComponent` / `loadChildren`. Every route lazy.
- **`@defer` blocks** for below-the-fold and role-conditional rendering.
- **Zoneless change detection** — `provideZonelessChangeDetection()` (default in Angular 21). Drop Zone.js entirely. Mandatory pairing with signals.
- **Incremental hydration** — `provideClientHydration(withIncrementalHydration())` (Angular 21 stable). Hydrate on viewport/interaction.
- **`httpResource()`** (Angular 21 stable) for declarative HTTP→signal bridges on read-only endpoints. Pair with full RxJS streams (HTTP/WS/SSE) per [[rxjs-first-angular]] for mutations, multi-source compose, polling fallback.
- **`provideHttpClient(withFetch(), withInterceptors([...]))`** with typed interceptors for auth / tenant / role / error handling.
- **RxJS-first at every backend edge** — every service returns `Observable<T>`; signals bridge only at the template via `toSignal()`. Polling is the floor; SSE/WS the ceiling. Full mandate: [[rxjs-first-angular]].
- **Angular CDK** for overlays, drag-drop, virtual scrolling, a11y primitives. Wrap in custom design-system components — don't ship raw CDK to users.
- **PrimeNG** (latest) for admin density + **Spartan UI** (shadcn-for-Angular) for marketing surfaces. NO Angular Material.
- **Tailwind v4** for styling (OxIDE engine). Brand tokens via CSS custom properties + OKLCH.
- **esbuild application builder** (Angular's default since 17). **SSR via `@angular/ssr` on Cloudflare Workers** for marketing surfaces.
- **Ionic 8** + **Capacitor 6** for mobile (iOS/Android) when the project ships native shells. **Tauri 2** for macOS/Windows/Linux desktop shells.
- **Transloco** for i18n (replaces `@ngx-translate/core` for new projects — lazy per-locale chunks, signal-native).
- **ESLint 9 + Prettier + @angular-eslint + eslint-plugin-rxjs** with `"strict": true` + `"noUncheckedIndexedAccess": true` + `"exactOptionalPropertyTypes": true`.
- **Vitest** for unit tests via `@analogjs/vitest-angular` (Karma is deprecated as of Angular 17). **Playwright** (TDD-RED first per [[e2e-tdd-organization]]) for E2E.
- **MSW (Mock Service Worker)** for API mocks unified across dev + Storybook + Playwright.
- **Storybook 8** for the component library with auto-docs + interaction tests.

## Nx workspace creation (canonical)

```bash
npx create-nx-workspace@latest <repo-name> \
  --preset=angular-monorepo \
  --appName=<first-app> \
  --style=css \
  --bundler=esbuild \
  --ssr=false \
  --routing=true \
  --standalone=true \
  --e2eTestRunner=playwright \
  --unitTestRunner=vitest \
  --packageManager=bun \
  --nxCloud=skip
```

For an **existing repo** that needs Angular added to it (e.g., the brickcitylabor.com case where React stays for marketing):

```bash
npx nx@latest init                        # converts repo to Nx workspace
npx nx add @nx/angular@latest             # adds Angular plugin
npx nx g @nx/angular:application dashboard \
  --standalone --routing --style=css \
  --bundler=esbuild --e2eTestRunner=playwright
```

Apps land under `apps/<name>/`. Shared libs under `libs/<scope>/<name>/` (use scopes like `feature`, `ui`, `data-access`, `util`).

## Angular CLI MCP integration

The **Angular CLI MCP** server (`@angular/cli@latest mcp`) is wired into Claude Code at user scope so Claude can drive `ng generate`, `ng build`, `ng test`, `ng update` deterministically:

```bash
claude mcp add --scope user --transport stdio angular-cli -- npx -y @angular/cli@latest mcp
```

Tools exposed: `mcp__angular-cli__generate`, `mcp__angular-cli__update`, `mcp__angular-cli__list_workspaces`, etc. Use these instead of free-hand shell `ng g` invocations — the MCP wrapper validates schema before exec and returns structured diffs.

For Nx-specific generators (workspace, lib, generators), invoke Nx via Bash:
```bash
npx nx g @nx/angular:component <name> --project=<app> --standalone
npx nx g @nx/angular:library <name> --directory=libs/ui --standalone
```

## Required Nx plugins
- `@nx/angular` — Angular generators + executors
- `@nx/playwright` — Playwright E2E generator
- `@nx/vite` — Vite/Vitest unit-test runner
- `@nx/eslint` — ESLint executor
- `@nx/js` — TypeScript libs

## Standard app skeleton (per Angular 21 + Nx)

```
apps/<app>/
├── src/app/
│   ├── core/                      # singletons: auth, tenant, role, http, telemetry
│   ├── shared/                    # design system primitives + layout shells
│   ├── features/<feature>/        # one dir per feature, lazy-loaded
│   │   ├── <feature>.routes.ts
│   │   ├── <feature>.component.ts
│   │   └── <feature>.spec.ts
│   ├── app.config.ts              # provideRouter, provideHttpClient, etc.
│   ├── app.routes.ts              # top-level lazy routes
│   └── app.component.ts           # root standalone
├── project.json                   # Nx target config
└── tsconfig.app.json
libs/
├── ui/                            # design-system primitives shared across apps
├── data-access/                   # HTTP services + typed clients
├── feature/<feature>/             # feature-shell libs
├── util/                          # pure helpers
```

## Routing convention (typed, lazy)

```ts
// app.routes.ts
import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'bookings',
    loadChildren: () => import('./features/bookings/bookings.routes').then(m => m.BOOKINGS_ROUTES),
  },
  // ...
];
```

## Service skeleton (signals-first)

```ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private http = inject(HttpClient);
  readonly viewAs = signal<'customer' | 'crew' | 'super_admin'>('customer');
  readonly actualRole = signal<'customer' | 'crew' | 'super_admin' | null>(null);
  readonly isSuperAdmin = computed(() => this.actualRole() === 'super_admin');
}
```

## HTTP interceptor (typed, functional)

```ts
// app.config.ts
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor, tenantInterceptor, roleInterceptor } from './core/interceptors';

export const appConfig = {
  providers: [
    provideHttpClient(withFetch(), withInterceptors([
      authInterceptor, tenantInterceptor, roleInterceptor,
    ])),
    // ...
  ],
};
```

## Banned in Angular 21 + Nx projects
- ❌ NgModules (use standalone)
- ❌ Template-driven forms (use Reactive Forms with typed FormGroup)
- ❌ RxJS subjects for component state (use signals)
- ❌ Angular Material (build the design system per [[10-experience-and-design-system]])
- ❌ PrimeNG default (only when explicitly requested for an admin-heavy product)
- ❌ ts-node / nodemon (Node 22 native TS works for tooling; use Nx executors)
- ❌ Karma + Jasmine (use Vitest)
- ❌ Protractor (use Playwright)
- ❌ Inline `[ngStyle]` / `[ngClass]` for static bindings (use `class` / `style` directly)
- ❌ Two-way binding shorthand `[(ngModel)]` in Reactive-Forms context

## Build + test commands (Nx canonical)
```bash
npx nx serve <app>                # dev server
npx nx build <app>                # production build via esbuild
npx nx test <app>                 # Vitest unit tests
npx nx e2e <app>-e2e              # Playwright E2E
npx nx affected --target=test     # only changed projects (CI speed)
npx nx affected --target=build
npx nx graph                      # dependency graph
npx nx migrate latest             # version bump (uses MCP under the hood when wired)
```

## Migration of existing Angular projects to Angular 21 + Nx

For projects already on Angular 17-20 standalone:
1. `npx nx@latest init` → convert to Nx workspace
2. `npx nx migrate @nx/angular@latest` → bump Nx + Angular plugins
3. `npx nx migrate --run-migrations` → apply auto-migrations
4. `npx ng update @angular/core@21 @angular/cli@21` → bump Angular to 21
5. Run `npx nx affected --target=test --base=HEAD~1` to verify nothing broke

For projects still on NgModules: defer to a dedicated migration wave; standalone-conversion is non-trivial and not part of every Angular-update turn.

## Reference incident (***2026-05-26 — brickcitylabor.com Wave 25***)
- User's brief said "Angular 18+" but the global Frontend Stack rule pins Angular 21. Per `[[prompt-as-training-signal]]` §3 the brief was a wrong-assumption signal — Brian corrected: *"cancel the Angular 18 and use Angular 21 and integrate the Angular MCP and also use nx"*.
- The corrected stack now lives in this rule. Project memory `project_dashboard_angular` updated accordingly.
- The Angular CLI MCP was added at user scope alongside Context7.

## See
- `~/.claude/CLAUDE.md` § Frontend Stack — the original two-stacks rule
- [[frontend-stack]] (universal rule the user-level override extends)
- [[rxjs-first-angular]] — SUPREME: every backend call is an observable, signals only at the template boundary. Polling floor + SSE/WS ceiling.
- [[10-experience-and-design-system]] — design tokens + brand colors apply to Angular apps too
- [[e2e-tdd-organization]] — Playwright TDD-RED first; Nx's `nx e2e` invokes it
- [[e2e-visual-inspection]] — random snapshots + new-section AI vision on every Angular feature
- [[context-spillover]] — touching one feature in an Nx workspace = sweep its sibling libs
- [[prompt-as-training-signal]] — the reference incident above is the gradient that birthed this rule
