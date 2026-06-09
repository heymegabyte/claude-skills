---
name: "verification-loop"
priority: 1
pack: "core"
triggers: []
paths:
  - "*"
---

# Verification Loop

## Deploy + Prod-E2E mandate (EVERY ADD/FIX)

Any code change to deployable project:

1. Build
2. Deploy
3. curl / Playwright E2E against PROD URL targeting changed pages/routes/endpoints
4. Fix-forward (max 3 redeploys)
5. Only then report DONE

### Auth fallback chain

Auth gap (`wrangler whoami` fails, missing `CLOUDFLARE_API_TOKEN`) is NOT a pass:

1. Fetch via `/Users/Apple/.local/bin/get-secret CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`
2. Fall back to `CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL`
3. If both stale, ask user `! npx wrangler login` and resume from deploy

### Done definition

- Local typecheck + build pass is NEVER sufficient
- "DONE" requires change verified live
- Pages relevant to add/fix MUST each be HTTP-fetched post-deploy and asserted against (new content present, no 5xx, security headers intact, no CSP/console errors)

## TDD

- Failing Playwright test FIRST → implement → pass
- Real user flows: homepage → navigate via clicks/keyboard → interact → verify
- Test account: `test@megabyte.space` (`TEST_USER_PASSWORD`)

## Code-change flow

Code change → SPEC.md → failing tests (PROD_URL) → implement slice-by-slice → deploy + purge → E2E 6bp → screenshot → AI vision → fix → redeploy (max 3) → DONE when all pass.

## Ralph Loop

- SPEC.md + progress.md → pick AC → test → build → deploy → verify → mark done → next
- Context >60% → save + spawn fresh
- All ACs done → recommendations loop → zero remain

## Playwright Test Agents (built-in v1.56+)

- **Planner** → Markdown plan
- **Generator** → test code
- **Healer** → auto-fix broken selectors
- Init: `npx playwright init-agents --loop=claude`
- v1.59+ adds `browser.bind()` for MCP interop + `page.screencast` for video receipts
- Use Healer for flaky selector recovery before manual rewrite
- MCP a11y tree testing preferred over screenshot-based assertions — more reliable, faster, catches real a11y issues

## Visual regression

- **Percy AI Visual Review** — 3× faster review, 40% OCR-based noise filter — full-page + flows
- **Chromatic** — component-level via Storybook
- **pixelmatch** (or Playwright `toHaveScreenshot()`) — local deterministic CI
- Three-tier: local → PR → deploy

## INP debugging

- `PerformanceObserver` type:`long-animation-frame` (LoAF, Chrome 123+)
- For SPA per-route CWV: web-vitals v4+ with `softNavs:true`

## Hard rules

- No screenshot = not verified
- No test = not done
- No deploy = not shipped
- Crons = monitoring ONLY

## Console-error gate

- Console errors = not done
- After every deploy, check browser console for CSP violations, JS errors, failed resource loads
- Fix ALL before marking complete
- Never ship page w/ console errors — they indicate broken functionality (blocked scripts, missing resources, CSP mismatches)
- Browser console gate also captures: CSP report-uri violations, Trusted Types violations, deprecation warnings, beforeunload misuse, autoplay blocks, third-party script errors
- Each = build fail

## Gradual deploy verification

1. 1% → watch error rate 5 min
2. 10% → watch 5 min
3. 100%

- Auto-rollback at p99 error >1% or LCP regression >20%

## Value extraction every prompt

- Universal → `~/.claude/`
- Project → `./.claude/` (path-scoped)
- New projects auto-scaffold `.claude/` + SPEC.md + tests

## TDD-First + Total-Coverage

Every clickable / form field / nav link / API endpoint / modal / keyboard shortcut / error / empty / loading state has ≥1 Playwright test against PROD.

### Inventory

- `e2e/FEATURES.md` + `e2e/COVERAGE.yml`
- CI fails if any feature lacks entry or test

### Execution

- Tests run `fullyParallel: true` × 4-8 workers × 3 browsers × 6 breakpoints
- Spawn parallel Playwright Test Agents — one per feature

### Bug + change protocol

- Bug fix = failing-test-first reproducing the bug
- Code change:
  1. Write failing test
  2. Implement
  3. `npm run e2e:prod`
  4. Screenshot artifacts uploaded to R2
- No feature without ≥1 test
- No bug fix without ≥1 regression test

## Self-application — when this rule is N/A

- **agentskills repo (this repo)** — no deployed app surface; rules + scripts + workflows ship via `git push` to GitHub + npm publish. Deploy+prod-E2E gate is REPLACED with: `validate-packs.mjs` + `sha-pin-actions.mjs --check` + actionlint + ruff + shellcheck/shfmt + markdownlint + semgrep on every push per `lefthook.yml` + `publish.yml` CI. The lint-stack pyramid IS the verification loop for skill-shaped repos.
- **CLI tools without a webapp surface** — same logic: replace E2E-against-prod with unit tests + integration tests + manual smoke at the CLI level.
- **Library packages (`@scope/lib`)** — replace prod-E2E with `npm run test` matrix against supported Node versions + downstream consumer integration tests.

For any repo with a real deployed surface (Cloudflare Worker, Pages, Vercel, etc.), the deploy+prod-E2E mandate applies as written above. No exceptions for "internal-only" or "low-traffic" — the mandate is about deploy hygiene, not user volume.
