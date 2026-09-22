# Test Repair Loop

## Trigger phrases

- "fix the tests"
- "repair CI"
- "tests are failing"
- "broken tests"
- "CI is red"

## When to use

- When CI reports test failures
- When local `npm test` or `npx playwright test` fails
- When adding a feature and existing tests need updates
- Before merging any branch with test failures

## When not to use

- For linting/formatting issues (those are style, not test logic)
- For build failures (those go through build fix, not test repair)
- When tests were already intentionally modified and the branch is not yet ready

## Full reusable prompt

```
Execute a TDD-based test repair cycle. The goal is to go from failing tests to all-green in a structured, cause-tracking way.

## Process

### 1. Reproduce and capture

Run the full test suite:
```bash
npm test 2>&1 | tee /tmp/test-failures.log
```

For each failing test, capture:

- Test name and file
- Error message (exact, including stack trace)
- Whether the failure was already present before your changes (pre-existing failure vs regression)

### 2. Triage each failure

| Failure | Cause | Category | Fix strategy |
|---------|-------|----------|-------------|
| test name | error message | REGRESSION / PRE-EXISTING / FLAKY | fix approach |

Categories:

- **REGRESSION** — your changes broke a previously-passing test. Fix the implementation.
- **PRE-EXISTING** — test was already failing. Determine: is this a real bug (fix the code) or stale test (update test)?
- **FLAKY** — test fails intermittently. Add retries or fix the race condition.
- **EXPECTATION SHIFT** — your feature intentionally changes behavior. Update the test expectation.

### 3. Fix one at a time

For each REGRESSION and PRE-EXISTING failure:

1. Read the failing test to understand expected behavior
2. Read the implementation it tests
3. Fix the code OR the test — not both. If the test's expectation is correct, fix the code. If the code is correct and the test is wrong, fix the test.
4. Run ONLY the failing test to confirm green
5. Log the fix in `/tmp/test-repair-log.md`

### 4. Full re-run

After all individual fixes:

```bash
npm test 2>&1
```

All tests must pass.

### 5. Report

Summarize:

- Total failures found: N
- By category: REGRESSION (N), PRE-EXISTING (N), FLAKY (N), EXPECTATION SHIFT (N)
- Fixes applied (per failure)
- Any remaining concerns or follow-ups

```

## Expected outputs
- Per-failure triage with root cause
- All tests passing after fixes
- Repair log showing each fix and its rationale
- Summary of findings and any follow-ups

## Verification checklist
- [ ] Every failing test has a known root cause
- [ ] All tests pass (exit code 0 on full suite)
- [ ] No tests skipped or commented out to achieve green
- [ ] Pre-existing failures are tracked separately from regressions
- [ ] If a test expectation was changed, the reason is documented
- [ ] If flaky tests remain, they have retry logic or a tracking issue

## Related skills
- `test-repair-loop`
- `plan-execute-verify-repair`
- `run-evals`

## Last updated
2026-06-30
