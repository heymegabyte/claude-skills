# Blast Radius Minimization — implementation reference

Sourced on demand by rules/blast-radius-minimization.md.

## Feature-flag canary route split

Use a feature-flag-driven A/B split at the route level to simulate canary deployments
until Workers native gradual rollout is GA.

```typescript
// worker/routes/checkout.ts
const useNewCheckout = await isFlagOn(env, 'new_checkout_v2', user, anonId);
return useNewCheckout
  ? handleNewCheckout(c)
  : handleLegacyCheckout(c);
```

Promote via the admin rollout slider: 1% → 10% → 100%. Error budget gates each step
per `[[error-budget]]`.

## DO-per-tenant isolation pattern

Durable Objects scope all mutable state to a single tenant. A bug or corrupt state in
one DO cannot affect any other tenant's DO.

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

Recovery for a single broken tenant: `wrangler do reset --id <id>` — no other tenants
are affected. Reference: `[[cf-agents-do-pattern]]`.

## Schema migration: backward-additive SQL

Never combine a schema change and the code that depends on it in the same deploy.

```sql
-- CORRECT: backward-additive migration (deploy 1)
ALTER TABLE donations ADD COLUMN payment_method_type TEXT DEFAULT 'card';

-- WRONG: DROP in the same migration as an ADD that new code depends on
-- ALTER TABLE donations DROP COLUMN legacy_processor; -- NEVER in same release
```

Three-deploy sequence:

```
Deploy 1: ADD new column (nullable or DEFAULT) — no code reads it yet.
  ↓ verify live for 1 hour
Deploy 2: Ship code that reads/writes the new column.
  ↓ verify live
Deploy 3 (optional cleanup): DROP old column AFTER 30 days of zero reads.
```

## Pre-deploy rollback verification script

Automate in CI to confirm every deploy has a rollback path before it ships.

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
