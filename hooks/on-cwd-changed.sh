#!/bin/bash
# CwdChanged hook: detect project type on directory change and log it

LOG_DIR="$HOME/.claude/audit"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/cwd-changes.jsonl"

NEW_DIR="${CLAUDE_CWD:-$(pwd)}"
SESSION="${CLAUDE_SESSION_ID:-unknown}"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Detect project type
if [ -f "$NEW_DIR/wrangler.toml" ] || [ -f "$NEW_DIR/wrangler.jsonc" ]; then
  PROJECT_TYPE="cloudflare-worker"
elif [ -f "$NEW_DIR/angular.json" ]; then
  PROJECT_TYPE="angular"
elif [ -f "$NEW_DIR/pyproject.toml" ]; then
  PROJECT_TYPE="python"
elif [ -f "$NEW_DIR/package.json" ]; then
  PROJECT_TYPE="node"
else
  PROJECT_TYPE="unknown"
fi

printf '{"ts":"%s","dir":"%s","type":"%s","session":"%s"}\n' "$TIMESTAMP" "$NEW_DIR" "$PROJECT_TYPE" "$SESSION" >> "$LOG_FILE"

exit 0
