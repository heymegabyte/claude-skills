#!/usr/bin/env bash
# session-recap.sh — summarize recent CHANGELOG.md entries for context restoration.
#
# Usage:
#   bash ~/.agentskills/bin/session-recap.sh [filter] [--json]
#
# Filters:
#   <N>           last N entries (default 10)
#   YYYY-MM       all entries from a month (e.g. 2026-06)
#   YYYY-MM-DD    all entries from a specific date
#   today         today's entries only (UTC)
#
# --json: emit `{entries:[{date,pass_id,summary,body_preview}],total}` to stdout
# Human report goes to stderr in JSON mode.

set -euo pipefail

JSON=0
ARGS=()
for arg in "$@"; do
  case "$arg" in
    --json) JSON=1 ;;
    *) ARGS+=("$arg") ;;
  esac
done

CHANGELOG="${CHANGELOG:-CHANGELOG.md}"
[ -f "$CHANGELOG" ] || {
  echo "ERROR: $CHANGELOG not found (set CHANGELOG env or cd into repo root)" >&2
  exit 1
}

FILTER="${ARGS[0]:-10}"
TODAY_MATCH=$(date -u +%Y-%m-%d)

# --- Parse entries via awk ---------------------------------------------------
# Each entry starts with `## YYYY-MM-DD — <pass-id> — <summary>`.
awk -v filter="$FILTER" -v today_match="$TODAY_MATCH" -v json="$JSON" '
  BEGIN {
    entry_count = 0
    printing = 0
    lines_printed = 0
    if (json) printf "{\"entries\":["
  }
  /^## [0-9]{4}-[0-9]{2}-[0-9]{2} —/ {
    heading = $0
    date = $2
    # Close prior entry if open
    if (printing && json) printf "]}"
    printing = 0
    lines_printed = 0

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
      n = split(heading, parts, " — ")
      pass_id = (n >= 2) ? parts[2] : ""
      summary = ""
      for (i = 3; i <= n; i++) {
        summary = summary (i == 3 ? "" : " — ") parts[i]
      }
      if (json) {
        gsub(/\\/, "\\\\", summary); gsub(/"/, "\\\"", summary)
        gsub(/\\/, "\\\\", pass_id); gsub(/"/, "\\\"", pass_id)
        if (entry_count > 0) printf ","
        printf "{\"date\":\"%s\",\"pass_id\":\"%s\",\"summary\":\"%s\",\"body_preview\":[", date, pass_id, summary
      } else {
        printf "\n━━━ %s\n", heading
      }
      entry_count++
    }
    next
  }
  printing && lines_printed < 5 && /^[a-zA-Z*#-]/ {
    if (json) {
      line = $0
      gsub(/\\/, "\\\\", line); gsub(/"/, "\\\"", line)
      printf "%s\"%s\"", (lines_printed > 0 ? "," : ""), line
    } else {
      print "  " $0
    }
    lines_printed++
  }
  END {
    if (json) {
      if (printing) printf "]}"
      printf "],\"total\":%d}\n", entry_count
    } else {
      printf "\n  total: %d entr%s\n", entry_count, (entry_count == 1 ? "y" : "ies")
    }
  }
' "$CHANGELOG"
