#!/bin/bash
# PostToolUse hook: append structured audit log entry
# Tracks what tools are being used and on what files

LOG_DIR="$HOME/.claude/audit"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/$(date +%Y-%m-%d).jsonl"

# Rotate: delete logs older than 14 days
find "$LOG_DIR" -name "*.jsonl" -mtime +14 -delete 2>/dev/null

TOOL="${CLAUDE_TOOL_NAME:-unknown}"
FILE="${CLAUDE_FILE_PATH:-none}"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
SESSION="${CLAUDE_SESSION_ID:-unknown}"

# Log the action (append JSON line)
printf '{"ts":"%s","tool":"%s","file":"%s","session":"%s"}\n' "$TIMESTAMP" "$TOOL" "$FILE" "$SESSION" >> "$LOG_FILE"

exit 0
