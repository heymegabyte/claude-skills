#!/bin/bash
# PreCompact hook: snapshot critical state before context gets compressed
# Saves to a temp file that PostCompact can read back

SNAPSHOT="$HOME/.claude/audit/pre-compact-snapshot.json"
mkdir -p "$(dirname "$SNAPSHOT")"

BRANCH=$(git branch --show-current 2>/dev/null || echo "none")
PROJECT=$(basename "$(pwd)")
MODIFIED=$(git diff --name-only 2>/dev/null | head -20 | tr '\n' ',' | sed 's/,$//')
STAGED=$(git diff --cached --name-only 2>/dev/null | head -10 | tr '\n' ',' | sed 's/,$//')
RECENT=$(git log --oneline -5 2>/dev/null | tr '\n' '|' | sed 's/|$//')
TASKS=""
if command -v python3 >/dev/null 2>&1; then
  TASKS=$(find "$HOME/.claude/tasks/" -name "latest.json" 2>/dev/null | head -10 | xargs cat 2>/dev/null | python3 -c "
import sys,json
try:
  for line in sys.stdin:
    d=json.loads(line.strip())
    if d.get('status')=='in_progress':
      print(d.get('description','')[:80])
except: pass
" 2>/dev/null | head -5 | tr '\n' '|' | sed 's/|$//')
fi

cat > "$SNAPSHOT" << EOF
{
  "ts": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "project": "$PROJECT",
  "branch": "$BRANCH",
  "modified": "$MODIFIED",
  "staged": "$STAGED",
  "recent_commits": "$RECENT",
  "active_tasks": "$TASKS"
}
EOF

exit 0
