---
name: "lint-doctrine"
priority: 2
pack: "core"
triggers:
  - "lint"
  - "autofix"
  - "format"
  - "pre-commit"
  - "semantic-release"
  - "commitizen"
paths:
  - "*"
---

# Lint Doctrine

Every emdash project ships with an **industry-leading lint+autofix stack** wired into lefthook + commitlint + commitizen + semantic-release. AI agents never hand-format what a deterministic linter can autofix faster. Emoji-prefixed conventional commits are mandatory.

## Source of truth — `templates/lint-stack/`

Every config lives once in `~/.agentskills/templates/lint-stack/`. Projects pull via `bin/install-lint-stack.sh <project-dir>`. Updates flow back same-turn per `prompt-as-training-signal`.

## Package philosophy — mainstream-only, GitLab @megabytelabs as inspiration

The `@megabytelabs` / `@HeyMegabyte` GitLab packages (conventional-changelog-emoji-config, git-cz-emoji, prettier-config-sexy-mode, etc.) are studied as PATTERN inspiration. The actual installer ships only:

- Latest stable mainstream npm packages (≥10k weekly DLs as a rough floor unless niche)
- Well-maintained plugins with active issues + recent commits
- No git+https deps — every package on the npm registry
- No private GitLab packages in any project's `node_modules`

## The stack (deterministic, parallel, autofix-first)

### TS / JS / JSON / MD / CSS / YAML

- **oxlint** — first-pass speed (50-100× ESLint, no formatting)
- **ESLint 9 flat config** — `eslint@9` + `@eslint/js` + `typescript-eslint@8` + `eslint-plugin-perfectionist` + `eslint-plugin-security` + `eslint-plugin-unicorn` + `eslint-plugin-promise` + `eslint-plugin-n` + `eslint-plugin-sonarjs` (cognitive complexity, real bug catching) + `eslint-plugin-import` (import/export hygiene) + `eslint-config-prettier` (last; silences ESLint rules that conflict w/ Prettier). Canonical mainstream chain — inspired by GitLab `@megabytelabs/eslint-config` (40+ plugins covering Angular/Jest/RxJS/SonarJS).
- **Prettier 3** — `prettier@3` + `prettier-plugin-packagejson` (1.4M+ weekly DLs, sorts package.json keys) + `prettier-plugin-organize-imports` (1.2M+ weekly, dedupes ES imports). Replaces GitLab `prettier-config-sexy-mode` + `prettier-plugin-package-perfection`.
- **Stylelint 16** — `stylelint-config-standard` + `stylelint-config-recommended` + `stylelint-config-clean-order` (property ordering). Replaces GitLab `stylelint-config-so-pretty`.
- **markdownlint-cli2** — relaxed Brian-voice config (MD013/MD025/MD033/MD036/MD040/MD041/MD045/MD060 off; MD024 siblings_only)
- **knip** — dead code / unused export / unused dep detection (weekly CI sweep)
- **jscpd** — duplicate-code detection (≤1% threshold)
- **dependency-cruiser** — architecture rules

### Shell + ops

