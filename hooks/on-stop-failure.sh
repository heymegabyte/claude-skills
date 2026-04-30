#!/bin/bash
# StopFailure hook: log failure and send macOS notification

LOG_DIR="$HOME/.claude/audit"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/stop-failures.jsonl"

SESSION="${CLAUDE_SESSION_ID:-unknown}"
ERROR="${CLAUDE_ERROR:-unknown}"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
PROJECT=$(basename "$(pwd)")

printf '{"ts":"%s","error":"%s","project":"%s","session":"%s"}\n' "$TIMESTAMP" "$ERROR" "$PROJECT" "$SESSION" >> "$LOG_FILE"

# macOS notification
osascript -e "display notification \"Session failed in $PROJECT: $ERROR\" with title \"Emdash OS\" subtitle \"Stop Failure\"" 2>/dev/null || true

exit 0
