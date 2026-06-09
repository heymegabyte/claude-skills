---
description: Repeatable pass upgrading an Angular admin dashboard into a compact black-and-cyan developer-cockpit PWA
argument-hint: [dashboard path or feature]
---

Upgrade an Angular admin dashboard into a polished compact **black-and-cyan dev-cockpit PWA**. Repeatable — rerun to push density + polish one step further. Doctrine via cross-link, never duplicated: [[angular-nx-monorepo]] · [[rxjs-first-angular]] · [[frontend-stack]] · [[cinematic-ui-patterns]] · [[text-contrast]] · [[agent-selection]] · [[e2e-tdd-organization]] · [[verification-loop]].

**Purpose** — turn a working Angular admin into a dense, gorgeous, fully-i18n, PWA-packaged developer cockpit with zero full page reloads.
**When to use** — any Angular dashboard that needs polish, feature-module structure, i18n, PWA, or SPA-navigation hardening; rerun each pass.
**Inputs** — `$ARGUMENTS` (dashboard path or feature); the live project; installed Angular version + package manager + build target.
**Outputs** — feature-module routes + PrimeNG cockpit UI + cyan theme tokens + ngx-translate + PWA kit + docs + destructive Playwright E2E.
**Verification** — project's real gates (`lint`/`typecheck`/`test`/`build`/`e2e`) green; full-reload detection passes; deploy + prod-E2E per [[verification-loop]].
**Can update ~/.agentskills or ~/.claude?** NO — project work only; global config only via `/self-improve`.

## Mission

- Angular 22 feature-module architecture · lazy-loaded features · **PrimeNG primary UI** · **ngx-translate** full i18n · **PWA** packaging.
- Ionic/Capacitor ONLY where they genuinely help (mobile drawer ergonomics / native shells already in repo).
- Compact black/cyan dev-cockpit styling · strong a11y + perf · destructive Playwright E2E.

## NON-NEGOTIABLE — no full page reloads inside the dashboard

- Audit + remove: `window.location.href`, raw internal `<a href>`, `location.assign`, reload-triggering forms, hard redirects, router-bypassing menu links.
- Replace with `routerLink` / `Router.navigate` / guards / resolvers / child routes / lazy feature routes.
- Shell (sidebar · topbar · command palette · theme · language · session) **persists** across every navigation — never re-mounts.

## Architecture — inspect first

- Detect installed Angular version + package manager (`pnpm`/`npm`) + build (esbuild/Vite) before writing.
- Standalone components · feature-module boundary per domain · one lazy route file per feature · strict TS · signals + RxJS per [[rxjs-first-angular]] · typed reactive forms · functional interceptors/guards · `@defer` · modern control flow (`@if`/`@for`/`@switch`) · SSR/hydration-safe.

```
src/app/
├── core/            # singletons: auth, session, theme, lang, http interceptors, guards
├── shared/          # design-system primitives, PrimeNG wrappers, pipes, a11y
└── dashboard/
    ├── dashboard-shell.component.ts   # persistent sidebar+topbar+palette
    ├── dashboard.routes.ts
    └── features/<feature>/<feature>.routes.ts + *.component.ts + *.spec.ts
```

```ts
export const dashboardRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent, // mounts ONCE, never destroyed on child nav
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      { path: 'overview', loadComponent: () => import('./features/overview/overview.component').then(m => m.OverviewComponent), data: { titleKey: 'nav.overview', icon: 'pi-gauge' } },
      { path: 'users', loadChildren: () => import('./features/users/users.routes').then(m => m.USERS_ROUTES), data: { titleKey: 'nav.users', icon: 'pi-users' } },
      { path: 'audit', loadChildren: () => import('./features/audit/audit.routes').then(m => m.AUDIT_ROUTES), data: { titleKey: 'nav.audit', icon: 'pi-list' } },
      { path: '**', loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent) }, // deep-link + refresh safe
    ],
  },
];
```

## PrimeNG — primary UI, never default-demo look

Menubar · Sidebar · Toolbar · Breadcrumb · Tabs · Panel · Card · DataTable · Tree · Splitter · Dialog · Toast · ConfirmDialog · Tooltip · Tag · Badge · Dropdown · MultiSelect · AutoComplete · DatePicker · InputSwitch · ProgressBar · Skeleton · ContextMenu · OverlayPanel — all heavily themed to the cockpit tokens below.

