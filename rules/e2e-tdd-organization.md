---
name: "e2e-tdd-organization"
priority: 2
pack: "testing"
triggers:
  - "test"
  - "e2e"
  - "playwright"
  - "tdd"
paths:
  - "concern:e2e-testing"
---

# E2E TDD Organization

Every clickable element / form field / nav link / API endpoint / modal / keyboard shortcut / error / empty / loading state has ≥1 Playwright E2E that runs against PROD and goes RED before any implementation.

Tests sharded across N parallel runners (CI, local CPU cores, distributed agents) with zero coordination. Today they run locally; flipping parallelism = one-flag change.

## Hard rules

- Failing test FIRST. Watch fail. THEN implement. Watch pass. No exceptions.
- No feature ships without ≥1 spec. No bug fix without ≥1 regression spec.
- `fullyParallel: true` × N workers × 6 viewports × 3 browsers — every spec hermetic.
- Hermetic = no shared FS state, no shared D1 rows another spec writes, no order-dependent fixtures, no global singletons.

## Directory layout

The canonical `e2e/` tree: `FEATURES.md`, `COVERAGE.yml`, `playwright.config.ts`, `playwright.prod.config.ts`, `playwright.shard.config.ts`, `_fixtures/` (auth, seed, reset helpers), `_helpers/` (snapshot, axe, visual), `__snapshots__/` (baselines, version-controlled), `__seen-routes__.json`, per-feature dirs each containing `happy-path.spec.ts` / `edge-cases.spec.ts` / `a11y.spec.ts` / `visual.spec.ts`, `_smoke/` cross-feature specs, and `_agents/` for Playwright Test Agent state.

See `reference/e2e-tdd-organization.md` for the full annotated directory tree.

## Naming

- Spec file: `<concern>.spec.ts` — single concern per file (<200 lines)
- `describe` block: one per spec, matches filename
- `test` titles: imperative, `it should ___` not `tests ___`
- `data-testid` on every interactive element: `<feature>-<element>-<action>` (`booking-submit-button`, `login-email-input`)
- Page objects: `<Feature>Page` class in `_fixtures/`, never inline selectors in specs

## Hermetic spec contract (every spec satisfies all 6)

