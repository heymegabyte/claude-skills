---
name: "extra-mile"
priority: 2
pack: "core"
triggers: []
paths:
  - "*"
---

# Extra Mile

After every literal request, build the adjacent improvement a human developer would never think to add but that measurably raises surface quality.

## Mandate

- After completing the literal request, ask: "What would a human developer NEVER program but that would bring real value?" Then build it.
- Bar: "did I make the surface measurably better in ways the user wouldn't have specified?"
- Pair every fix with a value-add. Every fix is also an opportunity.

## Triggers

- Every fix → extra-mile feature complementing the fix.
- Every feature → micro-detail that makes it feel hand-crafted.
- Every data extraction → expose data visibly, not just store it.
- Every analytics event → surface a derived insight (top-N, trend, badge).
- Every form → inline validation feedback, success microcopy, recovery affordance.
- Every error state → one-click "try again" + actionable next step.
- Every async load → contextual loading message (not "Loading…").
- Every CRUD action → add undo.
- Every list → keyboard nav (↑↓ enter).
- Every modal → Esc close + focus restore.
- Every track/post/item with metadata → surface metadata somewhere visible.
- Every "user could discover this manually" → make it self-evident.

## Examples of EXTRA mile work

- **Numeric metadata** (BPM, key, duration, file size, word count) → render inline where it adds context. BPM + key chip in the now-playing playbar inhabits already-allocated empty space, never expands layout.
- **Authoritative metadata available** → seed the runtime (e.g. set `engine.bpm` from authoritative source so visualizers snap to correct tempo immediately, no 20s convergence).
- **Visualizer drawing** → use every available primitive: `tempoPhase` for bar-lock, bands for spectral split, `dropEnergy` for climax, `beatPulse` for impulses — not just `freqData`.
- **Album page** → add a "Listen on" row with every confirmed platform link.
- **Loading a track** → preload neighbor track artwork so next/prev feels instant.
- **Search input** → add Cmd+K shortcut + history + recent-results.
- **Share button** → add "copy as embed code" alongside copy-link.
- **404 page** → suggest closest-matching route via Levenshtein.
- **Empty state** → never just "no results" — add the action that creates the first result.
- **Error boundary** → log to Sentry + show "what to try" + "report this" + auto-restore on dismiss.
- **Mobile** → swipe gestures for prev/next, haptic feedback on tap, pull-to-refresh.
- **Desktop** → keyboard shortcuts for every clickable action with `?` legend.
- **Accessibility** → not just WCAG-pass, but delightful with screen reader: semantic landmarks, `aria-live` for state changes.

## Cost rule

- <30min → ship inline.
- 30min–2h → ship inline + brief mention in end-of-turn report.
- >2h → surface in Recs with one-line cost/value pitch, let user decide.

## Anti-patterns

- Don't ask permission for extra-mile work — just do it (`brian-preferences`).
- Don't list "could do X" in Recs when X takes 5min — do X.
- Don't add features the user explicitly didn't want.
- Don't add complexity for its own sake — every extra must serve UX/DX/observability/aesthetic.
- Don't introduce new tech (state lib, framework) without real demand.
- Don't add chrome where space is already crowded.

## Self-critique filter (all 5 must pass → ship inline)

1. Does this serve the user's apparent intent?
2. Would the user feel "yeah of course" if they saw it shipped?
3. Does it NOT require a design conversation?
4. Would Brian wish I had just done this when he opens the PR?
5. Does it cost ≤20% wall-time of the current change?
