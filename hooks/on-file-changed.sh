#!/bin/bash
# FileChanged hook: log changed files to audit trail

LOG_DIR="$HOME/.claude/audit"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/file-changes.jsonl"

FILE="${CLAUDE_FILE_PATH:-unknown}"
SESSION="${CLAUDE_SESSION_ID:-unknown}"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

printf '{"ts":"%s","file":"%s","session":"%s"}\n' "$TIMESTAMP" "$FILE" "$SESSION" >> "$LOG_FILE"

# Rotate: archive if >1MB, keep last 14 days of archives
if [ -f "$LOG_FILE" ] && [ "$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null)" -gt 1048576 ]; then
  mv "$LOG_FILE" "$LOG_DIR/file-changes-$(date +%Y%m%d).jsonl"
fi
find "$LOG_DIR" -name "file-changes-*.jsonl" -mtime +14 -delete 2>/dev/null

exit 0
