#!/usr/bin/env bash
# check-pricing.sh — detect stale or unannotated pricing references in the docs.
# Per pass-58→61 manual-audit pattern. Mechanizes the pricing-staleness check
# that caught 5 latent bugs (Opus pricing direction, $15/$75 vs $5/$25,
# Haiku 3.5 → 4.5, Workers CPU-ms 625× off, D1 included-tier missing).
#
# A pricing reference is any line matching $N/MTok, $N/GB-month, or
# $N.NN/M variants. Each must have a "verified YYYY-MM-DD" annotation
# within N (default 3) lines for the audit to consider it CURRENT.
#
# Usage:
#   bash ~/.agentskills/bin/check-pricing.sh [--json] [--max-age-days N]
#
# --json: uniform envelope per rules/uniform-json-output.md (6th caller of
#         bin/lib/emit-json.sh).
# --max-age-days: default 90. References older than this are flagged "stale".

set -uo pipefail

JSON=0
MAX_AGE_DAYS=90
for arg in "$@"; do
  case "$arg" in
    --json) JSON=1 ;;
    --max-age-days=*) MAX_AGE_DAYS="${arg#--max-age-days=}" ;;
  esac
done

SKILLS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SKILLS_ROOT" || exit 1

# shellcheck source=lib/emit-json.sh
. "$SKILLS_ROOT/bin/lib/emit-json.sh"

CURRENT=0
STALE=0
UNANNOTATED=0
REFS=()
STATUSES=()
AGES=()
LOCATIONS=()

TODAY_EPOCH=$(date -u +%s)

[ "$JSON" = "0" ] && printf '▸ Scanning pricing references (max age=%d days)...\n' "$MAX_AGE_DAYS" >&2

# Find every pricing-like reference in the docs surface.
# Pass-101: scripts/*.sh + bin/check-pricing.sh added per the scope-completeness
# discipline (rules/lint-doctrine.md § Codified incidents row 12, pass-100).
# Note: bin/check-pricing.sh self-scans intentionally to validate its own regex.
mapfile -t HITS < <(
  grep -rnE '\$[0-9]+(\.[0-9]+)?(/MTok|/GB-month|/M (requests|extra requests|rows-read|rows-written|reads|writes|CPU-ms))' \
    rules/*.md \
    [0-9][0-9]-*/*.md \
    CONVENTIONS.md \
    SKILL_PROFILES.md \
    README.md \
    agents/*.md \
    scripts/*.sh \
    2>/dev/null
)

for hit in "${HITS[@]}"; do
  # Parse `<file>:<line>:<content>`
  file="${hit%%:*}"
  rest="${hit#*:}"
  line_no="${rest%%:*}"
  content="${rest#*:}"
  loc="${file}:${line_no}"

  # Check for a "verified YYYY-MM-DD" annotation within ±3 lines.
  start=$((line_no > 3 ? line_no - 3 : 1))
  end=$((line_no + 3))
  ctx=$(awk -v s="$start" -v e="$end" 'NR>=s && NR<=e' "$file" 2>/dev/null)
  annot=$(printf '%s\n' "$ctx" | grep -oiE 'verified [0-9]{4}-[0-9]{2}-[0-9]{2}' | head -1)

  REFS+=("${content:0:80}")
  LOCATIONS+=("$loc")

  if [ -z "$annot" ]; then
    UNANNOTATED=$((UNANNOTATED + 1))
    STATUSES+=("unannotated")
    AGES+=("-1")
    [ "$JSON" = "0" ] && printf '  ⊝ no-annot  %s\n' "$loc" >&2
  else
    # Strip "verified " or "Verified " prefix (case-insensitive matched above).
    annot_date="${annot##* }"
    annot_epoch=$(date -j -u -f "%Y-%m-%d" "$annot_date" "+%s" 2>/dev/null || date -u -d "$annot_date" "+%s" 2>/dev/null || echo 0)
    age_days=$(((TODAY_EPOCH - annot_epoch) / 86400))
    AGES+=("$age_days")
    if [ "$age_days" -le "$MAX_AGE_DAYS" ]; then
      CURRENT=$((CURRENT + 1))
      STATUSES+=("current")
      [ "$JSON" = "0" ] && printf '  ✓ %dd      %s\n' "$age_days" "$loc" >&2
    else
      STALE=$((STALE + 1))
      STATUSES+=("stale")
      [ "$JSON" = "0" ] && printf '  ✗ %dd      %s (re-verify)\n' "$age_days" "$loc" >&2
    fi
  fi
done

TOTAL=${#REFS[@]}
EXIT=0
[ "$STALE" -gt 0 ] && EXIT=1

if [ "$JSON" = "0" ]; then
  printf '\n━━━ SUMMARY: %d total · %d current · %d stale · %d unannotated\n' \
    "$TOTAL" "$CURRENT" "$STALE" "$UNANNOTATED" >&2
  if [ "$STALE" -gt 0 ]; then
    printf '✗ %d pricing reference(s) older than %d days — re-verify per pass-61 doctrine\n' "$STALE" "$MAX_AGE_DAYS" >&2
  elif [ "$UNANNOTATED" -gt 0 ]; then
    printf '⊝ %d pricing reference(s) lack "verified YYYY-MM-DD" annotation — add one within ±3 lines\n' "$UNANNOTATED" >&2
  else
    printf '✓ all pricing references current\n' >&2
  fi
fi

if [ "$JSON" = "1" ]; then
  META_TS=$(emit_iso_ts)
  META_GIT_SHA=$(emit_git_sha "$SKILLS_ROOT")
  META_BLOCK=$(emit_meta_block "$SKILLS_ROOT" "$META_TS" "$META_GIT_SHA" "default")
  printf '{%s,"refs":[' "$META_BLOCK"
  for i in "${!REFS[@]}"; do
    [ "$i" -gt 0 ] && printf ','
    printf '{"location":"%s","status":"%s","age_days":%d,"content":"%s"}' \
      "$(json_escape "${LOCATIONS[$i]}")" \
      "$(json_escape "${STATUSES[$i]}")" \
      "${AGES[$i]}" \
      "$(json_escape "${REFS[$i]}")"
  done
  printf '],"summary":{"total":%d,"current":%d,"stale":%d,"unannotated":%d,"max_age_days":%d,"exit":%d}}\n' \
    "$TOTAL" "$CURRENT" "$STALE" "$UNANNOTATED" "$MAX_AGE_DAYS" "$EXIT"
fi

exit "$EXIT"
