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

Solo-builder doctrine allows aggressive cleanup — no design committees, no multi-team
coordination. But no formalized cadence = drift. Dead routes and stale columns accumulate,
maintenance burden compounds, and one day you DELETE the wrong thing. This rule formalizes
the TTL pipeline from "still in use" to "safely gone."

## Deprecation timeline (four stages)

```
Announce → Soft-warn → Hard-warn → Remove
  Day 0      Day 1       Day 31      Day 61
```

| Stage | Duration | What happens | Gate to advance |
|---|---|---|---|
| **Announce** | Day 0 | Entry in `CHANGELOG.md`, admin banner if UI-facing | — |
| **Soft-warn** | 30 days | Warning log/header returned; feature still fully works | 30 days elapsed |
| **Hard-warn** | 30 days | Warning logged + returned as response header; D1 query for last-used | 0 calls in last 7 days |
| **Remove** | — | Code deleted, migration drops column, route returns 410 Gone | Drift gate passes |

Default window is **30 days per stage = 60 days total**. Compress to 14 days when:
- Internal tooling only (no external callers)
- Feature flag shows 0% rollout for 30+ days
- D1 query confirms 0 calls in last 14 days

Never compress for payment routes, auth routes, or public API endpoints without customer
confirmation.

## "90-day no-use" rule

Any route, column, or feature flag with **zero authenticated calls in 90 days** is
removal-eligible without announcement — it was already dead before you noticed. Confirm
with a D1 query before removing:

```sql
-- Find routes with zero traffic in last 90 days
-- (assumes PostHog events or Workers Tracing OTLP writes to D1 analytics)
SELECT route_path, MAX(last_called_at) as last_use
FROM route_analytics
WHERE last_called_at < datetime('now', '-90 days')
   OR last_called_at IS NULL
ORDER BY last_use ASC;
```

```sql
-- Find D1 columns never written in 90 days (proxy: check feature flag usage)
SELECT key, updated_at
FROM feature_flags
WHERE stage IN ('stable', 'deprecated')
  AND updated_at < datetime('now', '-90 days')
  AND rollout_percent = 100;
```

If the query returns rows, move them to Hard-warn immediately; they skipped Announce and
Soft-warn because they were already effectively removed by disuse.

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

Log every deprecated-route call to D1 so the 90-day counter is accurate:

```typescript
// Append to route handler after addDeprecationHeader
ctx.waitUntil(
  env.DB.prepare(
    'INSERT OR REPLACE INTO route_analytics (route_path, last_called_at) VALUES (?, CURRENT_TIMESTAMP)'
  ).bind('/api/v1/donations').run()
);
```

## Hard-warn stage: return 410 after sunset date

When the sunset date passes, swap the handler to 410 Gone with a migration pointer:

```typescript
// Hard-warn → Remove transition
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

Keep the 410 handler live for **30 additional days** after Remove stage so callers get an
actionable error instead of a 404 that's hard to distinguish from a typo.

## Breaking-change semver discipline

Semver bump rules for emdash projects:

| Change type | Version bump | Requires announce stage |
|---|---|---|
| Add new optional field to existing response | patch | No |
| Add new endpoint | minor | No |
| Rename or remove required field | **major (v1→v2)** | Yes — full cadence |
| Remove endpoint | **major (v1→v2)** | Yes — full cadence |
| Change auth scheme | **major** | Yes — customer confirmation |
| Internal refactor, same API surface | patch or none | No |

Solo builder anti-pattern: bumping major for every cleanup. Only bump major when the
**external contract** (response shape, required params, auth, URL) breaks. Internal
restructuring is never a major bump.

## migration-agent invocation

For any removal affecting an external caller (public API, webhook endpoint, Clerk user
attributes), spawn `migration-agent` per `[[autonomous-engineering]]` approval tier
`review-recommended`:

```
Agent(migration-agent):
  "Deprecate /api/v1/donations. Sunset date: 2026-09-01.
   Add soft-warn headers per backwards-compatibility-removal-cadence.md.
   D1 migration: add route_analytics row. Changelog entry required.
   Cross-link: [[customer-facing-changelog]]."
```

The migration agent runs the four-stage pipeline automatically, writes the changelog
entry, and sets a calendar reminder for the hard-warn date.

## Changelog discipline

Every deprecation announcement is a changelog entry per `[[customer-facing-changelog]]`.
Minimum entry:

```markdown
### Deprecated: GET /api/v1/donations

**Sunset:** 2026-09-01 · **Replacement:** [GET /api/v2/donations](/api/v2/donations)

The v1 donations endpoint returns a flat array. v2 returns a paginated object with
`cursor`-based pagination. Migrate by updating your call to pass `cursor` and read
`data[]` instead of the top-level array.
```

No silent removals. Ever. Even for "internal" routes — internal today, external tomorrow.

## Anti-patterns

- Removing a column in the same migration that adds its replacement (violates `[[blast-radius-minimization]]`).
- Skipping the changelog entry because "nobody is using this."
- Jumping from Announce directly to Remove without a warning period.
- Setting Sunset header to a date 2 days out — 30 days minimum.
- Treating a major refactor as a major semver bump when the API surface didn't change.
- Removing a route that returns 404 with no 410 transition — callers can't distinguish removal from typo.

## Cross-links

- `[[drift-detection]]` — dead code is drift; this rule formalizes the removal path for drift found by that rule
- `[[main-only-branch]]` — no feature branches means removal cadence lives in short-lived commits on main; use conventional commits `chore(deprecate):` prefix
- `[[feature-flags]]` — a flag at rollout=0 for 30+ days is soft-deprecated; a flag at rollout=0 for 90+ days is hard-deprecated
- `[[customer-facing-changelog]]` — every Announce stage entry requires a changelog row
- `[[blast-radius-minimization]]` — additive schema changes + 30-day column removal lag = zero blast radius on removals
