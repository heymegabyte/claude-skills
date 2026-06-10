---
name: "quality-and-verification"
description: "5-level verification pyramid: static→unit→Playwright E2E (homepage-first, 6bp)→AI visual→post-deploy. 8-check quality gate. Multi-agent testing (functional/security/a11y/performance). Playwright v1.59+ AI agents (Planner/Generator/Healer). WCAG 2.2 AA via axe-core v4.11. Percy+Chromatic visual regression. ADA Title II 2027/2028 deadlines."
metadata:
  version: "2.1.0"
  updated: "2026-05-03"
  effort: "high"
  model: "sonnet"
license: "Rutgers"
compatibility:
  claude-code: ">=2.0.0"
  agentskills: ">=1.0.0"
submodules:
  - accessibility-gate.md
  - adversarial-testing.md
  - agentic-security.md
  - audio-video-sync.md
  - build-breaking-rules.md
  - chrome-and-browser-workflows.md
  - completeness-verification.md
  - computer-use-automation.md
  - contract-testing.md
  - e2e-accumulation.md
  - eval-driven-development.md
  - evidence-collection.md
  - performance-optimization.md
  - picovoice-eagle-biometric.md
  - security-hardening.md
  - semgrep-codebase-rules.md
  - slop-detection.md
  - spec-driven-development.md
  - stagehand-ai-fallback.md
  - stagehand-ai-testing.md
  - tdd-verification.md
  - testing-matrices.md
  - ui-completeness-sweep.md
  - visual-inspection-loop.md
  - visual-regression.md
  - wcag-2-2-2026.md
priority: 2
pack: "testing"
triggers:
  - "test"
  - "verify"
  - "qa"
  - "lighthouse"
paths:
  - "*"
---

# 07 — Quality and Verification

## 5-level pyramid (bottom to top)

1. **Static** — TS strict + ESLint + oxlint + Prettier + knip (dead code)
2. **Unit** — Vitest 3 (40% faster on 5k+ tests, Rust sharding, browser mode default)
3. **Playwright E2E** — homepage-first, 6 viewports × 3 browsers, hermetic, parallel
4. **AI visual** — vision rubric ≥8/10 per route, 6bp screenshots
5. **Post-deploy** — `wrangler tail` clean + console-error-free + axe-clean + Lighthouse green

## 8-check quality gate (every PR)

1. `npm run typecheck` clean (0 errors)
2. `npm run lint` clean (0 errors, 0 warnings)
3. `npm test` (Vitest) green
4. `npm run e2e:prod` green at 6 breakpoints
5. axe-core 0 violations per `_kernel/standards.md#wcag22`
6. Lighthouse Perf ≥75, A11y ≥95, BP ≥95, SEO ≥95
7. AI vision QA ≥8/10 per route
8. Console / CSP / network errors = 0

Any fail = blocker. Fix-forward per `rules/verification-loop.md`.

## Playwright Test Agents (v1.59+)

- `npx playwright init-agents --loop=claude` once per repo
- **Planner** — Markdown plan
- **Generator** — test code
- **Healer** — auto-fix broken selectors (run before manual rewrite)
- `browser.bind()` for MCP interop
- `page.screencast` for video receipts on flaky specs

## Hermetic spec contract (per `rules/e2e-tdd-organization.md`)

1. Starts at homepage (`/`); navigates via clicks/keyboard
2. Seeds own data via `_fixtures/`
3. Cleans own data after-each
4. Doesn't write to localStorage / IDB / cookies next spec reads
5. Doesn't depend on Date.now() / timezone / random
6. Doesn't open network to live third-party APIs (MSW / stub)

Violating any = build fail.

## Parallel execution

- `fullyParallel: true`
- `workers: process.env.CI ? '50%' : '75%'`
- Sharded via `--shard=$INDEX/$TOTAL`
- 6 viewports per `_kernel/standards.md#breakpoints`
- 3 browsers: Chromium, Firefox, WebKit

## AI visual QA

- Random snapshot sampling 30% per step (seeded hash, reproducible)
- New-section AI vision: `e2e/__seen-routes__.json` gates first render of any unknown route
- Rubric: layout sane / contrast WCAG AA / brand / no slop / ≥8/10 (Claude Sonnet 4.6 or GPT Image 2 vision)
- Baselines in `e2e/__snapshots__/`
- Pixelmatch tolerance 0.1% / 0.5% area

Per `rules/e2e-visual-inspection.md`.

## Visual regression

- **Percy AI Visual Review** — 3× faster review, 40% OCR-based noise filter, full-page + flows
- **Chromatic** — component-level via Storybook
- **pixelmatch** — local deterministic CI

Three-tier: local → PR → deploy.

## Multi-agent testing

Spawn parallel in single `Agent` call:

- **functional-tester** — happy path + edge cases
- **security-reviewer** — OWASP Top 10:2025 per `_kernel/standards.md#owasp2025`
- **accessibility-auditor** — axe 6bp + WCAG 2.2 manual review
- **performance-profiler** — Lighthouse CI + bundle audit + INP via LoAF
- **visual-qa** — AI vision rubric ≥8/10

Each: 100-300 word brief, ≤200 word summary back. Per `rules/agent-selection.md`.

## INP debugging

- `PerformanceObserver` type `long-animation-frame` (LoAF, Chrome 123+)
- For SPA per-route CWV: web-vitals v4+ w/ `softNavs:true`
- Target ≤100ms cinematic, ≤200ms = fail per `_kernel/standards.md#cwv`

## Console-error gate

- After every deploy, check browser console for CSP violations, JS errors, failed resources
- ALL must be 0 before marking complete
- Fixed by `rules/verification-loop.md` console-error gate

## E2E accumulation

- Tests NEVER deleted, only appended
- `journey.spec.ts` serial + stateful — each feature adds steps
- 100% feature coverage matrix in `e2e/FEATURES.md`
- Removed features: skip + comment, don't delete

## Inventory enforcement

- `e2e/FEATURES.md` — row per feature
- `e2e/COVERAGE.yml` — feature→spec map; CI fails on any feature without entry/test
- Pre-commit lint: new component without matching `e2e/<feature>/` warns

## See submodules: ai-vision-qa.md, multi-agent-testing.md, visual-regression.md.
