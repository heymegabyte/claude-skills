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

## The stack (deterministic, parallel, autofix-first)

### TS / JS / JSON / MD / CSS / YAML
- **oxlint** — first-pass speed (50-100× ESLint, no formatting)
- **ESLint 9 flat config** — `@megabyte/eslint-config` from GitLab (TS, JS, JSON, YAML, TOML linting; EditorConfig-aware)
- **Prettier** — `prettier-config-sexy-mode` + `prettier-plugin-package-perfection` (auto-sorts package.json keys + scripts + deps)
- **Stylelint** — `stylelint-config-so-pretty` (strict CSS/SCSS)
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
- **commitizen** + **git-cz-emoji** (GitLab `@megabytelabs/git-cz-emoji`) — interactive emoji commit prompt
- **conventional-changelog-emoji-config** (GitLab `@megabytelabs/conventional-changelog-emoji-config`) — semantic-release/commitlint preset
- **commitlint** — enforces gitmoji-conventional shape; **rejects emoji-less commits at lefthook commit-msg stage**

### Release automation
- **semantic-release** + GitLab `@megabytelabs/semantic-release-config` + `@HeyMegabyte/semantic-release-gh` (takes `repositoryUrl` parameter beyond stock `@semantic-release/github`)
- Releases auto-publish from green `main` per `main-only-branch` + `ai-seniority` auto-merge contract

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

- *(seed)* — `pretooluse-router.py` E501 at line 36 (multi-arg subprocess.run) → consider per-line `# noqa: E501` annotation or 120-col project budget (cosmetic; not yet codified).

## See

- `code-style.md` — TS/Python/Bash baseline (this rule operationalizes it)
- `ai-agent-security.md` — Gitleaks/TruffleHog secret-scan tier
- `prompt-as-training-signal.md` §6 — self-improvement protocol
- `main-only-branch.md` + `ai-seniority.md` — semantic-release auto-publish from `main`
