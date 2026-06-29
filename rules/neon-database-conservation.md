---
last_reviewed: 2026-06-29
superseded_by: null
name: neon-database-conservation
description: Neon Database Conservation
pack: "infra"
priority: 2
triggers:
  - "neon"
  - "postgres"
  - "database"
  - "project provisioning"
---

<!-- grow-ok -- frontmatter grew with triggers/paths during 50-idea sweep; content is essential mandate -->
# Neon Database Conservation

Neon's unit hierarchy is **organization → project → database → branch**. A single Neon **project holds ~100 databases**. So the way to host *thousands* of Postgres databases is to pack ~100 databases into each project and spin up only ~dozens of projects — NOT one project per app. The database is the cheap, abundant unit; the project is the scarce one. Conserve projects; allocate databases freely but deliberately.

Cross-links: `[[cloudflare-lock-in-is-leverage]]` `[[vendor-risk-tiering]]` `[[uuid-version-discipline]]` `[[projectsites-cloudflare-first]]`

## The rule

- **One app that needs Postgres → one DATABASE inside a SHARED project.** Never create a new Neon *project* for a single app. `CREATE DATABASE app_name;` on an existing project is the default; a new project is a deliberate exception (different org/region/isolation/billing boundary).
- **~100 databases per project is the design budget.** Plan capacity as `ceil(total_dbs / 100)` projects. Thousands of tenant/app DBs = tens of projects, each near its ~100-DB cap — not thousands of projects.
- **Name databases by app/tenant**, e.g. `projectsites_listmonk`, `projectsites_plane`, `tenant_<id>`. The name carries the owner; the project carries the capacity pool.
- **A new project is justified only by:** a hard isolation/compliance boundary, a different region for data residency (`[[data-residency-by-default]]`), separate billing/quota, or a genuinely different product. "This app wants its own Postgres" is NOT a justification — give it a database, not a project.
- **Branches are for time-travel/preview, not multi-tenancy.** Don't model tenants as branches; model them as databases (or rows). Branches are copy-on-write dev/PITR tooling.

## Reference (projectsites.dev, 2026-06-25)

- Listmonk's Postgres lives as the **database** `projectsites_listmonk` inside the **shared** existing Neon project "Listmonk" (`jolly-pine-24431114`) — one DB slot, not a new project. ✅ correct pattern.
- The next Postgres app (e.g. Plane → `projectsites_plane`) goes into the SAME project as another database, until that project nears ~100 DBs. Only then open a second project.
- See `[[listmonk-mail-subdomain-live]]` (project memory) for the deploy that established this.

## Anti-patterns

- One Neon **project** per app/tenant — burns the scarce unit; you hit the org project cap long before you'd hit any database cap.
- Provisioning a fresh project "to be safe" when a `CREATE DATABASE` on an existing project would do.
- Treating every microservice's DB as needing its own project — co-locate them as databases.
