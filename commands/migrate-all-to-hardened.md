---
description: Batch-migrate every hardened MCP server in mcp-servers/ from its original source to its hardened counterpart in one sweep
argument-hint: [--dry-run] [--skip=<csv>] [--continue-on-failure]
---

<!-- <SUBAGENT-STOP>: skip this skill when running inside a subagent. Meta-skills must not leak into spawned subagent contexts. -->
<SUBAGENT-STOP/>

Iterates over every `~/.claude/mcp-servers/*-hardened-mcp/` directory and runs `/migrate-to-hardened <base-name>` on each in sequence. Writes happen to `~/.claude.json` one server at a time — sequential execution avoids write collisions.

**When to use** — after `/prune-mcp-tools` + `/audit-tool-surface` have been run on multiple servers and you want to cut them all over in a single pass. Requires each `<base-name>-hardened-mcp/` directory to already be built and reviewed.

**Inputs**

- `--dry-run` — propagate `--dry-run` to each `/migrate-to-hardened` invocation. Prints the full plan for every server; no files are written, nothing is moved.
- `--skip=stripe,github` — comma-separated list of base names to exclude. Names are matched case-insensitively against the base name (i.e. the part before `-hardened-mcp`).
- `--continue-on-failure` — by default, any server whose smoke-test fails causes the batch to stop. This flag overrides that behavior and continues to the next server, collecting failures into the final summary.

---

## Pre-flight

### Step 0 — Parse flags

Extract from the invocation arguments:

- `DRY_RUN` — boolean, true if `--dry-run` is present.
- `SKIP_LIST` — string array, parsed from `--skip=<csv>` if present (split on `,`, trim, lowercase each entry). Empty array if `--skip` is absent.
- `CONTINUE_ON_FAILURE` — boolean, true if `--continue-on-failure` is present.

`--dry-run` and `--continue-on-failure` may be combined (dry-run always wins — no real work happens).

### Step 1 — Discover hardened servers

Glob `~/.claude/mcp-servers/*-hardened-mcp/`. Collect every matching directory. For each, derive the `BASE_NAME` by stripping the `-hardened-mcp` suffix.

If no directories match:

```
No hardened MCP servers found.
Expected: ~/.claude/mcp-servers/*-hardened-mcp/

Run /prune-mcp-tools on a server first to create a hardened version.
```

Exit 0 (not an error — nothing to do).

### Step 2 — Apply skip list

Remove any server from the list whose `BASE_NAME` (lowercased) appears in `SKIP_LIST`.

If `SKIP_LIST` is non-empty, print before the batch begins:

```
Skipping: {skip-list joined by ", "}
```

### Step 3 — Print batch plan

Always print the plan before executing anything:

```
migrate-all-to-hardened — {N} server(s) queued
{optional: "DRY RUN — no changes will be made"}
{optional: "Skipping: stripe, github"}

  Server queue:
    1. stripe
    2. bitwarden
    3. github
    ...

Processing sequentially (writes to ~/.claude.json require serial execution).
```

If `N == 0` after skip filtering:

```
All discovered servers are in the skip list. Nothing to migrate.
```

Exit 0.

---

## Batch execution

For each server in the queue (indexed 1..N), execute the following block **sequentially** — wait for each to complete before starting the next.

### Per-server block

#### Header

```
────────────────────────────────────────────────────────────
[{index}/{total}] Migrating: {BASE_NAME}
────────────────────────────────────────────────────────────
```

#### Invoke /migrate-to-hardened

Invoke `/migrate-to-hardened {BASE_NAME}` (append `--dry-run` if `DRY_RUN` is true).

Capture the outcome: **PASSED** (exit 0) or **FAILED** (exit 1 or smoke-test failure).

Record the per-server result for the summary table:

- `status` — PASSED | FAILED | SKIPPED
- `entry` — `HARDENED_ENTRY` path (from migrate-to-hardened's Step 3) on success; empty on failure
- `tool_count` — `HARDENED_TOOL_COUNT` on success; `—` on failure
- `error` — last error line from migrate-to-hardened on failure; empty on success

#### Failure handling

If the server FAILED and `CONTINUE_ON_FAILURE` is false:

```
✗ FAILED: {BASE_NAME}

Stopping batch — {BASE_NAME} failed its smoke-test (or a pre-flight check).
Fix the failure, then re-run:
  /migrate-to-hardened {BASE_NAME}          ← fix this one first
  /migrate-all-to-hardened --skip={already-migrated-csv}   ← resume the rest

To skip failures and continue anyway:
  /migrate-all-to-hardened --continue-on-failure
```

Print the summary table (partial — servers not yet attempted show as PENDING).
Exit 1.

If the server FAILED and `CONTINUE_ON_FAILURE` is true:

```
⚠ FAILED: {BASE_NAME} — continuing (--continue-on-failure is set)
```

Add to the failure list; continue to the next server.

#### Success

```
✓ PASSED: {BASE_NAME} ({HARDENED_TOOL_COUNT} tools)
```

---

## Final summary

After all servers have been processed (or after a fail-fast stop), print the summary table:

```
══════════════════════════════════════════════════════════════════
migrate-all-to-hardened — Summary
══════════════════════════════════════════════════════════════════

  Server          Status    Tools  Entry
  ──────────────  ────────  ─────  ──────────────────────────────────────────────────────────
  stripe          PASSED      12   ~/.claude/mcp-servers/stripe-hardened-mcp/mcp-server/dist/index.js
  bitwarden       PASSED       8   ~/.claude/mcp-servers/bitwarden-hardened-mcp/mcp-server/dist/index.js
  github          FAILED       —   (smoke-test failed: no response within 5s)
  sentry          PENDING      —   (not reached — batch stopped after github)

  Total: {passed} passed · {failed} failed · {skipped} skipped · {pending} not reached

{if all passed and not dry-run:}
  All servers migrated. Restart Claude Code to activate the hardened fleet.

{if any failed:}
  Fix failing servers, then re-run with --skip={passed-csv} to migrate the rest.

{if dry-run:}
  DRY RUN complete — no files were written or moved.
  Run without --dry-run to execute.
```

Status values in the table:

- `PASSED` — migrate-to-hardened exited 0
- `FAILED` — migrate-to-hardened exited non-zero
- `SKIPPED` — in SKIP_LIST
- `PENDING` — not reached due to fail-fast stop

---

## Dry-run mode

When `--dry-run` is active:

- Each `/migrate-to-hardened` invocation receives `--dry-run`.
- The summary table shows the planned actions, not actual results.
- No files are created, moved, or modified.
- `~/.claude.json` is never touched.
- The final line is always: `DRY RUN complete — no files were written or moved.`

---

## Examples

```
# Migrate all hardened servers (fail-fast on first failure)
/migrate-all-to-hardened

# Preview what would happen — no writes
/migrate-all-to-hardened --dry-run

# Skip stripe and github (already migrated)
/migrate-all-to-hardened --skip=stripe,github

# Migrate all, collect all failures, then review the summary
/migrate-all-to-hardened --continue-on-failure

# Dry-run, skip one, see the full plan
/migrate-all-to-hardened --dry-run --skip=stripe
```

---

**See**

- `commands/migrate-to-hardened.md` — single-server migration (this skill calls it per server)
- `commands/prune-mcp-tools.md` — create hardened versions before running this
- `commands/audit-tool-surface.md` — verify the tool surface after cutover
- `commands/audit-mcp-fleet.md` — confirm the full fleet is healthy after batch migration
- `rules/drift-detection.md` — unregistered hardened servers are drift
