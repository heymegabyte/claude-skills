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

Claude Code's hook system intercepts tool calls via event name + optional matcher.
Getting either wrong silently no-ops the hook. This rule covers the correct pattern,
the wired matchers, and every anti-pattern observed in the wild.

---

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

- `PreToolUse` fires BEFORE Claude executes the tool — the hook can block or annotate.
- `PostToolUse` fires AFTER — suitable for side-effects (TDD enforcement, audit logging).
- `matcher` is a glob applied to `tool_name(tool_input)`. For Bash: `Bash(<command glob>)`.
- The trailing `*` in `Bash(git commit*)` matches `git commit -m "…"`, `git commit --amend`, etc.

---

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

---

## Glob syntax reference

- `Bash(git commit*)` — matches any `git commit ...` invocation
- `Bash(rm -rf*)` — matches `rm -rf /path`, `rm -rf .`
- `Bash(npm publish*)` — matches `npm publish`, `npm publish --access public`
- `Bash(wrangler deploy*)` — matches `wrangler deploy`, `wrangler deploy --env production`
- `Bash(git push --force*)` — matches force pushes (narrower than `git push*`)
- `Write|Edit|MultiEdit` — pipe-separated list, no spaces; matches any of the three write tools
- `Bash|WebFetch|WebSearch|mcp__.*` — pipe-separated + regex; `mcp__.*` matches ALL MCP tools

The glob is matched against the full string `ToolName(input)`. For Bash, `input` is the
entire shell command string passed to the tool.

---

## When to use Bash matcher vs Write/Edit/MultiEdit matcher

| Use case | Correct matcher | Wrong choice |
|---|---|---|
| Intercept a shell command (git, wrangler, rm) | `Bash(git commit*)` | `PreCommit` (does not exist) |
| Intercept file writes (new files) | `Write` | `Bash(*)` |
| Intercept file edits in-place | `Edit\|MultiEdit` | `Bash(*)` |
| Intercept ANY file mutation | `Write\|Edit\|MultiEdit` | `Bash(*)` |
| Intercept ANY tool | _(no matcher — omit field)_ | `Bash(*)` |
| Intercept deploy commands | `Bash(wrangler deploy*)` | `PostDeploy` (does not exist) |
| Intercept ALL bash (broad guard) | _(no matcher — omit field, match `Bash`)_ | `Bash(*)` |

---

## Anti-patterns

### 1. Invalid event names (CRITICAL — silent no-op)

These event names DO NOT EXIST in Claude Code's schema:

```
PreCommit      ← WRONG — does not exist
PostCommit     ← WRONG — does not exist
PostMerge      ← WRONG — does not exist
PrePush        ← WRONG — does not exist
PostDeploy     ← WRONG — does not exist
PreDeploy      ← WRONG — does not exist
```

The valid closed enum is:
`SessionStart | UserPromptSubmit | PreToolUse | PostToolUse | Stop | Notification`

A hook wired under `PreCommit` loads without error but NEVER fires. The failure is silent.
The canonical pattern for git commit interception is `PreToolUse` + `Bash(git commit*)`.

### 2. Over-broad matcher blocks everything

```json
{ "matcher": "Bash(*)" }   ← blocks EVERY shell command — permission prompt storm
```

Prefer the narrowest glob that captures your intent. Scope to the specific command prefix.

### 3. Under-specific matcher (no trailing wildcard)

```json
{ "matcher": "Bash(git commit)" }   ← matches ONLY the bare string "git commit"
```

A commit with a message `git commit -m "fix: typo"` won't match. Always use `*` suffix
unless you intentionally want an exact match.

### 4. Spaces in pipe-separated matchers

```json
{ "matcher": "Write | Edit | MultiEdit" }   ← spaces break the parser
{ "matcher": "Write|Edit|MultiEdit" }       ← correct
```

---

## Planned future matchers (not yet wired)

| Matcher | Hook purpose |
|---|---|
| `Bash(wrangler deploy*)` | Verify deploy is to correct environment, log deploy events |
| `Bash(rm -rf*)` | Confirm destructive recursive deletes, prevent accidental repo wipe |
| `Bash(git push --force*)` | Block force pushes to main, surface warning |
| `Bash(npm publish*)` | Pre-publish checklist: version bump, changelog entry, tests green |
| `Bash(git reset --hard*)` | Warn on destructive resets, require confirmation |

---

## Incident reference

During a loop iteration, an agent attempted to wire a `PreCommit` hook for
`customer-changelog-precommit.py`. The hook loaded without error but never fired because
`PreCommit` is not a valid Claude Code event name. The error was caught in-situ and
corrected to `PreToolUse` + `Bash(git commit*)`. The lesson extracted here is principle
#17 in `rules/principles-incident-log.md` and the hook now fires correctly on every commit.

---

## See also

- `[[ai-agent-security]]` — agent permission tiers; hooks are enforcement, not suggestion
- `[[autonomous-engineering]]` — hooks live at the "deterministic enforcement" layer (hooks > rules > skills > prompts)
- `[[secret-provisioning]]` — hooks that touch secrets must use `get-secret`, never inline
- `[[agent-permission-discipline]]` — complementary permission/allow-list patterns
