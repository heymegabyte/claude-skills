---
name: "angular-large-app-supervisor"
priority: 2
pack: "angular"
triggers:
  - "angular"
paths:
  - "stack:angular-nx"
---

# Angular Large-App Supervisor

The architecture doctrine for large, long-lived Angular apps (dashboards · SaaS · admin · PWA · multi-tenant · workflow systems · website factories · AI consoles · anything that may exceed 200k LOC). Fires whenever `stack-selector` picks Angular. ProjectSites.dev admin is governed by this.

## Non-negotiable architecture

- **Angular 21+ + Nx** monorepo, standalone components, **signals**, zoneless, strict TS (`strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`). Per `angular-nx-monorepo`.
- **Angular Router** with **lazy-loaded routes** (one route file per feature) + **feature modules** (`libs/features/<slug>/`). Router scoped to a sub-view: shell (sidebar/topbar) mounts ONCE, only the content outlet swaps. **No full-page reloads on internal nav** (verify with a SPA sentinel + nav-entry count per `e2e-tdd-organization`).
- **Spartan UI ONLY** + Angular CDK + Floating UI (+ Tippy.js for tooltip ergonomics). NO PrimeNG/Material/other kits. Per `spartan-ui-design-system`.
- **Angular built-in i18n** (`@angular/localize`), never ngx-translate/Transloco.
- **RxJS-first at every backend edge** (`Observable<T>` services, `toSignal()` at template) per `rxjs-first-angular`.
- **Forms:** Angular Reactive Forms (typed) + **NGX Formly** for schema-driven forms, Zod-backed (`zod-to-json-schema`).
- **SSR / PWA readiness** where appropriate (`@angular/ssr` behind a Cloudflare adapter per `cloudflare-hostable-supervisor`); app-shell prerender + incremental hydration for authed dashboards.

## Every feature surface ships ALL of these (the DoD)

- **Types** + **Zod schema** at every boundary (`zod-everywhere` · `validation-error-handling-supervisor`)
- **Contract-first API** (typed request/response, validated both ends) (`contract-first-ai` · `hono-api`)
- **Loading · empty · error · success** states (the 4-state system — never a bare spinner or blank)
- **Accessibility** (WCAG 2.2 AA, keyboard-first, focus management) + **responsive** at 6 breakpoints
- **Observability** — telemetry on key actions, structured logs + request/trace IDs (`observability-ops-supervisor` · `auto-meta-work`)
- **Robust error handling** — structured server errors, safe user messages, recovery affordances, correlation IDs; never leak secrets/stack traces (`error-recovery`)
- **Tests** — Vitest units + Playwright E2E (homepage-first, real-auth via test key) per `e2e-tdd-organization`
- **Feature flag** where rollout risk exists (`feature-flags`) + **tenant isolation** (`auth-permissions-security-supervisor`)
- **Docs** — JSDoc on exports + a module README

## Build from reusable patterns, not one-off screens

Every screen composes from the `spartan-ui-design-system` pattern library (app-shell, smart table, 4-state system, command palette, etc.). A new screen that re-implements a shell/table/empty-state from scratch is drift.

## Supervisor execution loop (per `autonomous-engineering`)

audit → plan → ONE coherent vertical slice → implement → validate (typecheck) → test → polish UI → harden errors → docs → repeat. Favor finished vertical slices over scattered partials.
