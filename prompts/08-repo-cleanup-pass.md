# Repo Cleanup Pass

## Trigger phrases

- "clean up the repo"
- "remove stale patterns"
- "consolidate decisions"
- "spring cleaning"
- "tidy up"

## When to use

- When the repo has accumulated orphaned configs, commented code, or stale files
- Before onboarding new contributors (first impressions matter)
- After merging multiple feature branches that may have left artifacts
- When a pattern was replaced but old files remain

## When not to use

- When a refactor is already in progress (cleanup after, not during)
- For repos that are already clean (don't fix what isn't broken)
- When the repo is actively being used and cleanup could disrupt workflow (do it in a worktree)

## Full reusable prompt

```
Perform a general repository cleanup pass. Remove what's stale, consolidate what's scattered, and document what's unclear. Do not change behavior — only structure, clarity, and hygiene.

## Pass 1: Orphaned files

Find and remove files that serve no purpose:
- Duplicate configs (`.prettierrc` AND `.prettierrc.json` AND `prettier` in `package.json` — consolidate to one)
- Backup files (`*.bak`, `*.orig`, `file~`)
- Generated artifacts committed by accident (`dist/`, `build/`, `.next/` in git)
- Empty directories (git doesn't track them, but they show in file explorers)
- Stale migration files from abandoned experiments
- Old `.env.example` files when `.env.example.local` exists

## Pass 2: Dead code in configs

Audit config files for stale entries:
- `package.json`: scripts that reference deleted files, devDependencies no longer imported
- `tsconfig.json`: path aliases pointing to non-existent directories
- `wrangler.toml`: routes, KV namespaces, D1 bindings for deleted resources
- `.vscode/settings.json`: deprecated settings or workspace configs for removed plugins
- CI configs: build steps that no-op or reference missing scripts

## Pass 3: Consolidation

Find scattered decisions and consolidate:
- Same configuration in 3 places → one source of truth, others import/reference
- Same comment block in multiple files → extract to a shared doc or constant
- Ad-hoc patterns in individual files → standardize
- Multiple README fragments → consolidate into README.md

## Pass 4: Clarity

Improve signal-to-noise:
- Remove commented-out code blocks (git history has them if needed)
- Remove "TODO: fix this" without context — either add context or remove
- Standardize case and naming where inconsistent
- Add `index.md` or README to directories that lack orientation
- Ensure `.gitignore` covers all generated/transient files

## Output format

```

## Cleanup Report

### Removed (N files)

- path/to/stale-file.md — reason

### Consolidated (N files)

- config-A + config-B → path/to/source-of-truth

### Clarified (N items)

- path/to/file: what was improved

### Deferred (N items) — needs discussion before action

- path/to/questionable-file — what's uncertain

```

Do NOT modify any file that would change runtime behavior. No logic changes, no behavior changes, no test expectation changes.
```

## Expected outputs

- Cleanup report with Removed/Consolidated/Clarified/Deferred counts
- Cleaner directory structure
- Consolidated configs
- Clearer documentation

## Verification checklist

- [ ] No runtime behavior changed (tests still pass, build still works)
- [ ] Each removed file verified as truly unused (not imported, not referenced, no git blame showing recent edits)
- [ ] Consolidated configs tested (the unified version works identically)
- [ ] Commented code removed, not just hidden
- [ ] `.gitignore` covers all removed file types
- [ ] Cleanup report written for future reference

## Related skills

- `self-improve`
- `docs-compression`
- `markdown-todo-sweep`

## Last updated

2026-06-30
