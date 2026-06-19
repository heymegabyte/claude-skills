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
- Well-maintained plugins only (active issues + recent commits).
- No `git+https` deps — every package must be on the npm registry.
- No private GitLab packages in any project's `node_modules`.

## The stack (deterministic, parallel, autofix-first)

### TS / JS / JSON / MD / CSS / YAML

- **oxlint** — first-pass speed (50-100× ESLint, no formatting).
- **ESLint 9 flat config** — `eslint@9` + `@eslint/js` + `typescript-eslint@8` + `eslint-plugin-perfectionist` + `eslint-plugin-security` + `eslint-plugin-unicorn` + `eslint-plugin-promise` + `eslint-plugin-n` + `eslint-plugin-sonarjs` + `eslint-plugin-import` + `eslint-config-prettier` (last; silences rules conflicting with Prettier).
- **Prettier 3** — `prettier@3` + `prettier-plugin-packagejson` (1.4M+ weekly DLs) + `prettier-plugin-organize-imports` (1.2M+ weekly).
- **Stylelint 16** — `stylelint-config-standard` + `stylelint-config-recommended` + `stylelint-config-clean-order`.
- **markdownlint-cli2** — relaxed Brian-voice config (MD013/MD025/MD033/MD036/MD040/MD041/MD045/MD060 off; MD024 siblings_only).
- **knip** — dead code / unused export / unused dep detection (weekly CI sweep).
- **jscpd** — duplicate-code detection (≤1% threshold).
- **dependency-cruiser** — architecture rules.

### Shell + ops

