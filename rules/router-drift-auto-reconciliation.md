---
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

`_router.md` is the live map Claude uses to resolve which skill handles a task. Orphan
skills — files that exist on disk but are absent from the router — are invisible to
routing. They accumulate silently: no error, no warning, just degraded skill coverage
over time.

**The principle:** router reconciliation must be continuous, not periodic. Every write
to a skill submodule file should trigger an immediate registration check. Manual
`/audit-router --fix` passes are a fallback, not the baseline.

---

## Reference incident (2026-06-18)

`/audit-router --fix` found **51 orphan skills, 0 stale entries** after ~1 month of
active skill development. The map was never wrong — it was perpetually incomplete.
PostToolUse hook `router-reconcile-on-skill-write.py` was wired the same turn.

---

## The hook

**File:** `~/.claude/hooks/router-reconcile-on-skill-write.py`

**Event:** `PostToolUse`

**Matcher:** `Write|Edit|MultiEdit`

**Trigger condition:** modified path matches
`~/.claude/plugins/heymegabyte-claude-skills/[0-9]+-*/**.md`
(numbered submodule directory; excludes `SKILL.md` which describes a category, not a slug)

**Logic:**
1. Parse the modified file path from stdin JSON (`tool_input.file_path`)
2. Extract `category_dir` (e.g., `05-architecture-and-stack`) and `slug` (e.g., `cf-auto-provision`)
3. Search `_router.md` for `` `slug` `` — if found, no-op
4. If not found: locate the category's line in the Category Map and append `, `slug`` to its slug list
5. If no category line exists: insert a new Category Map entry
6. Write the updated `_router.md` back to disk

**Output to stderr:**
- `router-reconcile: registered orphan {slug} in {category_dir}` — slug was missing, now added
- `router-reconcile: no action needed ({slug})` — slug was already present
- `router-reconcile: skipping SKILL.md in {category_dir}` — SKILL.md writes are intentionally skipped

**Override:** `CLAUDE_ROUTER_RECONCILE_DISABLE=1` suppresses the hook for batch operations
(e.g., mass skill imports or router rebuilds where you want a single `/audit-router --fix`
pass instead of N individual writes).

---

## What the hook does NOT do

- Does not remove stale entries — that requires `/audit-router --fix` (stale detection needs
  glob verification against the full filesystem)
- Does not update Task Routing rules — only the Category Map slug lists
- Does not fire on rules files (`rules/*.md`) — those are not routeable slugs
- Does not fire on `SKILL.md` — category descriptors, not slugs

For stale entry pruning or task routing updates, run `/audit-router --fix` manually or on
a periodic cadence (monthly is sufficient given the hook handles daily drift).

---

## Wiring in settings.json

The hook is registered under `PostToolUse` alongside `enforce-tdd-e2e.py`:

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

---

## Anti-patterns

- **Relying on periodic manual audits** — a 51-orphan backlog is the result; the hook
  reduces this to 0 permanently.
- **Running `/audit-router --fix` after every single skill write** — the hook replaces
  that pattern; reserve `--fix` for full sweeps (post-sprint, new developer onboarding,
  post-merge from a fork).
- **Setting `CLAUDE_ROUTER_RECONCILE_DISABLE=1` globally** — the override exists for
  batch operations only; leaving it set defeats the entire principle.
- **Skipping SKILL.md from hook scope** — SKILL.md is a category descriptor, not a slug;
  including it would cause false positives. The hook correctly skips it.

---

## Verification

After wiring:
```bash
# Confirm hook is executable
ls -la ~/.claude/hooks/router-reconcile-on-skill-write.py

# Confirm wiring in settings.json
jq '.hooks.PostToolUse' ~/.claude/settings.json

# Smoke test: create a dummy skill file and verify _router.md was updated
echo "test" > ~/.claude/plugins/heymegabyte-claude-skills/05-architecture-and-stack/_test-reconcile.md
grep '_test-reconcile' ~/.claude/plugins/heymegabyte-claude-skills/_router.md
# → should show the slug registered; then clean up:
rm ~/.claude/plugins/heymegabyte-claude-skills/05-architecture-and-stack/_test-reconcile.md
```

---

## See also

- `[[audit-router]]` — full sweep command; handles stale pruning + task routing updates the hook cannot
- `[[bash-matcher-guardrails]]` — `PostToolUse` event name, `Write|Edit|MultiEdit` matcher syntax
- `[[drift-detection]]` — router orphans as a class of doc drift; this hook is the auto-fix for that class
- `rules/principles-incident-log.md` § 18 — incident log entry for the 2026-06-18 51-orphan discovery
