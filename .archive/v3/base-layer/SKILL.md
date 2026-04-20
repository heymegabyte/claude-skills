---
name: Base Layer — CloudFlare + Angular SaaS
slug: cloudflare-angular-saas
alias_folder: base-layer
description: >
  Single shared base execution skill for Claude Code via Emdash.sh across Megabyte
  repos. Encodes Cloudflare+Angular/Hono defaults, recursive TDD, homepage-first
  Playwright E2E, production-only verification, visual inspection, aggressive
  linting/autofix, Semgrep progressive principle memory, documentation rigor,
  and CLAUDE.md + site-skill evolution on every feature.
version: 7.0.0
priority: critical
tags:
  - base-layer
  - cloudflare
  - angular
  - ionic
  - hono
  - neon
  - clerk
  - stripe
  - posthog
  - semgrep
  - playwright
  - tdd
  - emdash
  - claude-code
triggers:
  - "use base-layer"
  - "cloudflare angular saas"
  - "claude code emdash"
  - "playwright e2e tdd"
  - "autonomous build loop"
---

# Base Layer — CloudFlare + Angular SaaS

This is the **single shared base skill** for all Megabyte site overlays.

It governs:
- execution loop / autonomy behavior
- stack defaults and operational defaults
- quality gates / autofix / anti-regression checks
- testing + verification (local and post-deploy)
- deployment + production-only validation
- documentation + skill evolution
- Semgrep-based progressive principle codification

Site overlays stay domain-specific and **must not duplicate** these base rules.

## Auto-Inclusion Model (Claude Code via Emdash.sh)

1. Always load `.agentskills/base-layer/SKILL.md` (this file).
2. Prefer user-selected overlay if Emdash already specifies one.
3. Otherwise auto-detect one primary site overlay using repository evidence.
4. Load `.agentskills/<site>/SKILL.md`.
5. Execute using:
   - **base-layer process + quality + verification + Semgrep rules**
   - **site overlay product/domain rules**

Assume **one repository per website** unless strong evidence shows a multi-site repo.

## Site Overlay Auto-Detection (precedence)

Use this precedence order (highest wins):
1. Explicit user/Emdash selection
2. `CLAUDE.md` declared site
3. git remote URL / repository name / workspace folder
4. deployed production domain / Cloudflare routes
5. package/app names and branding strings
6. env var/service identifiers
7. README/docs references

If ambiguous, choose the strongest match, continue, and record the assumption in the run report.

## Platform Defaults (inherit across all site overlays)

Unless a site overlay explicitly overrides, use these defaults:

- **Frontend:** Angular (Ionic where mobile-style UX makes sense)
- **Backend/API:** **Hono on Cloudflare Workers** by default
- **Database:** **Neon only** (no Supabase by default)
- **Async jobs / queueing:** **Cloudflare Queues**
- **Auth:** **Clerk**
- **Billing:** **Stripe** with **Stripe Link preferred** when feasible
- **Analytics / product instrumentation:** **PostHog**
- **Observability (mandatory):**
  - **Sentry** (errors/tracing where applicable)
  - **PostHog** (product analytics + feature flags/experiments)
  - **structured logs** (JSON/logfmt, request correlation where possible)

### Feature Flags / Experiments (default)
- Use **PostHog** feature flags/experiments by default.
- Flags must be documented in `CLAUDE.md` (name, purpose, default, rollback plan).
- Remove stale flags during cleanup passes.

## Package Manager / Command Strategy (autodetect-first)

Use what the repo already uses, prioritizing success over ideology.

- Prefer lockfile detection:
  - `pnpm-lock.yaml` → `pnpm`
  - `package-lock.json` → `npm`
- If neither exists, default to `pnpm` first, then fallback to `npm`.
- Record the chosen package manager in the run report if first-time detection.
- Do not rewrite package manager choice unless explicitly requested.

## Core Delivery Contract (every feature)

For every behavior-affecting feature/change, the agent must:

1. Define a **small vertical slice** + acceptance criteria
2. Add/update tests **first** (unit/integration + homepage-first Playwright E2E path)
3. Implement the smallest slice
4. Run targeted autofix + checks during development
5. Run full quality + test + Semgrep verification
6. Perform local visual inspection
7. Deploy to the **production URL** (or commit preview link if that repo uses previews)
8. Run post-deploy Playwright E2E + post-deploy visual inspection
9. Update docs + skills (`CLAUDE.md`, site overlay, local mirror append where reusable)
10. Produce an evidence-rich end-of-run report with recommendations

No “done” claim is valid without verification evidence.

## Recursive Autonomous Development Loop (required)

