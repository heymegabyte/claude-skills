#!/bin/bash
# UserPromptSubmit hook: auto-detect preference signals in every prompt
# Logs corrections, always/never patterns, and tech decisions for memory extraction

INPUT="${CLAUDE_USER_PROMPT:-}"
LOG_DIR="$HOME/.claude/audit"
SIGNALS_LOG="$LOG_DIR/preference-signals.jsonl"
mkdir -p "$LOG_DIR"

# Detect correction patterns ("don't", "stop", "not that", "never", "always", "wrong")
PROMPT_JSON=$(printf '%s' "$INPUT" | head -c 500 | jq -Rs . 2>/dev/null || echo '""')

# Detect correction patterns ("don't", "stop", "not that", "never", "always", "wrong")
if printf '%s' "$INPUT" | grep -qiE "(don.t|stop|not that|never|always|wrong|instead of|prefer|switch to|use .* instead|no more)"; then
  printf '{"ts":"%s","type":"correction","prompt":%s}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$PROMPT_JSON" >> "$SIGNALS_LOG"
fi

# Detect tech decisions ("use X", "switch to X", "add X", "install X")
if printf '%s' "$INPUT" | grep -qiE "(use |switch to |add |install |migrate to |replace .* with)"; then
  printf '{"ts":"%s","type":"tech_decision","prompt":%s}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$PROMPT_JSON" >> "$SIGNALS_LOG"
fi

# Always pass through — this hook observes, never blocks
exit 0
