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

Every MCP server gets a Durable Object rate limiter attached at the tool-dispatch layer. Use the `cf-do-rate-limiter` pattern:

```ts
// src/rate-limiter.ts
export class McpRateLimiter implements DurableObject {
  private requests: number[] = [];

  async fetch(req: Request): Promise<Response> {
    const body = await req.json<{ toolName: string; windowMs: number; limit: number }>();
    const now = Date.now();
    this.requests = this.requests.filter(t => t > now - body.windowMs);
    if (this.requests.length >= body.limit) {
      return Response.json({ allowed: false, retryAfter: Math.ceil((this.requests[0] + body.windowMs - now) / 1000) }, { status: 429 });
    }
    this.requests.push(now);
    return Response.json({ allowed: true });
  }
}
```

Wire into `src/index.ts` tool dispatch:

```ts
async function checkRateLimit(env: Env, toolName: string, userId: string): Promise<void> {
  const key = `${userId}:${toolName}`;
  const id = env.MCP_RATE_LIMITER.idFromName(key);
  const stub = env.MCP_RATE_LIMITER.get(id);
  const cfg = TOOL_RATE_LIMITS[toolName] ?? { windowMs: 60_000, limit: 60 };
  const res = await stub.fetch('https://do/', { method: 'POST', body: JSON.stringify({ toolName, ...cfg }) });
  const { allowed, retryAfter } = await res.json<{ allowed: boolean; retryAfter?: number }>();
  if (!allowed) throw new McpError(ErrorCode.InvalidRequest, `Rate limit exceeded for ${toolName}. Retry in ${retryAfter}s.`);
}
```

**Default limits per tool class** (override in `TOOL_RATE_LIMITS` map):

| Class | window | limit |
|---|---|---|
| read (`list_*`, `get_*`, `search_*`) | 60s | 120 |
| write (`create_*`, `update_*`) | 60s | 30 |
| destructive (`delete_*`, `cancel_*`, `void_*`, `refund_*`) | 300s | 5 |
| default (unclassified) | 60s | 60 |

Add `MCP_RATE_LIMITER` to `wrangler.toml`:

```toml
[[durable_objects.bindings]]
name = "MCP_RATE_LIMITER"
class_name = "McpRateLimiter"
```

---

## 2. Audit logging — `mcp_tool_calls` D1 table

Every tool invocation — success or failure — is logged before the response is returned to the client. No exceptions.

### Schema (add to migration file)

```sql
CREATE TABLE IF NOT EXISTS mcp_tool_calls (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp   TEXT    NOT NULL DEFAULT (datetime('now')),
  tool_name   TEXT    NOT NULL,
  args_sha256 TEXT    NOT NULL,           -- SHA-256 of scrubbed args JSON, hex-encoded
  response_status TEXT NOT NULL,          -- 'success' | 'error' | 'rate_limited' | 'auth_denied'
  latency_ms  INTEGER NOT NULL,
  user_id     TEXT    NOT NULL,           -- CF Access JWT sub claim, or 'stdio:parent' for stdio transport
  server_name TEXT    NOT NULL,           -- from package.json "name"
  error_code  TEXT                        -- MCP ErrorCode string, null on success
);

CREATE INDEX IF NOT EXISTS idx_mcp_tool_calls_timestamp ON mcp_tool_calls(timestamp);
CREATE INDEX IF NOT EXISTS idx_mcp_tool_calls_tool      ON mcp_tool_calls(tool_name, timestamp);
CREATE INDEX IF NOT EXISTS idx_mcp_tool_calls_user      ON mcp_tool_calls(user_id, timestamp);
```

### Logging wrapper

```ts
async function logToolCall(env: Env, entry: {
  toolName: string;
  scrubbedArgs: unknown;
  status: 'success' | 'error' | 'rate_limited' | 'auth_denied';
  latencyMs: number;
  userId: string;
  errorCode?: string;
}): Promise<void> {
  const argsJson = JSON.stringify(entry.scrubbedArgs);
  const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(argsJson));
  const argsSha256 = [...new Uint8Array(hashBuf)].map(b => b.toString(16).padStart(2, '0')).join('');

  await env.DB.prepare(
    `INSERT INTO mcp_tool_calls (tool_name, args_sha256, response_status, latency_ms, user_id, server_name, error_code)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(entry.toolName, argsSha256, entry.status, entry.latencyMs, entry.userId, SERVER_NAME, entry.errorCode ?? null).run();
}
```

**Retention**: add a nightly D1 cron that deletes rows older than 90 days (`DELETE FROM mcp_tool_calls WHERE timestamp < datetime('now', '-90 days')`).

---

## 3. Secret-scrubbing on tool inputs/outputs

Apply `redactPii()` from `template/utils/scrub-pii.ts` to BOTH the request args object AND the response body before any logging or error serialization. Raw values never enter the audit trail.

```ts
import { redactPii } from '../utils/scrub-pii.js';

