---
name: "MCP HTTP Server on CF Workers"
description: "MCP server hosted on Cloudflare Workers using HTTP+SSE transport. Hono router + @modelcontextprotocol/sdk StreamableHTTPServerTransport. Auth via CF Zero Trust Access or Bearer token. wrangler.toml binding config. Registration in .claude.json as a remote server."
updated: "2026-06-18"
---

# MCP HTTP Server on Cloudflare Workers

Workers + HTTP transport = zero infra, global presence, per-request billing, CF Zero Trust
auth for free. This is the `[[cloudflare-lock-in-is-leverage]]` play for MCP.

Ref: modelcontextprotocol.io/docs/concepts/transports, `@modelcontextprotocol/sdk` StreamableHTTPServerTransport.

---

## Why HTTP+SSE on Workers (not stdio)

- **Shared access** — multiple Claude Code users / agents hit the same endpoint, authenticated individually.
- **CF primitives** — D1, R2, KV, Vectorize, AI binding wired directly in `env`. No REST API calls.
- **Zero Trust** — put the MCP endpoint behind CF Access for BYOD auth without writing auth code.
- **Streaming** — SSE allows progress events for long-running tool calls (e.g. bulk D1 migrations).
- **Cost** — Workers free tier covers ~10M requests/mo. MCP tool calls are lightweight JSON-RPC.

---

## Package setup

```json
// package.json (in your Workers monorepo or standalone worker)
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.0",
    "hono": "^4.7.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "wrangler": "^4.0.0",
    "typescript": "^5.9.0"
  }
}
```

---

## wrangler.toml

```toml
name = "my-mcp-worker"
main = "src/index.ts"
compatibility_date = "2025-09-01"
compatibility_flags = ["nodejs_compat"]

[ai]
binding = "AI"

[[d1_databases]]
binding = "DB"
database_name = "production"
database_id = "your-d1-id"

[[kv_namespaces]]
binding = "KV"
id = "your-kv-id"

[vars]
MCP_SECRET = "set-via-wrangler-secret"  # wrangler secret put MCP_SECRET

# CF Access service token for machine-to-machine auth (optional)
# CF_ACCESS_CLIENT_ID = "set-via-wrangler-secret"
# CF_ACCESS_CLIENT_SECRET = "set-via-wrangler-secret"
```

---

## Full Worker: `src/index.ts`

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// ── CF Worker env type ────────────────────────────────────────────────────────

interface Env {
  AI: Ai;
  DB: D1Database;
  KV: KVNamespace;
  MCP_SECRET: string;
}

// ── Zod schemas (all tool boundaries) ────────────────────────────────────────

const SearchKnowledgeBaseInputSchema = z.object({
  query: z.string().min(1).max(500).describe('Semantic search query'),
  top_k: z.number().int().min(1).max(20).default(5).describe('Number of results to return'),
});

const SearchKnowledgeBaseOutputSchema = z.object({
  results: z.array(
    z.object({
      id: z.string(),
      score: z.number(),
      text: z.string(),
      source: z.string(),
    }),
  ),
});

const RunSqlInputSchema = z.object({
  sql: z.string().min(1).describe('READ-ONLY SQL query (SELECT only)'),
  params: z.array(z.union([z.string(), z.number(), z.null()])).optional(),
});

// ── MCP server factory (one per request — stateless HTTP transport) ───────────

function createMcpServer(env: Env): Server {
  const server = new Server(
    { name: 'cf-worker-mcp', version: '1.0.0' },
    { capabilities: { tools: {}, resources: {} } },
  );

  // Tool: search-knowledge-base (Workers AI + Vectorize)
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'search_knowledge_base',
        description:
          'Semantic search over the project knowledge base using Workers AI embeddings and Vectorize. Returns ranked text chunks with source attribution.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            query: { type: 'string', description: 'Search query' },
            top_k: { type: 'number', description: 'Results to return (1-20)', default: 5 },
          },
          required: ['query'],
        },
      },
      {
        name: 'run_read_query',
        description:
          'Run a read-only SQL SELECT against the project D1 database. Rejects any mutating SQL.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            sql: { type: 'string', description: 'SELECT query' },
            params: { type: 'array', items: {}, description: 'Positional params' },
          },
          required: ['sql'],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    // ── search_knowledge_base ─────────────────────────────────────────────────
    if (request.params.name === 'search_knowledge_base') {
      const input = SearchKnowledgeBaseInputSchema.parse(request.params.arguments);

      try {
        const embedResult = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
          text: [input.query],
        });
        // @ts-expect-error — Workers AI types vary by model
        const vector: number[] = embedResult.data[0].values;

        // NOTE: add Vectorize binding to wrangler.toml if using vector search
        // const matches = await env.VECTORIZE.query(vector, { topK: input.top_k });

        // Stub result (wire Vectorize for production)
        const output = SearchKnowledgeBaseOutputSchema.parse({
          results: [{ id: 'stub-1', score: 0.99, text: 'Stub — wire Vectorize binding.', source: 'wrangler.toml' }],
        });

        return { content: [{ type: 'text' as const, text: JSON.stringify(output, null, 2) }] };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ code: 'AI_ERROR', message: String(err) }),
            },
          ],
        };
      }
    }

    // ── run_read_query ────────────────────────────────────────────────────────
    if (request.params.name === 'run_read_query') {
      const input = RunSqlInputSchema.parse(request.params.arguments);

      // Hard guard: only SELECT statements
      if (!/^\s*SELECT\b/i.test(input.sql)) {
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ code: 'FORBIDDEN', message: 'Only SELECT queries are permitted.' }),
            },
          ],
        };
      }

      try {
        const result = await env.DB.prepare(input.sql)
          .bind(...(input.params ?? []))
          .all();
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ rows: result.results, count: result.results.length }, null, 2) }],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text' as const, text: JSON.stringify({ code: 'DB_ERROR', message: String(err) }) }],
        };
      }
    }

    return {
      isError: true,
      content: [{ type: 'text' as const, text: `Unknown tool: ${request.params.name}` }],
    };
  });

  // Resource: kv/{key}
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      {
        uri: 'kv://{key}',
        name: 'KV Store Value',
        description: 'Read a value from the project KV namespace by key.',
        mimeType: 'text/plain',
      },
    ],
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    const match = uri.match(/^kv:\/\/(.+)$/);
    if (!match?.[1]) {
      return { contents: [{ uri, mimeType: 'text/plain', text: 'Invalid KV URI' }] };
    }
    const value = await env.KV.get(match[1]);
    return {
      contents: [
        {
          uri,
          mimeType: 'text/plain',
          text: value ?? `Key "${match[1]}" not found in KV namespace`,
        },
      ],
    };
  });

  return server;
}

