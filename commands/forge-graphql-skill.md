---
description: Scaffold a complete Claude Code skill (commands + types + client) from a GraphQL endpoint or local schema file
argument-hint: <name> <graphql-endpoint-url> [--schema-introspection] [--schema-file <path>] [--auth-header <header>]
allowed-tools: Bash, Read, Write, Edit, Glob
---

Forge a complete Claude Code skill from a GraphQL API. Introspects the schema (or reads a local SDL file), emits one slash command per top-level Query/Mutation, generates `types.ts` + `client.ts` (Workers-compatible, zero Node built-ins), and writes paired test scaffolds per `[[forge-with-test-scaffold-pattern]]`.

## How to use

```
/forge-graphql-skill shopify https://mystore.myshopify.com/admin/api/2024-10/graphql.json --schema-introspection --auth-header "X-Shopify-Access-Token: shpat_xxx"
/forge-graphql-skill github https://api.github.com/graphql --schema-introspection --auth-header "Authorization: Bearer ghp_xxx"
/forge-graphql-skill contentful --schema-file ./schema.graphql
```

## What gets generated

```
~/.agentskills/<name>-graphql/
  SKILL.md                        ← master skill file, all commands linked
  types.ts                        ← TypeScript types from GraphQL schema (Zod-validated at runtime boundaries)
  client.ts                       ← Workers-compatible typed GraphQL client (graphql-request pattern, zero Node built-ins)
  commands/
    query-<QueryName>.md          ← one slash command per top-level Query field
    mutation-<MutationName>.md    ← one slash command per top-level Mutation field

tests/
  <name>-graphql/
    client.test.ts                ← Vitest unit tests (fetch-mocked) per [[forge-with-test-scaffold-pattern]]

e2e/graphql/
  <name>.spec.ts                  ← Playwright E2E smoke test against live endpoint (if HTTP-reachable)
```

## Execution

```bash
ARGS="${ARGUMENTS}"
NAME="${ARGS%% *}"
REST="${ARGS#* }"
```

### Step 1 — parse flags

```bash
ENDPOINT=""
SCHEMA_FILE=""
AUTH_HEADER=""
INTROSPECT=0

while [[ -n "$REST" ]]; do
  TOKEN="${REST%% *}"
  REST="${REST#* }"
  [[ "$REST" == "$TOKEN" ]] && REST=""

  case "$TOKEN" in
    --schema-introspection) INTROSPECT=1 ;;
    --schema-file) SCHEMA_FILE="${REST%% *}"; REST="${REST#* }"; [[ "$REST" == "$SCHEMA_FILE" ]] && REST="" ;;
    --auth-header) AUTH_HEADER="${REST%% *}"; REST="${REST#* }"; [[ "$REST" == "$AUTH_HEADER" ]] && REST="" ;;
    http*) ENDPOINT="$TOKEN" ;;
  esac
done

echo "SKILL: $NAME  ENDPOINT: $ENDPOINT  INTROSPECT: $INTROSPECT  SCHEMA_FILE: $SCHEMA_FILE"
```

### Step 2 — acquire schema

**If `--schema-introspection` (and ENDPOINT set):** POST the standard introspection query.

```bash
cat > /tmp/introspect-body.json <<'EOF'
{"query":"{ __schema { queryType { name } mutationType { name } types { kind name description fields(includeDeprecated:false) { name description args { name type { kind name ofType { kind name ofType { kind name } } } } type { kind name ofType { kind name ofType { kind name ofType { kind name } } } } } inputFields { name type { kind name ofType { kind name } } } } } }"}
EOF

if [ -n "$AUTH_HEADER" ]; then
  curl -s -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d @/tmp/introspect-body.json > /tmp/gql-schema.json
else
  curl -s -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    -d @/tmp/introspect-body.json > /tmp/gql-schema.json
fi

# Verify introspection succeeded
node -e "const s=JSON.parse(require('fs').readFileSync('/tmp/gql-schema.json'));if(s.errors){console.error('Introspection failed:',JSON.stringify(s.errors));process.exit(1)}; console.log('Schema types:', s.data.__schema.types.length)"
```

**If `--schema-file`:** read the SDL file, parse it with `graphql` npm package or inline SDL parser.

```bash
if [ -n "$SCHEMA_FILE" ]; then
  cp "$SCHEMA_FILE" /tmp/gql-schema-sdl.graphql
  echo "Using local schema: $SCHEMA_FILE"
fi
```

