#!/usr/bin/env bash
# check-ci-status.sh — verify the latest GitHub Actions run is green.
# Closes the pass-89 blind-spot where I'd been pushing while CI ran red.
# Local mechanical enforcement (pre-commit hook) covers lint-all only;
# CI runs independently. Run this AFTER every push.
#
# Usage:
#   bash ~/.agentskills/bin/check-ci-status.sh [--json] [--wait]
#
# --wait: poll until the in-progress run completes (max 5 min)
# --json: uniform envelope per rules/uniform-json-output.md (14th caller of
#         bin/lib/emit-json.sh).

set -uo pipefail

JSON=0
WAIT=0
for arg in "$@"; do
  case "$arg" in
    --json) JSON=1 ;;
    --wait) WAIT=1 ;;
  esac
done

SKILLS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SKILLS_ROOT" || exit 1

# shellcheck source=lib/emit-json.sh
. "$SKILLS_ROOT/bin/lib/emit-json.sh"

if ! command -v gh >/dev/null 2>&1; then
  [ "$JSON" = "0" ] && printf '⊝ gh CLI not installed — skip (brew install gh)\n' >&2
  exit 0
fi

fetchStatus() {
  gh run list --limit 1 --json conclusion,headSha,status,name 2>/dev/null
}

STATUS_JSON=$(fetchStatus)

if [ "$WAIT" = "1" ]; then
  for _ in $(seq 1 30); do
    state=$(printf '%s' "$STATUS_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['status'])" 2>/dev/null)
    [ "$state" = "completed" ] && break
    sleep 10
    STATUS_JSON=$(fetchStatus)
  done
fi

CONCLUSION=$(printf '%s' "$STATUS_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)[0].get('conclusion','') or 'in_progress')" 2>/dev/null || echo "unknown")
HEAD_SHA=$(printf '%s' "$STATUS_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)[0].get('headSha','')[:7])" 2>/dev/null || echo "unknown")
NAME=$(printf '%s' "$STATUS_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)[0].get('name',''))" 2>/dev/null || echo "unknown")

EXIT=0
case "$CONCLUSION" in
  success) EXIT=0 ;;
  in_progress) EXIT=0 ;;
  *) EXIT=1 ;;
esac

if [ "$JSON" = "0" ]; then
  case "$CONCLUSION" in
    success) printf '✓ CI green — %s @ %s\n' "$NAME" "$HEAD_SHA" >&2 ;;
    in_progress) printf '⊝ CI in progress — %s @ %s (use --wait to poll)\n' "$NAME" "$HEAD_SHA" >&2 ;;
    failure) printf '✗ CI FAILED — %s @ %s\n  → `gh run view --log-failed` for details\n' "$NAME" "$HEAD_SHA" >&2 ;;
    *) printf '? CI status %s — %s @ %s\n' "$CONCLUSION" "$NAME" "$HEAD_SHA" >&2 ;;
  esac
fi

if [ "$JSON" = "1" ]; then
  META_TS=$(emit_iso_ts)
  META_GIT_SHA=$(emit_git_sha "$SKILLS_ROOT")
  META_BLOCK=$(emit_meta_block "$SKILLS_ROOT" "$META_TS" "$META_GIT_SHA" "default")
  printf '{%s,"ci":{"conclusion":"%s","head_sha":"%s","name":"%s","exit":%d}}\n' \
    "$META_BLOCK" \
    "$(json_escape "$CONCLUSION")" \
    "$(json_escape "$HEAD_SHA")" \
    "$(json_escape "$NAME")" \
    "$EXIT"
fi

exit "$EXIT"
