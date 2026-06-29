---
last_reviewed: 2026-06-29
superseded_by: null
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

Govern API, schema, and route removal using a four-stage Announce→Soft-warn→Hard-warn→Remove cadence with a 61-day minimum runway.

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

Any route, column, or feature flag with **zero authenticated calls in 90 days** is removal-eligible without Announce. Confirm with D1 queries before removing.

See `reference/backwards-compatibility-removal-cadence.md` for the D1 queries.

If the query returns rows, move to Hard-warn immediately — they skipped Announce and Soft-warn by disuse.

## Soft-warn implementation

- Add RFC 8594 `Deprecation: true` and `Sunset: <ISO-date>` headers to every response.
- Add `Link: </api/v2{route}>; rel="successor-version"` header.
- Log every deprecated-route call to D1 `route_analytics` so the 90-day counter stays accurate.

See `reference/backwards-compatibility-removal-cadence.md` for `addDeprecationHeader()` and the D1 logging snippet.

## Hard-warn / Remove: 410 Gone handler

- After the sunset date, the route returns HTTP 410 with `error`, `message`, `docs`, and `sunset` fields.
- Keep the 410 handler live for **30 additional days** after Remove so callers get an actionable error instead of a 404.

See `reference/backwards-compatibility-removal-cadence.md` for the 410 response handler.

## Breaking-change semver discipline

- **Add new optional field to existing response** — patch; no announce stage.
- **Add new endpoint** — minor; no announce stage.
- **Rename or remove required field** — major (v1→v2); full cadence required.
- **Remove endpoint** — major (v1→v2); full cadence required.
- **Change auth scheme** — major; customer confirmation required.
- **Internal refactor, same API surface** — patch or none; no announce stage.

Only bump major when the **external contract** (response shape, required params, auth, URL) breaks. Internal restructuring is never a major bump.

## migration-agent invocation

For any removal affecting an external caller (public API, webhook endpoint, Clerk user attributes), spawn `migration-agent` per `[[autonomous-engineering]]` approval tier `review-recommended`.

See `reference/backwards-compatibility-removal-cadence.md` for the Agent invocation template.

## Changelog discipline

- Every Announce stage entry MUST have a changelog row per `[[customer-facing-changelog]]`.
- Entry MUST include: endpoint/column name, sunset date, replacement, and a migration guide.
- No silent removals. Ever. Even for "internal" routes.

See `reference/backwards-compatibility-removal-cadence.md` for the changelog entry template.

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
