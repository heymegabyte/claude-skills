#!/usr/bin/env node
/**
 * forge-skill-from-openapi.mjs
 * Auto-generates Claude Code skills from an OpenAPI 3.0/3.1 spec.
 *
 * Usage:
 *   node bin/forge-skill-from-openapi.mjs <openapi-url-or-path> <output-dir> \
 *     [--name <skill-name>] [--triggers <comma-separated>] [--base-url <url>]
 *
 * Zero npm-install required — uses only node:* built-ins + global fetch (Node 18+).
 * YAML support: attempts to use `js-yaml` if installed; else rejects non-JSON specs.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

// ── helpers ──────────────────────────────────────────────────────────────────

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function titlify(str) {
  return String(str)
    .replace(/[-_/{}]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Inline template substitution — no Handlebars dep */
function tpl(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : `{{${k}}}`
  );
}

/** Parse args: positional + --flag value pairs. Boolean flags (no value) set to true.
 *  Handles both `--flag value` and `--flag=value` forms. */
function parseArgs(argv) {
  const args = { positional: [], flags: {} };
  let i = 0;
  while (i < argv.length) {
    if (argv[i].startsWith('--')) {
      const raw = argv[i].slice(2);
      const eqIdx = raw.indexOf('=');
      if (eqIdx !== -1) {
        // --flag=value form
        args.flags[raw.slice(0, eqIdx)] = raw.slice(eqIdx + 1);
        i += 1;
      } else {
        const next = argv[i + 1];
        // Boolean flag: next arg is missing or another flag
        if (next === undefined || next.startsWith('--')) {
          args.flags[raw] = true;
          i += 1;
        } else {
          args.flags[raw] = next;
          i += 2;
        }
      }
    } else {
      args.positional.push(argv[i]);
      i++;
    }
  }
  return args;
}