1. Starts at homepage (`/`) — navigates via clicks/keyboard, never `page.goto` for internal nav after initial load.
2. Seeds own data via `_fixtures/` before-each (never relies on prior spec's state).
3. Cleans own data after-each (or transaction rollback via test DB).
4. Does not write to localStorage / IDB / cookies the next spec reads.
5. Does not depend on `Date.now()` / timezone / random — fixed seeds or `page.clock.install()`.
6. Does not open network to live third-party APIs (mock via MSW or stub).

Violating any of 6 = build fail.

## Parallel-runner config (the knob)

- `fullyParallel: true`, workers: `50%` on CI / `75%` local.
- 6 viewports: 375 (iPhone SE), 390 (Pixel 7), 768 (iPad Mini), 1024, 1280, 1920.
- 3 browsers: Chromium, Firefox, WebKit.
- Sharded: `npx playwright test --shard=$INDEX/$TOTAL` — no config change between local and distributed.

See `reference/e2e-tdd-organization.md` for the full `defineConfig` scaffold.

## Inventory enforcement

- `e2e/FEATURES.md` — markdown table: feature name · owning dir · spec count · last-pass commit
- `e2e/COVERAGE.yml` — CI parses; any feature with `specs: 0` fails build
- Pre-commit lint: new `src/web/components/<NewThing>.tsx` without matching `e2e/<feature>/` warns; new `src/worker/routes/<route>.ts` without smoke entry warns
- Bug-fix: failing-test-first reproducing bug → fix → test goes green; PR template requires linking regression spec

## Test-account discipline

- `test@megabyte.space` = canonical customer.
- `crew-test@megabyte.space` = canonical crew.
- Passwords / OTPs sourced from env (`TEST_USER_PASSWORD`, `TEST_OTP_BYPASS`) — never hardcoded.
- Real-user navigation only: `page.click()` + `page.keyboard.type()` + `page.keyboard.press('Tab')`. Bare API calls only for setup (seeding) + teardown.

## Playwright Test Agents (v1.59+ MCP interop)

- `npx playwright init-agents --loop=claude` once per repo.
- Planner, Generator, and Healer agents scaffold and auto-repair specs.
- Always run Healer before manual selector rewrite after a refactor.

See `reference/e2e-tdd-organization.md` for full agent workflow detail.

## Failure triage

Triage each failing spec individually. Never declare a batch "all flaky" from spot-checking a few. For every red spec: re-run it ALONE, then curl its backing API. Three outcomes — load-flake, stale selector, or real bug — each has a different fix. Conflating them causes real production defects to go undetected.

See `reference/e2e-tdd-organization.md` for the full triage protocol and reference incident.

## Done definition (the gate)

- Every new feature → spec written FIRST + RED + then GREEN
- `npm run e2e:prod` exits 0
- Screenshots uploaded to R2 (or local `artifacts/` in dev)
- `axe-core` 0 violations at all 6 viewports
- No console errors / CSP violations / 4xx-5xx network calls
- New routes registered in `__seen-routes__.json` AND covered by `e2e-visual-inspection.md` first-render gate

## Enforcement (deterministic, not aspirational)

- **PostToolUse hook** at `~/.claude/hooks/enforce-tdd-e2e.py` fires after every `Write|Edit|MultiEdit` on `src/web/components/**`, `src/worker/routes/**`, `src/web/pages/**`, `apps/dashboard/src/app/features/**`. Scans `e2e/` for any spec mentioning edited file's basename or path. If none, emits system-reminder: "TDD-E2E gap on `<file>`; expected location `<prefix>`". Non-blocking (exit 2 = warning), but loud and persistent.
- **SessionStart hook** at `~/.claude/hooks/session-start-reminders.py` emits one-line reminder of four SUPREME rules at top of every fresh session.
- Wired in `~/.claude/settings.json` § `hooks.PostToolUse` + `hooks.SessionStart`.
- Per `01-operating-system` philosophy `hooks > rules > skills > prompts` — hooks turn this from documentation-I-might-read into enforcement-the-harness-applies.

<!-- grow-ok -->
<!-- Growth justified: folded vendored Superpowers TDD discipline (2026-06-28, user request) — net-new doctrine, not redundancy. -->

## Folded from Superpowers — test-driven-development

*Vendored discipline from [obra/Superpowers](https://github.com/obra/Superpowers) (MIT, Jesse Vincent). Full skill: [[20-superpowers]] → test-driven-development/SKILL.md.*

- The Iron Law: NO production code without a failing test first. Wrote code before the test? Delete it — don't keep it as "reference", don't adapt it, don't even look at it.
- Watch RED fail for the RIGHT reason — feature missing, not a typo/import error. A test that errors isn't RED; fix until it fails on the assertion.
- Test passes on first run? You're testing existing behavior — the test is wrong, not the code.
- GREEN means minimal code to pass — no extra options, params, or "improvements" beyond what the test demands (YAGNI).
- Test fails after GREEN? Fix the CODE, never the test. Modifying a test to make it pass is the cardinal sin.
- REFACTOR only after green: dedupe, rename, extract — never add behavior; stay green throughout.
- "Tests-after" is not TDD: it answers "what does this do?" (biased by your impl) not "what should this do?" — you lose the proof the test can catch the bug.
- Hard-to-test = hard-to-use: a complicated test signals a coupled design. Fix the interface (dependency injection), don't pile on mocks.

### Testing anti-patterns catalog (avoid all)

- Testing mock behavior — asserting a `*-mock` testid renders proves the mock exists, not that the component works. Test real behavior or don't mock it.
- Test-only methods in production — a `destroy()`/cleanup method only tests call pollutes the prod class; move it to test utilities.
- Mocking without understanding — mocking a method whose side-effect the test depends on makes it pass/fail for the wrong reason. Run with the real impl first, then mock minimally at the lowest level.
- Incomplete mocks — partial mock with only the fields you think you need; mirror the COMPLETE real response shape or downstream code breaks silently.
- Over-mocking "to be safe" — mock setup longer than the test, or test breaks when a mock changes, means prefer integration tests with real components.
- Asserting on implementation details — verify behavior/output, not internal call counts or private structure.
- Tests as afterthought — "implementation complete, ready for testing" is a TDD violation; testing IS implementation, not a follow-up.

- See [[20-superpowers]]
