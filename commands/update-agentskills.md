---
description: Apply a reusable lesson to ~/.agentskills (rules/skills/templates/commands), backup + commit + push
argument-hint: <lesson to encode>
---

Encode a reusable lesson into the `~/.agentskills` side repo per [[prompt-as-training-signal]].

**Purpose** — durably persist a generalizable lesson into the global skills repo so it surfaces in future sessions.

**When to use** — whenever a run produces a reusable rule, skill update, template, or command worth keeping.

**Inputs** — `$ARGUMENTS` = the lesson (the generalizable pattern, not project specifics).

Steps:

- Generalize first — write the CLASS of gap, not the one-off instance (instance becomes a `## Reference incident`).
- Locate the owning file (rule / skill / template / command). UPDATE existing, never duplicate.
- Backup the target file before edit (`cp <file> <file>.bak` or rely on git).
- Apply the edit; match sibling density + bullet format per [[brian-preferences]].
- Cross-link `[[siblings]]` both directions.
- `git -C ~/.agentskills add -A && git -C ~/.agentskills commit && git -C ~/.agentskills push` (side repo → always push per [[brian-preferences]] Git policy).

**Outputs** — the edited file path, the `[[backlinks]]` added, the commit hash.

**Verification** — `git -C ~/.agentskills log -1 --stat` shows the change pushed; desktop skill-sync hook picks it up next prompt.

**Can update ~/.agentskills or ~/.claude?** YES — this command's sole job.