/** Load and parse an OpenAPI spec from URL or file path */
async function loadSpec(source) {
  let raw;

  if (/^https?:\/\//.test(source)) {
    const res = await fetch(source, {
      headers: { 'User-Agent': 'forge-skill/1.0', Accept: 'application/json, application/yaml, */*' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${source}`);
    raw = await res.text();
  } else {
    const filePath = resolve(process.cwd(), source);
    raw = await readFile(filePath, 'utf8');
  }

  // Try JSON first
  const trimmed = raw.trimStart();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error('Source looks like JSON but failed to parse.');
    }
  }

  // Try YAML — multi-path js-yaml resolution
  const yamlSearchPaths = [
    // Try relative to script
    createRequire(import.meta.url),
    // Try from common global paths
    ...((() => {
      try {
        const npmRoot = execSync('npm root -g 2>/dev/null', { encoding: 'utf8' }).trim();
        if (npmRoot) return [createRequire(npmRoot + '/js-yaml/package.json')];
      } catch {}
      return [];
    })()),
    // Volta-managed global packages
    ...((() => {
      try {
        const voltaHome = process.env.VOLTA_HOME ?? (process.env.HOME + '/.local/share/volta');
        const voltaPath = `${voltaHome}/tools/image/packages/js-yaml/lib/node_modules/`;
        return [createRequire(voltaPath)];
      } catch {}
      return [];
    })()),
  ];

  for (const req of yamlSearchPaths) {
    try {
      const yaml = req('js-yaml');
      const parsed = yaml.load(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {}
  }

  // Last resort: shell out to node with js-yaml via volta
  try {
    const voltaHome = process.env.VOLTA_HOME ?? (process.env.HOME + '/.local/share/volta');
    const jsPkg = `${voltaHome}/tools/image/packages/js-yaml/lib/node_modules/js-yaml`;
    const script = `const y=require(${JSON.stringify(jsPkg)});process.stdout.write(JSON.stringify(y.load(require('fs').readFileSync(process.argv[1],'utf8'))))`;
    // Write raw to tmp file, parse via subprocess
    const tmpPath = `/tmp/forge-spec-${Date.now()}.yaml`;
    await writeFile(tmpPath, raw, 'utf8');
    const jsonStr = execSync(`node -e ${JSON.stringify(script)} "${tmpPath}"`, { encoding: 'utf8', timeout: 30000 });
    return JSON.parse(jsonStr);
  } catch {}

  throw new Error(
    'Spec appears to be YAML but js-yaml is not available.\n' +
      'Either convert to JSON or: npm i -g js-yaml'
  );
}

// ── schema → TypeScript type ──────────────────────────────────────────────────

function schemaToTs(name, schema, schemas, depth = 0) {
  if (!schema) return 'unknown';
  const indent = '  '.repeat(depth);

  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop();
    return refName;
  }

  switch (schema.type) {
    case 'string':
      if (schema.enum) return schema.enum.map((e) => JSON.stringify(e)).join(' | ');
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'null':
      return 'null';
    case 'array':
      if (schema.items) return `Array<${schemaToTs('', schema.items, schemas, depth)}>`;
      return 'Array<unknown>';
    case 'object':
    case undefined: {
      if (schema.properties) {
        const required = new Set(schema.required ?? []);
        const props = Object.entries(schema.properties)
          .map(([k, v]) => {
            const opt = required.has(k) ? '' : '?';
            return `${indent}  ${JSON.stringify(k)}${opt}: ${schemaToTs(k, v, schemas, depth + 1)};`;
          })
          .join('\n');
        return `{\n${props}\n${indent}}`;
      }
      if (schema.additionalProperties) {
        return `Record<string, ${schemaToTs('', schema.additionalProperties, schemas, depth)}>`;
      }
      return 'Record<string, unknown>';
    }
    default:
      if (schema.anyOf || schema.oneOf) {
        const union = (schema.anyOf ?? schema.oneOf)
          .map((s) => schemaToTs('', s, schemas, depth))
          .join(' | ');
        return union;
      }
      if (schema.allOf) {
        return schema.allOf.map((s) => schemaToTs('', s, schemas, depth)).join(' & ');
      }
      return 'unknown';
  }
}

// ── extract request body schema ───────────────────────────────────────────────

function extractBodySchema(operation) {
  const body = operation.requestBody;
  if (!body) return null;
  const content = body.content ?? {};
  const firstKey = Object.keys(content)[0];
  if (!firstKey) return null;
  return content[firstKey]?.schema ?? null;
}

/** Extract the first 2xx response schema from an operation */
function extractResponseSchema(operation) {
  const responses = operation.responses ?? {};
  for (const code of ['200', '201', '202', '204']) {
    const r = responses[code];
    if (!r) continue;
    const content = r.content ?? {};
    const firstKey = Object.keys(content)[0];
    if (firstKey && content[firstKey]?.schema) return content[firstKey].schema;
  }
  return null;
}

// ── param extraction ──────────────────────────────────────────────────────────

function extractParams(operation, pathItem) {
  const merged = [...(pathItem.parameters ?? []), ...(operation.parameters ?? [])];
  const seen = new Set();
  return merged.filter((p) => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });
}

// ── generate curl example ─────────────────────────────────────────────────────

function buildCurlExample(method, path, params, bodySchema, baseUrl) {
  const pathParams = params.filter((p) => p.in === 'path');
  const queryParams = params.filter((p) => p.in === 'query');

  let url = `${baseUrl}${path}`;
  for (const p of pathParams) url = url.replace(`{${p.name}}`, `$${p.name.toUpperCase()}`);

  if (queryParams.length) {
    const qs = queryParams
      .slice(0, 5)
      .map((p) => `${p.name}=<value>`)
      .join('&');
    url += `?${qs}`;
  }

  const lines = [
    `curl -X ${method.toUpperCase()} \\`,
    `  "${url}" \\`,
    `  -H "Authorization: Bearer $API_TOKEN" \\`,
    `  -H "Content-Type: application/json"`,
  ];

  if (bodySchema && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
    lines[lines.length - 1] += ' \\';
    lines.push(`  -d '{ /* request body */ }'`);
  }

  return lines.join('\n');
}

// ── generate command markdown ─────────────────────────────────────────────────

function buildCommandMd(method, path, operation, params, bodySchema, responseSchema, baseUrl, allSchemas) {
  const opId = operation.operationId ?? `${method}-${slugify(path)}`;
  const summary = operation.summary ?? operation.description ?? `${method.toUpperCase()} ${path}`;
  const description = operation.description ?? summary;

  const pathParams = params.filter((p) => p.in === 'path');
  const queryParams = params.filter((p) => p.in === 'query').slice(0, 6);
  const headerParams = params.filter((p) => p.in === 'header');

  const argumentHint = [
    ...pathParams.map((p) => `<${p.name}>`),
    ...queryParams.map((p) => `[--${p.name} <value>]`),
  ]
    .slice(0, 5)
    .join(' ');

  const curlExample = buildCurlExample(method, path, params, bodySchema, baseUrl);

  const respSchemaStr = responseSchema
    ? '```json\n' + JSON.stringify(schemaToJsonExample(responseSchema, allSchemas, 0), null, 2) + '\n```'
    : '_No structured response schema defined._';

  const bodySchemaStr = bodySchema
    ? '```json\n' + JSON.stringify(schemaToJsonExample(bodySchema, allSchemas, 0), null, 2) + '\n```'
    : '';

  const paramTable =
    params.length === 0
      ? ''
      : `\n| Name | In | Required | Description |\n|---|---|---|---|\n` +
        params
          .slice(0, 20)
          .map(
            (p) =>
              `| \`${p.name}\` | ${p.in} | ${p.required ? 'yes' : 'no'} | ${(p.description ?? '').replace(/\|/g, '/')} |`
          )
          .join('\n') +
        '\n';

  return `---
description: "${summary.replace(/"/g, "'")}"
argument-hint: ${argumentHint || '<args>'}
allowed-tools: Bash
---

# ${method.toUpperCase()} ${path}

${description}

## Parameters
${paramTable}
## Request

\`\`\`bash
# Set env vars first:
# export API_TOKEN=<your-token>
${pathParams.map((p) => `# export ${p.name.toUpperCase()}=<${p.name}>`).join('\n')}

${curlExample}
\`\`\`

${bodySchemaStr ? `## Request Body\n\n${bodySchemaStr}\n` : ''}
## Response

${respSchemaStr}

## Error Handling

- \`400\` — Bad request / validation error. Check param types and required fields.
- \`401\` — Auth failed. Verify \`$API_TOKEN\` is set correctly.
- \`403\` — Forbidden. Check OAuth scopes or API key permissions.
- \`404\` — Resource not found. Verify path params.
- \`429\` — Rate limited. Implement exponential backoff.
- \`500\` / \`503\` — Server error. Retry with backoff; log the request ID from response headers.

## Claude Guidance

When the user invokes this command:
1. Confirm all required path params are available from context or prompt for them.
2. Run the curl command substituting real values.
3. Parse the JSON response and summarize the key fields.
4. Surface any error clearly with the HTTP status and response body.
`;
}

// ── JSON example generator ────────────────────────────────────────────────────

function schemaToJsonExample(schema, allSchemas, depth = 0) {
  if (depth > 4) return '...';
  if (!schema) return null;

  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop();
    const resolved = allSchemas?.[refName];
    if (resolved) return schemaToJsonExample(resolved, allSchemas, depth + 1);
    return { $ref: refName };
  }

  switch (schema.type) {
    case 'string':
      return schema.example ?? schema.enum?.[0] ?? 'string';
    case 'number':
    case 'integer':
      return schema.example ?? 0;
    case 'boolean':
      return schema.example ?? true;
    case 'null':
      return null;
    case 'array':
      return [schemaToJsonExample(schema.items, allSchemas, depth + 1)];
    default:
      if (schema.properties) {
        const obj = {};
        for (const [k, v] of Object.entries(schema.properties).slice(0, 12)) {
          obj[k] = schemaToJsonExample(v, allSchemas, depth + 1);
        }
        return obj;
      }
      if (schema.anyOf || schema.oneOf) {
        return schemaToJsonExample((schema.anyOf ?? schema.oneOf)[0], allSchemas, depth + 1);
      }
      return {};
  }
}

// ── generate TypeScript types ─────────────────────────────────────────────────

function buildTypesTs(spec, apiName) {
  const schemas = spec.components?.schemas ?? {};
  const lines = [
    `// Auto-generated by forge-skill-from-openapi`,
    `// API: ${apiName}`,
    `// Source: ${spec.info?.title ?? apiName} v${spec.info?.version ?? 'unknown'}`,
    `// DO NOT EDIT — re-run forge to regenerate`,
    ``,
  ];

  for (const [name, schema] of Object.entries(schemas)) {
    const tsType = schemaToTs(name, schema, schemas);
    const desc = schema.description ? `/** ${schema.description} */\n` : '';
    if (tsType.startsWith('{') || tsType.startsWith('Array') || tsType.includes('|') || tsType.includes('&')) {
      lines.push(`${desc}export type ${name} = ${tsType};`, ``);
    } else {
      lines.push(`${desc}export type ${name} = ${tsType};`, ``);
    }
  }

  // Also emit request/response types per operation
  const paths = spec.paths ?? {};
  for (const [path, pathItem] of Object.entries(paths)) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete', 'options']) {
      const op = pathItem[method];
      if (!op) continue;
      const opId = op.operationId;
      if (!opId) continue;

      const bodySchema = extractBodySchema(op);
      const respSchema = extractResponseSchema(op);

      if (bodySchema) {
        const tsType = schemaToTs(`${opId}Body`, bodySchema, schemas);
        lines.push(`export type ${opId}Body = ${tsType};`, ``);
      }
      if (respSchema) {
        const tsType = schemaToTs(`${opId}Response`, respSchema, schemas);
        lines.push(`export type ${opId}Response = ${tsType};`, ``);
      }
    }
  }

  return lines.join('\n');
}

