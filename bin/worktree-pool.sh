#!/usr/bin/env bash
# bin/worktree-pool.sh — Pre-warmed worktree pool for parallel agent isolation.
#
# Usage:
#   worktree-pool.sh init [count]     Create N worktrees (default: 6)
#   worktree-pool.sh acquire [label]  Pop a worktree, returns its path
#   worktree-pool.sh release <path>   Reset and return worktree to pool
#   worktree-pool.sh status           Show pool status
#   worktree-pool.sh cleanup          Remove all pool worktrees
#
# Worktrees live at .claude/worktrees/pool-{1..N}/
# The pool file at .claude/.worktree-pool tracks which are free/in-use.

set -euo pipefail

POOL_DIR=".claude/worktrees"
POOL_FILE=".claude/.worktree-pool"
DEFAULT_COUNT=6
ACTION="${1:-status}"
ARG="${2:-}"

_init_pool_file() {
  if [[ ! -f "$POOL_FILE" ]]; then
    echo "{}" > "$POOL_FILE"
  fi
}

_list_free() {
  _init_pool_file
  python3 -c "
import json
with open('$POOL_FILE') as f:
    pool = json.load(f)
for name, state in sorted(pool.items()):
    if state.get('status') == 'free':
        print(f'{name}|{state.get(\"path\",\"\")}|{state.get(\"branch\",\"\")}')
" 2>/dev/null
}

init() {
  local count="${ARG:-$DEFAULT_COUNT}"
  mkdir -p "$POOL_DIR"
  _init_pool_file

  for i in $(seq 1 "$count"); do
    local name="pool-${i}"
    local path="$POOL_DIR/$name"
    local branch="worktree-${name}-$(date +%s)"

    if [[ -d "$path" ]]; then
      echo "[worktree-pool] $name already exists, skipping" >&2
      continue
    fi

    git worktree add "$path" -b "$branch" 2>/dev/null || {
      echo "[worktree-pool] Failed to create $name" >&2
      continue
    }

    python3 -c "
import json
with open('$POOL_FILE') as f:
    pool = json.load(f)
pool['$name'] = {'status': 'free', 'path': '$path', 'branch': '$branch', 'created': '$(date -u +%Y-%m-%dT%H:%M:%SZ)'}
with open('$POOL_FILE', 'w') as f:
    json.dump(pool, f, indent=2)
"
    echo "[worktree-pool] Created $name → $path" >&2
  done
  echo "[worktree-pool] Pool initialized with $(status_count) worktrees" >&2
}

acquire() {
  local label="${ARG:-agent-$(date +%s)}"
  local free=$(_list_free | head -1)

  if [[ -z "$free" ]]; then
    echo "[worktree-pool] NO FREE WORKTREES. Create more with: worktree-pool.sh init" >&2
    exit 1
  fi

  local name=$(echo "$free" | cut -d'|' -f1)
  local path=$(echo "$free" | cut -d'|' -f2)

  python3 -c "
import json
with open('$POOL_FILE') as f:
    pool = json.load(f)
pool['$name']['status'] = 'in-use'
pool['$name']['label'] = '$label'
pool['$name']['acquired_at'] = '$(date -u +%Y-%m-%dT%H:%M:%SZ)'
with open('$POOL_FILE', 'w') as f:
    json.dump(pool, f, indent=2)
"

  # Reset worktree to clean state
  cd "$path" && git checkout main 2>/dev/null && git pull 2>/dev/null || true

  echo "[worktree-pool] Acquired $name → $path (label: $label)" >&2
  echo "$path"
}

release() {
  local path="${ARG}"
  if [[ -z "$path" ]]; then
    echo "[worktree-pool] Usage: worktree-pool.sh release <path>" >&2
    exit 1
  fi

  local name=$(basename "$path")

  # Reset to main
  cd "$path" && git checkout main 2>/dev/null && git reset --hard origin/main 2>/dev/null || true

  python3 -c "
import json
with open('$POOL_FILE') as f:
    pool = json.load(f)
if '$name' in pool:
    pool['$name']['status'] = 'free'
    pool['$name'].pop('label', None)
    pool['$name'].pop('acquired_at', None)
    pool['$name']['released_at'] = '$(date -u +%Y-%m-%dT%H:%M:%SZ)'
with open('$POOL_FILE', 'w') as f:
    json.dump(pool, f, indent=2)
"
  echo "[worktree-pool] Released $name ← $path" >&2
}

status_count() {
  _list_free | wc -l | tr -d ' '
}

status() {
  _init_pool_file
  echo "╭─ Worktree Pool ───────────────────────╮"
  python3 -c "
import json
with open('$POOL_FILE') as f:
    pool = json.load(f)
free = sum(1 for s in pool.values() if s.get('status') == 'free')
in_use = sum(1 for s in pool.values() if s.get('status') == 'in-use')
print(f'  Free: {free}  |  In-Use: {in_use}  |  Total: {len(pool)}')
for name, state in sorted(pool.items()):
    status = state.get('status', '?')
    icon = '🟢' if status == 'free' else '🔴'
    label = state.get('label', '')
    print(f'  {icon} {name}: {status} {label}')
print('╰──────────────────────────────────────╯')
" 2>/dev/null
}

cleanup() {
  for dir in "$POOL_DIR"/pool-*; do
    if [[ -d "$dir" ]]; then
      local name=$(basename "$dir")
      git worktree remove "$dir" --force 2>/dev/null || true
      echo "[worktree-pool] Removed $name" >&2
    fi
  done
  rm -f "$POOL_FILE"
  echo "[worktree-pool] Cleanup complete" >&2
}

case "$ACTION" in
  init)     init ;;
  acquire)  acquire ;;
  release)  release ;;
  status)   status ;;
  cleanup)  cleanup ;;
  *)        echo "Usage: worktree-pool.sh {init|acquire|release|status|cleanup} [arg]" >&2; exit 1 ;;
esac
