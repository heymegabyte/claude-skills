---
name: "extra-mile"
priority: 2
pack: "core"
triggers: []
paths:
  - "*"
---

# Extra Mile

## Mandate

- After completing the literal request, ask: "What would a human developer NEVER program but that would bring real value?" Then build it.
- The bar is not "did I do what was asked" — it's "did I make the surface measurably better, more delightful, more useful in ways the user wouldn't have specified."
- Pair every fix with a value-add. Every fix is also an opportunity.

## Triggers

- Every fix → add an extra-mile feature that complements the fix
- Every feature → add a micro-detail that makes it feel hand-crafted
- Every data extraction → expose the data somewhere visible, not just store it
- Every analytics event → surface a derived insight (top-N, trend, badge)
- Every form → add inline validation feedback, success microcopy, recovery affordance
- Every error state → add a one-click "try again" + actionable next step
- Every async load → add a contextual loading message (not "Loading…")
- Every CRUD action → add an undo
- Every list → add keyboard nav (↑↓ enter)
- Every modal → add Esc close + focus restore
- Every track/post/item with metadata → surface the metadata somewhere
- Every "the user could discover this manually" → make it self-evident

## Examples of EXTRA mile work

- **Numeric metadata** (BPM, key, duration, file size, word count) → don't just store it, render it inline where it adds context. Example: BPM + key chip in the now-playing playbar inhabits already-allocated empty space, never expands the layout
- **Authoritative metadata available** → seed the runtime (e.g., set engine.bpm from authoritative source so visualizers snap to correct tempo immediately, no 20s convergence)
- **Visualizer drawing** → use every available primitive: tempoPhase for bar-lock, bands for spectral split, dropEnergy for climax, beatPulse for impulses — not just freqData
- **Album page** → add a "Listen on" row with every confirmed platform link
- **Loading a track** → preload neighbor track artwork so next/prev feels instant
- **Search input** → add Cmd+K shortcut + history + recent-results
- **Share button** → add "copy as embed code" alongside copy-link
- **404 page** → suggest the closest-matching route via Levenshtein
- **Empty state** → never just "no results" — add the action that would create the first result
- **Error boundary** → log to Sentry + show "what to try" + "report this" + auto-restore on dismiss
- **Mobile** → swipe gestures for prev/next, haptic feedback on tap, pull-to-refresh
- **Desktop** → keyboard shortcuts for every clickable action with `?` to view legend
- **Accessibility** → not just WCAG-pass, but DELIGHTFUL with screen reader (semantic landmarks, aria-live for state changes)

## Cost rule

- Extra-mile work that takes <30min should ship inline
- 30min-2h: ship inline with a brief mention in the end-of-turn report
- >2h: surface in Recs with a one-line cost/value pitch, let user decide
- NEVER cap effort prematurely — explore every branch of "what could make this better"

## Anti-patterns

- Don't ask permission to do extra-mile work — just do it (`brian-preferences`)
- Don't list "could do X" in Recs when X takes 5min — do X
- Don't add features the user explicitly didn't want
- Don't add complexity for its own sake — every extra must serve UX/DX/observability/aesthetic
- Don't introduce new tech (state lib, framework) without a real demand
- Don't add chrome where space is already crowded

## Self-critique filter (for every proposed extra)

1. Does this serve the user's apparent intent? (no = skip)
2. Would the user feel "yeah of course" if they saw it shipped? (no = surface in Recs instead)
3. Does it require a design conversation? (yes = surface in Recs)
4. Would Brian wish I had just done this when he opens the PR? (no = skip)
5. Does it cost >20% wall-time of the current change? (yes = surface in Recs)

If all 5 = ship inline.
