# openai-hardened-mcp

Hardened OpenAI MCP server — forged from the OpenAI OpenAPI spec v2.3.0 with `--harden`,
then pruned to 12 high-value tools from 242 total.

**This version supersedes `mcp-servers/openai-mcp/` (unhardened).**
Once you validate this server works with your auth/secrets, register THIS one in your
`.claude.json` and archive the unhardened `openai-mcp/` directory.

## Why hardened?

The unhardened `openai-mcp/` has:
- No input size limit — any-size args accepted, including crafted giant payloads
- No response size limit — multi-MB responses forwarded in full to Claude context
- No per-request timeout — slow OpenAI calls hang indefinitely
- Plain `z.object()` schemas — unknown keys silently passed through
- No audit trail — no visibility into what tools were called, when, by whom

This server adds all 7 hardening surfaces:

| Surface | Implementation |
|---|---|
| Resource limits | 64KB args + 1MB response hard caps per handler |
| Request timeout | 30s `AbortController` on every fetch |
| Strict Zod schemas | `.strict()` on all 12 input schemas — unknown keys rejected |
| Rate-limiter scaffold | `src/rate-limiter.ts` — sliding-window DO (wire up when HTTP transport used) |
| Audit-log scaffold | `src/audit-log.ts` — D1-backed call log (wire up AUDIT_DB binding) |
| PII scrubber | `src/scrub-pii.ts` — redacts tokens/keys/cards/SSNs before audit logging |
| DB migration | `migrations/0001_mcp_tool_calls.sql` — audit table DDL |

## Tools (12 — pruned from 242)

Kept tools match `.mcp-prune-rules.json` allowlist:

- Chat: `createChatCompletion`
- Completions: `createCompletion`
- Embeddings: `createEmbedding`
- Images: `createImage`
- Moderation: `createModeration`
- Models: `listModels`, `retrieveModel`
- Files: `createFile`, `listFiles`, `deleteFile`
- Fine-tuning: `createFineTuningJob`, `listPaginatedFineTuningJobs`

## Setup

```bash
cd mcp-servers/openai-hardened-mcp/mcp-server
npm install
npm run build
# Then register in .claude.json (see below)
```

## .claude.json registration

```json
{
  "mcpServers": {
    "openai-hardened-mcp": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "API_KEY": "<your-openai-secret-key>"
      }
    }
  }
}
```

Replace `<your-openai-secret-key>` with your OpenAI API key (starts with `sk-`).

## Auth note

Set `API_KEY` env var to your OpenAI API key. The server passes it as
`Authorization: Bearer $API_KEY` on every request. For production, use
`wrangler secret put` or your secrets manager rather than plain env.

## Re-generate

```bash
node ~/.claude/plugins/heymegabyte-claude-skills/bin/forge-skill-from-openapi.mjs \
  "https://github.com/openai/openai-openapi/raw/master/openapi.yaml" \
  mcp-servers/openai-hardened-mcp \
  --name openai-hardened-mcp \
  --target mcp-server \
  --transport stdio \
  --harden
```

Then re-apply the prune script (see `/tmp/prune-openai-mcp.mjs` or the allowlist in `.mcp-prune-rules.json`).

## Migrating from openai-mcp/

1. Build and test this server: `npm install && npm run build`
2. Verify with MCP inspector: `npx @modelcontextprotocol/inspector node dist/index.js`
3. Update `.claude.json` to point at this server (change `openai-mcp` → `openai-hardened-mcp` in args path)
4. Confirm tools list in Claude Code with `/mcp` command
5. Archive `mcp-servers/openai-mcp/` once satisfied: `mv mcp-servers/openai-mcp mcp-servers/openai-mcp-archived`

The unhardened `mcp-servers/openai-mcp/` is kept side-by-side for rollback reference only.
Do not register both simultaneously — duplicate tool names will cause conflicts.

## Generated

2026-06-18 by forge-skill-from-openapi --harden.
Spec: OpenAI API v2.3.0 (242 total paths, pruned to 12).
