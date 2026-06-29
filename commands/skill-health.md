---
description: Run quality-scores + token-budget + dep-graph, interpret results, flag missing budgets, orphans, and oversize skills
argument-hint: [optional pack filter]
---

Run the full skill health suite against the plugin's SKILL.md files.

**Purpose** — catch structural decay: skills without descriptions, budgets, dependencies, or pack membership.

**When to use** — `/skill-health` after any skill add/edit; weekly audit; before release.

**Inputs** — `$ARGUMENTS` (optional pack name to scope). Runs all three tools in sequence.

## Checks

1. **Quality scores** — `node bin/skill-quality-scores.mjs [--threshold <12>]` — flag skills scoring ≤12/18.
   - Missing descriptions → un-triggerable, add a description.
   - Missing budgets → no token accountability, add `<!-- budget: ~N -->`.
   - Missing pack membership → orphan, add `pack:` to frontmatter or add to `_packs/*.yml`.

2. **Token budgets** — `node bin/skill-token-budget.mjs [--pack $ARGUMENTS]` — total budget and slot-level breakdown.
   - Unstamped skills (no `<!-- budget: ~N -->`) — estimate their size, stamp them.
   - Over-budget packs — total pack budget > ~500 tokens → consider splitting or compression.

3. **Dependency graph** — `node bin/skill-dep-graph.mjs [--pack $ARGUMENTS]` — adjacency and pack density.
   - Packs with >15 members — consider sub-pack split ([[repo-folder-hygiene]] § ≤10 rule).
   - Orphans (not in any pack) — assign to an existing pack or create a new one.
   - Cycle report — overlapping membership across >3 packs suggests a refactor.

## Outputs

- Quality scores ranked table plus improvement candidates
- Budget summary with unstamped skills
- Dependency graph adjacency and modularization suggestions

For each finding, produce one bullet with skill · problem · fix path.

**Verification** — re-run `/skill-health` after applying fixes; zero findings = pass.

**Can update** `_packs/*.yml`, SKILL.md frontmatter, or skill body (add budget markers, descriptions, pack assignment).
