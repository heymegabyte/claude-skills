---
name: "spartan-ui-design-system"
priority: 2
pack: "angular"
triggers:
  - "spartan ui"
paths:
  - "stack:angular-nx"
---

# Spartan UI Design System

Spartan UI (shadcn-for-Angular) is THE complete dashboard foundation for every Angular surface. OSS, owns-the-code (components copied in, not black-boxed), Tailwind-composed, Angular CDK + Floating UI under the hood. No PrimeNG/Material/other kits. Per `stack-selector` + `angular-large-app-supervisor`.

## Design direction (ProjectSites cockpit)

- **black / cyan / white**, dark-first (`#03070a`/`#060610` canvas, `#00e5ff` accent, `#e8fbff` ink) — reuse the cockpit OKLCH tokens from `text-contrast` + `_cockpit.scss`.
- **compact**, developer-console feel · sharp typography · `tabular-nums` · icon-rich lists · strong visual hierarchy.
- **premium SaaS polish** — beautiful empty states, useful error states, clear forms, subtle `prefers-reduced-motion`-gated motion (`motion-interaction-supervisor`), fast PERCEIVED performance (skeletons + optimistic UI).
- **keyboard-first** — every action reachable by keyboard; Cmd+K palette as primary nav; `?` shortcut overlay.

## Reusable pattern library (build once, compose everywhere)

Shell: **app-shell · responsive sidebar · top command bar · breadcrumbs · command palette · global search · tenant switcher · project/site switcher · theme switcher · language switcher** (Angular i18n).
Feedback: **notification center** (Novu per `notifications-email-webhooks-supervisor`) **· toast system · modal/dialog · drawer · shortcut overlay**.
State system (the 4 states, NON-NEGOTIABLE per surface): **loading skeleton · empty state (→ first action) · error state (→ retry + correlation id) · success state**.
Data: **smart list · smart table** (TanStack Table) **· advanced grid wrapper** (AG Grid Community only for 100k+ rows) **· virtualized list** (TanStack Virtual) **· saved views/filter presets · bulk-actions toolbar**.
Media/editors: **media picker · uploader** (Uppy) **· code editor panel** (Monaco+Shiki) **· preview panel · visual editor panel** (GrapesJS) **· rich text panel** (Lexical) — per `forms-editors-content-supervisor`.
Insight: **chart cards · metric cards** (`<app-rolling-counter>` per `cinematic-ui-patterns`) **· activity timeline · audit-log viewer · health/status panel** (ECharts/Unovis per `visualization-maps-diagrams-supervisor`).

## Build rules

- Compose from the pattern library — never re-implement a shell/table/empty-state per screen.
- Spartan components are copied into `libs/ui/` and themed via Tailwind tokens (cockpit black/cyan flow straight through — no per-component hex).
- Every interactive element: `:focus-visible` cyan ring ≥3:1, 24px min target, aria semantics (Angular CDK a11y).
- Motion subtle + reduced-motion-safe; View Transitions on route nav only (shell stays static).

## Migration note (ProjectSites admin)

The admin currently has PrimeNG installed + a `CockpitPreset` + custom Tailwind sections. Migrate to Spartan **incrementally** — stand up the Spartan shell + pattern library first, convert modules onto it, then remove PrimeNG + the preset LAST (never rip the dep before Spartan replaces it, or the live admin breaks).
