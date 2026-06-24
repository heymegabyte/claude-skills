---
name: "code-style"
priority: 2
pack: "core"
triggers: []
paths:
  - "*"
---

# Code Style

Enforce TS 5.9+ strict mode, Google TS Style, ESM-only imports, and Cloudflare Workers-compatible patterns across all TypeScript and Angular code.

## TypeScript (Google TS Style)

- **TS 5.9+** — `strictInference: true`, `isolatedDeclarations: true`, `erasableSyntaxOnly` for Node 22 native TS.
- camelCase vars/fns · PascalCase types · CONSTANT_CASE consts.
- `interface` over `type`. Relative imports. Never `any` — use `unknown`. Never `@ts-ignore`.
- `readonly` when not reassigned. `undefined` over `null`.
- Zod = source of truth. JSDoc: intent not types. NEVER JavaScript.

### Runtime

- **Node 22 LTS native TS strip-types** — no ts-node/tsx/nodemon; use `node --watch` + `node --run`.
- **Bun 1.2+** for build-tool workloads (~125k req/s, 8ms cold start).
- `wrangler types` against compatibility_date + bindings (not just `@cloudflare/workers-types`).

### Lint

- ESLint 9 flat config (`eslint.config.ts`) + typescript-eslint v8 + angular-eslint + eslint-plugin-perfectionist + eslint-plugin-security + `--fix` on save.
- **oxlint** pre-commit speed pass (50-100× ESLint, no formatting).
- **knip** dead code/unused deps (CI weekly). **jscpd** duplicate detection (≤1%). **dependency-cruiser** architecture rules.
- Prettier formats (`.prettierrc`). Pre-commit: `oxlint && eslint --fix && prettier --write`.
- NEVER Biome — no plugin system; breaks angular-eslint + security + drizzle plugins.
- Git hooks via **lefthook** (10× husky, parallel, Go binary).
- Track ESLint v10 migration before Aug 2026 (v9 EOL).

## Angular

- Standalone only (Angular 21). Signals stable: signal/computed/effect/linkedSignal/resource.
- HttpResource for data fetching. Zoneless stable: `provideZonelessChangeDetection`.
- Control flow: `@if`/`@for`/`@switch`/`@defer` — `ngIf`/`ngFor` deprecated v20, removed v22.
- kebab-case files. One component/file. Prefix `app-`/`lib-`. Inline template if <3 lines. `providedIn:'root'`.
- **Spartan UI** (shadcn-for-Angular) only; + Angular CDK + Floating UI primitives. NO PrimeNG/Material.
- **Angular built-in i18n** (`@angular/localize`) — not ngx-translate/Transloco.
- Angular for large apps (dashboards/admin/PWA/multi-tenant/builders/AI consoles); React for small sites. See `stack-selector.md`.

## Hono

- Inline handlers (type inference). RPC: `hc<AppType>` for client.
- **WorkerEntrypoint** + service bindings for internal Worker-to-Worker (promise pipelining, 32 MiB payload, JSRPC compat `2024-04-03`).
- `@hono/zod-validator` all bodies. `@hono/zod-openapi` for OpenAPI generation — **superseded for new OpenAPI work** by `hono-openapi` + `@asteasolutions/zod-to-openapi` (see `hono-api.md`).
- Centralized `onError()` + `notFound()`. Error shape: `{error,code?,details?}`.
- Split routes: `app.route('/path',subApp)`. KV rate-limit. Turnstile all forms. `GET /health`.
- `createFactory()` for reusable middleware chains. Method chaining: `app.use().get().post()`.

## Testing (Playwright v1.56+ agents, v1.59+ MCP interop, Vitest 3)

- TDD: failing test FIRST → implement → pass.
- Every test starts at homepage, navigates via clicks (never `page.goto()` after initial load).
- Use `page.click()`, `page.keyboard.type()`, `page.keyboard.press('Tab')`, `page.mouse` — never bare API calls for UI features.
- Test account: `test@megabyte.space` (TEST_USER_PASSWORD env). No sleeps — `waitFor`/`toBeVisible()`.
- Selectors: `data-testid`/role/text. 6 breakpoints: 375, 390, 768, 1024, 1280, 1920.
- Parallel-safe + deterministic. axe-core 0 violations. `PROD_URL` env var.
- Stagehand AI fallback when selectors break.

### Playwright Test Agents (v1.56+)

- Planner → Markdown plan · Generator → test code · Healer → auto-fix selectors.
- Init: `npx playwright init-agents --loop=claude`. v1.59+: `browser.bind()` MCP interop + `page.screencast`.
- MCP a11y tree > screenshot-based. Vitest 3: Rust sharding, browser mode default, 40% faster on 5k+ tests.

### E2E accumulation

- Tests NEVER deleted, only appended. `journey.spec.ts` serial + stateful — each feature adds steps.
- Never `page.goto()` for internal nav. 100% feature coverage matrix in SPEC.md.
- One-line code changes run FULL suite. Removed features: skip + comment, don't delete. See `07/e2e-accumulation`.

## CSS

