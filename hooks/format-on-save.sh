#!/bin/bash
# PostToolUse hook: auto-format files after Write/Edit
# ESLint+Prettier for TS/JS, Ruff for Python, ShellCheck+shfmt for Bash

FILE="${CLAUDE_FILE_PATH:-}"
[ -z "$FILE" ] && exit 0
[ ! -f "$FILE" ] && exit 0

case "$FILE" in
  *.env|*.env.*|*/.env|*/.env.*|*/secrets/*)
    exit 0
    ;;
esac

SKIP_LOG="$HOME/.claude/audit/formatter-skips.log"
mkdir -p "$(dirname "$SKIP_LOG")"

log_skip() {
  printf '%s\t%s\t%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" "$FILE" >> "$SKIP_LOG"
}

run_npx() {
  if command -v npx >/dev/null 2>&1; then
    "$@"
  else
    log_skip "npx"
  fi
}

run_if_available() {
  local tool="$1"
  shift
  if command -v "$tool" >/dev/null 2>&1; then
    "$@"
  else
    log_skip "$tool"
  fi
}

case "$FILE" in
  *.ts|*.tsx)
    run_npx npx --yes eslint --fix "$FILE" 2>/dev/null || true
    run_npx npx --yes prettier --write "$FILE" 2>/dev/null || true
    # Semgrep: run project rules if they exist, then base rules
    if [ -d ".semgrep/rules" ]; then
      run_if_available semgrep semgrep --config .semgrep/rules/ --quiet "$FILE" 2>/dev/null || true
    elif [ -d "$HOME/.agentskills/templates/semgrep-rules" ]; then
      run_if_available semgrep semgrep --config "$HOME/.agentskills/templates/semgrep-rules/" --quiet "$FILE" 2>/dev/null || true
    fi
    ;;
  *.js|*.jsx|*.mjs|*.cjs)
    run_npx npx --yes eslint --fix "$FILE" 2>/dev/null || true
    run_npx npx --yes prettier --write "$FILE" 2>/dev/null || true
    if [ -d ".semgrep/rules" ]; then
      run_if_available semgrep semgrep --config .semgrep/rules/ --quiet "$FILE" 2>/dev/null || true
    fi
    ;;
  *.json|*.css|*.scss|*.html|*.md|*.yaml|*.yml)
    run_npx npx --yes prettier --write "$FILE" 2>/dev/null || true
    ;;
  *.py)
    run_if_available ruff ruff check --fix "$FILE" 2>/dev/null || true
    run_if_available ruff ruff format "$FILE" 2>/dev/null || true
    ;;
  *.sh|*.bash)
    run_if_available shellcheck shellcheck "$FILE" 2>/dev/null || true
    run_if_available shfmt shfmt -w "$FILE" 2>/dev/null || true
    ;;
esac

exit 0
