---
priority: high
pack: ai
triggers:
  - mcp tool naming
  - cross-server collision
  - audit-tool-surface reports duplicate
  - semantic overlap detected
  - /audit-tool-surface --fix
paths:
  - ~/.claude/mcp-servers/*/src/index.ts
  - ~/.claude/mcp-servers/*/mcp-server/src/index.ts
  - ~/.claude/settings.json
---

# MCP Namespace Discipline

Governs when to prefix MCP tool names with a server identifier — and when NOT to.

## Core Rule: never prefix at server-author time

- **Default:** write `create_customer`, not `stripe_create_customer`.
- Short clean names improve LLM tool-selection accuracy — `create_customer` is a closer match to "create a customer" than `stripe_create_customer`.
- Proactive prefixing bloats the tool surface, inflates the system prompt, and trains the model to ignore the prefix as noise.
- The MCP spec allows the consumer to alias or namespace tools at registration — that is the correct disambiguation layer.

## When to prefix: collision detected by `/audit-tool-surface`

Prefix exactly when `/audit-tool-surface` (see `commands/audit-tool-surface.md`) reports:

- **Exact duplicate** — same tool name registered in 2+ active servers.
- **Strong semantic overlap** — two tools share a canonical business-entity noun (`customer`, `payment`, `invoice`, `order`, `webhook`, `subscription`, `product`, `contact`, `message`) AND the same verb family (`_create`, `_get`, `_list`, `_update`, `_delete`, `_send`, `_search`) across servers in the same domain (e.g., two payment providers, two email providers).

All other overlaps (different domains, different verb families, different entity nouns) → report only, no rename.

## Which server to prefix: the secondary

- **Canonical** (keeps clean name) — the server with higher `daily_calls` over last 30 days from `~/.claude/mcp-usage.json`.
- **Secondary** (gets prefix) — the other server. Ties → alphabetical: the directory name that sorts **first** under `~/.claude/mcp-servers/` is canonical.

```
Example: stripe-hardened-mcp (840 daily_calls) vs square-mcp (120)
→ stripe keeps `create_customer`
→ square renamed to `square_create_customer`

Example: no usage data. resend-hardened-mcp vs sendgrid-mcp
→ resend-hardened-mcp sorts before sendgrid-mcp alphabetically
→ resend keeps `send_email`
→ sendgrid renamed to `sendgrid_send_email`
```

## Prefix format

```
{server_directory_name}_{original_tool_name}
```

- Use the **directory name** under `~/.claude/mcp-servers/`, not any display name from `plugin.json`.
- Strip any existing server-prefix from `original_tool_name` to avoid double-prefixing.
- Separator: `_` (underscore). No hyphens — tool names must be valid identifiers across all MCP clients.

## Anti-pattern: proactive mass-prefixing

```typescript
// BAD — proactive mass-prefixing
server.tool("stripe_customers_create", …)
server.tool("stripe_customers_retrieve", …)
server.tool("stripe_invoices_list", …)

// GOOD — clean names, no collisions detected
server.tool("customers_create", …)
server.tool("customers_retrieve", …)
server.tool("invoices_list", …)
```

When `/audit-tool-surface` reports zero duplicates and zero strong overlaps, every tool name is already correct — leave them alone.

## `/audit-tool-surface --fix` behavior

1. Identifies collisions (exact duplicates + strong semantic overlaps).
2. Determines canonical vs. secondary per heuristic above.
3. Rewrites the **secondary** server's `index.ts` in-place with the prefixed name.
4. Prints unified diff and requests confirmation before writing.
5. Does NOT touch canonical server's names.
6. Does NOT auto-fix weak semantic overlaps — those surface in the report only.

After `--fix`: **restart Claude Code** to reload the updated tool surface. Next `/audit-tool-surface` run should report zero exact duplicates.

## Decision flowchart

```
New MCP server being authored?
  └─ Use clean, unprefixed tool names. Done.

/audit-tool-surface reports a collision?
  └─ Exact duplicate or strong semantic overlap?
       ├─ No  → note in report, no rename needed.
       └─ Yes → identify secondary via traffic → alphabetical fallback.
                Prefix only the secondary's tool name.
                Run `/audit-tool-surface --fix` to apply.
```

## Worked examples

### Exact duplicate — two payment providers

- `stripe-hardened-mcp` (840 daily calls) + `square-mcp` (120) both register `create_customer`.
- Canonical: `stripe-hardened-mcp` → keeps `create_customer`.
- Secondary: `square-mcp` → renamed `square_create_customer`.

### Exact duplicate — no usage data

- `resend-hardened-mcp` + `sendgrid-mcp` both register `send_email`. No `mcp-usage.json`.
- Alphabetical: `resend-hardened-mcp` < `sendgrid-mcp` → resend is canonical.
- Secondary: `sendgrid-mcp` → renamed `sendgrid_send_email`.

### Strong semantic overlap

- `stripe-hardened-mcp` → `customers_create` / `square-mcp` → `customer_create`.
- Shared noun `customer`, same verb family `_create`, same domain payments. Stripe canonical (840 vs 120).
- Secondary rename: `square-mcp` → `square_customer_create`.

### Weak overlap — no action

- `bitwarden-hardened-mcp` → `items_list` / `resend-hardened-mcp` → `audiences_list`.
- Shared verb `_list`, but unrelated nouns and domains. Report only — no rename.

## Enforcement cadence

- After adding any new MCP server to `~/.claude/settings.json`.
- After running `/prune-mcp-tools` (tool surface may have shifted).
- Before any heavy session where >3 servers are active simultaneously.
- Whenever drift-detection flags a new tool registration in `index.ts` matching an existing tool name in another server.

## See

- `[[audit-tool-surface]]` — command that runs this analysis; `--fix` applies prefixes.
- `[[mcp-server-hardening]]` — hardening checklist including tool naming conventions.
- `[[file-target-disambiguation]]` — parallel concept: prefer specificity at call-site, not definition-time.
- `drift-detection` — duplicate tool names across servers are drift; fix in-turn.
