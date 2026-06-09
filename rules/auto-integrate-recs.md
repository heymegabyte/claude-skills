---
name: "auto-integrate-recs"
priority: 2
pack: "core"
triggers: []
paths:
  - "*"
---

# Auto-Integrate Recommendations

## Mandate

- The `Recs:` section at the end of a report is the FAILURE MODE for most line items. The default action is to SHIP, not to RECOMMEND.
- Anything that would land in Recs but takes <2h of wall-time and doesn't require a design conversation, an irreversible call, or an external blocker — implement it IN THE SAME TURN.
- The bar Brian set in 2026 sessions ("integrate all your recommendations", "best recommendations i mean"): bias hard toward implementation. Ship one slightly smaller Recs list with only the truly-need-input items.

## The 4-question filter (before writing a single Rec line)

1. **<30 min?** → ship inline, no Rec mention needed
2. **30 min - 2h?** → ship inline + brief one-line callout in the report
3. **>2h but no design call needed?** → ship anyway; cost is acceptable for compounding value
4. **Requires design conversation / external blocker / irreversible decision?** → THIS is a Rec. Surface with cost/value pitch + concrete next-prompt language

## Top-N Rec list handling

- "Top 10 features" / "20 ideas" patterns: pick the BEST 4-6 and SHIP them
- Defer the rest with one-line cost rationale + a single-paragraph cluster note ("Remaining 6: voice transcript needs WebSpeech wiring + privacy review, conversation-permalink needs D1 schema, …")
- NEVER ship a Rec list of 10 items and 0 implementations — that's the anti-pattern this rule kills

## Anti-patterns

- Padding the Recs section to look thorough — every Rec line is a tax on the user's attention
- Listing "could do X" when X takes 5 minutes — DO X
- Surfacing the same Rec across multiple turns without implementing — if it's in Recs twice, it should already be code by turn 2
- Mixing implementable items with genuine-need-input items in the same Recs block — segment them: implementable goes to Changes, true-blockers stay in Recs