### Step 3 — extract top-level operations

```bash
node - <<'EOF'
const schema = JSON.parse(require('fs').readFileSync('/tmp/gql-schema.json', 'utf8'));
const types = schema.data.__schema.types;

const queryType = types.find(t => t.name === 'Query');
const mutationType = types.find(t => t.name === 'Mutation');

const queries = (queryType?.fields ?? []).map(f => ({ name: f.name, kind: 'Query', description: f.description, args: f.args, returnType: f.type }));
const mutations = (mutationType?.fields ?? []).map(f => ({ name: f.name, kind: 'Mutation', description: f.description, args: f.args, returnType: f.type }));

require('fs').writeFileSync('/tmp/gql-operations.json', JSON.stringify({ queries, mutations }, null, 2));
console.log(`Queries: ${queries.length}  Mutations: ${mutations.length}`);
queries.forEach(q => console.log('  Q:', q.name));
mutations.forEach(m => console.log('  M:', m.name));
EOF
```

### Step 4 — create output directory

```bash
mkdir -p ~/.agentskills/${NAME}-graphql/commands
mkdir -p tests/${NAME}-graphql
mkdir -p e2e/graphql
echo "Output dir: ~/.agentskills/${NAME}-graphql"
```

### Step 5 — write `types.ts`

Write `~/.agentskills/<name>-graphql/types.ts` as a **separate Write call**. Content:

```typescript
// AUTO-GENERATED by /forge-graphql-skill — do not hand-edit; re-forge to update
// GraphQL skill: <name>  Source: <endpoint or schema-file>

import { z } from 'zod'

// ── Scalar base types ────────────────────────────────────────────────────────
export const GraphQLID = z.string()
export const GraphQLString = z.string()
export const GraphQLInt = z.number().int()
export const GraphQLFloat = z.number()
export const GraphQLBoolean = z.boolean()

// ── Generated object types (from schema introspection) ───────────────────────
// <EMIT ONE z.object() per non-scalar, non-builtin type found in __schema.types>
// Example shape (replace with actual schema types):
export const PageInfoSchema = z.object({
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
  startCursor: z.string().nullable(),
  endCursor: z.string().nullable(),
})
export type PageInfo = z.infer<typeof PageInfoSchema>

// ── Per-operation input/output types ─────────────────────────────────────────
// <EMIT one input schema + one output schema per Query/Mutation>
// Claude should generate these from the extracted operations in /tmp/gql-operations.json
```

### Step 6 — write `client.ts`

Write `~/.agentskills/<name>-graphql/client.ts` as a **separate Write call**. Must use
`fetch` only (Workers-compatible, no Node built-ins). Pattern mirrors `graphql-request`
without the npm dep:

```typescript
// AUTO-GENERATED by /forge-graphql-skill
// Workers-compatible GraphQL client — zero Node built-ins, pure fetch

import { z } from 'zod'

export interface GraphQLClientOptions {
  endpoint: string
  /** Authorization header value, e.g. "Bearer token" or "X-API-Key: key" */
  authHeader?: string
  /** Extra headers merged into every request */
  headers?: Record<string, string>
}

export interface GraphQLResponse<T> {
  data: T
  errors?: Array<{ message: string; locations?: unknown; path?: unknown }>
}

export class GraphQLClient {
  constructor(private opts: GraphQLClientOptions) {}

  async query<T>(
    query: string,
    variables?: Record<string, unknown>,
    outputSchema?: z.ZodType<T>
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.opts.headers,
    }
    if (this.opts.authHeader) {
      const [key, ...rest] = this.opts.authHeader.split(': ')
      headers[key] = rest.join(': ')
    }

    const res = await fetch(this.opts.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    })

    if (!res.ok) {
      throw new Error(`GraphQL HTTP ${res.status}: ${await res.text()}`)
    }

    const json = (await res.json()) as GraphQLResponse<T>

    if (json.errors?.length) {
      throw new Error(`GraphQL errors: ${json.errors.map(e => e.message).join('; ')}`)
    }

    if (outputSchema) {
      return outputSchema.parse(json.data)
    }

    return json.data
  }

  /** Convenience alias — mutations use the same wire protocol */
  mutate = this.query.bind(this)
}

// ── Generated typed helpers (one per top-level Query/Mutation) ───────────────
// <EMIT one async function per operation — see generated commands for usage>
// Example:
export async function queryViewer(client: GraphQLClient) {
  return client.query<{ viewer: { login: string } }>(
    `query { viewer { login } }`
  )
}
```

