# Data Residency / Sovereignty by Default — implementation reference

Sourced on demand by rules/data-residency-by-default.md.

## CLI commands to create jurisdictional surfaces

### D1 databases

```bash
# CORRECT: EU jurisdiction by default
wrangler d1 create my-db --jurisdiction eu

# CORRECT: explicit US when workload is US-only
wrangler d1 create my-db --jurisdiction us

# WRONG: no --jurisdiction flag (CF decides; not a documented guarantee)
wrangler d1 create my-db
```

### R2 buckets

```bash
# CORRECT: EU jurisdiction by default
wrangler r2 bucket create my-bucket --jurisdiction eu

# WRONG: no --jurisdiction flag
wrangler r2 bucket create my-bucket
```

### Durable Objects — placement override

DO namespaces have no `--jurisdiction` CLI flag. Use `smart_placement` override for
jurisdiction control.

```toml
[placement]
mode = "off"  # pin to a specific region rather than auto-placement

[[durable_objects.bindings]]
name = "MY_DO"
class_name = "MyDurableObject"
# jurisdiction handled by placement mode above
```

When `smart_placement.mode = "off"`, the DO activates in the region of the Worker that
created it. Deploy the Worker to an EU region for EU data residency on DOs.

## wrangler.toml jurisdiction documentation pattern

Document the jurisdiction decision as a comment alongside every binding.

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

## Scaffold-time confirmation prompt

Surface this exact message when creating any new D1/R2 resource:

```
Scaffolding new D1 database. Jurisdiction defaults to EU per data-residency-by-default rule.
Confirm EU or specify US (required for US-only / HIPAA / government workloads).
```

## Migration cost — D1 US to EU (7 steps)

Demonstrates why the `--jurisdiction` flag at create time is non-negotiable.

```
1. wrangler d1 export --local my-db-us > backup.sql      # minutes for small DBs
2. wrangler d1 create my-db-eu --jurisdiction eu          # new DB ID
3. wrangler d1 execute my-db-eu --file backup.sql         # re-import
4. Update wrangler.toml database_id                       # redeploy required
5. Update all CI secrets (DATABASE_ID env var)            # N pipelines
6. Validate D1 bindings in Worker                         # test + E2E
7. Delete old DB after validation                         # can't undo
```

This is 4–8 hours of work, a production redeploy, and an active compliance incident.
