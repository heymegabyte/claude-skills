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

- Docs live in the repo alongside the code they describe.
- Doc changes ship in the **same commit** as the code change — never a follow-up "update docs" commit.
- Docs for deleted features are deleted in the same commit.

## Required artifacts

- **`ARCHITECTURE.md`** at repo root — system shape, data flow, CF Worker topology, D1 schema overview.
- **`docs/decisions/NNN-title.md`** (ADR) for every one-way door decision.
- **JSDoc** on every exported function, class, and type — `@param`, `@returns`, `@throws`, `@example`.
- **`docs/migrations/NNN-title.md`** when a user-facing API contract changes.

## One-way door decisions (ADR required)

- DB schema changes affecting existing data (column type, normalization, FK structure).
- Auth provider selection or change (Clerk).
- Payment rail selection or change (Square vs Stripe).
- CF region/jurisdiction for D1 or R2 (EU vs US).
- Monolith Worker → multi-service architecture.
- New ORM adoption or abandonment.
- Any decision whose rollback requires a customer-facing migration or data transformation.
- Two-way door decisions (easily reversed) → inline comment only, no ADR.

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
- Write the ADR **on the day** the decision is made — not weeks later.

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
      0002-eu-jurisdiction.md
    migrations/
      0001-v1-to-v2-api.md
```

Per [[repo-folder-hygiene]]: `docs/` holds canonical documents only — no scratch `_notes.md`, no brainstorm files, no `docs-old/`.

## Checklist

- Every one-way door decision: ADR in `docs/decisions/` before or same commit as implementation.
- Every exported symbol: JSDoc with `@param`, `@returns`, `@example` at minimum.
- `ARCHITECTURE.md` updated when topology changes (new Worker, DO, D1 DB, KV namespace).
- ADR status updated when reversed or superseded — never left as `accepted` for a dead decision.
- Deleted feature: ADRs marked `superseded-by` or deleted; inline comments removed.

## Anti-patterns

- Exported function with no JSDoc.
- ADR written weeks after the decision (Context and Alternatives become guesses).
- Code changed without updating the ADR — the doc becomes a liability.
- Orphaned ADR for a deleted feature left as `accepted`.

## See

- [[feature-module-architecture]] — colocate feature-level docs (README.md per feature folder)
- [[context-spillover]] — update sibling docs while context is loaded; don't defer
- [[prompt-as-training-signal]] — if a doc repeatedly gets questions, the doc is wrong; fix it
- [[repo-folder-hygiene]] — `docs/` must stay ≤10 items per subfolder; split by concern
