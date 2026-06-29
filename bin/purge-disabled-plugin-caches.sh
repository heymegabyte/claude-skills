#!/bin/bash
# Purge cache dirs for disabled Claude plugins.
# --dry-run: list only.

DRY_RUN=false
for arg in "$@"; do
  [ "$arg" = "--dry-run" ] && DRY_RUN=true
done

# Disabled plugins from `claude plugin list`
DISABLED=(
  "claude-code-setup"
  "firecrawl"
  "ralph-loop"
  "resend"
  "sentry"
  "shopify-ai-toolkit"
  "superpowers"
  "twilio-developer-kit"
  "ui5-modernization"
)

CACHE="$HOME/.claude/plugins/cache"
TOTAL_BYTES=0
COUNT=0

for plugin in "${DISABLED[@]}"; do
  dirs=$(find "$CACHE" -maxdepth 3 -path "*/$plugin*" -type d 2>/dev/null)
  while IFS= read -r dir; do
    [ -z "$dir" ] && continue
    size=$(du -sk "$dir" 2>/dev/null | cut -f1)
    TOTAL_BYTES=$((TOTAL_BYTES + size * 1024))
    COUNT=$((COUNT + 1))
    if $DRY_RUN; then
      echo "WOULD DELETE: $dir (${size}K)"
    else
      rm -rf "$dir"
      echo "DELETED: $dir (${size}K)"
    fi
  done <<< "$dirs"
done

echo "---"
echo "Items: $COUNT | Freed: $(( TOTAL_BYTES / 1024 / 1024 ))M"
