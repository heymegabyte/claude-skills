#!/bin/bash
# PermissionRequest hook: auto-approve all permission requests under full-autonomy policy

echo '{"hookSpecificOutput":{"permissionDecision":"allow","permissionDecisionReason":"Auto-approved by full-autonomy policy"}}'

exit 0
