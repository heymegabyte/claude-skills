---
description: Run the Agent Diversity Review gate and emit the result table
argument-hint: [run id or scope, optional]
---

Run the Agent Diversity Review gate per [[agent-selection]].

**Purpose** — guarantee the run used the RIGHT mix of specialists, not a monoculture of generic workers.

**When to use** — at the end of every multi-agent run; mandatory inside [[final-review]].

**Inputs** — `$ARGUMENTS` (optional scope); else the current/last run's agent set.

Emit this exact table:

| Review Question | Result | Action Taken |
|---|---|---|
| Did we use a specialist for each distinct role? | | |
| Any role handled by a generic worker that needed a specialist? | | |
| Any two agents with overlapping scope? | | |
| Did each agent have a concrete output contract? | | |
| Was independent work parallelized? | | |
| Did review/approval get its own agent? | | |

**Outputs** — the filled table. For any row whose Action suggests a reusable improvement (new specialist, routing rule, brief template), apply it to the owning global file IMMEDIATELY and cross-link `[[agent-selection]]`.

**Verification** — table has no blank cells; any global edit shows in `git -C ~/.agentskills status` + committed.

**Can update ~/.agentskills or ~/.claude?** YES — the diversity gate updates global config in-turn when an improvement is identified.