// ── generate typed client ─────────────────────────────────────────────────────

function buildClientTs(spec, apiName, baseUrl) {
  const paths = spec.paths ?? {};
  const clientMethods = [];

  for (const [path, pathItem] of Object.entries(paths)) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
      const op = pathItem[method];
      if (!op) continue;

      const opId = op.operationId ?? `${method}${slugify(path).replace(/-./g, (m) => m[1].toUpperCase())}`;
      const params = extractParams(op, pathItem);
      const pathParams = params.filter((p) => p.in === 'path');
      const queryParams = params.filter((p) => p.in === 'query');
      const bodySchema = extractBodySchema(op);
      const respType = op.operationId ? `${op.operationId}Response` : 'unknown';
      const bodyType = bodySchema && op.operationId ? `${op.operationId}Body` : 'Record<string, unknown>';

      const argParts = [
        ...pathParams.map((p) => `${p.name}: string`),
        ...(queryParams.length ? ['query?: Record<string, string>'] : []),
        ...(['post', 'put', 'patch'].includes(method) ? [`body?: ${bodyType}`] : []),
      ];

      let urlExpr = `\`${baseUrl}${path.replace(/{(\w+)}/g, '${$1}')}\``;
      if (queryParams.length) urlExpr = `appendQuery(${urlExpr}, query)`;

      const bodyArg = ['post', 'put', 'patch'].includes(method) ? 'body ? JSON.stringify(body) : undefined' : 'undefined';

      clientMethods.push(
        `  async ${opId}(${argParts.join(', ')}): Promise<${respType}> {`,
        `    return this.request('${method.toUpperCase()}', ${urlExpr}${['post', 'put', 'patch'].includes(method) ? `, ${bodyArg}` : ''});`,
        `  },`,
        ``
      );
    }
  }

  return `// Auto-generated by forge-skill-from-openapi
// API: ${apiName}
// DO NOT EDIT — re-run forge to regenerate

import type * as T from './types.js';

function appendQuery(url: string, query?: Record<string, string>): string {
  if (!query || Object.keys(query).length === 0) return url;
  const qs = new URLSearchParams(query).toString();
  return url.includes('?') ? \`\${url}&\${qs}\` : \`\${url}?\${qs}\`;
}

export class ${titlify(apiName).replace(/\s+/g, '')}Client {
  constructor(
    private readonly apiToken: string,
    private readonly baseUrl: string = '${baseUrl}',
  ) {}

  private async request<T>(method: string, url: string, body?: string): Promise<T> {
    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': \`Bearer \${this.apiToken}\`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(\`\${method} \${url} → \${res.status}: \${text}\`);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as T;
  }

${clientMethods.join('\n')}
}
`;
}

// ── generate SKILL.md ─────────────────────────────────────────────────────────

function buildSkillMd(spec, apiName, skillName, triggers, commands, outputDir) {
  const title = spec.info?.title ?? titlify(apiName);
  const version = spec.info?.version ?? 'unknown';
  const description = spec.info?.description ?? `Typed client and slash commands for ${title}.`;
  const triggerList = triggers.length ? triggers.join(', ') : `${apiName} API, working with ${title}`;
  const commandList = commands.map((c) => `- \`/${c.slug}\` — ${c.summary}`).join('\n');

  return `---
name: ${skillName}
description: "${title} API skill — auto-forged from OpenAPI ${version}. ${description.slice(0, 120)}"
triggers: [${triggerList.split(',').map((t) => `"${t.trim()}"`).join(', ')}]
version: 1.0.0
forged-from: openapi
api-title: ${title}
api-version: ${version}
---

# ${title} API Skill

Auto-forged from the ${title} OpenAPI spec (v${version}).

## What this skill provides

- **${commands.length} slash commands** — one per API endpoint, with curl examples and typed guidance
- **\`types.ts\`** — TypeScript types auto-generated from OpenAPI schemas
- **\`client.ts\`** — Typed fetch-based API client (zero deps, Workers-compatible)

## Slash Commands

${commandList || '_No commands generated — spec had no paths._'}

## Usage

\`\`\`ts
import { ${titlify(apiName).replace(/\s+/g, '')}Client } from './${skillName}/client.js';

const client = new ${titlify(apiName).replace(/\s+/g, '')}Client(process.env.${apiName.toUpperCase().replace(/-/g, '_')}_API_TOKEN!);
\`\`\`

## Auth pattern

Set \`API_TOKEN\` (or the env var specific to this API) before running any command.
All generated curl examples use \`-H "Authorization: Bearer $API_TOKEN"\`.

## Maintenance

- **Re-forge**: \`node ~/.agentskills/bin/forge-skill-from-openapi.mjs <spec-url> ${outputDir} --name ${skillName}\`
- **Hand-edit**: add examples, tweak descriptions, add business-context to commands.
- **Spec drift**: re-running forge overwrites generated files; custom edits in \`commands/*.md\` survive if you rename the file.

## Source

Generated ${new Date().toISOString().slice(0, 10)} by forge-skill-from-openapi.
Spec: ${spec.info?.['x-spec-url'] ?? spec.servers?.[0]?.url ?? 'unknown'}
`;
}

// ── MCP server generation helpers ────────────────────────────────────────────

/** OAS schema → Zod expression string */
function oasTypeToZod(schema) {
  if (!schema) return 'z.unknown()';
  if (schema.$ref) return 'z.record(z.unknown())'; // refs → opaque record
  switch (schema.type) {
    case 'string':
      if (schema.enum) return `z.enum(${JSON.stringify(schema.enum)})`;
      return 'z.string()';
    case 'integer':
      return 'z.number().int()';
    case 'number':
      return 'z.number()';
    case 'boolean':
      return 'z.boolean()';
    case 'array':
      return `z.array(${oasTypeToZod(schema.items)})`;
    case 'object':
      return 'z.record(z.unknown())';
    default:
      if (schema.anyOf || schema.oneOf) return 'z.unknown()';
      if (schema.allOf) return 'z.record(z.unknown())';
      return 'z.unknown()';
  }
}

