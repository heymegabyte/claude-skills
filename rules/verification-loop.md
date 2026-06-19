---
name: "verification-loop"
priority: 1
pack: "core"
triggers: []
paths:
  - "*"
---

# Verification Loop

Enforce build→deploy→prod-curl/E2E→fix-forward after every code change; never report DONE without a live PROD URL assertion confirming the change.

## Deploy + Prod-E2E mandate (EVERY ADD/FIX)

Any code change to a deployable project:

1. Build
2. Deploy
3. `curl` / Playwright E2E against PROD URL targeting changed pages/routes/endpoints
4. Fix-forward (max 3 redeploys)
5. Report DONE only then

### Auth fallback chain

`wrangler whoami` failure is NOT a pass:

1. `get-secret CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` via `/Users/Apple/.local/bin/get-secret`
2. Fall back to `CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL`
3. If both stale, ask user `! npx wrangler login` and resume deploy

### Docker (Cloudflare Worker container builds)

- Container/Durable-Object image builds require **Docker daemon running** locally.
- On macOS: `open -a "Docker Desktop"` then poll: `until docker info >/dev/null 2>&1; do sleep 2; done` (~20-40s). Deploy only after `docker info` succeeds.
- If Docker can't start (headless/CI): push → Workers Builds (CF CI has Docker) or `gh workflow run container-deploy.yaml`. Frontend R2 deploys have no Docker dependency.

### Done definition

- Local typecheck + build pass is NEVER sufficient.
- DONE requires change verified live.
- Every page relevant to add/fix MUST be HTTP-fetched post-deploy and asserted (new content present, no 5xx, security headers intact, no CSP/console errors).

## TDD

- Failing Playwright test FIRST → implement → pass.
- Real user flows: homepage → navigate via clicks/keyboard → interact → verify.
- Test account: `test@megabyte.space` (`TEST_USER_PASSWORD`).

## Code-change flow

Code change → `SPEC.md` → failing tests (PROD_URL) → implement slice-by-slice → deploy + purge → E2E 6bp → screenshot → AI vision → fix → redeploy (max 3) → DONE when all pass.

## Ralph Loop

- `SPEC.md` + `progress.md` → pick AC → test → build → deploy → verify → mark done → next
- Context >60% → save + spawn fresh
- All ACs done → recommendations loop → zero remain

## Playwright Test Agents (built-in v1.56+)

- **Planner** → Markdown plan; **Generator** → test code; **Healer** → auto-fix broken selectors
- Init: `npx playwright init-agents --loop=claude`
- v1.59+ adds `browser.bind()` for MCP interop + `page.screencast` for video receipts
- Use Healer for flaky selector recovery before manual rewrite
- MCP a11y tree testing preferred over screenshot-based assertions — more reliable, faster, catches real a11y issues

## Visual regression

- **Percy AI Visual Review** — 3× faster review, 40% OCR-based noise filter — full-page + flows
- **Chromatic** — component-level via Storybook
- **pixelmatch** (or `toHaveScreenshot()`) — local deterministic CI
- Three-tier: local → PR → deploy

## INP debugging

- `PerformanceObserver` type:`long-animation-frame` (LoAF, Chrome 123+)
- SPA per-route CWV: web-vitals v4+ with `softNavs:true`

## Hard rules

- No screenshot = not verified
- No test = not done
- No deploy = not shipped
- Crons = monitoring ONLY

## Console-error gate

- Console errors = not done.
- Check browser console after every deploy: CSP violations, JS errors, failed resource loads.
- Fix ALL before marking complete.
- Gate captures: CSP `report-uri` violations, Trusted Types violations, deprecation warnings, `beforeunload` misuse, autoplay blocks, third-party script errors — each = build fail.

## Gradual deploy verification

1. 1% → watch error rate 5 min
2. 10% → watch 5 min
3. 100%

- Auto-rollback at p99 error >1% or LCP regression >20%.

## Value extraction every prompt

- Universal → `~/.claude/`
- Project → `./.claude/` (path-scoped)
- New projects auto-scaffold `.claude/` + `SPEC.md` + tests

## TDD-First + Total-Coverage

Every clickable / form field / nav link / API endpoint / modal / keyboard shortcut / error / empty / loading state has ≥1 Playwright test against PROD.

### Inventory

- `e2e/FEATURES.md` + `e2e/COVERAGE.yml`
- CI fails if any feature lacks entry or test

### Execution

- `fullyParallel: true` × 4-8 workers × 3 browsers × 6 breakpoints
- Spawn parallel Playwright Test Agents — one per feature

### Bug + change protocol

- Bug fix = failing test first reproducing the bug
- Code change: (1) write failing test → (2) implement → (3) `npm run e2e:prod` → (4) screenshot artifacts uploaded to R2
- No feature without ≥1 test; no bug fix without ≥1 regression test

## Self-application — when this rule is N/A

- **agentskills repo** — no deployed surface; ship via `git push` + npm publish. Deploy+prod-E2E gate replaced with: `validate-packs.mjs` + `sha-pin-actions.mjs --check` + actionlint + ruff + shellcheck/shfmt + markdownlint + semgrep on every push per `lefthook.yml` + `publish.yml` CI.
- **CLI tools without webapp** — replace E2E-against-prod with unit + integration tests + manual CLI smoke.
- **Library packages (`@scope/lib`)** — replace prod-E2E with `npm run test` matrix across supported Node versions + downstream consumer integration tests.

For any repo with a deployed surface (Cloudflare Worker, Pages, Vercel, etc.), the deploy+prod-E2E mandate applies as written. No exceptions for "internal-only" or "low-traffic".
