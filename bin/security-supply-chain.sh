#!/usr/bin/env bash
# security-supply-chain.sh — unified supply-chain audit.
# Per rules/ai-agent-security.md § Supply chain.
#
# Usage:
#   bash ~/.agentskills/bin/security-supply-chain.sh [project-dir] [--json]
#
# Checks (each step exits non-zero on failure; script tallies and exits 1 if any fail):
#   1. GitHub Actions SHA-pinning  (scripts/sha-pin-actions.mjs --check)
#   2. package.json git+https deps (mainstream-only mandate)
#   3 + 4. Gitleaks + Trufflehog in parallel
#   5. Pack integrity (only when run inside agentskills repo)
#
# --json: emit `{checks:[{name,status,details}],summary:{pass,fail,skip,exit}}` to stdout
# Human report still goes to stderr in both modes.

set -uo pipefail

JSON=0
ARGS=()
for arg in "$@"; do
  case "$arg" in
    --json) JSON=1 ;;
    *) ARGS+=("$arg") ;;
  esac
done

PROJECT="${ARGS[0]:-$PWD}"
[ -d "$PROJECT" ] || {
  echo "ERROR: $PROJECT not a directory" >&2
  exit 1
}
cd "$PROJECT" || exit 1

SKILLS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PASS=0
FAIL=0
SKIP=0
CHECK_NAMES=()
CHECK_STATUSES=()
CHECK_DETAILS=()

emdashLog() { printf "  %s %s\n" "$1" "$2" >&2; }
emdashSection() { printf "\n▸ %s\n" "$1" >&2; }
recordCheck() {
  CHECK_NAMES+=("$1")
  CHECK_STATUSES+=("$2")
  CHECK_DETAILS+=("$3")
}