- **shellcheck** — bug catcher.
- **shfmt** `-i 2 -ci -bn` — formatter (Brian's signature shape).
- **actionlint** — GH Actions.
- **yamllint** — relaxed (line-length / document-start / truthy disabled).
- **hadolint** — Dockerfile.

### Python

- **ruff** — replaces flake8 + black + isort entirely.
- ~~flake8~~ — superseded by ruff; install only when ruff is blocked.

### Code intelligence

- **semgrep** — OWASP Top 10 + custom rules from `templates/lint-stack/semgrep-custom/*.yml`. Every novel finding becomes a new rule same-turn per `prompt-as-training-signal`.
- **TruffleHog `--only-verified`** — secret scan (see `ai-agent-security.md`).
- **Gitleaks** — pre-commit secret block (see `ai-agent-security.md`).

## Commit hygiene (emoji-mandatory)

### Tooling

- **commitizen** + **cz-emoji@^1.3.1** (pinned to stable; npm `latest` resolves to canary).
- **conventional-changelog-gitmoji-config** (1.5.2, 30k+ weekly) — gitmoji commit-analyzer/changelog preset.
- **commitlint** + **@commitlint/config-conventional** — enforces conventional shape; rejects emoji-less commits at lefthook `commit-msg` stage via `gitmoji-enforce.sh` (belt+suspenders).

### Release automation

- **semantic-release** + **semantic-release-gitmoji** (1.6.9, 50k+ weekly).
- Stock chain: `@semantic-release/changelog` + `@semantic-release/npm` + `@semantic-release/github` + `@semantic-release/git`.
- Releases auto-publish from green `main` per `main-only-branch` + `ai-seniority` auto-merge contract.

### Mainstream package versions (verified 2026-06-08)

- **`eslint`** — 9.x
- **`typescript-eslint`** — 8.61.0
- **`eslint-plugin-perfectionist`** — 5.9.0
- **`eslint-plugin-unicorn`** — 65.0.1
- **`prettier`** — 3.x
- **`prettier-plugin-packagejson`** — 3.0.2
- **`prettier-plugin-organize-imports`** — 4.3.0
- **`stylelint-config-clean-order`** — 10.0.0
- **`cz-emoji`** — 1.3.1 (pin away from canary)
- **`conventional-changelog-gitmoji-config`** — 1.5.2
- **`semantic-release-gitmoji`** — 1.6.9

### Mandate

- Every commit ships with a gitmoji prefix. Plain text commits are blocked at `commit-msg` stage.
- `git cz` is the only path (alias `git c`); raw `git commit -m` on emergency fixes still must pass commitlint.

## lefthook orchestration (parallel autofix)

`lefthook.yml` runs every linter in parallel at pre-commit; autofixes apply same-stage.

- **`pre-commit`** — autofix sweep.
- **`commit-msg`** — gitmoji enforce.
- **`pre-push`** — heavier semgrep + jscpd + knip.

See `templates/lint-stack/lefthook.yml`.

## Self-improving rules

After every lint pass, when a recurring violation pattern surfaces:

1. **Codify** — emit new rule into `templates/lint-stack/semgrep-custom/<topic>.yml` or `eslint-rules/<topic>.js`.
2. **Cross-link** — append pattern to this doctrine §"Codified incidents".
3. **Distribute** — flows back to template repo; next `install-lint-stack.sh` pulls.
4. **Verify** — self-test via `semgrep --test` or ESLint `RuleTester`.

### Auto-improve mechanism — `bin/lint-auto-improve.sh`

1. **Capture** — pre-push lefthook `tee`s lint output to `.lint-history/<tool>-<timestamp>.log` (30-day retention).
2. **Cluster** — greps + counts rule-id occurrences; patterns with ≥3 hits in window become candidates.
3. **Propose** — writes `.lint-history/proposals/proposal-<ts>.md` with top patterns + Claude-ready prompt drafting a semgrep YAML rule.
4. **Codify** — drop drafted YAML into `templates/lint-stack/semgrep-custom/<topic>.yml`, cross-link, commit.
5. **Distribute** — next `install-lint-stack.sh` pulls the new rule into every project.

Runs as final pre-push step (non-blocking — analysis only).

## Auto-rollout — `bin/install-lint-stack.sh <project>`

- Detects stack (presence of `package.json`, `*.py`, `Dockerfile`, `.github/workflows/`).
- Copies relevant configs from `templates/lint-stack/` to project root.
- Installs npm deps via `npm i -D --save-exact ...` (or `bun add -d`).
- Installs `pre-commit` Python framework if needed.
- Wires `lefthook install`.
- Updates `package.json` with scripts: `lint`, `lint:fix`, `format`, `commit`, `release`.
- Backs up existing configs to `.lint-stack-backup-{ts}/` — never overwrites blind.
- Idempotent: re-runs upgrade only, never duplicates.

## Codified incidents

- **`$VAR×` unicode-attached → `set -u` failure** — `semgrep-custom/bash-set-u-unicode-var.yml`.
- **`printf '- ...'` leading `-` parsed as flag** — `semgrep-custom/bash-printf-leading-dash.yml`.
- **`@megabytelabs/*` deps in package.json** — `semgrep-custom/no-gitlab-megabytelabs-deps.yml`.
- **3+ helpers re-emit identical JSON `meta` boilerplate** — extract `bin/lib/emit-json.sh`; new helpers source it per `rules/uniform-json-output.md` (2 callers = defer, 3 = lib).
- **`# shellcheck <word>` prose comment in YAML `run:` → actionlint SC1072 false-positive** — reword to `# Note: ShellCheck ...`; `# shellcheck` prefix reserved for `disable=` / `source=` directives ONLY.
- **Per-pass gate verification misses cross-gate interactions** — after adding any CI gate, run `bash bin/lint-all.sh` (full surface sweep) BEFORE commit; never trust per-gate verification alone.
- **`cmd | tail -N && next_cmd` masks `cmd` exit code** — `tail` returns 0 even when `cmd` exits non-zero. Use `set -o pipefail` OR `${PIPESTATUS[0]}` OR separate commands. NEVER `npm run lint | tail -N && git commit`.
- **Cross-rule consistency drift (same-pack rules reference different versions)** — when a new model/version/API mention lands in one rule, grep `rules/*.md` AND `[0-9][0-9]-*/**/*.md` AND `agents/*.md` for older mentions same turn and update. Same-pack-only grep is INSUFFICIENT — skill-dirs hold prose outside rule-scope.
- **Two same-domain claims contradict** — when one rule asserts a fact (pricing / version / endpoint), grep corpus for OTHER mentions. If they diverge, web-verify which is current BEFORE flipping. Don't assume the longer-standing value is correct.
- **One WebSearch result covers MULTIPLE related stale facts** — after web-verifying ONE fact, immediately grep for related-class mentions and apply the verification to all in the same pass.
- **`sed -i` modifies a file outside the Read-tracking layer; next `Edit` fails with "file not read"** — always `Read` the file once after any `sed -i`, `awk -i inplace`, or `perl -pi -e` before using `Edit`.
- **Substring substitution creates stutter** (e.g., `s/GPT-4o/GPT Image 2 vision/g` on "GPT-4o Vision" → "GPT Image 2 vision Vision") — after bulk substitution, grep for `<replacement> <next-likely-suffix>`; pre-clean or post-clean stutter.
- **Substring substitution collides with numeric-suffix idioms** (e.g., `s/DALL-E/GPT Image 1.5/g` on "DALL-E 2/3" → "GPT Image 1.5 2/3") — pre-clean numeric idioms BEFORE the general sub; order longest-most-specific patterns FIRST; grep post-migration: `<new> [0-9]+` must be empty.
- **Local pre-commit hook stays green while CI fails silently** — after every `git push`, run `bash bin/check-ci-status.sh` (`npm run check:ci`) to verify the run went green; add gates to `lint-all` to local-mirror CI failures.
- **Filter regex too broad accidentally matches innocent content** — filter regexes for "intentional doc context" must REQUIRE disambiguating context; anchor by backticks, section headers, or doc-specific markers; generic identifier patterns over-match.
- **Detector scope-list incomplete** — when building any detector, explicitly enumerate FULL set of directories. For deprecated-identifier detectors: docs + scripts + workflows + agents + templates. Audit pass-1 of every detector must list every parallel file-type that could harbor the same class.

## Pack integrity validator

```bash
node ~/.agentskills/scripts/validate-packs.mjs
```

Asserts: every pack-referenced rule exists, every rule is in ≥1 pack, every NN-skill dir exists. Exit 1 on drift. Wire into CI.

## See

- `audit-arc-maturity-ladder.md` — 6-step ladder + CI-mirroring short-path doctrine.
- `uniform-json-output.md` — uniform-JSON shape used by `bin/check-<class>.sh` helpers.
- `code-style.md` — TS/Python/Bash baseline (this rule operationalizes it).
- `ai-agent-security.md` — Gitleaks/TruffleHog secret-scan tier.
- `prompt-as-training-signal.md` §6 — self-improvement protocol.
- `main-only-branch.md` + `ai-seniority.md` — semantic-release auto-publish from `main`.
