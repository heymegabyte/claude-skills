# Repo Philosophy Sync

## Trigger phrases

- "sync the repo"
- "update repo to match"
- "align repo with philosophy"
- "apply global rules to this project"

## When to use

- When global doctrine (CLAUDE.md, rules/) has changed and an existing repo needs updated
- When adopting a new repo under an established philosophy
- When the repo has drifted from declared architecture or patterns
- After modifying any rule in `~/.claude/plugins/heymegabyte-claude-skills/rules/`

## When not to use

- For one-off config changes (use targeted edit instead)
- When the repo is a throwaway prototype
- When the repo already explicitly opts out of the philosophy

## Full reusable prompt

```
You are performing a repo philosophy sync. Your job is to bring this repository into alignment with a set of doctrine files.

## Steps

1. READ the doctrine files. Identify what changed or what this repo should adopt:
   - ~/.claude/CLAUDE.md (global user instructions)
   - ~/.claude/plugins/heymegabyte-claude-skills/CLAUDE.md (plugin instructions)
   - Any rules/*.md files referenced in either

2. SCAN this repo for gaps against the doctrine:
   - Missing files (`.claude/`, `rules/`, scripts, configs, test patterns)
   - Outdated patterns (non-ESM imports, missing Zod schemas, wrong test framework)
   - Missing or stale README, CHANGELOG, CONTRIBUTING
   - Missing or misconfigured CI (lefthook, Playwright, Vitest, wrangler, Dockerfile)

3. For each gap, classify as:
   - BLOCKER — must fix now (build-breaking, security, drift that causes wrong behavior)
   - BACKLOG — should fix this turn (pattern mismatch, missing docs, config not wired)
   - DEFER — note but skip (deprecation warning, nice-to-have style)

4. Report the gap list as a table: `Category | Gap | Severity | Fix`

5. Fix all BLOCKER + BACKLOG items. Apply changes file-by-file. Do not batch.

6. Verify each fix compiles/passes basic validation before moving to next.
```

## Expected outputs

- Gap analysis table (Category | Gap | Severity | Fix)
- Updated docs, configs, and code to match doctrine
- Verification that builds/tests still pass after sync
- Summary of what was changed and why

## Verification checklist

- [ ] Every BLOCKER item fixed and verified
- [ ] Every BACKLOG item fixed and verified
- [ ] Repo builds and tests pass
- [ ] Drift re-check shows zero BLOCKER items remaining
- [ ] `.claude/` directory exists and is structured per doctrine
- [ ] All referenced rules from doctrine have corresponding repo-level implementation

## Related skills

- `repo-philosophy-sync`
- `audit-doctrine`
- `drift-check`

## Last updated

2026-06-30
