#!/usr/bin/env bash
# lint-auto-improve.sh — AI-augmented self-improvement loop for the lint stack.
#
# Scans lint output across recent runs, identifies recurring violation classes,
# and either:
#  (a) drafts a new semgrep rule into templates/lint-stack/semgrep-custom/<topic>.yml
#  (b) appends a "Codified incidents" entry to rules/lint-doctrine.md
#  (c) cross-links from the owning domain rule
#  (d) commits + pushes back to the agentskills repo
#
# Usage:
#   bash ~/.agentskills/bin/lint-auto-improve.sh [project-dir]
#
# Mechanism:
#   1. Tail recent eslint+semgrep+shellcheck output (last 30d) from project's
#      .lint-history/ dir (auto-created on each pre-commit run)
#   2. Cluster by rule-id + message pattern
#   3. For any cluster with ≥3 hits in the window, propose a custom rule
#   4. Use Claude API (or claude CLI if present) to draft the rule + the
#      cross-link narrative; never auto-merge without Brian's nod
#   5. Surface the proposal in .lint-history/proposals/<timestamp>.md
#
# Per rules/lint-doctrine.md § Self-improving + rules/prompt-as-training-signal.md §6.

set -euo pipefail

AUTO_DRAFT=0
JSON=0
ARGS=()
for arg in "$@"; do
  case "$arg" in
    --auto-draft) AUTO_DRAFT=1 ;;
    --json) JSON=1 ;;
    *) ARGS+=("$arg") ;;
  esac
done

# Resolve SKILLS_ROOT relative to script location BEFORE cd into project
SKILLS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PROJECT="${ARGS[0]:-$PWD}"
[ -d "$PROJECT" ] || {
  echo "ERROR: $PROJECT not a directory" >&2
  exit 1
}
cd "$PROJECT" || exit 1
HISTORY_DIR=".lint-history"
PROPOSAL_DIR="$HISTORY_DIR/proposals"
SEMGREP_CUSTOM_DIR="$SKILLS_ROOT/templates/lint-stack/semgrep-custom"

mkdir -p "$HISTORY_DIR" "$PROPOSAL_DIR" "$SEMGREP_CUSTOM_DIR"

TS=$(date -u +%Y%m%dT%H%M%SZ)
PROPOSAL_FILE="$PROPOSAL_DIR/proposal-$TS.md"

emdashLog() { printf "  %s %s\n" "$1" "$2" >&2; }
emdashSection() { printf "\n▸ %s\n" "$1" >&2; }

# --- 1. Inventory recent lint findings -------------------------------------
emdashSection "Scanning lint history (last 30d)"
LINT_LOGS=$(find "$HISTORY_DIR" -name '*.log' -mtime -30 2>/dev/null | wc -l | tr -d ' ')
emdashLog "✓" "$LINT_LOGS log file(s) in window"

if [ "$LINT_LOGS" = "0" ]; then
  emdashLog "i" "No lint history yet — run 'npm run lint' a few times to populate"
  emdashLog "i" "Add to lefthook.yml pre-commit step: '| tee .lint-history/lint-{date}.log'"
  exit 0
fi

