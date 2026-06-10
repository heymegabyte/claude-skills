#!/usr/bin/env bash
# check-deprecated-models.sh — flag references to retired AI model identifiers
# anywhere in the docs surface. Driven by an inline denylist of known-retired
# names with their deprecation dates + canonical replacements.
#
# Caught pass-71's GPT-4o + DALL-E corpus-wide drift (24 references across
# 14 files). Future deprecations (next OpenAI / Anthropic / Google retirement)
# get one new denylist entry; the audit surface stays current.
#
# Usage:
#   bash ~/.agentskills/bin/check-deprecated-models.sh [--json]
#
# --json: uniform envelope per rules/uniform-json-output.md (10th caller of
#         bin/lib/emit-json.sh).
#
# Exit 0 if 0 hits; exit 1 if any deprecated identifier appears in docs.

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

# Denylist: pattern | deprecation_date | replacement_note
# Pattern is grep -E. Keep replacements semantic (don't pin specific new names).
DENYLIST=(
  "GPT-4o|2026-02-13|current OpenAI multimodal flagship (Responses API)"
  "DALL-E|2026-05-12|GPT Image 1.5"
  "DALL·E|2026-05-12|GPT Image 1.5"
  "dall-e-2\b|2026-05-12|gpt-image-2"
  "dall-e-3\b|2026-05-12|gpt-image-1.5"
  "claude-3-opus|2025-01-15|claude-opus-4-8"
  "claude-3-haiku|2025-01-15|claude-haiku-4-5"
  "claude-haiku-3-5|2025-09-30|claude-haiku-4-5"
)

TOTAL_HITS=0
ENTRIES_JSON=()

[ "$JSON" = "0" ] && printf '▸ Scanning docs surface for retired AI model identifiers...\n' >&2

for entry in "${DENYLIST[@]}"; do
  pattern="${entry%%|*}"
  rest="${entry#*|}"
  dep_date="${rest%%|*}"
  replacement="${rest#*|}"

  # Search in docs surface only (skip CHANGELOG since it documents fixes themselves).
  # Also skip lines that explicitly document retirement / deprecation / removal —
  # those are intentional historical references, not recommendations.
  mapfile -t hits < <(
    grep -rnE "$pattern" \
      rules/*.md \
      [0-9][0-9]-*/*.md \
      agents/*.md \
      CONVENTIONS.md \
      SKILL_PROFILES.md \
      README.md \
      scripts/*.sh \
      2>/dev/null \
      | grep -viE 'retired|deprecat|removed.*api|sunset|replaced.*by|legacy|formerly|previous(ly)?|migrat(e|ed|ion)' \
      | grep -viE '(Midjourney|Ideogram|Stable Diffusion|Sora|FLUX)' \
      | grep -viE '(substring substitution|sed pattern|`s/[A-Za-z][^`]*/[^`]*/g`|codified-pattern|historical|learned the hard way|chapel candles|read as fabrication)' \
      | grep -v ':# ' \
      | grep -vE ':[0-9]+:- `[^ `]+`$' \
      || true
  )

  count=${#hits[@]}
  TOTAL_HITS=$((TOTAL_HITS + count))

  if [ "$count" -gt 0 ]; then
    [ "$JSON" = "0" ] && printf '  ✗ %-20s (retired %s) — %d hits → replace with: %s\n' \
      "$pattern" "$dep_date" "$count" "$replacement" >&2
    for h in "${hits[@]}"; do
      loc="${h%%:*}"
      rest_h="${h#*:}"
      line_no="${rest_h%%:*}"
      [ "$JSON" = "0" ] && printf '      %s:%s\n' "$loc" "$line_no" >&2
      ENTRIES_JSON+=("$(printf '{"pattern":"%s","location":"%s:%s","deprecation_date":"%s","replacement":"%s"}' \
        "$(json_escape "$pattern")" \
        "$(json_escape "$loc")" \
        "$line_no" \
        "$(json_escape "$dep_date")" \
        "$(json_escape "$replacement")")")
    done
  else
    [ "$JSON" = "0" ] && printf '  ✓ %-20s (retired %s) — 0 hits\n' "$pattern" "$dep_date" >&2
  fi
done

EXIT=0
[ "$TOTAL_HITS" -gt 0 ] && EXIT=1

if [ "$JSON" = "0" ]; then
  printf '\n━━━ SUMMARY: %d total hits across %d denylist entries\n' "$TOTAL_HITS" "${#DENYLIST[@]}" >&2
  if [ "$EXIT" = "1" ]; then
    printf '✗ deprecated model identifiers found — migrate per replacements above\n' >&2
  else
    printf '✓ no deprecated model identifiers in docs surface\n' >&2
  fi
fi

if [ "$JSON" = "1" ]; then
  META_TS=$(emit_iso_ts)
  META_GIT_SHA=$(emit_git_sha "$SKILLS_ROOT")
  META_BLOCK=$(emit_meta_block "$SKILLS_ROOT" "$META_TS" "$META_GIT_SHA" "default")
  printf '{%s,"hits":[' "$META_BLOCK"
  for i in "${!ENTRIES_JSON[@]}"; do
    [ "$i" -gt 0 ] && printf ','
    printf '%s' "${ENTRIES_JSON[$i]}"
  done
  printf '],"summary":{"total_hits":%d,"denylist_entries":%d,"exit":%d}}\n' \
    "$TOTAL_HITS" "${#DENYLIST[@]}" "$EXIT"
fi

exit "$EXIT"
