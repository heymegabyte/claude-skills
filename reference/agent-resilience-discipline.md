# Agent Resilience — brief templates

Sourced on demand by `rules/agent-resilience-discipline.md`. Copy-paste templates for a resilient multi-file brief (Pattern A) and a single-file skeleton brief (Pattern B).

## Pattern A — file write order (paste into every multi-file brief)

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

## Pattern B — pre-written skeleton (single file, <300 lines)

```
## Your task
Call Write with the following path and content. That is the only tool call needed.

Path: /path/to/rules/my-new-rule.md
Content:
[... full file content here ...]
```
