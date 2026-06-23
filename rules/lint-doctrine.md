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

Every emdash project ships an **industry-leading lint+autofix stack** wired into lefthook + commitlint + commitizen + semantic-release. AI agents never hand-format what a deterministic linter can autofix faster. Emoji-prefixed conventional commits are mandatory.

## Source of truth — `templates/lint-stack/`

- All configs live once in `~/.agentskills/templates/lint-stack/`.
- Projects pull via `bin/install-lint-stack.sh <project-dir>`.
- Updates flow back same-turn per `prompt-as-training-signal`.

## Package philosophy — mainstream-only

- `@megabytelabs` / `@HeyMegabyte` GitLab packages are **PATTERN inspiration only** — never installed.
- Ship only latest stable npm packages (≥10k weekly DLs floor unless niche).
- No `git+https` deps — every package must be on the npm registry. No private GitLab packages.

## The stack

### TS / JS / JSON / MD / CSS / YAML

- **oxlint** — first-pass speed (50-100× ESLint, no formatting).
- **ESLint 9 flat config** — `eslint@9` + `@eslint/js` + `typescript-eslint@8` + `eslint-plugin-perfectionist` + `eslint-plugin-security` + `eslint-plugin-unicorn` + `eslint-plugin-promise` + `eslint-plugin-n` + `eslint-plugin-sonarjs` + `eslint-plugin-import` + `eslint-config-prettier` (last).
- **Prettier 3** — `prettier@3` + `prettier-plugin-packagejson` + `prettier-plugin-organize-imports`.
- **Stylelint 16** — `stylelint-config-standard` + `stylelint-config-recommended` + `stylelint-config-clean-order`.
- **markdownlint-cli2** — MD013/MD025/MD033/MD036/MD040/MD041/MD045/MD060 off; MD024 siblings_only.
- **knip** — dead code / unused export / unused dep (weekly CI sweep).
- **jscpd** — duplicate detection (≤1% threshold).
- **dependency-cruiser** — architecture rules.

### Shell + ops

- **shellcheck** · **shfmt** `-i 2 -ci -bn` · **actionlint** · **yamllint** (line-length/document-start/truthy disabled) · **hadolint**

### Python

- **ruff** — replaces flake8 + black + isort entirely. ~~flake8~~ superseded.

### Code intelligence

- **semgrep** — OWASP Top 10 + custom rules from `templates/lint-stack/semgrep-custom/*.yml`. Every novel finding becomes a new rule same-turn per `prompt-as-training-signal`.
- **TruffleHog `--only-verified`** — secret scan (`ai-agent-security.md`).
- **Gitleaks** — pre-commit secret block (`ai-agent-security.md`).

## Commit hygiene (emoji-mandatory)

- **commitizen** + **cz-emoji@^1.3.1** (pinned; npm `latest` resolves to canary).
- **conventional-changelog-gitmoji-config** 1.5.2 (30k+ weekly) — gitmoji commit-analyzer/changelog preset.
- **commitlint** + **@commitlint/config-conventional** — rejects emoji-less commits at `commit-msg` via `gitmoji-enforce.sh`.
- **semantic-release** + **semantic-release-gitmoji** 1.6.9 (50k+ weekly). Chain: `@semantic-release/changelog` + `@semantic-release/npm` + `@semantic-release/github` + `@semantic-release/git`.
- Every commit ships with a gitmoji prefix. `git cz` is the only path (alias `git c`).

### Pinned versions (verified 2026-06-08)

- `eslint` 9.x · `typescript-eslint` 8.61.0 · `eslint-plugin-perfectionist` 5.9.0 · `eslint-plugin-unicorn` 65.0.1
- `prettier` 3.x · `prettier-plugin-packagejson` 3.0.2 · `prettier-plugin-organize-imports` 4.3.0
- `stylelint-config-clean-order` 10.0.0 · `cz-emoji` 1.3.1 · `conventional-changelog-gitmoji-config` 1.5.2 · `semantic-release-gitmoji` 1.6.9

## lefthook orchestration

- **`pre-commit`** — autofix sweep (parallel).
- **`commit-msg`** — gitmoji enforce.
- **`pre-push`** — heavier semgrep + jscpd + knip.

See `templates/lint-stack/lefthook.yml`.

## Self-improving rules

After every lint pass, when a recurring violation pattern surfaces:

1. **Codify** — emit new rule into `templates/lint-stack/semgrep-custom/<topic>.yml` or `eslint-rules/<topic>.js`.
2. **Cross-link** — append pattern to §"Codified incidents".
3. **Distribute** — next `install-lint-stack.sh` pulls.
4. **Verify** — `semgrep --test` or ESLint `RuleTester`.

