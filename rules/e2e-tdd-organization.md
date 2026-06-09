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

## Directory layout (every project)

```
e2e/
├── FEATURES.md             # row-per-feature inventory
├── COVERAGE.yml            # feature→spec map (CI gate)
├── playwright.config.ts    # base (dev)
├── playwright.prod.config.ts # PROD_URL config (deploy verify)
├── playwright.shard.config.ts # distributed runners
├── _fixtures/              # shared: page objects, test data seed
│   ├── auth.ts             # signInAs(role) page-object helper
│   ├── booking.ts          # seedBooking() helper
│   ├── crew.ts             # seedCrew(coords) helper
│   └── reset-db.ts         # before-each cleanup
├── _helpers/               # cross-cutting
│   ├── snapshot.ts         # randomSnapshot() + assertNewSection()
│   ├── axe.ts              # axe-core wrapper, 0-violations
│   ├── breadcrumbs.ts      # console+network error gate
│   └── visual.ts           # AI vision diff helper
├── __snapshots__/          # baseline images, version-controlled
│   └── <feature>/<test>/<step>.png
├── __seen-routes__.json    # routes ever visited (gates new-section)
├── <feature>/              # ONE feature per directory
│   ├── happy-path.spec.ts  # golden path
│   ├── edge-cases.spec.ts  # invalid input, empty, error
│   ├── a11y.spec.ts        # axe 0 + WCAG 2.2 manual
│   └── visual.spec.ts      # random-snapshot + new-section
├── _smoke/                 # cross-feature smoke (every deploy)
│   ├── home.spec.ts
│   ├── 301-redirects.spec.ts
│   └── critical-path.spec.ts
└── _agents/                # Playwright Test Agent specs
    ├── planner.md          # Markdown plan
    └── healer.json         # auto-fix selector recovery state
```

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
4. Doesn't write to localStorage / IDB / cookies next spec reads.
5. Doesn't depend on Date.now() / timezone / random — fixed seeds or `page.clock.install()`.
6. Doesn't open network to live third-party APIs (mock via MSW or stub).

Violating any of 6 = build fail.

## Parallel-runner readiness (the knob)

```ts
export default defineConfig({
  fullyParallel: true,
  workers: process.env.CI ? '50%' : '75%',
  reporter: [['line'], ['json', { outputFile: 'playwright-report/results.json' }]],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium-375', use: { ...devices['iPhone SE'] } },
    { name: 'chromium-390', use: { ...devices['Pixel 7'] } },
    { name: 'chromium-768', use: { ...devices['iPad Mini'] } },
    { name: 'chromium-1024', use: { viewport: { width: 1024, height: 768 } } },
    { name: 'chromium-1280', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'chromium-1920', use: { viewport: { width: 1920, height: 1080 } } },
    { name: 'firefox-1280', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit-1280', use: { ...devices['Desktop Safari'] } },
  ],
});
```

- Local: `npx playwright test` — 75% cores.
- Sharded: `npx playwright test --shard=$INDEX/$TOTAL` — distribute across N machines / N agents / N CI lanes.
- No config change between local + distributed; shard flag IS parallelization knob.

## Inventory enforcement

- `e2e/FEATURES.md` — markdown table: feature name · owning dir · spec count · last-pass commit
- `e2e/COVERAGE.yml` — CI parses; any feature w/ `specs: 0` fails build
- Pre-commit lint: new `src/web/components/<NewThing>.tsx` without matching `e2e/<feature>/` warns; new `src/worker/routes/<route>.ts` without smoke entry warns
- Bug-fix: failing-test-first reproducing bug → fix → test goes green; PR template requires linking regression spec

## Test-account discipline

- `test@megabyte.space` = canonical customer.
- `crew-test@megabyte.space` = canonical crew.
- Passwords / OTPs sourced from env (`TEST_USER_PASSWORD`, `TEST_OTP_BYPASS`) — never hardcoded.
- Real-user navigation only: `page.click()` + `page.keyboard.type()` + `page.keyboard.press('Tab')`. Bare API calls only for setup (seeding) + teardown.

## Playwright Test Agents (v1.59+ MCP interop)

- `npx playwright init-agents --loop=claude` once per repo.
- Planner emits Markdown plan to `e2e/_agents/planner.md`.
- Generator scaffolds new specs from plan.
- Healer auto-fixes broken selectors after refactors (always run before manual rewrite).
- `browser.bind()` for MCP interop; `page.screencast` for video receipts on flaky specs.

## Done definition (the gate)

- Every new feature → spec written FIRST + RED + then GREEN
- `npm run e2e:prod` exits 0
- Screenshots uploaded to R2 (or local artifacts/ in dev)
- `axe-core` 0 violations at all 6 viewports
- No console errors / CSP violations / 4xx-5xx network calls
- New routes registered in `__seen-routes__.json` AND covered by `e2e-visual-inspection.md` first-render gate

## Enforcement (deterministic, not aspirational)

- **PostToolUse hook** at `~/.claude/hooks/enforce-tdd-e2e.py` fires after every `Write|Edit|MultiEdit` on `src/web/components/**`, `src/worker/routes/**`, `src/web/pages/**`, `apps/dashboard/src/app/features/**`. Scans `e2e/` for any spec mentioning edited file's basename or path. If none, emits system-reminder: "TDD-E2E gap on <file>; expected location <prefix>". Non-blocking (exit 2 = warning), but loud and persistent.
- **SessionStart hook** at `~/.claude/hooks/session-start-reminders.py` emits one-line reminder of four SUPREME rules at top of every fresh session.
- Wired in `~/.claude/settings.json` § `hooks.PostToolUse` + `hooks.SessionStart`.
- Per `01-operating-system` philosophy `hooks > rules > skills > prompts` — hooks turn this from documentation-I-might-read into enforcement-the-harness-applies.
