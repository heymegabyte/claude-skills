---
description: Validate ~/.claude/settings.json hooks block — event names, file existence, executability, matcher syntax; --fix repairs common issues
argument-hint: [--fix]
allowed-tools: Bash, Read, Edit
---

<!-- <SUBAGENT-STOP>: skip this skill when running inside a subagent. Meta-skills must not leak into spawned subagent contexts. -->
<SUBAGENT-STOP/>

Audit every hook entry in `~/.claude/settings.json` against the Claude Code spec. A misconfigured hook silently no-ops — bad event names, non-executable scripts, and malformed matchers all fail without feedback.

**Purpose** — catch wiring bugs before they silently swallow hooks.

**When to use** — after editing `settings.json`; after creating a new hook script; when a hook seems to not fire; on demand.

**Inputs** — `$ARGUMENTS`: pass `--fix` to attempt automated repairs (chmod +x, event rename suggestions). Without `--fix`, the audit is read-only.

---

## Step 1 — Parse settings.json

Read `~/.claude/settings.json`. Extract the `hooks` object.

Valid Claude Code hook event names (exact set — anything outside this list is invalid):

```
SessionStart  UserPromptSubmit  Stop  PreToolUse  PostToolUse  Notification
```

Common invalid names seen in the wild (rename → correct):

- `PreCommit` → not a Claude Code event (lefthook concern, not Claude)
- `PostMerge` → same
- `PrePush` → same
- `OnError` → not valid
- `AfterResponse` → not valid

Build the entry list: for each event key in `hooks`, for each entry object in its array, collect:

- `event` — the key name
- `matcher` — the entry's `matcher` field (PreToolUse/PostToolUse only; undefined for others)
- `hooks[]` — the inner `hooks` array, each with `type` + `command` (+ optional `timeout`, `async`)

---

## Step 2 — Validate each entry

For every inner hook command:

**A. Event name check**

- Is the outer key in the valid event set? FAIL if not.
- Emit suggested rename if the name matches a known-bad pattern.

**B. File extraction**

- Parse the `command` string to extract the script path. Common patterns:
  - `python3 $HOME/.claude/hooks/foo.py ...` → expand `$HOME` to the actual home dir
  - `bash $HOME/.claude/hooks/foo.sh ...`
  - `node $HOME/.claude/hooks/foo.mjs ...`
  - `$HOME/.claude/hooks/foo.sh ...` (direct exec)
- If the command invokes a system binary only (e.g., `echo`, `git`, `curl`) with no file path, skip file checks and mark as `system-command`.

**C. File existence check**

```bash
test -f <expanded-path> && echo EXISTS || echo MISSING
```

**D. Executability check** (for direct-exec and interpreter-invoked scripts alike)

```bash
test -x <expanded-path> && echo EXECUTABLE || echo NOT_EXECUTABLE
```

Note: interpreter-invoked scripts (`python3 foo.py`) don't NEED the executable bit, but it's still best practice. Flag `NOT_EXECUTABLE` as a WARNING (not FAIL) for interpreter-invoked scripts; flag as FAIL for direct-exec scripts.

**E. Matcher syntax check** (PreToolUse and PostToolUse entries only)

Valid matcher forms per Claude Code spec:

- Tool name: `Bash`, `Write`, `Edit`, `Read`, `Glob`, `Grep`, `mcp__<server>__<tool>`
- Pipe-OR: `Bash|Write|Edit`
- Glob pattern inside parens: `Bash(git commit*)`, `Bash(npm run *)`
- Wildcard: `mcp__.*` (regex-style dot-star)
- Combined: `Bash|WebFetch|mcp__.*`

Flag as FAIL if:

- Matcher is an empty string
- Matcher uses `&&` or `,` as separators (wrong — use `|`)
- Matcher has unbalanced parens
- Matcher references a tool name with a typo (e.g., `Writes` instead of `Write`)

---

## Step 3 — Emit structured report

```
Hook Wiring Audit — ~/.claude/settings.json
════════════════════════════════════════════

SUMMARY
  Total hook entries:  14
  PASS:                11
  WARN:                 1
  FAIL:                 2

SessionStart
  ✓ session-start-reminders.py   EXISTS  EXECUTABLE  (no matcher)
  ✓ session-start-router.py      EXISTS  EXECUTABLE  (no matcher)

UserPromptSubmit
  ✓ sync-desktop-skills.py       EXISTS  EXECUTABLE  (no matcher)
  ✓ userpromptsubmit-router.py   EXISTS  EXECUTABLE  (no matcher)

Stop
  ✓ sync-desktop-skills.py       EXISTS  EXECUTABLE  (no matcher)
  ✓ stop-skill-tracker.py        EXISTS  EXECUTABLE  (no matcher)

PreToolUse
  ✓ pretooluse-router.py         EXISTS  EXECUTABLE  matcher: "Bash|WebFetch|WebSearch|mcp__.*" ✓
  ✗ on-write-guard.py            MISSING             matcher: "Write|Edit"
    → Fix: create file or remove this entry
  ~ skill-security-auditor.py    EXISTS  NOT_EXEC    matcher: "Write|Edit|MultiEdit" ✓
    → WARN: chmod +x ~/.claude/hooks/skill-security-auditor.py

PostToolUse
  ✓ enforce-tdd-e2e.py           EXISTS  EXECUTABLE  matcher: "Write|Edit|MultiEdit" ✓

INVALID EVENTS (rename required)
  ✗ "PreCommit" is not a valid Claude Code hook event
    → Not a Claude event — use lefthook for git hooks. Remove or migrate.

ACTIONABLE FIXES
  [FAIL] PreToolUse › on-write-guard.py — file does not exist
    → Delete the entry from settings.json, or create the missing script
  [FAIL] hooks["PreCommit"] — invalid event name
    → Remove this block; wire git pre-commit in lefthook.yml instead
  [WARN] PreToolUse › skill-security-auditor.py — not executable
    → Run: chmod +x ~/.claude/hooks/skill-security-auditor.py
```

---

## Step 4 — --fix mode (only when $ARGUMENTS contains --fix)

For each WARN (not executable, interpreter-invoked):

```bash
chmod +x <path>
echo "  → chmod +x applied: <path>"
```

For each FAIL (invalid event name): print the exact JSON path + suggested action but DO NOT auto-edit — event renames require human judgment. Print:

```
  → Manual fix needed: remove or rename hooks["<BadEvent>"] in ~/.claude/settings.json
  → See: rules/bash-matcher-guardrails.md for valid event set
```

For each FAIL (missing file): print:

```
  → Script not found: <path>
  → Either create the file or remove this hook entry
```

After applying any chmod fixes, re-run existence + executability checks to confirm green:

```bash
test -x <path> && echo "  ✓ confirmed executable" || echo "  ✗ still not executable"
```

Emit final: `--fix complete: N warnings resolved. M failures require manual action.`

---

## Step 5 — Summary verdict

- All PASS + no WARN → `✓ hooks wiring clean`
- Any WARN → `~ hooks wiring has warnings — review above`
- Any FAIL → `✗ hooks wiring has failures — fix before relying on hooks`

---

**Verification** — After manual fixes, re-run `/audit-hook-wiring` without `--fix` to confirm clean.

**See**

- `rules/bash-matcher-guardrails.md` — valid event set, matcher syntax, common pitfalls
- `rules/drift-detection.md` — hook wiring drift is a class of config drift
- `/drift-check` — broader config + doc drift sweep
