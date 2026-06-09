---
description: Orchestrate the final review fan-out (integration + diversity + risk + release readiness)
argument-hint: [scope, optional]
---

Orchestrate the final review fan-out per [[agent-selection]].

**Purpose** — gate the run with a parallel review swarm before declaring DONE.

**When to use** — at the end of every major run / website build / feature wave.

**Inputs** — `$ARGUMENTS` (optional scope); else the full run output.

Fan out in ONE multi-tool message per [[monitor-orchestration]]:

- **final-integration-reviewer** — do the parts cohere, no broken seams, no orphaned work?
- **agent-diversity-reviewer** — runs the Agent Diversity Review gate (see below).
- **risk-and-approval-reviewer** — irreversible actions, payment/auth/security surfaces, approval gates honored?
- **release-readiness-reviewer** — deploy + prod-E2E + a11y + perf gates per [[verification-loop]].

MUST include the Agent Diversity Review table:

| Review Question | Result | Action Taken |
|---|---|---|
| Specialist per distinct role? | | |
| Any generic-worker overuse? | | |
| Any scope overlap? | | |
| Concrete output contracts? | | |
| Independent work parallelized? | | |
| Review/approval got its own agent? | | |

**Outputs** — folded review verdict (PASS/FAIL per reviewer) + the diversity table + the fix list (shipped in-turn per [[auto-integrate-recs]]).

**Verification** — every reviewer returned a verdict; all FAILs fixed + re-verified; release-readiness green.

**Can update ~/.agentskills or ~/.claude?** YES — via the diversity gate, when an improvement is identified (commit+push).