# --- 2. Cluster by rule-id ------------------------------------------------
emdashSection "Clustering violations by rule-id"
# Match common ESLint/semgrep/sonarjs rule-id shapes:
#   @scope/rule-name  ·  plugin/rule-name  ·  category/sub/rule
CLUSTERED=$(grep -hoE '@?[a-zA-Z][a-zA-Z0-9_-]+/[a-zA-Z][a-zA-Z0-9_/-]+' "$HISTORY_DIR"/*.log 2>/dev/null \
  | sort | uniq -c | sort -rn | head -20)

if [ -z "$CLUSTERED" ]; then
  emdashLog "i" "No recognized rule patterns in logs"
  exit 0
fi

echo "$CLUSTERED" | head -10 | while read -r count rest; do
  emdashLog "·" "${count}x ${rest}"
done

# --- 3. Promote clusters w/ ≥3 hits to proposals --------------------------
emdashSection "Drafting proposal(s)"
{
  printf '# Lint Auto-Improve Proposal — %s\n\n' "$TS"
  printf 'Source: `%s/.lint-history/`\n\n' "$PROJECT"
  printf '## Recurring patterns (≥3 hits in 30d window)\n\n'
  echo "$CLUSTERED" | awk '$1 >= 3' | while read -r count pattern; do
    printf -- '- **%sx `%s`** — candidate for semgrep rule\n' "$count" "$pattern"
  done
  printf '\n## Suggested next action\n\n'
  printf 'Run `claude` (or hand the top candidate to the AI) with:\n\n'
  printf '> Draft a semgrep YAML rule that catches `%s` patterns under `~/.agentskills/templates/lint-stack/semgrep-custom/<topic>.yml`. Cite the owning rule in `~/.agentskills/rules/` and append to `lint-doctrine.md` § "Codified incidents".\n\n' \
    "$(echo "$CLUSTERED" | awk 'NR==1{print $NF}')"
  printf '## Self-improvement workflow\n\n'
  printf '1. Author the semgrep rule + cross-link\n'
  printf '2. Verify via `semgrep --test --config=<new-rule>`\n'
  printf '3. Commit to agentskills repo (auto-pushed per Brian'\''s git policy)\n'
  printf '4. Add row to `lint-doctrine.md` § "Codified incidents" table\n'
  printf '5. Cross-link from owning domain rule (`code-style.md`, `rxjs-first-angular.md`, etc.)\n'
  printf '\nThis closes the loop: lint output → recurring pattern detection → AI-drafted rule → human-approved merge → permanent codification.\n'
} >"$PROPOSAL_FILE"

emdashLog "✓" "Proposal written: $PROPOSAL_FILE"

# Track results for --json emit
TOTAL_PATTERNS=$(echo "$CLUSTERED" | awk '$1 >= 3' | wc -l | tr -d ' ')
DRAFT_EMITTED=0
DRAFT_VALIDATED=0
DRAFT_PATH=""

# --- 3.5. Auto-draft via Claude API (opt-in) -------------------------------
if [ "$AUTO_DRAFT" = "1" ]; then
  emdashSection "Auto-drafting semgrep rule via Claude API"
  if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
    emdashLog "!" "ANTHROPIC_API_KEY not set — skipping auto-draft"
  elif ! command -v curl >/dev/null 2>&1; then
    emdashLog "!" "curl not available — skipping auto-draft"
  else
    # Pick model per opus-quota-fallback.md — Opus default, Sonnet fallback on quota
    MODEL="claude-opus-4-7"
    if [ -f "$HOME/.claude/.opus-disabled" ] || [ "${CLAUDE_OPUS_DISABLED:-}" = "true" ]; then
      MODEL="claude-sonnet-4-6"
      emdashLog "i" "Opus quota signal active → falling back to $MODEL"
    fi

    TOP_RULE=$(echo "$CLUSTERED" | awk 'NR==1{print $NF}')
    DRAFT_FILE="$PROPOSAL_DIR/draft-$TS.yml"
    PROMPT="Draft a semgrep YAML rule that catches '$TOP_RULE' violations. Use languages: [generic] for cross-file patterns or specific language otherwise. Include a 'paths.include' filter and a clear 'message' citing the owning rule in ~/.agentskills/rules/. Output ONLY the YAML, no preamble."
    # shellcheck disable=SC2016
    BODY=$(printf '{"model":"%s","max_tokens":1024,"messages":[{"role":"user","content":"%s"}]}' \
      "$MODEL" "$(echo "$PROMPT" | sed 's/"/\\"/g')")
    RESPONSE=$(curl -sf https://api.anthropic.com/v1/messages \
      -H "x-api-key: $ANTHROPIC_API_KEY" \
      -H "anthropic-version: 2023-06-01" \
      -H "content-type: application/json" \
      -d "$BODY" 2>&1 || echo "ERROR")
    if [ "$RESPONSE" = "ERROR" ] || ! echo "$RESPONSE" | grep -q '"content"'; then
      emdashLog "!" "Claude API call failed — leaving proposal for manual completion"
    else
      # Write frontmatter header documenting model/timestamp/pattern for trend tracking
      {
        printf '# Auto-drafted by bin/lint-auto-improve.sh --auto-draft\n'
        printf '# model: %s\n' "$MODEL"
        printf '# timestamp: %s\n' "$TS"
        printf '# cluster_pattern: %s\n' "$TOP_RULE"
        printf '# project: %s\n' "$PROJECT"
        printf '# review-before-merge: true\n'
        printf '\n'
        echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['content'][0]['text'])"
      } >"$DRAFT_FILE" 2>/dev/null
      if [ -s "$DRAFT_FILE" ]; then
        emdashLog "✓" "Draft written ($MODEL): $DRAFT_FILE"
        DRAFT_EMITTED=1
        DRAFT_PATH="$DRAFT_FILE"
        # Validate the drafted YAML via semgrep --validate
        if command -v semgrep >/dev/null 2>&1; then
          if semgrep --validate --config="$DRAFT_FILE" >/dev/null 2>&1; then
            emdashLog "✓" "semgrep --validate: YAML structure valid"
            DRAFT_VALIDATED=1
          else
            emdashLog "!" "semgrep --validate FAILED — manual review required before use"
            mv "$DRAFT_FILE" "${DRAFT_FILE}.invalid"
            emdashLog "i" "Renamed to ${DRAFT_FILE}.invalid"
          fi
        else
          emdashLog "i" "semgrep not installed — skipped validation (brew install semgrep)"
        fi
        emdashLog "i" "Review + move to: $SEMGREP_CUSTOM_DIR/<topic>.yml"
      else
        emdashLog "!" "Empty draft — Claude response parse failed"
      fi
    fi
  fi
fi

# --- 4. Surface to Brian via stdout summary --------------------------------
emdashSection "Done"
emdashLog "i" "Review: $PROPOSAL_FILE"
if [ "$AUTO_DRAFT" = "0" ]; then
  emdashLog "i" "Auto-draft: add --auto-draft flag w/ ANTHROPIC_API_KEY set"
fi
emdashLog "i" "Codify a rule: copy proposal to AI prompt, generate YAML, drop into:"
emdashLog "  " "$SEMGREP_CUSTOM_DIR/<topic>.yml"
emdashLog "i" "Cross-link in rules/lint-doctrine.md § Codified incidents"

# --- JSON emit per rules/uniform-json-output.md (uses bin/lib/emit-json.sh) ---
if [ "$JSON" = "1" ]; then
  # shellcheck source=lib/emit-json.sh
  . "$SKILLS_ROOT/bin/lib/emit-json.sh"

  META_TS=$(emit_iso_ts)
  META_GIT_SHA=$(emit_git_sha "$PROJECT")
  FILTER_VAL="default"
  [ "$AUTO_DRAFT" = "1" ] && FILTER_VAL="auto-draft"

  PROPOSALS_JSON="["
  FIRST=1
  TMPF=$(mktemp)
  echo "$CLUSTERED" | awk '$1 >= 3' | while read -r count pattern; do
    [ -z "$pattern" ] && continue
    if [ "$FIRST" = "1" ]; then FIRST=0; else PROPOSALS_JSON="${PROPOSALS_JSON},"; fi
    PROPOSALS_JSON="${PROPOSALS_JSON}{\"pattern\":\"$(json_escape "$pattern")\",\"count\":${count}}"
    printf '%s' "$PROPOSALS_JSON" >"$TMPF"
  done
  PROPOSALS_JSON=$(cat "$TMPF" 2>/dev/null || echo "[")
  rm -f "$TMPF"
  PROPOSALS_JSON="${PROPOSALS_JSON}]"

  printf '{%s,"proposals":%s,"summary":{"total":%d,"draft_emitted":%d,"draft_validated":%d,"draft_path":"%s","proposal_path":"%s"}}\n' \
    "$(emit_meta_block "$PROJECT" "$META_TS" "$META_GIT_SHA" "$FILTER_VAL")" \
    "$PROPOSALS_JSON" \
    "${TOTAL_PATTERNS:-0}" "$DRAFT_EMITTED" "$DRAFT_VALIDATED" \
    "$(json_escape "$DRAFT_PATH")" "$(json_escape "$PROPOSAL_FILE")"
fi