## Black/cyan dev-cockpit theme

Compact dense panels · terminal/devtools inspiration · sharp borders · subtle glow · no bloated whitespace. Cyan-on-black legibility per [[text-contrast]].

```css
:root {
  --app-bg: #03070a;
  --app-surface: #071014;
  --app-surface-2: #0b171d;
  --app-border: rgba(0, 229, 255, .22);
  --app-border-strong: rgba(0, 229, 255, .44);
  --app-cyan: #00e5ff;
  --app-cyan-soft: rgba(0, 229, 255, .16);
  --app-text: #e8fbff;
  --app-muted: #7aa7b3;
  --app-danger: #ff4d6d;
  --app-warning: #ffd166;
  --app-success: #4dffb5;
  --app-radius: 12px;
  --app-radius-sm: 8px;
  --app-shadow-glow: 0 0 24px rgba(0, 229, 255, .14);
}
```

## ngx-translate — zero hardcoded user-facing strings

- Translate route labels · sidebar · buttons · table headings · forms · validation · empty/error/toast.
- Shell language switcher swaps locale **without full reload** · persisted preference · fallback lang.
- Files by feature: `public/i18n/en.json` + per-feature namespaces. English fully populated + 2nd-language scaffold.

## PWA

- `manifest.webmanifest` — name · short_name · theme_color (`#03070a`) · background_color · icons + maskable.
- SW registration · offline shell fallback · **conservative** API caching (never recklessly cache private admin data) · update-available banner · install prompt · `display: standalone`.
- Refresh on nested route works · `ngsw-config.json` tuned (assets eager, admin API network-first/no-store).

## Ionic / Capacitor — decision documented

- Ionic ONLY for mobile drawer / app-shell ergonomics; Capacitor ONLY if already present OR native packaging is a real goal.
- Document the decision in `docs/dashboard-architecture.md`; no web regressions either way.

## Upgrade-at-every-step (implement highest-value, no gimmicks)

Command palette · keyboard shortcuts · breadcrumbs · density toggle · theme/lang switch · quick search · global loading bar · notification center · audit-log viewer · system-health cards · API/integration status · saved table filters · column visibility · export · confirm dialogs for risky actions · unsaved-changes guard · skeletons · empty/error states · offline + PWA-update banners.

## Full-reload detection (REQUIRED — Playwright-verified)

- Shell-level random id/counter generated once, asserted **stable** across route changes.
- `performance.getEntriesByType('navigation')` — count must not increase on internal nav.
- `beforeunload` listener installed during internal nav must NOT fire.
- Sidebar/topbar DOM-identity assertion (same element handle survives navigation).
- Playwright FAILS the run if any internal nav triggers a full reload.

## Destructive Playwright E2E (homepage-first per [[e2e-tdd-organization]])

- **Resilience** — rapid-click sidebar links · spam language switcher · navigate while form dirty · submit invalid forms · browser-back during loading · repeated viewport resize · reload on deep routes · simulated API failure / slow network.
- Assert **zero console errors** + **zero uncaught page errors** + **NO full reload** throughout.
- Plus groups: **routing** (deep-link, refresh, wildcard 404) · **i18n** (switch persists, no reload, fallback) · **PWA** (manifest, SW, offline shell, update banner) · **UI resilience** (skeletons, empty/error states).

## Docs

Create: `docs/dashboard-architecture.md` · `docs/dashboard-routing.md` · `docs/i18n.md` · `docs/pwa.md` · `docs/testing-playwright.md`.

## Final review table

| Area | Result | Notes |
|---|---|---|
| Router prevents full reloads | | |
| Shell persists across child routes | | |
| Feature routes lazy-loaded | | |
| ngx-translate integrated | | |
| PrimeNG consistent | | |
| Black/cyan UI implemented | | |
| PWA implemented | | |
| Ionic/Capacitor decision documented | | |
| Accessibility checked | | |
| Performance checked | | |
| Playwright break-tests added | | |
| Full-reload detection tested | | |

Each row PASS/FAIL.

## Verification

- Run the project's actual commands (`pnpm lint|typecheck|test|build|e2e` or `npm run …` / `playwright test`).
- Repair every failure + rerun until green. Never leave a broken cockpit.
