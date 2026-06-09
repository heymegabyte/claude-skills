---
description: Review ~/.claude/CLAUDE.md + rules for contradictions, stale guidance, duplication; consolidate
argument-hint: [focus area, optional]
---

Audit global prompt config for contradictions, staleness, and duplication.

**Purpose** — keep `~/.claude/CLAUDE.md` + `~/.agentskills/rules/*` internally consistent and lean.

**When to use** — periodically, or after several rules were added in quick succession.

**Inputs** — `$ARGUMENTS` (optional focus area); else sweep the whole rule mesh.

Check for:

- Contradictions — two rules giving conflicting guidance (resolve via [[brian-preferences]] conflict order).
- Stale guidance — dated tech, retired models, deprecated patterns.
- Duplication — same guidance in 2+ places (consolidate to the canonical owner, leave `[[backlinks]]`).
- Orphan cross-links — `[[name]]` pointing to a missing file.
- Density drift — paragraphs where bullets belong per [[brian-preferences]] file format.

**Outputs** — a consolidation report (issue · resolution). Apply fixes in-turn: merge duplicates, fix contradictions, prune stale lines, repair links.

**Verification** — re-grep for the resolved contradiction/duplicate to confirm single source; `git -C ~/.agentskills status` shows edits + commit+push.

**Can update ~/.agentskills or ~/.claude?** YES — consolidation edits land in the global files in-turn.