/** Build the Zod schema source string for one operation's input */
function buildZodSchemaStr(op) {
  const { params, method, path } = op;
  const opId = op.op.operationId ?? `${method}-${slugify(path)}`;
  const schemaName = `${titlify(opId).replace(/\s+/g, '')}InputSchema`;

  const fields = [];

  // Path + query params
  for (const param of params) {
    if (param.in !== 'path' && param.in !== 'query') continue;
    const zodType = oasTypeToZod(param.schema ?? {});
    const required = param.required ?? param.in === 'path';
    const desc = param.description ? `.describe(${JSON.stringify(param.description)})` : '';
    fields.push(`  ${param.name}: ${zodType}${desc}${required ? '' : '.optional()'}`);
  }

  // Request body properties (application/json)
  const bodySchema = extractBodySchema(op.op);
  if (bodySchema?.properties) {
    const required = new Set(bodySchema.required ?? []);
    for (const [key, sch] of Object.entries(bodySchema.properties)) {
      const zodType = oasTypeToZod(sch);
      const desc = sch.description ? `.describe(${JSON.stringify(sch.description)})` : '';
      fields.push(`  ${key}: ${zodType}${desc}${required.has(key) ? '' : '.optional()'}`);
    }
  } else if (bodySchema) {
    // Body is a top-level $ref or primitive — accept as generic record
    fields.push(`  body: z.record(z.unknown()).optional()`);
  }

  if (fields.length === 0) {
    return `export const ${schemaName} = z.object({}).strict();`;
  }
  return `export const ${schemaName} = z.object({\n${fields.join(',\n')},\n}).strict();`;
}

/** Build MCP tool definition object literal for ListTools */
function buildToolDef(op) {
  const { params, method, path } = op;
  const opId = op.op.operationId ?? `${method}-${slugify(path)}`;
  const summary = op.op.summary ?? op.op.description ?? `${method.toUpperCase()} ${path}`;

  const properties = {};
  const required = [];

  for (const param of params) {
    if (param.in !== 'path' && param.in !== 'query') continue;
    const isRequired = param.required ?? param.in === 'path';
    properties[param.name] = {
      type: param.schema?.type ?? 'string',
      description: param.description ?? param.name,
    };
    if (isRequired) required.push(param.name);
  }

  const bodySchema = extractBodySchema(op.op);
  if (bodySchema?.properties) {
    const reqSet = new Set(bodySchema.required ?? []);
    for (const [key, sch] of Object.entries(bodySchema.properties)) {
      properties[key] = { type: sch.type ?? 'string', description: sch.description ?? key };
      if (reqSet.has(key)) required.push(key);
    }
  }

  return {
    name: opId,
    description: summary,
    inputSchema: {
      type: 'object',
      properties,
      ...(required.length ? { required } : {}),
    },
  };
}

/** Build the CallTool handler branch string for one operation */
function buildHandlerStr(op, baseUrl, harden = false) {
  const { params, method, path } = op;
  const opId = op.op.operationId ?? `${method}-${slugify(path)}`;
  const schemaName = `${titlify(opId).replace(/\s+/g, '')}InputSchema`;

  const pathParams = params.filter((p) => p.in === 'path').map((p) => p.name);
  const queryParams = params.filter((p) => p.in === 'query').map((p) => p.name);
  const hasBody = !!extractBodySchema(op.op);

  const isDestructive = harden && /^(delete_|cancel_|void_|refund_|destroy_|remove_|purge_)/.test(opId);

  // Build path interpolation lines
  const pathReplaceLines = pathParams
    .map((p) => `      url = url.replace('{${p}}', encodeURIComponent(String(input.${p})));`)
    .join('\n');

  // Build query string
  const qsLines = queryParams.length
    ? `      const qs = new URLSearchParams();\n` +
      queryParams
        .map((p) => `      if (input.${p} !== undefined) qs.set('${p}', String(input.${p}));`)
        .join('\n') +
      `\n      if (qs.toString()) url += '?' + qs.toString();`
    : '';

  // Body — exclude path+query params from body payload; collect body-only keys
  const bodyPayload = hasBody
    ? `      const bodyKeys = new Set<string>(${JSON.stringify([...pathParams, ...queryParams])});\n` +
      `      const bodyPayload = Object.fromEntries(Object.entries(input).filter(([k]) => !bodyKeys.has(k)));`
    : '';

  // Destructive gate (harden only)
  const destructiveGate = isDestructive
    ? `      // Destructive tool gate\n` +
      `      if (!process.env['ALLOW_DESTRUCTIVE'] && !(process.env['DESTRUCTIVE_ALLOWLIST'] ?? '').split(',').includes(${JSON.stringify(opId)})) {\n` +
      `        return mcpSizeLimitError('Destructive tool', 'DESTRUCTIVE_BLOCKED — set ALLOW_DESTRUCTIVE=true or add to DESTRUCTIVE_ALLOWLIST');\n` +
      `      }\n`
    : '';

  // Resource limits + Zod validation (harden only — uses helper functions)
  const argsCheck = harden
    ? `      if (JSON.stringify(request.params.arguments ?? {}).length > 65_536) {\n` +
      `        return mcpSizeLimitError('Input', '64KB');\n` +
      `      }\n`
    : '';

  // Zod parse: harden uses safeParse + mcpValidationError; base uses .parse() (throws)
  const zodParse = harden
    ? `      const _parsed = ${schemaName}.safeParse(request.params.arguments ?? {});\n` +
      `      if (!_parsed.success) return mcpValidationError(_parsed.error.message);\n` +
      `      const input = _parsed.data;`
    : `      const input = ${schemaName}.parse(request.params.arguments ?? {});`;

  // Fetch block — harden uses helpers; base uses inline pattern with res.ok check
  const fetchCall = harden
    ? `        const controller = new AbortController();\n` +
      `        const timeoutId = setTimeout(() => controller.abort(), 30_000);\n` +
      `        const res = await fetch(url, {\n` +
      `          method: ${JSON.stringify(method.toUpperCase())},\n` +
      `          signal: controller.signal,\n` +
      `          headers: {\n` +
      `            'Content-Type': 'application/json',\n` +
      `            'Authorization': 'Bearer ' + (process.env['API_KEY'] ?? ''),\n` +
      `          },\n` +
      `          ${hasBody ? `body: JSON.stringify(bodyPayload),` : ''}\n` +
      `        });\n` +
      `        clearTimeout(timeoutId);\n` +
      `        const rawText = await res.text();\n` +
      `        if (rawText.length > 1_048_576) return mcpSizeLimitError('Response', '1MB');\n` +
      `        const data = res.status === 204 ? {} : JSON.parse(rawText || '{}');\n` +
      `        if (!res.ok) return mcpHttpError(res.status, data);\n` +
      `        return mcpOk(data);\n`
    : `        const res = await fetch(url, {\n` +
      `          method: ${JSON.stringify(method.toUpperCase())},\n` +
      `          headers: {\n` +
      `            'Content-Type': 'application/json',\n` +
      `            'Authorization': 'Bearer ' + (process.env['API_KEY'] ?? ''),\n` +
      `          },\n` +
      `          ${hasBody ? `body: JSON.stringify(bodyPayload),` : ''}\n` +
      `        });\n` +
      `        const data = res.status === 204 ? {} : await res.json().catch(() => ({}));\n` +
      `        if (!res.ok) return { isError: true as const, content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };\n` +
      `        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };\n`;

  // catch block — harden uses mcpCaughtError helper; base uses inline literal
  const catchBlock = harden
    ? `        return mcpCaughtError(err);`
    : `        return { isError: true, content: [{ type: 'text' as const, text: JSON.stringify({ code: 'FETCH_ERROR', message: String(err) }) }] };`;

  const dangerousTag = isDestructive ? `    /** @dangerous */\n` : '';

  return `${dangerousTag}    if (request.params.name === ${JSON.stringify(opId)}) {
${argsCheck}${zodParse}
      let url = ${JSON.stringify(baseUrl + path)};
${pathReplaceLines ? pathReplaceLines + '\n' : ''}${qsLines ? qsLines + '\n' : ''}${bodyPayload ? bodyPayload + '\n' : ''}${destructiveGate}      try {
${fetchCall}      } catch (err) {
        ${catchBlock}
      }
    }`;
}

