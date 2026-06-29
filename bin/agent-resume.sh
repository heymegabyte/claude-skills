#!/usr/bin/env bash
set -euo pipefail

# agent-resume.sh
#
# Reads /tmp/claude-agent-progress.json and prints the current task
# description and remaining steps for an interrupted agent session.
#
# Usage:
#   agent-resume.sh                     # default path
#   agent-resume.sh /path/to/progress.json

PROGRESS_FILE="${1:-/tmp/claude-agent-progress.json}"

if [ ! -f "$PROGRESS_FILE" ]; then
  echo "agent-resume: no progress file at $PROGRESS_FILE"
  echo "Start a new session or provide a path to an existing progress file."
  exit 1
fi

TASK=$(jq -r '.task // "Untitled task"' "$PROGRESS_FILE")
STATUS=$(jq -r '.status // "unknown"' "$PROGRESS_FILE")
STEPS=$(jq -r '.remaining_steps // [] | join("\n  - ")' "$PROGRESS_FILE")
SUMMARY=$(jq -r '.summary // ""' "$PROGRESS_FILE")

echo ""
echo "Agent Resume — $(basename "$PROGRESS_FILE")"
echo "============================================"
echo ""
echo "Task:  $TASK"
echo "Status: $STATUS"
echo ""

if [ -n "$SUMMARY" ]; then
  echo "Summary: $SUMMARY"
  echo ""
fi

if [ -n "$STEPS" ]; then
  echo "Remaining steps:"
  echo "  - $STEPS"
  echo ""
else
  echo "No remaining steps listed."
  echo ""
fi

echo "To resume, re-read this file and continue from the first incomplete step."
