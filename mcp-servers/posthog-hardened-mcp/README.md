# posthog-hardened-mcp

Hardened PostHog MCP server — forged from `mcp-servers/posthog-mcp/` with `--harden` hardening
surfaces applied. 13 high-value tools (already the curated allowlist in posthog-mcp).

**This version supersedes `mcp-servers/posthog-mcp/` (unhardened).**
Once you validate this server works with your auth/secrets, register THIS one in your
`.claude.json` and archive the unhardened `posthog-mcp/` directory.

## Why hardened?

The unhardened `posthog-mcp/` has:
- No input size limit — any-size args accepted, including crafted giant payloads
- No response size limit — multi-MB responses forwarded in full to Claude context
- No per-request timeout — slow PostHog calls hang indefinitely
- Plain `z.object()` schemas — unknown keys silently passed through
- No base URL construction — hardcoded partial paths, no project/environment substitution
- No audit trail — no visibility into what tools were called, when, by whom

This server adds all 7 hardening surfaces:

| Surface | Implementation |
|---|---|
| Resource limits | 64KB args + 1MB response hard caps per handler |
| Request timeout | 30s `AbortController` on every fetch |
| Strict Zod schemas | `.strict()` on all 13 input schemas — unknown keys rejected |
| Base URL construction | `POSTHOG_HOST`, `POSTHOG_PROJECT_ID`, `POSTHOG_ENVIRONMENT_ID` env vars |
| Rate-limiter scaffold | `src/rate-limiter.ts` — sliding-window DO (wire up when HTTP transport used) |
| Audit-log scaffold | `src/audit-log.ts` — D1-backed call log (wire up AUDIT_DB binding) |
| PII scrubber | `src/scrub-pii.ts` — redacts tokens/keys/emails/phones/SSNs before audit logging |
| DB migration | `migrations/0001_mcp_tool_calls.sql` — audit table DDL |

## Tools (13 — pruned from the full PostHog OpenAPI spec)

posthog-mcp was already pre-filtered to this 13-tool allowlist when forged:

- **Dashboards:** `environments_dashboards_list`
- **Events:** `environments_events_list`
- **Insights:** `environments_insights_list`, `environments_insights_create`
- **Persons:** `environments_persons_list`
- **Query:** `environments_query_create`
- **Cohorts:** `cohorts_create`
- **Experiments:** `experiments_list`, `experiments_create`
- **Feature Flags:** `feature_flags_list`, `feature_flags_create`, `feature_flags_retrieve`, `feature_flags_update`

## Setup

```bash
cd mcp-servers/posthog-hardened-mcp/mcp-server
npm install
npm run build
# Then register in .claude.json (see below)
```

## .claude.json registration

```json
{
  "mcpServers": {
    "posthog-hardened-mcp": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "API_KEY": "<your-posthog-personal-api-key>",
        "POSTHOG_HOST": "https://us.posthog.com",
        "POSTHOG_PROJECT_ID": "210890",
        "POSTHOG_ENVIRONMENT_ID": "210890"
      }
    }
  }
}
```

Replace `<your-posthog-personal-api-key>` with your PostHog Personal API Key (Settings → Personal API Keys).

## Auth note

Set `API_KEY` env var to your PostHog Personal API Key. The server passes it as
`Authorization: Bearer $API_KEY` on every request. For production, use
`wrangler secret put` or your secrets manager rather than plain env.

Environment substitution: `{project_id}` and `{environment_id}` in paths are replaced
with `POSTHOG_PROJECT_ID` / `POSTHOG_ENVIRONMENT_ID` at runtime (defaults to `210890`).

## Re-generate

```bash
node ~/.claude/plugins/heymegabyte-claude-skills/bin/forge-skill-from-openapi.mjs \
  https://us.posthog.com/openapi/ \
  mcp-servers/posthog-hardened-mcp \
  --name posthog-hardened-mcp \
  --target mcp-server \
  --transport stdio \
  --harden
```

Then re-apply the prune script (see `.mcp-prune-rules.json` for the 13-tool allowlist).

## Migrating from posthog-mcp/

1. Build and test this server: `npm install && npm run build`
2. Verify with MCP inspector: `npx @modelcontextprotocol/inspector node dist/index.js`
3. Update `.claude.json` to point at this server (change `posthog-mcp` → `posthog-hardened-mcp` in args path)
4. Confirm tools list in Claude Code with `/mcp` command
5. Archive `mcp-servers/posthog-mcp/` once satisfied: `mv mcp-servers/posthog-mcp mcp-servers/posthog-mcp-archived`

The unhardened `mcp-servers/posthog-mcp/` is kept side-by-side for rollback reference only.
Do not register both simultaneously — duplicate tool names will cause conflicts.

## Generated

2026-06-18 by copy+harden from posthog-mcp (forge fallback — all PostHog spec URLs returned non-JSON).
Source: posthog-mcp (13 tools, already pre-filtered from the full PostHog OpenAPI spec).
