---
name: "superpowers"
description: "Process & collaboration discipline vendored from obra/Superpowers (MIT). Eight invokable sub-skills: brainstorming (before any creative work), writing-plans, executing via subagent-driven-development, using-git-worktrees, finishing-a-development-branch, requesting-code-review, receiving-code-review, writing-skills. The overlapping Superpowers techniques (TDD, systematic-debugging, verification-before-completion, dispatching-parallel-agents) are folded into existing rules — see § Folded. Fires when starting creative work, planning a multi-step task, isolating a workspace, wrapping a branch, or giving/getting code review."
when_to_use: "Process skills that govern HOW to approach work — invoke BEFORE implementation skills. Brainstorm before building; plan before coding; worktree before isolated work; code review before merge; finish-branch when done."
effort: "high"
model: "inherit"
priority: 2
pack: "core"
triggers:
  - "brainstorm"
  - "let's build"
  - "write a plan"
  - "implementation plan"
  - "git worktree"
  - "isolate workspace"
  - "code review"
  - "review my code"
  - "finish branch"
  - "merge this"
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

# Superpowers — Process & Collaboration Discipline

*Vendored from [obra/Superpowers](https://github.com/obra/Superpowers) (MIT, Jesse Vincent), v6.0.3. See `NOTICE.md` + `LICENSE-superpowers`. These are **process skills**: they decide HOW to approach a task and run BEFORE implementation skills.*

## Priority (when multiple apply)

- Process first: `brainstorming` / `writing-plans` before any build; `systematic-debugging` (now in `[[error-recovery]]`) before any fix.
- "Let's build X" → brainstorm, then plan, then implement. "Fix bug Y" → debug-method first, then fix.

## The 8 vendored sub-skills — route by intent

- **brainstorming** — `brainstorming/SKILL.md`. MUST run before ANY creative work (new feature, component, behavior change). Explores intent + requirements + design before code. Has an optional zero-dep visual companion server (`brainstorming/scripts/server.cjs`, see `brainstorming/visual-companion.md`).
- **writing-plans** — `writing-plans/SKILL.md`. Turn a spec/requirements into a written multi-step implementation plan before touching code. Pairs with this repo's `/generate-prp` + `/writing-plans` flow.
- **subagent-driven-development** — `subagent-driven-development/SKILL.md`. Execute a written plan's independent tasks via subagents in the current session. Complements `[[monitor-orchestration]]` + `[[parallel-subagent-economy]]`.
- **using-git-worktrees** — `using-git-worktrees/SKILL.md`. Create an isolated workspace before feature work. Aligns with `[[main-only-branch]]` (worktrees for isolation, `main` always committed).
- **finishing-a-development-branch** — `finishing-a-development-branch/SKILL.md`. When work is complete + tests pass, choose merge / PR / cleanup. Honors `[[main-only-branch]]` + `[[no-staging-doctrine]]`.
- **requesting-code-review** — `requesting-code-review/SKILL.md`. Before merge, dispatch a reviewer (see `requesting-code-review/code-reviewer.md`). Complements this repo's Agent Diversity Review gate.
- **receiving-code-review** — `receiving-code-review/SKILL.md`. Verify feedback technically before acting — no performative agreement, no blind implementation.
- **writing-skills** — `writing-skills/SKILL.md`. Author/edit/test skills. Read alongside this repo's `[[skill-authoring-contract]]` (owned format rules win on conflict).

## Folded — overlapping techniques live in existing rules (not duplicated here)

Per `repo-folder-hygiene` (one canonical per doc class), the overlapping Superpowers skills were folded into owned rules, attributed:

- **test-driven-development** → `[[e2e-tdd-organization]]` § Folded from Superpowers
- **systematic-debugging** → `[[error-recovery]]` § Folded from Superpowers
- **verification-before-completion** → `[[verification-loop]]` § Folded from Superpowers
- **dispatching-parallel-agents** → `[[parallel-subagent-economy]]` § Folded from Superpowers
- **executing-plans** → `[[monitor-orchestration]]` § Folded from Superpowers
- **using-superpowers** → discipline already in `01-operating-system` (skill-check before action)

## Conflict precedence

- This repo's `01-operating-system` + `rules/*` + Brian's preferences WIN over any vendored guidance on conflict (per the repo's Conflict Resolution order).
- Vendored skill bodies are kept verbatim for fidelity; repo-specific routing lives in THIS dispatcher.
