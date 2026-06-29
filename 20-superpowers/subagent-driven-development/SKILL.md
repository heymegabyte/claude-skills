---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session
---

# Subagent-Driven Development

Execute a plan in ONE session: dispatch a fresh implementer subagent per task → task review (spec + quality) after each → broad whole-branch review at the end. Upstream: <https://github.com/obra/superpowers>.

Fresh-context briefs, fan-out width, and the per-task economy are governed by `[[parallel-subagent-economy]]`; when to decompose-and-fan-out at all by `[[monitor-orchestration]]`. This file covers only what is SDD-specific: the per-task implementer + two-stage review loop.

## Contents

1. When to use vs. alternatives
2. The per-task loop
3. Model selection
4. Handling implementer status
5. Constructing reviewer prompts
6. File handoffs + durable ledger
7. Red flags

## When to Use

- Have a plan + tasks mostly independent + staying in THIS session → this skill.
- Want a parallel session with human checkpoints → `superpowers:executing-plans` instead.
- Tightly-coupled tasks or no plan → brainstorm/manual first.
- Continuous execution: do not check in between tasks. Stop only on unresolvable BLOCKED, genuine ambiguity, or all-done. Narrate ≤1 line between tool calls — the ledger and tool results are the record.

## The Per-Task Loop

1. Read plan once; note global constraints; create todos + check the ledger (§6).
2. Pre-flight: scan the plan for tasks that contradict each other/the constraints, or that mandate something the rubric treats as a defect (test asserting nothing, verbatim-duplicated logic). Batch all findings to the human as one question before Task 1; if clean, proceed silently.
3. Per task: `scripts/task-brief PLAN N` → dispatch implementer (`implementer-prompt.md`). Answer its questions before it proceeds.
4. On DONE: `scripts/review-package BASE HEAD` → dispatch task reviewer (`task-reviewer-prompt.md`) with the printed path.
5. Reviewer returns two verdicts (spec + quality). Critical/Important findings → fix subagent → re-review. Loop until both clean.
6. Mark complete in todos + ledger. Next task.
7. After all tasks: final whole-branch review via `../requesting-code-review/code-reviewer.md`, then `superpowers:finishing-a-development-branch`.

## Model Selection

Least-powerful model that handles the role. Always specify model explicitly — an omitted model inherits the session's (most expensive) model and defeats this.

- Plan text contains the complete code → transcription → cheapest tier.
- Single-file mechanical fix, complete spec → cheap.
- Multi-file integration / pattern-matching / debugging → standard (mid-tier is the floor for reviewers and prose-spec implementers).
- Design judgment / broad codebase understanding → most capable. The final whole-branch review is always this tier.
- Reviewer model scales to the diff's size/risk, not the session default.
- Turn count beats token price: cheapest models take 2-3× the turns on multi-step work, costing more overall.

## Handling Implementer Status

- **DONE** → generate review package, dispatch reviewer.
- **DONE_WITH_CONCERNS** → read concerns first. Correctness/scope → resolve before review; observations → note and proceed.
- **NEEDS_CONTEXT** → provide the missing info, re-dispatch.
- **BLOCKED** → diagnose: context gap → re-dispatch same model with more context; needs reasoning → more capable model; too large → split; plan is wrong → escalate to human. Never retry the same model unchanged; never ignore an escalation.

**Reviewer ⚠️ "cannot verify from diff" items** — requirements in unchanged code or spanning tasks. Non-blocking for the rest of the review, but YOU resolve each before marking complete (you hold the cross-task context the reviewer lacks). A confirmed gap = failed spec review → back to implementer.

## Constructing Reviewer Prompts

Per-task reviews are task-scoped gates; the broad review runs once at the end.

1. **Never pre-judge.** No "do not flag X", "at most Minor", "the plan chose this". If you're tempted to spare yourself a loop, stop — let the reviewer raise it and adjudicate in the loop. The plan's example code is a starting point, not proof its weaknesses were chosen.
2. **BASE is the commit recorded before dispatching the implementer — never `HEAD~1`** (drops all but the last commit of a multi-commit task).
3. Global-constraints block = the reviewer's attention lens. Copy binding requirements verbatim from the plan: exact values, formats, stated relationships ("same layout as X"). Process rules (YAGNI, test hygiene) are already in the template.
4. No open-ended directives ("check all uses", "run race tests if useful") without a concrete task-specific reason. Don't ask it to re-run tests the implementer already ran on the same code.
5. **Plan-mandated findings** (or any finding conflicting with plan text) → the human decides: present finding + plan text, ask which governs. Don't dismiss it; don't dispatch a contradicting fix without asking.
6. Fix dispatches carry the implementer contract: re-run the covering tests (name them — a one-line fix doesn't need the full suite), report command + output. Confirm all three present before re-review.
7. Critical/Important → fix subagents. Minor → ledger, fed to the final review for triage. Final-review findings → ONE fix subagent with the full list, not one fixer per finding (each rebuilds context + re-runs suites).
8. Final review gets its own package: `scripts/review-package $(git merge-base main HEAD) HEAD`.

## File Handoffs + Durable Ledger

Everything pasted into a dispatch — and everything a subagent prints back — stays resident in your context and is re-read every later turn. Move artifacts as files.

- **Brief** — `scripts/task-brief PLAN N` extracts the task to a file. Dispatch = (1) one line on where the task fits; (2) brief path ("read first — your requirements, exact values verbatim"); (3) interfaces/decisions from earlier tasks the brief can't know; (4) your resolution of any ambiguity you spotted; (5) report-file path + contract. Exact values live ONLY in the brief.
- **Report** — name it after the brief (`task-N-brief.md` → `task-N-report.md`). Implementer writes full detail there, returns only status + commits + one-line test summary + concerns.
- **Reviewer** gets three paths — brief, report, review-package — plus the binding global constraints.
- Never paste accumulated prior-task summaries into later dispatches (a real session hit 42k chars, 99% pasted history). A fresh subagent needs its task, the interfaces it touches, the constraints. Nothing else.

**Ledger** — conversation memory dies at compaction; controllers have re-dispatched entire completed sequences (most expensive failure observed). Track in `$(git rev-parse --show-toplevel)/.superpowers/sdd/progress.md`:

- At start, `cat` it — tasks marked complete are DONE, resume at the first unmarked one.
- On a clean review, append (same message as other bookkeeping): `Task N: complete (commits <base7>..<head7>, review clean)`.
- After compaction, trust the ledger + `git log` over recollection. `git clean -fdx` destroys it (git-ignored scratch) → recover from `git log`.

## Red Flags — Never

- Implement on main/master without explicit consent.
- Skip task review, or accept a report missing either verdict (spec AND quality both required).
- Dispatch multiple implementers in parallel (conflicts).
- Make a subagent read the whole plan (hand it the brief).
- Dispatch a task reviewer without a diff file — generate it first.
- Move to the next task with open Critical/Important findings, or accept "close enough" on spec.
- Let implementer self-review replace actual review (both needed).
- Re-dispatch a task the ledger already marks complete.

## Prompt Templates + Integration

- `implementer-prompt.md` · `task-reviewer-prompt.md` · final review: `../requesting-code-review/code-reviewer.md`.
- Workflow skills: `superpowers:using-git-worktrees` (isolated workspace), `superpowers:writing-plans` (creates the plan), `superpowers:finishing-a-development-branch` (completion). Subagents follow `superpowers:test-driven-development` per task.
