---
name: "one-way-two-way-doors"
priority: 1
pack: "core"
triggers:
  - "migrate"
  - "switch"
  - "replace"
  - "drop"
  - "delete column"
  - "rename"
  - "breaking change"
  - "auth provider"
  - "database engine"
  - "public api"
  - "architecture"
  - "one-way"
  - "two-way"
  - "reversible"
  - "irreversible"
paths:
  - "*"
---

# One-Way vs Two-Way Doors — Reversibility-First Decision Making

Every architectural decision falls into one of two categories before any code is written.
Classifying decisions correctly is the single most reliable way to avoid weeks of repair
work caused by moving too fast on an irreversible choice.

## The classification

### Two-way door (reversible within a sprint)

A decision you can undo in hours to days without impacting real users or requiring a
coordinated migration. The cost of slowing down on a two-way door is pure waste — move fast.

Examples:
- Adding a new D1 column (non-nullable with a default)
- Adding a new Hono route
- Wrapping a feature behind a feature flag (`enabled=0`)
- Changing a Tailwind class or layout component
- Adding a new KV namespace
- Switching between two npm packages with equivalent APIs
- Renaming a local variable or function
- Adding a new Zod schema
- Adding a new cron trigger
- Adding `console.log` statements

### One-way door (irreversible or painful to undo)

A decision where undoing it requires a coordinated migration, data loss risk, a public
announcement, or more than a sprint of work. Slow down. Write the self-argument. Proceed
with explicit intent.

Examples:
- Dropping a D1 column (data loss)
- Choosing an auth provider (Clerk → migration = weeks)
- Defining a public API surface (consumers depend on it immediately)
- Choosing a database engine (SQLite → Postgres = rewrite)
- Choosing a data model that encodes a business assumption (e.g., one email per user)
- Migrating data across CF jurisdictions (GDPR)
- Deleting an R2 bucket
- Changing a URL structure without a redirect strategy
- Choosing Stripe vs Square for payments (integration cost is high on either)
- Adding a non-nullable column without a default (requires backfill on existing rows)

## The decision protocol

### Two-way door

```
Classify → "two-way" → Ship autonomously per [[autonomous-engineering]] tier
```

No ceremony. No write-up. Move.

### One-way door

```
Classify → "one-way" → 5-minute written self-argument → Document → Decide → Ship
```

The self-argument forces you to articulate the strongest case AGAINST the decision. If you
cannot defeat the counterargument, the decision is wrong.

**Self-argument template (inline comment or ADR):**

```
Decision: Switch from local KV rate limiting to Durable Objects for rate limiting.
Type: ONE-WAY (requires Worker + wrangler.toml change; existing KV rate limit data lost)

For:
- DOs give per-user global rate limit (KV is per-isolate, broken under concurrency)
- Eliminates the bug class described in [[state-is-the-enemy]]
- DO storage is transactional; KV writes are eventually consistent

Against:
- DO activation cost (~1ms) added to every rate-limited request
- Requires new DO class + bindings + wrangler.toml update
- Cannot be rolled back without redeploying

Counterargument defeated? YES — the per-isolate bug is a correctness issue, not a perf
question. The 1ms DO activation is negligible vs the correctness gain.

Confidence: 0.9 (above 0.7 threshold per [[autonomous-engineering]])
Proceed: Y
```

Write this in the commit message or a `docs/decisions/NNN-title.md` ADR for anything
larger than a 2-file change.

## Why this exists alongside autonomous-engineering tiers

The `[[autonomous-engineering]]` rule defines approval tiers (autonomous / review-recommended /
approval-required / blocked). This rule names the underlying reason those tiers exist:
**the cost of reversal**. The two-way/one-way framing answers "WHY is this decision in
tier X?" before you look up which tier it's in.

When in doubt: if undoing the decision requires touching production data or public API
consumers, it is one-way. Everything else is two-way.

## Common misclassifications

| Decision | Incorrect | Correct | Why |
|---|---|---|---|
| Add D1 column with DEFAULT | one-way | **two-way** | Non-breaking migration; reversible by dropping |
| Drop D1 column | two-way | **one-way** | Data loss; cannot recover from git history |
| Add feature flag | one-way | **two-way** | Flag can be deleted in a single row delete |
| Change public REST route | two-way | **one-way** | Consumers exist; requires deprecation + redirect |
| Switch from Clerk to Auth0 | two-way | **one-way** | User session migration = weeks; JWKs change |
| Add new R2 bucket | one-way | **two-way** | Empty bucket can be deleted in seconds |
| Delete R2 bucket with data | two-way | **one-way** | Permanent data loss |
| Add `UNIQUE` constraint to D1 | two-way | **one-way** | Fails if duplicates exist; requires backfill |

## Prod-only amplification

Per `[[no-staging-doctrine]]`: there is no staging environment. Every one-way door that
goes wrong is immediately a production incident affecting real users. This raises the stakes
of misclassification — not to the point of paralysis, but to the point of a 5-minute pause.

## The confidence threshold

Per `[[autonomous-engineering]]` — confidence below 0.7 on a one-way door means research
more before deciding. Confidence is stated explicitly in the self-argument. Winging a one-way
door is how you end up with a GDPR incident or a 3-week auth provider migration.

## Drift detection

One-way doors that were made without a self-argument, a commit note, or an ADR are
undocumented decisions — they become the hardest drift to unwind because nobody remembers
why they were made. Per `[[drift-detection]]`: if you encounter an architectural choice
with no documented rationale, add one in the same turn.

## Anti-patterns

- Treating a schema drop as two-way ("we can add it back") — git restores the column
  definition, not the data
- Treating an auth provider choice as two-way ("it's just an API") — JWT format, session
  storage, OAuth flows, and MFA configuration are deeply coupled
- Skipping the self-argument because "this one is obvious" — obvious choices with no
  counterargument check are where the worst surprises live
- Writing the self-argument in a Slack thread instead of the commit — undiscoverable
- Classifying everything as two-way to avoid the 5-minute pause — the pause costs 5 minutes;
  a wrong one-way door costs weeks

## Cross-links

- `[[autonomous-engineering]]` — approval tiers; one-way doors are approval-required by default
- `[[no-staging-doctrine]]` — no staging safety net; one-way door mistakes hit prod immediately
- `[[drift-detection]]` — one-way doors without documentation become opaque drift
- `[[data-residency-by-default]]` — jurisdiction selection is a one-way door; establish the rule before first create
- `[[fail-fast-build-fail-soft-prod]]` — build gates catch one-way door mistakes before they reach prod
