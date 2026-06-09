---
name: "context-spillover"
priority: 2
pack: "core"
triggers: []
paths:
  - "*"
---

# Context Spillover

Every time you open a file, read a directory, or load a feature into working context, you've paid the cognitive cost of understanding that surface. Don't leave that context on the table. Before closing the file, scan it AND its siblings for adjacent gaps in: aesthetics, documentation, test coverage. Fix the small ones inline. Surface the big ones in the same turn's report.

Different from ``extra-mile`` (which is "do unprompted improvements anywhere") and from ``proactive-improvements`` (which is "fix the obvious nit in THE file you're touching"). Context-spillover is the discipline that says: *the file's siblings — same dir, same feature — are already loaded; check them too while you're here.*

## The principle

- Loading context is expensive. Re-loading it next turn is doubly expensive.
- When you read `src/web/components/Booking.tsx`, you understand the booking domain for ~30 minutes. Use those 30 minutes to also improve `BookingRecurring.tsx`, `booking/PostBookingUpsell.tsx`, the `booking/` E2E specs, and `docs/booking.md` — IF they have visible gaps.
- The cost ceiling: <20% extra wall-time on top of the literal task. Past 20%, surface in the report instead.

## The triple sweep

For every file you edited or every feature surface you touched, check three adjacent dimensions:

### 1. Aesthetics

- Run the eye over the touched component AND its visual siblings (same `<feature>/` dir, same route family).
- Look for: brand-token drift, off-grid spacing, inconsistent type ramp, missing `data-testid`, missing aria-label, missing focus-visible ring, missing `prefers-reduced-motion` gate.
- Fix obvious nits inline. Document non-obvious ones in the report.

### 2. Documentation

- For every file you edited, check: does the JSDoc match the implementation? Are the public exports documented? Is there a sibling `docs/<feature>.md` that drifted from reality? Does CLAUDE.md mention this route family?
- Fix small JSDoc + README + CLAUDE.md drifts inline. Big doc rewrites → surface in Recs.

### 3. Test coverage

- For every file you edited, check: does it have a sibling spec? Was the spec last updated within the same calendar week as the code? Does the spec exercise the code path you just changed?
- If a sibling spec is missing OR stale, write/update it per ``e2e-tdd-organization`` — same turn.
- For UI changes: also extend `<feature>/visual.spec.ts` with a new `randomSnapshot` step covering the changed surface per ``e2e-visual-inspection``.

## Concrete patterns

### Pattern 1 — "I'm editing one component"

- Also scan the other 2-5 components in the same dir.
- Apply consistent brand tokens.
- Add `data-testid` where missing (consistent with sibling components).
- Update CHANGELOG if the change is user-visible.

### Pattern 2 — "I'm adding one API route"

- Also check: does `docs/<area>.md` mention the new route? Does `e2e/<feature>/<spec>.spec.ts` exercise it? Are the sibling routes in the same Hono sub-app following the same Zod-validator + audit-log pattern?
- Fix inconsistencies inline.

### Pattern 3 — "I'm refactoring a helper"

- Grep for every callsite (you already loaded the helper to understand it — cheap to also load callsites).
- If callsites have outdated patterns (e.g., manual try/catch when the helper now handles it), update them.
- Run the relevant spec dir after.

### Pattern 4 — "I'm writing a new feature"

- Check the feature inventory `e2e/FEATURES.md` — does the new feature need a row? Add it.
- Does it deserve a `docs/<feature>.md`? Write it.
- Does `CLAUDE.md` need a routes/components mention? Add it.
- Does the new feature have parallel-runner-ready specs per ``e2e-tdd-organization``? Make sure.

## Cost discipline

- Triple sweep MUST stay under 20% of the literal task's wall-time.
- If the spillover would 2x the work → surface in Recs with concrete next-prompt language.
- Never let spillover BLOCK shipping the literal task. Spillover is additive, not blocking.

## Anti-patterns

- ❌ Refactoring tangential code "because it's also bad" — that's not spillover, it's scope creep. Spillover = doc + test + aesthetic gaps directly adjacent to the touched surface.
- ❌ Introducing new patterns / libraries during spillover. Stay within existing precedent.
- ❌ Updating files you didn't already need to load. Spillover harvests already-loaded context; loading more files is just normal work with its own justification.
- ❌ Spillover that requires a design conversation — surface in Recs.

## Self-critique filter (apply before fixing a spillover item)

1. Is this item directly adjacent to the literal task? (no = skip)
2. Would Brian wish I'd fixed it when he opens the PR? (no = skip)
3. Does it cost <20% of current task wall-time? (no = surface in Recs)
4. Does it require new patterns / precedent? (yes = surface in Recs)

If all 4 = ship inline.
