# twilio-hardened-mcp MCP Server

Auto-generated from OpenAPI spec by `forge-skill-from-openapi --target=mcp-server`.
Transport: **stdio**

## Tools (58)

- `ListAlphaSender` — 
- `CreateAlphaSender` — 
- `FetchAlphaSender` — 
- `DeleteAlphaSender` — 
- `CreateBrandRegistrationOtp` — 
- `FetchBrandRegistrations` — 
- `UpdateBrandRegistrations` — 
- `ListBrandRegistrations` — 
- `CreateBrandRegistrations` — 
- `ListBrandVetting` — 
- `CreateBrandVetting` — 
- `FetchBrandVetting` — 
- `ListChannelSender` — 
- `CreateChannelSender` — 
- `FetchChannelSender` — 
- `DeleteChannelSender` — 
- `FetchDeactivation` — Fetch a list of all United States numbers that have been deactivated on a specific date.
- `ListDestinationAlphaSender` — 
- `CreateDestinationAlphaSender` — 
- `FetchDestinationAlphaSender` — 
- `DeleteDestinationAlphaSender` — 
- `FetchDomainCertV4` — 
- `UpdateDomainCertV4` — 
- `DeleteDomainCertV4` — 
- `FetchDomainConfig` — 
- `UpdateDomainConfig` — 
- `FetchDomainConfigMessagingService` — 
- `FetchDomainDnsValidation` — 
- `CreateExternalCampaign` — 
- `CreateLinkshorteningMessagingService` — 
- `DeleteLinkshorteningMessagingService` — 
- `FetchLinkshorteningMessagingServiceDomainAssociation` — 
- `ListPhoneNumber` — 
- `CreatePhoneNumber` — 
- `FetchPhoneNumber` — 
- `DeletePhoneNumber` — 
- `UpdateRequestManagedCert` — 
- `ListService` — 
- `CreateService` — 
- `FetchService` — 
- `UpdateService` — 
- `DeleteService` — 
- `ListShortCode` — 
- `CreateShortCode` — 
- `FetchShortCode` — 
- `DeleteShortCode` — 
- `FetchTollfreeVerification` — Retrieve a tollfree verification
- `UpdateTollfreeVerification` — Edit a tollfree verification
- `DeleteTollfreeVerification` — Delete a tollfree verification
- `ListTollfreeVerification` — List tollfree verifications
- `CreateTollfreeVerification` — Create a tollfree verification
- `ListUsAppToPerson` — 
- `CreateUsAppToPerson` — 
- `FetchUsAppToPerson` — 
- `UpdateUsAppToPerson` — 
- `DeleteUsAppToPerson` — 
- `FetchUsAppToPersonUsecase` — 
- `FetchUsecase` — 

## Setup

```bash
npm install
npm run build
# Register in ~/.claude.json or project .claude.json (see below)
```

## .claude.json registration

```json
{
  "mcpServers": {
    "twilio-hardened-mcp": {
      "command": "node",
      "args": [
        "dist/index.js"
      ],
      "env": {
        "API_KEY": "<your-api-key>"
      }
    }
  }
}
```

## Auth

Set `API_KEY` (env var for stdio, `wrangler secret` for http) to your upstream API token.

## Re-generate

```bash
node ~/.claude/plugins/heymegabyte-claude-skills/bin/forge-skill-from-openapi.mjs \
  <spec-url> <output-dir> --name twilio-hardened-mcp --target mcp-server --transport stdio
```
