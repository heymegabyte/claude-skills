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

PROJECT="${1:-$PWD}"
[ -d "$PROJECT" ] || {
  echo "ERROR: $PROJECT not a directory" >&2
  exit 1
}
cd "$PROJECT"

SKILLS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
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
CLUSTERED=$(grep -hoE '(error|warning).*[A-Z][a-z0-9_/-]+/[a-z0-9_-]+' "$HISTORY_DIR"/*.log 2>/dev/null \
  | sort | uniq -c | sort -rn | head -20)

if [ -z "$CLUSTERED" ]; then
  emdashLog "i" "No recognized rule patterns in logs"
  exit 0
fi

echo "$CLUSTERED" | head -10 | while read -r count rest; do
  emdashLog "·" "$count× $rest"
done

# --- 3. Promote clusters w/ ≥3 hits to proposals --------------------------
emdashSection "Drafting proposal(s)"
{
  printf '# Lint Auto-Improve Proposal — %s\n\n' "$TS"
  printf 'Source: `%s/.lint-history/`\n\n' "$PROJECT"
  printf '## Recurring patterns (≥3 hits in 30d window)\n\n'
  echo "$CLUSTERED" | awk '$1 >= 3' | while read -r count pattern; do
    printf '- **%s× `%s`** — candidate for semgrep rule\n' "$count" "$pattern"
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

# --- 4. Surface to Brian via stdout summary --------------------------------
emdashSection "Done"
emdashLog "i" "Review: $PROPOSAL_FILE"
emdashLog "i" "Codify a rule: copy proposal to AI prompt, generate YAML, drop into:"
emdashLog "  " "$SEMGREP_CUSTOM_DIR/<topic>.yml"
emdashLog "i" "Cross-link in rules/lint-doctrine.md § Codified incidents"
