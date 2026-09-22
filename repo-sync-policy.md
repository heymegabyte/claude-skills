# Repo Sync Policy

When global doctrine (`~/.agentskills/`, `~/.claude/skills/`, or the prompt library) changes in a way that implies repository behavior, update the repository immediately.

## Triggers

A global change needs repo sync when it:

1. **Changes a stack decision** that affects how repos are built
2. **Adds/removes a verification gate** that repos should enforce
3. **Changes the test philosophy** (e.g., "always TDD-first")
4. **Changes the docs policy** (e.g., "compress docs monthly")
5. **Adds a new skill** that repos should have a local copy of
6. **Changes the feature flag policy** that repos implement
7. **Changes lint, CI, or deployment rules**

## Sync Checklist

When a global change triggers sync, ask:

- [ ] Does `project/docs/` need updating or a new doc?
- [ ] Does `project/.claude/skills/` need a repo-local version?
- [ ] Does `README.md` need a brief mention?
- [ ] Do `package.json` scripts need to expose the workflow?
- [ ] Do tests, lint, CI, or validation commands need updating?
- [ ] Do TODOs need consolidation?
- [ ] Do docs contradict the new philosophy?
- [ ] Does the repo have obsolete tools or patterns?
- [ ] Should an architecture note be updated?
- [ ] Is there a verification command to document?

## Scope

- **Always sync:** megabyte.space (reference repo), template.projectsites.dev (template repo)
- **Sync on next visit:** all other active project repos under `~/emdash/`
- **Skip:** archived/frozen repos, third-party forks

## See Also

- `routing-matrix.md` — when repo sync is the right destination
- `LEDGER.md` — log every sync with the "Repo sync performed" field
- `project/docs/REPO_SYNC_POLICY.md` — repo-local version of this policy
