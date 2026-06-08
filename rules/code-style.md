# Code Style

## TypeScript (Google TS Style)
- **TS 5.9+** — decorator metadata stable, `strictInference: true`, `isolatedDeclarations: true` for parallel builds, `erasableSyntaxOnly` for Node 22 native TS
- camelCase vars/fns, PascalCase types, CONSTANT_CASE consts
- `interface` over `type`. Relative imports.
- Never `any` — use `unknown`. Never `@ts-ignore`.
- `readonly` when not reassigned. `undefined` over `null`.
- Zod = source of truth. JSDoc: intent not types.
- NEVER JavaScript.

### Runtime
- **Node 22 LTS native TS strip-types** — no ts-node/tsx/nodemon; `node --watch` + `node --run` replace them
- **Bun 1.2+** for build-tool workloads (~125k req/s, 8ms cold start)
- `wrangler types` against compatibility_date + bindings for typed bindings (not just `@cloudflare/workers-types`)

### Lint
- ESLint 9 flat config (`eslint.config.ts`) + typescript-eslint v8 + angular-eslint + eslint-plugin-perfectionist + eslint-plugin-security + `--fix` on save
- **oxlint** for pre-commit speed pass (50-100× ESLint, no formatting)
- **knip** for dead code/unused deps (CI weekly)
- **jscpd** for duplicate detection (≤1% threshold)
- **dependency-cruiser** for architecture rules
- Prettier formats (`.prettierrc`)
- `oxlint && eslint --fix && prettier --write` in pre-commit
- NEVER Biome — no plugin system; breaks angular-eslint+security+drizzle plugins
- Git hooks via **lefthook** (10× husky, parallel, Go binary)
- Track ESLint v10 migration before Aug 2026 (v9 EOL)

## Angular
- Standalone only (Angular 21)
- Signals stable (signal/computed/effect/linkedSignal/resource)
- HttpResource for data fetching
- Zoneless stable (provideZonelessChangeDetection)
- Control flow: `@if`/`@for`/`@switch`/`@defer` — `ngIf`/`ngFor` deprecated v20, removed v22
- kebab-case files. One component/file. Prefix `app-`/`lib-`. Inline template if <3 lines. `providedIn:'root'`.
- **Spartan UI** (shadcn-for-Angular) — only kit; + Angular CDK + Floating UI primitives. NO PrimeNG/Material.
- **Angular built-in i18n** (`@angular/localize`), not ngx-translate/Transloco
- Stack choice: Angular for large apps (dashboards/admin/PWA/multi-tenant/builders/AI consoles); React for small sites (landing/marketing/portfolio). See `stack-selector.md`.

## Hono
- Inline handlers (type inference)
- RPC: `hc<AppType>` for client; **WorkerEntrypoint** + service bindings for internal Worker-to-Worker (promise pipelining, 32 MiB payload, JSRPC compat `2024-04-03`)
- `@hono/zod-validator` all bodies
- `@hono/zod-openapi` for OpenAPI generation
- Centralized `onError()` + `notFound()`
- Error: `{error,code?,details?}`
- Split: `app.route('/path',subApp)`
- KV rate-limit. Turnstile all forms. `GET /health`.
- `createFactory()` for reusable middleware chains
- Method chaining: `app.use().get().post()`

## Testing (Playwright v1.56+ agents, v1.59+ MCP interop, Vitest 3)
- TDD: failing test FIRST → implement → pass
- Homepage FIRST — every test starts at homepage, navigates like real user (click nav → page → interact)
- Keyboard/mouse: `page.click()`, `page.keyboard.type()`, `page.keyboard.press('Tab')`, `page.mouse` — never bare API calls for UI features
- Test account: `test@megabyte.space` (TEST_USER_PASSWORD env)
- No sleeps — `waitFor`/`toBeVisible()`
- Selectors: `data-testid`/role/text
- 6 breakpoints: 375, 390, 768, 1024, 1280, 1920
- Parallel-safe + deterministic. axe-core 0 violations. `PROD_URL` env var.
- Stagehand AI fallback when selectors break

### Playwright Test Agents (v1.56+)
- Planner → Markdown plan
- Generator → test code
- Healer → auto-fix selectors
- Init: `npx playwright init-agents --loop=claude`
- v1.59+ `browser.bind()` MCP interop + `page.screencast` video receipts
- MCP a11y tree > screenshot-based
- Vitest 3 (Rust sharding, browser mode default, 40% faster on 5k+ tests)