- Cascade layers: `@layer reset, base, components, utilities`. Native nesting (no preprocessor).
- **Container queries** — Baseline Widely Available (2025). **`:has()`** — Baseline Newly Available (Firefox 121+, Safari 15.4+).
- `@starting-style` for enter animations. **Popover API** — Baseline Newly Available.
- **Anchor positioning** — Chrome/Edge 133+, Firefox late 2025, Safari Interop 2025; polyfill v0.7+ for Safari.
- OKLCH color; `color-mix(in oklch, ...)` for derived shades. `text-wrap: balance` headings, `pretty` body.
- **View Transitions**: same-document SPA GA Chrome+Safari 18+; cross-document MPA Chrome 126+, Safari 18+, Firefox 144 (Oct 2025) — `@view-transition { navigation: auto; }`.
- **Scroll-driven**: Chrome stable, Safari 26 (2025); Firefox unsupported — pair `prefers-reduced-motion` AND `animation-duration:1ms` fallback.
- `color-scheme: dark` on dark-first sites.

## Accessibility (WCAG 2.2 AA)

### 9 new 2.2 criteria (correct levels — commonly mislabeled)

- 2.4.11 Focus Not Obscured (Minimum) — **AA**
- 2.4.12 Focus Not Obscured (Enhanced) — AAA
- 2.4.13 Focus Appearance — AAA
- 2.5.7 Dragging Movements — **AA**
- 2.5.8 Target Size (Minimum, 24px) — **AA**
- 3.2.6 Consistent Help — A
- 3.3.7 Redundant Entry — A
- 3.3.8 Accessible Authentication (Minimum) — **AA**
- 3.3.9 Accessible Authentication (Enhanced) — AAA

- **"axe 0 violations ≠ accessible."** axe-core catches ~57% of issues by volume, ~30% of WCAG SC fully automated; auto-tests ONLY 2.5.8 of the 9 new criteria. The 6 AA-level criteria (2.4.11, 2.5.7, 2.5.8, 3.2.6, 3.3.7, 3.3.8) require MANUAL review — never claim AA from a green axe run alone.
- **2.5.8 inline exemption is NARROW.** Covers `<a>` text links in running prose only. Any chip/pill/tag/badge/button with a real border OR non-transparent background is a box control — must clear 24px. A 23px bordered chip is an AA failure axe never flags. Classify by box-vs-inline (not tag). Remedy: `inline-flex min-h-[24px] items-center`.

### ADA + EU deadlines

- DOJ Title II ≥50K pop → Apr 26 2027; <50K / special districts → Apr 26 2028 (WCAG 2.1 AA).
- HHS Section 504: May 2026 for federal-fund healthcare.
- **EU EAA** live Jun 28 2025 (EN 301 549 ≈ WCAG 2.1 AA) for EU-facing e-commerce/banking/media — fines to €3M / 4% rev.
- WCAG 3.0 Working Draft Mar 3 2026 (Bronze/Silver/Gold, ~174 requirements; CR ~Q4 2027) — keep targeting 2.2 AA.

## Bash

- camelCase fns, UPPER_CASE vars. ShellCheck + shfmt. shdoc format. Cross-platform. Idempotent.
- Output: `source ~/.claude/hooks/style.sh` then `emdash_*` functions — NEVER raw echo.
- Tools: gum (style/log/spin/confirm), glow (markdown render), freeze (code → PNG), vhs (record terminal), mods (AI in CLI).

## Python

- Ruff (replaces black + isort + flake8). mypy for types. `pyproject.toml` all config. Poetry for deps.
- Pre-commit: `ruff check --fix && ruff format`. NEVER black + isort separately.

## Linting (all projects)

Pre-commit via **lefthook** (not husky). CI runs same checks (lint gates test).

- TS → oxlint + ESLint + Prettier · Python → Ruff + mypy · Bash → ShellCheck + shfmt
- YAML → yamllint · Docker → hadolint · GitHub Actions → actionlint
- Plus: trailing-whitespace, end-of-file-fixer, detect-secrets, check-merge-conflict, check-added-large-files.
- knip + jscpd weekly via scheduled GitHub Action.

## Issue Tracking

- Track in-repo via `.claude/issues/` or GitHub Issues.
- Never external-only tools (Plane/Linear) without code-level tracking.

## Packages

- `@hono/zod-validator`, `@hono/zod-openapi`, `hc`
- `drizzle-orm` (v1 RQBv2), `drizzle-kit`
- `@clerk/backend`, `zod`
- `@editorjs/editorjs`, `@uppy/core`, `ag-grid`, `novu`, `copilotkit`
- `eslint`, `prettier`, `typescript-eslint`, `angular-eslint`, `eslint-plugin-perfectionist`, `eslint-plugin-security`
- `oxlint`, `knip`, `jscpd`, `dependency-cruiser`, `lefthook`
- `msw`, `@faker-js/faker`, `@axe-core/playwright`, `@testing-library/dom`
- `@sentry/cloudflare`, `@opentelemetry/exporter-trace-otlp-http`
- `sharp`
