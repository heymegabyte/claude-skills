# Angular + Nx Monorepo — implementation reference

Sourced on demand by rules/angular-nx-monorepo.md.

---

## Workspace creation commands

Fresh workspace (new repo):

```bash
npx create-nx-workspace@latest <repo-name> \
  --preset=angular-monorepo --appName=<first-app> \
  --style=css --bundler=esbuild --ssr=false \
  --routing=true --standalone=true \
  --e2eTestRunner=playwright --unitTestRunner=vitest \
  --packageManager=bun --nxCloud=skip
```

Existing repo — adding Angular alongside another framework (e.g. React stays for marketing):

```bash
npx nx@latest init                  # convert to Nx workspace
npx nx add @nx/angular@latest       # add Angular plugin
npx nx g @nx/angular:application dashboard \
  --standalone --routing --style=css \
  --bundler=esbuild --e2eTestRunner=playwright
```

Apps go under `apps/<name>/`. Shared libs under `libs/<scope>/<name>/`
(scopes: `feature`, `ui`, `data-access`, `util`).

---

## Angular CLI MCP setup

```bash
claude mcp add --scope user --transport stdio angular-cli -- npx -y @angular/cli@latest mcp
```

Tools exposed: `mcp__angular-cli__generate`, `mcp__angular-cli__update`,
`mcp__angular-cli__list_workspaces`. Prefer these over bare `ng g`.

Nx-specific generators (run via Bash when CLI MCP has no equivalent):

```bash
npx nx g @nx/angular:component <name> --project=<app> --standalone
npx nx g @nx/angular:library <name> --directory=libs/ui --standalone
```

---

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

---

## Routing (typed, lazy)

```ts
export const appRoutes: Route[] = [
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: 'bookings', loadChildren: () => import('./features/bookings/bookings.routes').then(m => m.BOOKINGS_ROUTES) },
];
```

---

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

---

## HTTP interceptor wiring (typed, functional)

```ts
export const appConfig = {
  providers: [
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, tenantInterceptor, roleInterceptor])),
  ],
};
```

---

## Build and test commands (Nx canonical)

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

---

## Migration: existing Angular → 21 + Nx

For Angular 17–20 standalone projects:

1. `npx nx@latest init` — convert to Nx workspace
2. `npx nx migrate @nx/angular@latest` — bump Nx + Angular plugins
3. `npx nx migrate --run-migrations` — apply auto-migrations
4. `npx ng update @angular/core@21 @angular/cli@21` — bump to 21
5. `npx nx affected --target=test --base=HEAD~1` — verify

NgModules projects: defer to a dedicated migration wave; do not attempt inline conversion.
