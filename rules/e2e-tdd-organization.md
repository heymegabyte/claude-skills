# E2E TDD Organization (***SUPREME — every feature, every project, distribution-ready by default***)

Every clickable element, every form field, every nav link, every API endpoint, every modal, every keyboard shortcut, every error / empty / loading state has ≥1 Playwright E2E test that runs against PROD and goes RED before any implementation lands.

Tests are organized so they can be sharded across N parallel runners (CI, local CPU cores, distributed agents) with zero coordination. For now they just run locally — but the layout is built so flipping the parallelism knob is a one-line change.

## Hard rules
- Failing test FIRST. Watch it fail. THEN implement. Watch it pass. No exceptions.
- No feature ships without ≥1 spec. No bug fix ships without ≥1 regression spec.
- Tests run `fullyParallel: true` × N workers × 6 viewports × 3 browsers — every spec MUST be hermetic.
- Hermetic = no shared filesystem state, no shared D1 rows that another spec also writes, no order-dependent fixtures, no global singletons.

## Directory layout (canonical, every project)

```
e2e/
├── FEATURES.md             # row-per-feature inventory matrix
├── COVERAGE.yml            # machine-readable feature→spec map (CI gate)
├── playwright.config.ts    # base config (dev)
├── playwright.prod.config.ts # PROD_URL config (deploy verify)
├── playwright.shard.config.ts # extends prod for distributed runners
├── _fixtures/              # shared fixtures: page objects, test data seed
│   ├── auth.ts             # signInAs(role) page-object helper
│   ├── booking.ts          # seedBooking() helper
│   ├── crew.ts             # seedCrew(coords) helper
│   └── reset-db.ts         # before-each cleanup (per-spec isolation)
├── _helpers/               # cross-cutting helpers
│   ├── snapshot.ts         # randomSnapshot() + assertNewSection()
│   ├── axe.ts              # axe-core wrapper, 0-violations assertion
│   ├── breadcrumbs.ts      # console+network error gate
│   └── visual.ts           # AI vision diff helper
├── __snapshots__/          # baseline images, version-controlled
│   └── <feature>/<test>/<step>.png
├── __seen-routes__.json    # inventory of every route ever visited (gates new-section detection)
├── <feature>/              # ONE feature per directory
│   ├── happy-path.spec.ts  # golden path
│   ├── edge-cases.spec.ts  # invalid input, empty state, error state
│   ├── a11y.spec.ts        # axe-core 0 violations + WCAG 2.2 AA manual checks
│   └── visual.spec.ts      # random-snapshot + new-section gates
├── _smoke/                 # cross-feature smoke tests (run on every deploy)
│   ├── home.spec.ts
│   ├── 301-redirects.spec.ts
│   └── critical-path.spec.ts
└── _agents/                # Playwright Test Agent specs (Planner/Generator/Healer)
    ├── planner.md          # the plan for the suite (Markdown)
    └── healer.json         # auto-fix selector recovery state
```

## Naming conventions
- Spec file: `<concern>.spec.ts` — single concern per file (under 200 lines)
- `describe` block: one per spec, matches filename
- `test` titles: imperative, `it should ___` not `tests ___`
- `data-testid` on every interactive element: `<feature>-<element>-<action>` (e.g. `booking-submit-button`, `login-email-input`)
- Page objects: `<Feature>Page` class in `_fixtures/`, never inline selectors in specs

## Hermetic spec contract (***every spec MUST satisfy all 6***)
1. Starts at the homepage (`/`) — navigates via clicks/keyboard to its target, never `page.goto` for internal nav after initial load.
2. Seeds its own data via `_fixtures/` helpers before-each (never relies on a prior spec's state).
3. Cleans up its own data after-each (or uses transaction rollback via test DB).
4. Doesn't write to localStorage / IDB / cookies the next spec reads.
5. Doesn't depend on Date.now() / timezone / random — uses fixed seeds or `page.clock.install()`.
6. Doesn't open the network to live third-party APIs (mock via MSW or stub the endpoint).

Violating any of the 6 = build fail.

## Parallel-runner readiness (the knob)

```ts
// playwright.config.ts
export default defineConfig({
  fullyParallel: true,
  workers: process.env.CI ? '50%' : '75%',
  // shard via CLI: --shard=1/8, --shard=2/8, etc. — no config change
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

- Local run: `npx playwright test` — uses 75% of cores.
- Sharded run: `npx playwright test --shard=$INDEX/$TOTAL` — distribute across N machines / N agents / N CI lanes.
- No config change between local and distributed; the shard flag IS the parallelization knob.

## Inventory enforcement
- `e2e/FEATURES.md` — markdown table: feature name · owning dir · spec count · last-pass commit
- `e2e/COVERAGE.yml` — CI parses this; any feature with `specs: 0` fails the build
- Pre-commit lint: any new `src/web/components/<NewThing>.tsx` without a matching `e2e/<feature>/` dir warns; any new `src/worker/routes/<route>.ts` without a smoke entry warns
- Bug-fix protocol: failing-test-first reproducing the bug → fix → test goes green; PR template requires linking the regression spec

## Test-account discipline
- `test@megabyte.space` is the canonical customer test account.
- `crew-test@megabyte.space` is the canonical crew test account.
- Passwords / OTPs sourced from env (`TEST_USER_PASSWORD`, `TEST_OTP_BYPASS`) — never hardcoded.
- Real-user navigation only: `page.click()` + `page.keyboard.type()` + `page.keyboard.press('Tab')`. Bare API calls only for setup (seeding) + teardown.

## Playwright Test Agents (v1.59+ MCP interop)
- `npx playwright init-agents --loop=claude` once per repo.
- Planner emits Markdown plan to `e2e/_agents/planner.md`.
- Generator scaffolds new specs from the plan.
- Healer auto-fixes broken selectors after refactors (always run before manual rewrite).
- Use `browser.bind()` for MCP interop and `page.screencast` for video receipts on flaky specs.

## Done definition (the gate)
- Every new feature → spec written FIRST + RED + then GREEN
- `npm run e2e:prod` exits 0
- Screenshots uploaded to R2 (or local artifacts/ in dev)
- `axe-core` 0 violations at all 6 viewports
- No console errors / CSP violations / 4xx-5xx network calls
- New routes registered in `__seen-routes__.json` AND covered by `[[e2e-visual-inspection]]` first-render gate

## See
- [[verification-loop]] — deploy + prod-E2E mandate (this rule is the test-organization arm of that)
- [[e2e-visual-inspection]] — random snapshot + new-section AI vision (run inside every spec here)
- [[code-style]] § Testing — Playwright Agents + Vitest 3 details
- [[brian-preferences]] § Git policy — TDD-first is non-negotiable
- [[prompt-as-training-signal]] — every "Make sure ___ is tested" prompt = signal this rule needs sharpening