/** Render mcp-server/index.ts for stdio transport */
function renderStdioIndexTs(name, ops, baseUrl, harden = false) {
  const zodSchemas = ops.map((op) => buildZodSchemaStr(op)).join('\n\n');
  const toolDefs = ops.map((op) => buildToolDef(op));
  const handlerBranches = ops.map((op) => buildHandlerStr(op, baseUrl, harden)).join('\n\n');

  const hardenImport = harden
    ? `import { mcpOk, mcpHttpError, mcpCaughtError, mcpValidationError, mcpSizeLimitError } from './mcp-error-response.js';\n`
    : '';

  return `// Auto-generated by forge-skill-from-openapi --target=mcp-server --transport=stdio${harden ? ' --harden' : ''}
// API: ${name}
// DO NOT EDIT — re-run forge to regenerate

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
${hardenImport}

// ── Zod input schemas (one per operation) ────────────────────────────────────

${zodSchemas}

// ── Server init ──────────────────────────────────────────────────────────────

const server = new Server(
  { name: ${JSON.stringify(name)}, version: '1.0.0' },
  { capabilities: { tools: {} } },
);

// ── ListTools ─────────────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: ${JSON.stringify(toolDefs, null, 2)},
}));

// ── CallTool ──────────────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
${handlerBranches}

  return {
    isError: true,
    content: [{ type: 'text' as const, text: \`Unknown tool: \${request.params.name}\` }],
  };
});

// ── Boot ─────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('${name} MCP server running on stdio\\n');
}

main().catch((err) => {
  process.stderr.write(\`Fatal: \${err instanceof Error ? err.message : String(err)}\\n\`);
  process.exit(1);
});
`;
}

/** Render mcp-server/index.ts for HTTP transport (CF Workers, raw fetch handler) */
function renderHttpIndexTs(name, ops, baseUrl, harden = false) {
  const zodSchemas = ops.map((op) => buildZodSchemaStr(op)).join('\n\n');
  const toolDefs = ops.map((op) => buildToolDef(op));
  const handlerBranches = ops.map((op) => buildHandlerStr(op, baseUrl, harden)).join('\n\n');

  const hardenImport = harden
    ? `import { mcpOk, mcpHttpError, mcpCaughtError, mcpValidationError, mcpSizeLimitError } from './mcp-error-response.js';\n`
    : '';

  return `// Auto-generated by forge-skill-from-openapi --target=mcp-server --transport=http${harden ? ' --harden' : ''}
// API: ${name} — CF Workers HTTP transport (StreamableHTTP)
// DO NOT EDIT — re-run forge to regenerate

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
${hardenImport}

// ── CF Worker env type ────────────────────────────────────────────────────────

interface Env {
  API_KEY?: string;
  MCP_SECRET?: string;
}

// ── Zod input schemas (one per operation) ────────────────────────────────────

${zodSchemas}

// ── MCP server factory (stateless — one per request) ─────────────────────────

function createMcpServer(env: Env): Server {
  // Expose API_KEY to handler branches via process.env shim
  if (env.API_KEY) (process.env as Record<string, string>)['API_KEY'] = env.API_KEY;

  const server = new Server(
    { name: ${JSON.stringify(name)}, version: '1.0.0' },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: ${JSON.stringify(toolDefs, null, 2)},
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
${handlerBranches}

    return {
      isError: true,
      content: [{ type: 'text' as const, text: \`Unknown tool: \${request.params.name}\` }],
    };
  });

  return server;
}

// ── Fetch handler (CF Workers export default) ─────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check (unauthenticated — used by deploy-verifier)
    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', server: ${JSON.stringify(name)}, ts: Date.now() });
    }

    // Only handle /mcp
    if (url.pathname !== '/mcp') {
      return new Response('Not found', { status: 404 });
    }

    // Bearer auth guard
    const auth = request.headers.get('Authorization') ?? '';
    const secret = env.MCP_SECRET ?? '';
    if (secret && auth !== \`Bearer \${secret}\`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const server = createMcpServer(env);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
    });
    await server.connect(transport);
    return transport.handleRequest(request);
  },
};
`;
}

/** Render mcp-server/package.json */
function renderMcpPackageJson(name, transport) {
  const pkg = {
    name,
    version: '1.0.0',
    type: 'module',
    scripts:
      transport === 'stdio'
        ? { build: 'tsc', dev: 'tsx src/index.ts', start: 'node dist/index.js' }
        : { build: 'tsc', deploy: 'wrangler deploy', dev: 'wrangler dev' },
    dependencies: {
      '@modelcontextprotocol/sdk': '^1.12.0',
      zod: '^3.23.0',
      ...(transport === 'http' ? { hono: '^4.7.0' } : {}),
    },
    devDependencies: {
      typescript: '^5.9.0',
      '@types/node': '^22.0.0',
      ...(transport === 'stdio' ? { tsx: '^4.19.0' } : { wrangler: '^4.0.0' }),
    },
  };
  return JSON.stringify(pkg, null, 2);
}

