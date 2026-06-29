---
name: "mcp-server-hardening"
priority: 2
pack: "ai"
triggers:
  - "mcp server"
  - "forge-from-openapi"
  - "mcp hardening"
  - "tool invocation"
  - "mcp production"
  - "mcp audit"
  - "mcp rate limit"
  - "destructive tool"
  - "mcp auth"
  - "mcp security"
paths:
  - "mcp-servers/**"
  - "**/src/index.ts"
  - "**/wrangler.toml"
  - "forge-templates/**"
last_reviewed: 2026-06-29
superseded_by: null
---

# MCP Server Hardening

Every forge-generated MCP server is production-hostile by default — it trusts callers, logs nothing, and exposes every tool equally. This rule closes that gap before the server is registered in `~/.claude.json` or deployed to CF Workers. Apply ALL sections below to every server before `/deploy-forged-mcp` runs.

## When this fires

- Any `/forge-from-openapi --target=mcp-server` run
- Any `mcp-servers/**` file is created or modified
- Any new MCP server is being registered in `~/.claude.json` or `settings.json`
- Pre-flight checklist before `/audit-mcp-fleet`

---

## 1. Per-tool rate limiting (DO-based sliding window)

Every MCP server MUST attach a Durable Object rate limiter at the tool-dispatch layer.

- Use `McpRateLimiter` DO with an in-memory sliding-window keyed `userId:toolName`.
- Call `checkRateLimit(env, toolName, userId)` before the tool handler runs; throws `McpError` on 429.
- Add `MCP_RATE_LIMITER` DO binding to `wrangler.toml`.

**Default limits per tool class** (override in `TOOL_RATE_LIMITS` map):

| Class | window | limit |
|---|---|---|
| read (`list_*`, `get_*`, `search_*`) | 60s | 120 |
| write (`create_*`, `update_*`) | 60s | 30 |
| destructive (`delete_*`, `cancel_*`, `void_*`, `refund_*`) | 300s | 5 |
| default (unclassified) | 60s | 60 |

See `reference/mcp-server-hardening.md` for the `McpRateLimiter` DO class and `checkRateLimit` helper.

---

## 2. Audit logging — `mcp_tool_calls` D1 table

Every tool invocation — success or failure — MUST be logged before the response is returned. No exceptions.

- Log columns: `tool_name`, `args_sha256` (SHA-256 of scrubbed args JSON), `response_status` (`success|error|rate_limited|auth_denied`), `latency_ms`, `user_id` (CF Access JWT sub or `stdio:parent`), `server_name`, `error_code`.
- Always pass `scrubbedArgs` (post-`redactPii()`) to `logToolCall` — never raw args.
- **Retention**: nightly cron deletes rows older than **90 days** (`DELETE FROM mcp_tool_calls WHERE timestamp < datetime('now', '-90 days')`).

See `reference/mcp-server-hardening.md` for the full D1 DDL and `logToolCall` TypeScript helper.

---

## 3. Secret-scrubbing on tool inputs/outputs

Apply `redactPii()` from `template/utils/scrub-pii.ts` to BOTH the request args AND the response body before any logging or error serialization. Raw values never enter the audit trail.

Fields automatically redacted: credit card patterns, SSN, API keys, bearer tokens, password-like fields, email addresses, phone numbers, and any key matching `/^(token|secret|key|password|auth|bearer|ssn|cc_number|card)/i`.

```ts
import { redactPii } from '../utils/scrub-pii.js';

const scrubbedArgs = redactPii(toolArgs);          // before logging + rate-limit key
const scrubbedResult = redactPii(toolResult);      // before logging response preview
```

---

## 4. Per-tool permission scoping — destructive allowlist

Destructive tools (`delete_*`, `cancel_*`, `void_*`, `refund_*`) MUST be gated at the server level. The gate fires before rate limiting and before the handler.

- Default: ALL destructive tools are blocked unless `ALLOW_DESTRUCTIVE=true` or the tool name is in `DESTRUCTIVE_ALLOWLIST` (comma-separated env var).
- Provision via `wrangler secret put ALLOW_DESTRUCTIVE` (full unlock) or `wrangler secret put DESTRUCTIVE_ALLOWLIST` (per-tool).
- For stdio servers: parent process sets `process.env.ALLOW_DESTRUCTIVE` or `__MCP_ALLOW_DESTRUCTIVE` on the child.

