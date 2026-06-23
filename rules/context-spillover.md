---
name: "context-spillover"
priority: 2
pack: "core"
triggers: []
paths:
  - "*"
---

# Context Spillover

When you open a file, you've paid the cognitive cost of understanding that surface. Before closing it, scan siblings (same dir, same feature) for adjacent gaps: aesthetics, documentation, test coverage. Fix small ones inline; surface big ones in the same turn's report.

Different from `extra-mile` (unprompted improvements anywhere) and `proactive-improvements` (fix the nit in THE file you're touching). Context-spillover: siblings are already loaded — check them too while you're here.

## The principle

- Context is expensive. Re-loading it next turn is doubly expensive.
- Cost ceiling: **<20% extra wall-time**. Past 20% → surface in report.

## The triple sweep

For every file edited or feature surface touched:

### 1. Aesthetics

- Scan touched component AND visual siblings (same `<feature>/` dir, same route family).
- Look for: brand-token drift, off-grid spacing, inconsistent type ramp, missing `data-testid`, missing `aria-label`, missing `focus-visible` ring, missing `prefers-reduced-motion` gate.
- Fix obvious nits inline; document non-obvious ones in report.

### 2. Documentation

- Check: JSDoc matches implementation? Public exports documented? Sibling `docs/<feature>.md` drifted? CLAUDE.md mentions this route family?
- Fix small JSDoc + README + CLAUDE.md drifts inline. Big doc rewrites → Recs.

### 3. Test coverage

- Check: sibling spec exists? Updated within same calendar week as code? Exercises the changed path?
- Missing or stale spec → write/update per `[[e2e-tdd-organization]]` same turn.
- UI changes → extend `<feature>/visual.spec.ts` with `randomSnapshot` step per `[[e2e-visual-inspection]]`.

## Concrete patterns

- **Editing one component** — scan 2-5 siblings; apply consistent brand tokens; add `data-testid` where missing; update CHANGELOG if user-visible.
- **Adding one API route** — check `docs/<area>.md` mentions it; `e2e/<feature>/<spec>.spec.ts` exercises it; sibling routes follow same Zod-validator + audit-log pattern.
- **Refactoring a helper** — grep all callsites; update outdated patterns (e.g. manual try/catch the helper now handles); run relevant spec dir.
- **Writing a new feature** — add row to `e2e/FEATURES.md`; write `docs/<feature>.md`; add CLAUDE.md routes/components mention; add parallel-runner-ready specs per `[[e2e-tdd-organization]]`.

## Cost discipline

- Triple sweep MUST stay under 20% of literal task wall-time.
- Spillover that would 2× the work → surface in Recs with concrete next-prompt language.
- Spillover is additive, never blocking.

## Anti-patterns

- Refactoring tangential code "because it's also bad" — that's scope creep, not spillover.
- Introducing new patterns/libraries during spillover.
- Loading files you didn't already need — spillover harvests already-loaded context only.
- Spillover requiring a design conversation — surface in Recs.

## Self-critique filter (apply before fixing a spillover item)

1. Directly adjacent to the literal task? (no → skip)
2. Would Brian wish I'd fixed it when he opens the PR? (no → skip)
3. Costs <20% of current task wall-time? (no → surface in Recs)
4. Requires new patterns/precedent? (yes → surface in Recs)

All 4 pass → ship inline.
