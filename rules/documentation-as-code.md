---
name: "documentation-as-code"
priority: 2
pack: "core"
triggers:
  - "architecture"
  - "adr"
  - "decision"
  - "docs"
  - "jsdoc"
  - "migration guide"
paths:
  - "*"
---

# Documentation as Code

Architecture decisions, API contracts, and migration guides live in the repo alongside the code they describe. Documentation that drifts from code is worse than no documentation — it actively misleads. The fix is treating docs as a first-class artifact that ships in the same commit as the change that necessitates it.

## The Rule

- `ARCHITECTURE.md` at repo root — overall system shape, data flow, key design decisions, CF Worker topology, D1 schema overview.
- `docs/decisions/NNN-title.md` (ADR format) for every one-way door decision — a decision that is expensive or impossible to reverse without a major migration.
- JSDoc on every exported function, class, and type — `@param`, `@returns`, `@throws`, `@example`.
- When code changes, the doc changes in the same commit. Never split into a follow-up "update docs" commit.
- Docs that describe a deleted feature are deleted in the same commit.

## What qualifies as a one-way door (ADR required)

- Database schema choices that affect existing data (column type, normalization, FK structure).
- Auth provider selection (Clerk) or change.
- Payment rail selection (Square vs Stripe) or change.
- CF region / jurisdiction choice for a D1 database or R2 bucket (EU vs US).
- Moving from monolith Worker to multi-service architecture.
- Adopting a new ORM or abandoning the existing one.
- Any decision whose rollback requires a customer-facing migration or data transformation.

Two-way door decisions (easily reversed) do NOT need an ADR — use inline comments instead.

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

File naming: `docs/decisions/0001-use-d1-not-neon.md`. Zero-pad to 4 digits. Sequential. Never reuse a number.

## JSDoc on every exported function

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

## Correct Pattern

### Inline comment for two-way door

```ts
// Using KV cache with 60s TTL because D1 read latency (~8ms) is unacceptable
// on the /api/profile hot path. If TTL causes stale-profile bugs, reduce to 10s
// or switch to cache-aside with explicit invalidation on profile.updated events.
const user = await cachedD1(env.KV, `user:${id}`, 60, () => fetchUser(db, id));
```

### Doc updated in the same commit as the change

```
feat(billing): add Square recurring-donation flow

- Adds SquareSubscriptions service + webhook handler
- Migrates one-time donation form to support monthly toggle
- Updates docs/decisions/0003-payments-routing.md: Square Subscriptions
  replaces the hand-rolled Stripe recurring path we removed in 0008

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

## Anti-Pattern

### Exported function with no JSDoc

```ts
// BAD — what does `type` mean? what can it throw? what does null mean?
export async function getFlag(env: Env, key: string, userId: string | null, type?: string) {
  ...
}
```

### ADR written weeks after the decision

```md
# 0004 — Decided to use Clerk (written 6 weeks later from memory)
```

After 6 weeks the "Context" and "Alternatives considered" sections are reconstructed guesses. Write the ADR on the day you make the decision.

### Updating code without updating the doc

```ts
// worker/features/billing/stripe-webhooks.ts
// CHANGED: now handles charge.dispute.created with auto-accept under $25
// BUT docs/decisions/0006-stripe-dispute-handling.md still says "manual review"
```

This is the drift that kills teams. The ADR is now a liability. Fix: update the ADR in the same PR.

### Orphaned doc for deleted feature

```
docs/decisions/0007-use-inngest-v1.md   ← still in repo
worker/lib/inngest.ts                    ← deleted in the Workflows v2 migration
```

The ADR should either be marked `superseded-by: 0012` or deleted. Leaving it creates false signal.

## Practical Checklist

- Every one-way door decision: ADR filed in `docs/decisions/` before or same commit as implementation.
- Every exported symbol: JSDoc block with `@param`, `@returns`, `@example` at minimum.
- `ARCHITECTURE.md` updated when topology changes (new Worker, new DO, new D1 DB, new KV namespace).
- ADR status updated when a decision is reversed or superseded — never left as `accepted` for a dead decision.
- Deleted feature: its ADRs marked `superseded-by` or deleted; its inline comments removed.
- Migration guides in `docs/migrations/NNN-title.md` when a user-facing API contract changes.
- Doc changes in the SAME commit as code changes — no "follow-up doc PR" pattern.

## Folder layout

```
repo-root/
  ARCHITECTURE.md          ← system overview, always current
  docs/
    decisions/
      0001-use-d1.md
      0002-eu-jurisdiction.md
    migrations/
      0001-v1-to-v2-api.md
```

Per [[repo-folder-hygiene]]: docs/ holds canonical documents only. No scratch `_notes.md`, no brainstorm files, no `docs-old/`.

## See

- [[feature-module-architecture]] — where to colocate feature-level docs (README.md per feature folder)
- [[context-spillover]] — update sibling docs while context is loaded; don't defer
- [[prompt-as-training-signal]] — when a doc repeatedly gets questions, the doc is wrong; fix it
- [[repo-folder-hygiene]] — docs/ must stay ≤10 items per subfolder; split by concern
