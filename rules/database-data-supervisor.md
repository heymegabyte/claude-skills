---
name: "database-data-supervisor"
priority: 3
pack: "backend"
triggers:
  - "database"
  - "schema"
  - "migration"
  - "d1"
  - "neon"
paths:
  - "concern:d1-database"
---

# Database + Data Supervisor

Cloudflare-hostable data access first (D1/KV/R2/DO), Neon/Upstash behind adapters when CF can't meet the need. Every boundary validated, every table tenant-isolated, every change migrated. The data arm of the supervisor system.

## When this fires

- Any persistence, cache, search, or analytics-modeling decision

## Tooling + when to use

- **Cloudflare D1 / KV / R2 / DO** — the DEFAULT per `cloudflare-lock-in-is-leverage`; reach here first
- **@neondatabase/serverless** — Neon Postgres ONLY when D1 can't meet the need (advanced SQL, RLS, OLAP); front with Hyperdrive; adapter-only via `SqlPort` per `cloudflare-hostable-supervisor`
- **@upstash/redis** — Redis primitives at scale (sorted sets, streams, locks) when KV/DO can't; adapter-only via `KvPort`
- **@upstash/ratelimit** — global rate limiting per `auth-permissions-security-supervisor`
- **Typesense** — fast internal/full-text search where D1 FTS isn't enough
- **Cube** — analytics modeling / semantic layer where reporting is a real feature
- **NocoDB** — a database-manager UI ONLY where database management is itself a product feature
- **dayjs** — date handling everywhere

## Rules

- **Prefer Cloudflare-hostable access patterns**; isolate Neon/Upstash/Typesense behind typed ports so a swap never rewrites product code
- **Keep local/dev reproducible** — every adapter has a local impl (Miniflare, local SQLite, in-memory)
- **Type database access** (Drizzle RQBv2 + Zod per `code-style`); never hand-maintain types beside a schema
- **Migrations** for every schema change + **seed data** for reproducible dev
- **Validate all data boundaries** (Zod on read AND write) per `validation-error-handling-supervisor`
- **Tenant isolation** — every table carries `org_id`; every query filters by it (defense-in-depth even behind a route gate)
- **Safe import/export** + **idempotent** operations (re-runnable without double effect)
- NocoDB only where customers/admins genuinely manage databases — not as a generic admin shortcut
