#!/usr/bin/env bash
# install-lint-stack.sh — bootstrap industry-leading lint+autofix+commit-hygiene
# Source of truth: rules/lint-doctrine.md
# Usage: bash ~/.agentskills/bin/install-lint-stack.sh [project-dir]
#
# Behavior:
#  - Detects stack (Node, Python, Docker, GH Actions presence)
#  - Backs up any existing matching configs to .lint-stack-backup-<ts>/
#  - Copies relevant configs from templates/lint-stack/ to project root
#  - Installs npm dev deps (or bun add -d) per detected stack
#  - Wires lefthook install
#  - Updates package.json scripts (lint/lint:fix/format/commit/release)
#  - Idempotent — re-run upgrades only

set -euo pipefail

INSTALL_DEPS=0
ARGS=()
for arg in "$@"; do
  case "$arg" in
    --install-deps) INSTALL_DEPS=1 ;;
    *) ARGS+=("$arg") ;;
  esac
done

PROJECT="${ARGS[0]:-$PWD}"
[ -d "$PROJECT" ] || {
  echo "ERROR: $PROJECT not a directory" >&2
  exit 1
}
cd "$PROJECT" || exit 1

# Resolve symlink-aware path to the skills root
SKILLS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STACK_SRC="$SKILLS_ROOT/templates/lint-stack"
[ -d "$STACK_SRC" ] || {
  echo "ERROR: $STACK_SRC missing" >&2
  exit 1
}

TS=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR=".lint-stack-backup-$TS"

emdashLog() { printf "  %s %s\n" "$1" "$2" >&2; }
emdashSection() { printf "\n▸ %s\n" "$1" >&2; }

