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
user for 30 minutes is an incident. The difference is almost always containment — not code
quality.

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
`[[feature-flags]]`. This means blast radius at launch = 0 users.

Rollout sequence:

```
experimental (0%)
  → beta (1%) — watch error budget for 24h
  → beta (10%) — watch for 48h
  → stable (50%) — watch for 24h
  → stable (100%) — promote after 1 week without P1
```

Never skip tiers. Never jump from 0% to 100%. The automation that does this lives in the
`/admin/feature-flags` rollout slider — move it one tier at a time.

## Canary deployments via Workers gradual rollout

Workers supports gradual rollout via `wrangler deploy --percentage <N>`. Use it for
infra-layer changes that can't be behind a flag (e.g., route rewrite, new middleware):

```toml
# wrangler.toml
[env.production]
# After successful canary, remove this line and do full deploy
# canary_percentage = 5  # (wrangler flag, not yet GA — use feature flags instead)
```

Until Workers native canary is GA, simulate it with a feature-flag-driven A/B split at the
route level:

```typescript
// worker/routes/checkout.ts
const useNewCheckout = await isFlagOn(env, 'new_checkout_v2', user, anonId);
return useNewCheckout
  ? handleNewCheckout(c)
  : handleLegacyCheckout(c);
```

1% → 10% → 100% via admin rollout slider. Error budget (`[[error-budget]]`) gates each step.

## Multi-tenant isolation: DO-per-tenant

In multi-tenant apps, one tenant's bug, runaway loop, or corrupt state must not affect others.
Durable Objects enforce this at the infra level:

```typescript
// worker/durable-objects/tenant-do.ts
export class TenantDO implements DurableObject {
  constructor(private state: DurableObjectState, private env: Env) {}

  async fetch(request: Request): Promise<Response> {
    // All state is tenant-scoped: this DO owns ONLY this tenant's data.
    // A bug that corrupts this DO's state cannot corrupt another tenant's DO.
    const tenantId = this.state.id.toString();
    // ...
  }
}

// worker/routes/api/tenant.ts — route to the tenant's own DO
app.all('/api/tenant/*', async (c) => {
  const tenantId = c.get('user').tenantId;
  const id = c.env.TENANT_DO.idFromName(tenantId);
  const stub = c.env.TENANT_DO.get(id);
  return stub.fetch(c.req.raw);
});
```

If a single-tenant state machine breaks, `wrangler do reset --id <id>` recovers it without
touching other tenants. Reference: `[[cf-agents-do-pattern]]`.

## Schema migrations: backward-additive only

Never combine a schema change and a code change that depends on it in the same deploy. If
the deploy fails mid-way, you have a schema mismatch with no rollback path.

The two-deploy rule:

```
Deploy 1: ADD new column (nullable, or with DEFAULT) — no code reads it yet.
  ↓ verify live for 1 hour
Deploy 2: Ship code that reads/writes the new column.
  ↓ verify live
Deploy 3 (optional cleanup): DROP old column AFTER 30 days of zero reads.
```

```sql
-- CORRECT: backward-additive migration (deploy 1)
ALTER TABLE donations ADD COLUMN payment_method_type TEXT DEFAULT 'card';

-- WRONG: DROP in the same migration as an ADD that new code depends on
-- ALTER TABLE donations DROP COLUMN legacy_processor; -- NEVER in same release
```

D1 enforces no ROLLBACK inside migrations — the additive approach IS the rollback
strategy: deploy 1 adds the column, rollback simply reverts to code that ignores it.
Use `[[drizzle-orm-and-migrations]]` `migration-agent` for multi-step migration orchestration.

## Rollback-first deployment culture

Every deploy must have a rollback answer BEFORE it ships. For Cloudflare Workers, the
answer is always `wrangler rollback` (or `wrangler rollback <version-id>` to a specific
version). For D1, Time Travel to a pre-migration snapshot.

Pre-deploy checklist (automate in CI):

```bash
# scripts/pre-deploy-check.sh
# 1. Confirm rollback version exists
PREV_VERSION=$(wrangler versions list --json | jq -r '.[1].id')
echo "Rollback target: $PREV_VERSION"

# 2. Confirm D1 time travel is enabled (not older than 30 days)
wrangler d1 time-travel info "$DB_NAME"

# 3. Confirm error budget is healthy (burn rate < 5×)
# (calls D1 slo_snapshots table, exits 1 if SHIP_STOP=true)
node scripts/check-ship-stop.mjs
```

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
