# Backwards-Compatibility Removal Cadence — implementation reference

Sourced on demand by rules/backwards-compatibility-removal-cadence.md.

## 90-day no-use detection queries

Run against D1 before any removal to confirm zero-use eligibility.

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

## Soft-warn header implementation

Add RFC 8594 `Sunset` and `Deprecation` headers to the response, and log every
call to D1 so the 90-day counter stays accurate.

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

Log each deprecated-route call to D1:

```typescript
ctx.waitUntil(
  env.DB.prepare(
    'INSERT OR REPLACE INTO route_analytics (route_path, last_called_at) VALUES (?, CURRENT_TIMESTAMP)'
  ).bind('/api/v1/donations').run()
);
```

## Hard-warn / Remove: 410 Gone handler

Keep the 410 handler live for 30 additional days after Remove so callers get an
actionable error instead of a 404.

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

## migration-agent invocation (template)

Spawn for any removal affecting an external caller per `[[autonomous-engineering]]`
approval tier `review-recommended`:

```
Agent(migration-agent):
  "Deprecate /api/v1/donations. Sunset date: 2026-09-01.
   Add soft-warn headers per backwards-compatibility-removal-cadence.md.
   D1 migration: add route_analytics row. Changelog entry required.
   Cross-link: [[customer-facing-changelog]]."
```

## Changelog entry template

```markdown
### Deprecated: GET /api/v1/donations

**Sunset:** 2026-09-01 · **Replacement:** [GET /api/v2/donations](/api/v2/donations)

The v1 donations endpoint returns a flat array. v2 returns a paginated object with
`cursor`-based pagination. Migrate by updating your call to pass `cursor` and read
`data[]` instead of the top-level array.
```
