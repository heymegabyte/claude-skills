---
name: "spartan-ui-only"
priority: 2
pack: "angular"
triggers:
  - "spartan"
  - "angular"
paths:
  - "stack:angular-nx"
---

# Spartan UI Only for Angular

When Angular is the chosen frontend per `angular-nx-monorepo`, **Spartan UI** is
the sole primary UI component system. No PrimeNG. No Angular Material. No Taiga.
No NG-ZORRO. No Kendo. No Syncfusion. No second component library.

This rule REVERSES the prior `code-style.md` mandate of "PrimeNG for admin density

+ Spartan UI for marketing surfaces." The split was operationally costly (two design
systems, two upgrade tracks, two theme systems, double bundle weight, perpetual
inconsistency between admin and marketing surfaces). Spartan-only collapses the
maintenance surface to one.

## The mandate

+ **Spartan UI** (the shadcn-for-Angular port) is THE Angular UI component library.
+ Pair it with **Angular CDK** for low-level primitives (overlays, drag-drop, virtual
  scroll, a11y) and **Floating UI** for tooltip/popover positioning.
+ Use **Tippy.js** only where it improves tooltip/popover ergonomics over what Floating
  UI alone provides.
+ Angular's built-in **i18n** is the localization strategy; do NOT install
  `@ngx-translate/core` or `transloco` unless an existing project already runs them
  AND migration is a separate dedicated wave.

## When Angular needs something Spartan doesn't have

Compose from Angular CDK + Floating UI + Tailwind v4 tokens BEFORE reaching for
another library. If a substantial primitive is genuinely missing (e.g., a heavy
spreadsheet grid), the allowed fallbacks are:

+ **AG Grid Community** for true spreadsheet-grade admin grids only (NOT default
  for lists; use TanStack Table + Virtual for those)
+ **FullCalendar** for calendar/scheduling
+ **Embla Carousel** for carousels (rare in dashboards)
+ **PhotoSwipe** for lightboxes
+ **Apache ECharts** + **Unovis** + **@visx/visx** for charts

Each substantial addition gets a row in the project's `package-decision-matrix.md`
with install/defer/adapter-only/reject classification.

## Existing PrimeNG projects

Per `no-staging-doctrine` + `main-only-branch` + the convergence loop discipline,
projects with shipped PrimeNG do NOT rip-and-replace. They:

1. Install Spartan UI alongside PrimeNG (additive, no breakage).
2. Build new screens with Spartan from day 1.
3. Migrate one PrimeNG screen per convergence pass; the new Spartan
   version ships behind the same route + a feature flag.
4. Once parity is reached at 6 viewports + axe-clean + smoke-green, the
   flag flips to stable and the PrimeNG component is deleted.
5. Once all screens are migrated, `package.json` removes `primeng` +
   `primeicons`.

This is the same pattern as the Wave 25 React → Angular dashboard migration
documented in `brickcitylabor.com/docs/wave25-unified-dashboard.md`.
