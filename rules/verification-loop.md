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

## Post-deploy smoke test (canonical 5-min recipe — run after EVERY deploy)

A build that passes `npm run check`/CI is NOT verified — local gates can't see prod headers, the live Service Worker, or real DNS. After every deploy, run this against the PROD URL. Six surfaces, each with an explicit pass condition. Any red → `wrangler rollback` + fix-forward (max 3 redeploys).

The curl-only steps (health, 404-status, donation API) run headless in ~20s and catch the most common breakages; the browser steps (offline, error-boundary, render) need real Chrome.

1. **Homepage sanity** — `GET /` → 200, paints (H1 + nav), `document.getElementById('root').innerHTML.length > 0`, ZERO red console errors. Blank/white/5xx = roll back now.
2. **404 (both halves)** — a styled 404 page AND a real `404` status. `curl -s -o /dev/null -w "%{http_code}" /this-page-does-not-exist` → **404** (a `200` is a soft-404 regression that indexes junk URLs); `curl … /<real-route>` → **200** (a real route must not false-404). In-browser: the friendly 404 renders with a working Home link.
3. **Offline (PWA)** — visit once to install the SW (DevTools → Application → Service Workers: activated), then DevTools → Network → **Offline** → reload → the **branded `offline.html`** appears (not the browser dino, not a raw error). Cached routes still load. SW often registers prod-only + idle-deferred — wait a beat before testing.
4. **Error boundary** — a render crash shows the recovery card ("Something went wrong" + Reset/Refresh/Sign-out), never a white screen. There's usually no user-facing "break me" button by design, so the authoritative gate is a unit test rendering a throwing child + asserting the fallback (`tests/unit/error-boundary.test.ts`); the manual step is a spot-check.
5. **API health + security headers** — `GET /api/health` → `{status:"ok"}`, response carries `strict-transport-security`/`content-security-policy`; `GET /api/<bogus>` → clean JSON **404** (not the SPA shell — an unmatched `/api/*` returning 200 index.html is a soft-404).
6. **Donation/conversion happy-path** — the revenue route (`/donate`) renders live counters + form; its data API (`/api/campaigns`) returns live JSON (not just static fallback); amount selection enables the pay button + mounts the payment field. **Never submit a real card in a manual pass** — a test card belongs in the E2E suite, not post-deploy smoke.

- **Soft-404 doctrine**: unknown HTML path = real 404 STATUS while still serving the SPA shell (so the styled 404 page renders). Gate the known-route set in a shared SSOT module (`known-routes.ts` / `isKnownRoute`) imported by BOTH the Worker's status-rewrite AND the build-time link validator so they can't drift; unit-test `isKnownRoute` directly (the ASSETS-fallback path often isn't reachable in the Miniflare workers pool).
- **Offline contract**: SW precaches `offline.html` at install; `networkFirstNav` falls through cached → index → shell → `offline.html` → 503. Bump `CACHE_VERSION` whenever the precache list changes.
- Per-project full runbook lives at `docs/smoke-test.md` (reference impl: njsk.org). Copy it into every deployed-surface project; tailor route names + campaign/feature specifics.

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

<!-- grow-ok -->
<!-- Growth justified: folded vendored Superpowers verification-before-completion discipline (2026-06-28, user request) — net-new epistemic layer, not redundancy. -->

## Folded from Superpowers — verification-before-completion

*Vendored discipline from [obra/Superpowers](https://github.com/obra/Superpowers) (MIT, Jesse Vincent). Full skill: [[20-superpowers]] → verification-before-completion/SKILL.md.*

- Epistemic layer atop the deploy gates: claim ONLY what you verified this turn — evidence before assertions, always.
- Iron law: no completion claim without FRESH verification evidence. If you didn't run the command in this message, you can't claim it passes.
- Gate before any success/satisfaction statement: identify the proving command → run it FULL → read full output + exit code → confirm it backs the claim → only then claim, WITH the evidence.
- Paste/observe the actual command output before any "done/passing/fixed" wording — a prior run or "looks correct" is not evidence.
- Applies to ALL completion language: exact phrases, paraphrases, synonyms, and any wording that merely IMPLIES success. Spirit over letter.
- Red-flag rationalizations that mean STOP-and-run, never ship: "it should work", "I'm confident", "the change is trivial / just this once", "I'm tired", "partial check is enough".
- "Confidence ≠ evidence" and "linter passing ≠ compiler/build passing" — distinct gates, each needs its own command output.
- Trusting an agent's "success" report is not verification — independently check the VCS diff / artifacts before relaying completion.
- Requirements met ≠ tests pass: re-read the plan, build a line-by-line checklist, verify each item, report gaps or completion.
- Binding before committing, pushing, or opening a PR — these are completion claims and demand the gate first.
- See [[20-superpowers]]
