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
| Per-pass gate verification misses cross-gate interactions (pass-N adds gate X, runs only X, ships; pass-(N+1) finds X interacts with gates Y/Z and breaks) | After adding any CI gate, run `bash bin/lint-all.sh` (or equivalent whole-surface sweep) BEFORE commit — never trust per-gate verification alone | pass-49 self-test surfaced 3 latent bugs (validate-skills link false-positive, CHANGELOG MD032, Prettier cosmiconfig walk-up) that pass-43→48's per-gate verifications missed |
| `cmd \| tail -N && next_cmd` masks `cmd`'s exit code — `tail` returns 0 even when `cmd` exited non-zero, so `&&` short-circuit fails silently | Use `set -o pipefail` OR check `${PIPESTATUS[0]}` OR separate to distinct commands. NEVER `npm run lint \| tail -N && git commit` — pipe-then-tail bypasses the gate | pass-51 shipped a commit with 1 failing lint gate because the commit pipeline was `npm run lint \| tail -3 && git commit`. tail returned 0 even though lint exited 1. Fixed pass-52 by adding `bin/install-hooks.sh` → `.git/hooks/pre-commit` running `npm run lint` as its OWN command (no pipe), wired via `package.json scripts.prepare` so `npm install` auto-installs |
| Cross-rule consistency drift (same-pack rules reference different versions of the same model/API/dep) | When a new model/version/API mention lands in one rule, grep `rules/*.md` AND `[0-9][0-9]-*/**/*.md` AND `agents/*.md` for older mentions in same turn and update — same-pack rules + skill-dir docs load together; mixed versions = incoherent AI mental model. Same-pack-only grep is INSUFFICIENT — skill-dirs hold prose-recommendations that escape rule-scope audits | pass-51 found `model-routing.md` knew Opus 4.8 was flagship but `prompt-cache.md` + `opus-quota-fallback.md` still referenced only 4.7/4.6. Pass-58 found pass-51's scope was too narrow — 14 more Opus 4.7-as-current mentions lived across `rules/` + `[0-9][0-9]-*/` skill-dirs that the same-pack-only audit missed |
| Two same-domain claims contradict (e.g. pricing in rule A vs example in skill-dir B) | When one rule asserts a fact (pricing / version / endpoint), grep the corpus for OTHER mentions of that fact. If they diverge, web-verify which is current BEFORE flipping. Don't assume the longer-standing value is correct — newer pricing usually wins | pass-58 noted `model-routing.md:18` ($5/$25) disagreed with `bolt-artifact-protocol.md:161` ($15/$75) on Opus 4 pricing, then guessed (wrongly) that $15/$75 was correct in the CHANGELOG. Pass-59 web-verified: $5/$25 is correct (Anthropic docs, May 2026); bolt-artifact-protocol was the stale one |
| One WebSearch result covers MULTIPLE related stale facts in the corpus | After web-verifying ONE fact, IMMEDIATELY grep for related-class mentions and apply the verification to all of them in the same pass — don't ship one fix and let the rest age. The cost of the search has already been paid | pass-59 web-verified Opus 4.8 pricing. The same Anthropic pricing page covered Haiku 4.5 + Sonnet 4.6. Pass-60 caught a stale Haiku 3.5 rate in `eval-driven-development.md` from the SAME verification — but only because the audit happened to fire. Codifying makes it deterministic |
| `sed -i` modifies a file outside the Read-tracking layer; next `Edit` fails with "file not read" | When `sed -i` precedes `Edit` on the same file, always `Read` the file once first to refresh the tracker. Same for `awk -i inplace`, `perl -pi -e`, any in-place rewrite. Bulk-rewrite tools bypass the harness; the Read is what re-syncs | pass-73 sed-migrated `media-acquisition.md` then tried to Edit-add a migration preface; first Edit failed. Pass-74 caught it again with the double-Vision cleanup. Codifying: bulk-rewrite + targeted-edit is a common migration pattern — codify the Read-refresh step |
| Substring substitution creates awkward stutter (e.g. `s/GPT-4o/GPT Image 2 vision/g` applied to "GPT-4o Vision" → "GPT Image 2 vision Vision") | After bulk substring substitution, grep for stutter patterns: `<replacement> <next-likely-suffix>` AND tail tokens of the original alongside the new. Either pre-clean the source (`s/GPT-4o Vision/GPT-4o/g` first) or post-clean (`s/<new> <stutter>/<new>/g`) | pass-74 sed produced "GPT Image 2 vision Vision" in 3 places in `visual-inspection-loop.md`. Caught + fixed with a follow-up sed pass. Codifying: bulk rename always needs stutter-cleanup pass |
| Substring substitution collides with numeric-suffix idioms (e.g. `s/DALL-E/GPT Image 1.5/g` applied to "DALL-E 2/3 removed" → "GPT Image 1.5 2/3 removed" — semantically wrong) | Pre-clean numeric idioms BEFORE the general sub: `sed -e 's/DALL-E 2\/3/DALL-E 2 and DALL-E 3/g' -e 's/DALL-E 3/.../' -e 's/DALL-E 2/.../' -e 's/DALL-E/.../'`. Always order longest-most-specific patterns FIRST. Grep post-migration: `<new> [0-9]+` should be empty | pass-77 caught the `GPT Image 1.5 2/3 removed` collision in `09-brand-and-content-system/SKILL.md:76`. Same class as the stutter pattern but with numeric tails instead of word tails |
| Local pre-commit hook covers `lint-all` only; CI runs independently. Pushing while ignoring `gh run list` = silent red CI for weeks | After every `git push`, run `bash bin/check-ci-status.sh` (`npm run check:ci`) to verify the run went green. Use `--wait` to poll. CI failure surface MUST be local-mirrored when feasible (add gates to `lint-all`) OR explicitly checked post-push | pass-89 discovered `gh run list --limit 5` showed all 5 recent runs failed since pass-66. publish.yml's "Check SKILL.md submodule alignment" step had been failing for 23+ passes while local hook stayed green. Local mechanical enforcement is only half the contract |
| Filter regex too broad accidentally matches innocent content. Example: `s/[A-Za-z]+` (intended to skip codified-sed-pattern docs) silently filters out lines containing innocent paths like `scripts/...` because the path matches the sed-substitution pattern | Filter regexes for "intentional doc context" must REQUIRE the disambiguating context. Anchor by backticks (`\`s/.../.../g\``), section headers (`^## Codified`), or doc-specific markers. Generic identifier patterns over-match | pass-96 traced why gate #10 missed a deprecated-identifier reference (`README.md:309`, caught manually pass-95). Filter `s/[A-Za-z]+` from pass-81 matched `scripts/gpt4o-vision-analyze.sh` → line silently filtered → detector returned 0 hits despite real drift |
| Detector scope-list incomplete. Detectors only see drift in directories they explicitly grep — a `.sh` script in `scripts/` calling a retired API endpoint goes unnoticed if `scripts/*.sh` isn't in the path list | When building any new detector, explicitly enumerate the FULL set of directories where the class can manifest. For deprecated-identifier detectors: docs + scripts + workflows + agents + templates. For staleness detectors: any doc that cites the value. Audit pass-1 of every detector should list every parallel file-type that could harbor the same class | pass-99 found `scripts/gpt4o-vision-analyze.sh` was runtime-failing for 4 months — calling retired `gpt-4o` API endpoint. Pass-100 widened gate #10's grep to include `scripts/*.sh`. Same class of miss as pass-89 (CI gate not local-mirrored): "covered everywhere we checked, missed somewhere we didn't" |

## Pack integrity validator

`scripts/validate-packs.mjs` — gates `_packs/*.yml` against `rules/*.md` + `NN-*` skill dirs. Run before commit:

```bash
node ~/.agentskills/scripts/validate-packs.mjs
```

Asserts: every pack-referenced rule exists, every rule is in ≥1 pack, every NN-skill dir exists. Exit 1 on drift. Wire into CI to prevent future orphans.

## See

- `audit-arc-maturity-ladder.md` — 6-step ladder + CI-mirroring short-path doctrine that turns codified incidents (this rule) into mechanical enforcement (`bin/lint-all.sh` gates)
- `uniform-json-output.md` — uniform-JSON shape used by every `bin/check-<class>.sh` helper that surfaces an incident
- `code-style.md` — TS/Python/Bash baseline (this rule operationalizes it)
- `ai-agent-security.md` — Gitleaks/TruffleHog secret-scan tier
- `prompt-as-training-signal.md` §6 — self-improvement protocol
- `main-only-branch.md` + `ai-seniority.md` — semantic-release auto-publish from `main`