Repeat this loop until the requested feature set is complete.

1. **Plan slice**
   - one vertical slice max (avoid broad multi-feature jumps)
   - define acceptance criteria and edge cases
   - map the slice to a homepage-first user journey

2. **Test first**
   - unit/integration tests for changed logic
   - homepage-first Playwright E2E starting from `/`
   - include success path + at least one error/empty/edge path
   - include auth/permission path if applicable

3. **Implement**
   - code only enough for the slice
   - preserve instrumentation and observability hooks
   - avoid broad refactors unless needed to unblock the slice

4. **Background quality/autonomy pass (during the loop)**
   - run file-type-specific linters/formatters on touched files
   - run safe autofixes immediately
   - run targeted Semgrep on touched areas + project rules
   - apply deterministic Semgrep autofix (safe cases only)
   - re-run affected tests/checks

5. **Local verification**
   - lint / format / typecheck / tests
   - Playwright E2E (Chromium)
   - visual inspection (screenshots + checklist notes)

6. **Stop-and-fix guard**
   - if any check fails, stop feature expansion
   - fix before proceeding
   - do not stack more slices while broken

7. **Deploy + production verification**
   - deploy to the canonical production URL (or commit preview if explicitly available/required)
   - run post-deploy Playwright E2E (Chromium)
   - perform post-deploy visual inspection
   - confirm environment parity (routes, hosts, secrets, flags)

8. **Learn + codify**
   - repeated issue/recommendation (twice) ⇒ codify into Semgrep/lint/docs rule
   - add/update rule tests
   - update `CLAUDE.md`
   - update site overlay skill
   - append to local mirror `~/.agentskills/<site>/SKILL.md` when reusable

## Required Quality Stack (automatic across all sites)

Run applicable tools automatically when related file types change, and run a broader pass before completion/deploy.

### JavaScript / TypeScript / Angular / Ionic
- **ESLint** (required) with TypeScript + Angular support
- Include **Standard-inspired baseline** (`eslint-config-standard` style conventions) plus project/custom rules
- Autofix: `eslint --fix` for safe fixes
- Always include **TypeScript typecheck** (`tsc --noEmit` or Angular equivalent)

### Stylesheets
- **Stylelint** (required for CSS/SCSS/etc.)
- Autofix: `stylelint --fix`

### HTML / templates / generated static HTML
- **HTMLHint** (required where applicable)
- Apply to standalone HTML, template-heavy outputs, docs-site HTML, and other repo HTML artifacts

### Shell scripts
- **ShellCheck** (required)
- **shfmt** (required formatter) for shell scripts
- Prefer `bash -n` / `sh -n` syntax checks in addition to ShellCheck
- For `install.doctor`, shell checks are release-blocking

### Dockerfiles / container build files
- **Hadolint** (required on all repos with Dockerfiles)

### Python
- **black** (required formatter)
- **flake8** (required lint)
- Even if Python is just tooling scripts, these checks still apply

### Duplication control
- **jscpd** (required)
- Run on changed scopes during development and a broader pass before completion
- Default thresholds (tunable per repo, but start here):
  - app/source code: **<= 3%**
  - tests: **<= 8%**
  - docs/examples/generated snippets: **<= 12%**
- If duplication is intentionally retained, document why in `CLAUDE.md` or the run report

### Semgrep (principle memory + autonomy engine)
- Run **Semgrep** early and often:
  - before implementation (constraint scan)
  - during development (touched areas)
  - pre-deploy gate
- Maintain project-specific Semgrep rules that encode recurring principles:
  - security, correctness, observability, testing discipline, docs discipline, anti-shortcut rules
- Safe deterministic autofix is allowed for simple rewrites only
- Do not use Semgrep autofix for auth logic, concurrency, complex refactors, or ambiguous behavior

### Additional no-brainer checks (integrated into base-layer)
Apply when relevant and propose adding if missing:

- **markdownlint** (docs structure)
- **cspell** (docs/names/identifiers)
- **yamllint** (CI/config YAML)
- **actionlint** (GitHub Actions)
- **gitleaks** or equivalent (secret scanning)
- **commitlint** (commit convention enforcement aligned with release/changelog strategy)

## Semgrep Progressive Improvement Strategy (required)

### Purpose
Semgrep is not just a final scanner; it is the **project’s executable memory of principles**.

### Enforcement model (default)
- **Block immediately** for high-confidence/high-risk categories:
  - secrets exposure
  - unsafe shell execution patterns
  - auth/session/token leakage patterns
  - clearly dangerous network/file patterns
