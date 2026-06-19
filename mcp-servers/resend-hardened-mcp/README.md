# resend-hardened-mcp

Hardened Resend MCP server — forged from the Resend OpenAPI spec (v1.5.0) with `--harden`.
No pruning applied — all 83 tools ship, covering the full Resend API surface.

**This version supersedes `mcp-servers/resend-mcp/` (unhardened).**
Once you validate this server works with your auth/secrets, register THIS one in your
`.claude.json` and archive the unhardened `resend-mcp/` directory.

## Why hardened?

The unhardened `resend-mcp/` has:
- No input size limit — any-size args accepted, including crafted giant payloads
- No response size limit — multi-MB responses forwarded in full to Claude context
- No per-request timeout — slow Resend calls hang indefinitely
- Plain `z.object()` schemas — unknown keys silently passed through
- No audit trail — no visibility into what tools were called, when, by whom

This server adds all 7 hardening surfaces:

| Surface | Implementation |
|---|---|
| Resource limits | 64KB args + 1MB response hard caps per handler |
| Request timeout | 30s `AbortController` on every fetch |
| Strict Zod schemas | `.strict()` on all 83 input schemas — unknown keys rejected |
| Rate-limiter scaffold | `src/rate-limiter.ts` — sliding-window DO (wire up when HTTP transport used) |
| Audit-log scaffold | `src/audit-log.ts` — D1-backed call log (wire up AUDIT_DB binding) |
| PII scrubber | `src/scrub-pii.ts` — redacts tokens/keys/cards/SSNs before audit logging |
| DB migration | `migrations/0001_mcp_tool_calls.sql` — audit table DDL |

## Tools (83 — no pruning, full Resend API)

### Emails
- `get-emails` — List emails
- `post-emails` — Send an email
- `get-emails-email-id` — Retrieve a single email
- `patch-emails-email-id` — Update a single email
- `post-emails-email-id-cancel` — Cancel a scheduled email
- `post-emails-batch` — Send up to 100 batch emails
- `get-emails-email-id-attachments` — List attachments for a sent email
- `get-emails-email-id-attachments-attachment-id` — Retrieve a single sent-email attachment
- `get-emails-receiving` — List received emails
- `get-emails-receiving-email-id` — Retrieve a single received email
- `get-emails-receiving-email-id-attachments` — List received-email attachments
- `get-emails-receiving-email-id-attachments-attachment-id` — Retrieve a single received-email attachment

### Domains
- `get-domains` — List domains
- `post-domains` — Create a domain
- `get-domains-domain-id` — Retrieve a single domain
- `patch-domains-domain-id` — Update a domain
- `delete-domains-domain-id` ⚠️ — Remove a domain
- `post-domains-domain-id-verify` — Verify a domain

### API Keys
- `get-api-keys` — List API keys
- `post-api-keys` — Create an API key
- `delete-api-keys-api-key-id` ⚠️ — Remove an API key

### Templates
- `get-templates` — List templates
- `post-templates` — Create a template
- `get-templates-id` — Retrieve a single template
- `patch-templates-id` — Update a template
- `delete-templates-id` ⚠️ — Remove a template
- `post-templates-id-publish` — Publish a template
- `post-templates-id-duplicate` — Duplicate a template

### Audiences & Contacts
- `get-audiences` — List audiences
- `post-audiences` — Create an audience
- `get-audiences-id` — Retrieve a single audience
- `delete-audiences-id` ⚠️ — Remove an audience
- `get-contacts` — List contacts
- `post-contacts` — Create a contact
- `get-contacts-id` — Retrieve a contact by ID or email
- `patch-contacts-id` — Update a contact
- `delete-contacts-id` ⚠️ — Remove a contact
- `get-contacts-contact-id-segments` — List segments for a contact
- `post-contacts-contact-id-segments-segment-id` — Add contact to a segment
- `delete-contacts-contact-id-segments-segment-id` ⚠️ — Remove contact from a segment
- `get-contacts-contact-id-topics` — List topics for a contact
- `patch-contacts-contact-id-topics` — Update topics for a contact