// ── Hono app ─────────────────────────────────────────────────────────────────

const app = new Hono<{ Bindings: Env }>();

app.use('/mcp', cors({ origin: '*', allowHeaders: ['Content-Type', 'Authorization', 'mcp-session-id'] }));

// Bearer auth middleware
app.use('/mcp', async (c, next) => {
  const auth = c.req.header('Authorization');
  if (!auth || auth !== `Bearer ${c.env.MCP_SECRET}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  return next();
});

// MCP endpoint — stateless HTTP transport (one server instance per request)
app.all('/mcp', async (c) => {
  const server = createMcpServer(c.env);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });

  await server.connect(transport);

  const req = c.req.raw;
  const response = await transport.handleRequest(req);
  return response;
});

// Health check (unauthenticated — used by deploy-verifier)
app.get('/health', (c) => c.json({ status: 'ok', server: 'cf-worker-mcp', ts: Date.now() }));

export default app;
```

---

## Authentication options

### Option A — Bearer token (simple, secret-based)

Set via `wrangler secret put MCP_SECRET`. The middleware above enforces it. Register in
`.claude.json` as:

```json
{
  "mcpServers": {
    "cf-worker-mcp": {
      "url": "https://my-mcp-worker.workers.dev/mcp",
      "headers": { "Authorization": "Bearer <MCP_SECRET>" }
    }
  }
}
```

### Option B — CF Zero Trust Access (team/enterprise)

1. Create a CF Access application protecting `https://my-mcp-worker.workers.dev/mcp`.
2. Create a Service Token (client ID + secret) for each Claude Code user / agent.
3. Pass `CF-Access-Client-Id` + `CF-Access-Client-Secret` as headers in `.claude.json`.
4. Remove the Bearer middleware — CF Access handles it at the edge before the Worker runs.

Per `05-architecture-and-stack/cf-zero-trust-access.md`.

---

## Deploy + smoke-test

```bash
# Deploy
wrangler deploy

# Set secrets
wrangler secret put MCP_SECRET

# Smoke-test via inspector (points at live Worker)
npx @modelcontextprotocol/inspector https://my-mcp-worker.workers.dev/mcp

# Health check
curl https://my-mcp-worker.workers.dev/health
```

Post-deploy E2E: add a Playwright spec that calls `/health` and verifies `200 { status: 'ok' }`.
Per `08-deploy-and-runtime-verification/` deploy mandate.

---

## Stateful sessions via Durable Objects (optional)

For tools that need conversation-scoped state (e.g. multi-turn SQL query builder):

```typescript
// In wrangler.toml
[[durable_objects.bindings]]
name = "MCP_SESSION"
class_name = "McpSessionDO"

// In src/mcp-session.do.ts — store session state in DO storage
export class McpSessionDO implements DurableObject {
  // Per modelcontextprotocol.io: session ID from mcp-session-id header
  // maps 1:1 to DO instance
}
```

Per `05-architecture-and-stack/cf-agents-do-pattern.md`.

---

## Rules

- One `createMcpServer()` call per request — `StreamableHTTPServerTransport` is stateless.
- SELECT-only guard on `run_read_query` — never expose a write-capable SQL tool without
  explicit `approval-required` tier per `rules/autonomous-engineering.md`.
- All secrets via `wrangler secret put` — never in `wrangler.toml` vars.
- `/health` always unauthenticated — used by deploy-verifier.

## See

- `19-mcp-authoring/stdio-server-template.md` — local stdio variant
- `[[cloudflare-lock-in-is-leverage]]` — Workers over third-party MCP hosts
- `[[ai-agent-supervisor]]` — tool scope and approval tiers
- `05-architecture-and-stack/cf-agents-do-pattern.md` — stateful DO sessions
- modelcontextprotocol.io/docs/concepts/transports
