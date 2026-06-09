---
name: install-lint-stack
description: Bootstrap industry-leading lint+autofix+commit-hygiene stack on the current project. Drops in lefthook, oxlint, ESLint, Prettier, Stylelint, markdownlint, ruff, shellcheck, shfmt, yamllint, hadolint, actionlint, jscpd, knip, semgrep, gitleaks, commitizen + git-cz-emoji (emoji-mandatory commits), and semantic-release. Idempotent — re-runs upgrade safely. See rules/lint-doctrine.md.
argument-hint: "[project-dir]"
user-invocable: true
---

# /install-lint-stack

Wires the canonical emdash lint stack into the target project. Source of truth: `~/.agentskills/templates/lint-stack/`. Doctrine: `~/.agentskills/rules/lint-doctrine.md`.

## What it does

1. **Detects** Node/Python/Docker/Actions/Shell presence.
2. **Backs up** any existing configs to `.lint-stack-backup-<ts>/`.
3. **Copies** the appropriate template configs into the project root.
4. **Installs** npm/bun dev deps for the detected stack.
5. **Updates** `package.json` scripts: `lint`, `lint:fix`, `format`, `commit`, `release`, `lint:semgrep`, `lint:knip`, `lint:jscpd`.
6. **Installs** lefthook git hooks (`lefthook install`).
7. **Writes** ruff config for Python projects when absent.

## Mandate after install

- **Every commit must start with a gitmoji** — enforced at `commit-msg` stage via commitlint + a gitmoji-enforce lefthook script (belt+suspenders).
- **Path:** `git cz` (alias `git c`) for guided emoji-aware commits.
- **Parallel autofix** runs on every staged file at `pre-commit`.
- **Heavy intel** (semgrep, jscpd, knip, trufflehog) runs at `pre-push`.

## Self-improving — codify novel findings

Every time a linter catches a recurring class of bug across projects:

1. Add a semgrep rule under `~/.agentskills/templates/lint-stack/semgrep-custom/<topic>.yml`.
2. Append the pattern to `rules/lint-doctrine.md` §"Codified incidents".
3. Cross-link from the relevant existing rule (`code-style.md`, `ai-agent-security.md`, etc.).
4. Verify via `semgrep --test`.
5. Distribute by committing to the agentskills repo — auto-pushed per Brian's git policy.

This satisfies `prompt-as-training-signal` §6 — every novel bug class deterministically codified, never re-learned.

## Invocation

```bash
bash ~/.agentskills/bin/install-lint-stack.sh             # current dir
bash ~/.agentskills/bin/install-lint-stack.sh /path/to/X  # named dir
```

After install:

```bash
npm run lint           # autofix pass over all files
git cz                 # compose emoji-prefixed commit
npm run release        # semantic-release publish
```

## See

- `rules/lint-doctrine.md`
- `templates/lint-stack/README.md`
- `rules/code-style.md`
- `rules/ai-agent-security.md`
