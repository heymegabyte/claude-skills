#!/bin/bash
# Check Claude Code version and available update
# v2: --check flag not supported; run update to see if one is available

CURRENT=$(claude --version 2>/dev/null || echo "unknown")
echo "Current Claude Code: $CURRENT"

# claude update checks for updates; will install if available.
# We capture the output — if it says "up to date" we're good.
# If it installs, we report the new version.
UPDATE_OUT=$(claude update 2>&1)
UPDATE_EXIT=$?
echo "Update result: $UPDATE_OUT"

# Timestamp
echo "Checked: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"

if echo "$UPDATE_OUT" | grep -qi "up to date"; then
  echo "PASS: Already up to date"
elif echo "$UPDATE_OUT" | grep -qi "updated"; then
  NEW_VER=$(claude --version 2>/dev/null)
  echo "INFO: Updated to $NEW_VER"
else
  echo "INFO: $UPDATE_OUT"
fi
