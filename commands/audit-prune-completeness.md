---
description: Catch the github-mcp class of bug — CallTools handlers that exist but are invisible to Claude because ListTools never advertises them (orphaned), or ListTools entries that have no handler (zombies)
argument-hint: [--fix]
---

<!-- <SUBAGENT-STOP>: skip this skill when running inside a subagent. Meta-skills must not leak into spawned subagent contexts. -->
<SUBAGENT-STOP/>

After every prune or forge, ListTools and CallTools can drift apart:

- **Orphaned handler** — `case`/`if` branch exists in CallTools but absent from ListTools. Claude can never discover these tools.
- **Zombie list entry** — tool appears in ListTools but has no CallTools handler; every call fails at runtime.

Both are invisible to TypeScript compilation.

**When to use** — after `/prune-mcp-tools`; after `/forge-from-openapi`; after any manual edit to `*-mcp/mcp-server/src/index.ts`; as a CI gate.

**Inputs**

- `--fix` — orphaned handlers only: wrap each in `if (false /* pruned: orphaned */ && …)`. Zombies are reported only — they require a handler before auto-fix.

---

## Step 1 — Discover server source files

Glob for every MCP server entry-point:

```
~/.claude/plugins/heymegabyte-claude-skills/mcp-servers/*/mcp-server/src/index.ts
```

Also accept:

```
~/.claude/plugins/heymegabyte-claude-skills/mcp-servers/*/src/index.ts
~/.claude/plugins/heymegabyte-claude-skills/mcp-servers/*/index.ts
```

Collect `(server_name, file_path)` pairs where `server_name` is the directory under `mcp-servers/`. If none found, print `No MCP server source trees found. Nothing to audit.` and exit.

---

## Step 2 — Parse each server

**Pattern A — `setRequestHandler` (GitHub-style)**

- **ListTools active names**: extract `"name": "tool-name"` pairs from the `setRequestHandler(ListToolsRequestSchema, …)` block; skip any entry inside an `if (false` line.
- **CallTools live handlers**: scan `setRequestHandler(CallToolRequestSchema, …)` for `request.params.name === "…"` and `case "…":` patterns; a handler is LIVE only when its line does NOT carry an `if (false` prefix guard.

**Pattern B — `server.tool()` (SDK style)**

- **Advertised names**: first arg of each `server.tool("name", …)` call, excluding `if (false` blocks.
- **Handler presence**: fourth arg must be a function expression. SDK pattern colocates handler with registration — orphans cannot arise. Skip orphan/zombie checks; report as `N/A`.

Build per-server:

```
advertised: Set<string>   // names in ListTools
live:       Set<string>   // names with a live CallTools handler
```

---

## Step 3 — Classify discrepancies

```
orphaned = live − advertised        // handler exists, ListTools doesn't advertise
zombies  = advertised − live        // ListTools advertises, no handler exists
clean    = advertised ∩ live        // correctly paired
```

---

## Step 4 — Per-server report

```
### stripe-hardened-mcp

| Category  | Count | Tool names (first 10)                              |
|-----------|-------|----------------------------------------------------|
| Active    |    14 | customers_create, customers_retrieve, …            |
| Orphaned  |     0 | —                                                  |
| Zombies   |     0 | —                                                  |
| Status    |    ✓  | Clean                                              |
```

```
### github-mcp

| Category  | Count | Tool names (first 10)                                        |
|-----------|-------|--------------------------------------------------------------|
| Active    |    57 | issues/list, orgs/get, repos/get, …                          |
| Orphaned  |  1134 | meta/root, security-advisories/list-global-advisories, …     |
| Zombies   |     0 | —                                                            |
| Status    |    ✗  | Fix required — run /audit-prune-completeness --fix           |
```

If orphaned > 10, show first 10 followed by `… and N more`.

---

## Step 5 — Summary table

```
## Summary

| Server                 | Active | Orphaned | Zombies | Status |
|------------------------|--------|----------|---------|--------|
| bitwarden-hardened-mcp |     22 |        0 |       0 |   ✓    |
| github-mcp             |     57 |     1134 |       0 |   ✗    |
| stripe-mcp             |    555 |        0 |     555 |   ✗    |
| …                      |    …   |        …  |       … |   …    |

TOTAL  N servers · M orphaned · P zombies
```

Followed by `STATUS  PASS` (all clean) or `STATUS  FAIL  (N server(s) have orphaned or zombie tools)`.

---

## Step 6 — Suggested actions

**Orphaned handlers** (handler exists, tool not advertised):

> Options:
>
> 1. **Silence** (recommended when intentionally pruned): run `/audit-prune-completeness --fix`.
> 2. **Re-advertise**: add each orphaned tool back to the ListTools array.
> 3. **Delete**: manually remove each orphaned handler block.

**Zombie list entries** (tool advertised, no handler):

> Options:
>
> 1. **Write handlers**: implement each missing handler in CallTools.
> 2. **Remove from ListTools**: delete each zombie entry and add `if (false /* pruned: no-handler */ && …)` guard.

---

## Step 7 — Apply fix (--fix only)

If `--fix` NOT set, print:

```
Run with --fix to auto-guard orphaned handlers.
Zombie list entries require manual handler implementation and are never auto-fixed.
```

If `--fix` set:

1. For each server with orphaned handlers: read `index.ts`; for each orphaned name locate `if (request.params.name === "TOOL_NAME") {`; skip if already inside `if (false` (idempotent).
2. Replace opening line with:

   ```
       if (false /* pruned: orphaned during audit-prune-completeness */ && request.params.name === "TOOL_NAME") {
   ```

3. Write file in-place.
4. Re-run parse phase; verify orphan count dropped to 0 for each fixed server.
5. Print per-file diff summary (lines changed, not full diff).
6. Print `Fixed N orphaned handlers across M servers.`
7. Remind: `Restart the MCP server process to reload the updated tool surface.`

Do NOT auto-fix zombies — they require human judgment.

---

## Implementation notes

- **Dead-code detection** — a line containing `if (false` is a pruned guard. Simpler and more reliable than brace-depth tracking. Matches the forge pattern where guard and `request.params.name` check always appear on the same line.
- **Idempotency** — before wrapping, check the target line doesn't already start with `if (false`. Skip with note: `already guarded — skipped`.
- **`case` vs `if` pattern** — `case "tool-name":` branches inside a `switch(request.params.name)` cannot be individually guarded. When orphaned, convert to `if (false /* pruned */ && request.params.name === "…") { … }` outside the switch. Flag separately: `N case-branch orphans converted to if-false guards`.
- **SDK-pattern servers** — print `N/A — SDK server.tool() pattern; orphan/zombie drift impossible`.

---

## See

- `bin/validate-mcp-tools.mjs` — canonical static validator; this command extends its orphan/zombie logic with human-readable output and `--fix` mode
- `commands/audit-tool-surface.md` — cross-server duplicate and semantic overlap detection
- `commands/prune-mcp-tools.md` — remove low-value tools from ListTools before running this audit
- `rules/drift-detection.md` — orphaned handlers and zombie entries are drift, fixed in-turn
