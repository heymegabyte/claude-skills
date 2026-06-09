---
name: session-recap
description: Summarize recent CHANGELOG.md entries for context restoration. Parses the canonical heading shape `## YYYY-MM-DD — pass-N — summary`. Filters: last N (default 10), YYYY-MM date prefix, or "today". Supports --json for machine-readable output.
argument-hint: "[filter] [--json]"
user-invocable: true
---

# /session-recap

One-keystroke context restoration. When you open a fresh Claude Code session or hand off context to another agent, `/session-recap` returns the canonical CHANGELOG slice you need.

## What it does

1. Reads `CHANGELOG.md` from the current repo root (or `$CHANGELOG` env override).
2. Parses entries delimited by `## YYYY-MM-DD — pass-N — summary` headings.
3. Filters by:
   - `<N>` — last N entries (default 10)
   - `YYYY-MM` — all entries from a month (e.g. `2026-06`)
   - `YYYY-MM-DD` — all entries from a specific date
   - `today` — today's entries only (UTC)
4. Returns heading + first 5 body lines per entry (human mode).
5. `--json` mode: structured `{entries:[{date,pass_id,summary,body_preview}],total}` for machine consumption.

## Invocation

```bash
bash ~/.agentskills/bin/session-recap.sh             # last 10
bash ~/.agentskills/bin/session-recap.sh 20          # last 20
bash ~/.agentskills/bin/session-recap.sh 2026-06     # all June 2026
bash ~/.agentskills/bin/session-recap.sh today       # UTC today
bash ~/.agentskills/bin/session-recap.sh today --json | jq
```

## Output (human mode)

```
━━━ ## 2026-06-09 — pass-33 — verification-loop self-application + bin/session-recap.sh

  ### Closes both pass-32 Recs
  - **`rules/verification-loop.md` § Self-application** (new) ...
  - **`bin/session-recap.sh`** (new) — context-restoration helper:
  ...

  total: 1 entry
```

## Output (--json mode)

```json
{
  "entries": [
    {
      "date": "2026-06-09",
      "pass_id": "pass-33",
      "summary": "verification-loop self-application + bin/session-recap.sh",
      "body_preview": ["### Closes both pass-32 Recs", "...", "...", "...", "..."]
    }
  ],
  "total": 1
}
```

## When to invoke

- New Claude Code session on this repo → run first to get context.
- Brian asks "what did we do today?" → instant grok.
- Agent handoff → JSON output feeds the next agent's context.
- Long pause between sessions → date-range filter shows the gap.

## See

- `bin/session-recap.sh` — implementation
- `rules/verification-loop.md` § Self-application — companion pattern for skill repos
- CHANGELOG.md — source of truth
