---
last_reviewed: 2026-06-29
superseded_by: null
name: "router-drift-auto-reconciliation"
priority: 2
pack: "core"
triggers:
  - "router drift"
  - "orphan skill"
  - "router reconcile"
  - "_router.md out of date"
  - "skill not routed"
paths:
  - "*"
---

# Router Drift Auto-Reconciliation

`_router.md` is the live map Claude uses to resolve which skill handles a task. Orphan skills (on disk, absent from router) are invisible — they accumulate silently with no error, just degraded coverage.

Router reconciliation MUST be continuous, not periodic. Every skill submodule write triggers an immediate registration check. Manual `/audit-router --fix` is a fallback, not the baseline.

## Reference incident (2026-06-18)

`/audit-router --fix` found **51 orphan skills, 0 stale entries** after ~1 month of active development. PostToolUse hook `router-reconcile-on-skill-write.py` was wired the same turn.

## The hook

- **File:** `~/.claude/hooks/router-reconcile-on-skill-write.py`
- **Event:** `PostToolUse`
- **Matcher:** `Write|Edit|MultiEdit`
- **Trigger condition:** modified path matches `~/.claude/plugins/heymegabyte-claude-skills/[0-9]+-*/**.md` (excludes `SKILL.md`)

**Logic:**

1. Parse modified file path from stdin JSON (`tool_input.file_path`)
2. Extract `category_dir` and `slug`
3. Search `_router.md` for `` `slug` `` — if found, no-op
4. If not found: append `,`slug`` to the category's slug list in Category Map
5. If no category line exists: insert new Category Map entry
6. Write updated `_router.md`

**stderr output:**

- `router-reconcile: registered orphan {slug} in {category_dir}`
- `router-reconcile: no action needed ({slug})`
- `router-reconcile: skipping SKILL.md in {category_dir}`

**Override:** `CLAUDE_ROUTER_RECONCILE_DISABLE=1` suppresses hook for batch operations (mass imports, router rebuilds). Never leave set globally.

## What the hook does NOT do

- Does not remove stale entries — use `/audit-router --fix` (needs full filesystem glob)
- Does not update Task Routing rules — only Category Map slug lists
- Does not fire on `rules/*.md` or `SKILL.md`

Run `/audit-router --fix` for stale pruning or task routing updates (monthly cadence sufficient).

## Wiring in settings.json

```json
"PostToolUse": [
  {
    "matcher": "Write|Edit|MultiEdit",
    "hooks": [
      {
        "type": "command",
        "command": "python3 $HOME/.claude/hooks/enforce-tdd-e2e.py 2>&1 || true",
        "timeout": 5
      },
      {
        "type": "command",
        "command": "python3 $HOME/.claude/hooks/router-reconcile-on-skill-write.py 2>/dev/null || true",
        "timeout": 5
      }
    ]
  }
]
```

## Anti-patterns

- Relying on periodic manual audits — 51-orphan backlog is the result
- Running `/audit-router --fix` after every single skill write — hook replaces that
- Setting `CLAUDE_ROUTER_RECONCILE_DISABLE=1` globally

## Verification

```bash
ls -la ~/.claude/hooks/router-reconcile-on-skill-write.py
jq '.hooks.PostToolUse' ~/.claude/settings.json
echo "test" > ~/.claude/plugins/heymegabyte-claude-skills/05-architecture-and-stack/_test-reconcile.md
grep '_test-reconcile' ~/.claude/plugins/heymegabyte-claude-skills/_router.md
rm ~/.claude/plugins/heymegabyte-claude-skills/05-architecture-and-stack/_test-reconcile.md
```

## See also

- `[[audit-router]]` — full sweep; handles stale pruning + task routing updates the hook cannot
- `[[bash-matcher-guardrails]]` — `PostToolUse` event name, `Write|Edit|MultiEdit` matcher syntax
- `[[drift-detection]]` — router orphans as a class of doc drift; this hook is the auto-fix
- `rules/principles-incident-log.md` §18 — 2026-06-18 51-orphan incident log
