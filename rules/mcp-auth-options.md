---
last_reviewed: 2026-06-29
superseded_by: null
name: "mcp-auth-options"
priority: 2
pack: "core"
triggers:
  - "mcp auth"
  - "mcp server auth"
  - "mcp transport"
  - "cloudflare access mcp"
  - "oauth mcp"
  - "bearer mcp"
  - "stdio mcp"
paths:
  - "mcp-servers/**"
  - "src/mcp/**"
  - "worker/mcp/**"
  - "*.mcp.ts"
---

# MCP Auth Options

Pick auth at MCP design time — retrofitting is painful. Decision is driven by transport, caller identity, and blast radius.

## Transport determines the auth floor

| Transport     | Auth needed?       | Why                                                             |
|---------------|--------------------|-----------------------------------------------------------------|
| stdio         | No                 | Parent process (Claude Code CLI) is the trust boundary         |
| HTTP/SSE      | Yes — always       | Network-reachable; any client can call it                       |

## Option 1 — stdio (no auth)

Use when: the MCP runs locally, launched by Claude Code CLI, on a developer's machine.

- Claude Code CLI owns the process — it is the auth layer
- No credentials needed; the process can access local files, env vars, and system resources per the developer's own permissions
- Never expose a stdio MCP via a reverse proxy or tunnel — that defeats the trust model
- Suitable for: local dev tools, file-system MCPs, CLI wrappers

```jsonc
// claude_desktop_config.json
{
  "mcpServers": {
    "my-tool": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": { "MY_API_KEY": "..." }
    }
  }
}
```

## Option 2 — HTTP + Cloudflare Access JWT

Use when: the MCP is deployed as a Worker, called by Claude Code CLI or internal agents, and the caller is always a Megabyte Labs / emdash org member.

- Deploy the Worker behind a Cloudflare Access application (zero-trust policy)
- Use `@hono/cloudflare-access` middleware to validate the `Cf-Access-Jwt-Assertion` header
- Service tokens for M2M callers (non-human agents); user tokens for human-proxied calls
- Suitable for: internal tooling MCPs, admin MCPs, org-internal data access

```ts
import { CloudflareAccess } from "@hono/cloudflare-access";

app.use(
  "*",
  CloudflareAccess({
    teamDomain: env.CF_ACCESS_TEAM_DOMAIN,   // "yourteam.cloudflareaccess.com"
    aud: env.CF_ACCESS_AUD,                  // Application Audience tag from CF Access UI
  }),
);
```

CF Access blocks unauthenticated requests at the edge — the Worker never sees them.

Cross-link: `[[cf-zero-trust-access]]`

## Option 3 — HTTP + OAuth via Auth0 Token Vault

Use when: the MCP acts on behalf of a specific end-user, accessing resources the user owns (e.g., their Google Calendar, their Stripe account, their GitHub repos).

- Auth0 Token Vault stores per-user OAuth tokens securely
- The MCP receives an agent-scoped JWT, exchanges it with Token Vault for the user's access token
- The downstream API call runs as that user, not as a service account
- Suitable for: customer-facing MCPs, delegated integrations, multi-tenant agent platforms

```ts
// Middleware: extract agent JWT → exchange for user token
app.use("*", async (c, next) => {
  const agentJwt = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!agentJwt) return c.json({ error: "unauthorized" }, 401);
  const userToken = await tokenVault.exchange(agentJwt, c.req.header("x-user-id")!);
  c.set("userToken", userToken);
  await next();
});
```

Cross-link: `[[auth0-token-vault]]`

## Option 4 — HTTP + Bearer token (M2M)

Use when: the MCP is called by another service or agent that you control, there is no user delegation, and the caller pool is small and static.

- The caller includes `Authorization: Bearer <token>` on every request
- The MCP validates the token against a known hash stored in a Worker secret (never plaintext compare)
- Rotate tokens via Wrangler secrets — no redeploy needed
- Suitable for: inter-Worker calls, CI job MCPs, simple webhook receivers

```ts
app.use("*", async (c, next) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  const expected = await env.MCP_BEARER_TOKEN_HASH; // SHA-256 hex of the token
  if (!token || sha256(token) !== expected) return c.json({ error: "unauthorized" }, 401);
  await next();
});
```

Never store the raw token in env — hash it. Use `crypto.subtle.digest("SHA-256", ...)` to validate.

## Decision table

| Who owns the MCP | Who calls it         | What it does            | Auth option            |
|------------------|----------------------|-------------------------|------------------------|
| You (local)      | Claude Code CLI      | Read/write local        | stdio (no auth)        |
| You (deployed)   | You (Claude Code)    | Read internal data      | CF Access JWT          |
| You (deployed)   | Org members          | Read/write internal     | CF Access JWT          |
| You (deployed)   | Customer agents      | Act as customer         | OAuth / Token Vault    |
| You (deployed)   | Another Worker/agent | Read/write (no user)    | Bearer token (M2M)     |
| You (deployed)   | Public internet      | Public read             | No auth + rate-limit   |

## Destructive operations — extra gate regardless of auth

Any MCP tool with a destructive effect (delete, overwrite, deploy, send email, charge card) MUST:

1. Require a second auth factor or explicit confirmation token in the request body
2. Log the caller identity + traceId to D1 audit table before executing
3. Return a preview response when called with `?dry_run=true`

Per `[[mcp-server-hardening]]` and `[[blast-radius-minimization]]`.

## Common mistakes

- Using Bearer tokens for user-delegated flows — the token has no user identity, escalation risk
- Deploying stdio MCPs behind a tunnel — destroys the stdio trust model
- CF Access on a public-facing MCP that customers call — wrong tool; use OAuth
- Storing raw Bearer tokens in wrangler.toml — use `wrangler secret put MCP_BEARER_TOKEN_HASH`
- No auth on an HTTP MCP "because it's internal" — network-adjacent callers can reach it; always add CF Access at minimum

## See also

- `[[cf-zero-trust-access]]` — CF Access policy config and service token setup
- `[[auth0-token-vault]]` — per-user OAuth token storage and exchange
- `[[mcp-server-hardening]]` — rate limiting, input validation, audit logging
- `ai-agent-security` — agent trust boundaries and tool blast-radius rules
- `tool-design-as-api` — MCP tools are APIs; narrow, typed, Zod in+out