### Step 7 — write one slash command per Query

For each entry in `/tmp/gql-operations.json`.queries, write
`~/.agentskills/<name>-graphql/commands/query-<QueryName>.md` as a **separate Write
call per file**. Template:

```markdown
---
description: Run GraphQL query <QueryName> against <name> API
argument-hint: [variable-overrides as JSON]
allowed-tools: Bash, Read
---

Run the `<QueryName>` query against the <name> GraphQL API.

## Schema

**Returns:** `<returnType>` <!-- from introspection -->
**Args:** <!-- list each arg: name (type) — description -->

## Usage

/query-<QueryName>
/query-<QueryName> {"first": 10, "after": "cursor123"}

## Execute

```bash
node - <<'EOF'
const { GraphQLClient } = require('~/.agentskills/<name>-graphql/client.ts') // or compiled
const client = new GraphQLClient({
  endpoint: process.env.<NAME>_GRAPHQL_ENDPOINT,
  authHeader: process.env.<NAME>_AUTH_HEADER,
})
const vars = process.argv[2] ? JSON.parse(process.argv[2]) : {}
client.query(`
  query <QueryName>($first: Int) {
    <queryName>(first: $first) {
      # fields from introspected return type
    }
  }
`, vars).then(d => console.log(JSON.stringify(d, null, 2))).catch(e => { console.error(e.message); process.exit(1) })
EOF
```

## Environment

- `<NAME>_GRAPHQL_ENDPOINT` — full GraphQL URL (e.g. https://api.github.com/graphql)
- `<NAME>_AUTH_HEADER` — authorization header (e.g. "Authorization: Bearer ghp_xxx")

```

### Step 8 — write one slash command per Mutation

Same pattern as Step 7 but prefix `mutation-` and use `mutate()` in the execute block.

### Step 9 — write `SKILL.md`

Write `~/.agentskills/<name>-graphql/SKILL.md`:

```markdown
---
name: "<name>-graphql"
description: "Typed GraphQL client + slash commands for the <name> API. Auto-generated by /forge-graphql-skill."
triggers:
  - "<name>"
  - "<name> graphql"
  - "query <name>"
  - "mutate <name>"
version: "1.0.0"
---

# <name> GraphQL Skill

Auto-generated from introspection of `<endpoint>`.

## Commands

<!-- list all generated query-* and mutation-* commands -->

## Auth

Set `<NAME>_GRAPHQL_ENDPOINT` + `<NAME>_AUTH_HEADER` in your environment or `.dev.vars`.

## Regenerate

/forge-graphql-skill <name> <endpoint> --schema-introspection --auth-header "<header>"
```

### Step 10 — write test scaffold (MANDATORY per `[[forge-with-test-scaffold-pattern]]`)

Write `tests/<name>-graphql/client.test.ts` as a **separate Write call**:

```typescript
// AUTO-GENERATED by /forge-graphql-skill
// Vitest unit tests for <name> GraphQL client — fetch-mocked, no network calls

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GraphQLClient } from '../../.agentskills/<name>-graphql/client'

const ENDPOINT = 'https://api.example.com/graphql'
const AUTH = 'Bearer test_token'

describe('/forge-graphql-skill: <name> client', () => {
  beforeEach(() => { vi.clearAllMocks() })
  afterEach(() => { vi.restoreAllMocks() })

  it('happy path — successful query returns typed data', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { viewer: { login: 'testuser' } } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    ) as unknown as typeof fetch

    const client = new GraphQLClient({ endpoint: ENDPOINT, authHeader: AUTH })
    const result = await client.query<{ viewer: { login: string } }>('{ viewer { login } }')
    expect(result.viewer.login).toBe('testuser')
  })

  it('throws on HTTP 401 — invalid auth header', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('Unauthorized', { status: 401 })
    ) as unknown as typeof fetch

    const client = new GraphQLClient({ endpoint: ENDPOINT, authHeader: 'Bearer bad' })
    await expect(client.query('{ viewer { login } }')).rejects.toThrow('GraphQL HTTP 401')
  })

  it('throws on GraphQL-layer error — not HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        data: null,
        errors: [{ message: 'Field "viewer" not found on type "Query"' }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    ) as unknown as typeof fetch

    const client = new GraphQLClient({ endpoint: ENDPOINT, authHeader: AUTH })
    await expect(client.query('{ viewer { login } }')).rejects.toThrow('GraphQL errors')
  })

  it('sets Authorization header from authHeader option', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    ) as unknown as typeof fetch

    const client = new GraphQLClient({ endpoint: ENDPOINT, authHeader: 'Authorization: Bearer tok' })
    await client.query('{ __typename }')
    const [, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect((opts as RequestInit).headers as Record<string, string>).toMatchObject({ Authorization: 'Bearer tok' })
  })
})
```

