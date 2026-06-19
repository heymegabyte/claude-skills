# github-hardened-mcp

Hardened GitHub MCP server — forged from the GitHub REST API OpenAPI spec with `--harden`, then
pruned to 57 high-value tools using the same allowlist as `github-mcp/`.

**This version supersedes `mcp-servers/github-mcp/` (unhardened).**
Once you validate this server works with your auth/token, register THIS one in your
`.claude.json` and archive the unhardened `github-mcp/` directory.

## Why hardened?

The unhardened `github-mcp/` has:
- No input size limit — any-size args accepted, including crafted giant payloads
- No response size limit — multi-MB responses forwarded in full to Claude context
- No per-request timeout — slow GitHub API calls hang indefinitely
- Plain `z.object()` schemas — unknown keys silently passed through
- No audit trail — no visibility into what tools were called, when, by whom

This server adds all 7 hardening surfaces:

| Surface | Implementation |
|---|---|
| Resource limits | 64KB args + 1MB response hard caps per handler |
| Request timeout | 30s `AbortController` on every fetch |
| Strict Zod schemas | `.strict()` on all 57 input schemas — unknown keys rejected |
| Rate-limiter scaffold | `src/rate-limiter.ts` — sliding-window DO (wire up when HTTP transport used) |
| Audit-log scaffold | `src/audit-log.ts` — D1-backed call log (wire up AUDIT_DB binding) |
| PII scrubber | `src/scrub-pii.ts` — redacts tokens/keys/SSNs before audit logging |
| DB migration | `migrations/0001_mcp_tool_calls.sql` — audit table DDL |

## Tools (57 — pruned from 1191)

Kept tools match `mcp-servers/github-mcp/.mcp-prune-rules.json` allowlist:

- **Repos**: `repos/get`, `repos/create-for-authenticated-user`, `repos/create-in-org`, `repos/update`, `repos/delete`, `repos/list-for-authenticated-user`, `repos/list-for-org`, `repos/list-for-user`, `repos/get-content`, `repos/create-or-update-file-contents`
- **Issues**: `issues/create`, `issues/get`, `issues/update`, `issues/list`, `issues/list-for-repo`, `issues/lock`, `issues/unlock`, `issues/create-comment`, `issues/list-comments`, `issues/get-comment`, `issues/update-comment`, `issues/delete-comment`
- **Pull Requests**: `pulls/create`, `pulls/get`, `pulls/update`, `pulls/list`, `pulls/merge`, `pulls/request-reviewers`, `pulls/create-review`, `pulls/list-reviews`, `pulls/submit-review`
- **Branches & Commits**: `repos/list-branches`, `repos/get-branch`, `repos/get-branch-protection`, `repos/update-branch-protection`, `repos/list-commits`, `repos/get-commit`, `repos/compare-commits`
- **Actions**: `actions/get-workflow`, `actions/list-repo-workflows`, `actions/create-workflow-dispatch`, `actions/list-workflow-runs`, `actions/get-workflow-run`, `actions/cancel-workflow-run`, `actions/re-run-workflow`
- **Releases**: `repos/create-release`, `repos/get-release`, `repos/list-releases`, `repos/update-release`, `repos/get-latest-release`
- **Search**: `search/issues-and-pull-requests`, `search/repos`, `search/code`
- **Users & Orgs**: `users/get-authenticated`, `users/get-by-username`, `orgs/get`, `orgs/list-members`

## Setup

```bash
cd mcp-servers/github-hardened-mcp/mcp-server
npm install
npm run build
# Then register in .claude.json (see below)
```

## .claude.json registration

```json
{
  "mcpServers": {
    "github-hardened-mcp": {
      "command": "node",
      "args": ["/Users/Apple/.claude/plugins/heymegabyte-claude-skills/mcp-servers/github-hardened-mcp/mcp-server/dist/index.js"],
      "env": {
        "API_KEY": "<your-github-personal-access-token>"
      }
    }
  }
}
```

Replace `<your-github-personal-access-token>` with a GitHub PAT (classic or fine-grained).
Minimum scopes: `repo`, `read:user`, `read:org` for most tools; add `workflow` for Actions tools.

## Auth note

Set `API_KEY` env var to your GitHub personal access token. The server passes it as
`Authorization: Bearer $API_KEY` on every request. For production, use your secrets manager
rather than plain env. GitHub PATs have 1h–1y expiry depending on type — fine-grained tokens
with minimal repo scope are preferred.

## Re-generate

```bash
node ~/.claude/plugins/heymegabyte-claude-skills/bin/forge-skill-from-openapi.mjs \
  "https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json" \
  mcp-servers/github-hardened-mcp \
  --name github-hardened-mcp \
  --target mcp-server \
  --transport stdio \
  --harden
```

Then re-apply the prune rules from `.mcp-prune-rules.json` using the pruning script at `/tmp/prune-github-hardened.mjs`.

## Migrating from github-mcp/

1. Build and test this server: `npm install && npm run build`
2. Verify with MCP inspector: `npx @modelcontextprotocol/inspector node dist/index.js`
3. Update `.claude.json` to point at this server (change `github-mcp` → `github-hardened-mcp` in args path)
4. Confirm tools list in Claude Code with `/mcp` command
5. Archive `mcp-servers/github-mcp/` once satisfied: `mv mcp-servers/github-mcp mcp-servers/github-mcp-archived`

The unhardened `mcp-servers/github-mcp/` is kept side-by-side for rollback reference only.
Do not register both simultaneously — duplicate tool names will cause conflicts.

## Generated

2026-06-18 by forge-skill-from-openapi --harden.
Spec: GitHub v3 REST API v1.1.4 (1191 total paths, pruned to 57).
