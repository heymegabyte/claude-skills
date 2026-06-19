# twilio-hardened-mcp

Hardened Twilio Messaging MCP server — forged from the Twilio Messaging v1 OpenAPI spec
(`twilio_messaging_v1.json`) with `--harden`. All 58 tools retained (no pruning applied).

**This version supersedes `mcp-servers/twilio-mcp/` (unhardened).**
Once you validate this server works with your auth/secrets, register THIS one in your
`.claude.json` and archive the unhardened `twilio-mcp/` directory.

## Why hardened?

The unhardened `twilio-mcp/` has:
- No input size limit — any-size args accepted, including crafted giant payloads
- No response size limit — multi-MB responses forwarded in full to Claude context
- No per-request timeout — slow Twilio calls hang indefinitely
- Plain `z.object()` schemas — unknown keys silently passed through
- No audit trail — no visibility into what tools were called, when, by whom

This server adds all 7 hardening surfaces:

| Surface | Implementation |
|---|---|
| Resource limits | 64KB args + 1MB response hard caps per handler |
| Request timeout | 30s `AbortController` on every fetch |
| Strict Zod schemas | `.strict()` on all 58 input schemas — unknown keys rejected |
| Rate-limiter scaffold | `src/rate-limiter.ts` — sliding-window DO (wire up when HTTP transport used) |
| Audit-log scaffold | `src/audit-log.ts` — D1-backed call log (wire up AUDIT_DB binding) |
| PII scrubber | `src/scrub-pii.ts` — redacts tokens/keys/phone numbers before audit logging |
| DB migration | `migrations/0001_mcp_tool_calls.sql` — audit table DDL |

## Tools (58 — no pruning applied)

### Alpha Senders
- `ListAlphaSender` — List alpha senders for a messaging service
- `CreateAlphaSender` — Add an alpha sender to a messaging service
- `FetchAlphaSender` — Fetch a specific alpha sender
- `DeleteAlphaSender` — Remove an alpha sender from a messaging service

### Brand Registrations (A2P 10DLC)
- `FetchBrandRegistrations` — Fetch a brand registration
- `UpdateBrandRegistrations` — Update a brand registration
- `ListBrandRegistrations` — List brand registrations
- `CreateBrandRegistrations` — Create a brand registration
- `CreateBrandRegistrationOtp` — Generate OTP for brand registration

### Brand Vetting
- `ListBrandVetting` — List brand vetting records
- `CreateBrandVetting` — Create brand vetting
- `FetchBrandVetting` — Fetch a brand vetting record

### Channel Senders
- `ListChannelSender` — List channel senders for a messaging service
- `CreateChannelSender` — Add a channel sender
- `FetchChannelSender` — Fetch a channel sender
- `DeleteChannelSender` — Remove a channel sender

### Deactivations
- `FetchDeactivation` — Fetch deactivation data by date

### Destination Alpha Senders
- `ListDestinationAlphaSender` — List destination alpha senders
- `CreateDestinationAlphaSender` — Add a destination alpha sender
- `FetchDestinationAlphaSender` — Fetch a destination alpha sender
- `DeleteDestinationAlphaSender` — Remove a destination alpha sender

### Domain Certificates & Config (Link Shortening)
- `FetchDomainCertV4` — Fetch domain certificate (v4)
- `UpdateDomainCertV4` — Update domain certificate (v4)
- `DeleteDomainCertV4` — Delete domain certificate (v4)
- `FetchDomainConfig` — Fetch link shortening domain config
- `UpdateDomainConfig` — Update link shortening domain config
- `FetchDomainConfigMessagingService` — Fetch domain config for a messaging service
- `FetchDomainDnsValidation` — Fetch DNS validation record for a domain

### External Campaigns (A2P 10DLC)
- `CreateExternalCampaign` — Create an externally registered campaign

### Link Shortening
- `CreateLinkshorteningMessagingService` — Associate link shortening domain with a service
- `DeleteLinkshorteningMessagingService` — Disassociate link shortening domain
- `FetchLinkshorteningMessagingServiceDomainAssociation` — Fetch link shortening association

