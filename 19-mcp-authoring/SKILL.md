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

The Model Context Protocol (MCP) is the standard surface for giving AI agents structured
access to external systems. An MCP server exposes three primitive types:

- **Tools** — callable functions with a JSON schema input, returning structured output.
  The model decides when to call them. Think: "do something."
- **Resources** — addressable content (files, DB rows, live feeds) returned as text or
  binary. The model fetches them. Think: "read something."
- **Prompts** — reusable prompt templates with typed arguments. Think: "fill and inject."

Source authority: modelcontextprotocol.io/introduction, `@modelcontextprotocol/sdk` NPM package.

---

## When to author an MCP server

Build one when:

- An existing REST API or Worker function would provide genuine value to an AI agent but
  is not currently reachable as a tool (the cost of schema-wrapping is lower than the
  benefit of agent access).
- You need to share a tool set across multiple Claude sessions / Claude Code projects
  without copy-pasting prompts.
- A CF Worker already owns the business logic and you want to give Claude persistent,
  auth-aware access (HTTP transport on Workers = zero extra infra).
- You are extending the forge pipeline to emit MCP servers from OpenAPI specs
  (`--target=mcp-server` flag — see `forge-mcp-from-openapi.md`).

Do NOT build one when a simple `[[hono-api]]` route + direct `curl` / `fetch` suffices —
MCP adds SDK overhead that isn't justified for one-off integrations.

---

## Architecture overview

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

Every tool input validated with `z.parse()` before hitting the system. Every result
validated before returning. No raw model outputs, no untyped `any`. Per `[[contract-first-ai]]`
and `[[zod-everywhere]]`.

---

## Transport decision

| Criterion | stdio | HTTP + SSE |
|---|---|---|
| Where it runs | Local process, same machine as Claude | Any origin — CF Workers, remote server |
| Auth | None (process-level trust) | HTTP headers, Bearer tokens, CF Zero Trust |
| Session state | Process lifetime | DO / KV per session ID |
| Streaming | Native (stdout) | SSE (`text/event-stream`) |
| Setup | `~/.claude.json` mcpServers entry | CF Worker deploy + `.claude.json` remote entry |
| Best for | Dev tools, local scripts, secret-laden CLIs | Shared team tools, SaaS integrations, per-user auth |
| Per `[[cloudflare-lock-in-is-leverage]]` | Use for purely local utilities | Prefer — CF Workers = zero cold-start, global, cheap |

---

## .claude.json registration

### stdio server

```json
{
  "mcpServers": {
    "my-local-tool": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/dist/index.js"],
      "env": {
        "DB_PATH": "/Users/Apple/data/mydb.sqlite"
      }
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
      "headers": {
        "Authorization": "Bearer ${MY_MCP_TOKEN}"
      }
    }
  }
}
```

Place at `~/.claude.json` for global registration or `.claude.json` at repo root for
project-scoped registration. Claude Code picks up both.

---

## Sub-modules

- `stdio-server-template.md` — complete TypeScript stdio server with sample tool + resource + prompt
- `http-server-on-workers.md` — Hono + MCP SDK + SSE on CF Workers, wrangler.toml, auth
- `forge-mcp-from-openapi.md` — plan for extending `bin/forge-skill-from-openapi.mjs` to emit MCP servers

---

## Quality gates for every MCP server

1. All tool inputs have a Zod schema — never accept raw `unknown`.
2. All tool results conform to a Zod output schema before returning.
3. Errors return MCP `isError: true` with structured `{ code, message }`, never throw raw JS errors.
4. Every tool has a `description` that an LLM can use to decide when to call it — specific, ≤2 sentences.
5. No secret values in tool schemas or resource URIs — pass via `env` block in `.claude.json`.
6. Smoke-test with `npx @modelcontextprotocol/inspector` before registering.

---

## Cross-links

- `[[cloudflare-lock-in-is-leverage]]` — Workers HTTP transport over any third-party MCP host
- `[[ai-agent-supervisor]]` — MCP tools are the supervised boundary for agent actions
- `[[contract-first-ai]]` — Zod at every tool boundary
- `[[hono-api]]` — HTTP transport built on Hono
- `05-architecture-and-stack/cf-agents-do-pattern.md` — stateful MCP sessions via Durable Objects
- `rules/ai-agent-security.md` — tool scope minimization, input sanitization, rate limiting
