# Documentation as Code — reference templates

Sourced on demand by `rules/documentation-as-code.md`. The rule holds the requirements + checklist; this file holds the full copy-paste templates so they cost 0 tokens until needed.

## ADR format

```md
# NNN — Title of Decision

**Status:** accepted | superseded-by NNN | deprecated
**Date:** YYYY-MM-DD
**Deciders:** Brian Zalewski

## Context
One paragraph. What forced this decision? What constraints applied?

## Decision
One paragraph. What was decided, precisely.

## Consequences
- Positive: what becomes easier
- Negative: what becomes harder or is now locked in
- Neutral: notable side effects

## Alternatives considered
- **Alternative A** — why rejected
- **Alternative B** — why rejected
```

- File naming: `docs/decisions/0001-use-d1-not-neon.md`. Zero-pad to 4 digits. Sequential. Never reuse a number.
- Write ADR **on the day** the decision is made.

## JSDoc on every exported symbol

```ts
/**
 * Resolves a feature flag for the given user, checking KV cache before D1.
 *
 * @param env - Worker bindings (requires KV + D1)
 * @param key - Feature flag key, max 32 chars, lowercase snake_case
 * @param userId - Authenticated user ID (Clerk sub), or null for anonymous
 * @param anonId - PostHog distinct_id for anonymous rollout
 * @returns true if the flag is enabled for this user/session
 * @throws {FlagNotFoundError} if the key does not exist in the database
 *
 * @example
 * const enabled = await isFlagOn(env, 'new_billing_flow', user.id, anonId);
 * if (!enabled) return c.notFound();
 */
export async function isFlagOn(
  env: Env,
  key: string,
  userId: string | null,
  anonId: string,
): Promise<boolean> { ... }
```

## ARCHITECTURE.md structure

```md
# Architecture

## Overview
Two-sentence system description.

## Workers topology
- `worker/` — main API Worker (Hono), handles all authenticated + public API routes
- `worker/scheduled/` — Cron Trigger Workers for background jobs
- Durable Objects: `<Name>` — purpose, storage type (SQLite-backed)

## Data layer
- D1: `<db-name>` — schema overview, migration location
- KV namespaces: `<NAMESPACE>` — what it caches, TTL policy
- R2 buckets: `<BUCKET>` — what it stores, lifecycle rules

## Auth
Clerk for all user-facing auth. M2M via JWT (zero-RTT verification at edge).

## Payment rails
Square for accept-money, Stripe Connect Express for payouts. See `docs/decisions/0003-payments-routing.md`.

## Key design decisions
- [0001 — D1 not Neon](docs/decisions/0001-use-d1-not-neon.md)
- [0002 — EU jurisdiction](docs/decisions/0002-eu-jurisdiction-default.md)
```

## Folder layout

```
repo-root/
  ARCHITECTURE.md
  docs/
    decisions/
      0001-use-d1.md
    migrations/
      0001-v1-to-v2-api.md
```
