# Provenance & Attribution

The skills in this pack are **vendored** from [obra/Superpowers](https://github.com/obra/Superpowers) (the `superpowers` plugin), authored by **Jesse Vincent** and licensed **MIT**. See `LICENSE-superpowers` for the full license + copyright notice (required by MIT).

- **Upstream version vendored:** `6.0.3`
- **Vendored on:** 2026-06-28
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

Skill bodies are kept verbatim from upstream to preserve fidelity. Repo-specific routing/cross-links live in this pack's `SKILL.md` dispatcher, not in the vendored skill files.
