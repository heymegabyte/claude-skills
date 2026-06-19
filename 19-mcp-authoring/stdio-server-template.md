---
name: "MCP stdio Server Template"
description: "Complete TypeScript MCP server with stdio transport. Includes sample tool (D1 query), sample resource (R2 file), sample prompt (brief-generator). Uses @modelcontextprotocol/sdk/server. Copy-paste starting point for local dev tools and CLI-resident integrations."
updated: "2026-06-18"
---

# MCP stdio Server — TypeScript Template

Full working server. Copy `mcp-server/` into any repo, wire `tsconfig.json`, run
`npx tsc && node dist/index.js` — then register in `.claude.json`.

Ref: modelcontextprotocol.io/docs/concepts/architecture, `@modelcontextprotocol/sdk` v1.x.

---

## Package setup

```json
// mcp-server/package.json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.9.0",
    "tsx": "^4.19.0",
    "@types/node": "^22.0.0"
  }
}
```

```json
// mcp-server/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

---

## Full server: `mcp-server/src/index.ts`

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import Database from 'better-sqlite3'; // swap for D1 REST API in CI
import { readFileSync } from 'node:fs';

// ── Zod schemas ──────────────────────────────────────────────────────────────

const QueryDonorsInputSchema = z.object({
  min_amount: z.number().min(0).describe('Minimum donation amount in USD'),
  limit: z.number().int().min(1).max(100).default(20).describe('Max rows to return'),
});

const QueryDonorsOutputSchema = z.object({
  donors: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      total_donated: z.number(),
      last_gift_date: z.string(),
    }),
  ),
  count: z.number(),
});

const GenerateBriefInputSchema = z.object({
  organization: z.string().describe('Nonprofit name'),
  quarter: z.string().describe('Quarter, e.g. Q1 2026'),
  total_raised: z.number().describe('Total dollars raised this quarter'),
  top_program: z.string().describe('Name of the top-funded program'),
});

// ── Server init ──────────────────────────────────────────────────────────────

const server = new Server(
  {
    name: 'nonprofit-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  },
);

// ── Tool: query-donors ───────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'query_donors',
      description:
        'Query donor records from the local D1 database by minimum donation amount. Returns donor name, total donated, and last gift date.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          min_amount: {
            type: 'number',
            description: 'Minimum donation amount in USD',
          },
          limit: {
            type: 'number',
            description: 'Max rows to return (1-100)',
            default: 20,
          },
        },
        required: ['min_amount'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'query_donors') {
    // Validate input at the boundary
    const input = QueryDonorsInputSchema.parse(request.params.arguments);

    try {
      // Swap for D1 REST API or Drizzle query in production
      const db = new Database(process.env['DB_PATH'] ?? ':memory:');
      const rows = db
        .prepare(
          'SELECT id, name, total_donated, last_gift_date FROM donors WHERE total_donated >= ? LIMIT ?',
        )
        .all(input.min_amount, input.limit);

      // Validate output at the boundary
      const output = QueryDonorsOutputSchema.parse({ donors: rows, count: rows.length });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(output, null, 2),
          },
        ],
      };
    } catch (err) {
      // MCP error convention: isError=true + structured message
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              code: 'DB_ERROR',
              message: err instanceof Error ? err.message : 'Unknown database error',
            }),
          },
        ],
      };
    }
  }

  return {
    isError: true,
    content: [{ type: 'text' as const, text: `Unknown tool: ${request.params.name}` }],
  };
});

// ── Resource: annual-report/{year} ──────────────────────────────────────────

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'file:///reports/{year}.md',
      name: 'Annual Report',
      description: 'Markdown annual report for the given year. Substitute {year} with e.g. 2025.',
      mimeType: 'text/markdown',
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  const match = uri.match(/^file:\/\/\/reports\/(\d{4})\.md$/);

  if (!match?.[1]) {
    return {
      contents: [
        {
          uri,
          mimeType: 'text/plain',
          text: 'Error: URI must match file:///reports/{year}.md',
        },
      ],
    };
  }

  const year = match[1];
  const reportsDir = process.env['REPORTS_DIR'] ?? './reports';

  try {
    const content = readFileSync(`${reportsDir}/${year}.md`, 'utf-8');
    return {
      contents: [
        {
          uri,
          mimeType: 'text/markdown',
          text: content,
        },
      ],
    };
  } catch {
    return {
      contents: [
        {
          uri,
          mimeType: 'text/plain',
          text: `Annual report for ${year} not found at ${reportsDir}/${year}.md`,
        },
      ],
    };
  }
});

// ── Prompt: donor-brief-generator ───────────────────────────────────────────

server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: 'donor_brief_generator',
      description: 'Generates a concise quarterly donor brief for a nonprofit.',
      arguments: [
        { name: 'organization', description: 'Nonprofit name', required: true },
        { name: 'quarter', description: 'Quarter, e.g. Q1 2026', required: true },
        { name: 'total_raised', description: 'Total dollars raised', required: true },
        { name: 'top_program', description: 'Top-funded program name', required: true },
      ],
    },
  ],
}));

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name === 'donor_brief_generator') {
    const args = GenerateBriefInputSchema.parse(request.params.arguments);
    return {
      description: 'Quarterly donor brief prompt',
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Write a 2-paragraph donor brief for ${args.organization}.
Quarter: ${args.quarter}
Total raised: $${args.total_raised.toLocaleString()}
Top program: ${args.top_program}

Be factual, specific, and professional. No fluff. Include the dollar figure verbatim.`,
          },
        },
      ],
    };
  }

  throw new Error(`Unknown prompt: ${request.params.name}`);
});

// ── Boot ─────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdio transport reads from stdin, writes to stdout — no port needed
  // Log to stderr only: stdout is reserved for JSON-RPC protocol messages
  process.stderr.write('nonprofit-mcp server running on stdio\n');
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
```

---

## .claude.json registration

```json
{
  "mcpServers": {
    "nonprofit-mcp": {
      "command": "node",
      "args": ["/Users/Apple/emdash/mcp-server/dist/index.js"],
      "env": {
        "DB_PATH": "/Users/Apple/emdash/data/donors.db",
        "REPORTS_DIR": "/Users/Apple/emdash/reports"
      }
    }
  }
}
```

---

## Smoke-test

```bash
npx @modelcontextprotocol/inspector node dist/index.js
# Opens at http://localhost:5173 — test each tool/resource/prompt interactively
```

---

## Rules

- **stderr only for logs** — stdout is the JSON-RPC wire; any non-protocol write breaks the transport.
- **Zod at every boundary** — input schema before touching the system, output schema before returning.
- **isError pattern** — never throw from a tool handler; return `{ isError: true, content: [{ type: 'text', text: JSON.stringify({ code, message }) }] }`.
- **No secrets in tool schemas** — secrets live in `.claude.json` `env` block and arrive via `process.env`.

## See

- `19-mcp-authoring/http-server-on-workers.md` — HTTP+SSE variant for CF Workers
- `19-mcp-authoring/forge-mcp-from-openapi.md` — auto-generate from OpenAPI spec
- `[[cloudflare-lock-in-is-leverage]]` — when to prefer HTTP transport
- modelcontextprotocol.io/docs/concepts/tools
