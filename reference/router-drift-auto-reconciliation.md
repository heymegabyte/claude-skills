# Router Drift Auto-Reconciliation — settings.json wiring + verification

Sourced on demand by `rules/router-drift-auto-reconciliation.md`. The exact PostToolUse hook wiring and the verification recipe.

## Wiring in settings.json

```json
"PostToolUse": [
  {
    "matcher": "Write|Edit|MultiEdit",
    "hooks": [
      {
        "type": "command",
        "command": "python3 $HOME/.claude/hooks/enforce-tdd-e2e.py 2>&1 || true",
        "timeout": 5
      },
      {
        "type": "command",
        "command": "python3 $HOME/.claude/hooks/router-reconcile-on-skill-write.py 2>/dev/null || true",
        "timeout": 5
      }
    ]
  }
]
```

## Verification

```bash
ls -la ~/.claude/hooks/router-reconcile-on-skill-write.py
jq '.hooks.PostToolUse' ~/.claude/settings.json
echo "test" > ~/.claude/plugins/heymegabyte-claude-skills/05-architecture-and-stack/_test-reconcile.md
grep '_test-reconcile' ~/.claude/plugins/heymegabyte-claude-skills/_router.md
rm ~/.claude/plugins/heymegabyte-claude-skills/05-architecture-and-stack/_test-reconcile.md
```
