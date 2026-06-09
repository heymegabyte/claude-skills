---
name: "drift-detection"
priority: 2
pack: "core"
triggers:
  - "drift"
paths:
  - "*"
---

# Architecture Drift Detection

Architecture drift is the gap between how the system is SUPPOSED to be structured and how it actually is. Drift is fixed IMMEDIATELY, in the same turn it surfaces — never deferred to a follow-up PR. A scattered route, an unflagged feature, an untyped AI output: all drift, all merge-blockers.

## What counts as drift

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

## Immediacy rule

- See drift → fix drift in the SAME turn. Drift-class issues never get punted to a TODO or next PR. (TODOs for genuine future work are fine per `todos-are-roadmap`; the ban here is scoped to architecture drift specifically.)
- Fixing drift adjacent to the touched surface is `context-spillover`'s triple sweep applied to architecture.
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

## Agent drift signals

Owned by the `agent-diversity-reviewer` role + the `/drift-check` and `/agent-diversity-review` commands. Run on every multi-agent turn before declaring DONE. Each is a merge-blocker when found.

- Too many generic agents spawned — undifferentiated "do everything" agents where named specialists exist
- Agents with overlapping scope — two agents touching the same files / owning the same concern
- Agents that do not verify their own work — no build / test / E2E / screenshot proof in their report
- Agents that change files outside their stated scope — edits beyond the Scope/Non-goals they were briefed with
- Agents that skip tests — no failing-test-first, no regression spec, no `e2e/<feature>/` coverage
- Agents that ignore user stack preferences — drift from the mandated stack (e.g. wrong frontend framework, banned tool)
- Agents that fail to update docs — touched a surface but left CLAUDE.md / README / `FEATURES.md` stale
- Agents that propose global changes but don't implement them — recommend a rule/skill/config edit yet ship nothing
- Agents that make architectural changes without a review agent — structural edits landed with no completeness/security/code-review pass
- Agents that defer obvious in-scope work — push <2h ship-able items to Recs instead of integrating them per `auto-integrate-recs`
