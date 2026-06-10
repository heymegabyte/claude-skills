#!/usr/bin/env bash
# lint-all.sh — run every CI lint gate locally. Mirror of publish.yml § validate.
# Per rules/lint-doctrine.md + rules/uniform-json-output.md.
#
# Usage:
#   bash ~/.agentskills/bin/lint-all.sh [--json] [--quiet]
#
# Each gate runs sequentially; exit code = number of failed gates. With --json,
# emits {meta, gates:[{name,status,details}], summary:{pass,fail,skip,exit}}.
# Human report → stderr, JSON → stdout (per uniform-json-output § Rules).
#
# --quiet: run the soft-info audit sections silently. If ANY info section finds
# drift, print all info section output. If all clean, suppress info chatter.
# Pre-commit hook uses --quiet to keep routine commits scannable.

set -uo pipefail

JSON=0
QUIET=0
for arg in "$@"; do
  case "$arg" in
    --json) JSON=1 ;;
    --quiet) QUIET=1 ;;
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
    shellcheck -x -S warning bin/lint-all.sh bin/lint-auto-improve.sh bin/security-supply-chain.sh bin/session-recap.sh bin/check-doc-urls.sh bin/check-pricing.sh bin/check-agent-routing.sh bin/check-pack-frontmatter.sh bin/check-agent-fallback.sh bin/check-deprecated-models.sh bin/install-hooks.sh bin/lib/emit-json.sh scripts/discover-secrets.sh scripts/gpt4o-vision-analyze.sh scripts/validate-skills.sh scripts/visual-tdd-loop.sh
else
  skipGate "shellcheck" "not installed (brew install shellcheck)"
fi

logHeader "8. shfmt"
if command -v shfmt >/dev/null; then
  runGate "shfmt" "shfmt -d -i 2 -ci -bn" \
    shfmt -i 2 -ci -bn -d bin/lint-all.sh bin/lint-auto-improve.sh bin/security-supply-chain.sh bin/session-recap.sh bin/check-doc-urls.sh bin/check-pricing.sh bin/check-agent-routing.sh bin/check-pack-frontmatter.sh bin/check-agent-fallback.sh bin/check-deprecated-models.sh bin/install-hooks.sh bin/lib/emit-json.sh scripts/discover-secrets.sh scripts/gpt4o-vision-analyze.sh scripts/validate-skills.sh scripts/visual-tdd-loop.sh
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

# Hard gate 10 (pass-82 promotion) — deprecated-models was soft-info pass-72→81
# during the migration arc; arc completed at 0 hits pass-81; now graduated to a
# blocking gate. Any new commit introducing a retired identifier blocks here.
logHeader "10. deprecated-models"
runGate "deprecated-models" "check-deprecated-models" \
  bash "$SKILLS_ROOT/bin/check-deprecated-models.sh"

# Hard gate 11 (pass-83 promotion) — pack-frontmatter was soft-info pass-66→82
# (17 passes stable at 83 rules · 0 drift). Promoted to blocking gate. Any rule
# frontmatter `pack:` claim that doesn't match a real `_packs/*.yml` membership
# blocks here.
logHeader "11. pack-frontmatter"
runGate "pack-frontmatter" "check-pack-frontmatter" \
  bash "$SKILLS_ROOT/bin/check-pack-frontmatter.sh"

# Soft INFO gates (pass-63→67) — 4 audit reports.
# Human mode: with --quiet, buffer output; only emit if any drift. Without --quiet, emit always.
# JSON mode (pass-69): capture each script's --json envelope into an `info` block alongside `gates`.
INFO_NAMES=()
INFO_STATUSES=()
INFO_PAYLOADS=()
INFO_DRIFT=0

runInfoSection() {
  local label="$1"
  local script="$2"
  local payload
  payload=$(bash "$SKILLS_ROOT/$script" --json 2>/dev/null) || INFO_DRIFT=1
  INFO_NAMES+=("$label")
  if printf '%s' "$payload" | grep -q '"exit":0'; then
    INFO_STATUSES+=("clean")
  else
    INFO_STATUSES+=("drift")
  fi
  INFO_PAYLOADS+=("$payload")
}

runInfoSection "pricing" "bin/check-pricing.sh"
runInfoSection "agent-routing" "bin/check-agent-routing.sh"
runInfoSection "agent-fallback" "bin/check-agent-fallback.sh"

if [ "$JSON" = "0" ]; then
  INFO_BUF=$(mktemp)
  emitInfoSection() {
    local title="$1"
    local script="$2"
    local tail_n="$3"
    {
      printf '\n━━━ %s\n' "$title"
      bash "$SKILLS_ROOT/$script" 2>&1 | tail -"$tail_n" || true
    } >>"$INFO_BUF"
  }
  emitInfoSection "ℹ pricing-staleness (info-only, doesn't gate)" \
    "bin/check-pricing.sh" 8
  emitInfoSection "ℹ agent-routing drift (info-only, doesn't gate)" \
    "bin/check-agent-routing.sh" 6
  emitInfoSection "ℹ Opus agent fallback compliance (info-only, doesn't gate)" \
    "bin/check-agent-fallback.sh" 4

  if [ "$QUIET" = "1" ] && [ "$INFO_DRIFT" = "0" ]; then
    printf '\n━━━ ℹ 3 audit sections clean (pricing · agent-routing · agent-fallback) — use `npm run lint` for full output\n' >&2
  else
    cat "$INFO_BUF" >&2
  fi
  rm -f "$INFO_BUF"
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
  # Emit `info` block with embedded sub-envelopes (pass-69)
  INFO_JSON="["
  for i in "${!INFO_NAMES[@]}"; do
    [ "$i" -gt 0 ] && INFO_JSON+=","
    INFO_JSON+="{\"name\":\"$(json_escape "${INFO_NAMES[$i]}")\",\"status\":\"${INFO_STATUSES[$i]}\",\"payload\":${INFO_PAYLOADS[$i]:-null}}"
  done
  INFO_JSON+="]"
  printf '{%s,"gates":[' "$META_BLOCK"
  for i in "${!GATE_NAMES[@]}"; do
    [ "$i" -gt 0 ] && printf ','
    printf '{"name":"%s","status":"%s","details":"%s"}' \
      "$(json_escape "${GATE_NAMES[$i]}")" \
      "$(json_escape "${GATE_STATUSES[$i]}")" \
      "$(json_escape "${GATE_DETAILS[$i]}")"
  done
  printf '],"info":%s,"summary":{"pass":%d,"fail":%d,"skip":%d,"info_drift":%d,"exit":%d}}\n' \
    "$INFO_JSON" "$PASS" "$FAIL" "$SKIP" "$INFO_DRIFT" "$EXIT"
fi

exit "$EXIT"
