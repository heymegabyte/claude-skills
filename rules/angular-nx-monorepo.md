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

```bash
npx create-nx-workspace@latest <repo-name> \
  --preset=angular-monorepo --appName=<first-app> \
  --style=css --bundler=esbuild --ssr=false \
  --routing=true --standalone=true \
  --e2eTestRunner=playwright --unitTestRunner=vitest \
  --packageManager=bun --nxCloud=skip
```

Existing repo + Angular added (e.g. React stays for marketing):

```bash
npx nx@latest init                  # convert to Nx workspace
npx nx add @nx/angular@latest       # add Angular plugin
npx nx g @nx/angular:application dashboard \
  --standalone --routing --style=css \
  --bundler=esbuild --e2eTestRunner=playwright
```

Apps → `apps/<name>/`. Shared libs → `libs/<scope>/<name>/` (scopes: `feature`, `ui`, `data-access`, `util`).

## Angular CLI MCP

```bash
claude mcp add --scope user --transport stdio angular-cli -- npx -y @angular/cli@latest mcp
```

Tools: `mcp__angular-cli__generate`, `mcp__angular-cli__update`, `mcp__angular-cli__list_workspaces`. Use these instead of free-hand `ng g`.

Nx-specific generators via Bash:

```bash
npx nx g @nx/angular:component <name> --project=<app> --standalone
npx nx g @nx/angular:library <name> --directory=libs/ui --standalone
```

## Required Nx plugins

- `@nx/angular` — Angular generators + executors
- `@nx/playwright` — Playwright E2E
- `@nx/vite` — Vite/Vitest runner
- `@nx/eslint` — ESLint executor
- `@nx/js` — TS libs

## Standard app skeleton

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

## Routing (typed, lazy)

```ts
export const appRoutes: Route[] = [
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: 'bookings', loadChildren: () => import('./features/bookings/bookings.routes').then(m => m.BOOKINGS_ROUTES) },
];
```

## Service (signals-first)

```ts
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
export const appConfig = {
  providers: [
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, tenantInterceptor, roleInterceptor])),
  ],
};
```

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

## Build + test (Nx canonical)

```bash
npx nx serve <app>                # dev server
npx nx build <app>                # production via esbuild
npx nx test <app>                 # Vitest units
npx nx e2e <app>-e2e              # Playwright E2E
npx nx affected --target=test     # only changed (CI speed)
npx nx affected --target=build
npx nx graph                      # dependency graph
npx nx migrate latest             # version bump
```

## Migration (existing Angular → 21 + Nx)

For Angular 17-20 standalone:

1. `npx nx@latest init` → convert to Nx workspace
2. `npx nx migrate @nx/angular@latest` → bump Nx + Angular plugins
3. `npx nx migrate --run-migrations` → apply auto-migrations
4. `npx ng update @angular/core@21 @angular/cli@21` → bump to 21
5. `npx nx affected --target=test --base=HEAD~1` to verify

NgModules projects → defer to dedicated migration wave.
