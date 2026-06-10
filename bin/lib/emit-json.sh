#!/usr/bin/env bash
# emit-json.sh — shared JSON-emission helpers for the uniform-json-output doctrine.
# Per rules/uniform-json-output.md.
#
# Sourceable library — never executed directly.
# Each helper prints to stdout (the JSON destination per the doctrine).

# json_escape <string>
#   Echo a JSON-escaped version of the input. Handles backslash, double-quote,
#   newline, carriage return, and tab — the 5 mandatory JSON string escapes
#   per RFC 8259 § 7. Pass-98 hardening: previously only escaped \ and ".
json_escape() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="${s//$'\n'/\\n}"
  s="${s//$'\r'/\\r}"
  s="${s//$'\t'/\\t}"
  printf '%s' "$s"
}

# emit_iso_ts
#   Print current ISO 8601 UTC timestamp.
emit_iso_ts() {
  date -u +%Y-%m-%dT%H:%M:%SZ
}

# emit_git_sha [project-dir]
#   Print short git SHA of HEAD in <project-dir> (default $PWD), or "unknown".
emit_git_sha() {
  local project="${1:-$PWD}"
  git -C "$project" rev-parse --short HEAD 2>/dev/null || echo "unknown"
}

# emit_meta_block <repo> <generated_at> <git_sha> [filter]
#   Print the canonical `meta` object opening (no enclosing `{...}`).
#   Caller wraps with `{...}` and appends payload.
emit_meta_block() {
  local repo
  local ts
  local sha
  local filter
  repo=$(json_escape "$1")
  ts=$(json_escape "$2")
  sha=$(json_escape "$3")
  filter=$(json_escape "${4:-}")
  if [ -n "$filter" ]; then
    printf '"meta":{"repo":"%s","generated_at":"%s","git_sha":"%s","filter":"%s"}' \
      "$repo" "$ts" "$sha" "$filter"
  else
    printf '"meta":{"repo":"%s","generated_at":"%s","git_sha":"%s"}' \
      "$repo" "$ts" "$sha"
  fi
}

# emit_kv_string <key> <value>
#   Print `"key":"<json-escaped value>"` (no leading/trailing comma).
emit_kv_string() {
  local key
  local val
  key=$(json_escape "$1")
  val=$(json_escape "$2")
  printf '"%s":"%s"' "$key" "$val"
}

# emit_kv_int <key> <value>
#   Print `"key":<int-or-0>` (no quotes around value).
emit_kv_int() {
  local key
  local val
  key=$(json_escape "$1")
  val="${2:-0}"
  printf '"%s":%d' "$key" "$val"
}
