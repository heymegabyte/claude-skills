#!/usr/bin/env bash
# bin/claim-task.sh — Agent claim protocol for parallel work coordination.
#
# Usage: claim-task.sh <task-name> [agent-id]
#
# Writes a lock file to .agent-tasks/<hash>.txt, commits, and pushes.
# If push fails (another agent claimed it first), exits non-zero.
# Agents check the exit code — if 0, the task is theirs; if 1, pick a different task.
#
# Pattern: Anthropic's 16-agent C compiler lock protocol — git merge resolution
# forces collision detection. No central orchestrator needed.
set -euo pipefail

TASK_NAME="${1:?Usage: claim-task.sh <task-name> [agent-id]}"
AGENT_ID="${2:-agent-$(date +%s)}"
TASK_HASH=$(echo -n "$TASK_NAME" | md5 2>/dev/null || echo -n "$TASK_NAME" | md5sum | cut -d' ' -f1)
LOCK_DIR=".agent-tasks"
LOCK_FILE="$LOCK_DIR/${TASK_HASH}.txt"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

mkdir -p "$LOCK_DIR"

# Check if already claimed by someone else
if git log -1 --format="%s" -- "$LOCK_FILE" 2>/dev/null | grep -q "claim:"; then
  CLAIMANT=$(git log -1 --format="%s" -- "$LOCK_FILE" 2>/dev/null | sed 's/claim: //')
  echo "[claim-task] TASK TAKEN: '$TASK_NAME' already claimed by $CLAIMANT" >&2
  exit 1
fi

# Write and push claim
echo "$AGENT_ID:$TIMESTAMP:$TASK_NAME" >"$LOCK_FILE"
git add "$LOCK_FILE" 2>/dev/null
git commit -m "claim: $AGENT_ID — $TASK_NAME" 2>/dev/null || true

if git push 2>/dev/null; then
  echo "[claim-task] CLAIMED: '$TASK_NAME' → $AGENT_ID ($TIMESTAMP)" >&2
  echo "$LOCK_FILE"
  exit 0
else
  # Push failed — someone else claimed it between our check and push
  echo "[claim-task] RACE: '$TASK_NAME' claimed by another agent (push rejected)" >&2
  git reset HEAD~1 2>/dev/null || true
  git checkout -- "$LOCK_FILE" 2>/dev/null || true
  exit 1
fi
