---
name: "backwards-compatibility-removal-cadence"
priority: 2
pack: "core"
triggers:
  - "deprecate"
  - "deprecated"
  - "remove endpoint"
  - "remove column"
  - "drop column"
  - "breaking change"
  - "migration path"
  - "cleanup"
  - "dead code"
  - "unused route"
  - "semver"
  - "v2"
paths:
  - "drizzle/**"
  - "migrations/**"
  - "src/worker/routes/**"
  - "workers/**"
  - "CHANGELOG.md"
  - "package.json"
---

# Backwards-Compatibility Removal Cadence

## Deprecation timeline (four stages)

```
Announce → Soft-warn → Hard-warn → Remove
  Day 0      Day 1       Day 31      Day 61
```

- **Announce** (Day 0) — Entry in `CHANGELOG.md`; admin banner if UI-facing. Gate: none.
- **Soft-warn** (30 days) — Warning log/header returned; feature still fully works. Gate: 30 days elapsed.
- **Hard-warn** (30 days) — Warning logged + returned as response header; D1 query for last-used. Gate: 0 calls in last 7 days.
- **Remove** — Code deleted, migration drops column, route returns 410 Gone. Gate: drift gate passes.

Default window: **30 days per stage = 60 days total**.

Compress to **14 days** when ALL of:

- Internal tooling only (no external callers).
- Feature flag shows 0% rollout for 30+ days.
- D1 query confirms 0 calls in last 14 days.

Never compress for payment routes, auth routes, or public API endpoints without customer confirmation.

## 90-day no-use rule

Any route, column, or feature flag with **zero authenticated calls in 90 days** is removal-eligible without Announce. Confirm with D1 before removing:

```sql
-- Routes with zero traffic in last 90 days
SELECT route_path, MAX(last_called_at) as last_use
FROM route_analytics
WHERE last_called_at < datetime('now', '-90 days')
   OR last_called_at IS NULL
ORDER BY last_use ASC;
```

```sql
-- Feature flags never written in 90 days
SELECT key, updated_at
FROM feature_flags
WHERE stage IN ('stable', 'deprecated')
  AND updated_at < datetime('now', '-90 days')
  AND rollout_percent = 100;
```

If the query returns rows, move to Hard-warn immediately — they skipped Announce and Soft-warn by disuse.

## Soft-warn implementation

```typescript
// worker/lib/deprecation-header.ts
export function addDeprecationHeader(
  res: Response,
  route: string,
  sunsetDate: string // ISO 8601
): Response {
  const headers = new Headers(res.headers);
  headers.set('Deprecation', 'true');
  headers.set('Sunset', sunsetDate);          // RFC 8594
  headers.set('Link', `</api/v2${route}>; rel="successor-version"`);
  return new Response(res.body, { ...res, headers });
}

// Usage in route handler (soft-warn stage):
app.get('/api/v1/donations', async (c) => {
  const res = await handleDonations(c);
  return addDeprecationHeader(res, '/donations', '2026-09-01');
});
```

Log every deprecated-route call to D1 so the 90-day counter stays accurate:

```typescript
ctx.waitUntil(
  env.DB.prepare(
    'INSERT OR REPLACE INTO route_analytics (route_path, last_called_at) VALUES (?, CURRENT_TIMESTAMP)'
  ).bind('/api/v1/donations').run()
);
```

## Hard-warn stage: return 410 after sunset date

```typescript
app.get('/api/v1/donations', (c) =>
  c.json(
    {
      error: 'Gone',
      message: 'This endpoint was removed. Migrate to /api/v2/donations.',
      docs: 'https://megabyte.space/docs/migration/donations-v2',
      sunset: '2026-09-01',
    },
    410
  )
);
```

Keep the 410 handler live for **30 additional days** after Remove so callers get an actionable error instead of a 404.

## Breaking-change semver discipline

- **Add new optional field to existing response** — patch; no announce stage.
- **Add new endpoint** — minor; no announce stage.
- **Rename or remove required field** — major (v1→v2); full cadence required.
- **Remove endpoint** — major (v1→v2); full cadence required.
- **Change auth scheme** — major; customer confirmation required.
- **Internal refactor, same API surface** — patch or none; no announce stage.

Only bump major when the **external contract** (response shape, required params, auth, URL) breaks. Internal restructuring is never a major bump.

## migration-agent invocation

For any removal affecting an external caller (public API, webhook endpoint, Clerk user attributes), spawn `migration-agent` per `[[autonomous-engineering]]` approval tier `review-recommended`:

```
Agent(migration-agent):
  "Deprecate /api/v1/donations. Sunset date: 2026-09-01.
   Add soft-warn headers per backwards-compatibility-removal-cadence.md.
   D1 migration: add route_analytics row. Changelog entry required.
   Cross-link: [[customer-facing-changelog]]."
```

## Changelog discipline

Every Announce stage entry requires a changelog row per `[[customer-facing-changelog]]`. Minimum entry:

```markdown
### Deprecated: GET /api/v1/donations

**Sunset:** 2026-09-01 · **Replacement:** [GET /api/v2/donations](/api/v2/donations)

The v1 donations endpoint returns a flat array. v2 returns a paginated object with
`cursor`-based pagination. Migrate by updating your call to pass `cursor` and read
`data[]` instead of the top-level array.
```

No silent removals. Ever. Even for "internal" routes.

## Anti-patterns

- Removing a column in the same migration that adds its replacement — violates `[[blast-radius-minimization]]`.
- Skipping the changelog entry because "nobody is using this."
- Jumping from Announce directly to Remove without a warning period.
- Setting Sunset header to a date <30 days out.
- Bumping major for a refactor that didn't change the API surface.
- Removing a route that returns 404 with no 410 transition.

## Cross-links

- `[[drift-detection]]` — dead code is drift; this rule formalizes the removal path.
- `[[main-only-branch]]` — use conventional commits `chore(deprecate):` prefix.
- `[[feature-flags]]` — rollout=0 for 30+ days = soft-deprecated; 90+ days = hard-deprecated.
- `[[customer-facing-changelog]]` — every Announce stage entry requires a changelog row.
- `[[blast-radius-minimization]]` — additive schema changes + 30-day column removal lag = zero blast radius.
