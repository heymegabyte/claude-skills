#!/bin/bash
# HTTP notification hook: push session events to Slack via webhook
# Requires SLACK_WEBHOOK_URL in .env.local
# Used by Stop hook to send session summaries

ENV_LOCAL="${CLAUDE_ENV_FILE:-$HOME/.env.local}"
[ -f "$ENV_LOCAL" ] && source "$ENV_LOCAL" 2>/dev/null

[ -z "$SLACK_WEBHOOK_URL" ] && exit 0

PROJECT=$(basename "$(pwd)" 2>/dev/null || echo "unknown")
BRANCH=$(git branch --show-current 2>/dev/null || echo "none")
COMMITS=$(git log --oneline --since="4 hours ago" 2>/dev/null | wc -l | tr -d ' ')
MODIFIED=$(git diff --name-only 2>/dev/null | wc -l | tr -d ' ')
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Build Slack message
PAYLOAD=$(cat <<EOF
{
  "blocks": [
    {
      "type": "header",
      "text": {"type": "plain_text", "text": "⚡ Emdash Session Complete"}
    },
    {
      "type": "section",
      "fields": [
        {"type": "mrkdwn", "text": "*Project:*\n${PROJECT}"},
        {"type": "mrkdwn", "text": "*Branch:*\n${BRANCH}"},
        {"type": "mrkdwn", "text": "*Commits:*\n${COMMITS}"},
        {"type": "mrkdwn", "text": "*Modified:*\n${MODIFIED} files"}
      ]
    },
    {
      "type": "context",
      "elements": [{"type": "mrkdwn", "text": "${TIMESTAMP} | Claude Opus 4.6"}]
    }
  ]
}
EOF
)

curl -s -X POST -H "Content-Type: application/json" -d "$PAYLOAD" "$SLACK_WEBHOOK_URL" >/dev/null 2>&1 &

exit 0