# --- 1. Detect stack -------------------------------------------------------
emdashSection "Detecting stack"
# shellcheck disable=SC2034  # HAS_ACTIONS / HAS_SHELL reserved for future per-stack branches
HAS_NODE=0
HAS_PY=0
HAS_DOCKER=0
HAS_ACTIONS=0
HAS_SHELL=0
[ -f package.json ] && HAS_NODE=1 && emdashLog "✓" "Node.js (package.json)"
{ ls ./*.py >/dev/null 2>&1 || [ -f pyproject.toml ]; } && HAS_PY=1 && emdashLog "✓" "Python"
ls ./Dockerfile* >/dev/null 2>&1 && HAS_DOCKER=1 && emdashLog "✓" "Docker"
# shellcheck disable=SC2034
[ -d .github/workflows ] && HAS_ACTIONS=1 && emdashLog "✓" "GitHub Actions"
# shellcheck disable=SC2034
{ ls ./*.sh >/dev/null 2>&1 || [ -d bin ] || [ -d scripts ]; } && HAS_SHELL=1 && emdashLog "✓" "Shell"

# --- 2. Backup existing configs --------------------------------------------
emdashSection "Backing up any existing configs"
backupCandidates=(
  lefthook.yml .czrc commitlint.config.cjs commitlint.config.js
  release.config.cjs release.config.js .releaserc .releaserc.json
  .markdownlint.jsonc .markdownlint.json .markdownlintrc
  .editorconfig .yamllint.yml .yamllint
  .hadolint.yaml jscpd.json .jscpd.json
  .semgrep
)
for f in "${backupCandidates[@]}"; do
  if [ -e "$f" ]; then
    mkdir -p "$BACKUP_DIR"
    cp -R "$f" "$BACKUP_DIR/"
    emdashLog "↷" "$f → $BACKUP_DIR/"
  fi
done

# --- 3. Copy templates -----------------------------------------------------
emdashSection "Copying templates"
copyIfMissingOrUpdate() {
  local src="$1" dst="$2"
  cp "$src" "$dst"
  emdashLog "✓" "$dst"
}
copyIfMissingOrUpdate "$STACK_SRC/lefthook.yml" "lefthook.yml"
copyIfMissingOrUpdate "$STACK_SRC/.editorconfig" ".editorconfig"
copyIfMissingOrUpdate "$STACK_SRC/.markdownlint.jsonc" ".markdownlint.jsonc"
copyIfMissingOrUpdate "$STACK_SRC/.yamllint.yml" ".yamllint.yml"
copyIfMissingOrUpdate "$STACK_SRC/jscpd.json" "jscpd.json"
mkdir -p .semgrep
cp "$STACK_SRC/.semgrep/baseline.yml" ".semgrep/baseline.yml"
emdashLog "✓" ".semgrep/baseline.yml"

# Codified semgrep rules — copy alongside baseline so semgrep --config=./.semgrep picks up all
if [ -d "$STACK_SRC/semgrep-custom" ]; then
  mkdir -p .semgrep/custom
  cp "$STACK_SRC/semgrep-custom"/*.yml .semgrep/custom/ 2>/dev/null || true
  emdashLog "✓" ".semgrep/custom/ ($(ls "$STACK_SRC/semgrep-custom" 2>/dev/null | wc -l | tr -d ' ') codified rules)"
fi

# .lint-history/.gitignore — exclude logs + proposals from git (they're local audit only)
mkdir -p .lint-history
cat >.lint-history/.gitignore <<'EOF'
# Lint history is local-only audit data. Per rules/lint-doctrine.md.
*.log
proposals/
EOF
emdashLog "✓" ".lint-history/.gitignore"

if [ "$HAS_DOCKER" = "1" ]; then
  copyIfMissingOrUpdate "$STACK_SRC/.hadolint.yaml" ".hadolint.yaml"
fi

if [ "$HAS_NODE" = "1" ]; then
  copyIfMissingOrUpdate "$STACK_SRC/.czrc" ".czrc"
  copyIfMissingOrUpdate "$STACK_SRC/commitlint.config.cjs" "commitlint.config.cjs"
  copyIfMissingOrUpdate "$STACK_SRC/release.config.cjs" "release.config.cjs"
  copyIfMissingOrUpdate "$STACK_SRC/.prettierrc.cjs" ".prettierrc.cjs"
  copyIfMissingOrUpdate "$STACK_SRC/.stylelintrc.cjs" ".stylelintrc.cjs"
  copyIfMissingOrUpdate "$STACK_SRC/eslint.config.mjs" "eslint.config.mjs"
  copyIfMissingOrUpdate "$STACK_SRC/.gitmessage" ".gitmessage"
  # Wire git commit template (project-local)
  git config commit.template .gitmessage 2>/dev/null || true
fi

# --- 4. npm dev deps -------------------------------------------------------
if [ "$HAS_NODE" = "1" ]; then
  emdashSection "Installing Node dev deps"
  PM=npm
  command -v bun >/dev/null 2>&1 && PM=bun
  # Mainstream best-in-class — latest stable, high-download, well-maintained
  declare -a DEPS=(
    # Lint orchestration
    lefthook oxlint
    # ESLint 9 + canonical plugin chain (+ eslint-config-prettier last to silence
    # any formatting rules that conflict with Prettier)
    eslint "@eslint/js" typescript-eslint
    eslint-plugin-perfectionist eslint-plugin-security
    eslint-plugin-unicorn eslint-plugin-promise eslint-plugin-n
    eslint-plugin-sonarjs eslint-plugin-import
    eslint-config-prettier
    # Prettier 3 + curated plugins
    prettier prettier-plugin-packagejson prettier-plugin-organize-imports
    # Stylelint 16 + standards
    stylelint stylelint-config-standard stylelint-config-recommended
    stylelint-config-clean-order
    # Markdown / dead code / duplicates
    markdownlint-cli2 knip jscpd
    # Commitizen + commitlint + gitmoji (pin cz-emoji to stable; npm latest is canary)
    commitizen "cz-emoji@^1.3.1" "@commitlint/cli" "@commitlint/config-conventional"
    conventional-changelog-gitmoji-config
    # Semantic release + gitmoji-aware analyzer/notes
    semantic-release semantic-release-gitmoji
    "@semantic-release/changelog" "@semantic-release/git"
    "@semantic-release/github" "@semantic-release/npm"
  )
  # GIT_DEPS retired in pass-9 — all packages now on npm registry (mainstream-only mandate)
  case "$PM" in
    bun)
      bun add -d "${DEPS[@]}" >/dev/null 2>&1 || emdashLog "!" "bun add deferred (verify network)"
      ;;
    npm)
      npm i -D "${DEPS[@]}" >/dev/null 2>&1 || emdashLog "!" "npm install deferred (verify network)"
      ;;
  esac
  emdashLog "✓" "$PM dev deps queued (${#DEPS[@]} packages, all mainstream npm)"
fi

# --- 5. Wire scripts -------------------------------------------------------
if [ "$HAS_NODE" = "1" ] && command -v node >/dev/null 2>&1; then
  emdashSection "Wiring package.json scripts"
  node - <<'NODE'
const fs = require('node:fs');
const path = 'package.json';
const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
pkg.scripts = pkg.scripts || {};
const want = {
  lint: 'lefthook run pre-commit --all-files',
  'lint:fix': 'lefthook run pre-commit --all-files',
  format: 'prettier --write . && shfmt -i 2 -ci -bn -w $(git ls-files "*.sh")',
  commit: 'cz',
  release: 'semantic-release',
  'lint:semgrep': 'semgrep --config=auto --config=./.semgrep',
  'lint:knip': 'knip',
  'lint:jscpd': 'jscpd',
  'precommit:audit': 'lefthook run pre-commit --all-files && lefthook run pre-push --all-files',
  'lint:improve': 'bash ~/.agentskills/bin/lint-auto-improve.sh',
  'sha-pin': 'node ~/.agentskills/scripts/sha-pin-actions.mjs .github/workflows/*.yml',
  'sha-pin:check': 'node ~/.agentskills/scripts/sha-pin-actions.mjs --check .github/workflows/*.yml',
  'sha-pin:bump': 'node ~/.agentskills/scripts/sha-pin-actions.mjs --bump .github/workflows/*.yml',
  'security:audit': 'bash ~/.agentskills/bin/security-supply-chain.sh',
  'recap': 'bash ~/.agentskills/bin/session-recap.sh',
  'recap:today': 'bash ~/.agentskills/bin/session-recap.sh today',
  'recap:json': 'bash ~/.agentskills/bin/session-recap.sh today --json',
  'recap:week': 'bash ~/.agentskills/bin/session-recap.sh 50',
  'recap:month': 'bash ~/.agentskills/bin/session-recap.sh 200',
  'security:audit:json': 'bash ~/.agentskills/bin/security-supply-chain.sh --json',
  'lint:improve:json': 'bash ~/.agentskills/bin/lint-auto-improve.sh --json',
};
let touched = 0;
for (const [k, v] of Object.entries(want)) {
  if (pkg.scripts[k] !== v) { pkg.scripts[k] = v; touched++; }
}
pkg.config = pkg.config || {};
pkg.config.commitizen = { path: 'git-cz-emoji' };
fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
console.error(`  ✓ ${touched} script(s) added/updated`);
NODE
fi

# --- 5.5. Brew-tool install (optional --install-deps) ----------------------
emdashSection "Brew tool availability"
MISSING=()
for tool in gitleaks trufflehog semgrep shellcheck shfmt yamllint actionlint hadolint; do
  if command -v "$tool" >/dev/null 2>&1; then
    emdashLog "✓" "$tool installed"
  else
    MISSING+=("$tool")
    emdashLog "!" "$tool missing"
  fi
done
if [ "${#MISSING[@]}" -gt 0 ]; then
  if [ "$INSTALL_DEPS" = "1" ] && command -v brew >/dev/null 2>&1; then
    emdashLog "↓" "brew install ${MISSING[*]}"
    brew install "${MISSING[@]}" 2>&1 | tail -5 || emdashLog "!" "brew install partial — review output"
  else
    emdashLog "i" "rerun with --install-deps OR: brew install ${MISSING[*]}"
  fi
fi

# --- 6. lefthook install ---------------------------------------------------
emdashSection "Installing lefthook git hooks"
if command -v lefthook >/dev/null 2>&1; then
  lefthook install >/dev/null
  emdashLog "✓" "git hooks installed"
elif [ "$HAS_NODE" = "1" ]; then
  npx --no-install lefthook install >/dev/null 2>&1 || emdashLog "!" "run 'npx lefthook install' after deps land"
fi

# --- 7. Python ruff config (only if no existing pyproject ruff section) ----
if [ "$HAS_PY" = "1" ] && [ ! -f pyproject.toml ]; then
  emdashSection "Writing pyproject.toml ruff config"
  cat >pyproject.toml <<'EOF'
[tool.ruff]
line-length = 120
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "W", "UP", "I", "B", "C4", "PIE", "RUF"]
ignore = ["E501"]

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
EOF
  emdashLog "✓" "pyproject.toml"
fi

# --- 8. Summary ------------------------------------------------------------
emdashSection "Done"
emdashLog "✓" "Lint stack installed in $PROJECT"
if [ -d "$BACKUP_DIR" ]; then emdashLog "i" "Existing configs backed up to $BACKUP_DIR"; fi
emdashLog "i" "Doctrine: rules/lint-doctrine.md"
emdashLog "i" "Commit via: git cz   |   Release via: npm run release"
