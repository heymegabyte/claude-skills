# Evals

AI is foundational to many product surfaces — and like every other foundational layer, it gets first-class quality tracking. AI-heavy behavior MUST have eval cases, structured rubrics, schema-validated results, and regression tracking. Code tests prove the plumbing works; evals prove the AI layer's quality holds across model + prompt + context changes. Evals are to AI what unit tests are to logic + Lighthouse is to perf — standard quality discipline applied to a load-bearing layer.

This rule fires whenever a feature's value depends on model output: site generation, copy synthesis, classification, summarization, prompt-following, design generation. It complements skill 07 (quality-and-verification) + AI-vision QA — evals score the AI's *generation quality*, E2E scores *runtime behavior*.

## Why
- **Generation quality drifts** as prompts, models, or context evolve — evals catch the regression on the commit that caused it instead of the customer report a week later.
- **Subjective output needs a rubric**, not a boolean assertion — a dimension score 0-10 beats `expect(out).toBe(...)`.
- **Regression history** turns "it felt worse" into "feature_module_compliance dropped 8.2 → 6.1 on commit abc".
- **Schema-validated results** make eval output composable + auditable per ``contract-first-ai``.

## Each eval case ships ALL of these
- **Input** — the exact prompt / context / fixture fed to the AI
- **Expected behavior** — what a passing generation looks like, in plain language
- **Scoring rubric** — named dimensions, each 0-10, with what each score means
- **Automated grader** — where practical: schema check, regex, AI-judge call, axe-core, Lighthouse
- **Human-readable result** — `{ caseId, scores{}, composite, notes }` rendered for a human reviewer
- **Regression history** — every run appended to `tools/evals/results/<slug>.ndjson` for trend tracking

## Result objects are Zod-validated
- Every eval result conforms to a Zod `EvalResult` schema per ``contract-first-ai``.
- Shape: `{ caseId, slug, scores: Record<Dimension, number>, composite, verdict, notes, ranAt, model }`.
- Grader output is parsed at the boundary like every other input per `zod-everywhere` — typed contract in, typed contract out.

## Eval dimensions
- `feature_module_compliance` — does generated code match ``feature-module-architecture``?
- `type_safety` — strict TS, no `any`, typed boundaries
- `zod_validation` — Zod at every input/output per ``zod-everywhere``
- `test_coverage` — generated code ships matching tests
- `e2e_quality` — Playwright specs hermetic + homepage-first
- `design_system_compliance` — brand tokens, no hardcoded hex, ``cinematic-ui-patterns``
- `i18n_compliance` — locale mirrors per ``i18n-by-demographics``
- `accessibility` — WCAG 2.2 AA, axe 0 violations
- `performance` — LCP/CLS/INP within budget
- `observability` — Sentry breadcrumbs + structured logs present
- `security` — CSP/Trusted Types/secret hygiene, OWASP 2025
- `prompt_following` — did the output do what the prompt actually asked?

## Harness
- `tools/evals/` — eval cases (`<slug>.cases.ts`), graders (`graders/`), runner (`run.ts`).
- `pnpm evals` (or `npm run evals`) — runs all cases, validates results, appends to `results/<slug>.ndjson`.
- `pnpm evals --slug <name>` — single-feature run during iteration.
- Store results per-commit; surface composite-score deltas vs the prior run in CI output.
- AI-judge calls route through ``model-routing`` — Opus for nuanced quality scoring, Haiku for cheap binary checks.

### Do
- Write eval cases BEFORE tuning a prompt — watch the score move
- Use a structured rubric (named dimensions 0-10), never a vibe
- Validate every grader result with Zod — same boundary discipline as every other input
- Append every run to NDJSON so regressions are visible as a trend
- Gate CI on composite-score regression beyond a threshold (e.g. −1.5)

### Don't
- Ship an AI-heavy feature with only unit tests + no evals
- Trust a raw AI-judge response without schema validation
- Overwrite eval results — append, so regression history survives
- Conflate evals with E2E — evals = generation quality, E2E = runtime behavior

## See
- `contract-first-ai` — eval `EvalResult` objects are Zod-validated typed contracts
- `verification-loop` — evals sit alongside the deploy + prod-E2E mandate, scoring generation not runtime
- `e2e-visual-inspection` — AI-vision QA grades rendered surfaces; evals grade upstream generation quality
- `drift-detection` — eval-score regression is a drift signal; both gate the merge
- `model-routing` — AI-judge graders use Opus for nuance, Haiku for cheap binary checks
