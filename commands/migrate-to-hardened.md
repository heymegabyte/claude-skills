---
description: Automate the unhardened → hardened MCP server cutover — build, smoke-test, register, and archive in one shot
argument-hint: <server-name> [--dry-run] [--rollback]
---

<!-- <SUBAGENT-STOP>: skip this skill when running inside a subagent. Meta-skills must not leak into spawned subagent contexts. -->
<SUBAGENT-STOP/>

Cuts over a local MCP server from its original (unpruned) source to its hardened counterpart. The hardened version has been pre-pruned per `/prune-mcp-tools` and pre-audited per `/audit-tool-surface`. This skill does the mechanical wiring: build → smoke → validate → register → archive.

**When to use** — after `<server-name>-hardened-mcp/` has been fully prepared and reviewed; before a session that depends on the pruned tool surface.

**Inputs**

- `<server-name>` — required. Base name of the MCP server (e.g. `stripe`, `bitwarden`). Resolves `~/.claude/mcp-servers/<server-name>-mcp/` (original) and `~/.claude/mcp-servers/<server-name>-hardened-mcp/` (hardened).
- `--dry-run` — print the full plan without executing any steps; no files written or moved.
- `--rollback` — reverse a completed cutover: un-archive the original, re-register it in `~/.claude.json`, remove the hardened registration. Requires the archive dir to exist.

---

## Pre-flight checks

1. `<server-name>` argument was provided. If missing:

   ```
   Usage: /migrate-to-hardened <server-name> [--dry-run] [--rollback]
   Example: /migrate-to-hardened stripe
   ```

   Exit 1.

2. `--dry-run` and `--rollback` cannot both be set. Exit 1: `--dry-run and --rollback are mutually exclusive.`

---

## ROLLBACK PATH (--rollback)

Execute rollback sequence and exit. Do not run forward migration.

### Rollback Step 1 — Locate the archive

Find `~/.claude/mcp-servers/<server-name>-mcp.archived-*`. Use most-recently-created if multiple. If none:

```
Rollback failed: no archive found for <server-name>.
Expected: ~/.claude/mcp-servers/<server-name>-mcp.archived-{timestamp}
Nothing was changed.
```

Exit 1.

### Rollback Step 2 — Un-archive

```bash
mv ~/.claude/mcp-servers/<server-name>-mcp.archived-{timestamp} \
   ~/.claude/mcp-servers/<server-name>-mcp
```

### Rollback Step 3 — Re-register original in ~/.claude.json

Read `~/.claude.json`. In `mcpServers`, find the hardened entry and replace its `args` path with:

```
~/.claude/mcp-servers/<server-name>-mcp/mcp-server/dist/index.js
```

Write `~/.claude.json` back.

### Rollback Step 4 — Confirm

```
Rollback complete.
  Restored:    ~/.claude/mcp-servers/<server-name>-mcp/
  Registered:  ~/.claude/mcp-servers/<server-name>-mcp/mcp-server/dist/index.js
  Hardened dir ~/.claude/mcp-servers/<server-name>-hardened-mcp/ is still present (not deleted).

Restart Claude Code to reload the original MCP server.
```

Exit 0.

---

## FORWARD MIGRATION PATH

Execute steps in sequence. On any failure, print the error, mark step FAILED, exit 1 without modifying `~/.claude.json` or archiving — leave the system in its prior state.

### Step 1 — Verify hardened directory exists

Check `~/.claude/mcp-servers/<server-name>-hardened-mcp/` exists. If not:

```
FAILED Step 1: hardened directory not found.
Expected: ~/.claude/mcp-servers/<server-name>-hardened-mcp/
Create it first by running /prune-mcp-tools on <server-name>.
```

Exit 1.

Verify `~/.claude/mcp-servers/<server-name>-mcp/` (original) exists. If not, warn but continue — original may already be archived from a partial prior run.

In `--dry-run` mode:

```
[DRY-RUN] Step 1 — Would verify: ~/.claude/mcp-servers/<server-name>-hardened-mcp/ ✓
```

### Step 2 — Build the hardened MCP server

Resolve the build root in order:

- `~/.claude/mcp-servers/<server-name>-hardened-mcp/mcp-server/` (standard layout)
- `~/.claude/mcp-servers/<server-name>-hardened-mcp/` (flat layout)

Build root must contain `package.json`. If neither has one:

```
FAILED Step 2: no package.json found in hardened directory.
Checked:
  ~/.claude/mcp-servers/<server-name>-hardened-mcp/mcp-server/package.json
  ~/.claude/mcp-servers/<server-name>-hardened-mcp/package.json
```

Run in detected build root:

```bash
npm install --prefer-offline 2>&1
npm run build 2>&1
```

On non-zero exit, print last 50 lines and exit 1:

```
FAILED Step 2: build failed.
--- last 50 lines ---
{captured output}
```

In `--dry-run` mode:

```
[DRY-RUN] Step 2 — Would run: cd <build-root> && npm install && npm run build
```