### Phone Numbers
- `ListPhoneNumber` — List phone numbers in a messaging service
- `CreatePhoneNumber` — Add a phone number to a messaging service
- `FetchPhoneNumber` — Fetch a specific phone number
- `DeletePhoneNumber` — Remove a phone number from a messaging service

### Request Managed Cert
- `UpdateRequestManagedCert` — Update a request-managed TLS certificate

### Messaging Services
- `ListService` — List all messaging services
- `CreateService` — Create a messaging service
- `FetchService` — Fetch a messaging service
- `UpdateService` — Update a messaging service
- `DeleteService` — Delete a messaging service

### Short Codes
- `ListShortCode` — List short codes in a messaging service
- `CreateShortCode` — Add a short code to a messaging service
- `FetchShortCode` — Fetch a short code
- `DeleteShortCode` — Remove a short code

### Toll-Free Verification
- `FetchTollfreeVerification` — Fetch a toll-free verification
- `UpdateTollfreeVerification` — Update a toll-free verification
- `DeleteTollfreeVerification` — Delete a toll-free verification
- `ListTollfreeVerification` — List toll-free verifications
- `CreateTollfreeVerification` — Submit a toll-free verification

### US App-to-Person (A2P 10DLC Campaigns)
- `ListUsAppToPerson` — List US A2P campaigns for a messaging service
- `CreateUsAppToPerson` — Create a US A2P campaign
- `FetchUsAppToPerson` — Fetch a US A2P campaign
- `UpdateUsAppToPerson` — Update a US A2P campaign
- `DeleteUsAppToPerson` — Delete a US A2P campaign
- `FetchUsAppToPersonUsecase` — Fetch available use cases for US A2P

### Usecases
- `FetchUsecase` — Fetch available messaging service use cases

## Setup

```bash
cd mcp-servers/twilio-hardened-mcp/mcp-server
npm install
npm run build
# Then register in .claude.json (see below)
```

## .claude.json registration

```json
{
  "mcpServers": {
    "twilio-hardened-mcp": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "API_KEY": "<your-twilio-auth-token>"
      }
    }
  }
}
```

Replace `<your-twilio-auth-token>` with your Twilio Auth Token. The server passes it as
`Authorization: Bearer $API_KEY` on every request.

## Auth note

Twilio uses HTTP Basic Auth (`AccountSid:AuthToken`) in its official client, but this
server passes `API_KEY` as a Bearer token — suitable for Twilio API Keys (created at
console.twilio.com/user/api-keys). For production, use your secrets manager rather than
a plain env var.

Base URL: `https://messaging.twilio.com/v1`

## Re-generate

```bash
node ~/.claude/plugins/heymegabyte-claude-skills/bin/forge-skill-from-openapi.mjs \
  https://raw.githubusercontent.com/twilio/twilio-oai/main/spec/json/twilio_messaging_v1.json \
  mcp-servers/twilio-hardened-mcp \
  --name twilio-hardened-mcp \
  --target mcp-server \
  --transport stdio \
  --harden
```

## Migrating from twilio-mcp/

1. Build and test this server: `npm install && npm run build`
2. Verify with MCP inspector: `npx @modelcontextprotocol/inspector node dist/index.js`
3. Update `.claude.json` to point at this server (change `twilio-mcp` → `twilio-hardened-mcp` in args path)
4. Confirm tools list in Claude Code with `/mcp` command
5. Archive `mcp-servers/twilio-mcp/` once satisfied: `mv mcp-servers/twilio-mcp mcp-servers/twilio-mcp-archived`

The unhardened `mcp-servers/twilio-mcp/` is kept side-by-side for rollback reference only.
Do not register both simultaneously — duplicate tool names will cause conflicts.

## Generated

2026-06-18 by forge-skill-from-openapi --harden.
Spec: Twilio - Messaging v1.0.0 (33 paths → 58 operations, no pruning).
