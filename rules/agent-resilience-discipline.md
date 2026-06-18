---
name: "agent-resilience-discipline"
priority: 1
pack: "core"
triggers:
  - "connection drop"
  - "agent brief"
  - "multi-file agent"
  - "write files"
  - "tool call order"
  - "partial work"
  - "mid-stream failure"
  - "agent resilience"
paths:
  - "*"
---

# Agent Connection-Drop Resilience

Agents run in streamed tool-call pipelines. A dropped connection, timeout, or mid-stream
failure leaves the response buffer incomplete — any work done AFTER the failure point is
lost. Any work done BEFORE the failure point (writes already flushed) **survives**.

The discipline: structure every multi-file agent brief so that the highest-priority
artifact is written first, in its own `Write` call, before any other work.

---

## Reference Incident: 2026-06-18 Task #32

Task #32 was a three-file agent brief. The agent spent **16 tool_uses** on research,
planning, reading, and analysis before writing a single file. On the 16th call, the
connection dropped. **0 files were written.** All work was lost.

The retry took **2 tool calls**: `Write` file 1, `Write` file 2. Both survived because
the agent committed them immediately rather than batching them at the end.

Lesson: research-before-write is fine. Research-before-ALL-writes is a liability.
The first `Write` should fire as early as possible in the agent's lifecycle — before
deep analysis, before optional reads, before anything that could timeout.

---

## The Pattern: Write in Priority Order, One Call Per File

### Why it works

Each `Write` call is **atomic and durable** at the filesystem level. Once Claude
Code's `Write` tool returns success, the file exists on disk. A subsequent connection
drop or timeout cannot un-write it. The next retry agent inherits the partially-complete
state and needs only to write the remaining files.

Partial progress is recovery progress. A brief that writes file 1 before it crashes
leaves the operator 33% done on a 3-file task — not 0% done.

### Why batching fails

`MultiEdit` (or a single `Write` that tries to do too much) is all-or-nothing at the
call level. If the response stream cuts mid-call, NOTHING is written. A sequence of
separate `Write` calls fails independently — each call that completed is preserved.

Spending many tool calls on research before any write is the same trap: when the
failure comes, zero durable output exists despite significant compute spent.

---

## Brief-Template Guidance

Every multi-file agent brief MUST include a write-order mandate in the brief itself.
The phrasing to bake in:

> **Write file 1 first via `Write` tool. Then write file 2. Then write file 3.**
> **If the connection drops, file 1 is preserved — the retry agent picks up from file 2.**

Do not say "write all files at the end" or "research first, then write." The brief
controls the agent's execution order; if the brief doesn't specify write-first, the
agent defaults to research-heavy patterns.

### Template (copy-paste into any multi-file brief)

```
## File write order (resilience mandate)
Write files in this exact sequence — one Write call per file, in priority order:
1. [File 1 path] — write this FIRST, before any optional reads or analysis
2. [File 2 path] — write after File 1 is confirmed written
3. [File 3 path] — write after File 2 is confirmed written

Each Write is atomic. If the connection drops, files already written survive.
Retry agents inherit partial state and write only the remaining files.
Do NOT batch writes at the end of the response.
```

### Worked example

Bad brief:
> "Research the codebase, read 5 files, analyze patterns, then write config.ts,
> schema.ts, and handler.ts."

Good brief:
> "Write config.ts first via Write tool. Then write schema.ts. Then write handler.ts.
> Read source files only as needed between writes — not as a pre-write batch."

---

## Anti-Patterns (Build Fail)

| Anti-pattern | Why it fails |
|---|---|
| `MultiEdit` all files in one call | All-or-nothing; drop = 0 files written |
| Research loop → batch write at end | Drop during research = 0 files written |
| `Write` all in final `Assistant` message | Stream cut before flush = 0 files |
| "Plan first, implement second" as excuse to defer writes | Planning is not durable; writing is |
| Waiting for test output before writing source file | Source file should exist before tests run |

---

## Priority-First Write Rule

When brief has N files, assign priorities:

1. **Must-have** — the file whose absence blocks all other work (schema, contract, config)
2. **High-value** — the primary deliverable (implementation, skill, rule)
3. **Supporting** — supplementary artifacts (test, doc, cross-link update)

Write must-have first. The agent's first `Write` call should be the highest-priority
file — the one that, if everything else is lost, still moves the project forward.

---

## Subagent Economy Interaction

This rule stacks on `[[parallel-subagent-economy]]`. When spawning parallel agents,
each sub-agent operates independently. Each agent's first `Write` should be its
primary deliverable. Do not design sub-agents where all writes happen in a final
synchronization step — that is a fleet-wide single point of failure.

---

## Recovery Playbook (When a Drop Happens)

1. Check which files exist: `ls <target-directory>` — any completed `Write` calls are visible.
2. Re-brief the retry agent with: "Files already written: [list]. Write only the remaining: [list]."
3. Include the original brief's write-order mandate so the retry agent maintains priority ordering.
4. Do not re-write files that already exist unless content verification fails.

---

## Cross-Links

- `[[monitor-orchestration]]` — orchestration patterns; this rule governs the write
  order within each agent brief that monitor dispatches
- `[[parallel-subagent-economy]]` — each sub-agent should write its primary deliverable
  first; fleet-wide write batching is the same failure mode at scale
- `[[error-recovery]]` — recovery patterns after failures; this rule describes how to
  structure work so recovery is incremental, not a full restart
- `[[autonomous-engineering]]` — agent briefs are autonomy contracts; resilience is
  part of the contract, not an afterthought

---

## See Also

- `rules/principles-incident-log.md` — Principle #19 (same incident, formal log entry)
- Reference incident: 2026-06-18 Task #32, 16 tool_uses with 0 files written; retry 2 tool calls