### Step 3 — Locate the built entry-point

Try in order: `<build-root>/dist/index.js` · `<build-root>/build/index.js` · `<build-root>/out/index.js`

If none exist after the build:

```
FAILED Step 3: built entry-point not found after npm run build.
Searched: dist/index.js · build/index.js · out/index.js
Check the build script in <build-root>/package.json.
```

Record the full path as `HARDENED_ENTRY`.

### Step 4 — Smoke-test the hardened server

Launch:

```bash
node {HARDENED_ENTRY} &
```

Wait up to 5 seconds for process to stabilize. Send JSON-RPC `tools/list` over stdio:

```json
{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}
```

Assert: responded within 5s · `result.tools` is non-empty · each tool has `name`. Kill process after check.

On failure:

```
FAILED Step 4: smoke-test failed.
  Process exited: {exit code or "still running but no response"}
  Response received: {raw response or "none"}
```

Exit 1. Record live tool count as `HARDENED_TOOL_COUNT`.

In `--dry-run` mode:

```
[DRY-RUN] Step 4 — Would smoke-test: node {HARDENED_ENTRY} (5s · assert tools/list non-empty)
```

### Step 5 — Compare tool count against pruned original

Read `~/.claude/mcp-servers/<server-name>-mcp/mcp-server/src/index.ts` (or flat layout). Count active tool registrations using `/audit-tool-surface` parse logic (skip pruned lines). Record as `ORIGINAL_ACTIVE_COUNT`.

If `HARDENED_TOOL_COUNT != ORIGINAL_ACTIVE_COUNT`, emit warning (not failure):

```
⚠ Tool count mismatch:
  Original active tools:  {ORIGINAL_ACTIVE_COUNT}
  Hardened live tools:    {HARDENED_TOOL_COUNT}
  Delta: {delta} ({sign})
  Proceeding — verify this is intentional (e.g. tools were pruned in hardened version).
```

If counts match: `✓ Tool count matches: {HARDENED_TOOL_COUNT} tools`

In `--dry-run` mode:

```
[DRY-RUN] Step 5 — Would compare tool counts (original active vs hardened live).
```

### Step 6 — Update ~/.claude.json registration

Read `~/.claude.json`. In `mcpServers`, find the entry whose `args` contains a path inside `<server-name>-mcp/`. If none, look for key `<server-name>` or `<server-name>-mcp`; if still not found, add a new entry keyed `<server-name>`.

Set:

```json
{
  "<server-name>": {
    "command": "node",
    "args": ["{HARDENED_ENTRY}"]
  }
}
```

Preserve all other existing fields (e.g. `env`, `timeout`). Only replace `args`. Write `~/.claude.json` back (pretty-print, 2-space indent).

In `--dry-run` mode:

```
[DRY-RUN] Step 6 — Would update ~/.claude.json:
  Key:  <server-name>
  args: ["{HARDENED_ENTRY}"]
```

### Step 7 — Archive the original

Timestamp suffix: `{YYYY}{MM}{DD}T{HH}{mm}{ss}` in local time (no colons).

```bash
mv ~/.claude/mcp-servers/<server-name>-mcp \
   ~/.claude/mcp-servers/<server-name>-mcp.archived-{timestamp}
```

If original does not exist, skip silently and note in confirmation.

In `--dry-run` mode:

```
[DRY-RUN] Step 7 — Would archive:
  ~/.claude/mcp-servers/<server-name>-mcp
  → ~/.claude/mcp-servers/<server-name>-mcp.archived-{timestamp}
```

### Step 8 — Print confirmation and rollback instructions

```
Migration complete — <server-name>
═══════════════════════════════════════════════

  Hardened entry:  {HARDENED_ENTRY}
  Tool count:      {HARDENED_TOOL_COUNT} active tools
  Registered in:   ~/.claude.json (key: <server-name>)
  Original archived: ~/.claude/mcp-servers/<server-name>-mcp.archived-{timestamp}

  Next step: restart Claude Code to activate the hardened server.

ROLLBACK (if anything breaks):
  /migrate-to-hardened <server-name> --rollback
  This restores the archived original and re-registers it in ~/.claude.json.
```

---

## Dry-run summary (--dry-run only)

```
DRY-RUN PLAN SUMMARY — <server-name>
  Step 1  Verify hardened dir exists
  Step 2  Build: cd <build-root> && npm install && npm run build
  Step 3  Locate built entry-point (dist/build/out)
  Step 4  Smoke-test: node {entry} → tools/list (5s timeout)
  Step 5  Compare tool counts
  Step 6  Update ~/.claude.json registration
  Step 7  Archive original → <server-name>-mcp.archived-{timestamp}

Run without --dry-run to execute.
```

---

**See**

- `commands/prune-mcp-tools.md` — create the hardened version before running this skill
- `commands/audit-tool-surface.md` — verify tool surface after cutover
- `commands/audit-mcp-fleet.md` — confirm the new server is healthy in the fleet registry
- `rules/drift-detection.md` — unregistered hardened servers are drift
