---
description: Execute a PRP — TodoWrite breakdown, parallel implementation, validate every gate, deploy, prove on prod
argument-hint: <path-to-PRP.md>
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, mcp__playwright__*
model: claude-opus-4-7
---

ULTRATHINK before responding. Execute the PRP at $ARGUMENTS.

## Phase 1 — Decompose

Read the PRP. Use TaskCreate to break it into independent work units:

- Each "Files to create" line = one task
- Each "Files to modify" line = one task
- Validation gates = sequential tasks at the end (TDD spec write must come BEFORE implementation)

## Phase 2 — Confidence gate

If the PRP's confidence score is < 7:

1. Surface to user with the gap analysis
2. Suggest re-running `/generate-prp` with more research
3. STOP — do not execute

## Phase 3 — Fire the Monitor pattern

Per `[[monitor-orchestration]]` § Parallel-agent playbook:

- Group independent file-creates into parallel batches
- Spawn 3-5 specialized agents per batch (NOT general-purpose — see `[[agent-selection]]`)
  - `test-writer` for the failing Playwright spec
  - `feature-builder` (or appropriate specialist) for impl
  - `code-simplifier` post-implementation
- Foreground edits: router wiring, config updates
- Sequential after agents complete: typecheck → deploy → prod E2E

## Phase 4 — Validate every gate

Read the PRP's "Validation gates" list. Run each in order. If any fails, STOP and surface the failure with:

- Exact command run
- Full error output
- Suspected file:line
- 3 candidate fixes (per `[[never-stop-until-deployed]]`)

DO NOT proceed to the next gate until current one passes.

## Phase 5 — Deploy + prod-E2E

Per `[[verification-loop]]`:

1. `wrangler deploy` (or platform equivalent)
2. CDN purge paired with deploy
3. `curl` the changed routes on PROD — assert content/headers/JSON-LD/status
4. Playwright on PROD URL with real user navigation (click through UI, never `page.goto` for internal)
5. AI vision QA on any new route or new `data-testid` per `[[always]]`
6. axe-core 0 violations at 6 breakpoints

## Phase 6 — Report

End-of-turn report per `[[always]]`:

- All files created/modified
- All validation gates passed
- Deploy URL + version ID
- Recs for improvements <2h that you absorbed inline per `[[extra-mile]]`
- Recs surfaced for >2h work

## Anti-patterns

- Don't skip the TDD spec — write the failing Playwright test BEFORE implementation
- Don't run `general-purpose` agents when a specialist exists per `[[agent-selection]]`
- Don't declare done if any gate is yellow — fix-forward or rollback per `[[never-stop-until-deployed]]`
- Don't accept "looks fine" — every claim about deployed state must cite a curl/Playwright result

## See also

- `[[verification-loop]]` — deploy + prod-E2E mandate
- `[[monitor-orchestration]]` — parallel agent decomposition
- `[[agent-selection]]` — specialists over general-purpose
- `[[never-stop-until-deployed]]` — keep debugging until visibly working
- `[[autonomous-engineering]]` — tier-based authorization
