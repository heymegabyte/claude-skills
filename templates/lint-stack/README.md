# Lint Stack — drop-in industry-leading lint+autofix+commit-hygiene

Authored by Brian Zalewski for every emdash project. Source of truth lives at
`~/.agentskills/templates/lint-stack/`. Bootstrap via
`bash ~/.agentskills/bin/install-lint-stack.sh <project-dir>`.

## What's wired

| Concern | Tool | Config | Stage |
|--|--|--|--|
| TS/JS speed | oxlint | `eslint.config.ts` | pre-commit |
| TS/JS depth | ESLint 9 + `@megabyte/eslint-config` | `eslint.config.ts` | pre-commit |
| Format | Prettier + `prettier-config-sexy-mode` + `prettier-plugin-package-perfection` | `.prettierrc` | pre-commit |
| CSS | Stylelint + `stylelint-config-so-pretty` | `.stylelintrc` | pre-commit |
| Markdown | markdownlint-cli2 (Brian-voice relaxed) | `.markdownlint.jsonc` | pre-commit |
| YAML | yamllint relaxed | `.yamllint.yml` | pre-commit |
| GH Actions | actionlint | n/a | pre-commit |
| Dockerfile | hadolint | `.hadolint.yaml` | pre-commit |
| Bash bug | shellcheck `-x -S warning` | inline directives | pre-commit |
| Bash format | shfmt `-i 2 -ci -bn` | n/a | pre-commit |
| Python | ruff (replaces flake8 + black + isort) | `pyproject.toml` | pre-commit |
| Secrets | gitleaks (pre-commit) + trufflehog `--only-verified` (pre-push) | n/a | both |
| Duplicates | jscpd ≤1% | `jscpd.json` | pre-push |
| Dead code | knip | `knip.config.ts` | pre-push (warn) |
| Code intel | semgrep `auto` + custom Brian rules | `.semgrep/baseline.yml` | pre-push |
| Commits | commitizen + `git-cz-emoji` (emoji-mandatory) | `.czrc` + `commitlint.config.cjs` | commit-msg |
| Release | semantic-release + `@megabytelabs/semantic-release-config` + `@HeyMegabyte/semantic-release-gh` | `release.config.cjs` | CI |

## Mandate

- Emoji-prefixed commit messages are enforced at commit-msg stage. `git cz` is the path.
- Every pre-commit hook autofixes where possible (`stage_fixed: true`).
- Linters run **in parallel** at every stage via lefthook.
- Self-improving — new lint patterns get codified back into `templates/lint-stack/semgrep-custom/` per `rules/lint-doctrine.md`.

## Cross-link

`rules/lint-doctrine.md` is the canonical doctrine. This README is operations.
