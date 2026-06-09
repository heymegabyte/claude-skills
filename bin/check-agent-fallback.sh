#!/usr/bin/env bash
# check-agent-fallback.sh — verify every `model: opus` agent declares the
# fallback fields required by rules/opus-quota-fallback.md § Agent frontmatter
# convention: model_fallback + effort + effort_fallback.
#
# Catches the "added a new Opus agent but forgot the fallback fields" class.
# When Opus quota exhausts, the main thread reads model_fallback/effort_fallback
# to keep work flowing. Missing fields → silent agent failure on quota miss.
#
# Usage:
#   bash ~/.agentskills/bin/check-agent-fallback.sh [--json]
#
# --json: uniform envelope per rules/uniform-json-output.md (9th caller of
#         bin/lib/emit-json.sh).

set -uo pipefail

JSON=0
for arg in "$@"; do
  case "$arg" in
    --json) JSON=1 ;;
  esac
done

SKILLS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SKILLS_ROOT" || exit 1

# shellcheck source=lib/emit-json.sh
. "$SKILLS_ROOT/bin/lib/emit-json.sh"

PASS=0
FAIL=0
DRIFT_ENTRIES=()

[ "$JSON" = "0" ] && printf '▸ Checking Opus agents for model_fallback + effort_fallback...\n' >&2

for f in agents/*.md; do
  # Parse frontmatter via awk to stop at the closing ---
  has_opus=$(awk '/^---$/{c++; if(c==2) exit} /^model: opus$/' "$f")
  [ -z "$has_opus" ] && continue

  name=$(basename "$f" .md)
  missing=""
  for field in model_fallback effort effort_fallback; do
    if ! awk '/^---$/{c++; if(c==2) exit} {print}' "$f" | grep -qE "^${field}:"; then
      missing+="${field} "
    fi
  done

  if [ -z "$missing" ]; then
    PASS=$((PASS + 1))
    [ "$JSON" = "0" ] && printf '  ✓ %s\n' "$name" >&2
  else
    FAIL=$((FAIL + 1))
    missing="${missing% }"
    DRIFT_ENTRIES+=("$(printf '{"agent":"%s","missing":"%s"}' "$(json_escape "$name")" "$(json_escape "$missing")")")
    [ "$JSON" = "0" ] && printf '  ✗ %s — missing: %s\n' "$name" "$missing" >&2
  fi
done

EXIT=0
[ "$FAIL" -gt 0 ] && EXIT=1

if [ "$JSON" = "0" ]; then
  printf '\n━━━ SUMMARY: %d compliant · %d non-compliant\n' "$PASS" "$FAIL" >&2
  if [ "$EXIT" = "1" ]; then
    printf '✗ Opus agents missing fallback fields per rules/opus-quota-fallback.md\n' >&2
  else
    printf '✓ all Opus agents declare model_fallback + effort + effort_fallback\n' >&2
  fi
fi

if [ "$JSON" = "1" ]; then
  META_TS=$(emit_iso_ts)
  META_GIT_SHA=$(emit_git_sha "$SKILLS_ROOT")
  META_BLOCK=$(emit_meta_block "$SKILLS_ROOT" "$META_TS" "$META_GIT_SHA" "default")
  printf '{%s,"drift":[' "$META_BLOCK"
  for i in "${!DRIFT_ENTRIES[@]}"; do
    [ "$i" -gt 0 ] && printf ','
    printf '%s' "${DRIFT_ENTRIES[$i]}"
  done
  printf '],"summary":{"compliant":%d,"non_compliant":%d,"exit":%d}}\n' "$PASS" "$FAIL" "$EXIT"
fi

exit "$EXIT"
