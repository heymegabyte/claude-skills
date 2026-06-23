---
name: "mcp-authoring"
description: "When to author an MCP server, architecture overview (tools/resources/prompts), stdio vs HTTP+SSE transport tradeoffs, registration in .claude.json. Sub-modules: stdio-server-template.md (full TS code), http-server-on-workers.md (Hono + SSE on CF Workers), forge-mcp-from-openapi.md (extend forge script with --target=mcp-server). Fires when user asks to 'build an MCP server', 'expose X as an MCP tool', or 'add MCP to my Worker'."
when_to_use: "Any request to author, scaffold, or extend an MCP server — whether standalone stdio for local dev tools or HTTP transport on CF Workers for shareable AI integrations."
effort: "high"
model: "sonnet"
priority: 5
pack: "ai"
triggers:
  - "MCP server"
  - "model context protocol"
  - "mcp tool"
  - "mcp resource"
  - "mcp prompt"
  - "stdio transport"
  - "claude.json"
  - "expose API as MCP"
paths:
  - "src/worker/**"
  - "workers/**"
  - "mcp-server/**"
  - ".claude.json"
submodules:
  - stdio-server-template.md
  - http-server-on-workers.md
  - forge-mcp-from-openapi.md
---

# 19 — MCP Authoring

Three primitive types:

- **Tools** — callable functions (JSON schema input → structured output). Model decides when to call. "Do something."
- **Resources** — addressable content (files, DB rows, feeds) returned as text/binary. "Read something."
- **Prompts** — reusable templates with typed args. "Fill and inject."

Source authority: modelcontextprotocol.io/introduction, `@modelcontextprotocol/sdk` NPM.

## When to author an MCP server

Build when:

- A REST API/Worker would provide genuine agent value and schema-wrapping cost < benefit
- Tool set needs sharing across multiple Claude sessions without copy-pasting prompts
- CF Worker owns business logic and you want Claude persistent auth-aware access (HTTP transport = zero extra infra)
- Extending the forge pipeline (`--target=mcp-server` — see `forge-mcp-from-openapi.md`)

Do NOT build when a simple `[[hono-api]]` route + direct `fetch` suffices — MCP adds SDK overhead not justified for one-off integrations.

## Architecture

```
Claude Code / Claude Desktop
        │ JSON-RPC 2.0
        ▼
 ┌──────────────┐
 │  MCP Server  │
 │  ┌────────┐  │
 │  │ tools  │  │  ← JSON-schema validated inputs + Zod-validated outputs
 │  ├────────┤  │
 │  │resourc.│  │  ← URI-addressed, MIME-typed
 │  ├────────┤  │
 │  │prompts │  │  ← Named templates with typed args
 │  └────────┘  │
 └──────────────┘
        │
        ▼
 External system (D1 / R2 / Vectorize / external API)
```

Every tool input: `z.parse()` before hitting the system. Every result: Zod-validated before returning. Per `[[contract-first-ai]]` and `[[zod-everywhere]]`.

## Transport decision

| Criterion | stdio | HTTP + SSE |
|---|---|---|
| Where it runs | Local process, same machine as Claude | Any origin — CF Workers, remote server |
| Auth | None (process-level trust) | HTTP headers, Bearer tokens, CF Zero Trust |
| Session state | Process lifetime | DO / KV per session ID |
| Streaming | Native (stdout) | SSE (`text/event-stream`) |
| Setup | `~/.claude.json` mcpServers entry | CF Worker deploy + `.claude.json` remote entry |
| Best for | Dev tools, local scripts, secret-laden CLIs | Shared team tools, SaaS integrations, per-user auth |

Per `[[cloudflare-lock-in-is-leverage]]`: prefer HTTP on CF Workers over any third-party MCP host.

## .claude.json registration

### stdio server

```json
{
  "mcpServers": {
    "my-local-tool": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/dist/index.js"],
      "env": { "DB_PATH": "/Users/Apple/data/mydb.sqlite" }
    }
  }
}
```

### HTTP server (CF Workers)

```json
{
  "mcpServers": {
    "my-worker-tool": {
      "url": "https://my-mcp.workers.dev/mcp",
      "headers": { "Authorization": "Bearer ${MY_MCP_TOKEN}" }
    }
  }
}
```

Place at `~/.claude.json` (global) or `.claude.json` at repo root (project-scoped).

## Sub-modules

- `stdio-server-template.md` — complete TypeScript stdio server with sample tool + resource + prompt
- `http-server-on-workers.md` — Hono + MCP SDK + SSE on CF Workers, wrangler.toml, auth
- `forge-mcp-from-openapi.md` — plan for extending `bin/forge-skill-from-openapi.mjs` to emit MCP servers

## Quality gates (every MCP server)

1. All tool inputs have a Zod schema — never accept raw `unknown`
2. All tool results conform to a Zod output schema before returning
3. Errors return MCP `isError: true` with structured `{ code, message }` — never throw raw JS errors
4. Every tool `description` ≤2 sentences, specific enough for an LLM to decide when to call it
5. No secret values in tool schemas or resource URIs — pass via `env` block in `.claude.json`
6. Smoke-test with `npx @modelcontextprotocol/inspector` before registering

## Cross-links

- `[[cloudflare-lock-in-is-leverage]]` — Workers HTTP transport over any third-party MCP host
- `[[ai-agent-supervisor]]` — MCP tools are the supervised boundary for agent actions
- `[[contract-first-ai]]` — Zod at every tool boundary
- `[[hono-api]]` — HTTP transport built on Hono
- `05-architecture-and-stack/cf-agents-do-pattern.md` — stateful MCP sessions via Durable Objects
- `rules/ai-agent-security.md` — tool scope minimization, input sanitization, rate limiting