- **Warn/monitor first**, then promote to block once tuned:
  - architecture conventions
  - testing discipline patterns
  - docs/governance patterns
  - UI/Angular structural preferences

### Rule promotion trigger
If a mistake/recommendation repeats **twice in the same repo**, codify it:
1. Semgrep rule (preferred for semantic/static patterns) **or**
2. stricter linter rule/config **or**
3. docs/governance rule in `CLAUDE.md` + site overlay

Then:
- add rule tests/validation samples
- rerun scans
- record the change in `CLAUDE.md` and site overlay
- append reusable learnings to `~/.agentskills/<site>/SKILL.md`

### Good Semgrep targets for autonomous improvement
- skipped/disabled tests left in committed suites
- TODO/FIXME placeholders in production paths
- unsafe logging of tokens/headers/cookies
- missing timeout/abort on outbound requests
- direct DOM manipulation outside approved wrappers
- missing validation before data mutation
- brittle selectors in critical Playwright specs
- fake success handlers/stubs left active
- missing observability on critical workflows
- undocumented feature flags / hidden kill-switch behavior

## Verification Pyramid (required)

### 1) Static / structural checks
- formatting
- linting
- type checks
- Semgrep
- duplication checks
- config/workflow checks (Hadolint/ShellCheck/HTMLHint/etc.)

### 2) Unit / integration tests
- test changed logic and edge/error cases
- no skipped tests without documented reason

### 3) Homepage-first Playwright E2E (local)
- every user-facing feature change must be reachable from `/`
- assert happy path
- assert at least one failure/empty/edge condition where relevant
- use **Chromium** by default
- store artifacts (trace/screenshots/video if configured)

### 4) Visual inspection (local) — required
Playwright passing is necessary but not sufficient. Inspect and record:
- layout integrity
- loading/error/empty states
- typography/copy regressions
- focus/keyboard basics (where relevant)
- obvious animation/transition breakage
- responsive checks **when relevant** (mobile matrix is not required by default)

### 5) Post-deploy verification (required; production-first)
- run Playwright E2E against the **production URL**
- commit preview URLs are allowed only when the repo/platform already provides them
- do not require separate staging/dev environments by default
- perform post-deploy visual inspection
- verify environment parity (env vars, routes, hosts, flags)
- record deploy URL / commit SHA / timestamp in run report

### Visual regression snapshots
Recommended (not mandatory) for stable/high-value flows, in addition to manual visual inspection.

## Testing Coverage Defaults (pragmatic minimums)

For each user-facing feature touched, aim for:
- **1 happy path**
- **1 error/empty/edge path**
- **1 auth/permission path** (if auth/roles apply)

Prefer deterministic fixtures/seeds for E2E and integration tests.
Document seed/reset commands in `CLAUDE.md`.

## Documentation & Knowledge Evolution (required every feature)

Update all applicable artifacts **every meaningful feature change**:

- `CLAUDE.md` (always update for feature/workflow/architecture/test/command changes)
- `.agentskills/<site>/SKILL.md` (site-specific reusable patterns; touch/update every run)
- `~/.agentskills/<site>/SKILL.md` (append reusable learnings by default)
- project docs / runbooks / diagrams / API docs / TypeDoc

### Documentation quality standards (strict)
- **TypeDoc required** for exported TS/JS APIs; undocumented exports should fail the docs gate
- **Mermaid** is the default diagram format
- use tables for commands/env vars/test matrices/flag inventories
- include references/links to source files/specs/issues/decisions
- include **alternatives considered / why this choice**
- list assumptions, limitations, and rollback notes where relevant
- no stale placeholders

## End-of-Run Artifacts (required)

Produce and/or summarize all of the following (all-the-above policy):
- markdown verification checklist / notes
- machine-readable verification report (JSON)
- screenshots and Playwright artifacts (trace/video if available)

## End-of-Run Report (required)

At the end of every run, include:

1. implemented slices / changes
2. tests added/updated (unit/integration + homepage-first Playwright)
3. quality checks run + autofixes applied
4. verification evidence (local + post-deploy + visual)
5. Semgrep findings/fixes + rule promotions (or why none)
6. docs/skills updated (`CLAUDE.md`, site overlay, local mirror append)
7. at least **5 recommendations** to improve code/tests/docs/autonomy/perf/security

## Conflict Resolution with Site Overlays

- Base layer governs process, stack defaults, quality, testing, deploy verification, docs, and autonomy.
- Site overlay governs product/domain-specific logic and constraints.
- If rules conflict, keep the stricter verification/documentation/security rule.
- Site overlays may narrow/extend domain behavior, but must not weaken the base layer.
