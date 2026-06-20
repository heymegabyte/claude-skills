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

# Jun-2026 extension: gate the AUTHORITATIVE agent count too. CLAUDE.md § Routing
# claims "Agents N"; it drifted (18 vs actual 20) when media-orchestrator +
# motion-choreographer were added, and no gate caught it. Assert it matches the
# real agents/*.md count so adding/removing an agent without updating CLAUDE.md fails.
AGENTS_ACTUAL=$(find agents -maxdepth 1 -name '*.md' | wc -l | tr -d ' ')
AGENTS_CLAIMED=$(grep -oE 'Agents [0-9]+' CLAUDE.md | grep -oE '[0-9]+' | head -1)

# Jun-2026 extension #2: the website-completeness-checklist title claims "(N — none
# optional)" and lists N numbered items. It drifted (title said 50 after expanding to 62
# items) — the 3rd instance of the stated-count-vs-actual-count drift class this arc.
# Assert the title number == the actual numbered-item count so expanding the checklist
# without updating the title (+ its manifest/doctrine references) fails.
CHK=rules/website-completeness-checklist.md
CHK_CLAIMED=$(grep -oE 'Checklist \([0-9]+' "$CHK" | grep -oE '[0-9]+' | head -1)
CHK_ACTUAL=$(grep -cE '^[0-9]+\. ' "$CHK")

EXIT=0
[ "$EXPECTED" != "$ACTUAL" ] && EXIT=1
[ "$AGENTS_CLAIMED" != "$AGENTS_ACTUAL" ] && EXIT=1
[ "$CHK_CLAIMED" != "$CHK_ACTUAL" ] && EXIT=1
# Check secondary instances too
if [ -n "$SECONDARY_HITS" ]; then
  while IFS= read -r n; do
    [ -z "$n" ] && continue
    [ "$n" != "$ACTUAL" ] && EXIT=1
  done <<<"$SECONDARY_HITS"
fi

if [ "$JSON" = "0" ]; then
  if [ "$EXIT" = "0" ]; then
    printf '✓ doc counts match — README %d · agents CLAUDE.md %s/actual %d · completeness-checklist %s/%d\n' "$EXPECTED" "$AGENTS_CLAIMED" "$AGENTS_ACTUAL" "$CHK_CLAIMED" "$CHK_ACTUAL" >&2
  else
    [ "$EXPECTED" != "$ACTUAL" ] && printf '✗ doc count mismatch — README says %d, actual %d\n' "$EXPECTED" "$ACTUAL" >&2
    [ "$AGENTS_CLAIMED" != "$AGENTS_ACTUAL" ] && printf '✗ agent count mismatch — CLAUDE.md says %s, actual agents/*.md %d\n  → fix CLAUDE.md "Agents %s" → "Agents %d" (+ the named list)\n' "$AGENTS_CLAIMED" "$AGENTS_ACTUAL" "$AGENTS_CLAIMED" "$AGENTS_ACTUAL" >&2
    [ "$CHK_CLAIMED" != "$CHK_ACTUAL" ] && printf '✗ completeness-checklist count mismatch — title says %s, actual numbered items %d\n  → fix the title "(%s — none optional)" → "(%d — ...)" + its manifest/doctrine "N-point" references\n' "$CHK_CLAIMED" "$CHK_ACTUAL" "$CHK_CLAIMED" "$CHK_ACTUAL" >&2
    [ "$EXPECTED" != "$ACTUAL" ] && printf '  → fix README.md "%d reference docs" → "%d reference docs"\n' "$EXPECTED" "$ACTUAL" >&2
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
  printf '{%s,"counts":{"expected":%d,"actual":%d,"agentsClaimed":%s,"agentsActual":%d,"match":%s,"exit":%d}}\n' \
    "$META_BLOCK" "$EXPECTED" "$ACTUAL" "${AGENTS_CLAIMED:-0}" "$AGENTS_ACTUAL" "$([ "$EXIT" = "0" ] && echo true || echo false)" "$EXIT"
fi

exit "$EXIT"
