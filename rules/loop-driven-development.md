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

Structured pattern for compounding AI work across recurring iterations on a single surface.

## Pattern

- `/loop <interval> <self-referential-prompt>` — prompt explicitly references the same surface.
- Each iteration fires with "implement next steps and recs from last turn's report".
- 15m is the recommended default interval (must exceed typical task latency).
- Each turn's end-of-turn report seeds the NEXT turn's TODO list — the loop is self-fueling.

## The 5-Iteration Arc (Reference)

Empirical: 5 iterations, 21 tasks, ~70 min wall-clock, ~70 hr equivalent solo work.

- Iteration 1: audit + gap analysis → structured recs list (≥15 items)
- Iteration 2: implement top recs → deploys, tests, new recs list
- Iteration 3: implement recs → surface doctrinal patterns → extract lessons → new recs
- Iteration 4: solidify doctrine → write rules files + `always.md` updates → reduced recs list
- Iteration 5: polish + edge cases + doctrinal extraction of the loop arc itself

Recs shrinking from 15 to 4 across iterations = genuine convergence, not time exhaustion.

## Critical Ingredients

1. **Bounded scope** — "implement next steps & recs" is the entire prompt. Never "do everything" — the loop amplifies unbounded scope destructively.
2. **Monitor pattern** — each iteration spawns ≤5 parallel agents per `[[opus-quota-fallback]]`. Main thread orchestrates only.
3. **End-of-turn reports** — every iteration MUST end with "## Next Iteration Recs" listing 3-8 concrete items. No recs = no fuel = silent stall.
4. **Doctrine extraction** — at least one iteration per arc extracts lessons into a rules file or `always.md`. Never defer.
5. **Convergence signal** — terminate when self-critique rejects all remaining recs OR fewer than 3 actionable items remain. Content-based, never time-based.

## When To Use

- Doctrinal extraction sweeps, marketplace research arcs, OpenAPI-driven scaffolding, audit-and-fix cycles, feature completeness loops.
- Any surface where iteration N output IS iteration N+1 input.

## When NOT To Use

- Operational deployments requiring human review.
- Tightly-scoped one-off bugs (overhead exceeds gain).
- Tasks with external blockers (API keys, DNS, user approval).
- Tasks where iteration N output cannot seed iteration N+1 input.

## Anti-Patterns

- `durable=true` on speculative loops — persistence turns a stall into a runaway.
- Unbounded prompts ("do everything", "finish the whole project").
- Cron interval shorter than task latency — stacks iterations, creates context collisions.
- Skipping end-of-turn report — loop stalls silently with no error.
- Running loops during approval-required work — loops assume `autonomous` tier.
- Spawning >5 agents per iteration when Opus quota is active — wire `model_fallback` before starting.
- **Running a long arc on a feature branch while `main` advances in parallel** — the arc silently diverges; by the time you merge, both sides have built overlapping features differently (add/add conflicts on whole files). Run the arc ON `main` per `[[main-only-branch]]`, OR `git merge origin/main` into the arc branch every few fires to keep the gap small. Reference incident: njsk.org `funky-donkeys` ran ~20 fires (animation + notifications + audit tooling) while `main` independently shipped wave-2-5 features → 369↔10 divergence with add/add conflicts on `get-help.tsx`/`corporate.tsx`. Each extra arc-branch commit made the reconciliation harder — a signal to STOP shipping to the branch and merge first.
- **Continuing to ship when the loop is blocked on a human decision** (a divergent merge, an approval-required action) — extra commits worsen the blocker. Surface the blocker + STOP, don't keep firing.

## Loop Termination Signals (priority order)

1. Self-critique rejects all remaining recs.
2. Iteration N produces fewer than 3 actionable items.
3. User sends `/loop cancel` or invokes `ralph-loop:cancel-ralph`.
4. Context window exceeds 80% — checkpoint to `progress.md`, continue in fresh session per `[[parallel-subagent-economy]]`.
5. Two consecutive iterations produce identical recs — surface as blocker, do not retry.

## Prompt Template

```
/loop 15m implement the next steps and recommendations from the previous iteration's report.
Use the Monitor pattern: decompose in first message, spawn ≤5 parallel specialist agents,
fold outputs, verify, then end with a structured "## Next Iteration Recs" section listing
3-8 concrete actionable items. If fewer than 3 items remain, conclude with "LOOP COMPLETE".
```

## See

- `[[monitor-orchestration]]` — parallel agent decomposition each iteration runs
- `[[opus-quota-fallback]]` — quota discipline for multi-iteration arc spawns
- `[[brian-preferences]]` — end-of-turn report format the loop depends on
- `[[autonomous-engineering]]` — autonomy tier loops assume throughout
- `[[parallel-subagent-economy]]` — fresh-context discipline for subagents
- `[[prompt-as-training-signal]]` — doctrine extraction each iteration is mandatory
