# Retrospective Policy

At the end of every Claude Code turn, evaluate whether the conversation revealed durable learning worth persisting.

## When to Run

Run the retrospective skill (`agentskills-retrospective`) when:

1. The user asked a **follow-up** that wouldn't have been needed if a better instruction existed
2. The user **repeated** a known task pattern (second occurrence in this or recent sessions)
3. The user **corrected** Claude on a durable preference (not a one-off clarification)
4. The turn revealed a **reusable workflow** (multi-step process worth extracting)
5. The turn surfaced **stale docs**, missing tests, or architecture drift
6. The user made a **stack decision** or **philosophy change**
7. The turn exposed a **missing checklist, validation rule, or safety guard**
8. A future agent would benefit from a **short reusable skill** instead of rediscovering

## When NOT to Run

Skip the retrospective when:

- The turn was purely informational (Q&A, research with no action)
- The correction was one-off ("no, use port 3000 not 8080")
- The task was a simple, non-repeating mechanical edit
- The learning is already captured in an existing skill/rule/prompt
- Running would be noise, not signal

## Marker Convention

After completing a retrospective, append to `~/.agentskills/LEDGER.md`:

```
RETROSPECTIVE_DONE session=<id> timestamp=<ISO>
```

If session IDs are unavailable, use the best available timestamp.

## Stop Hook Behavior

`~/.claude/hooks/agentskills-stop-gate.sh` reads LEDGER.md at each Stop event:

- If a recent marker exists → exit 0 (no block)
- If no recent marker + signals detected → block once with instruction to run retrospective
- If no signals → exit 0
- On any error → exit 0 (fail-open)

The hook NEVER:

- Recursively invokes Claude Code
- Blocks more than once per turn
- Writes secrets or sensitive data
- Modifies files directly (read-only)

## See Also

- `agentskills-retrospective` skill — the full retrospective procedure
- `LEDGER.md` — where markers are written
- `routing-matrix.md` — where extracted lessons go
- `rules/prompt-as-training-signal.md` — doctrinal foundation