# --- 1. GitHub Actions SHA-pinning -----------------------------------------
emdashSection "1. GitHub Actions SHA-pinning"
WF_FILES=()
for ext in yml yaml; do
  for f in .github/workflows/*."$ext"; do
    [ -f "$f" ] && WF_FILES+=("$f")
  done
done
if [ "${#WF_FILES[@]}" -gt 0 ]; then
  if node "$SKILLS_ROOT/scripts/sha-pin-actions.mjs" --check "${WF_FILES[@]}" 2>&1 | tail -3 >&2; then
    emdashLog "✓" "all action refs SHA-pinned"
    PASS=$((PASS + 1))
    recordCheck "sha-pin" "pass" "all action refs SHA-pinned"
  else
    emdashLog "✗" "unpinned tag refs — run: npm run sha-pin"
    FAIL=$((FAIL + 1))
    recordCheck "sha-pin" "fail" "unpinned tag refs"
  fi
else
  emdashLog "·" "no workflows — skipped"
  SKIP=$((SKIP + 1))
  recordCheck "sha-pin" "skip" "no workflows"
fi

# --- 2. package.json git+https deps ----------------------------------------
emdashSection "2. package.json git+https deps"
if [ -f package.json ]; then
  HITS=$(grep -nE '"git\+https://' package.json package-lock.json 2>/dev/null || true)
  if [ -n "$HITS" ]; then
    emdashLog "✗" "git+https deps found — see rules/lint-doctrine.md § Package philosophy"
    echo "$HITS" | sed 's/^/    /' >&2
    FAIL=$((FAIL + 1))
    recordCheck "no-git-deps" "fail" "git+https deps found"
  else
    emdashLog "✓" "no git+https deps"
    PASS=$((PASS + 1))
    recordCheck "no-git-deps" "pass" "no git+https deps"
  fi
else
  emdashLog "·" "no package.json — skipped"
  SKIP=$((SKIP + 1))
  recordCheck "no-git-deps" "skip" "no package.json"
fi

# --- 3 + 4 parallel: secret scanners ---------------------------------------
emdashSection "3 + 4. Secret scanners (gitleaks + trufflehog) in parallel"
GL_LOG=$(mktemp)
TH_LOG=$(mktemp)
GL_PID=""
TH_PID=""
if command -v gitleaks >/dev/null 2>&1; then
  gitleaks detect --redact --verbose --no-banner >"$GL_LOG" 2>&1 &
  GL_PID=$!
fi
if command -v trufflehog >/dev/null 2>&1; then
  trufflehog git file://. --only-verified --fail --no-update >"$TH_LOG" 2>&1 &
  TH_PID=$!
fi
GL_EXIT=0
TH_EXIT=0
[ -n "$GL_PID" ] && {
  wait "$GL_PID"
  GL_EXIT=$?
} || GL_EXIT=-1
[ -n "$TH_PID" ] && {
  wait "$TH_PID"
  TH_EXIT=$?
} || TH_EXIT=-1

if [ -n "$GL_PID" ]; then
  if [ "$GL_EXIT" -eq 0 ]; then
    emdashLog "✓" "gitleaks: no committed secrets"
    PASS=$((PASS + 1))
    recordCheck "gitleaks" "pass" "no committed secrets"
  else
    emdashLog "✗" "gitleaks: secrets detected — rotate immediately"
    tail -10 "$GL_LOG" | sed 's/^/    /' >&2
    FAIL=$((FAIL + 1))
    recordCheck "gitleaks" "fail" "secrets detected"
  fi
else
  emdashLog "·" "gitleaks not installed (brew install gitleaks) — skipped"
  SKIP=$((SKIP + 1))
  recordCheck "gitleaks" "skip" "not installed"
fi

if [ -n "$TH_PID" ]; then
  if [ "$TH_EXIT" -eq 0 ]; then
    emdashLog "✓" "trufflehog: no verified live secrets"
    PASS=$((PASS + 1))
    recordCheck "trufflehog" "pass" "no verified live secrets"
  else
    emdashLog "✗" "trufflehog: live secret detected — rotate immediately"
    tail -10 "$TH_LOG" | sed 's/^/    /' >&2
    FAIL=$((FAIL + 1))
    recordCheck "trufflehog" "fail" "verified live secret"
  fi
else
  emdashLog "·" "trufflehog not installed (brew install trufflehog) — skipped"
  SKIP=$((SKIP + 1))
  recordCheck "trufflehog" "skip" "not installed"
fi
rm -f "$GL_LOG" "$TH_LOG"

# --- 5. Pack integrity (only when in agentskills repo) ---------------------
emdashSection "5. Pack integrity (agentskills-only)"
if [ -f "$PROJECT/scripts/validate-packs.mjs" ] && [ -d "$PROJECT/_packs" ]; then
  if node "$PROJECT/scripts/validate-packs.mjs" 2>&1 | tail -2 >&2; then
    emdashLog "✓" "pack cross-link integrity clean"
    PASS=$((PASS + 1))
    recordCheck "validate-packs" "pass" "clean"
  else
    emdashLog "✗" "pack drift detected"
    FAIL=$((FAIL + 1))
    recordCheck "validate-packs" "fail" "drift detected"
  fi
else
  emdashLog "·" "not an agentskills repo — skipped"
  SKIP=$((SKIP + 1))
  recordCheck "validate-packs" "skip" "not agentskills"
fi

# --- Summary ---------------------------------------------------------------
emdashSection "Summary"
emdashLog "i" "pass=$PASS fail=$FAIL skip=$SKIP"
EXIT=0
if [ "$FAIL" -gt 0 ]; then
  emdashLog "✗" "supply-chain audit FAILED — see remediation in commands/security-supply-chain.md"
  EXIT=1
else
  emdashLog "✓" "supply-chain audit CLEAN"
fi

if [ "$JSON" = "1" ]; then
  # shellcheck source=lib/emit-json.sh
  . "$SKILLS_ROOT/bin/lib/emit-json.sh"
  TS=$(emit_iso_ts)
  GIT_SHA=$(emit_git_sha "$PROJECT")
  printf '{"meta":{"skills_root":"%s","project":"%s","timestamp":"%s","generated_at":"%s","git_sha":"%s"},"checks":[' \
    "$(json_escape "$SKILLS_ROOT")" "$(json_escape "$PROJECT")" "$TS" "$TS" "$GIT_SHA"
  for i in "${!CHECK_NAMES[@]}"; do
    [ "$i" -gt 0 ] && printf ','
    printf '{"name":"%s","status":"%s","details":"%s"}' \
      "${CHECK_NAMES[$i]}" "${CHECK_STATUSES[$i]}" "${CHECK_DETAILS[$i]}"
  done
  printf '],"summary":{"pass":%d,"fail":%d,"skip":%d,"exit":%d}}\n' \
    "$PASS" "$FAIL" "$SKIP" "$EXIT"
fi

exit "$EXIT"
