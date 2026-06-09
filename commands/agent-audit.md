---
description: Audit agents spawned in the current/last run against the agent-selection taxonomy
argument-hint: [run id or description, optional]
---

Audit the run's agent fan-out per [[agent-selection]].

**Purpose** — catch agent misuse: generic-worker overuse, scope overlap, vague output contracts.

**When to use** — right after a multi-agent run; whenever decomposition felt sloppy.

**Inputs** — `$ARGUMENTS` (optional run pointer); else introspect the last `Agent` spawns.

Check each spawned agent:

- Generic-worker overuse — did a vanilla agent do work a registered specialist should own?
- Scope overlap — did two agents touch the same files/role without a clear boundary?
- Vague output — did the brief lack a concrete `Outputs` contract (≤200-word summary, owned files)?
- Brief length — 100-300 words per [[full-autonomy]]; beyond = cloning context.
- Parallelization — was independent work serialized per [[monitor-orchestration]]?

**Outputs** — a findings list (one bullet per issue: agent · problem · fix). For each REUSABLE gap (a recurring role with no specialist, a missing routing rule), update the owning global file + cross-link `[[agent-selection]]`.

**Verification** — every finding maps to a concrete next action; if a global edit was made, `git -C ~/.agentskills status` confirms it + commit+push.

**Can update ~/.agentskills or ~/.claude?** YES — only when a reusable gap is found (not for one-off run nits).
