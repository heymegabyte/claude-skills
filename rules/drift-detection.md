# Architecture Drift Detection (***SUPREME — every code change, every project***)

Architecture drift is the gap between how the system is SUPPOSED to be structured and how it actually is. Drift is fixed IMMEDIATELY, in the same turn it surfaces — never deferred to a follow-up PR. A scattered route, an unflagged feature, an untyped AI output: all drift, all merge-blockers.

## What counts as drift (***fix on sight***)
- Route handler without an owning feature module
- Feature module without a `manifest.ts`
- Feature module without a wired feature flag
- Feature flag without a corresponding `manifest.ts`
- `manifest.ts` without colocated `__tests__/`
- Tests not linked back to a manifest (no `featureSlug` reference)
- API route without a Zod schema at its boundary
- API route that needs a flag guard but has none (`isFlagOn` missing)
- AI output consumed without a schema / contract validating it
- Tool (MCP / function-call) without an input AND output schema
- Dashboard / UI string not run through the i18n layer
- Log line emitted without a request id AND feature correlation id
- Sentry span / breadcrumb without feature context (`featureSlug` tag)
- Duplicate Zod schemas (same shape defined in ≥2 places)
- Duplicate TypeScript types (same shape defined in ≥2 places)
- Dead feature flags (no code reads them)
- Dead routes (registered but unreachable / no callers)
- Dead feature folders (module exists, nothing imports it)
- Unused exports (no importers — run `knip`)
- Module missing a `README.md`
- AI-heavy feature missing eval / regression coverage

## Immediacy rule (***NON-NEGOTIABLE***)
- See drift → fix drift in the SAME turn. Never log it as a TODO, never punt to next PR.
- Fixing drift adjacent to the touched surface is [[context-spillover]]'s triple sweep applied to architecture.
- If a drift fix needs a design conversation (rare), surface it in Recs; everything else ships inline.

## Per-repo enforcement
- Validators live at `tools/architecture-validation/`
- `pnpm validate:architecture` runs locally + in CI
- CI fails the merge on any serious drift (missing manifest, unguarded route, untyped AI output, untyped tool)
- Cosmetic drift (missing README, unused export) warns; structural drift blocks

## Canonical implementation (projectsites.dev)
- `scripts/validate-feature-manifests.mjs` — asserts every module has all 7 manifest fields + colocated tests
- `scripts/validate-feature-drift.mjs` — asserts route↔flag↔manifest↔e2e↔FEATURES.md coherence, flags dead flags/routes/folders
- `.github/workflows/feature-architecture.yml` runs both on every push
- Copy these verbatim into every new emdash project; wire into `predeploy` + CI

## Scan cadence (before every new feature)
1. `pnpm validate:architecture` — confirm zero existing drift before adding more
2. Grep `libs/features/*/manifest.ts` — does the capability extend an existing module?
3. Grep `src/routes/` + `src/services/` for partial implementations to colocate
4. New capability → scaffold the full module; never scatter handlers in `routes/` without a module

## Reference incident (***2026-05-28 — global AI-dev OS upgrade***)
Brian directive to formalize drift-detection as a standalone SUPREME rule so every emdash project enforces the route↔manifest↔flag↔test↔schema↔contract coherence that projectsites.dev's `validate-feature-*.mjs` scripts already check.

## See
- [[feature-module-architecture]] — the module shape drift-detection enforces
- [[feature-flags]] — every flag must link to a manifest + e2e dir + risk notes
- [[contract-first-ai]] — AI output without a contract is drift
- [[zod-everywhere]] — duplicate / missing schemas are drift
- [[tool-design-as-api]] — tools without input/output schemas are drift
- [[verification-loop]] — drift validators run alongside the deploy + prod-E2E gate
