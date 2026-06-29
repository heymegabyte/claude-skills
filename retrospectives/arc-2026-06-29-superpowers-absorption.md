# Arc — Superpowers Absorption + Compression (2026-06-29)

Second pass on the obra/Superpowers vendoring. Pass 1 (2026-06-28) vendored verbatim — 7,103 lines. This pass **absorbed while compressing** to house style and integrated 8 of 30 brainstormed ideas.

## Outcome

- Pack prose **~5,100 → ~1,100 lines** (~78% cut) across 8 skills, technique preserved.
- Biggest cuts: `anthropic-best-practices.md` 1150→17 (now a pointer), `writing-skills/SKILL.md` 434→77, two testing docs merged → one (`testing-skills.md`).
- Lesson captured as a reusable rule so this never recurs: `[[vendored-skill-compression]]`.

## The 30 ideas (★ = integrated this pass)

### Compression & absorption mechanics

1. ★ `[[vendored-skill-compression]]` rule — vendor third-party content compressed, never verbatim.
2. ★ `bin/check-skill-length.mjs` — advisory line-budget audit (SKILL.md ≤250, support ≤350); locks compression.
3. ★ Public content → pointer: `anthropic-best-practices` / `persuasion-principles` link the canonical source, keep only deltas.
4. ★ Absorb overlaps into the canonical owned rule (not a duplicate skill) — applied to all 6 folds + 4 writing-skills insights.
5. A `bin/audit-public-doc-restatement.mjs` that flags large inline blocks duplicating known public docs.

### Authoring leverage

6. ★ Absorb writing-skills' best 4 insights into `[[skill-authoring-contract]]`: SDO (no workflow-summary in description), match-the-form-to-the-failure, ordered-by-weight, human-voice.
7. ★ `[[micro-test-instruction-wording]]` rule — 5-rep + no-guidance-control wording test before shipping guidance.
8. ★ Pack `SKILL.md` as a decision-flow dispatcher (brainstorm→plan→worktree→build→review→finish) + agent map.
9. A `/forge-skill-from-vendored <repo>` command — any third-party skill repo → compressed house-style pack automatically.
10. Skill-description SDO linter (enforce "Use when…" + ≥3 triggers + no workflow summary) as a gate.
11. Skills changelog so skill edits are tracked like code.

### Process glue / glory

12. `/process` slash command running the full chain (brainstorm→plan→worktree→SDD→review→finish).
13. Wire `brainstorming` visual companion to a `/brainstorm` command.
14. Promote `check-skill-length` to an info-gate in `lint-all.sh` after it runs clean ~2 weeks (house cadence).
15. Give-back PR to obra/Superpowers with the compression improvements (broadcast doctrine).
16. Per-pack token-cost line in the always-load budget dashboard.

### Verification / quality

17. PostToolUse hook catching completion claims with no fresh verification (deterministic `verification-before-completion`).
18. Reference TS example for `condition-based-waiting` as `reference/` (polling-not-sleeping).
19. Rationalization-table linter: discipline rules should ship a red-flags list.
20. Eval cases (≥3) for `brainstorming` + `writing-skills` to reach `stable`.

### Debugging / git absorbed-detail

21. `root-cause-tracing` + `defense-in-depth` reference examples → `reference/error-recovery.md`.
22. Reconcile `using-git-worktrees` with native `EnterWorktree`/`ExitWorktree` harness tools (done partially — cross-linked).
23. `finishing-a-development-branch` default = merge + auto-push (done — contradicting "leave it for later" option dropped).

### Router / discoverability

24. Teach `bin/skill-router.py` to list sub-skill folder NAMES for subdir-structured packs (stops `_router.md` line-26 churn).
25. `SKILL_PROFILES.md` entry mapping process skills to project types.
26. Trigger-collision audit between pack 20 triggers and existing skills.

### Distribution / dogfood

27. Each compressed skill states its own line budget and obeys it (eat-the-dogfood badge).
28. `llms.txt` entry for pack 20.
29. Cross-link-graph node connecting pack 20 ↔ the 6 folds ↔ authoring rules.
30. Anti-slop "human-voice" checklist as a reusable copy rule (cross-link `[[copy-writing]]`).

## Next fire (highest-value remaining)

1. (#24) Fix `skill-router.py` for subdir packs — kills recurring router churn.
2. (#9) `/forge-skill-from-vendored` — makes idea #1 one keystroke.
3. (#17) Verification PostToolUse hook — deterministic > rule.
4. (#20) Eval cases to graduate brainstorming + writing-skills to `stable`.
