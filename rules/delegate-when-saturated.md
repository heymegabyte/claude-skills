---
name: "delegate-when-saturated"
priority: 2
pack: "core"
triggers:
  - "saturated"
  - "context full"
paths:
  - "*"
---

# Delegate When Saturated

When the orchestrator (main thread) is deep in a long session AND the remaining work is
**bounded + mechanical** (renames, codemods, repetitive sub-batches, find-replace-verify
loops), do NOT grind it out in the saturated main context. Error rate rises with context
depth, and the work doesn't need the accumulated context. Instead, spawn a **FRESH-CONTEXT
subagent** with the **minimum sufficient brief** to complete one bounded unit, verify, and
commit. The orchestrator coordinates, sequences, and verifies — it does not personally
perform large mechanical refactors while saturated.

## When this fires

- The main thread has been running a long session (high context use) AND
- The remaining work is repetitive/mechanical with a known recipe (e.g. "rename `waveN_*`
  identifiers to descriptive names across N files, migrate, verify") AND
- A clean-context agent could do the unit reliably with a short brief.

## The minimal-brief contract

- Pass the **recipe** (the exact step sequence + gotchas), the **scope** (the specific
  files/identifiers — found by a quick grep the orchestrator runs FIRST), the **verify
  gates** (typecheck + tests + the project's gate command), and "commit when green."
- **Never tell the agent to read a huge shared file wholesale** (e.g. a 1000-line
  `index.ts` / `App.tsx`) — that blows its context ("prompt too long", the failure mode
  seen 2026-06-08). Give it the exact identifiers/line-targets to grep + edit in place.
- Keep the brief 150-400 words. Include collision-checks + the "scope edits to SPECIFIC
  identifiers, never blanket" rule so it can't corrupt sibling work.

## Parallelism

- Sub-batches that touch DISJOINT files → fan out parallel agents (single message).
- Sub-batches that all edit a HOT shared file (mounts in `index.ts`, an allowlist, a
  barrel export) → either run fresh agents SEQUENTIALLY, or give each a worktree
  (`isolation: "worktree"`) and merge with care. Naive parallel edits to one hot file
  collide. Per `monitor-orchestration` the orchestrator decomposes; per `full-autonomy`
  sub-agent prompts stay 100-300 words.
- "Too much for one agent" → split into more sub-batches, more agents — not a bigger brief.

## Constraint — subagents inherit the project CLAUDE.md

A subagent is NOT a blank slate: it loads the project's `CLAUDE.md` + the global rules into
its context before your brief. In a **CLAUDE.md-heavy repo** (brickcitylabor's is ~20k
tokens), that base already eats most of the window — so a subagent that reads even one large
file ("prompt too long", repeatedly seen 2026-06-08) dies before doing useful work. Therefore:

- The biggest "fresh context" lever is a **fresh MAIN session**, not a subagent. When the
  orchestrator is saturated and the work is bounded, the cleanest move is often to surface the
  exact recipe + scope to the user and let them re-run it in a new session where the main
  agent has full headroom — OR continue in-session only if the unit is tiny.
- If delegating to a subagent in a CLAUDE.md-heavy repo: the agent must read **near-zero**
  files (give it the literal line targets + `perl` commands; no exploratory reads), and the
  brief must be <250 words. Even then, expect failures — have a fallback.
- Consider a leaner agent type (e.g. `Explore` for read-only) or trimming the project
  CLAUDE.md if subagent delegation is needed often.

## The orchestrator's job during delegation

- Pre-flight the grep/collision-check (cheap, scopes the brief).
- Spawn the fresh agent(s) with the minimal brief.
- On return: run the gate, fold/verify, sequence the next unit. Don't re-do the agent's work.
