---
name: "Forge MCP from OpenAPI"
description: "Plan + pseudocode for extending bin/forge-skill-from-openapi.mjs with a --target=mcp-server flag that emits a fully-wired MCP server instead of a Claude Code skill markdown file. Does NOT modify the forge script — describes the extension seam, the code-generation template, and the output file set."
updated: "2026-06-18"
---

# Forge MCP from OpenAPI — Extension Plan

`bin/forge-skill-from-openapi.mjs` already ingests an OpenAPI 3.0/3.1 spec and emits
Claude Code skill markdown. This document describes how to add `--target=mcp-server` so
the same spec also emits a ready-to-deploy MCP server (stdio OR Workers HTTP transport).

This is a **plan + pseudocode**, not an implementation PR. Extend the forge script when
you need to auto-generate MCP servers from existing OpenAPI contracts — e.g. when
onboarding a new vendor API or scaffolding a new Workers microservice.

---

## Why this is the right abstraction

OpenAPI specs are already a typed, machine-readable contract for every endpoint.
MCP tool schemas are JSON Schema subsets — structurally identical to OpenAPI `requestBody`

+ `parameters`. The forge pipeline already:

1. Fetches + parses the OpenAPI spec.
2. Groups operations by tag.
3. Emits templated markdown per operation.

Adding `--target=mcp-server` requires replacing step 3's template and adding a TS code
emitter. The parsing + grouping logic is unchanged.

Per `[[cloudflare-lock-in-is-leverage]]`: the emitted server targets CF Workers HTTP
transport by default; `--transport=stdio` for local dev tools.

---

## CLI interface (new flag)

```bash
# Emit Claude Code skill (existing behaviour — unchanged)
node bin/forge-skill-from-openapi.mjs <spec-url> <output-dir> --name my-api

# NEW: emit MCP server (TypeScript, CF Workers HTTP transport)
node bin/forge-skill-from-openapi.mjs <spec-url> <output-dir> \
  --name my-api \
  --target mcp-server \
  --transport http     # or --transport stdio
  --base-url https://api.example.com

# Output files:
#   <output-dir>/
#     src/index.ts       (Hono + MCP server, all tools wired)
#     src/schemas.ts     (Zod schemas for every operation input + output)
#     wrangler.toml      (CF Workers config)
#     package.json
#     tsconfig.json
#     .claude.json       (registration snippet)
```

---

## Extension seam in forge-skill-from-openapi.mjs

The existing script ends with a `generateSkillMarkdown(spec, args)` call.
The extension adds a branch before that call:

```javascript
// Pseudocode — shows WHERE to branch, not final code
const target = args.flags['target'] ?? 'skill';
const transport = args.flags['transport'] ?? 'http';

if (target === 'mcp-server') {
  await generateMcpServer(spec, args, transport);
} else {
  await generateSkillMarkdown(spec, args);  // existing path — untouched
}
```

---

## generateMcpServer — pseudocode

```javascript
async function generateMcpServer(spec, args, transport) {
  const operations = extractOperations(spec);   // existing helper
  const name = slugify(args.flags['name'] ?? spec.info.title);
  const baseUrl = args.flags['base-url'] ?? spec.servers?.[0]?.url ?? 'https://api.example.com';
  const outDir = args.positional[1];

  // 1. Emit src/schemas.ts
  const schemas = operations.map(op => buildZodSchema(op));
  await writeFile(join(outDir, 'src/schemas.ts'), renderSchemasTemplate(schemas));

  // 2. Emit src/index.ts
  const toolDefs = operations.map(op => buildToolDef(op));
  const handlerCode = operations.map(op => buildHandler(op, baseUrl));
  const indexSrc = transport === 'http'
    ? renderHttpTemplate({ name, toolDefs, handlerCode })
    : renderStdioTemplate({ name, toolDefs, handlerCode });
  await writeFile(join(outDir, 'src/index.ts'), indexSrc);

  // 3. Emit wrangler.toml (HTTP only)
  if (transport === 'http') {
    await writeFile(join(outDir, 'wrangler.toml'), renderWranglerTemplate({ name }));
  }

  // 4. Emit package.json + tsconfig.json
  await writeFile(join(outDir, 'package.json'), renderPackageJson({ name }));
  await writeFile(join(outDir, 'tsconfig.json'), renderTsconfig());

  // 5. Emit .claude.json registration snippet
  const reg = transport === 'http'
    ? renderHttpRegistration({ name })
    : renderStdioRegistration({ name, outDir });
  await writeFile(join(outDir, '.claude.json'), reg);

  console.log(`MCP server scaffolded at ${outDir} (${transport} transport)`);
}
```

---

## buildZodSchema — pseudocode

Converts an OpenAPI operation's parameters + requestBody into a Zod schema string.

