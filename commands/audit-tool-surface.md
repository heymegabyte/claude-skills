---
description: List every active tool across all MCP servers and flag cross-MCP duplicates and semantic overlaps
argument-hint: [--fix]
---

<!-- <SUBAGENT-STOP>: skip this skill when running inside a subagent. Meta-skills must not leak into spawned subagent contexts. -->
<SUBAGENT-STOP/>

Audit the active tool surface across every local MCP server. Exact duplicates (same tool name in 2+ servers) confuse Claude — it cannot choose which to call. Semantic overlaps (e.g. `stripe.createCustomer` + `square.createCustomer`) cause routing ambiguity at prompt time.

**When to use** — after adding or pruning any MCP server; after `/prune-mcp-tools`; before a heavy session to confirm the surface is clean.

**Inputs**

- `--fix` — rewrite duplicate tool names in-source with a server-prefix (`customers_create` → `stripe_customers_create`). Prints a diff preview and asks for confirmation before writing.

---

## Step 1 — Discover MCP server source trees

Glob for every MCP server entry-point:

```
~/.claude/mcp-servers/*/mcp-server/src/index.ts
```

Also check alternates:

```
~/.claude/mcp-servers/*/src/index.ts
~/.claude/mcp-servers/*/index.ts
```

Collect unique `(server_name, file_path)` pairs where `server_name` is the directory one level below `mcp-servers/`. If none found, emit:

```
No MCP server source trees found under ~/.claude/mcp-servers/
Nothing to audit.
```

Exit 0.

---

## Step 2 — Parse active tool names per server

Extract tool registration calls:

```typescript
server.tool("tool_name", …)
server.addTool({ name: "tool_name", … })
tool("tool_name", …)
```

**Skip pruned tools** — exclude registrations whose line or immediately-preceding comment matches:

- `// pruned:`
- `if (false /* pruned */`
- `/* pruned */`
- Lines commented out with `//` containing a tool registration pattern

Build:

```
tool_registry: Map<tool_name: string, servers: string[]>
```

---

## Step 3 — Identify exact duplicates

A **duplicate** is any tool name where `servers.length >= 2`. Collect into:

```
duplicates: { tool_name: string; servers: string[] }[]
```

Sorted alphabetically by `tool_name`.

---

## Step 4 — Identify semantic overlaps

A **semantic overlap** is a pair of tools in different servers that are functionally equivalent but have different names. Apply heuristics in order, stop at first match:

1. **Common-suffix match** — both names end in the same verb stem (`_create`, `_list`, `_get`, `_delete`, `_update`, `_send`, `_search`) and their prefixes are synonymous providers (payment: `stripe`/`square`; storage: `r2`/`s3`/`storage`; messaging: `resend`/`sendgrid`/`gmail`/`smtp`).
2. **Edit-distance ≤2** — after stripping server-name prefix, remaining token pairs have Levenshtein distance ≤ 2; only flag across different servers.
3. **Shared noun across verb families** — e.g. `stripe_customer_create` + `square_customer_upsert` share `customer`. Flag when shared noun is a canonical entity: `customer`, `invoice`, `order`, `payment`, `webhook`, `subscription`, `product`, `contact`, `message`.

Collect into:

```
overlaps: { tool_a: string; server_a: string; tool_b: string; server_b: string; reason: string }[]
```

---

## Step 5 — Emit the report

### Active Tools by Server

One table per server:

```
### stripe-hardened-mcp (14 active tools)

| Tool name              | Source line |
|------------------------|-------------|
| customers_create       | index.ts:42 |
| customers_retrieve     | index.ts:58 |
| …                      | …           |
```

### Exact Duplicates (routing ambiguity — fix required)

```
| Tool name          | Registered in                          |
|--------------------|----------------------------------------|
| webhook_send       | resend-hardened-mcp, sendgrid-mcp      |
| customer_get       | stripe-hardened-mcp, square-mcp        |
```

If none: `✓ No exact duplicates found.`

### Semantic Overlaps (review recommended)

```
| Tool A                  | Server A          | Tool B                   | Server B    | Reason                    |
|-------------------------|-------------------|--------------------------|-------------|---------------------------|
| stripe_customer_create  | stripe-hardened   | square_customer_create   | square-mcp  | Shared noun: customer     |
| email_send              | resend-hardened   | message_send             | sendgrid    | Edit-distance ≤ 2 on stem |
```

If none: `✓ No semantic overlaps detected.`

### Suggested Deduplication Actions

For each duplicate, suggest one of:

- **Prefix-rename** — prefix both with server name; lowest-risk; check `~/.claude/mcp-registry.json` `known_tools` for recency.
- **Remove from secondary server** — when one version is clearly redundant (same provider, older API, identical schema).
- **Consolidate into a router tool** — when input/output schemas are identical, a thin wrapper with a `provider` param reduces surface without losing capability.

For each semantic overlap, suggest:

- **Rename one** to make provider unambiguous (e.g. `send_email` → `resend_send_email`).
- **Document the distinction** — if both are intentionally distinct, add a `description` explaining when to use each.

```
| Issue                            | Type             | Suggested Action                                    |
|----------------------------------|------------------|-----------------------------------------------------|
| webhook_send (2 servers)         | Exact duplicate  | Prefix-rename: resend_webhook_send, sg_webhook_send |
| stripe vs square customer_create | Semantic overlap | Rename square version: square_customer_create       |
```

---

## Step 6 — Apply fixes (--fix only)

If `--fix` NOT set, print:

```
Run with --fix to auto-prefix duplicate tool names.
```

If `--fix` set:

1. For each exact duplicate, construct prefixed name: `{server_name}_{tool_name}` (strip existing server-prefix to avoid double-prefixing).
2. Open each affected `index.ts`, locate registration line(s), replace name string literal in-place.
3. Print unified diff of each changed file (first 60 lines of diff).
4. Ask: `Apply these renames? [y/N]` — if not `y`/`yes`, abort with `No changes written.`
5. On confirmation, write all files; print count of files modified and tool names changed.
6. Remind: `Restart Claude Code to reload the updated MCP tool surface.`

Do NOT auto-fix semantic overlaps — surface in report only.

---

## Step 7 — Summary line

```
AUDIT: {total_tools} active tools · {total_servers} servers · {dup_count} duplicates · {overlap_count} overlaps
```

---

**See**

- `commands/prune-mcp-tools.md` — remove low-value tools from source before auditing
- `commands/migrate-to-hardened.md` — cut over to a hardened MCP server with correct tool names
- `rules/drift-detection.md` — duplicate tool names are drift, fixed in-turn
