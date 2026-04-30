#!/bin/bash
# PostToolUseFailure hook: log failures for pattern detection
# Tracks which tools fail most often, aids self-healing

LOG_DIR="$HOME/.claude/audit"
mkdir -p "$LOG_DIR"
FAIL_LOG="$LOG_DIR/tool-failures.jsonl"

TOOL="${CLAUDE_TOOL_NAME:-unknown}"
FILE="${CLAUDE_FILE_PATH:-none}"
SESSION="${CLAUDE_SESSION_ID:-unknown}"

printf '{"ts":"%s","tool":"%s","file":"%s","session":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$TOOL" "$FILE" "$SESSION" >> "$FAIL_LOG"

# Rotate: archive if >1MB, keep last 7 days of archives
if [ -f "$FAIL_LOG" ] && [ "$(stat -f%z "$FAIL_LOG" 2>/dev/null || stat -c%s "$FAIL_LOG" 2>/dev/null)" -gt 1048576 ]; then
  mv "$FAIL_LOG" "$LOG_DIR/tool-failures-$(date +%Y%m%d).jsonl"
fi
find "$LOG_DIR" -name "tool-failures-*.jsonl" -mtime +7 -delete 2>/dev/null

exit 0
