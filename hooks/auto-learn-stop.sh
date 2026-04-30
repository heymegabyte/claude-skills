#!/bin/bash
# Stop hook: log session metrics, auto-commit skills, notify
source "$HOME/.claude/hooks/style.sh" 2>/dev/null || true

SIGNALS_LOG="$HOME/.claude/audit/preference-signals.jsonl"
EVOLUTION_LOG="$HOME/.claude/audit/evolution.jsonl"
SKILLS_DIR="$HOME/.agentskills"
mkdir -p "$(dirname "$EVOLUTION_LOG")"

# Count signals
CORRECTIONS=0; TECH_DECISIONS=0
[ -f "$SIGNALS_LOG" ] && {
  CORRECTIONS=$(grep -c '"type":"correction"' "$SIGNALS_LOG" 2>/dev/null || echo 0)
  TECH_DECISIONS=$(grep -c '"type":"tech_decision"' "$SIGNALS_LOG" 2>/dev/null || echo 0)
}

BRANCH=$(git branch --show-current 2>/dev/null || echo "none")
PROJECT=$(basename "$(pwd)")
printf '{"ts":"%s","project":"%s","branch":"%s","corrections":%d,"tech_decisions":%d}\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$PROJECT" "$BRANCH" "$CORRECTIONS" "$TECH_DECISIONS" >> "$EVOLUTION_LOG"

# Auto-commit+push skills if changed
SKILLS_CHANGED=$(cd "$SKILLS_DIR" && git status --short 2>/dev/null | wc -l | tr -d ' ')
if [ "$SKILLS_CHANGED" -gt 0 ]; then
  cd "$SKILLS_DIR"
  git add -A
  git commit -m "auto: $PROJECT ($SKILLS_CHANGED files, ${CORRECTIONS}c/${TECH_DECISIONS}d)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>" 2>/dev/null
  git push origin master 2>/dev/null &
fi

# Slack notification
"$HOME/.claude/hooks/slack-notify.sh" 2>/dev/null &

# Compact output
gum style --foreground "#00E5FF" --border-foreground "#50AAE3" --border rounded --padding "0 1" --margin "0" --width 72 \
  "📊 Session Complete | $PROJECT • $BRANCH" \
  "$(gum style --foreground '#50AAE3' "skills:$SKILLS_CHANGED△ | corrections:$CORRECTIONS | decisions:$TECH_DECISIONS")" >&2

exit 0
