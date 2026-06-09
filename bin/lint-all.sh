#!/usr/bin/env bash
# lint-all.sh — run every CI lint gate locally. Mirror of publish.yml § validate.
# Per rules/lint-doctrine.md + rules/uniform-json-output.md.
#
# Usage:
#   bash ~/.agentskills/bin/lint-all.sh [--json]
#
# Each gate runs sequentially; exit code = number of failed gates. With --json,
# emits {meta, gates:[{name,status,details}], summary:{pass,fail,skip,exit}}.
# Human report → stderr, JSON → stdout (per uniform-json-output § Rules).

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

PASS=0
FAIL=0
SKIP=0
GATE_NAMES=()
GATE_STATUSES=()
GATE_DETAILS=()

logHeader() {
  [ "$JSON" = "1" ] && return 0
  printf '\n━━━ %s\n' "$1" >&2
}

runGate() {
  local name="$1"
  local cmd_summary="$2"
  shift 2
  GATE_NAMES+=("$name")
  if "$@" >/tmp/lint-all-$$-out 2>&1; then
    PASS=$((PASS + 1))
    GATE_STATUSES+=("pass")
    GATE_DETAILS+=("$cmd_summary — clean")
    [ "$JSON" = "0" ] && printf '  ✓ %s\n' "$cmd_summary" >&2
  else
    FAIL=$((FAIL + 1))
    GATE_STATUSES+=("fail")
    local errsum
    errsum=$(head -5 /tmp/lint-all-$$-out 2>/dev/null | tr '\n' ' ' | head -c 200)
    GATE_DETAILS+=("$cmd_summary — $errsum")
    if [ "$JSON" = "0" ]; then
      printf '  ✗ %s\n' "$cmd_summary" >&2
      head -10 /tmp/lint-all-$$-out >&2
    fi
  fi
  rm -f /tmp/lint-all-$$-out
}

skipGate() {
  local name="$1"
  local reason="$2"
  GATE_NAMES+=("$name")
  GATE_STATUSES+=("skip")
  GATE_DETAILS+=("$reason")
  SKIP=$((SKIP + 1))
  [ "$JSON" = "0" ] && printf '  ⊝ %s — %s\n' "$name" "$reason" >&2
}

logHeader "1. validate-skills"
runGate "validate-skills" "bash scripts/validate-skills.sh" bash scripts/validate-skills.sh

logHeader "2. validate-packs"
runGate "validate-packs" "node scripts/validate-packs.mjs" node scripts/validate-packs.mjs

logHeader "3. sha-pin-check"
runGate "sha-pin-check" "scripts/sha-pin-actions.mjs --check" node scripts/sha-pin-actions.mjs --check .github/workflows/publish.yml .github/workflows/supply-chain-pr-comment.yml .github/workflows/version-drift-check.yml

logHeader "4. yamllint"
if command -v yamllint >/dev/null; then
  runGate "yamllint" "yamllint relaxed" \
    yamllint -d '{extends: relaxed, rules: {line-length: disable, document-start: disable, truthy: disable}}' \
    templates/lint-stack/lefthook.yml lefthook.yml .github/workflows/publish.yml .github/workflows/supply-chain-pr-comment.yml .github/workflows/version-drift-check.yml
else
  skipGate "yamllint" "not installed (pip install yamllint)"
fi

logHeader "5. markdownlint"
runGate "markdownlint" "markdownlint-cli2 **/*.md" \
  npx --yes markdownlint-cli2@^0.18.1 "**/*.md"

logHeader "6. prettier"
runGate "prettier" "prettier --check JSON/YAML" \
  npx --yes prettier@3 --config .prettierrc.json --check "**/*.{json,jsonc,yml,yaml}"

logHeader "7. shellcheck"
if command -v shellcheck >/dev/null; then
  runGate "shellcheck" "shellcheck bin/ scripts/" \
    shellcheck -x -S warning bin/lint-all.sh bin/lint-auto-improve.sh bin/security-supply-chain.sh bin/session-recap.sh bin/lib/emit-json.sh scripts/discover-secrets.sh scripts/gpt4o-vision-analyze.sh scripts/validate-skills.sh scripts/visual-tdd-loop.sh
else
  skipGate "shellcheck" "not installed (brew install shellcheck)"
fi

logHeader "8. shfmt"
if command -v shfmt >/dev/null; then
  runGate "shfmt" "shfmt -d -i 2 -ci -bn" \
    shfmt -i 2 -ci -bn -d bin/lint-all.sh bin/lint-auto-improve.sh bin/security-supply-chain.sh bin/session-recap.sh bin/lib/emit-json.sh scripts/discover-secrets.sh scripts/gpt4o-vision-analyze.sh scripts/validate-skills.sh scripts/visual-tdd-loop.sh
else
  skipGate "shfmt" "not installed (brew install shfmt OR go install mvdan.cc/sh/v3/cmd/shfmt@latest)"
fi

logHeader "9. actionlint"
if command -v actionlint >/dev/null; then
  runGate "actionlint" "actionlint workflows" \
    actionlint .github/workflows/publish.yml .github/workflows/supply-chain-pr-comment.yml .github/workflows/version-drift-check.yml .github/workflows/pricing-check.yml .github/workflows/doc-urls-check.yml
else
  skipGate "actionlint" "not installed (brew install actionlint OR go install github.com/rhysd/actionlint/cmd/actionlint@latest)"
fi

# Soft INFO gate (pass-63) — pricing-staleness report. Always succeeds at the
# lint-all level; output is informational. Stale references should be tracked
# via .github/workflows/pricing-check.yml's weekly cron, not block commits.
if [ "$JSON" = "0" ]; then
  logHeader "ℹ pricing-staleness (info-only, doesn't gate)"
  bash "$SKILLS_ROOT/bin/check-pricing.sh" 2>&1 | tail -8 >&2 || true
fi

EXIT=0
[ "$FAIL" -gt 0 ] && EXIT=1

if [ "$JSON" = "0" ]; then
  printf '\n━━━ SUMMARY: %d pass · %d fail · %d skip\n' "$PASS" "$FAIL" "$SKIP" >&2
  [ "$EXIT" = "1" ] && printf '✗ lint-all FAILED — fix above gates before push\n' >&2 || printf '✓ lint-all CLEAN — ready to push\n' >&2
fi

if [ "$JSON" = "1" ]; then
  META_TS=$(emit_iso_ts)
  META_GIT_SHA=$(emit_git_sha "$SKILLS_ROOT")
  META_BLOCK=$(emit_meta_block "$SKILLS_ROOT" "$META_TS" "$META_GIT_SHA" "default")
  printf '{%s,"gates":[' "$META_BLOCK"
  for i in "${!GATE_NAMES[@]}"; do
    [ "$i" -gt 0 ] && printf ','
    printf '{"name":"%s","status":"%s","details":"%s"}' \
      "$(json_escape "${GATE_NAMES[$i]}")" \
      "$(json_escape "${GATE_STATUSES[$i]}")" \
      "$(json_escape "${GATE_DETAILS[$i]}")"
  done
  printf '],"summary":{"pass":%d,"fail":%d,"skip":%d,"exit":%d}}\n' \
    "$PASS" "$FAIL" "$SKIP" "$EXIT"
fi

exit "$EXIT"