`bin/lint-auto-improve.sh`: captures lint output to `.lint-history/<tool>-<ts>.log` (30-day retention); clusters ≥3 hits/window into proposals; drops drafted YAML into `semgrep-custom/`. Runs as final pre-push step (non-blocking).

## Auto-rollout — `bin/install-lint-stack.sh <project>`

- Detects stack (package.json / *.py / Dockerfile / .github/workflows/).
- Copies configs, installs npm deps via `npm i -D --save-exact` (or `bun add -d`), wires `lefthook install`.
- Adds scripts: `lint`, `lint:fix`, `format`, `commit`, `release`.
- Backs up existing configs to `.lint-stack-backup-{ts}/` — never overwrites blind. Idempotent.

## Codified incidents

- **`$VAR×` unicode-attached → `set -u` failure** — `semgrep-custom/bash-set-u-unicode-var.yml`.
- **`printf '- ...'` leading `-` parsed as flag** — `semgrep-custom/bash-printf-leading-dash.yml`.
- **`@megabytelabs/*` deps in package.json** — `semgrep-custom/no-gitlab-megabytelabs-deps.yml`.
- **3+ helpers re-emit identical JSON `meta` boilerplate** — extract `bin/lib/emit-json.sh`; 2 callers = defer, 3 = lib.
- **`# shellcheck <word>` prose in YAML `run:` → actionlint SC1072 false-positive** — reword to `# Note: ShellCheck ...`; `# shellcheck` prefix reserved for `disable=` / `source=` ONLY.
- **Per-pass gate misses cross-gate interactions** — run `bash bin/lint-all.sh` (full sweep) BEFORE commit; never trust per-gate verification alone.
- **`cmd | tail -N && next_cmd` masks exit code** — `tail` returns 0 even when `cmd` exits non-zero. Use `set -o pipefail` OR `${PIPESTATUS[0]}`. NEVER `npm run lint | tail -N && git commit`.
- **Cross-rule consistency drift** — when a new model/version lands in one rule, grep `rules/*.md` AND `[0-9][0-9]-*/**/*.md` AND `agents/*.md` for older mentions same turn and update.
- **Two same-domain claims contradict** — web-verify which is current BEFORE flipping; don't assume longer-standing value is correct.
- **One WebSearch result covers MULTIPLE stale facts** — after verifying one, immediately grep for related-class mentions and apply same-pass.
- **`sed -i` outside Read-tracking layer; next `Edit` fails "file not read"** — always `Read` after any `sed -i`, `awk -i inplace`, or `perl -pi -e` before using `Edit`.
- **Substring substitution creates stutter** (e.g., `s/GPT-4o/GPT Image 2 vision/g` on "GPT-4o Vision" → "GPT Image 2 vision Vision") — grep for `<replacement> <next-likely-suffix>` post-sub; pre/post-clean stutter.
- **Substring substitution collides with numeric-suffix idioms** (e.g., `s/DALL-E/GPT Image 1.5/g` on "DALL-E 2/3") — pre-clean numeric idioms BEFORE general sub; order longest-most-specific FIRST; grep `<new> [0-9]+` must be empty.
- **Local pre-commit stays green while CI fails silently** — after every push, run `bash bin/check-ci-status.sh`; add gates to `lint-all` to mirror CI failures locally.
- **Filter regex too broad accidentally matches innocent content** — anchor by backticks, section headers, or doc-specific markers; generic patterns over-match.
- **Detector scope-list incomplete** — explicitly enumerate FULL directory set (docs + scripts + workflows + agents + templates). Audit pass-1 of every detector must list every parallel file-type.

## Pack integrity validator

```bash
node ~/.agentskills/scripts/validate-packs.mjs
```

Asserts: every pack-referenced rule exists, every rule is in ≥1 pack, every NN-skill dir exists. Exit 1 on drift. Wire into CI.

## See

- `audit-arc-maturity-ladder.md` — 6-step ladder + CI-mirroring short-path doctrine.
- `uniform-json-output.md` — uniform-JSON shape used by `bin/check-<class>.sh` helpers.
- `code-style.md` — TS/Python/Bash baseline.
- `ai-agent-security.md` — Gitleaks/TruffleHog secret-scan tier.
- `prompt-as-training-signal.md` §6 — self-improvement protocol.
- `main-only-branch.md` + `ai-seniority.md` — semantic-release auto-publish from `main`.
