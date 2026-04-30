#!/bin/bash
# InstructionsLoaded hook: log which CLAUDE.md was loaded

LOG_DIR="$HOME/.claude/audit"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/instructions-loaded.jsonl"

FILE="${CLAUDE_FILE_PATH:-unknown}"
SESSION="${CLAUDE_SESSION_ID:-unknown}"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

printf '{"ts":"%s","file":"%s","session":"%s"}\n' "$TIMESTAMP" "$FILE" "$SESSION" >> "$LOG_FILE"

exit 0
