# Naming — No Transient Prefixes (***SUPREME — every identifier, every project***)

Names describe WHAT a thing is, never WHEN it was built. Wave / sprint / phase /
version / batch numbers in durable identifiers are banned. They rot instantly:
"wave28" means nothing to the next reader, collides across projects, and makes the
codebase read like a changelog instead of a domain model.

## Banned in durable identifiers (build-fail)
- `wave<N>_*` / `waveN-*` / `sprint<N>_*` / `phase<N>_*` / `batch<N>_*` / `v<N>_*` (when N = a build wave, not a real API version)
- Applies to: **feature-flag keys**, **feature-module folders**, **route paths** (`/api/wave28-*`), **D1 table names**, **exported symbols / classes / components**, **DO classes**, **migration-defined object names**.

## Required instead — descriptive, domain-meaningful names
- A flag for U-Haul rental cross-sell is `truck_rental_cross_sell`, NOT `wave29_truck_rental`.
- A module for mid-job NPS is `mid_job_nps` / `features/mid-job-nps/`, NOT `wave31-mid-job-nps`.
- A route is `/api/group-move`, NOT `/api/wave28-group-move`.

## Where chronology IS allowed
- **Migration FILENAMES only** — `0084_brilliant_ideas.sql`, `0101_crew_intake.sql`. The numeric prefix orders migrations; that's its whole job. The TABLES/COLUMNS/FLAGS inside still get descriptive names.
- **Commit messages / changelog / PR titles** — narrate the wave there, never in the code.
- **Real semantic API versions** — `/api/v2/...` when it's a genuine versioned contract, not a build wave.

## When you inherit wave-named identifiers
- Treat them as drift per [[drift-detection]]. Rename to descriptive names in careful batches: rename the symbol/flag/route + update EVERY caller + migration-rename live DB rows/tables + verify (typecheck + tests + the route's frontend callers) before moving to the next batch. Never rename a live route without updating its callers in the same change.

## Reference incident (***2026-06-08 — brickcitylabor.com***)
A project accumulated 85 `wave28/29/20-*` API routes, 136 `wave<N>_*` flags, and
`wave31-*` feature dirs. Brian: *"Remove the wave28_ stuff and all that and make sure
everything is named appropriately. Include that in ~/.agentskills there should never be
a case where you name it like that."* This rule is the durable capture. Pairs with the
project memory `feedback_feature_naming` (which already said "descriptive, not waveN" for
new code) — this elevates it to a universal hard rule covering ALL durable identifiers,
not just new ones, with an inherited-name remediation path.

## See
- [[drift-detection]] — wave-named identifiers are drift; fix on sight in batches
- [[code-style]] — naming conventions (camelCase/PascalCase/CONSTANT_CASE) this complements
- [[feature-module-architecture]] — module slugs are descriptive snake_case ≤32 chars
- [[brian-preferences]] — names read like a domain model, not a changelog
