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

- Every `Write` call is **atomic and durable** — once it returns success, the file survives any subsequent drop or timeout.
- Structure every multi-file brief so the highest-priority file is written **first**, before research, optional reads, or analysis.

## Reference Incident: 2026-06-18 Task #32

- Three-file brief. Agent spent **16 tool_uses** on research before writing anything. Drop on call 16. **0 files written.**
- Retry: **2 tool calls** — `Write` file 1, `Write` file 2. Both survived.
- Lesson: research-before-write is fine; research-before-ALL-writes loses everything on a drop.

## Pattern A: Write in Priority Order

### Priority assignment

- **Must-have** — file whose absence blocks all other work (schema, contract, config) — write first.
- **High-value** — primary deliverable (implementation, skill, rule) — write second.
- **Supporting** — supplementary artifacts (test, doc, cross-link update) — write last.

### Brief mandate

Every multi-file agent brief MUST include:

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

**Bad brief:** "Research the codebase, read 5 files, analyze patterns, then write config.ts, schema.ts, and handler.ts."

**Good brief:** "Write config.ts first via Write tool. Then write schema.ts. Then write handler.ts. Read source files only as needed between writes — not as a pre-write batch."

## Pattern B: Pre-Written Skeleton (single file, <300 lines)

- Embed the **complete file content** in the prompt as a code block.
- Agent's only task: call `Write` with the provided path and content.
- Eliminates the research phase entirely — **10× faster**, **100% reliable**.
- Use when: single file, <300 lines, content fully known by orchestrator, no codebase dependencies.
- Use Pattern A when: multi-file, content depends on existing codebase state.

### Measured impact

- Task #32 and Task #51 (2026-06-18): Pattern B retries succeeded in **1–2 tool calls** vs. original 4–16 pre-write calls that all dropped before writing.

### Brief snippet (Pattern B)

```
## Your task
Call Write with the following path and content. That is the only tool call needed.

Path: /path/to/rules/my-new-rule.md
Content:
---
name: "my-new-rule"
priority: 1
pack: "core"
---

# My New Rule

[... full file content here ...]
```

## Anti-Patterns (Build Fail)

- **`MultiEdit` all files in one call** — all-or-nothing; drop = 0 files written.
- **Research loop → batch write at end** — drop during research = 0 files written.
- **`Write` all in final `Assistant` message** — stream cut before flush = 0 files.
- **"Plan first, implement second" to defer writes** — planning is not durable; writing is.
- **Waiting for test output before writing source file** — source must exist before tests run.

## Recovery Playbook

1. `ls <target-directory>` — any completed `Write` calls are visible.
2. Re-brief retry agent: "Files already written: [list]. Write only the remaining: [list]."
3. Include original brief's write-order mandate so retry agent maintains priority ordering.
4. Do not re-write files that already exist unless content verification fails.

## Subagent Economy Interaction

- Stacks on `[[parallel-subagent-economy]]`.
- Each sub-agent's first `Write` must be its primary deliverable.
- Fleet-wide write batching in a final sync step = fleet-wide single point of failure.

## Cross-Links

- `[[monitor-orchestration]]` — write order governs each agent brief monitor dispatches.
- `[[parallel-subagent-economy]]` — each sub-agent writes primary deliverable first.
- `[[error-recovery]]` — structure work for incremental recovery, not full restart.
- `[[autonomous-engineering]]` — resilience is part of the autonomy contract.

## See Also

- `rules/principles-incident-log.md` — Principle #19 (same incident, formal log entry).
- Reference incident: 2026-06-18 Task #32, 16 tool_uses, 0 files written; retry 2 tool calls.
- Reference incident: 2026-06-18 Task #51, same failure mode; Pattern B retry in 1 tool call.