### Contact Properties
- `get-contact-properties` — List contact properties
- `post-contact-properties` — Create a contact property
- `get-contact-properties-id` — Retrieve a single contact property
- `patch-contact-properties-id` — Update a contact property
- `delete-contact-properties-id` ⚠️ — Remove a contact property

### Broadcasts
- `get-broadcasts` — List broadcasts
- `post-broadcasts` — Create a broadcast
- `get-broadcasts-id` — Retrieve a single broadcast
- `patch-broadcasts-id` — Update a broadcast
- `delete-broadcasts-id` ⚠️ — Remove a draft broadcast
- `post-broadcasts-id-send` — Send or schedule a broadcast

### Webhooks
- `get-webhooks` — List webhooks
- `post-webhooks` — Create a webhook
- `get-webhooks-webhook-id` — Retrieve a single webhook
- `patch-webhooks-webhook-id` — Update a webhook
- `delete-webhooks-webhook-id` ⚠️ — Remove a webhook

### Segments
- `get-segments` — List segments
- `post-segments` — Create a segment
- `get-segments-id` — Retrieve a single segment
- `delete-segments-id` ⚠️ — Remove a segment

### Topics
- `get-topics` — List topics
- `post-topics` — Create a topic
- `get-topics-id` — Retrieve a single topic
- `patch-topics-id` — Update a topic
- `delete-topics-id` ⚠️ — Remove a topic

### Automations
- `get-automations` — List automations
- `post-automations` — Create an automation
- `get-automations-automation-id` — Retrieve a single automation
- `patch-automations-automation-id` — Update an automation
- `delete-automations-automation-id` ⚠️ — Delete an automation
- `post-automations-automation-id-stop` — Stop an automation
- `get-automations-automation-id-runs` — List automation runs
- `get-automations-automation-id-runs-run-id` — Retrieve a single automation run

### Events
- `get-events` — List events
- `post-events` — Create an event
- `post-events-send` — Send an event
- `get-events-identifier` — Retrieve a single event
- `patch-events-identifier` — Update an event
- `delete-events-identifier` ⚠️ — Delete an event

### Logs
- `get-logs` — List logs
- `get-logs-log-id` — Retrieve a single log

⚠️ = `@dangerous` tagged — destructive operations, confirm before use.

## Setup

```bash
cd mcp-servers/resend-hardened-mcp/mcp-server
npm install
npm run build
```

## .claude.json registration

```json
{
  "mcpServers": {
    "resend-hardened-mcp": {
      "command": "node",
      "args": ["/path/to/mcp-servers/resend-hardened-mcp/mcp-server/dist/index.js"],
      "env": {
        "API_KEY": "<your-resend-api-key>"
      }
    }
  }
}
```

Replace `<your-resend-api-key>` with your Resend API key (starts with `re_`).

## Auth note

Set `API_KEY` env var to your Resend API key. The server passes it as
`Authorization: Bearer $API_KEY` on every request. For production, use
`wrangler secret put` or your secrets manager rather than plain env.

## Migrating from resend-mcp/

1. Build and test: `npm install && npm run build`
2. Verify with MCP inspector: `npx @modelcontextprotocol/inspector node dist/index.js`
3. Update `.claude.json` to point at this server (`resend-mcp` → `resend-hardened-mcp` in args path)
4. Confirm tools list in Claude Code with `/mcp` command
5. Archive the unhardened version once satisfied: `mv mcp-servers/resend-mcp mcp-servers/resend-mcp-archived`

The unhardened `mcp-servers/resend-mcp/` is kept side-by-side for rollback reference only.
Do not register both simultaneously — duplicate tool names will cause conflicts.

## Re-generate

```bash
node ~/.claude/plugins/heymegabyte-claude-skills/bin/forge-skill-from-openapi.mjs \
  https://resend.com/openapi.json \
  mcp-servers/resend-hardened-mcp \
  --name resend-hardened-mcp \
  --target mcp-server \
  --transport stdio \
  --harden
```

## Generated

2026-06-18 by forge-skill-from-openapi --harden.
Spec: Resend API v1.5.0 (47 paths → 83 tools, no pruning).
