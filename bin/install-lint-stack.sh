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

PROJECT="${1:-$PWD}"
[ -d "$PROJECT" ] || {
  echo "ERROR: $PROJECT not a directory" >&2
  exit 1
}
cd "$PROJECT"

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

if [ "$HAS_DOCKER" = "1" ]; then
  copyIfMissingOrUpdate "$STACK_SRC/.hadolint.yaml" ".hadolint.yaml"
fi

if [ "$HAS_NODE" = "1" ]; then
  copyIfMissingOrUpdate "$STACK_SRC/.czrc" ".czrc"
  copyIfMissingOrUpdate "$STACK_SRC/commitlint.config.cjs" "commitlint.config.cjs"
  copyIfMissingOrUpdate "$STACK_SRC/release.config.cjs" "release.config.cjs"
fi

# --- 4. npm dev deps -------------------------------------------------------
if [ "$HAS_NODE" = "1" ]; then
  emdashSection "Installing Node dev deps"
  PM=npm
  command -v bun >/dev/null 2>&1 && PM=bun
  declare -a DEPS=(
    lefthook
    oxlint
    eslint prettier stylelint
    markdownlint-cli2
    knip jscpd
    commitizen "@commitlint/cli" "@commitlint/config-conventional"
    semantic-release
    "git-cz-emoji"
    "conventional-changelog-emoji-config"
    "prettier-config-sexy-mode"
    "prettier-plugin-package-perfection"
    "stylelint-config-so-pretty"
    "@megabytelabs/semantic-release-config"
    "@HeyMegabyte/semantic-release-gh"
  )
  case "$PM" in
    bun) bun add -d "${DEPS[@]}" >/dev/null 2>&1 || emdashLog "!" "bun add deferred (verify network)" ;;
    npm) npm i -D --save-exact "${DEPS[@]}" >/dev/null 2>&1 || emdashLog "!" "npm install deferred (verify network)" ;;
  esac
  emdashLog "✓" "$PM dev deps queued"
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