// In tool dispatch wrapper:
const scrubbedArgs = redactPii(toolArgs);          // before logging + rate-limit key
const scrubbedResult = redactPii(toolResult);      // before logging response preview
```

Fields automatically redacted by `redactPii()` (from `scrub-pii.ts`):

- Credit card patterns, SSN, API keys, bearer tokens, password-like fields, email addresses, phone numbers
- Any key matching `/^(token|secret|key|password|auth|bearer|ssn|cc_number|card)/i`

**Do not pass raw args to `logToolCall`.** Always pass `scrubbedArgs`.

---

## 4. Per-tool permission scoping — destructive allowlist

Destructive tools (`delete_*`, `cancel_*`, `void_*`, `refund_*`) are gated at the server level. The gate fires before rate limiting and before the tool handler runs.

### Server startup flag

```ts
// src/config.ts
export const ALLOW_DESTRUCTIVE = env.ALLOW_DESTRUCTIVE === 'true'
  || (globalThis as any).__MCP_ALLOW_DESTRUCTIVE === true;  // set by parent process for stdio

export const DESTRUCTIVE_ALLOWLIST: Set<string> = new Set(
  (env.DESTRUCTIVE_ALLOWLIST ?? '').split(',').map(s => s.trim()).filter(Boolean)
);
```

### Gate logic (runs in tool dispatch, before handler)

```ts
function assertDestructiveAllowed(toolName: string): void {
  const isDestructive = /^(delete|cancel|void|refund|remove|purge|wipe|drop)_/.test(toolName);
  if (!isDestructive) return;

  if (!ALLOW_DESTRUCTIVE && !DESTRUCTIVE_ALLOWLIST.has(toolName)) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      `Tool "${toolName}" is destructive and not in the allowlist. ` +
      `Set ALLOW_DESTRUCTIVE=true or add to DESTRUCTIVE_ALLOWLIST env var to enable.`
    );
  }
}
```

### Wrangler secret provisioning

```bash
# Enable all destructive tools (use with care):
wrangler secret put ALLOW_DESTRUCTIVE    # enter: true

# Or allowlist specific tools only (preferred):
wrangler secret put DESTRUCTIVE_ALLOWLIST  # enter: delete_item,cancel_subscription
```

For stdio servers, the parent process sets `process.env.ALLOW_DESTRUCTIVE` or `__MCP_ALLOW_DESTRUCTIVE` on the child.

---

## 5. Server-side validation — strict Zod, no passthrough

Every tool's input schema is declared with strict Zod (`.strict()` — unknown fields cause an immediate parse error). No `passthrough()`, no `catchall()`, no bare `z.object({})` without `.strict()`.

```ts
// WRONG — accepts arbitrary extra fields
const schema = z.object({ id: z.string() });

// CORRECT — rejects unknown fields
const schema = z.object({ id: z.string() }).strict();
```

Enforcement pattern in tool dispatch:

```ts
const parsed = schema.safeParse(toolArgs);
if (!parsed.success) {
  await logToolCall(env, { toolName, scrubbedArgs: redactPii(toolArgs), status: 'error',
    latencyMs: 0, userId, errorCode: 'InvalidParams' });
  throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
}
```

**All validation errors are logged** (with scrubbed args) before the error is thrown.

---

## 6. Tool documentation requirements

Every generated tool MUST have:

- **1-line description** — present in `server.tool('name', 'description here', schema, handler)`
- **`@dangerous` JSDoc tag** — required on any destructive tool's handler function

```ts
/**
 * Delete a customer record. Irreversible.
 * @dangerous
 */
