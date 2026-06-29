# Provenance & Attribution

The skills in this pack are **vendored** from [obra/Superpowers](https://github.com/obra/Superpowers) (the `superpowers` plugin), authored by **Jesse Vincent** and licensed **MIT**. See `LICENSE-superpowers` for the full license + copyright notice (required by MIT).

- **Upstream version vendored:** `6.0.3`
- **Vendored on:** 2026-06-28; **compressed to house style:** 2026-06-29
- **Why vendored (not plugin):** to bring these into the owned/durable `heymegabyte-claude-skills` layer — editable, versioned with this repo, and free of third-party auto-update drift. The upstream marketplace plugin was disabled after vendoring so there is **one source of truth** and no duplicate skill names.

## What was vendored vs folded

This pack holds the **8 non-overlapping** Superpowers skills (no equivalent existed in this repo):

- `brainstorming` · `writing-plans` · `writing-skills` · `subagent-driven-development`
- `using-git-worktrees` · `finishing-a-development-branch` · `requesting-code-review` · `receiving-code-review`

The **overlapping** Superpowers skills were *folded* (techniques only, attributed) into existing rules rather than duplicated:

- `test-driven-development` → `rules/e2e-tdd-organization.md`
- `systematic-debugging` → `rules/error-recovery.md`
- `verification-before-completion` → `rules/verification-loop.md`
- `dispatching-parallel-agents` → `rules/parallel-subagent-economy.md`
- `executing-plans` → `rules/monitor-orchestration.md`
- `using-superpowers` → cross-link in `01-operating-system` (its discipline already lives there)

## Local modifications

Skill bodies are **compressed to house style** (per `[[vendored-skill-compression]]`) — the technique is preserved, the upstream verbosity is not. Pack prose went ~5,100 → ~1,100 lines.

1. Public docs are **pointers, not copies**: `writing-skills/anthropic-best-practices.md` (1150→17) and `persuasion-principles.md` (220→18) link their canonical sources + keep only local deltas.
2. The two testing docs were merged into one `writing-skills/testing-skills.md`.
3. Overlapping content is cross-linked to the owned rule, not restated (e.g. worktrees → `[[main-only-branch]]`, SDD → `[[monitor-orchestration]]`).
4. `writing-skills` best insights (SDO, match-the-form, ordered-by-weight, human-voice) were absorbed into `[[skill-authoring-contract]]`.
5. Scripts (`brainstorming/scripts/*`, `subagent-driven-development/scripts/*`) are kept intact — code, not prose.
