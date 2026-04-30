#!/bin/bash
# Notification hook: route Claude notifications to system + Slack
# Fires when Claude sends any notification (task complete, error, etc.)

ENV_LOCAL="${CLAUDE_ENV_FILE:-$HOME/.env.local}"
[ -f "$ENV_LOCAL" ] && source "$ENV_LOCAL" 2>/dev/null

# macOS native notification
osascript -e "display notification \"$CLAUDE_NOTIFICATION_MESSAGE\" with title \"⚡ Emdash\" sound name \"Ping\"" 2>/dev/null &

# Slack push (if webhook configured)
if [ -n "$SLACK_WEBHOOK_URL" ]; then
  PROJECT=$(basename "$(pwd)")
  curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"text\":\"⚡ *$PROJECT*: ${CLAUDE_NOTIFICATION_MESSAGE:-notification}\"}" \
    "$SLACK_WEBHOOK_URL" >/dev/null 2>&1 &
fi

exit 0
