# Markdown TODO Sweep

## Trigger phrases

- "find all TODOs"
- "sweep for unchecked"
- "what's deferred"
- "find open tasks in docs"
- "sweep for FIXMEs"

## When to use

- Before a release to ensure no deferred items slipped through
- When inheriting or revisiting a repo after time away
- During refactoring to decide which TODOs to resolve vs defer further
- When configuration or code references a feature that was never finished

## When not to use

- For code-level TODOs (those should be tracked in issue tracker or code comments — this is markdown-only)
- For completed tasks that were left as checkboxes by accident (mark those done inline)
- When you already know exactly what's pending (no discovery needed)

## Full reusable prompt

```
Sweep this repository for all deferred work items in markdown files. Be exhaustive.

## What to find

1. **TODO items** — any line containing "TODO", including `- [ ] TODO:`, `<!-- TODO -->`, `TODO(username):`
2. **FIXME items** — any line containing "FIXME" or "HACK" or "WORKAROUND"
3. **Unchecked checkboxes** — any `- [ ]` that is NOT preceded by "TODO:" (those are caught above)
4. **Stub sections** — any `// TODO`, `<!-- TODO -->`, or `> **TODO**` markers
5. **Deferred decisions** — phrases like "to be decided", "TBD", "decide later", "pending decision"
6. **Incomplete lists** — numbered lists that end early or say "more to come", "incomplete"

## Scope

Search ALL `.md` files under these paths, excluding `node_modules/`, `.git/`, `.claude/worktrees/`:
- `./` (repo root)
- `./docs/`
- `./rules/`
- `./skills/`
- `./scripts/`
- `./.claude/`

## Output format

| File | Line | Type | Content | Age estimate |
|------|------|------|---------|-------------|
| docs/architecture.md | 142 | TODO | Add auth flow diagram | 2026-03 |
| README.md | 57 | UNCHECKED | Link to deployment guide | 2026-06 |

Then append a summary section:
- Total items found: N
- By type: TODO (N), FIXME (N), UNCHECKED (N), TBD (N), STUB (N)
- By severity estimation:
  - CRITICAL: blocks a feature or build (N items)
  - IMPORTANT: should resolve this turn (N items)
  - MINOR: nice-to-have (N items)
- Recommendation: which 3 items to resolve first and why
```

## Expected outputs

- Full table of all deferred items with file, line, type, content, and age
- Summary by type and estimated severity
- Top-3 recommendation for immediate resolution

## Verification checklist

- [ ] All markdown files searched (not just root README)
- [ ] Every found item has a file + line reference
- [ ] Items deduplicated (same TODO in multiple places counted once with all locations noted)
- [ ] False positives excluded ("methodology" containing "TODO" as substring)
- [ ] Output is actionable — someone can triage from the report alone

## Related skills

- `markdown-todo-sweep`
- `session-recap`
- `self-improve`

## Last updated

2026-06-30
