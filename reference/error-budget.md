# Error Budget — implementation reference

Sourced on demand by rules/error-budget.md.

## Burn-rate calculation — TypeScript

```typescript
// worker/lib/slo-burn-rate.ts
export interface SLOConfig {
  routeKey: string;
  sloPercent: number; // e.g. 99.9
  windowDays: number; // 30
}

export function burnRate(
  config: SLOConfig,
  errorCountLast30d: number,
  totalRequestsLast30d: number
): number {
  const errorBudgetFraction = (100 - config.sloPercent) / 100;
  const budgetErrors = totalRequestsLast30d * errorBudgetFraction;
  // burn rate = actual errors / budget errors
  return budgetErrors > 0 ? errorCountLast30d / budgetErrors : 0;
}
```

## PostHog HogQL — nightly error snapshot

Run nightly via cron; store result in D1 `slo_snapshots`.

```sql
-- posthog HogQL — daily error snapshot
SELECT
  properties.$pathname AS route,
  count() AS error_count,
  countIf(properties.status >= 500) AS server_errors
FROM events
WHERE event = '$pageview'
  AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY route
```

## Ship-stop guard — TypeScript

Call in CI pre-deploy step. Exit 1 when ship-stop is active.

```typescript
// worker/lib/ship-stop-guard.ts
import { isFlagOn } from './feature-flags';

export async function enforceShipStop(env: Env): Promise<boolean> {
  const flag = await env.DB
    .prepare("SELECT value FROM system_flags WHERE key = 'SHIP_STOP'")
    .first<{ value: string }>();
  return flag?.value === 'true';
}
```

Error message to surface when ship-stop is active:
`"Ship-stop active: error budget exhausted. Fix reliability before deploying features."`

## Automatic killswitch via feature flags

When a feature's error rate spikes post-launch, auto-kill it without a redeploy by
checking the killswitch-promoted flag at request time.

```typescript
// worker/routes/api/checkout.ts
const featureOn = await isFlagOn(env, 'new_checkout_flow', user, anonId);
// If burn rate guard tripped, isFlagOn returns false regardless of DB state
// because the killswitch sets stage='killswitch' on the flag row
if (!featureOn) {
  // fall back to legacy checkout path
}
```

## SLO declaration in manifest.ts

```typescript
// worker/features/checkout/manifest.ts
export const manifest = {
  featureSlug: 'checkout',
  routes: ['/api/checkout', '/api/checkout/confirm'],
  slo: {
    availabilityPercent: 99.9,
    windowDays: 30,
    maxBurnRate: 14.4,         // fast-burn threshold
    alertBurnRate: 5,           // warn threshold
  },
  owner: 'brian@megabyte.space',
} as const;
```
