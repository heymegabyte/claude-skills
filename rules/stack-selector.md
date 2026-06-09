---
name: "stack-selector"
priority: 2
pack: "frontend"
triggers:
  - "react or angular"
  - "what stack"
paths:
  - "*"
---

# Stack Selector

The single most expensive mistake is the wrong framework for the job. Choose deliberately, up front, by SIZE + LIFESPAN of the product — not by familiarity or novelty.

## The rule

- **React (19 + Vite + SSR/SSG)** → SMALL / SIMPLE / SHORT-FUNNEL surfaces:
  - landing pages · marketing sites · portfolios · brochure sites · lightweight apps · simple customer-facing sites · one-off campaigns
  - Optimize for: fast first paint, SEO, minimal ceremony. NEVER over-engineer these.
- **Angular (21+ + Nx + Spartan UI)** → LARGE / SERIOUS / LONG-LIVED applications:
  - SaaS dashboards · admin systems · PWAs · multi-tenant apps · workflow systems · visual builders · website factories · AI operations consoles · any serious long-lived product
  - Optimize for: feature-module architecture, strict typing, routing, testability, observability. NEVER under-engineer these.

## The litmus

Ask: *"Will this grow into a multi-surface, multi-role, long-lived application with workflows, auth tiers, and dozens of views?"*

- **Yes →** Angular large-app per `angular-large-app-supervisor`.
- **No (it's a site/funnel) →** React small per `frontend-stack`.

## Locked classifications

- **ProjectSites.dev admin dashboard** → Angular large app (dashboard + multi-tenant + builder + AI console). Spartan UI only.
- **Generated business sites / marketing surfaces** → React small (or the site-generation pipeline).

## Guardrails

- Don't reach for Angular's full apparatus on a 3-page marketing site (over-engineering).
- Don't build a 50-view admin in React-with-bolted-on-state (under-engineering).
- Angular UI = **Spartan UI ONLY** + Angular CDK + Floating UI. No PrimeNG/Material/Ionic-as-UI per `angular-nx-monorepo`.
- Angular i18n = built-in `@angular/localize`, not ngx-translate/Transloco.