/** Render mcp-server/tsconfig.json */
function renderMcpTsconfig(transport) {
  const opts =
    transport === 'stdio'
      ? { target: 'ES2022', module: 'NodeNext', moduleResolution: 'NodeNext', outDir: 'dist', rootDir: 'src', strict: true, esModuleInterop: true, skipLibCheck: true }
      : { target: 'ES2022', module: 'ES2022', moduleResolution: 'bundler', outDir: 'dist', rootDir: 'src', strict: true, esModuleInterop: true, skipLibCheck: true };
  return JSON.stringify({ compilerOptions: opts }, null, 2);
}

/** Render wrangler.toml (HTTP transport only) */
function renderWranglerToml(name, harden = false) {
  const hardenBindings = harden
    ? `
[[durable_objects.bindings]]
name = "MCP_RATE_LIMITER"
class_name = "McpRateLimiter"

[[d1_databases]]
binding = "AUDIT_DB"
database_name = "mcp-audit"
database_id = "replace-with-real-id"
`
    : '';

  return `name = "${name}"
main = "src/index.ts"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

[vars]
# MCP_SECRET = "set-via-wrangler-secret"
# wrangler secret put MCP_SECRET
# wrangler secret put API_KEY
${hardenBindings}`;
}

/** Render mcp-server/README.md */
function renderMcpReadme(name, transport, ops) {
  const toolList = ops
    .map((op) => {
      const opId = op.op.operationId ?? `${op.method}-${slugify(op.path)}`;
      const summary = op.op.summary ?? op.op.description ?? `${op.method.toUpperCase()} ${op.path}`;
      return `- \`${opId}\` — ${summary}`;
    })
    .join('\n');

  const claudeJson =
    transport === 'stdio'
      ? JSON.stringify({ mcpServers: { [name]: { command: 'node', args: ['dist/index.js'], env: { API_KEY: '<your-api-key>' } } } }, null, 2)
      : JSON.stringify({ mcpServers: { [name]: { url: `https://${name}.workers.dev/mcp`, headers: { Authorization: 'Bearer <MCP_SECRET>' } } } }, null, 2);

  const setupSteps =
    transport === 'stdio'
      ? `\`\`\`bash
npm install
npm run build
# Register in ~/.claude.json or project .claude.json (see below)
\`\`\``
      : `\`\`\`bash
npm install
wrangler secret put API_KEY
wrangler secret put MCP_SECRET
wrangler deploy
\`\`\``;

  return `# ${name} MCP Server

Auto-generated from OpenAPI spec by \`forge-skill-from-openapi --target=mcp-server\`.
Transport: **${transport}**

## Tools (${ops.length})

${toolList}

## Setup

${setupSteps}

## .claude.json registration

\`\`\`json
${claudeJson}
\`\`\`

## Auth

Set \`API_KEY\` (env var for stdio, \`wrangler secret\` for http) to your upstream API token.
${transport === 'http' ? 'Set `MCP_SECRET` to gate access to the `/mcp` endpoint.\n' : ''}
## Re-generate

\`\`\`bash
node ~/.claude/plugins/heymegabyte-claude-skills/bin/forge-skill-from-openapi.mjs \\
  <spec-url> <output-dir> --name ${name} --target mcp-server --transport ${transport}
\`\`\`
`;
}

