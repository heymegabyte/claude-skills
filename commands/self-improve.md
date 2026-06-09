---
description: Run a learning pass after a major run; fold reusable lessons into global config
argument-hint: [what the run revealed, optional]
---

Run a post-run learning pass per [[prompt-as-training-signal]].

**Purpose** — convert a finished major run into durable, reusable improvements to global config.

**When to use** — after any large multi-agent run, website build, or feature wave; whenever a run "felt" inefficient.

**Inputs** — `$ARGUMENTS` (optional notes); else introspect the current/last run.

Ask + answer each:

- Missing agents? (a role got done by a generic worker that deserves a specialist per [[agent-selection]])
- Weak routing? (wrong model/effort, wrong agent picked)
- Repeated mistakes? (same fix twice → rule)
- Unclear prompts? (ambiguity that cost a round-trip)
- Fragile config? (hooks/settings that broke)
- Missing tests/docs/evals/approval-gates?
- Poor parallelization? (serialized independent work per [[monitor-orchestration]])
- Weak review? (final review missed something)

**Outputs** — for each REUSABLE lesson: append to the owning global file (`~/.claude/CLAUDE.md`, `~/.agentskills/rules/*`, skill, or agent def). Cross-link siblings with `[[name]]`. Skip one-off project details.

**Verification** — every shipped lesson names its destination file + the `[[backlink]]` added; run `git -C ~/.agentskills status` to confirm the edits landed; commit+push the side repo.

**Can update ~/.agentskills or ~/.claude?** YES — that is the entire point of this command.
