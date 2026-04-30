#!/bin/bash
# TeammateIdle hook: log when team agents finish for orchestration tracking
# Helps identify bottlenecks in parallel agent work

LOG_DIR="$HOME/.claude/audit"
mkdir -p "$LOG_DIR"

printf '{"ts":"%s","event":"teammate_idle","session":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "${CLAUDE_SESSION_ID:-unknown}" >> "$LOG_DIR/team-events.jsonl"

exit 0
