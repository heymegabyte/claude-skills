---
description: Chain the full Superpowers process flow — brainstorm → plan → worktree → build → review → finish — on one slash command
argument-hint: <task-description>
---

<!-- <SUBAGENT-STOP>: skip this skill when running inside a subagent. Meta-skills must not leak into spawned subagent contexts. -->
<SUBAGENT-STOP/>

Run the full process chain from `20-superpowers` (vendored from obra/Superpowers, MIT), compressed to house style. This is the keystone command — from a one-line task description to a merged, deployed, verified change.

## The chain (inviolable order)

1. `20/brainstorming` — explore intent, requirements, and design BEFORE any code. Present design → get approval → write `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`.
2. `20/writing-plans` — turn the approved design into a written plan with bite-sized verifiable steps.
3. `20/using-git-worktrees` — isolate the workspace (`EnterWorktree` or `git worktree`). Skip if already in one.
4. `20/subagent-driven-development` — one implementer subagent per independent task, task review after each, whole-branch review at the end.
5. `20/requesting-code-review` — dispatch the `code-reviewer` agent + Agent Diversity Review gate (`[[agent-selection]]`).
6. `20/receiving-code-review` — verify feedback technically, then act. Push back if wrong.
7. `20/finishing-a-development-branch` — merge + push + clean up. Auto-push per `[[no-staging-doctrine]]`.

## Shortcuts

- Truly trivial (typo, one-line, no risk) → skip brainstorm/plan, go straight to worktree (if needed) → build → finish.
- Solo work with no human reviewer → skip requesting/receiving review; Agent Diversity Review gate alone suffices.
- Already in an isolated worktree from a prior task → skip step 3.
- The `using-superpowers` skill-check (brainstorm before ANY creative work) is now native to this command — you don't need to invoke it separately.

## See

- `20-superpowers/SKILL.md` — the pack dispatcher with the decision flow + agent map
- `SKILL_PROFILES.md` § Process skills — add these per project type
- `[[no-staging-doctrine]]` — auto-push is the default here
- `[[main-only-branch]]` — worktrees for isolation, main always committed
