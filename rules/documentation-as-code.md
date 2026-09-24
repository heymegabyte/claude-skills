---
last_reviewed: 2026-06-29
superseded_by: null
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
- Doc changes ship in the **same commit** as the code change — never a follow-up commit.
- Docs for deleted features are deleted in the same commit.

## Required artifacts

- **`ARCHITECTURE.md`** at repo root — system shape, data flow, CF Worker topology, D1 schema overview.
- **`docs/decisions/NNN-title.md`** (ADR) for every one-way door decision.
- **JSDoc** on every exported function, class, and type — `@param`, `@returns`, `@throws`, `@example`.
- **`docs/migrations/NNN-title.md`** when a user-facing API contract changes.

## One-way door decisions (ADR required)

- DB schema changes affecting existing data (column type, normalization, FK structure)
- Auth provider selection or change (Clerk)
- Payment rail selection or change (Square vs Stripe)
- CF region/jurisdiction for D1 or R2 (EU vs US)
- Monolith Worker → multi-service architecture
- New ORM adoption or abandonment
- Any decision whose rollback requires a customer-facing migration or data transformation
- Two-way door decisions (easily reversed) → inline comment only, no ADR

## ADR format

See `reference/documentation-as-code.md` § ADR format for the full template. Naming: `docs/decisions/NNNN-title.md` — zero-pad to 4 digits, sequential, never reuse; write the ADR on the decision day.

## JSDoc on every exported symbol

See `reference/documentation-as-code.md` § JSDoc for a full annotated example. Requirement (also in § Required artifacts + § Checklist): `@param` + `@returns` + `@throws` + `@example` on every export; JSDoc states intent, not types.

## ARCHITECTURE.md structure

See `reference/documentation-as-code.md` § ARCHITECTURE.md structure for the template (Overview · Workers topology · Data layer · Auth · Payment rails · Key design decisions).

## Folder layout

See `reference/documentation-as-code.md` § Folder layout for the tree (`ARCHITECTURE.md` at root; `docs/decisions/` + `docs/migrations/`).

Per [[repo-folder-hygiene]]: `docs/` holds canonical documents only — no scratch `_notes.md`, no brainstorm files, no `docs-old/`.

## Checklist

- Every one-way door decision: ADR in `docs/decisions/` before or same commit as implementation.
- Every exported symbol: JSDoc with `@param`, `@returns`, `@example` at minimum.
- `ARCHITECTURE.md` updated when topology changes (new Worker, DO, D1 DB, KV namespace).
- ADR status updated when reversed or superseded — never left as `accepted` for a dead decision.
- Deleted feature: ADRs marked `superseded-by` or deleted; inline comments removed.

## Anti-patterns

- Exported function with no JSDoc
- ADR written weeks after the decision (Context and Alternatives become guesses)
- Code changed without updating the ADR
- Orphaned ADR for a deleted feature left as `accepted`

## See

- [[feature-module-architecture]] — colocate feature-level docs (README.md per feature folder)
- [[context-spillover]] — update sibling docs while context is loaded; don't defer
- [[prompt-as-training-signal]] — if a doc repeatedly gets questions, the doc is wrong; fix it
- [[repo-folder-hygiene]] — `docs/` must stay ≤10 items per subfolder; split by concern