/** Generate hardening scaffold files (rate-limiter, audit-log, scrub-pii, migration) */
async function generateHardeningScaffold(mcpDir, name, transport, allOps) {
  const srcDir = join(mcpDir, 'src');
  const migrationsDir = join(mcpDir, 'migrations');
  await mkdir(migrationsDir, { recursive: true });

  // ── rate-limiter.ts ───────────────────────────────────────────────────────
  const rateLimiterContent = transport === 'http'
    ? `// src/rate-limiter.ts
// Auto-generated by forge-skill-from-openapi --harden
// Sliding-window DO rate limiter — bind as MCP_RATE_LIMITER in wrangler.toml

export class McpRateLimiter implements DurableObject {
  private requests: number[] = [];
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(req: Request): Promise<Response> {
    const body = await req.json<{ toolName: string; windowMs: number; limit: number }>();
    const now = Date.now();
    this.requests = this.requests.filter(t => t > now - body.windowMs);
    if (this.requests.length >= body.limit) {
      const retryAfter = Math.ceil((this.requests[0] + body.windowMs - now) / 1000);
      return Response.json({ allowed: false, retryAfter }, { status: 429 });
    }
    this.requests.push(now);
    return Response.json({ allowed: true });
  }
}

/** Default rate limits by tool class */
export const TOOL_RATE_LIMITS: Record<string, { windowMs: number; limit: number }> = {
  // read tools — 120 req/min
  _read:       { windowMs: 60_000, limit: 120 },
  // write tools — 30 req/min
  _write:      { windowMs: 60_000, limit: 30 },
  // destructive tools — 5 per 5 min
  _destructive:{ windowMs: 300_000, limit: 5 },
  // default
  _default:    { windowMs: 60_000, limit: 60 },
};

export function getRateLimit(toolName: string): { windowMs: number; limit: number } {
  if (/^(list_|get_|search_|find_)/.test(toolName)) return TOOL_RATE_LIMITS._read;
  if (/^(delete_|cancel_|void_|refund_|destroy_|remove_|purge_)/.test(toolName)) return TOOL_RATE_LIMITS._destructive;
  if (/^(create_|update_|patch_|put_)/.test(toolName)) return TOOL_RATE_LIMITS._write;
  return TOOL_RATE_LIMITS._default;
}
`
    : `// src/rate-limiter.ts
// Auto-generated by forge-skill-from-openapi --harden
// stdio transport: Durable Object rate limiter not applicable.
// Implement in-process rate limiting here if needed (e.g. a token bucket per tool).
`;

  await writeFile(join(srcDir, 'rate-limiter.ts'), rateLimiterContent, 'utf8');

  // ── audit-log.ts ──────────────────────────────────────────────────────────
  const auditLogContent = `// src/audit-log.ts
// Auto-generated by forge-skill-from-openapi --harden
// Tool invocation audit logger — writes to D1 binding AUDIT_DB

interface AuditEntry {
  toolName: string;
  scrubbedArgs: unknown;
  status: 'success' | 'error' | 'rate_limited' | 'auth_denied';
  latencyMs: number;
  userId: string;
  errorCode?: string;
  serverName: string;
}

interface AuditEnv {
  AUDIT_DB: D1Database;
}

export async function logToolCall(env: AuditEnv, entry: AuditEntry): Promise<void> {
  const argsJson = JSON.stringify(entry.scrubbedArgs);
  const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(argsJson));
  const argsSha256 = [...new Uint8Array(hashBuf)].map(b => b.toString(16).padStart(2, '0')).join('');

  try {
    await env.AUDIT_DB.prepare(
      \`INSERT INTO mcp_tool_calls (tool_name, args_sha256, response_status, latency_ms, user_id, server_name, error_code)
       VALUES (?, ?, ?, ?, ?, ?, ?)\`
    ).bind(
      entry.toolName,
      argsSha256,
      entry.status,
      entry.latencyMs,
      entry.userId,
      entry.serverName,
      entry.errorCode ?? null
    ).run();
  } catch {
    // Never let audit log failure break the tool response
  }
}

export function withAuditLog<T>(
  handler: (toolName: string, args: unknown) => Promise<T>,
  env: AuditEnv,
  serverName: string,
  userId: string,
): (toolName: string, args: unknown) => Promise<T> {
  return async (toolName, args) => {
    const start = Date.now();
    try {
      const result = await handler(toolName, args);
      await logToolCall(env, {
        toolName, scrubbedArgs: args, status: 'success',
        latencyMs: Date.now() - start, userId, serverName,
      });
      return result;
    } catch (err) {
      await logToolCall(env, {
        toolName, scrubbedArgs: args, status: 'error',
        latencyMs: Date.now() - start, userId, serverName,
        errorCode: err instanceof Error ? err.name : 'UnknownError',
      });
      throw err;
    }
  };
}
`;

  await writeFile(join(srcDir, 'audit-log.ts'), auditLogContent, 'utf8');

  // ── scrub-pii.ts ──────────────────────────────────────────────────────────
  const scrubPiiContent = `// src/scrub-pii.ts
// Auto-generated by forge-skill-from-openapi --harden
// Redact PII / secrets from args + responses before audit logging

const REDACT_KEYS = /^(token|secret|key|password|auth|bearer|ssn|cc_number|card|api_key|apikey|access_token|refresh_token|private_key)/i;
const REDACT_PATTERNS = [
  /\\b\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}\\b/g,           // credit card
  /\\b\\d{3}-\\d{2}-\\d{4}\\b/g,                               // SSN
  /\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/g, // email
  /\\+?[\\d\\s\\-().]{10,}/g,                                  // phone
  /Bearer\\s+[A-Za-z0-9\\-._~+/]+=*/gi,                       // bearer token
];

export function redactPii(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[truncated]';
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    let s = value;
    for (const pattern of REDACT_PATTERNS) s = s.replace(pattern, '[REDACTED]');
    return s;
  }
  if (Array.isArray(value)) return value.map(v => redactPii(v, depth + 1));
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = REDACT_KEYS.test(k) ? '[REDACTED]' : redactPii(v, depth + 1);
    }
    return out;
  }
  return value;
}
`;

  await writeFile(join(srcDir, 'scrub-pii.ts'), scrubPiiContent, 'utf8');

  // ── migrations/0001_mcp_tool_calls.sql ────────────────────────────────────
  const migrationContent = `-- Auto-generated by forge-skill-from-openapi --harden
-- MCP tool call audit log table

CREATE TABLE IF NOT EXISTS mcp_tool_calls (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp       TEXT    NOT NULL DEFAULT (datetime('now')),
  tool_name       TEXT    NOT NULL,
  args_sha256     TEXT    NOT NULL,
  response_status TEXT    NOT NULL CHECK(response_status IN ('success','error','rate_limited','auth_denied')),
  latency_ms      INTEGER NOT NULL,
  user_id         TEXT    NOT NULL,
  server_name     TEXT    NOT NULL,
  error_code      TEXT
);

CREATE INDEX IF NOT EXISTS idx_mcp_tool_calls_timestamp ON mcp_tool_calls(timestamp);
CREATE INDEX IF NOT EXISTS idx_mcp_tool_calls_tool      ON mcp_tool_calls(tool_name, timestamp);
CREATE INDEX IF NOT EXISTS idx_mcp_tool_calls_user      ON mcp_tool_calls(user_id, timestamp);
`;

  await writeFile(join(migrationsDir, '0001_mcp_tool_calls.sql'), migrationContent, 'utf8');
}

