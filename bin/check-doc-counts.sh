#!/usr/bin/env bash
# check-doc-counts.sh — verify README.md's "N reference docs" claim matches
# the actual count of `*.md` files in `[0-9][0-9]-*/` (excluding SKILL.md).
#
# Local mirror of publish.yml's "Check doc counts" step. Pass-89 discovered
# this step had been failing for 23+ passes because no local gate replicated
# it. Pass-91 closes that gap.
#
# Per rules/audit-arc-maturity-ladder.md — Detect + Surface + (immediate)
# Promote per the codified discipline that CI gates needing local-mirror
# graduate fast.
#
# Usage:
#   bash ~/.agentskills/bin/check-doc-counts.sh [--json]
#
# --json: uniform envelope per rules/uniform-json-output.md (15th caller of
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

EXPECTED=$(grep -o '[0-9]* reference docs' README.md | grep -o '[0-9]*' | head -1)
ACTUAL=0
for dir in [0-9][0-9]-*/; do
  COUNT=$(find "$dir" -maxdepth 1 -name '*.md' ! -name 'SKILL.md' | wc -l | tr -d ' ')
  ACTUAL=$((ACTUAL + COUNT))
done

# Pass-97 extension: also check for "full N docs" phrasing that pass-95 found
# at README:315 (escaped the original line-21-only pattern from pass-91).
SECONDARY_HITS=$(grep -oE 'full ([0-9]+) docs' README.md | grep -oE '[0-9]+' || true)

EXIT=0
[ "$EXPECTED" != "$ACTUAL" ] && EXIT=1
# Check secondary instances too
if [ -n "$SECONDARY_HITS" ]; then
  while IFS= read -r n; do
    [ -z "$n" ] && continue
    [ "$n" != "$ACTUAL" ] && EXIT=1
  done <<<"$SECONDARY_HITS"
fi

if [ "$JSON" = "0" ]; then
  if [ "$EXIT" = "0" ]; then
    printf '✓ doc counts match — README says %d, actual %d (incl. secondary "full N docs" phrasings)\n' "$EXPECTED" "$ACTUAL" >&2
  else
    printf '✗ doc count mismatch — README says %d, actual %d\n' "$EXPECTED" "$ACTUAL" >&2
    printf '  → fix README.md "%d reference docs" → "%d reference docs"\n' "$EXPECTED" "$ACTUAL" >&2
    if [ -n "$SECONDARY_HITS" ]; then
      while IFS= read -r n; do
        [ -z "$n" ] && continue
        [ "$n" != "$ACTUAL" ] && printf '  → also fix README.md "full %d docs" → "full %d docs"\n' "$n" "$ACTUAL" >&2
      done <<<"$SECONDARY_HITS"
    fi
  fi
fi

if [ "$JSON" = "1" ]; then
  META_TS=$(emit_iso_ts)
  META_GIT_SHA=$(emit_git_sha "$SKILLS_ROOT")
  META_BLOCK=$(emit_meta_block "$SKILLS_ROOT" "$META_TS" "$META_GIT_SHA" "default")
  printf '{%s,"counts":{"expected":%d,"actual":%d,"match":%s,"exit":%d}}\n' \
    "$META_BLOCK" "$EXPECTED" "$ACTUAL" "$([ "$EXIT" = "0" ] && echo true || echo false)" "$EXIT"
fi

exit "$EXIT"
