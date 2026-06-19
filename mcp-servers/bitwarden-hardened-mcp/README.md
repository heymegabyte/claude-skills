# bitwarden-hardened-mcp

Hardened Bitwarden MCP server — derived from `mcp-servers/bitwarden-mcp/` (unhardened) with
full hardening scaffolds applied manually (Bitwarden's OpenAPI spec returns 404 at the canonical
URL, so the `forge --harden` path was unavailable; hardening was applied in Approach B).

**This version supersedes `mcp-servers/bitwarden-mcp/` (unhardened).**
Once you validate this server works with your auth/secrets, register THIS one in your
`.claude.json` and archive the unhardened `bitwarden-mcp/` directory.

## Why hardened?

The unhardened `bitwarden-mcp/` has:
- No input size limit — any-size args accepted, including crafted giant payloads
- No response size limit — multi-MB responses forwarded in full to Claude context
- No per-request timeout — slow Bitwarden API calls hang indefinitely
- Plain `z.object()` schemas — unknown keys silently passed through
- No audit trail — no visibility into what tools were called, when, by whom

This server adds all 7 hardening surfaces:

| Surface | Implementation |
|---|---|
| Resource limits | 64 KB args + 1 MB response hard caps per handler |
| Request timeout | 30s `AbortController` on every fetch via `fetchWithTimeout()` |
| Strict Zod schemas | `.strict()` on all 28 input schemas — unknown keys rejected |
| Rate-limiter scaffold | `src/rate-limiter.ts` — sliding-window DO (wire up when HTTP transport used) |
| Audit-log scaffold | `src/audit-log.ts` — D1-backed call log (wire up `AUDIT_DB` binding) |
| PII scrubber | `src/scrub-pii.ts` — redacts tokens/keys/cards/SSNs before audit logging |
| DB migration | `migrations/0001_mcp_tool_calls.sql` — audit table DDL |

## Tools (28 — no pruning)

All 28 tools from the Bitwarden Public API are retained:

- Items (vault ciphers): `list_items`, `get_item`, `edit_item`, `delete_item`, `create_item`
- Collections: `list_org_collections`, `create_org_collection`, `get_org_collection`, `edit_org_collection`, `delete_org_collection`
- Members: `list_org_members`, `invite_org_member`, `get_org_member`, `update_org_member`, `remove_org_member`, `reinvite_org_member`, `confirm_org_member`
- Groups: `list_org_groups`, `create_org_group`, `get_org_group`, `update_org_group`, `delete_org_group`, `get_org_group_member_ids`, `update_org_group_members`
- Events: `get_org_events`
- Policies: `list_org_policies`, `get_org_policy`, `update_org_policy`

## Setup

```bash
cd mcp-servers/bitwarden-hardened-mcp/mcp-server
npm install
npm run build
# Then register in .claude.json (see below)
```

## .claude.json registration

```json
{
  "mcpServers": {
    "bitwarden": {
      "command": "node",
      "args": ["/path/to/mcp-servers/bitwarden-hardened-mcp/mcp-server/dist/index.js"],
      "env": {
        "API_KEY": "<your-bitwarden-org-api-token>"
      }
    }
  }
}
```

## Environment variables

| Variable | Description |
|---|---|
| `API_KEY` | Bitwarden Organization API token (Bearer) — obtain from your Bitwarden org settings |

## Audit log (optional)

Wire up `AUDIT_DB` (a D1 database binding) and apply the migration to enable persistent
call logging:

```bash
wrangler d1 execute AUDIT_DB --file=migrations/0001_mcp_tool_calls.sql
```

Then import `withAuditLog` from `src/audit-log.ts` and wrap your tool handler. The PII
scrubber (`src/scrub-pii.ts`) should be applied to args before passing to `logToolCall`.

## Rate limiter (optional)

`src/rate-limiter.ts` is a scaffold for adding in-process rate limiting (e.g. token bucket
per tool name). Wire it up at the top of the `CallToolRequestSchema` handler when needed.
The Durable Object sliding-window pattern applies only to HTTP transport; for stdio, an
in-process `Map<string, number[]>` token bucket is sufficient.
