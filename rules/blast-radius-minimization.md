---
name: "blast-radius-minimization"
priority: 2
pack: "core"
triggers:
  - "blast radius"
  - "canary"
  - "gradual rollout"
  - "progressive rollout"
  - "tenant isolation"
  - "schema migration"
  - "backward compatible"
  - "rollback"
  - "how many users"
  - "if this broke prod"
paths:
  - "src/worker/**"
  - "workers/**"
  - "drizzle/**"
  - "migrations/**"
  - "wrangler.toml"
  - "wrangler.jsonc"
---

# Blast Radius Minimization

Every change is scoped to the minimum surface that can possibly fail. A broken commit that
affects 1% of users for 5 minutes is a normal Tuesday. A broken commit that takes down every
user for 30 minutes is an incident. The difference is almost always containment — not code quality.

## The "5-minute thought experiment"

Before merging any non-trivial commit, answer: **"If this commit broke prod right now, how
many users notice in the first 5 minutes?"**

| Answer | Verdict | Required containment |
|---|---|---|
| 0 (feature behind flag, off) | Ship immediately | Flag default=off |
| 1% or less (canary) | Ship with monitoring | `rollout_percent: 1` |
| Specific tenant(s) only | Ship with override | DO-per-tenant isolation |
| Everyone who touches the changed route | Hold — add containment first | Flag it or canary it |
| Everyone, all routes | Hard block | Architecture problem |

No answer of "everyone" ships without prior explicit approval from this rule.

## Feature-flag isolation (first line of defense)

Every non-trivial feature ships at `enabled=0, rollout_percent=0, stage='experimental'` per
`[[feature-flags]]`. Blast radius at launch = 0 users.

Rollout sequence — never skip tiers, never jump 0% → 100%:

```
experimental (0%)
  → beta (1%) — watch error budget for 24h
  → beta (10%) — watch for 48h
  → stable (50%) — watch for 24h
  → stable (100%) — promote after 1 week without P1
```

## Canary deployments via Workers gradual rollout

- Until Workers native canary is GA, simulate with a feature-flag-driven A/B split at the route level.
- Promote via the `/admin/feature-flags` rollout slider: 1% → 10% → 100%.
- Error budget (`[[error-budget]]`) gates each promotion step.

See `reference/blast-radius-minimization.md` for the route-split implementation.

## Multi-tenant isolation: DO-per-tenant

- Every tenant gets its own Durable Object — one tenant's corrupt state cannot affect others.
- Route all tenant requests through `idFromName(tenantId)` to guarantee isolation.
- Recovery for a single broken tenant: `wrangler do reset --id <id>` with no impact to others.

See `reference/blast-radius-minimization.md` for the full DO class and routing handler.

## Schema migrations: backward-additive only

Three-deploy rule — never combine a schema change and the code that depends on it:

```
Deploy 1: ADD new column (nullable, or with DEFAULT) — no code reads it yet.
  ↓ verify live for 1 hour
Deploy 2: Ship code that reads/writes the new column.
  ↓ verify live
Deploy 3 (optional cleanup): DROP old column AFTER 30 days of zero reads.
```

- D1 enforces no ROLLBACK inside migrations — the additive approach IS the rollback strategy.
- Use `[[drizzle-orm-and-migrations]]` migration-agent for multi-step migration orchestration.

See `reference/blast-radius-minimization.md` for the correct and incorrect SQL patterns.

## Rollback-first deployment culture

- Every deploy must have a rollback answer BEFORE it ships.
- For Workers: `wrangler rollback` or `wrangler rollback <version-id>`.
- For D1: Time Travel to a pre-migration snapshot.
- Automate the pre-deploy rollback check in CI.

See `reference/blast-radius-minimization.md` for the `pre-deploy-check.sh` script.

## Anti-patterns

- Deploying without a flag when the change touches a critical route (donation, auth, checkout).
- Jumping rollout from 0% to 100% in one step — no observation window.
- Running `DROP COLUMN` in the same migration that adds its replacement.
- Sharing mutable state across tenants in a DO (one corrupted state = everyone's state).
- "We'll rollback by reverting the commit" — code revert ≠ schema revert; test `wrangler rollback` before you need it.
- Skipping the 5-minute thought experiment because the change "feels small."

## Cross-links

- `[[autonomous-engineering]]` — approval tiers already classify change blast radius; this rule makes isolation a concrete engineering pattern
- `[[feature-flags]]` — the primary isolation mechanism; every non-trivial feature behind a flag at 0% rollout
- `[[no-staging-doctrine]]` — prod-only means blast radius is real; containment is doubly critical
- `[[cf-agents-do-pattern]]` — DO-per-tenant is the canonical multi-tenant isolation pattern
- `[[error-budget]]` — burn rate gates canary promotion; if budget burns fast at 1%, hold at 1%
- `[[drizzle-orm-and-migrations]]` — migration-agent enforces the two-deploy additive pattern
