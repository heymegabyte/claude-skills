#!/usr/bin/env bash
# security-supply-chain.sh — unified supply-chain audit.
# Per rules/ai-agent-security.md § Supply chain.
#
# Usage:
#   bash ~/.agentskills/bin/security-supply-chain.sh [project-dir]
#
# Checks (each step exits non-zero on failure; script tallies and exits 1 if any fail):
#   1. GitHub Actions SHA-pinning  (scripts/sha-pin-actions.mjs --check)
#   2. package.json git+https deps (mainstream-only mandate)
#   3. Gitleaks working-tree scan  (committed-secret check)
#   4. Trufflehog --only-verified  (live-credential check)

set -uo pipefail

PROJECT="${1:-$PWD}"
[ -d "$PROJECT" ] || {
  echo "ERROR: $PROJECT not a directory" >&2
  exit 1
}
cd "$PROJECT" || exit 1

SKILLS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PASS=0
FAIL=0
SKIP=0

emdashLog() { printf "  %s %s\n" "$1" "$2" >&2; }
emdashSection() { printf "\n▸ %s\n" "$1" >&2; }

# --- 1. GitHub Actions SHA-pinning -----------------------------------------
emdashSection "1. GitHub Actions SHA-pinning"
WF_FILES=()
for ext in yml yaml; do
  for f in .github/workflows/*."$ext"; do
    [ -f "$f" ] && WF_FILES+=("$f")
  done
done
if [ "${#WF_FILES[@]}" -gt 0 ]; then
  if node "$SKILLS_ROOT/scripts/sha-pin-actions.mjs" --check "${WF_FILES[@]}" 2>&1 | tail -3; then
    emdashLog "✓" "all action refs SHA-pinned"
    PASS=$((PASS + 1))
  else
    emdashLog "✗" "unpinned tag refs — run: npm run sha-pin"
    FAIL=$((FAIL + 1))
  fi
else
  emdashLog "·" "no workflows — skipped"
  SKIP=$((SKIP + 1))
fi

# --- 2. package.json git+https deps ----------------------------------------
emdashSection "2. package.json git+https deps"
if [ -f package.json ]; then
  HITS=$(grep -nE '"git\+https://' package.json package-lock.json 2>/dev/null || true)
  if [ -n "$HITS" ]; then
    emdashLog "✗" "git+https deps found — see rules/lint-doctrine.md § Package philosophy"
    echo "$HITS" | sed 's/^/    /' >&2
    FAIL=$((FAIL + 1))
  else
    emdashLog "✓" "no git+https deps"
    PASS=$((PASS + 1))
  fi
else
  emdashLog "·" "no package.json — skipped"
  SKIP=$((SKIP + 1))
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
  else
    emdashLog "✗" "gitleaks: secrets detected — rotate immediately"
    tail -10 "$GL_LOG" | sed 's/^/    /' >&2
    FAIL=$((FAIL + 1))
  fi
else
  emdashLog "·" "gitleaks not installed (brew install gitleaks) — skipped"
  SKIP=$((SKIP + 1))
fi

if [ -n "$TH_PID" ]; then
  if [ "$TH_EXIT" -eq 0 ]; then
    emdashLog "✓" "trufflehog: no verified live secrets"
    PASS=$((PASS + 1))
  else
    emdashLog "✗" "trufflehog: live secret detected — rotate immediately"
    tail -10 "$TH_LOG" | sed 's/^/    /' >&2
    FAIL=$((FAIL + 1))
  fi
else
  emdashLog "·" "trufflehog not installed (brew install trufflehog) — skipped"
  SKIP=$((SKIP + 1))
fi
rm -f "$GL_LOG" "$TH_LOG"

# --- Summary ---------------------------------------------------------------
emdashSection "Summary"
emdashLog "i" "pass=$PASS fail=$FAIL skip=$SKIP"
if [ "$FAIL" -gt 0 ]; then
  emdashLog "✗" "supply-chain audit FAILED — see remediation in commands/security-supply-chain.md"
  exit 1
fi
emdashLog "✓" "supply-chain audit CLEAN"
exit 0