server.tool(
  'delete_customer',
  'Permanently delete a customer record by ID. Irreversible.',
  z.object({ customerId: z.string().describe('Customer ID to delete') }).strict(),
  async (args) => { /* ... */ }
);
```

Forge validation rule: CI fails (`grep -c '@dangerous'` vs destructive tool count) if destructive tools lack the `@dangerous` tag. Run post-forge:

```bash
DESTRUCTIVE=$(grep -cE "server\.tool\s*\(\s*'(delete|cancel|void|refund|remove|purge|wipe|drop)_" src/index.ts)
TAGGED=$(grep -c '@dangerous' src/index.ts)
[ "$DESTRUCTIVE" -le "$TAGGED" ] || { echo "Missing @dangerous tags"; exit 1; }
```

---

## 7. Auth — transport-aware enforcement

### stdio transport

- Trusts the parent process. No bearer token check.
- `userId` for audit logs = `stdio:parent` (no real identity — log the invocation, not the actor).
- If the stdio server will be exposed via a proxy or relay (e.g., MCP Bridge), treat it as HTTP and apply JWT verification.

### HTTP transport (Cloudflare Workers)

Every request to the MCP endpoint MUST verify a bearer token or CF Access JWT. No anonymous tool calls.

```ts
// src/auth.ts
import { jwtVerify, createRemoteJWKSet } from 'jose';

const CF_ACCESS_CERTS = createRemoteJWKSet(
  new URL(`https://${CF_ACCESS_TEAM}.cloudflareaccess.com/cdn-cgi/access/certs`)
);

export async function verifyRequest(req: Request, env: Env): Promise<string> {
  // 1. Try CF Access JWT (preferred — zero-trust, no secret in client)
  const cfJwt = req.headers.get('Cf-Access-Jwt-Assertion');
  if (cfJwt) {
    const { payload } = await jwtVerify(cfJwt, CF_ACCESS_CERTS, { audience: env.CF_ACCESS_AUD });
    return String(payload.sub ?? payload.email ?? 'cf-access:unknown');
  }

  // 2. Fall back to static bearer token (internal services)
  const auth = req.headers.get('Authorization') ?? '';
  if (auth.startsWith('Bearer ') && auth.slice(7) === env.MCP_API_TOKEN) {
    return 'bearer:internal';
  }

  throw new McpError(ErrorCode.InvalidRequest, 'Unauthorized — CF Access JWT or Bearer token required.');
}
```

Add to Hono handler or raw `fetch` entry point BEFORE routing to MCP transport layer.

Per `[[cf-zero-trust-access]]`: apply CF Access policy to the Worker's route — the Worker is the last line of auth defense, not the first.

---

## 8. Resource limits

Hard limits applied in the tool dispatch wrapper. Fail fast — never let an oversized payload reach the handler.

| Limit | Default | Override env var |
|---|---|---|
| Max args size (JSON bytes) | 64 KB | `MCP_MAX_ARGS_BYTES` |
| Max response size (JSON bytes) | 1 MB | `MCP_MAX_RESPONSE_BYTES` |
| Default tool timeout | 30s | `MCP_TOOL_TIMEOUT_MS` |
| Max concurrent tool calls per user | 4 | `MCP_MAX_CONCURRENT` |

```ts
// In dispatch before Zod parse:
const argsStr = JSON.stringify(toolArgs);
const maxArgs = parseInt(env.MCP_MAX_ARGS_BYTES ?? '65536');
if (argsStr.length > maxArgs) {
  throw new McpError(ErrorCode.InvalidParams, `Args payload ${argsStr.length}B exceeds limit ${maxArgs}B`);
}

// Wrap handler with timeout:
const maxMs = parseInt(env.MCP_TOOL_TIMEOUT_MS ?? '30000');
const result = await Promise.race([
  handler(parsed.data),
  new Promise<never>((_, rej) => setTimeout(() => rej(new McpError(ErrorCode.InternalError, 'Tool timeout')), maxMs))
]);

// Check response size before returning:
const resStr = JSON.stringify(result);
const maxRes = parseInt(env.MCP_MAX_RESPONSE_BYTES ?? '1048576');
if (resStr.length > maxRes) {
  throw new McpError(ErrorCode.InternalError, `Response ${resStr.length}B exceeds limit ${maxRes}B — tool must paginate`);
}
```

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
