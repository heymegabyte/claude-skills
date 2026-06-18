---
name: "loop-driven-development"
priority: 2
pack: "ai"
triggers:
  - "loop-driven development"
  - "/loop"
  - "recurring iteration"
  - "iterative loop"
  - "loop arc"
  - "doctrinal extraction sweep"
  - "audit-and-fix cycle"
paths:
  - "*"
---

# Loop-Driven Development

A structured pattern for compounding AI work across recurring iterations on a single surface. One loop arc can deliver the equivalent of weeks of solo engineering in under two hours.

## Pattern

- `/loop <interval> <self-referential-prompt>` — the prompt explicitly references the same surface being built.
- Each iteration fires the `/loop` skill with a prompt like "implement next steps and recs from last turn's report".
- The loop recurs at the given interval until the user stops it or the surface converges naturally.
- Key insight: each turn's end-of-turn report seeds the NEXT turn's TODO list automatically — the loop is self-fueling.
- The interval must be longer than typical task latency; 15m is the recommended default for most surfaces.

## The 5-Iteration Arc (Reference Implementation)

Empirical reference: 5 iterations, 21 tasks completed, ~70 min wall-clock, estimated ~70 hr of equivalent typical solo work.

- Iteration 1: audit + gap analysis → structured recs list (15 or more items)
- Iteration 2: implement top recs → deploys, tests, new recs list
- Iteration 3: implement recs → surface doctrinal patterns → extract lessons → new recs
- Iteration 4: solidify doctrine → write rules files + `always.md` updates → reduced recs list
- Iteration 5: polish + edge cases + doctrinal extraction of the loop arc itself

The recursive nature is the mechanism: iteration N's output IS iteration N+1's input. Recs shrinking from 15 to 4 across iterations signals genuine convergence, not time exhaustion.

## Critical Ingredients

1. **Bounded scope** — "implement next steps & recs" is the entire prompt. Never "do everything" or "finish the whole project" — that is unbounded scope and the loop will amplify it destructively.
2. **Monitor pattern with parallel agents** — each iteration spawns ≤5 parallel agents per `[[opus-quota-fallback]]` quota discipline. Main thread orchestrates only, never implements.
3. **End-of-turn reports** — every iteration MUST end with a structured "## Next Iteration Recs" section listing 3-8 concrete actionable items. No recs = no fuel = loop stalls silently.
4. **Doctrine extraction as discrete unit** — at least one iteration per arc must extract lessons into a rules file or `always.md`. Never defer doctrinal extraction to "later" — it will not happen.
5. **Convergence signal** — the loop terminates when self-critique rejects all remaining recs OR iteration N produces fewer than 3 actionable items. Termination is content-based, never time-based or turn-count-based.

## Why It Worked

- Each iteration's recs became the NEXT iteration's TODOs — a recursive "what's next" loop that never runs dry until genuinely done.
- Monitor pattern prevented context drift: subagents stayed focused on narrow tasks, main thread stayed clean as orchestrator.
- Parallel agents meant 5 independent tasks ran in 1 wall-clock slot — the primary multiplier on the 70×-compression ratio.
- End-of-turn report structure gave the loop mechanism a stable, machine-readable handoff protocol every time.
- Doctrinal extraction on iterations 3-4 made the work durable — lessons persist beyond session context into rules files.
- Convergence was natural: by iteration 5 the recs list had shrunk from 15 to 4, signaling saturation without an explicit stop signal.

## When To Use

- Doctrinal extraction sweeps — turn a session's lessons into rules files and `always.md` updates.
- Marketplace research arcs — iterate toward a complete competitive landscape with diminishing-returns termination.
- OpenAPI-driven scaffolding — forge → test → harden → document → register, each step surfacing the next.
- Audit-and-fix cycles — security/lint/drift audits where fixes surface new audits in a predictable chain.
- Feature completeness loops — build → verify → gap-detect → build until coverage is genuine.
- Any surface where the primary output is RECS that immediately become TODOS in the next turn.

## When NOT To Use

- Operational deployments requiring human review — push PRs, register MCPs in prod, payment/auth security reviews.
- Tightly-scoped one-off bugs — a 2-line fix does not need a loop; the overhead exceeds the gain.
- Tasks with external blockers — waiting on API keys, user approval, DNS propagation, or third-party status.
- Any task where iteration N output cannot deterministically seed iteration N+1 input — the loop has no fuel.

## Anti-Patterns

- `durable=true` on speculative loops — speculative loops must self-terminate; persistence turns a stall into a runaway.
- Unbounded prompts ("do everything", "finish the whole project") — the loop mechanism amplifies scope explosions, not just speed.
- Cron interval shorter than typical task latency — if tasks take 15 min, a 5 min interval stacks iterations and creates context collisions.
- Skipping end-of-turn report — the loop has no fuel for the next iteration and silently stalls with no error.
- Running loops during approval-required work — loops assume the `autonomous` tier; mixing with `review-required` work produces undefined behavior.
- Spawning >5 agents per iteration when Opus quota is active — triggers fallback cascade per `[[opus-quota-fallback]]`; wire `model_fallback` before starting.

## Loop Termination Signals

Ordered by priority:

1. Self-critique rejects all remaining recs — strongest signal; genuine convergence on the surface.
2. Iteration N produces fewer than 3 actionable items — saturation threshold; additional iterations have negative ROI.
3. User sends `/loop cancel` or invokes `ralph-loop:cancel-ralph`.
4. Context window exceeds 80% full — checkpoint to `progress.md` and continue in a fresh session per `[[parallel-subagent-economy]]`.
5. Two consecutive iterations produce identical recs — stuck loop; surface as a blocker rather than retrying.

## Relationship to Other Patterns

- `[[monitor-orchestration]]` — every loop iteration IS a monitor-orchestration run; the loop skill automates the recurring trigger.
- `[[opus-quota-fallback]]` — Opus-heavy loops hit quota by iteration 3; wire `model_fallback: claude-sonnet-4-6` on all architect/visual-qa spawns before starting the arc.
- `[[brian-preferences]]` — end-of-turn reports follow the structured report format defined there; the loop depends on that format being stable.
- `[[autonomous-engineering]]` — loops operate exclusively in the `autonomous` tier; never start a loop that will hit `approval-required` actions mid-arc.

## Prompt Template (Copy-Paste Ready)

```
/loop 15m implement the next steps and recommendations from the previous iteration's report.
Use the Monitor pattern: decompose in first message, spawn ≤5 parallel specialist agents,
fold outputs, verify, then end with a structured "## Next Iteration Recs" section listing
3-8 concrete actionable items. If fewer than 3 items remain, conclude with "LOOP COMPLETE".
```

## See

- `[[monitor-orchestration]]` — parallel agent decomposition pattern that each iteration runs
- `[[opus-quota-fallback]]` — quota discipline for multi-iteration arc agent spawns
- `[[brian-preferences]]` — end-of-turn structured report format the loop depends on
- `[[autonomous-engineering]]` — autonomy tier that loops assume throughout the arc
- `[[parallel-subagent-economy]]` — fresh-context discipline for subagents in each iteration
- `[[prompt-as-training-signal]]` — doctrine extraction each iteration is mandatory, not optional