/** Main MCP server generator — called when --target=mcp-server */
async function generateMcpServer(spec, flags, outputDir, allOps, baseUrl, transport, apiName) {
  const mcpDir = join(resolve(process.cwd(), outputDir), 'mcp-server');
  const srcDir = join(mcpDir, 'src');
  await mkdir(srcDir, { recursive: true });

  const name = flags.name ?? apiName;
  const harden = flags.harden === true || flags.harden === '';

  // Copy mcp-error-response.ts helper when hardening (zero-dep, inline in src/)
  if (harden) {
    const helperSrc = join(dirname(fileURLToPath(import.meta.url)), '..', 'template', 'utils', 'mcp-error-response.ts');
    if (existsSync(helperSrc)) {
      const helperContent = await readFile(helperSrc, 'utf8');
      await writeFile(join(srcDir, 'mcp-error-response.ts'), helperContent, 'utf8');
      console.log(`   mcp-server/src/mcp-error-response.ts — helper copied`);
    } else {
      console.warn(`   WARN: mcp-error-response.ts not found at ${helperSrc} — helper not copied`);
    }
  }

  // index.ts
  const indexTs =
    transport === 'http'
      ? renderHttpIndexTs(name, allOps, baseUrl, harden)
      : renderStdioIndexTs(name, allOps, baseUrl, harden);
  await writeFile(join(srcDir, 'index.ts'), indexTs, 'utf8');
  console.log(`   mcp-server/src/index.ts — ${indexTs.split('\n').length} lines`);

  // package.json
  const pkgJson = renderMcpPackageJson(name, transport);
  await writeFile(join(mcpDir, 'package.json'), pkgJson, 'utf8');
  console.log(`   mcp-server/package.json`);

  // tsconfig.json
  const tsconfig = renderMcpTsconfig(transport);
  await writeFile(join(mcpDir, 'tsconfig.json'), tsconfig, 'utf8');
  console.log(`   mcp-server/tsconfig.json`);

  // wrangler.toml (http only)
  if (transport === 'http') {
    const wrangler = renderWranglerToml(name, harden);
    await writeFile(join(mcpDir, 'wrangler.toml'), wrangler, 'utf8');
    console.log(`   mcp-server/wrangler.toml`);
  }

  // README.md
  const readme = renderMcpReadme(name, transport, allOps);
  await writeFile(join(mcpDir, 'README.md'), readme, 'utf8');
  console.log(`   mcp-server/README.md`);

  // Hardening scaffold
  if (harden) {
    await generateHardeningScaffold(mcpDir, name, transport, allOps);
  }

  console.log(`\n🎉 MCP server scaffolded: ${name} (${transport})`);
  console.log(`   Output: ${mcpDir}`);
  console.log(`   Tools: ${allOps.length}`);

  if (harden) {
    console.log(`   Hardening: ENABLED`);
    console.log(`   - src/mcp-error-response.ts (correct isError semantics — mcpOk/mcpHttpError/mcpCaughtError/mcpValidationError/mcpSizeLimitError)`);
    console.log(`   - src/rate-limiter.ts (sliding-window DO)`);
    console.log(`   - src/audit-log.ts (D1 audit trail)`);
    console.log(`   - src/scrub-pii.ts (secret redaction)`);
    console.log(`   - migrations/0001_mcp_tool_calls.sql`);
    console.log(`   - .strict() on all Zod schemas`);
    console.log(`   - safeParse + mcpValidationError (Zod validation before fetch)`);
    console.log(`   - @dangerous tags on destructive tools`);
    console.log(`   - Resource limits (64KB args / 1MB response / 30s timeout)`);
  }

  if (transport === 'stdio') {
    console.log(`\nNext steps:`);
    console.log(`  1. cd ${mcpDir} && npm install && npm run build`);
    console.log(`  2. Set API_KEY env var for the upstream API`);
    console.log(`  3. Add .claude.json registration snippet from README.md`);
    console.log(`  4. Test: npx @modelcontextprotocol/inspector node dist/index.js`);
  } else {
    console.log(`\nNext steps:`);
    console.log(`  1. cd ${mcpDir} && npm install`);
    console.log(`  2. wrangler secret put API_KEY && wrangler secret put MCP_SECRET`);
    console.log(`  3. wrangler deploy`);
    console.log(`  4. Add .claude.json registration snippet from README.md`);
  }
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length < 2) {
    console.error(
      'Usage: node forge-skill-from-openapi.mjs <openapi-url-or-path> <output-dir> [--name <skill>] [--triggers <t1,t2>] [--base-url <url>] [--target skill|mcp-server] [--transport stdio|http] [--harden]'
    );
    process.exit(1);
  }

  const { positional, flags } = parseArgs(argv);
  const [specSource, outputDir] = positional;

  console.log(`\n🔨 forge-skill-from-openapi`);
  console.log(`   spec    : ${specSource}`);
  console.log(`   output  : ${outputDir}`);

  // Load spec
  console.log(`\n📥 Fetching spec...`);
  let spec;
  try {
    spec = await loadSpec(specSource);
  } catch (err) {
    console.error(`❌ Failed to load spec: ${err.message}`);
    process.exit(1);
  }

  if (!spec?.openapi && !spec?.swagger) {
    console.error('❌ Not a valid OpenAPI 3.x or Swagger 2.x document.');
    process.exit(1);
  }

  const apiTitle = spec.info?.title ?? 'Unknown API';
  const apiVersion = spec.info?.version ?? '0.0.0';
  console.log(`   api     : ${apiTitle} v${apiVersion}`);

  // Derive names
  const apiName = flags.name ?? slugify(apiTitle);
  const skillName = flags.name ?? apiName;
  const triggerStr = flags.triggers ?? '';
  const triggers = triggerStr ? triggerStr.split(',').map((t) => t.trim()) : [];

  // Resolve base URL
  const specBaseUrl = spec.servers?.[0]?.url ?? '';
  const baseUrl = flags['base-url'] ?? specBaseUrl ?? 'https://api.example.com';

  // Collect schemas
  const allSchemas = spec.components?.schemas ?? {};

  // Prepare output dirs
  const absOutput = resolve(process.cwd(), outputDir);

  // Count paths
  const paths = spec.paths ?? {};
  const pathCount = Object.keys(paths).length;
  console.log(`\n📋 Found ${pathCount} paths`);

  // ── MCP server target branch ──────────────────────────────────────────────
  const target = flags['target'] ?? 'skill';
  const transport = flags['transport'] ?? 'stdio';

  if (target === 'mcp-server') {
    console.log(`   target  : mcp-server (${transport} transport)`);
    const allOps = [];
    for (const [path, pathItem] of Object.entries(paths)) {
      for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
        const op = pathItem[method];
        if (!op) continue;
        const params = extractParams(op, pathItem);
        allOps.push({ path, method, op, params, pathItem });
      }
    }
    await generateMcpServer(spec, flags, outputDir, allOps, baseUrl, transport, apiName);
    return;
  }

  // ── Existing skill target (unchanged) ────────────────────────────────────
  const commandsDir = join(absOutput, 'commands');
  await mkdir(commandsDir, { recursive: true });

  // Generate per-operation command files
  const commands = [];
  let opCount = 0;

  for (const [path, pathItem] of Object.entries(paths)) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete', 'options', 'head']) {
      const op = pathItem[method];
      if (!op) continue;

      opCount++;
      const slug = `${method}-${slugify(path)}`;
      const summary = op.summary ?? op.description ?? `${method.toUpperCase()} ${path}`;
      const params = extractParams(op, pathItem);
      const bodySchema = extractBodySchema(op);
      const responseSchema = extractResponseSchema(op);

      const mdContent = buildCommandMd(method, path, op, params, bodySchema, responseSchema, baseUrl, allSchemas);
      const filename = `${slug}.md`;
      await writeFile(join(commandsDir, filename), mdContent, 'utf8');

      commands.push({ slug, summary, method, path });
      process.stdout.write(`.`);
    }
  }

  console.log(`\n✅ Generated ${opCount} command files`);

  // Generate types.ts
  const typesContent = buildTypesTs(spec, apiName);
  await writeFile(join(absOutput, 'types.ts'), typesContent, 'utf8');
  console.log(`   types.ts — ${Object.keys(allSchemas).length} schema types`);

  // Generate client.ts
  const clientContent = buildClientTs(spec, apiName, baseUrl);
  await writeFile(join(absOutput, 'client.ts'), clientContent, 'utf8');
  console.log(`   client.ts — ${opCount} methods`);

  // Generate SKILL.md
  const skillMd = buildSkillMd(spec, apiName, skillName, triggers, commands, outputDir);
  await writeFile(join(absOutput, 'SKILL.md'), skillMd, 'utf8');
  console.log(`   SKILL.md — master skill file`);

  // Print summary
  console.log(`\n🎉 Forged skill: ${skillName}`);
  console.log(`   Output: ${absOutput}`);
  console.log(`   Commands: ${opCount}`);
  console.log(`   Types: ${Object.keys(allSchemas).length} schemas`);
  console.log(`\nNext steps:`);
  console.log(`  1. Review generated commands in ${commandsDir}`);
  console.log(`  2. Add auth env var guidance to SKILL.md`);
  console.log(`  3. Hand-edit high-traffic commands with real examples`);
  console.log(`  4. Link the skill in ~/.agentskills/ if not already there`);

  return { opCount, schemaCount: Object.keys(allSchemas).length, outputDir: absOutput };
}

main().catch((err) => {
  console.error(`\n❌ Fatal error: ${err.message}`);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
