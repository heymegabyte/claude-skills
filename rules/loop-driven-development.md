---
last_reviewed: 2026-06-29
superseded_by: null
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
  - "convergence loop"
  - "infinite loop"
  - "self-cancel"
paths:
  - "CONVERGENCE_*.md"
  - "converge*.sh"
  - "ralph*.md"
---
<!-- grow-ok: added the "Every loop MUST terminate — no infinite polish" mandate (DONE gate + 3 stops + self-cancel) per Brian 2026-06-26; offset by scoping paths off ["*"] so net every-prompt load DROPPED. -->

## Why this grew

Added the **Every loop MUST terminate — no infinite polish** mandate (terminal DONE gate as a command + three stops + self-cancel) after Brian's 2026-06-26 directive to kill perpetual convergence loops. Net every-prompt cost still fell: `paths` was scoped off `["*"]`, removing the whole file (~2031 tok) from the always-load set — it now loads via its loop/convergence triggers instead.

# Loop-Driven Development

Structured pattern for compounding AI work across recurring iterations on a single surface.

## Every loop MUST terminate — no infinite polish (HARD RULE)

- **A loop without a defined, checkable DONE state is banned.** Before arming ANY recurring loop (`/loop`, `converge.sh`, a Ralph loop, an autonomous-build cron), define the terminal condition as a COMMAND that returns DONE/NOT-DONE — never a vibe, never a "never-satisfied ratchet", never "perpetually un-done".
- **"Never declare converged / progressively-more-forever / six-dimensions-100%-isn't-finished" framings are forbidden.** A finished product is the goal; reaching it ENDS the loop. Completeness and polish are real terminal states, not asymptotes.
- **The terminal gate, for an app, is: feature-complete + deployed + fully E2E-tested (a real Playwright smoke suite GREEN on prod).** The loop drives toward that gate; the final pass ships the E2E proof that flips it; then the loop **cancels itself** (write a `*_DONE` sentinel, stop the driver, `CronDelete`/`ralph-loop:cancel-ralph` any scheduler).
- **Three independent stops guarantee termination** (whichever fires first): (1) DONE gate green → self-cancel; (2) no-progress streak — K consecutive passes with no commit ⇒ nothing left to advance (or only human-held items remain) → surface the blockers + stop; (3) hard pass-ceiling backstop → stop unconditionally. Wire all three; never rely on the gate alone.
- **A sustained green→green no-op is a STOP signal, not "keep grinding".** While the gate is RED a no-op pass is a failure (a gap was left open); once the gate is GREEN or progress has stalled for K passes, the loop is done — do not manufacture cosmetic churn to keep it alive.
- Reference impl: brickcitylabor.com `converge.sh` + `convergence-done-check.sh` (sentinel `CONVERGENCE_DONE`, `CONVERGE_MAX_PASSES`/`CONVERGE_MAX_NO_PROGRESS` backstops, self-cancel of `converge-resident.sh`).

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
5. **Convergence signal** — terminate when the DONE gate is green (above) OR self-critique rejects all remaining recs OR fewer than 3 actionable items remain. Content-based, never time-based. On terminate, SELF-CANCEL — don't leave a finished loop firing.

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

1. **DONE gate green** — the loop's defined terminal command returns DONE (for an app: feature-complete + deployed + prod Playwright smoke suite green). Write the `*_DONE` sentinel + self-cancel.
2. **Hard pass-ceiling backstop** — total passes ≥ MAX (e.g. 300); stop unconditionally however the gates read.
3. **No-progress streak** — K consecutive passes with no commit ⇒ nothing left to advance (or only human-held items remain); surface the `### ⛔ NEEDS BRIAN` blockers + stop.
4. Self-critique rejects all remaining recs / iteration N produces fewer than 3 actionable items.
5. User sends `/loop cancel` or invokes `ralph-loop:cancel-ralph`.
6. Context window exceeds 80% — checkpoint to `progress.md`, continue in fresh session per `[[parallel-subagent-economy]]`.
7. Two consecutive iterations produce identical recs — surface as blocker, do not retry.

## Prompt Template

```
/loop 15m implement the next steps and recommendations from the previous iteration's report.
First run the DONE gate (the project's terminal command — e.g. `npm run converge:done` /
feature-complete + deployed + prod Playwright smoke suite green). If it returns DONE: write the
*_DONE sentinel, cancel this loop (`/loop cancel` or `ralph-loop:cancel-ralph`), conclude "LOOP
COMPLETE — self-cancelled", and STOP. Otherwise use the Monitor pattern: decompose in first
message, spawn ≤5 parallel specialist agents, fold outputs, verify, end with a structured
"## Next Iteration Recs" of 3-8 concrete items. Hard stop after MAX passes or K no-progress
passes regardless of gate state — the loop is finite.
```

## See

- `[[monitor-orchestration]]` — parallel agent decomposition each iteration runs
- `[[opus-quota-fallback]]` — quota discipline for multi-iteration arc spawns
- `[[brian-preferences]]` — end-of-turn report format the loop depends on
- `[[autonomous-engineering]]` — autonomy tier loops assume throughout
- `[[parallel-subagent-economy]]` — fresh-context discipline for subagents
- `[[prompt-as-training-signal]]` — doctrine extraction each iteration is mandatory