See `reference/mcp-server-hardening.md` for `src/config.ts` and the `assertDestructiveAllowed` gate function.

---

## 5. Server-side validation — strict Zod, no passthrough

Every tool's input schema MUST use `.strict()` — unknown fields cause an immediate parse error. No `passthrough()`, no `catchall()`, no bare `z.object({})` without `.strict()`.

- All validation errors MUST be logged (with scrubbed args) before the error is thrown.

See `reference/mcp-server-hardening.md` for the dispatch enforcement pattern.

---

## 6. Tool documentation requirements

Every generated tool MUST have:

- **1-line description** — present in `server.tool('name', 'description here', schema, handler)`.
- **`@dangerous` JSDoc tag** — required on every destructive tool's handler function.

CI gate — run post-forge, fails build if counts don't match:

```bash
DESTRUCTIVE=$(grep -cE "server\.tool\s*\(\s*'(delete|cancel|void|refund|remove|purge|wipe|drop)_" src/index.ts)
TAGGED=$(grep -c '@dangerous' src/index.ts)
[ "$DESTRUCTIVE" -le "$TAGGED" ] || { echo "Missing @dangerous tags"; exit 1; }
```

---

## 7. Auth — transport-aware enforcement

### stdio transport

- Trusts the parent process. No bearer token check.
- `userId` for audit logs = `stdio:parent` (no real identity).
- If the stdio server will be exposed via a proxy or relay (e.g., MCP Bridge), treat it as HTTP and apply JWT verification.

### HTTP transport (Cloudflare Workers)

Every request MUST verify a CF Access JWT or static bearer token before reaching the MCP transport layer. No anonymous tool calls.

- CF Access JWT is preferred (zero-trust, no secret in client); static bearer token is the internal-service fallback.
- Apply CF Access policy to the Worker route — the Worker is the last line of auth defense, not the first, per `[[cf-zero-trust-access]]`.

See `reference/mcp-server-hardening.md` for the `verifyRequest` implementation.

---

## 8. Resource limits

Hard limits applied in the tool dispatch wrapper. Fail fast — never let an oversized payload reach the handler.

| Limit | Default | Override env var |
|---|---|---|
| Max args size (JSON bytes) | 64 KB | `MCP_MAX_ARGS_BYTES` |
| Max response size (JSON bytes) | 1 MB | `MCP_MAX_RESPONSE_BYTES` |
| Default tool timeout | 30s | `MCP_TOOL_TIMEOUT_MS` |
| Max concurrent tool calls per user | 4 | `MCP_MAX_CONCURRENT` |

See `reference/mcp-server-hardening.md` for the dispatch enforcement code.

---

## Hardening checklist (run before `/deploy-forged-mcp`)

- [ ] DO rate limiter wired + `wrangler.toml` binding added
- [ ] `mcp_tool_calls` D1 table migration created + applied
- [ ] `redactPii()` applied to all args + responses before logging
- [ ] Destructive allowlist gate in tool dispatch
- [ ] All tool schemas use `.strict()`
- [ ] All tools have 1-line description
- [ ] All destructive tools have `@dangerous` JSDoc tag + bash gate in CI
- [ ] HTTP servers: CF Access JWT + bearer fallback wired
- [ ] stdio servers: `userId = 'stdio:parent'` in log entries
- [ ] Resource limits (args, response, timeout) set in dispatch

---

## See

- `[[cf-do-rate-limiter]]` — Durable Object sliding-window pattern with hibernation
- `[[cf-zero-trust-access]]` — CF Access JWT verification + application policy
- `[[pii-handling-discipline]]` — SHA-256 hashing before storage, never raw values in audit rows
- `[[audit-mcp-fleet]]` — post-deploy healthcheck + drift detection for registered servers
- `[[supply-chain-integrity]]` — SHA-pin all action versions; `npm ci` in CI; Socket.dev behavioral scan
- `rules/ai-agent-security.md` — MCP tool poisoning, rug pulls, OAuth confused deputy
- `rules/auth-permissions-security-supervisor.md` — server-side enforcement layer
- `rules/tool-design-as-api.md` — narrow, typed, safe-by-default tools as the least-agency posture
