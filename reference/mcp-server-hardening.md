# MCP Server Hardening — Implementation Reference

Sourced on demand by `rules/mcp-server-hardening.md`.

---

## 1. Per-tool rate limiting — DO sliding-window implementation

`McpRateLimiter` Durable Object + `checkRateLimit` dispatch helper. The DO tracks
per-user/per-tool request timestamps in memory; the helper reads `TOOL_RATE_LIMITS`
config and throws `McpError` on 429. Add the `MCP_RATE_LIMITER` DO binding to
`wrangler.toml`.

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

```ts
// src/index.ts — tool dispatch helper
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

`wrangler.toml` binding:

```toml
[[durable_objects.bindings]]
name = "MCP_RATE_LIMITER"
class_name = "McpRateLimiter"
```

---

## 2. Audit logging — `mcp_tool_calls` D1 schema + `logToolCall` helper

D1 DDL and the `logToolCall` wrapper. Hash args with SHA-256 before storing — never raw values.
Nightly cron purges rows older than 90 days.

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

---

## 3. Destructive tool gate — `src/config.ts` + `assertDestructiveAllowed`

`ALLOW_DESTRUCTIVE` env var enables all destructive tools; `DESTRUCTIVE_ALLOWLIST` is a
comma-separated list for per-tool allowlisting. Gate fires in dispatch before rate
limiting and before the handler.

```ts
// src/config.ts
export const ALLOW_DESTRUCTIVE = env.ALLOW_DESTRUCTIVE === 'true'
  || (globalThis as any).__MCP_ALLOW_DESTRUCTIVE === true;  // set by parent process for stdio

export const DESTRUCTIVE_ALLOWLIST: Set<string> = new Set(
  (env.DESTRUCTIVE_ALLOWLIST ?? '').split(',').map(s => s.trim()).filter(Boolean)
);
```

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

Provision secrets:

```bash
# Enable all destructive tools (use with care):
wrangler secret put ALLOW_DESTRUCTIVE    # enter: true

# Or allowlist specific tools only (preferred):
wrangler secret put DESTRUCTIVE_ALLOWLIST  # enter: delete_item,cancel_subscription
```

For stdio servers, the parent process sets `process.env.ALLOW_DESTRUCTIVE` or
`__MCP_ALLOW_DESTRUCTIVE` on the child.

---

## 4. Auth — `verifyRequest` for HTTP transport

CF Access JWT preferred; static bearer token as internal fallback. Add to Hono handler
or raw `fetch` entry point BEFORE routing to MCP transport layer.

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

---

## 5. Resource limits — dispatch enforcement code

Enforce in dispatch before Zod parse. Fail fast — never let oversized payloads reach
the handler. Limits are configurable via env vars (defaults in the rule's table).

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

## 6. Zod `.strict()` enforcement pattern

Full dispatch pattern showing validation error logging before throwing.

```ts
// WRONG — accepts arbitrary extra fields
const schema = z.object({ id: z.string() });

// CORRECT — rejects unknown fields
const schema = z.object({ id: z.string() }).strict();

// Enforcement in dispatch:
const parsed = schema.safeParse(toolArgs);
if (!parsed.success) {
  await logToolCall(env, { toolName, scrubbedArgs: redactPii(toolArgs), status: 'error',
    latencyMs: 0, userId, errorCode: 'InvalidParams' });
  throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
}
```
