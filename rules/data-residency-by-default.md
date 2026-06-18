---
name: "data-residency-by-default"
priority: 1
pack: "core"
triggers:
  - "d1"
  - "r2"
  - "durable object"
  - "jurisdiction"
  - "gdpr"
  - "eu"
  - "database create"
  - "bucket create"
  - "new database"
  - "new bucket"
  - "wrangler d1"
  - "wrangler r2"
  - "smart_placement"
  - "data residency"
  - "data sovereignty"
  - "compliance"
paths:
  - "wrangler.toml"
  - "scripts/create-*.ts"
  - "scripts/setup-*.sh"
  - "Makefile"
  - ".github/workflows/**"
---

# Data Residency / Sovereignty by Default

Every new D1 database, R2 bucket, and Durable Object namespace defaults to EU jurisdiction
unless the workload is explicitly US-only. Default EU because it is the stricter regime —
a US customer's data in EU is legally fine; an EU customer's data in a US-jurisdiction
store is a GDPR violation. The asymmetry is decisive.

This is a one-way door. Migrating data across CF jurisdictions after the fact requires
exporting, re-importing, and updating all application bindings — days of work, potential
downtime, and an active compliance incident in the interim. Establish the correct
jurisdiction at create time; pay zero cost thereafter.

## The three commands that create jurisdictional surfaces

### D1 databases

```bash
# CORRECT: EU jurisdiction by default
wrangler d1 create my-db --jurisdiction eu

# CORRECT: explicit US when workload is US-only (government, US healthcare, etc.)
wrangler d1 create my-db --jurisdiction us

# WRONG: no --jurisdiction flag (defaults to... wherever CF decides, not a documented guarantee)
wrangler d1 create my-db
```

### R2 buckets

```bash
# CORRECT: EU jurisdiction by default
wrangler r2 bucket create my-bucket --jurisdiction eu

# WRONG: no --jurisdiction flag
wrangler r2 bucket create my-bucket
```

### Durable Objects

DO namespaces do not have a `--jurisdiction` CLI flag — their data residency is determined
by the Worker's location. For jurisdiction-sensitive DOs, use `smart_placement` override
in `wrangler.toml`:

```toml
[placement]
mode = "off"  # pin to a specific region rather than auto-placement

[[durable_objects.bindings]]
name = "MY_DO"
class_name = "MyDurableObject"
# jurisdiction handled by placement mode above
```

When `smart_placement.mode = "off"`, the DO activates in the region of the Worker that
created it. Deploy the Worker to a EU region to ensure EU data residency for DOs.

## wrangler.toml jurisdiction documentation

Document the jurisdiction decision in `wrangler.toml` as a comment alongside the binding:

```toml
# [[d1_databases]] — EU jurisdiction (set at create time, not changeable without migration)
# Rationale: default EU — stricter than US; safe for all customer locales
[[d1_databases]]
binding = "DB"
database_name = "my-app-prod"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# R2 — EU jurisdiction
# Rationale: user file uploads may contain PII; EU is the compliant default
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "my-app-files"
jurisdiction = "eu"
```

The comment makes the jurisdiction decision visible to future editors without requiring
them to run `wrangler d1 info` to check.

## When US is correct

US jurisdiction is appropriate when:
- All users are explicitly US-based and the product is US-only by design
- The workload is subject to US government data requirements (FedRAMP, ITAR, CMMC)
- The product is a US healthcare product subject to HIPAA (US datacenter agreements)
- A US-only third-party integration requires co-location

In all these cases: document the rationale in the same `wrangler.toml` comment.

## The approval-required gate

Jurisdiction selection is `approval-required` per `[[autonomous-engineering]]` — it is a
one-way door that cannot be undone without a migration. Never select jurisdiction autonomously
on behalf of a new project without Brian's explicit intent. Surface the choice at project
scaffold time:

