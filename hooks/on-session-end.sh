#!/bin/bash
# SessionEnd hook: final cleanup — log session duration and tool call count

LOG_DIR="$HOME/.claude/audit"
mkdir -p "$LOG_DIR"
SESSION_LOG="$LOG_DIR/sessions.jsonl"

SESSION="${CLAUDE_SESSION_ID:-unknown}"
PROJECT=$(basename "$(pwd)")
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Count tool calls from today's audit log
TODAY=$(date +%Y-%m-%d)
AUDIT_FILE="$LOG_DIR/$TODAY.jsonl"
if [ -f "$AUDIT_FILE" ]; then
  TOOL_CALLS=$(grep -c "\"session\":\"$SESSION\"" "$AUDIT_FILE" 2>/dev/null || echo "0")
else
  TOOL_CALLS=0
fi

# Count file changes this session
CHANGES_FILE="$LOG_DIR/file-changes.jsonl"
if [ -f "$CHANGES_FILE" ]; then
  FILE_CHANGES=$(grep -c "\"session\":\"$SESSION\"" "$CHANGES_FILE" 2>/dev/null || echo "0")
else
  FILE_CHANGES=0
fi

printf '{"ts":"%s","session":"%s","project":"%s","tool_calls":%d,"file_changes":%d}\n' "$TIMESTAMP" "$SESSION" "$PROJECT" "$TOOL_CALLS" "$FILE_CHANGES" >> "$SESSION_LOG"

exit 0