Also write `e2e/graphql/<name>.spec.ts` as a **separate Write call** (smoke test only — skipped if no HTTP endpoint):

```typescript
// AUTO-GENERATED by /forge-graphql-skill
// Playwright smoke test — runs against live endpoint, requires env vars

import { test, expect } from '@playwright/test'

// Skip suite if endpoint not configured
test.skip(!process.env.<NAME>_GRAPHQL_ENDPOINT, '<NAME>_GRAPHQL_ENDPOINT not set — skipping live GraphQL E2E')

test.describe('/forge-graphql-skill: <name> GraphQL live smoke', () => {
  test('introspection query returns schema types', async ({ request }) => {
    const res = await request.post(process.env.<NAME>_GRAPHQL_ENDPOINT!, {
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.<NAME>_AUTH_HEADER
          ? (() => { const [k,...v]=process.env.<NAME>_AUTH_HEADER!.split(': '); return {[k]:v.join(': ')} })()
          : {}),
      },
      data: { query: '{ __schema { queryType { name } } }' },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data.__schema.queryType.name).toBeTruthy()
    expect(body.errors).toBeUndefined()
  })
})
```

### Step 11 — summary report

After all writes complete:

1. Run `find ~/.agentskills/${NAME}-graphql -type f | sort` and display the full file tree.
2. Report: skill name, endpoint or schema source, query count, mutation count, type count, test files emitted.
3. Show next steps:
   - `export <NAME>_GRAPHQL_ENDPOINT=<url> && export <NAME>_AUTH_HEADER="Bearer <token>"`
   - `npx vitest run tests/<name>-graphql/client.test.ts` (should be RED until client.ts is wired in project)
   - `npx playwright test e2e/graphql/<name>.spec.ts` (requires live endpoint)
   - Add to `plugin.json` skills array to activate in Claude Code.

## Workers-compatibility rules for generated `client.ts`

- `fetch` only — never `require('http')`, `require('https')`, `import { createServer }`.
- No `Buffer` — use `TextEncoder`/`TextDecoder` for binary.
- No `fs`, `path`, `process.env` access in the client itself — pass config via constructor.
- `crypto.subtle` for any HMAC/hashing, not `require('crypto')`.
- All imports must be resolvable from Workers runtime or via npm + `wrangler bundle`.

## Supported APIs (tested schema sources)

- GitHub: `https://api.github.com/graphql` + `Authorization: Bearer ghp_xxx`
- Shopify Admin: `https://<store>.myshopify.com/admin/api/2024-10/graphql.json` + `X-Shopify-Access-Token: shpat_xxx`
- Contentful: `https://graphql.contentful.com/content/v1/spaces/<id>` + `Authorization: Bearer <CDA_token>`
- Any endpoint returning standard introspection response from `{ __schema { ... } }`

## Anti-patterns

- Do NOT hand-roll GraphQL clients for APIs that support introspection — forge first.
- Do NOT emit `graphql-tag` or `gql` template literals — plain string queries keep Workers bundle lean.
- Do NOT use `graphql-request` npm package directly in Workers — the generated `client.ts` IS the zero-dep replacement.
- Do NOT skip test emission (Step 10) — per `[[forge-with-test-scaffold-pattern]]`, source without tests is an incomplete forge.

## Cross-links

- `[[forge-with-test-scaffold-pattern]]` — mandatory paired test scaffold on every forge
- `[[verification-loop]]` — RED test before GREEN implementation
- `[[e2e-tdd-organization]]` — E2E spec layout + hermetic requirements
- `[[forge-from-openapi]]` — analogous pattern for REST/OpenAPI APIs
- `[[zod-everywhere]]` — Zod validation on all runtime boundaries including GraphQL responses
