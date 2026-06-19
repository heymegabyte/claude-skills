# square-hardened-mcp

Hardened Square MCP server — forged from the Square OpenAPI spec with `--harden`, then
pruned to 50 high-value tools using the same allowlist as `square-mcp/`.

**This version supersedes `mcp-servers/square-mcp/` (unhardened).**
Once you validate this server works with your auth/secrets, register THIS one in your
`.claude.json` and archive the unhardened `square-mcp/` directory.

## Why hardened?

The unhardened `square-mcp/` has:
- No input size limit — any-size args accepted, including crafted giant payloads
- No response size limit — multi-MB responses forwarded in full to Claude context
- No per-request timeout — slow Square calls hang indefinitely
- Plain `z.object()` schemas — unknown keys silently passed through
- No audit trail — no visibility into what tools were called, when, by whom

This server adds all 7 hardening surfaces:

| Surface | Implementation |
|---|---|
| Resource limits | 64KB args + 1MB response hard caps per handler |
| Request timeout | 30s `AbortController` on every fetch |
| Strict Zod schemas | `.strict()` on all 50 input schemas — unknown keys rejected |
| Rate-limiter scaffold | `src/rate-limiter.ts` — sliding-window DO (wire up when HTTP transport used) |
| Audit-log scaffold | `src/audit-log.ts` — D1-backed call log (wire up AUDIT_DB binding) |
| PII scrubber | `src/scrub-pii.ts` — redacts tokens/keys/cards/SSNs before audit logging |
| DB migration | `migrations/0001_mcp_tool_calls.sql` — audit table DDL |

## Tools (50 — pruned from 328)

Kept tools match `mcp-servers/square-mcp/.mcp-prune-rules.json` allowlist:

- **Customers**: `CreateCustomer`, `RetrieveCustomer`, `UpdateCustomer`, `DeleteCustomer`, `SearchCustomers`, `ListCustomers`, `BulkCreateCustomers`, `BulkUpdateCustomers`
- **Catalog**: `BatchRetrieveCatalogObjects`, `SearchCatalogItems`, `SearchCatalogObjects`, `UpsertCatalogObject`, `DeleteCatalogObject`, `RetrieveCatalogObject`, `ListCatalog`
- **Orders**: `CreateOrder`, `RetrieveOrder`, `UpdateOrder`, `CalculateOrder`, `SearchOrders`, `BatchRetrieveOrders`
- **Payments**: `CreatePayment`, `GetPayment`, `ListPayments`, `RefundPayment`
- **Loyalty**: `RetrieveLoyaltyProgram`, `ListLoyaltyPrograms`, `CreateLoyaltyAccount`, `RetrieveLoyaltyAccount`, `SearchLoyaltyAccounts`, `AccumulateLoyaltyPoints`, `RedeemLoyaltyReward`, `CreateLoyaltyReward`
- **Bookings**: `CreateBooking`, `RetrieveBooking`, `UpdateBooking`, `CancelBooking`, `ListBookings`, `SearchAvailability`
- **Webhooks**: `CreateWebhookSubscription`, `ListWebhookSubscriptions`, `RetrieveWebhookSubscription`, `UpdateWebhookSubscription`, `DeleteWebhookSubscription`, `TestWebhookSubscription`
- **Locations**: `ListLocations`, `RetrieveLocation`
- **Inventory**: `BatchRetrieveInventoryCounts`, `RetrieveInventoryCount`, `BatchChangeInventory`

## Setup

```bash
cd mcp-servers/square-hardened-mcp/mcp-server
npm install
npm run build
# Then register in .claude.json (see below)
```

## .claude.json registration

```json
{
  "mcpServers": {
    "square-hardened-mcp": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "API_KEY": "<your-square-access-token>"
      }
    }
  }
}
```

Replace `<your-square-access-token>` with your Square access token (starts with `EAA`).

## Auth note

Set `API_KEY` env var to your Square access token. The server passes it as
`Authorization: Bearer $API_KEY` on every request. For production, use
`wrangler secret put` or your secrets manager rather than plain env.

## Re-generate

```bash
node ~/.claude/plugins/heymegabyte-claude-skills/bin/forge-skill-from-openapi.mjs \
  https://raw.githubusercontent.com/square/connect-api-specification/master/api.json \
  mcp-servers/square-hardened-mcp \
  --name square-hardened-mcp \
  --target mcp-server \
  --transport stdio \
  --harden
```

Then re-apply the prune rules from `.mcp-prune-rules.json` using the pruning script pattern.

## Migrating from square-mcp/

1. Build and test this server: `npm install && npm run build`
2. Verify with MCP inspector: `npx @modelcontextprotocol/inspector node dist/index.js`
3. Update `.claude.json` to point at this server (change `square-mcp` → `square-hardened-mcp` in args path)
4. Confirm tools list in Claude Code with `/mcp` command
5. Archive `mcp-servers/square-mcp/` once satisfied: `mv mcp-servers/square-mcp mcp-servers/square-mcp-archived`

The unhardened `mcp-servers/square-mcp/` is kept side-by-side for rollback reference only.
Do not register both simultaneously — duplicate tool names will cause conflicts.

## Generated

2026-06-18 by forge-skill-from-openapi --harden.
Spec: Square Connect API v2.0 (328 total paths, pruned to 50).
