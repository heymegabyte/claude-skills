---
name: "auto-integrate-recs"
priority: 2
pack: "core"
triggers: []
paths:
  - "*"
---

# Auto-Integrate Recommendations

Ship improvements inline instead of listing them as recommendations. Anything under 2h with no external blocker is built in the same turn.

## Mandate

- `Recs:` section = FAILURE MODE for most line items. Default action is SHIP, not RECOMMEND.
- Anything in Recs that takes <2h and doesn't require a design conversation, irreversible call, or external blocker → implement IN THE SAME TURN.
- Bias hard toward implementation. Recs list should contain only truly-need-input items.

## The 4-question filter (before writing any Rec line)

1. **<30 min?** → ship inline, no Rec mention needed.
2. **30 min–2h?** → ship inline + one-line callout in the report.
3. **>2h but no design call needed?** → ship anyway; compounding value justifies the cost.
4. **Requires design conversation / external blocker / irreversible decision?** → THIS is a Rec. Surface with cost/value pitch + concrete next-prompt language.

## Top-N Rec list handling

- "Top 10 features" / "20 ideas": pick the BEST 4-6 and SHIP them.
- Defer the rest with one-line cost rationale + a single-paragraph cluster note.
- NEVER ship a Rec list of 10 items and 0 implementations.

## Anti-patterns

- Padding Recs to look thorough — every Rec line is a tax on the user's attention.
- Listing "could do X" when X takes 5 minutes — DO X.
- Same Rec across multiple turns without implementing — if it's in Recs twice, it should already be code by turn 2.
- Mixing implementable items with genuine-need-input items — implementable goes to Changes, true-blockers stay in Recs.
