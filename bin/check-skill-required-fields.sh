#!/usr/bin/env bash
# check-skill-required-fields.sh — verify every [0-9][0-9]-*/SKILL.md has the
# 4 required frontmatter fields: name, description, priority, pack.
#
# Catches the "added a new skill dir but forgot required metadata" class.
# Without these, the skill router can't classify the skill correctly.
#
# Per rules/audit-arc-maturity-ladder.md — this is steps 1+2 of the ladder
# (Detect + Surface). Promote to hard gate after ≥90 days OR ≥15 passes stable.
#
# Usage:
#   bash ~/.agentskills/bin/check-skill-required-fields.sh [--json]
#
# --json: uniform envelope per rules/uniform-json-output.md (11th caller of
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

REQUIRED=(name description priority pack)
PASS=0
FAIL=0
DRIFT_ENTRIES=()

[ "$JSON" = "0" ] && printf '▸ Checking SKILL.md required fields: %s\n' "${REQUIRED[*]}" >&2

for f in [0-9][0-9]-*/SKILL.md; do
  skill=$(basename "$(dirname "$f")")
  # Extract frontmatter only (between first two `---` lines)
  frontmatter=$(awk '/^---$/{c++; if(c==2) exit} c==1' "$f")
  missing=""
  for field in "${REQUIRED[@]}"; do
    if ! printf '%s' "$frontmatter" | grep -qE "^${field}:"; then
      missing+="${field} "
    fi
  done

  if [ -z "$missing" ]; then
    PASS=$((PASS + 1))
    [ "$JSON" = "0" ] && printf '  ✓ %s\n' "$skill" >&2
  else
    FAIL=$((FAIL + 1))
    missing="${missing% }"
    DRIFT_ENTRIES+=("$(printf '{"skill":"%s","missing":"%s"}' "$(json_escape "$skill")" "$(json_escape "$missing")")")
    [ "$JSON" = "0" ] && printf '  ✗ %s — missing: %s\n' "$skill" "$missing" >&2
  fi
done

EXIT=0
[ "$FAIL" -gt 0 ] && EXIT=1

if [ "$JSON" = "0" ]; then
  printf '\n━━━ SUMMARY: %d compliant · %d non-compliant\n' "$PASS" "$FAIL" >&2
  if [ "$EXIT" = "1" ]; then
    printf '✗ SKILL.md files missing required frontmatter — add per the survey above\n' >&2
  else
    printf '✓ all SKILL.md files declare name + description + priority + pack\n' >&2
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
