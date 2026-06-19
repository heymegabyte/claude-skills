# stripe-hardened-mcp

Hardened Stripe MCP server — forged from the Stripe OpenAPI spec with `--harden`, then
pruned to 37 high-value tools using the same allowlist as `stripe-mcp/`.

**This version supersedes `mcp-servers/stripe-mcp/` (unhardened).**
Once you validate this server works with your auth/secrets, register THIS one in your
`.claude.json` and archive the unhardened `stripe-mcp/` directory.

## Why hardened?

The unhardened `stripe-mcp/` has:
- No input size limit — any-size args accepted, including crafted giant payloads
- No response size limit — multi-MB responses forwarded in full to Claude context
- No per-request timeout — slow Stripe calls hang indefinitely
- Plain `z.object()` schemas — unknown keys silently passed through
- No audit trail — no visibility into what tools were called, when, by whom

This server adds all 7 hardening surfaces:

| Surface | Implementation |
|---|---|
| Resource limits | 64KB args + 1MB response hard caps per handler |
| Request timeout | 30s `AbortController` on every fetch |
| Strict Zod schemas | `.strict()` on all 37 input schemas — unknown keys rejected |
| Rate-limiter scaffold | `src/rate-limiter.ts` — sliding-window DO (wire up when HTTP transport used) |
| Audit-log scaffold | `src/audit-log.ts` — D1-backed call log (wire up AUDIT_DB binding) |
| PII scrubber | `src/scrub-pii.ts` — redacts tokens/keys/cards/SSNs before audit logging |
| DB migration | `migrations/0001_mcp_tool_calls.sql` — audit table DDL |

## Tools (37 — pruned from 587)

Kept tools match `mcp-servers/stripe-mcp/.mcp-prune-rules.json` allowlist:

- Customers: `GetCustomers`, `PostCustomers`, `GetCustomersCustomer`, `PostCustomersCustomer`, `DeleteCustomersCustomer`
- PaymentIntents: `GetPaymentIntents`, `PostPaymentIntents`, `GetPaymentIntentsIntent`, `PostPaymentIntentsIntentConfirm`, `PostPaymentIntentsIntentCancel`
- Subscriptions: `GetSubscriptions`, `PostSubscriptions`, `PostSubscriptionsSubscriptionExposedId`, `DeleteSubscriptionsSubscriptionExposedId`
- Charges: `GetCharges`, `GetChargesCharge`
- Refunds: `PostRefunds`, `GetRefunds`, `GetRefundsRefund`
- Invoices: `PostInvoices`, `GetInvoices`, `GetInvoicesInvoice`, `PostInvoicesInvoiceSend`, `PostInvoicesInvoicePay`, `PostInvoicesInvoiceVoid`
- Webhook Endpoints: `GetWebhookEndpoints`, `PostWebhookEndpoints`, `GetWebhookEndpointsWebhookEndpoint`
- Accounts: `PostAccounts`, `GetAccountsAccount`, `PostAccountsAccount`
- Disputes: `GetDisputes`, `GetDisputesDispute`, `PostDisputesDispute`
- Balance: `GetBalance`
- Payouts: `PostPayouts`, `GetPayouts`

## Setup

```bash
cd mcp-servers/stripe-hardened-mcp/mcp-server
npm install
npm run build
# Then register in .claude.json (see below)
```

## .claude.json registration

```json
{
  "mcpServers": {
    "stripe-hardened-mcp": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "API_KEY": "<your-stripe-secret-key>"
      }
    }
  }
}
```

Replace `<your-stripe-secret-key>` with your Stripe secret key (starts with `sk_live_` or `sk_test_`).

## Auth note

Set `API_KEY` env var to your Stripe secret key. The server passes it as
`Authorization: Bearer $API_KEY` on every request. For production, use
`wrangler secret put` or your secrets manager rather than plain env.

## Re-generate

```bash
node ~/.claude/plugins/heymegabyte-claude-skills/bin/forge-skill-from-openapi.mjs \
  https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json \
  mcp-servers/stripe-hardened-mcp \
  --name stripe-hardened-mcp \
  --target mcp-server \
  --transport stdio \
  --harden
```

Then re-apply the prune script (see the pruning Node.js script used during initial generation).

## Migrating from stripe-mcp/

1. Build and test this server: `npm install && npm run build`
2. Verify with MCP inspector: `npx @modelcontextprotocol/inspector node dist/index.js`
3. Update `.claude.json` to point at this server (change `stripe-mcp` → `stripe-hardened-mcp` in args path)
4. Confirm tools list in Claude Code with `/mcp` command
5. Archive `mcp-servers/stripe-mcp/` once satisfied: `mv mcp-servers/stripe-mcp mcp-servers/stripe-mcp-archived`

The unhardened `mcp-servers/stripe-mcp/` is kept side-by-side for rollback reference only.
Do not register both simultaneously — duplicate tool names will cause conflicts.

## Generated

2026-06-18 by forge-skill-from-openapi --harden.
Spec: Stripe API v2026-05-27.dahlia (587 total paths, pruned to 37).
