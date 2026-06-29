#!/bin/bash
# Rotate ~/.claude/hooks/.hook-execution.log when it exceeds 1MB
# Called by session-start hook or standalone.
# Keeps one rotated backup; truncates the live file.

LOG="$HOME/.claude/hooks/.hook-execution.log"
MAX_BYTES=1048576  # 1 MB

if [ -f "$LOG" ] && [ "$(stat -f%z "$LOG" 2>/dev/null)" -gt "$MAX_BYTES" ] 2>/dev/null; then
  mv "$LOG" "$LOG.1" 2>/dev/null
  touch "$LOG"
  echo "rotated hook log (was over 1MB)"
fi
