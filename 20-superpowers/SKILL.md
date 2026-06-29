---
name: "superpowers"
description: "Use when starting creative work, planning a multi-step task, isolating a workspace, wrapping a branch, or giving/getting code review. Not when the task is a one-line fix with no design surface."
when_to_use: "Process skills that govern HOW to approach work — invoke BEFORE implementation skills. Brainstorm before building; plan before coding; worktree before isolated work; review before merge; finish-branch when done."
effort: "high"
model: "inherit"
priority: 2
pack: "core"
stage: stable
triggers:
  - "brainstorm"
  - "let's build"
  - "write a plan"
  - "implementation plan"
  - "git worktree"
  - "code review"
  - "review my code"
  - "finish branch"
  - "write a skill"
  - "subagent driven"
paths:
  - "*"
submodules:
  - brainstorming/SKILL.md
  - writing-plans/SKILL.md
  - subagent-driven-development/SKILL.md
  - using-git-worktrees/SKILL.md
  - finishing-a-development-branch/SKILL.md
  - requesting-code-review/SKILL.md
  - receiving-code-review/SKILL.md
  - writing-skills/SKILL.md
---

# Superpowers — Process Discipline

Vendored from [obra/Superpowers](https://github.com/obra/Superpowers) (MIT, Jesse Vincent), compressed to house style — see `NOTICE.md`. These are **process skills**: they decide HOW to approach a task and run BEFORE implementation skills. On conflict, this repo's `01-operating-system` + `rules/*` + Brian's preferences win.

## The flow (route by where you are)

1. **Starting anything creative?** → `brainstorming/SKILL.md` — explore intent + design before code. Non-negotiable first step.
2. **Have requirements, multi-step?** → `writing-plans/SKILL.md` — write the plan before touching code.
3. **Work needs isolation?** → `using-git-worktrees/SKILL.md` — spin an isolated workspace (`[[main-only-branch]]`).
4. **Executing the plan?** → `subagent-driven-development/SKILL.md` — one subagent per task + two-stage review (`[[monitor-orchestration]]`, `[[parallel-subagent-economy]]`).
5. **Before merge?** → `requesting-code-review/SKILL.md` — dispatch the `code-reviewer` agent + Agent Diversity Review (`[[agent-selection]]`).
6. **Got feedback?** → `receiving-code-review/SKILL.md` — verify it technically, then act; no blind agreement.
7. **Tests green, done?** → `finishing-a-development-branch/SKILL.md` — merge / PR / cleanup (`[[no-staging-doctrine]]`, auto-push).

**Authoring a skill itself?** → `writing-skills/SKILL.md` + `[[skill-authoring-contract]]` (the house authoring rule, where the SDO / match-the-form / ordered-by-weight insights now live).

## Agent map

- `requesting-code-review` → the `code-reviewer` agent + diversity gate.
- `subagent-driven-development` → `meta-orchestrator` / parallel `Agent` spawns.
- `brainstorming` → pairs with `14-independent-idea-engine`.

## Folded — these live in rules/, not duplicated here

- `test-driven-development` → `[[e2e-tdd-organization]]`
- `systematic-debugging` → `[[error-recovery]]`
- `verification-before-completion` → `[[verification-loop]]`
- `dispatching-parallel-agents` → `[[parallel-subagent-economy]]`
- `executing-plans` → `[[monitor-orchestration]]`
- `using-superpowers` → `01-operating-system` (skill-check before action)
- writing-skills best insights (SDO, match-the-form, ordered-by-weight, human-voice) → `[[skill-authoring-contract]]`

<!-- budget: ~63 -->
