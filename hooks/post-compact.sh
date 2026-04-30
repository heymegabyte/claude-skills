#!/bin/bash
# PostCompact: re-inject critical context after compaction

BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
MODIFIED=$(git diff --name-only 2>/dev/null | head -10 | tr '\n' ', ' | sed 's/,$//')
RECENT=$(git log --oneline -3 2>/dev/null | tr '\n' '|' | sed 's/|$//')
SNAPSHOT="$HOME/.claude/audit/pre-compact-snapshot.json"
TASKS=""
[ -f "$SNAPSHOT" ] && TASKS=$(python3 -c "import json; d=json.load(open('$SNAPSHOT')); print(d.get('active_tasks',''))" 2>/dev/null)

source "$HOME/.claude/hooks/style.sh" 2>/dev/null
gum style --foreground "#00E5FF" --border-foreground "#7C3AED" --border rounded --padding "0 1" --margin "0" --width 72 \
  "🔄 Context Re-Injected | $BRANCH | $(basename "$(pwd)")" >&2

cat << CONTEXT >&2

BRANCH: ${BRANCH} | MODIFIED: ${MODIFIED:-none} | RECENT: ${RECENT:-none}
${TASKS:+TASKS: $TASKS}

HARD GATES: E2E 6bp | AI vision>=8/10 | Yoast GREEN | Lighthouse A11y>=95 | Zero errors/stubs/TODO
STACK: CF Workers+Hono | Angular 21 | D1/Neon | Drizzle v1+Zod | Clerk | Stripe | Bun | Playwright v1.59
REPORT FORMAT: dense line + Config line (list ~/.claude/ and ~/.agentskills/ files changed + summary) + Repos line (non-current repos changed + summary). Both lines ALWAYS present (print "none" if nothing).
SECRETS: get-secret KEY | source \${CLAUDE_ENV_FILE}
CONTEXT
exit 0
