---
name: "motion-interaction-supervisor"
priority: 3
pack: "design"
triggers:
  - "motion"
  - "animation"
paths:
  - "*"
---

# Motion + Interaction Supervisor

Motion serves clarity and perceived speed, never spectacle. `prefers-reduced-motion` is always honored. Right tool per job. The motion arm of the supervisor system.

## When this fires

- Any UI animation, transition, carousel, drag-reorder, calendar, or tooltip

## Tooling + when to use

- **Motion** — the default for most UI animation (enter/exit, layout, micro-interactions)
- **Theatre.js** — ONLY timeline-grade, choreographed sequence animation
- **Rive** — ONLY interactive vector animation (state-machine driven)
- **lottie-web** — ONLY lightweight prebuilt animation playback
- **Embla Carousel** — ONLY where carousel UX is genuinely valuable
- **SortableJS** — ordering pages, blocks, files, menus, workflows, media (drag-reorder)
- **FullCalendar** — ONLY where scheduling/calendar functionality exists
- **Tippy.js** — tooltips/popovers where it improves ergonomics beyond Floating UI primitives

## Rules

- **Respect `prefers-reduced-motion`** on every animation — snap to final state, never hide content from reduced-motion users
- **Fast + useful** — animation budget serves perceived performance; INP ≤ 200ms per `quality-metrics`
- `transform`/`opacity` only on the hot path; `will-change` sparingly
- Don't reach for Theatre.js/Rive/lottie unless the simpler Motion default genuinely can't do it
- SortableJS for every reorder surface (keyboard-accessible drag alternative per WCAG 2.2 2.5.7)
- Lazy-load FullCalendar/Embla/Rive (`@defer`) — never in the initial bundle
