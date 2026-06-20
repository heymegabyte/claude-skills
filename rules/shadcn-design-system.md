---
name: "shadcn-design-system"
priority: 2
pack: "frontend"
triggers:
  - "shadcn"
  - "radix"
  - "react ui"
  - "react component"
  - "stack:react-vite"
  - "design system react"
paths:
  - "concern:public"
---

# shadcn/ui Design System

shadcn/ui (Radix primitives) is THE design-system foundation for every React surface — the default-stack parallel to `[[spartan-ui-design-system]]` (Angular). OSS, owns-the-code (components copied in via CLI, not a black-box dependency), Tailwind v4-composed. No MUI / Chakra / Ant / Mantine / other kits. Per `[[frontend-stack]]` + `[[stack-selector]]`.
Cross-links: `[[frontend-stack]]` `[[cinematic-ui-patterns]]` `[[gorgeous-by-default]]` `[[10-experience-and-design-system]]` `[[text-contrast]]`

## Standing rule

- Every React surface (marketing, dashboard, generated site) composes UI from shadcn/ui — NEVER hand-rolled buttons/inputs/dialogs or a competing kit.
- **Owns-the-code**: `npx shadcn@latest add <component>` copies source into `src/components/ui/` — edit it, version it, never `npm i` a black-box component lib.
- Radix primitives under the hood → a11y is complete by default (focus trap, ARIA, roving tabindex, keyboard) — never re-solve it.
- Tailwind v4 + CSS-var tokens compose every component; the `cn()` helper (`clsx` + `tailwind-merge`) merges classes without specificity wars.

## Setup

- `npx shadcn@latest init` → writes `components.json` (style, base color, CSS-var theming ON, `cn` alias).
- Components land in `src/components/ui/<name>.tsx`; import from `@/components/ui/*`.
- Theming: dark-first CSS vars in `globals.css` per `[[10-experience-and-design-system]]` — `--background`/`--foreground`/`--primary`/`--ring` etc.; `data-theme` + `prefers-color-scheme` toggle with `localStorage` persistence.
- Icons: `lucide-react` (the shadcn default) — never a second icon kit.

## Which components, which surface

- **Marketing/site**: `button`, `card`, `accordion` (FAQ), `dialog`/`sheet`, `tabs`, `carousel`, `badge`, `tooltip`, `navigation-menu`, `sonner` (toast).
- **Dashboard/admin**: add `table` (+ TanStack Table), `data-table`, `form` (react-hook-form + Zod resolver), `select`, `command` (⌘K palette), `dropdown-menu`, `popover`, `calendar`, `chart` (Recharts wrapper).
- **Forms**: shadcn `form` + `react-hook-form` + `@hookform/resolvers/zod` — Zod schema is the single source of truth per `[[zod-everywhere]]`.

## Composes with

- **Motion**: the React cinematic components per `[[cinematic-ui-patterns]]` (`<RollingCounter>`, `<Reveal>`) wrap shadcn primitives — every stat/section still animates.
- **Router**: TanStack Router; `command` palette wired to route actions (the mandated ⌘K per `[[always]]`).
- **Contrast**: shadcn tokens must clear `[[text-contrast]]` AA — verify the generated palette, don't trust defaults.

## Anti-patterns (build-fail)

- Installing `@shadcn/ui` as a runtime dep (it is NOT a package — it is a CLI that copies code).
- Mixing a second component kit (MUI/Chakra) into the same app.
- Editing nothing — shipping raw shadcn defaults with no brand-token theming (same "raw default widget" trap as the booking embed).
- Hand-rolling a Dialog/Combobox/Select instead of the Radix-backed shadcn one (re-introduces a11y bugs Radix already solved).

## See

- `[[spartan-ui-design-system]]` — the Angular-stack counterpart (when Angular is chosen)
- `[[frontend-stack]]` — React 19 + Vite + TanStack + Tailwind v4 defaults
- `[[website-build-manifest]]` — where this slots into the one-prompt site gates
