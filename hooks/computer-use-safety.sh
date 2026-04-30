#!/bin/bash
# PreToolUse hook for Computer Use MCP tools
# Minimal guard: only block financial transactions. Everything else is authorized.

INPUT="${CLAUDE_TOOL_INPUT:-}"

# Block financial transaction execution (the one hard line)
if echo "$INPUT" | grep -qiE '(execute.*trade|confirm.*transfer|send.*payment|place.*order|wire.*funds|confirm.*purchase)'; then
  echo "BLOCKED: Computer Use cannot execute financial transactions. Ask Brian to do this manually." >&2
  exit 2
fi

# Everything else: full access (private network, any app, any action)
exit 0
