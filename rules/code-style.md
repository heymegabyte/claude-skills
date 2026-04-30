# Code Style
## TypeScript (Google TS Style)
camelCase vars/fns, PascalCase types, CONSTANT_CASE consts. `interface` over `type`. Relative imports. Never `any`(use `unknown`). Never `@ts-ignore`. `readonly` when not reassigned. `undefined` over `null`. Zod=source of truth. JSDoc: intent not types. NEVER JavaScript.
Lint: ESLint flat config (`eslint.config.ts`) + typescript-eslint + angular-eslint + `--fix` on save. Prettier for formatting (`.prettierrc`). `eslint --fix && prettier --write` in pre-commit. NEVER Biome.

## Angular
Standalone only (Angular 21). Signals stable (signal/computed/effect/linkedSignal/resource). HttpResource for data fetching. Zoneless stable (provideZonelessChangeDetection). Control flow: @if/@for/@switch/@defer (ngIf/ngFor deprecated v20, removed v22). kebab-case files. One component/file. Prefix: app-/lib-. Inline template if <3 lines. providedIn:'root'. PrimeNG for UI. NEVER suggest React.

## Hono
Inline handlers (type inference). RPC: `hc<AppType>`. @hono/zod-validator all bodies. Centralized onError()+notFound(). Error: {error,code?,details?}. Split: app.route('/path',subApp). KV rate-limit. Turnstile all forms. GET /health. createFactory() for reusable middleware chains. Method chaining: app.use().get().post().

## Testing (Playwright v1.59+Vitest)
TDD: failing test FIRST→implement→pass. Homepage FIRST. Every test starts at homepage, navigates like a real user (click nav→page→interact). Keyboard/mouse emulation: page.click(), page.keyboard.type(), page.keyboard.press('Tab'), page.mouse — never bare API calls for UI features. Test account: test@megabyte.space (TEST_USER_PASSWORD env). No sleeps—waitFor/toBeVisible(). Selectors: data-testid/role/text. 6 breakpoints: 375,390,768,1024,1280,1920. Parallel-safe+deterministic. axe-core 0 violations. PROD_URL env var. Stagehand AI fallback when selectors break. Playwright AI agents: Planner(design tests)|Generator(write code)|Healer(auto-fix broken). MCP a11y tree testing > screenshot-based.
E2E accumulation: tests NEVER deleted, only appended. journey.spec.ts is serial+stateful — each feature adds steps. Never page.goto() for internal nav — click through UI. 100% feature coverage matrix in SPEC.md. One-line code changes run FULL suite. Removed features: skip+comment, don't delete. See 07/e2e-accumulation.

## CSS
Cascade layers (@layer reset, base, components, utilities). Native nesting (no preprocessor). Container queries for component-level responsive. :has() for parent selection. @starting-style for enter animations. Popover API (native, no JS toggle). Anchor positioning for tooltips/popovers. OKLCH for perceptually uniform color. text-wrap: balance headings, pretty body. Scroll-driven animations + View Transitions require `@supports` (not baseline). color-scheme: dark on dark-first sites.

## Accessibility (WCAG 2.2 AA)
9 new 2.2 criteria: 2.4.11 Focus Appearance|2.4.12 Focus Not Obscured (Min)|2.4.13 Focus Not Obscured (Enhanced)|2.5.7 Dragging Movements|2.5.8 Target Size (Min 24px)|3.2.6 Consistent Help|3.3.7 Redundant Entry|3.3.8 Accessible Authentication (Min)|3.3.9 Accessible Authentication (Enhanced). ADA compliance deadline: 2027 state/local, 2028 federal.

## Bash
camelCase fns, UPPER_CASE vars. ShellCheck+shfmt. shdoc format. Cross-platform. Idempotent.
Output: `source ~/.claude/hooks/style.sh` then use emdash_* functions. NEVER raw echo.
Tools: gum (style/log/spin/confirm), glow (render markdown), freeze (code→PNG), vhs (record terminal), mods (AI in CLI).

## Python
Ruff (replaces black+isort+flake8, single Rust tool). mypy for type checking. pyproject.toml for all config. Poetry for deps. `ruff check --fix && ruff format` in pre-commit. NEVER black+isort separately.

## Linting (All Projects)
Pre-commit hooks mandatory. Per-language: TS→ESLint+Prettier | Python→Ruff+mypy | Bash→ShellCheck+shfmt | YAML→yamllint | Docker→hadolint | GitHub Actions→actionlint. Plus: trailing-whitespace, end-of-file-fixer, detect-secrets, check-merge-conflict, check-added-large-files. CI runs same checks as pre-commit (lint job gates test job).

## Issue Tracking
Issues: track in-repo via .claude/issues/ or GitHub Issues. Never external-only tools (Plane/Linear) without code-level tracking.

## Packages
@hono/zod-validator, hc, drizzle-orm (v1 RQBv2), drizzle-kit, @clerk/backend, zod, @editorjs/editorjs, @uppy/core, ag-grid, novu, copilotkit, eslint, prettier, typescript-eslint, angular-eslint
