#!/usr/bin/env bash
# check-agent-routing.sh — verify rules/model-routing.md § Agent routing matches
# agents/*.md frontmatter reality. Catches the pass-64-class drift where the
# rule's tier list omits or mis-attributes an agent vs the actual agent file.
#
# Usage:
#   bash ~/.agentskills/bin/check-agent-routing.sh [--json]
#
# --json: uniform envelope per rules/uniform-json-output.md (7th caller of
#         bin/lib/emit-json.sh).
#
# Exit 0 if rule + agents agree across all 3 tiers (Opus/Sonnet/Haiku).
# Exit 1 if any drift (missing-from-rule or missing-from-agents).

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

# Authoritative map: agent → tier from agents/*.md frontmatter.
declare -A AUTHORITATIVE
for f in agents/*.md; do
  name=$(basename "$f" .md)
  tier=$(awk -F': ' '/^model: / { print $2; exit }' "$f" | tr -d '"')
  [ -n "$tier" ] && AUTHORITATIVE["$name"]="$tier"
done

# Claimed lists from rules/model-routing.md § Agent routing.
extract_claimed() {
  local tier="$1"
  awk -v tier="$tier" '
    /^## Agent routing/ { in_section = 1; next }
    in_section && /^## / && !/Agent routing/ { in_section = 0 }
    in_section && $0 ~ "\\*\\*" tier "\\*\\*" {
      # Strip everything up to the dash, then split by comma + clean parenthetical
      sub(/.*\*\* — /, "")
      sub(/ \(.*$/, "")
      gsub(/, /, "\n")
      print
    }
  ' rules/model-routing.md
}

CLAIMED_OPUS=$(extract_claimed "Opus")
CLAIMED_SONNET=$(extract_claimed "Sonnet")
CLAIMED_HAIKU=$(extract_claimed "Haiku")

PASS=0
FAIL=0
DRIFT_ENTRIES=()

check_tier() {
  local tier_name="$1"
  local tier_lc="$2"
  local claimed="$3"

  # Authoritative set for this tier
  local auth_set=""
  for name in "${!AUTHORITATIVE[@]}"; do
    [ "${AUTHORITATIVE[$name]}" = "$tier_lc" ] && auth_set+="$name"$'\n'
  done
  auth_set=$(echo "$auth_set" | sed '/^$/d' | sort -u)
  local claimed_sorted
  claimed_sorted=$(echo "$claimed" | sed '/^$/d' | sort -u)

  # Diff
  local missing_from_rule
  missing_from_rule=$(comm -23 <(echo "$auth_set") <(echo "$claimed_sorted"))
  local missing_from_agents
  missing_from_agents=$(comm -13 <(echo "$auth_set") <(echo "$claimed_sorted"))

  if [ -z "$missing_from_rule" ] && [ -z "$missing_from_agents" ]; then
    PASS=$((PASS + 1))
    [ "$JSON" = "0" ] && printf '  ✓ %s tier — rule + agents in sync (%d agents)\n' "$tier_name" "$(echo "$auth_set" | wc -l | tr -d ' ')" >&2
  else
    FAIL=$((FAIL + 1))
    [ "$JSON" = "0" ] && printf '  ✗ %s tier — drift detected\n' "$tier_name" >&2
    if [ -n "$missing_from_rule" ]; then
      while IFS= read -r name; do
        [ -z "$name" ] && continue
        DRIFT_ENTRIES+=("$(printf '{"tier":"%s","agent":"%s","kind":"missing_from_rule"}' "$tier_name" "$(json_escape "$name")")")
        [ "$JSON" = "0" ] && printf '      missing from rule: %s\n' "$name" >&2
      done <<<"$missing_from_rule"
    fi
    if [ -n "$missing_from_agents" ]; then
      while IFS= read -r name; do
        [ -z "$name" ] && continue
        DRIFT_ENTRIES+=("$(printf '{"tier":"%s","agent":"%s","kind":"missing_from_agents"}' "$tier_name" "$(json_escape "$name")")")
        [ "$JSON" = "0" ] && printf '      claimed in rule but no model: %s agent file: %s\n' "$tier_lc" "$name" >&2
      done <<<"$missing_from_agents"
    fi
  fi
}

[ "$JSON" = "0" ] && printf '▸ Checking rules/model-routing.md § Agent routing vs agents/*.md frontmatter...\n' >&2

check_tier "Opus" "opus" "$CLAIMED_OPUS"
check_tier "Sonnet" "sonnet" "$CLAIMED_SONNET"
check_tier "Haiku" "haiku" "$CLAIMED_HAIKU"

EXIT=0
[ "$FAIL" -gt 0 ] && EXIT=1

if [ "$JSON" = "0" ]; then
  printf '\n━━━ SUMMARY: %d tier(s) clean · %d tier(s) drifted\n' "$PASS" "$FAIL" >&2
  [ "$EXIT" = "1" ] && printf '✗ agent-routing drift detected — fix rules/model-routing.md § Agent routing\n' >&2 || printf '✓ all 3 tiers in sync\n' >&2
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
  printf '],"summary":{"clean":%d,"drifted":%d,"exit":%d}}\n' "$PASS" "$FAIL" "$EXIT"
fi

exit "$EXIT"
