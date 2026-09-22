# Architecture Drift Audit

## Trigger phrases

- "check for drift"
- "audit architecture"
- "compare docs to code"
- "are we following the architecture"
- "detect drift"

## When to use

- Before a major refactor to understand current vs declared state
- When onboarding to a repo with architecture docs that may be stale
- After several rounds of feature work without architecture review
- When CI/tests pass but the code structure has diverged from declared patterns

## When not to use

- For repos without any declared architecture (there's nothing to drift from)
- For throwaway prototypes or experimental branches
- When the architecture document explicitly says "this is aspirational, not enforced"

## Full reusable prompt

```
Audit this repository for architecture drift. Compare what the docs say the architecture IS against what the code actually DOES.

## Steps

### 1. Discover declared architecture

Find all files that describe the repo's architecture, structure, or conventions:
- `README.md` section on architecture
- `docs/architecture.md` or similar
- `docs/adr/` (Architecture Decision Records)
- `CONTRIBUTING.md` (may describe patterns)
- `.claude/` rules or project instructions
- `package.json` scripts (deploy/test patterns)
- `tsconfig.json`, `wrangler.toml`, `angular.json` (config structure)
- Any `*.spec.md` or `ARCHITECTURE.md`

Extract from each:
- Declared directory structure
- Declared patterns (e.g. "all API routes in routes/", "Drizzle schema in db/")
- Declared technology choices
- Declared boundaries and interfaces

### 2. Scan actual code

For each declared aspect, check actual code for compliance:
- Directory structure — do the folders on disk match the declared layout?
- Import patterns — are imports following declared conventions (barrel files, path aliases)?
- Tool use — are the declared tools being used (or is there a hidden dependency)?
- Boundaries — are declared boundaries respected (e.g., no DB imports in UI components)?

### 3. Report drift

| Declared in | Declared pattern | Actual | Severity |
|-------------|-----------------|--------|----------|
| docs/arch.md | routes/ per feature | routes/index.ts (single file) | HIGH |
| README.md | Vitest for tests | Jest config present | MEDIUM |

### 4. Fix drift

For each HIGH severity item:
- Fix the code (preferred) OR fix the docs — whichever is correct
- If docs are aspirational and code is pragmatic, update docs
- If code accidentally drifted, refactor code

For MEDIUM items, file as issues or TODOs in the appropriate tracker.

For LOW items, note and move on.

### 5. Verify

After fixes, re-run the audit. Zero HIGH drift items required.
```

## Expected outputs

- Drift table: Declared vs Actual with severity
- Fixed HIGH-severity items (code or docs updated)
- Open TODOs for MEDIUM items
- Summary of repo health score (e.g., "7/8 declared patterns matched, 1 doc updated")

## Verification checklist

- [ ] Every declared architecture aspect has a corresponding check
- [ ] HIGH drift items resolved (code or docs brought into alignment)
- [ ] MEDIUM items captured as TODOs
- [ ] Re-audit after fixes shows zero HIGH items
- [ ] Findings are contextualized (not just raw diffs)

## Related skills

- `architecture-drift-audit`
- `drift-check`
- `audit-doctrine`
- `final-review`

## Last updated

2026-06-30