- **shellcheck** — bug catcher
- **shfmt** `-i 2 -ci -bn` — formatter (Brian's signature shape)
- **actionlint** — GH Actions
- **yamllint** — relaxed (line-length / document-start / truthy disabled)
- **hadolint** — Dockerfile

### Python

- **ruff** — replaces flake8 + black + isort entirely (Brian's `code-style.md` already mandates ruff)
- ~~flake8~~ — superseded by ruff; install only when ruff is blocked

### Code intelligence

- **semgrep** — OWASP Top 10 + custom rules from `templates/lint-stack/semgrep-custom/*.yml`. Self-improving: every novel finding becomes a new rule same-turn per `prompt-as-training-signal`.
- **TruffleHog `--only-verified`** — secret scan (already in `ai-agent-security.md`)
- **Gitleaks** — pre-commit secret block (already in `ai-agent-security.md`)

## Commit hygiene (emoji-mandatory)

### Tooling

- **commitizen** + **cz-emoji@^1.3.1** (pinned to stable; npm `latest` resolves to canary) — interactive emoji commit prompt
- **conventional-changelog-gitmoji-config** (1.5.2, mainstream, 30k+ weekly) — commit-analyzer/changelog preset for gitmoji
- **commitlint** + **@commitlint/config-conventional** — enforces conventional shape; **rejects emoji-less commits at lefthook commit-msg stage via standalone `gitmoji-enforce.sh` script (belt+suspenders)**

### Release automation

- **semantic-release** + **semantic-release-gitmoji** (1.6.9, 50k+ weekly) for gitmoji-aware analyzer + release-notes
- Stock chain: `@semantic-release/changelog` + `@semantic-release/npm` + `@semantic-release/github` + `@semantic-release/git`
- Releases auto-publish from green `main` per `main-only-branch` + `ai-seniority` auto-merge contract

### Mainstream package versions (verified 2026-06-08 npm view)

| Concern | Package | Version |
|--|--|--|
| ESLint | `eslint` | 9.x |
| ESLint TS | `typescript-eslint` | 8.61.0 |
| ESLint plugins | `eslint-plugin-perfectionist` | 5.9.0 |
| ESLint plugins | `eslint-plugin-unicorn` | 65.0.1 |
| Prettier | `prettier` | 3.x |
| Prettier plugin | `prettier-plugin-packagejson` | 3.0.2 |
| Prettier plugin | `prettier-plugin-organize-imports` | 4.3.0 |
| Stylelint | `stylelint-config-clean-order` | 10.0.0 |
| Commitizen | `cz-emoji` | 1.3.1 (stable; pin away from canary) |
| Changelog | `conventional-changelog-gitmoji-config` | 1.5.2 |
| Release | `semantic-release-gitmoji` | 1.6.9 |

### Mandate

- **Every commit ships with a gitmoji prefix.** Plain text commits are blocked at commit-msg stage.
- `git cz` is the only path (alias `git c`); raw `git commit -m` is muscle-memory only on emergency fixes and STILL must pass commitlint.

## lefthook orchestration (parallel autofix)

`lefthook.yml` runs every linter in parallel at pre-commit; everything fails-fast but autofixes apply same-stage. See `templates/lint-stack/lefthook.yml`. Stages: `pre-commit` (autofix sweep) · `commit-msg` (gitmoji enforce) · `pre-push` (heavier semgrep + jscpd + knip).

## Self-improving rules (AI-augmented over time)

After every lint pass on any emdash project, if a recurring violation pattern surfaces:

1. **Codify**: emit a new rule into `templates/lint-stack/semgrep-custom/<topic>.yml` or `eslint-rules/<topic>.js` (ESLint custom plugin path).
2. **Cross-link**: append the pattern to this doctrine §"Codified incidents".
3. **Distribute**: flows back to template repo; next `install-lint-stack.sh` pulls.
4. **Verify**: agent self-tests via `semgrep --test` or eslint rule's `RuleTester`.

This satisfies `prompt-as-training-signal` §6 ("Ensure ___ is in ~/.claude") — every novel bug class is captured deterministically.

### The auto-improve mechanism (concrete)

`bin/lint-auto-improve.sh` operationalizes this loop:

1. **Capture** — every pre-push lefthook stage now `tee`s lint output to `.lint-history/<tool>-<timestamp>.log`. 30-day retention.
2. **Cluster** — script greps + counts rule-id occurrences across all logs. Patterns with ≥3 hits in window become candidates.
3. **Propose** — writes `.lint-history/proposals/proposal-<ts>.md` with the top patterns + a Claude-ready prompt that drafts a semgrep YAML rule + cross-link narrative.
4. **Codify** — human (or AI agent) drops the drafted YAML into `templates/lint-stack/semgrep-custom/<topic>.yml`, cross-links from owning domain rule, commits + pushes (auto-pushed per `main-only-branch`).
5. **Distribute** — next `install-lint-stack.sh` run pulls the new rule into every project.

The script runs as the final pre-push step (non-blocking — analysis only). After ~30 days of any project's normal lint traffic, the proposal queue surfaces the patterns worth codifying.

## Auto-rollout

`bin/install-lint-stack.sh <project>`:

- Detects stack (presence of `package.json`, `*.py`, `Dockerfile`, `.github/workflows/`)
- Copies relevant configs from `templates/lint-stack/` to project root
- Installs npm deps via `npm i -D --save-exact ...` (or `bun add -d`)
- Installs `pre-commit` Python framework if needed
- Wires `lefthook install`
- Updates `package.json` w/ scripts: `lint`, `lint:fix`, `format`, `commit`, `release` — sorted via `prettier-plugin-package-perfection`
- Backs up any existing configs to `.lint-stack-backup-{ts}/` (never overwrite blind)
- Idempotent: re-runs upgrade only, never duplicate

## Codified incidents (append as patterns surface)

| Pattern | Codified rule | Source |
|--|--|--|
| `$VAR×` unicode-attached → set -u failure | `semgrep-custom/bash-set-u-unicode-var.yml` | pass-12 self-test on `lint-auto-improve.sh` |
| `printf '- ...'` leading `-` parsed as flag | `semgrep-custom/bash-printf-leading-dash.yml` | pass-12 self-test on `lint-auto-improve.sh` |
| `@megabytelabs/*` deps in package.json | `semgrep-custom/no-gitlab-megabytelabs-deps.yml` | pass-9 mainstream-only mandate |
| `pretooluse-router.py` E501 multi-arg subprocess.run | *(not codified — cosmetic only)* | pass-4 ruff sweep |
| 3+ helpers re-emit identical JSON `meta` boilerplate (inline `date -u +...` / `git rev-parse` / escape) | extract `bin/lib/emit-json.sh`; new helpers source it · per `rules/uniform-json-output.md` | pass-38 refactor — 2 callers = defer, 3 = lib |
| `# shellcheck <word>` prose comment inside YAML `run:` block → actionlint SC1072 false-positive | reword to `# Note: ShellCheck ...` or `# Tip: ShellCheck ...`; `# shellcheck` prefix reserved for `disable=` / `source=` directives ONLY | pass-47 self-test of new Self-lint Shell CI step |

## Pack integrity validator

`scripts/validate-packs.mjs` — gates `_packs/*.yml` against `rules/*.md` + `NN-*` skill dirs. Run before commit:

```bash
node ~/.agentskills/scripts/validate-packs.mjs
```

Asserts: every pack-referenced rule exists, every rule is in ≥1 pack, every NN-skill dir exists. Exit 1 on drift. Wire into CI to prevent future orphans.

## See

- `code-style.md` — TS/Python/Bash baseline (this rule operationalizes it)
- `ai-agent-security.md` — Gitleaks/TruffleHog secret-scan tier
- `prompt-as-training-signal.md` §6 — self-improvement protocol
- `main-only-branch.md` + `ai-seniority.md` — semantic-release auto-publish from `main`
