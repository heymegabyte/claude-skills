---
name: "one-way-two-way-doors"
priority: 2
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

# One-Way vs Two-Way Doors

Classify every architectural decision before writing any code. Misclassification is the primary cause of unrecoverable production mistakes.

## Two-way door (reversible within a sprint)

Undo in hours–days without user impact or coordinated migration. Move fast — ceremony here is waste.

Examples:

- Adding a D1 column (non-nullable with a default)
- Adding a Hono route
- Wrapping a feature behind a flag (`enabled=0`)
- Changing a Tailwind class or layout component
- Adding a KV namespace
- Switching npm packages with equivalent APIs
- Renaming a local variable or function
- Adding a Zod schema, cron trigger, or `console.log`

## One-way door (painful or impossible to undo)

Undoing requires coordinated migration, data loss risk, public announcement, or >1 sprint. Write the self-argument. Proceed with explicit intent.

Examples:

- Dropping a D1 column (data loss)
- Choosing an auth provider (Clerk → migration = weeks)
- Defining a public API surface (consumers depend immediately)
- Choosing a database engine (SQLite → Postgres = rewrite)
- Choosing a data model encoding a business assumption (e.g., one email per user)
- Migrating data across CF jurisdictions (GDPR)
- Deleting an R2 bucket
- Changing a URL structure without a redirect strategy
- Choosing Stripe vs Square (high integration cost either way)
- Adding a non-nullable column without a default (requires backfill)

## Decision protocol

### Two-way door

```
Classify → "two-way" → Ship autonomously per [[autonomous-engineering]] tier
```

No ceremony. No write-up. Move.

### One-way door

```
Classify → "one-way" → 5-minute written self-argument → Document → Decide → Ship
```

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

Write this in the commit message or `docs/decisions/NNN-title.md` for anything larger than a 2-file change.

## Why this sits alongside autonomous-engineering tiers

`[[autonomous-engineering]]` defines approval tiers. This rule names the underlying reason: **cost of reversal**. The two-way/one-way framing answers "WHY is this in tier X?" before you look up the tier.

- If undoing requires touching production data or public API consumers → one-way.
- Everything else → two-way.

## Common misclassifications

| Decision | Incorrect | Correct | Why |
|---|---|---|---|
| Add D1 column with DEFAULT | one-way | **two-way** | Non-breaking; reversible by dropping |
| Drop D1 column | two-way | **one-way** | Data loss; cannot recover from git history |
| Add feature flag | one-way | **two-way** | Deleted in a single row delete |
| Change public REST route | two-way | **one-way** | Consumers exist; requires deprecation + redirect |
| Switch from Clerk to Auth0 | two-way | **one-way** | User session migration = weeks; JWKs change |
| Add new R2 bucket | one-way | **two-way** | Empty bucket deleted in seconds |
| Delete R2 bucket with data | two-way | **one-way** | Permanent data loss |
| Add `UNIQUE` constraint to D1 | two-way | **one-way** | Fails if duplicates exist; requires backfill |

## Prod-only amplification

Per `[[no-staging-doctrine]]`: no staging environment. Every one-way door mistake is immediately a production incident. This raises misclassification stakes — not to paralysis, but to a 5-minute pause.

## Confidence threshold

Confidence below 0.7 on a one-way door → research more before deciding. State confidence explicitly in the self-argument. Winging a one-way door causes GDPR incidents or 3-week auth provider migrations.

## Drift detection

One-way doors made without a self-argument, commit note, or ADR become the hardest drift to unwind. Per `[[drift-detection]]`: encounter an architectural choice with no documented rationale → add one same turn.

## Anti-patterns

- Treating a schema drop as two-way ("we can add it back") — git restores the definition, not the data.
- Treating an auth provider choice as two-way ("it's just an API") — JWT format, session storage, OAuth flows, and MFA are deeply coupled.
- Skipping the self-argument because "this one is obvious" — obvious choices with no counterargument check are where the worst surprises live.
- Writing the self-argument in Slack instead of the commit — undiscoverable.
- Classifying everything as two-way to avoid the 5-minute pause — the pause costs 5 minutes; a wrong one-way door costs weeks.

## Cross-links

- `[[autonomous-engineering]]` — approval tiers; one-way doors are approval-required by default
- `[[no-staging-doctrine]]` — no staging safety net; one-way door mistakes hit prod immediately
- `[[drift-detection]]` — one-way doors without documentation become opaque drift
- `[[data-residency-by-default]]` — jurisdiction selection is a one-way door; establish the rule before first create
- `[[fail-fast-build-fail-soft-prod]]` — build gates catch one-way door mistakes before they reach prod
