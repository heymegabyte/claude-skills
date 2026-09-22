---
last_reviewed: 2026-06-29
superseded_by: null
name: "naming-no-transient-prefixes"
priority: 3
pack: "core"
triggers:
  - "wave"
  - "rename"
paths:
  - "*"
---

# Naming — No Transient Prefixes, No Vibe Names

Names describe WHAT a thing is — never WHEN it was built (transient prefixes) and
never how the author FELT about it (vibe/hype adjectives). Both rot: "wave28" means
nothing to the next reader; "brilliant.ts" tells you nothing about what the file does.
Durable identifiers read like a domain model, not a changelog or a hype deck.

## Banned in durable identifiers (build-fail)

- `wave<N>_*` / `waveN-*` / `sprint<N>_*` / `phase<N>_*` / `batch<N>_*` / `v<N>_*` (when N = a build wave, not a real API version)
- Applies to: **feature-flag keys**, **feature-module folders**, **route paths** (`/api/wave28-*`), **D1 table names**, **exported symbols / classes / components**, **DO classes**, **migration-defined object names**.

## Also banned — vibe / hype adjectives (build-fail)

- Subjective quality/hype words as durable identifiers: `brilliant.*`, `big_bets.*`, `awesome.*`, `magic.*`, `amazing.*`, `epic.*`, `ultimate.*`, `killer.*`, `genius.*`, `secret_sauce.*`, `game_changer.*`. They describe a FEELING, not a function — the next reader still has to open the file to learn what it does.
- Same identifier surfaces as the transient ban: file names, exported symbols/classes, module folders, feature-flag keys, route paths, D1 tables, DO classes. Import aliases too (`import * as B from …` is a vibe-alias — name it for the module).
- **Grab-bag smell**: a file named for a vibe (`brilliant.ts` = "10 brilliant features") is usually ALSO an anti-pattern grab-bag of unrelated features (per `inverted-abstraction-pyramid`). Rename descriptively now; splitting into per-feature modules is the deeper fix.
- Legit domain terms that LOOK hype are fine: `pro.ts` (the Pro subscription tier), `super_admin.ts` (the super-admin role) — these name a real product concept, not a vibe.

## Required instead — descriptive, domain-meaningful names

- A flag for U-Haul rental cross-sell is `truck_rental_cross_sell`, NOT `wave29_truck_rental`.
- A module for mid-job NPS is `mid_job_nps` / `features/mid-job-nps/`, NOT `wave31-mid-job-nps`.
- A route is `/api/group-move`, NOT `/api/wave28-group-move`.
- A consolidated experimental-feature service is `experimental_features.ts` / `advanced_features.ts`, NOT `brilliant.ts` / `big_bets.ts` (projectsites, 2026-08-15 — Brian directive; renamed both + the `B` import alias → `experimentalFeatures`, tables were already descriptive so no migration needed).

## Where chronology IS allowed

- **Migration FILENAMES only** — `0101_crew_intake.sql`, `0084_lead_ideas.sql`. The numeric prefix orders migrations; that's its whole job. The TABLES/COLUMNS/FLAGS inside still get descriptive names. An APPLIED migration's filename is a historical artifact — do NOT rename it later (breaks the runner's applied-migrations tracking, e.g. wrangler `d1_migrations`); fix the identifiers INSIDE, not the filename.
- **Commit messages / changelog / PR titles** — narrate the wave there, never in the code.
- **Real semantic API versions** — `/api/v2/...` when it's a genuine versioned contract, not a build wave.

## When you inherit wave-named identifiers

- Treat them as drift per `drift-detection`. Rename to descriptive names in careful batches: rename the symbol/flag/route + update EVERY caller + migration-rename live DB rows/tables + verify (typecheck + tests + the route's frontend callers) before moving to the next batch. Never rename a live route without updating its callers in the same change.
