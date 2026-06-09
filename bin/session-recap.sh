#!/usr/bin/env bash
# session-recap.sh — summarize recent CHANGELOG.md entries for context restoration.
#
# Usage:
#   bash ~/.agentskills/bin/session-recap.sh [date-or-count]
#
# Examples:
#   session-recap.sh           # last 10 entries
#   session-recap.sh 20        # last 20 entries
#   session-recap.sh 2026-06   # all entries from June 2026
#   session-recap.sh today     # only today's entries (UTC date)
#
# Reads CHANGELOG.md (auto-detects in cwd or via $CHANGELOG env), parses entries
# delimited by `## <date> — <pass-id> — <summary>` headings, returns matching set.

set -euo pipefail

CHANGELOG="${CHANGELOG:-CHANGELOG.md}"
[ -f "$CHANGELOG" ] || {
  echo "ERROR: $CHANGELOG not found (set CHANGELOG env or cd into repo root)" >&2
  exit 1
}

FILTER="${1:-10}"

# --- Helpers ---------------------------------------------------------------
emdashSection() { printf "\n▸ %s\n" "$1" >&2; }

# --- Parse entries ---------------------------------------------------------
# Each entry starts with `## YYYY-MM-DD — <pass-id> — <summary>`.
# We capture the heading + the first 5 body lines for a tight summary.

awk -v filter="$FILTER" -v today_match="$(date -u +%Y-%m-%d)" '
  BEGIN { entry_count = 0; printing = 0; lines_printed = 0 }
  /^## [0-9]{4}-[0-9]{2}-[0-9]{2} —/ {
    # Save heading + reset
    heading = $0
    date = $2  # YYYY-MM-DD
    body = ""
    printing = 0
    lines_printed = 0
    # Match filter
    match_count_mode = match(filter, /^[0-9]+$/) > 0
    match_today_mode = (filter == "today")
    match_date_prefix = (substr(date, 1, length(filter)) == filter)

    if (match_today_mode && date == today_match) {
      printing = 1
    } else if (!match_today_mode && !match_count_mode && match_date_prefix) {
      printing = 1
    } else if (match_count_mode && entry_count < filter+0) {
      printing = 1
    }

    if (printing) {
      printf "\n━━━ %s\n", heading
      entry_count++
    }
    next
  }
  printing && lines_printed < 5 && /^[a-zA-Z*#-]/ {
    print "  " $0
    lines_printed++
  }
  END { printf "\n  total: %d entr%s\n", entry_count, (entry_count == 1 ? "y" : "ies") }
' "$CHANGELOG"
