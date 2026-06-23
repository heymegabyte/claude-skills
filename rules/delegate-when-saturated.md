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

When the orchestrator is deep in a long session AND remaining work is **bounded + mechanical** (renames, codemods, repetitive sub-batches, find-replace-verify loops), spawn a **FRESH-CONTEXT subagent** with the **minimum sufficient brief** rather than grinding in saturated context. Error rate rises with context depth; the work doesn't need accumulated context.

## When this fires

ALL of:

- Main thread has high context use AND
- Remaining work is repetitive/mechanical with a known recipe AND
- A clean-context agent could do it reliably with a short brief

## The minimal-brief contract

- Pass: **recipe** (exact steps + gotchas) · **scope** (specific files/identifiers — grep FIRST) · **verify gates** (typecheck + tests + gate command) + "commit when green"
- **Never tell the agent to read a huge shared file wholesale** (e.g. 1000-line `index.ts`) — that blows its context ("prompt too long", seen 2026-06-08). Give exact identifiers/line-targets to grep + edit in place.
- Brief: 150-400 words. Include collision-checks + "scope edits to SPECIFIC identifiers, never blanket."

## Parallelism

- Sub-batches touching DISJOINT files → fan out parallel agents (single message)
- Sub-batches all editing ONE hot file (mounts in `index.ts`, barrel export, allowlist) → run fresh agents SEQUENTIALLY, or use `isolation: "worktree"` + merge carefully. Naive parallel edits to one hot file collide.
- "Too much for one agent" → split into more sub-batches — NOT a bigger brief

## Constraint — subagents inherit project CLAUDE.md

A subagent loads project `CLAUDE.md` + global rules before your brief. In a CLAUDE.md-heavy repo (~20k tokens), that base eats most of the window — a subagent reading even one large file ("prompt too long", seen 2026-06-08) dies before useful work.

Therefore:

- **The biggest "fresh context" lever is a fresh MAIN session**, not a subagent. When orchestrator is saturated + work is bounded, surface the exact recipe + scope to user for a new session — OR continue in-session only if the unit is tiny.
- In CLAUDE.md-heavy repos: agent must read **near-zero** files (give literal line targets + `perl` commands; no exploratory reads); brief <250 words. Even then, have a fallback.
- Consider leaner agent type (`Explore` for read-only) or trimming project CLAUDE.md if delegation is needed often.

## The orchestrator's job during delegation

- Pre-flight the grep/collision-check (cheap; scopes the brief)
- Spawn fresh agent(s) with minimal brief
- On return: run the gate, fold/verify, sequence the next unit — don't redo the agent's work
