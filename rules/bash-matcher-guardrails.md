---
name: "bash-matcher-guardrails"
priority: 1
pack: "ai"
triggers:
  - "PreToolUse"
  - "PostToolUse"
  - "hook matcher"
  - "Bash matcher"
  - "git commit hook"
  - "wrangler deploy hook"
  - "pre-commit hook"
  - "claude hook"
  - "settings.json hook"
paths:
  - "~/.claude/settings.json"
  - "~/.claude/hooks/**"
  - ".claude/settings.json"
---

# Bash Matcher Guardrails

Claude Code hooks intercept tool calls via event name + optional matcher. Wrong event name or matcher = silent no-op.

## Canonical pattern: `PreToolUse` with `Bash(<glob>)`

```json
{
  "PreToolUse": [
    {
      "matcher": "Bash(git commit*)",
      "hooks": [{ "type": "command", "command": "python3 ~/.claude/hooks/my-hook.py" }]
    }
  ]
}
```

- `PreToolUse` fires BEFORE Claude executes — hook can block or annotate.
- `PostToolUse` fires AFTER — suitable for side-effects (TDD enforcement, audit logging).
- `matcher` is a glob applied to `tool_name(tool_input)`. For Bash: `Bash(<command glob>)`.
- Trailing `*` in `Bash(git commit*)` matches `git commit -m "…"`, `git commit --amend`, etc.

## Currently wired matchers (from `~/.claude/settings.json`)

| Event | Matcher | Hook | Purpose |
|---|---|---|---|
| `PreToolUse` | `Bash\|WebFetch\|WebSearch\|mcp__.*` | `pretooluse-router.py` | General pre-tool routing/guard |
| `PreToolUse` | `Write\|Edit\|MultiEdit` | `skill-security-auditor.py` | Block writes to protected skill files |
| `PreToolUse` | `Write\|Edit\|MultiEdit` | `config-protection.py` | Protect `.claude/settings.json` from unsafe edits |
| `PreToolUse` | `Bash(git commit*)` | `customer-changelog-precommit.py` | Enforce customer changelog on every commit |
| `PostToolUse` | `Write\|Edit\|MultiEdit` | `enforce-tdd-e2e.py` | Warn when component/route missing matching E2E spec |
| `Stop` | _(none)_ | `sync-desktop-skills.py` | Sync skill manifests to desktop |
| `Stop` | _(none)_ | `stop-skill-tracker.py` | Track session stop event |
| `UserPromptSubmit` | _(none)_ | `sync-desktop-skills.py` | Sync skills on each prompt |
| `UserPromptSubmit` | _(none)_ | `userpromptsubmit-router.py` | Route user prompts |
| `SessionStart` | _(none)_ | `session-start-reminders.py` | SUPREME-rule reminder |
| `SessionStart` | _(none)_ | `session-start-router.py` | Session start routing |

## Glob syntax reference

- `Bash(git commit*)` — any `git commit ...` invocation
- `Bash(rm -rf*)` — `rm -rf /path`, `rm -rf .`
- `Bash(npm publish*)` — `npm publish`, `npm publish --access public`
- `Bash(wrangler deploy*)` — `wrangler deploy`, `wrangler deploy --env production`
- `Bash(git push --force*)` — force pushes (narrower than `git push*`)
- `Write|Edit|MultiEdit` — pipe-separated, no spaces; matches any of the three write tools
- `Bash|WebFetch|WebSearch|mcp__.*` — pipe-separated + regex; `mcp__.*` matches ALL MCP tools
- Glob is matched against the full string `ToolName(input)`. For Bash, `input` = the entire shell command string.

## Matcher selection

- Shell command (git, wrangler, rm) → `Bash(git commit*)` not `PreCommit` (does not exist)
- New file writes → `Write` not `Bash(*)`
- In-place file edits → `Edit|MultiEdit` not `Bash(*)`
- ANY file mutation → `Write|Edit|MultiEdit`
- ANY tool → omit matcher field entirely
- Deploy commands → `Bash(wrangler deploy*)` not `PostDeploy` (does not exist)
- Broad bash guard → omit matcher, match `Bash`

## Anti-patterns

### 1. Invalid event names (CRITICAL — silent no-op)

These event names DO NOT EXIST in Claude Code's schema:

```
PreCommit      ← WRONG
PostCommit     ← WRONG
PostMerge      ← WRONG
PrePush        ← WRONG
PostDeploy     ← WRONG
PreDeploy      ← WRONG
```

Valid closed enum: `SessionStart | UserPromptSubmit | PreToolUse | PostToolUse | Stop | Notification`

A hook wired under `PreCommit` loads without error but NEVER fires. Use `PreToolUse` + `Bash(git commit*)`.

### 2. Over-broad matcher

```json
{ "matcher": "Bash(*)" }
```

Blocks EVERY shell command — permission prompt storm. Scope to the specific command prefix.

### 3. Missing trailing wildcard

```json
{ "matcher": "Bash(git commit)" }
```

Matches ONLY the bare string `"git commit"`. A commit with `-m "fix: typo"` won't match. Always use `*` suffix unless exact match is intentional.

### 4. Spaces in pipe-separated matchers

```json
{ "matcher": "Write | Edit | MultiEdit" }
```

Spaces break the parser. Correct: `Write|Edit|MultiEdit`.

## Planned future matchers (not yet wired)

| Matcher | Hook purpose |
|---|---|
| `Bash(wrangler deploy*)` | Verify deploy environment, log deploy events |
| `Bash(rm -rf*)` | Confirm destructive recursive deletes |
| `Bash(git push --force*)` | Block force pushes to main |
| `Bash(npm publish*)` | Pre-publish checklist: version bump, changelog, tests green |
| `Bash(git reset --hard*)` | Warn on destructive resets |

## Incident reference

An agent wired `PreCommit` for `customer-changelog-precommit.py`. Hook loaded without error but never fired. Corrected to `PreToolUse` + `Bash(git commit*)`. Documented as principle 17 in `rules/principles-incident-log.md`.

## See also

- `[[ai-agent-security]]` — agent permission tiers; hooks are enforcement, not suggestion
- `[[autonomous-engineering]]` — hooks live at "deterministic enforcement" layer (hooks > rules > skills > prompts)
- `[[secret-provisioning]]` — hooks touching secrets must use `get-secret`, never inline
- `[[agent-permission-discipline]]` — complementary permission/allow-list patterns
