# E2E TDD Organization — Implementation Reference

Sourced on demand by rules/e2e-tdd-organization.md.

---

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

---

## Playwright config scaffold

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

Run commands:

- Local: `npx playwright test` — 75% cores.
- Sharded: `npx playwright test --shard=$INDEX/$TOTAL` — distribute across N machines / N agents / N CI lanes.
- No config change between local + distributed; shard flag IS parallelization knob.

---

## Playwright Test Agents (v1.59+ MCP interop)

- `npx playwright init-agents --loop=claude` once per repo.
- Planner emits Markdown plan to `e2e/_agents/planner.md`.
- Generator scaffolds new specs from plan.
- Healer auto-fixes broken selectors after refactors (always run before manual rewrite).
- `browser.bind()` for MCP interop; `page.screencast` for video receipts on flaky specs.

---

## Failure triage — three categories (verify EVERY red spec in isolation)

A spec that fails in a big parallel prod run is one of three things, and you only know which
by re-running that exact spec ALONE and curling its backing API:

- **Green in isolation → load-flake.** Only fails under peak parallel contention (chunk-fetch blips, edge pressure). Mitigate with `retries`, serial mode on heavy specs, or lower concurrency — do NOT touch the spec's assertions.
- **Red in isolation, API/page correct → STALE TEST.** The component was refactored and the selector no longer matches (table→`<li>`; `getByRole('complementary')` can't see an `aria-hidden` rail; the slash lives in `title`, not body text). Fix the selector to the current markup.
- **Red in isolation, API/page broken → REAL BUG.** Curl the backing endpoint: a 500/404/empty payload is a production defect (schema drift, misrouted handler) — fix the code/migration, not the test.

Never declare a batch "all flaky" from spot-checking a few. Reference incident (njsk.org pass-228→230): a combined admin run showed 9 failures; pass-228 verified 3 spec-types, found them flaky, and wrongly extrapolated "no real admin bugs." Isolating the rest exposed a real prod 500 — `mcp_catalog` missing `created_at`/`updated_at` → seed INSERT `D1_ERROR` → empty MCP grid — plus two stale selectors.
