---
name: "cf-agents-do-pattern"
priority: 2
pack: "architecture"
triggers:
  - "agent"
  - "durable object"
  - "DO"
  - "stateful"
  - "websocket"
  - "RPC"
paths:
  - "**/wrangler.{toml,jsonc}"
  - "**/durable*"
  - "**/agents/**"
---

# Cloudflare Agents on Durable Objects

The canonical pattern for stateful AI agents on Cloudflare: each agent is a Durable Object with built-in SQLite, lazy state hydration, WebSocket broadcasts, and typed RPC via decorators.

Source: `cloudflare/agents` (★5.1k), `cloudflare/agents-starter` (★1.3k). See `[[cloudflare-lock-in-is-leverage]]` — reach for CF primitives directly.

## Why DO-per-agent

- **Isolation**: each agent has its own SQLite, its own state, its own WebSocket connections
- **Hibernation**: when idle, DO sleeps with zero cost; SQLite persists between invocations
- **Multi-tenant trivial**: one agent class = N agent instances, one per tenant/user
- **No external state store**: no Redis, no Pinecone for agent memory — SQLite covers it

## Pattern A: Agent class + lazy state

```ts
import { Agent, type Connection } from 'agents';

export class OrderAgent extends Agent<Env, { orders: Order[] }> {
  initialState = { orders: [] };

  // Lazy hydration — only loads from SQLite on first access
  // State broadcasts to all WebSocket connections on setState()
  async addOrder(order: Order) {
    const orders = [...this.state.orders, order];
    this.setState({ orders }); // broadcasts to all connected clients
  }
}
```

## Pattern B: `@callable()` decorator — typed RPC over WebSocket, no REST

```ts
import { callable } from 'agents';

export class OrderAgent extends Agent<Env, State> {
  @callable()
  async processOrder(orderId: string): Promise<OrderResult> {
    const row = this.sql<Order>`SELECT * FROM orders WHERE id = ${orderId}`;
    return { status: 'shipped', tracking: 'X123' };
  }
}

// Frontend (any client):
const result = await agent.processOrder('123'); // fully typed
```

No REST layer needed. No Hono routes. Type inference flows from agent class straight to client.

## Pattern C: `sql`` tagged template — direct SQLite

```ts
const rows = this.sql<{ id: string; amount: number }>`
  SELECT id, amount FROM orders
  WHERE tenant_id = ${tenantId} AND status = 'pending'
`;
```

Use `sql\`\`` for **per-agent** state. Use Drizzle + D1 for **shared** relational data. Don't conflate.

## Pattern D: Three-tier tool execution

```ts
const tools = {
  // 1. Server-side auto-execute (server has data + permission)
  getWeather: tool({
    description: 'Get current weather',
    inputSchema: z.object({ city: z.string() }),
    execute: async ({ city }) => ({ temp: 22 }),
  }),

  // 2. Client-side (browser computes — no `execute` fn)
  getUserTimezone: tool({
    description: 'Get user timezone',
    inputSchema: z.object({}),
    // browser intercepts, returns Intl.DateTimeFormat().resolvedOptions().timeZone
  }),

  // 3. Human-in-the-loop (approval gate)
  calculate: tool({
    description: 'Math operation',
    inputSchema: z.object({ a: z.number(), b: z.number(), operator: z.enum(['add', 'multiply']) }),
    needsApproval: async ({ a, b }) => Math.abs(a) > 1000 || Math.abs(b) > 1000,
    execute: async ({ a, b, operator }) => ({ result: ops[operator](a, b) }),
  }),
};
```

## Pattern E: `schedule()` — natural language → cron

```ts
const scheduleSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('scheduled'), date: z.string() }),
  z.object({ type: z.literal('delayed'), delayInSeconds: z.number() }),
  z.object({ type: z.literal('cron'), cron: z.string() }),
  z.object({ type: z.literal('no-schedule') }),
]);

// In a tool:
await this.schedule(input, 'executeTask', description, { idempotent: true });
```

## wrangler.jsonc — critical gotcha

```jsonc
{
  "durable_objects": {
    "bindings": [{ "name": "ORDER_AGENT", "class_name": "OrderAgent" }]
  },
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["OrderAgent"] }
  ]
}
```

Use `new_sqlite_classes` (NOT `new_classes`) to enable DO built-in SQLite. `new_classes` gives KV-style storage only, no `sql\`\`` template.

## Anti-patterns (***avoid***)

- ❌ `AIChatAgent` / `@cloudflare/ai-chat` — deprecated in the monorepo, use `Agent<Env, State>` directly
- ❌ React hooks `useAgent`, `useAgentChat` — your stack is TanStack Router/Start; use `AgentClient` (non-React) for SSR-safe wiring
- ❌ MCP server mode for internal agent→agent RPC — `@callable()` + typed WS is simpler
- ❌ Storing agent state in D1 — use `sql\`\`` inside the DO instead; D1 is for shared/relational

## Cross-link

- `[[cloudflare-lock-in-is-leverage]]` — reach for DO instead of Redis/Pinecone
- `[[zod-everywhere]]` — every tool inputSchema is Zod
- `[[ai-agent-supervisor]]` — multi-agent coordination patterns
- `[[contract-first-ai]]` — typed tool contracts, schema-bound
- `cf-rag-vectorize-pattern` (this dir) — pair agents with Vectorize for RAG
- `cf-workflows-pattern` (this dir) — agent calls `workflow.create()` for durable jobs