```javascript
function buildZodSchema(op) {
  // op = { operationId, method, path, parameters, requestBody, responses }

  const fields = [];

  // Path + query params → z.object fields
  for (const param of op.parameters ?? []) {
    const zodType = oasTypeToZod(param.schema);     // 'string' → 'z.string()', 'integer' → 'z.number().int()'
    const required = param.required ?? false;
    fields.push(`  ${param.name}: ${zodType}${required ? '' : '.optional()'}` +
      `.describe(${JSON.stringify(param.description ?? param.name)})`);
  }

  // requestBody (application/json) → spread into z.object
  const body = op.requestBody?.content?.['application/json']?.schema;
  if (body?.properties) {
    for (const [key, sch] of Object.entries(body.properties)) {
      const zodType = oasTypeToZod(sch);
      const isRequired = (body.required ?? []).includes(key);
      fields.push(`  ${key}: ${zodType}${isRequired ? '' : '.optional()'}`);
    }
  }

  const schemaName = `${titlify(op.operationId)}InputSchema`;
  return `export const ${schemaName} = z.object({\n${fields.join(',\n')}\n});`;
}

function oasTypeToZod(schema) {
  if (!schema) return 'z.unknown()';
  switch (schema.type) {
    case 'string':  return schema.enum ? `z.enum(${JSON.stringify(schema.enum)})` : 'z.string()';
    case 'integer': return 'z.number().int()';
    case 'number':  return 'z.number()';
    case 'boolean': return 'z.boolean()';
    case 'array':   return `z.array(${oasTypeToZod(schema.items)})`;
    case 'object':  return 'z.record(z.unknown())';
    default:        return 'z.unknown()';
  }
}
```

---

## buildHandler — pseudocode

Each operation becomes a `CallToolRequestSchema` branch that:

1. Parses input with the Zod schema.
2. Constructs the HTTP request to `baseUrl`.
3. Returns `{ content: [{ type: 'text', text: JSON.stringify(result) }] }`.

```javascript
function buildHandler(op, baseUrl) {
  const schemaName = `${titlify(op.operationId)}InputSchema`;
  const pathParams = (op.parameters ?? []).filter(p => p.in === 'path').map(p => p.name);
  const queryParams = (op.parameters ?? []).filter(p => p.in === 'query').map(p => p.name);
  const hasBody = !!op.requestBody;

  return `
    if (request.params.name === '${op.operationId}') {
      const input = ${schemaName}.parse(request.params.arguments);
      let url = '${baseUrl}${op.path}';
      ${pathParams.map(p => `url = url.replace('{${p}}', String(input.${p}));`).join('\n      ')}
      ${queryParams.length ? `const qs = new URLSearchParams(${queryParams.map(p => `['${p}', input.${p}]`).join(', ')});\n      url += '?' + qs.toString();` : ''}
      const res = await fetch(url, {
        method: '${op.method.toUpperCase()}',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (env.API_KEY ?? '') },
        ${hasBody ? `body: JSON.stringify(input),` : ''}
      });
      const data = await res.json();
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  `.trim();
}
```

---

## Output file set

```
<output-dir>/
  src/
    index.ts        Hono + MCP SDK server, all tools wired
    schemas.ts      Zod schemas for every operation
  wrangler.toml     CF Workers config (HTTP transport only)
  package.json      @modelcontextprotocol/sdk + hono + zod deps
  tsconfig.json     strict, NodeNext, ES2022
  .claude.json      Registration snippet (copy into ~/.claude.json or repo .claude.json)
```

---

## Implementation checklist (when you decide to ship this)

+ [ ] Add `--target` and `--transport` to `parseArgs()` in `bin/forge-skill-from-openapi.mjs`
+ [ ] Implement `oasTypeToZod()` helper (pseudocode above)
+ [ ] Implement `buildZodSchema()`, `buildHandler()`, `buildToolDef()` helpers
+ [ ] Add `renderHttpTemplate()` / `renderStdioTemplate()` string templates
  (inline template strings using `tpl()` helper already in the script)
+ [ ] Add `renderSchemasTemplate()`, `renderWranglerTemplate()`, `renderPackageJson()` etc.
+ [ ] Add `--target=mcp-server` to the CLI usage comment at top of file
+ [ ] Add integration test: feed a known OpenAPI spec, assert the output files exist and
  TypeScript compiles (`tsc --noEmit`)
+ [ ] Add a note in `19-mcp-authoring/SKILL.md` submodules list

---

## Relationship to existing forge-from-openapi skill

The existing `commands/forge-from-openapi.md` (and its Claude Code skill equivalent)
emits markdown Claude Code skills. This extension is **additive** — it does not change
that output path. The `--target=skill` flag (default) preserves existing behaviour exactly.
All new code lives in new helper functions; the existing `generateSkillMarkdown()` function
is not touched.

---

## See

+ `bin/forge-skill-from-openapi.mjs` — the script to extend (read before implementing)
+ `19-mcp-authoring/http-server-on-workers.md` — the HTTP server template the emitter generates
+ `19-mcp-authoring/stdio-server-template.md` — the stdio template
+ `[[cloudflare-lock-in-is-leverage]]` — default to HTTP+Workers transport in the emitter
+ `[[contract-first-ai]]` — every emitted tool must have Zod at its boundary
+ modelcontextprotocol.io/docs/concepts/tools — tool schema spec
