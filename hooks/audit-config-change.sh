#!/bin/bash
# PostToolUse hook for config changes: log settings modifications

LOG_DIR="$HOME/.claude/audit"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/config-changes.jsonl"

FILE="${CLAUDE_FILE_PATH:-unknown}"
SESSION="${CLAUDE_SESSION_ID:-unknown}"

printf '{"ts":"%s","file":"%s","session":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$FILE" "$SESSION" >> "$LOG_FILE"

exit 0
