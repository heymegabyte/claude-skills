---
name: "06 build-breaking build+slice loop rules"
description: "Universal template-leverage gates: every build's slice loop MUST start from template.projectsites.dev clone (not from scratch), homepage-first vertical slicing, anti-placeholder enforcement (no lorem/TODO/gray-box), incremental visual checkpoints per slice, slice budget gate. Migrated from prompt-improvements brainstorm 2026-05-10."
metadata:
  version: "1.0.0"
  updated: "2026-05-10"
  effort: "high"
  context: "fork"
license: "Rutgers"
compatibility:
  claude-code: ">=2.0.0"
  agentskills: ">=1.0.0"
---

# 06 — Build-Breaking Build + Slice Loop Rules

Initialized from prompt-improvements brainstorm 2026-05-10 — 8 template-leverage rules (#1-8) that bind every build's slice loop.

## Every build (***TEMPLATE LEVERAGE #1 — START FROM `template.projectsites.dev` CLONE — UNIVERSAL — BUILD-BREAKING***)

- Every new site build MUST initialize by cloning the canonical template at `template.projectsites.dev` (R2 bucket `project-sites-template/`)
- NEVER scaffold from-scratch via `npm create vite`

### Template includes

- PWA shell (manifest + sw.js + offline.html)
- 9 favicon assets
- `_creativity_preamble.txt` + `_mission_preamble.txt`
- 4-layer CSS cascade
- Analytics auto-provisioning
- GTM + PostHog + Sentry + GA4 stubs wired
- Turnstile widget
- Resend stub
- Route metadata template
- JSON-LD generators

### Pipeline

1. Orchestrator boot
2. `wrangler r2 object get project-sites-template/dist.tar.gz` → extract
3. Site-specific overrides applied
4. Slice loop begins

### Validator

- `validate-template-origin.mjs` — assert `dist/.template-version` file exists matching current `template.projectsites.dev` SHA AND ≥80% of template files preserved in initial slice 0

## Every build (***TEMPLATE LEVERAGE #2 — HOMEPAGE-FIRST VERTICAL SLICING — UNIVERSAL — BUILD-BREAKING***)

- Every build's slice loop MUST start with homepage slice (`/`) before any secondary route
- NEVER parallel-render all routes from prompt-zero
- Homepage owns — hero, primary CTA, trust signals, value prop, navigation

### Slice order

- **Slice 0** — template clone + brand override
- **Slice 1** — homepage hero + nav + footer (deployable)
- **Slice 2** — homepage feature sections (deployable)
- **Slice 3** — `/about` route
- **Slice 4** — `/contact` route
- **Slice N** — remaining routes in priority order

Each slice ships independently — partial site is better than full-site-broken.

### Validator

- `validate-homepage-first.mjs` — assert `_slice_log.json[0].route === "/"` AND homepage at HEAD-200 before any other route in build trace

## Every slice (***TEMPLATE LEVERAGE #3 — ANTI-PLACEHOLDER ENFORCEMENT — UNIVERSAL — BUILD-BREAKING***)

Every slice MUST ship zero placeholders:

- No `lorem ipsum`
- No `TODO`/`FIXME`/`XXX`
- No gray-box image fallbacks
- No `placeholder.com` URLs
- No `Coming Soon` labels
- No `[Your Name]` template strings
- No `https://example.com` references

### Pipeline

Post-slice grep gate before deploy.

### Validator

- `validate-anti-placeholder.mjs` — grep `dist/**/*.{html,css,js,json}` for forbidden patterns (`/lorem ipsum|TODO|FIXME|XXX|placeholder\.com|coming soon|\[your |\bexample\.com\b/i`) — any match = slice FAIL

## Every slice (***TEMPLATE LEVERAGE #4 — INCREMENTAL DUAL-VISION CHECKPOINT — UNIVERSAL — BUILD-BREAKING — see ~/.claude/rules/visual-inspection.md***)

- Every slice MUST end with Playwright screenshots at 2bp (375 mobile + 1280 desktop) + Claude Vision (Sonnet 4.6, FREE on Max 20x OAuth) scoring 0-10 before next slice fires
- Below 8/10 → apply critique + regenerate (max 2 attempts) → if still <8/10 log to `_visual_failures.json` and continue

### Tier order

- **T1 (FREE)** — Playwright a11y tree + axe-core + DOM-walker contrast first. Catches ~80% with zero token spend.
- **T2 (FREE on Max 20x)** — Claude Vision Sonnet 4.6 on every slice every breakpoint
- **T3 (METERED, $0.50 build cap)** — GPT Image 2 vision JUDGE reserved for hero/ATF slice + brand-fidelity slice vs source-site screenshot + arbitration when Claude Vision <8 OR Claude+a11y-tree disagree

### Consensus

- Both ≥8 → slice ships
- One <8 → remediate (3-round cap)

### Auth context

- Container context = Max 20x OAuth = Claude Vision FREE uncapped
- Worker context = API key = metered both ways → cost-balance there

### Pipeline

1. Slice complete → deploy to staging URL
2. Playwright 2bp screenshots
3. Tier 1 axe-core (FREE)
4. Tier 2 Claude Vision (FREE) with prompt template `(slice_role, brand_palette, target_aesthetic, source_screenshot?) → score 0-10 + evidence per claim`
5. If hero/ATF or brand-fidelity slice, also fire Tier 3 GPT Image 2 vision judge (consumes budget)
6. If Claude<8 or providers disagree, fire Tier 3 arbitration
7. Every vision call logs `{slice_id, vision_provider, auth_mode ("max-oauth"|"api-key"), score, cost_usd}` to `_iteration_log.json.vision_calls[]` + D1 `audit_logs`

### Validator

- `validate-slice-dual-vision.mjs` — assert every slice in `_slice_log.json` has `claude_vision_score >= 8` OR documented `visual_failures` entry AND every hero/ATF + brand-fidelity slice also has `gpt4o_judge_score`

## Every slice (***TEMPLATE LEVERAGE #5 — SLICE TIME BUDGET (10min HOMEPAGE / 5min ROUTE) — UNIVERSAL — BUILD-BREAKING***)

Every slice MUST complete within budget:

- Homepage slice — ≤10min wall-clock
- Secondary-route slice — ≤5min
- Polish slice — ≤3min

Exceeding budget = cut scope, ship MVP slice, surface remainder as recommendation.

### Pipeline

1. Slice timer starts on slice begin
2. At budget-80% checkpoint, orchestrator forces scope-cut (drop optional sections, defer to next iteration)
3. At budget-100%, slice MUST ship deployable state

### Validator

- `validate-slice-budget.mjs` — assert every `_slice_log.json[i].duration_ms` ≤ budget for its slice type AND scope-cuts logged when triggered

## Every slice (***TEMPLATE LEVERAGE #6 — DEPLOYABLE-AT-EVERY-SLICE GATE — UNIVERSAL — BUILD-BREAKING***)

- Every slice MUST end in deployable state
- Never half-broken HTML, never JS errors in console, never broken internal links

### Pipeline

1. Slice complete → `wrangler deploy --env staging`
2. Playwright headless visits 6 breakpoints
3. Console-error count must be 0
4. Broken-link count must be 0
5. Failures roll back to previous slice

### Validator

- `validate-deployable-slice.mjs` — assert post-slice staging deploy returns 200 + console-errors === 0 + broken-links === 0 across all 6 breakpoints

## Every slice (***TEMPLATE LEVERAGE #7 — REAL CONTENT FROM RESEARCH ARTIFACTS — UNIVERSAL — BUILD-BREAKING***)

- Every slice MUST source its copy + media from build's pre-research artifacts (`_research.json`, `_corpus.json`, `_media_extraction.json`, `_brand.json`)
- NEVER LLM-fabricated content

### Pipeline

- Slice prompt receives `(slice_role, route, research_artifacts[]) → renders only with provided facts`
- LLM may rephrase + condense + structure, never invent
- Pipeline gate — every quantitative claim in slice output (%, $, N, dates) MUST cite `_research.json.refId` per `~/.claude/rules/citations.md`

### Validator

- `validate-real-content.mjs` — assert every `<section data-slice="X">` has at least one cite reference into `_research.json` OR `_corpus.json` AND no quantitative claim ships uncited

## Every slice (***TEMPLATE LEVERAGE #8 — SLICE LOG AS BUILD-OUTPUT ARTIFACT — UNIVERSAL — BUILD-BREAKING***)

Every build MUST emit `_slice_log.json` capturing per-slice metadata:

```
{slice_id, route, role, started_at, ended_at, duration_ms,
 files_changed[], visual_score, console_errors[], broken_links[],
 scope_cuts[], cite_count, recommendations_emitted[]}
```

- Log surfaced under `/admin/build-trace` route post-deploy for owner inspection

### Validator

- `validate-slice-log.mjs` — assert `_slice_log.json` exists + has entry per slice + all 12 fields populated
