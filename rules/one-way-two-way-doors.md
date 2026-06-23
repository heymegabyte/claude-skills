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

Classify every architectural decision before writing any code.

## Two-way door (reversible within a sprint)

Undo in hours–days without user impact or coordinated migration. Move fast.

Examples: adding a D1 column (with default), adding a Hono route, wrapping a feature behind a flag, changing Tailwind classes, adding a KV namespace, switching npm packages with equivalent APIs, adding a Zod schema/cron/`console.log`.

## One-way door (painful or impossible to undo)

Undoing requires coordinated migration, data loss risk, public announcement, or >1 sprint. Write the self-argument. Proceed with explicit intent.

Examples: dropping a D1 column (data loss), choosing an auth provider (Clerk → migration = weeks), defining a public API surface, choosing a database engine, choosing a data model encoding a business assumption, migrating CF jurisdictions (GDPR), deleting an R2 bucket, changing a URL structure without redirect strategy, Stripe vs Square choice, adding a non-nullable column without default.

## Decision protocol

### Two-way door

```
Classify → "two-way" → Ship autonomously per [[autonomous-engineering]] tier
```

No ceremony. Move.

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

Write in the commit message or `docs/decisions/NNN-title.md` for anything larger than a 2-file change.

## Common misclassifications

- **Add D1 column with DEFAULT** — two-way (non-breaking; reversible by dropping)
- **Drop D1 column** — one-way (data loss; cannot recover from git history)
- **Add feature flag** — two-way (deleted in a single row delete)
- **Change public REST route** — one-way (consumers exist; requires deprecation + redirect)
- **Switch Clerk to Auth0** — one-way (user session migration = weeks; JWKs change)
- **Add new R2 bucket** — two-way (empty bucket deleted in seconds)
- **Delete R2 bucket with data** — one-way (permanent data loss)
- **Add `UNIQUE` constraint to D1** — one-way (fails if duplicates exist; requires backfill)

## Confidence threshold

Confidence below 0.7 on a one-way door → research more before deciding. State confidence explicitly in the self-argument.

## Prod-only amplification

Per `[[no-staging-doctrine]]`: every one-way door mistake is immediately a production incident. The 5-minute pause is proportionate.

## Drift detection

One-way doors made without a self-argument become the hardest drift to unwind. Per `[[drift-detection]]`: encounter an architectural choice with no documented rationale → add one same turn.

## Anti-patterns

- Treating a schema drop as two-way ("we can add it back") — git restores the definition, not the data.
- Treating an auth provider choice as two-way ("it's just an API") — JWT format, sessions, OAuth, MFA are deeply coupled.
- Skipping the self-argument because "this one is obvious" — obvious choices with no counterargument check are where the worst surprises live.
- Writing the self-argument in Slack — undiscoverable.
- Classifying everything as two-way to avoid the 5-minute pause — wrong one-way door costs weeks.

## Cross-links

- `[[autonomous-engineering]]` — approval tiers; one-way doors are approval-required by default
- `[[no-staging-doctrine]]` — no staging safety net; one-way door mistakes hit prod immediately
- `[[drift-detection]]` — one-way doors without documentation become opaque drift
- `[[data-residency-by-default]]` — jurisdiction selection is a one-way door
- `[[fail-fast-build-fail-soft-prod]]` — build gates catch one-way door mistakes before prod