```
Scaffolding new D1 database. Jurisdiction defaults to EU per data-residency-by-default rule.
Confirm EU or specify US (required for US-only / HIPAA / government workloads).
```

If the project's target market is already known to be US-only, proceed with US and document.
Otherwise, default EU and proceed — the question is answered.

## GDPR minimum compliance checklist

Jurisdiction is necessary but not sufficient for GDPR compliance. Every project storing
EU user data also needs:

- [ ] **Data Processing Agreement (DPA)** with Cloudflare (CF's standard DPA applies for
  paid plans; verify at `dash.cloudflare.com` → Account → Privacy)
- [ ] **Data deletion API** — `DELETE /api/users/:id` that cascades to D1 + R2 + KV + DOs
- [ ] **Data export API** — `GET /api/users/:id/export` returning all stored PII as JSON
- [ ] **Consent signal** — any analytics (PostHog) requires consent or legitimate interest
  basis documented in a privacy policy
- [ ] **Breach notification plan** — documented in `ARCHITECTURE.md` (72-hour GDPR window)
- [ ] **Retention policy** — D1 rows with PII have a `deleted_at` soft-delete + hard-delete
  cron after 30 days of `deleted_at`

These are per-project additions, not per-table. Add at project scaffold time, not when the
DPA audit request arrives.

## Data classification by storage type

| CF primitive | Contains PII? | Jurisdiction | Retention |
|---|---|---|---|
| D1 `users` table | Yes | EU | `deleted_at` + 30d cron delete |
| D1 `events` table | Maybe (IP, user_id) | EU | 90d auto-purge |
| D1 `feature_flags` table | No | EU (default) | Indefinite |
| R2 user uploads | Yes | EU | Delete on account delete |
| R2 build artifacts | No | EU (default) | 7d TTL per lifecycle rule |
| KV session cache | Yes (JWT payload) | N/A (KV inherits Worker region) | TTL ≤ 24h |
| KV feature flag cache | No | N/A | TTL 60s |
| DO user sessions | Yes | EU via `placement.mode = "off"` | Hibernate on logout |

## The migration cost reminder (why default EU)

Migrating a D1 database from US to EU jurisdiction:

```
1. wrangler d1 export --local my-db-us > backup.sql      # ~minutes for small DBs
2. wrangler d1 create my-db-eu --jurisdiction eu          # new DB ID
3. wrangler d1 execute my-db-eu --file backup.sql         # re-import
4. Update wrangler.toml database_id                       # redeploy required
5. Update all CI secrets (DATABASE_ID env var)            # N pipelines
6. Validate D1 bindings in Worker                         # test + E2E
7. Delete old DB after validation                         # can't undo
```

This is 4-8 hours of work, a production redeploy, and an active period where the old DB
exists alongside the new one. A 3-second `--jurisdiction eu` flag at create time costs nothing.

## Anti-patterns

- `wrangler d1 create my-db` with no jurisdiction flag — opaque residency
- "We'll handle GDPR when we get EU users" — EU users arrive before you notice
- Storing session JWTs in D1 without a TTL — indefinite PII retention
- One D1 DB for all projects (saves `--jurisdiction` confusion by removing the choice —
  but also makes per-project delete and audit impossible)
- Assuming CF automatically gives GDPR compliance — jurisdiction is necessary, not sufficient
- Skipping the deletion API because "it's a solo project" — GDPR applies regardless of team size

## Cross-links

- `[[one-way-two-way-doors]]` — jurisdiction is the canonical one-way door; decision at create time only
- `[[cloudflare-lock-in-is-leverage]]` — D1/R2 jurisdiction flags are CF primitives; embrace them
- `[[autonomous-engineering]]` — jurisdiction choice is `approval-required`; never autonomous
- `[[no-staging-doctrine]]` — prod-only means a jurisdiction mistake is immediately a compliance incident
- `[[secret-provisioning]]` — database IDs are secrets; rotate if DB is recreated under new jurisdiction