### E2E accumulation
- Tests NEVER deleted, only appended
- `journey.spec.ts` serial + stateful — each feature adds steps
- Never `page.goto()` for internal nav — click through UI
- 100% feature coverage matrix in SPEC.md
- One-line code changes run FULL suite
- Removed features: skip + comment, don't delete
- See `07/e2e-accumulation`

## CSS
- Cascade layers (`@layer reset, base, components, utilities`)
- Native nesting (no preprocessor)
- **Container queries** Baseline Widely Available (2025)
- **`:has()`** Baseline Newly Available (Firefox 121+, Safari 15.4+)
- `@starting-style` for enter animations
- **Popover API** Baseline Newly Available
- **Anchor positioning** Chrome/Edge 133+, Firefox late 2025, Safari Interop 2025 — polyfill v0.7+ for Safari
- OKLCH for perceptually uniform color
- `color-mix(in oklch, ...)` for derived shades
- `text-wrap: balance` headings, `pretty` body
- **View Transitions**: same-document SPA GA in Chrome+Safari 18+; cross-document MPA Chrome 126+, Safari 18+, Firefox 144 (Oct 2025) — `@view-transition { navigation: auto; }`
- **Scroll-driven**: Chrome stable, Safari 26 (2025); Firefox unsupported — pair `prefers-reduced-motion` AND `animation-duration:1ms` fallback
- `color-scheme: dark` on dark-first sites

## Accessibility (WCAG 2.2 AA)

### 9 new 2.2 criteria
- 2.4.11 Focus Appearance
- 2.4.12 Focus Not Obscured (Min)
- 2.4.13 Focus Not Obscured (Enhanced)
- 2.5.7 Dragging Movements
- 2.5.8 Target Size (Min 24px)
- 3.2.6 Consistent Help
- 3.3.7 Redundant Entry
- 3.3.8 Accessible Auth (Min)
- 3.3.9 Accessible Auth (Enhanced)

- axe-core auto-tests ONLY 2.5.8 — 8 others require manual review or axe DevTools Pro

### ADA deadlines (DOJ Title II, extended Apr 2026 IFR)
- ≥50K pop → Apr 26 2027
- <50K / special districts → Apr 26 2028
- Standard = WCAG 2.1 AA
- HHS Section 504: May 2026 for federal-fund healthcare
- WCAG 3.0 Working Draft (~2029) — target 2.2 AA

## Bash
- camelCase fns, UPPER_CASE vars
- ShellCheck + shfmt. shdoc format. Cross-platform. Idempotent.
- Output: `source ~/.claude/hooks/style.sh` then `emdash_*` functions — NEVER raw echo
- Tools: gum (style/log/spin/confirm), glow (markdown render), freeze (code → PNG), vhs (record terminal), mods (AI in CLI)

## Python
- Ruff (replaces black + isort + flake8)
- mypy for types
- `pyproject.toml` for all config
- Poetry for deps
- `ruff check --fix && ruff format` in pre-commit
- NEVER black + isort separately

## Linting (all projects)
- Pre-commit hooks via **lefthook** (not husky)

### Per-language
- TS → oxlint (fast) + ESLint + Prettier
- Python → Ruff + mypy
- Bash → ShellCheck + shfmt
- YAML → yamllint
- Docker → hadolint
- GitHub Actions → actionlint

### Plus
- trailing-whitespace
- end-of-file-fixer
- detect-secrets
- check-merge-conflict
- check-added-large-files

- CI runs same checks as pre-commit (lint job gates test job)
- knip + jscpd weekly via scheduled GitHub Action

## Issue Tracking
- Track in-repo via `.claude/issues/` or GitHub Issues
- Never external-only tools (Plane/Linear) without code-level tracking

## Packages
- `@hono/zod-validator`, `@hono/zod-openapi`, `hc`
- `drizzle-orm` (v1 RQBv2), `drizzle-kit`
- `@clerk/backend`
- `zod`
- `@editorjs/editorjs`, `@uppy/core`, `ag-grid`, `novu`, `copilotkit`
- `eslint`, `prettier`, `typescript-eslint`, `angular-eslint`, `eslint-plugin-perfectionist`, `eslint-plugin-security`
- `oxlint`, `knip`, `jscpd`, `dependency-cruiser`, `lefthook`
- `msw`, `@faker-js/faker`, `@axe-core/playwright`, `@testing-library/dom`
- `@sentry/cloudflare`, `@opentelemetry/exporter-trace-otlp-http`
- `sharp`
