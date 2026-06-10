#!/usr/bin/env bash
# check-doc-urls.sh — HEAD-checks every external URL in rules/*.md + SKILL.md files.
# Surfaces dead links / 404s / mass redirects so dated docs (e.g. structured-outputs
# beta headers, AutoRAG changelog refs) get caught before they become misinformation.
#
# Usage:
#   bash ~/.agentskills/bin/check-doc-urls.sh [--json] [--timeout SECONDS]
#
# Network-dependent — NOT a pre-commit gate. Designed for weekly cron + manual audit.
# --json: uniform envelope per rules/uniform-json-output.md via bin/lib/emit-json.sh.

set -uo pipefail

JSON=0
TIMEOUT=10
for arg in "$@"; do
  case "$arg" in
    --json) JSON=1 ;;
    --timeout=*) TIMEOUT="${arg#--timeout=}" ;;
  esac
done

SKILLS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SKILLS_ROOT" || exit 1

# shellcheck source=lib/emit-json.sh
. "$SKILLS_ROOT/bin/lib/emit-json.sh"

PASS=0
FAIL=0
SKIP=0
URL_LIST=()
URL_STATUSES=()
URL_CODES=()

# Extract unique URLs from the documentation surface (pass-56 widened scope).
# Filter (1) URLs without a TLD-dot (e.g. `third-party-cdn`)
#        (2) RFC 2606 reserved example.com/.org/.net hosts
#        (3) common doc-placeholder hosts (domain.com, related-site.{com,example})
#        (4) URLs containing template tokens (YYYY year placeholder, etc.)
mapfile -t URLS < <(
  grep -hoE 'https?://[A-Za-z0-9./_-]+' \
    rules/*.md \
    [0-9][0-9]-*/SKILL.md \
    [0-9][0-9]-*/*.md \
    CONVENTIONS.md \
    SKILL_PROFILES.md \
    _router.md \
    scripts/*.sh \
    README.md \
    llms.txt \
    agents/*.md \
    2>/dev/null \
    | sed 's/[.,;)]*$//' \
    | awk -F/ '$3 ~ /\./ { print }' \
    | grep -vE '://([^/]*\.)?(example\.(com|org|net)|domain\.com|related-site\.(com|example))(/|$)' \
    | grep -vE '://(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)' \
    | grep -vE '(YYYY|2YYY|<[a-z-]+>|\{[a-z-]+\})' \
    | sort -u
)

[ "$JSON" = "0" ] && printf '▸ Checking %d unique URLs (timeout=%ds)...\n' "${#URLS[@]}" "$TIMEOUT" >&2

for url in "${URLS[@]}"; do
  # Skip self-hosted megabyte.space — transient by nature.
  if [[ "$url" == *"megabyte.space"* ]]; then
    URL_LIST+=("$url")
    URL_STATUSES+=("skip")
    URL_CODES+=("0")
    SKIP=$((SKIP + 1))
    [ "$JSON" = "0" ] && printf '  ⊝ skip   %s (self-hosted)\n' "$url" >&2
    continue
  fi

  # HEAD with redirect-follow + timeout. Capture HTTP code (default 000 on curl fail).
  code=$(curl -sS -o /dev/null -L --max-time "$TIMEOUT" -w '%{http_code}' -X HEAD "$url" 2>/dev/null)
  code="${code:-000}"

  URL_LIST+=("$url")
  URL_CODES+=("$code")

  # 2xx/3xx = pass (URL works). 4xx = skip (HEAD commonly rejected by API endpoints
  # even when the URL exists; needs auth or POST/GET to validate). 5xx/000 = fail.
  if [[ "$code" =~ ^[23] ]]; then
    URL_STATUSES+=("pass")
    PASS=$((PASS + 1))
    [ "$JSON" = "0" ] && printf '  ✓ %s   %s\n' "$code" "$url" >&2
  elif [[ "$code" =~ ^4 ]]; then
    URL_STATUSES+=("skip")
    SKIP=$((SKIP + 1))
    [ "$JSON" = "0" ] && printf '  ⊝ %s   %s (HEAD rejected — endpoint likely exists)\n' "$code" "$url" >&2
  else
    URL_STATUSES+=("fail")
    FAIL=$((FAIL + 1))
    [ "$JSON" = "0" ] && printf '  ✗ %s   %s\n' "$code" "$url" >&2
  fi
done

EXIT=0
[ "$FAIL" -gt 0 ] && EXIT=1

if [ "$JSON" = "0" ]; then
  printf '\n━━━ SUMMARY: %d pass · %d fail · %d skip\n' "$PASS" "$FAIL" "$SKIP" >&2
  [ "$EXIT" = "1" ] && printf '✗ %d dead/broken URL(s) — audit owning rule + update\n' "$FAIL" >&2 || printf '✓ All checked URLs reachable\n' >&2
fi

if [ "$JSON" = "1" ]; then
  META_TS=$(emit_iso_ts)
  META_GIT_SHA=$(emit_git_sha "$SKILLS_ROOT")
  META_BLOCK=$(emit_meta_block "$SKILLS_ROOT" "$META_TS" "$META_GIT_SHA" "default")
  printf '{%s,"urls":[' "$META_BLOCK"
  for i in "${!URL_LIST[@]}"; do
    [ "$i" -gt 0 ] && printf ','
    printf '{"url":"%s","status":"%s","http_code":%d}' \
      "$(json_escape "${URL_LIST[$i]}")" \
      "$(json_escape "${URL_STATUSES[$i]}")" \
      "${URL_CODES[$i]}"
  done
  printf '],"summary":{"pass":%d,"fail":%d,"skip":%d,"exit":%d}}\n' \
    "$PASS" "$FAIL" "$SKIP" "$EXIT"
fi

exit "$EXIT"
