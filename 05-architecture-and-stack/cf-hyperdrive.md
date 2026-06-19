---
name: "cf-hyperdrive"
priority: 2
pack: "architecture"
triggers:
  - "hyperdrive"
  - "postgres"
  - "postgresql"
  - "mysql"
  - "external database"
  - "connection pooling"
  - "legacy database"
  - "hybrid database"
  - "migrate to cloudflare"
  - "multi-region read"
paths:
  - "**/wrangler.{toml,jsonc}"
  - "**/db/**"
  - "**/database/**"
  - "**/*.sql"
---

# CF Hyperdrive

Accelerates external Postgres/MySQL from Workers by pooling connections at the CF edge and caching hot queries globally. Eliminates the cold-connection latency spike (typically 100-500ms) that makes Workers + external DBs feel slow.

Source: `developers.cloudflare.com/hyperdrive`. See `[[cloudflare-lock-in-is-leverage]]`.

## When to use Hyperdrive vs D1

| Factor | Use D1 | Use Hyperdrive + external DB |
|---|---|---|
| New greenfield project | ✓ | — |
| Data already in Postgres/MySQL | — | ✓ |
| Need Postgres extensions (PostGIS, pgvector, TimescaleDB) | — | ✓ |
| Large dataset (>10 GB) | — | ✓ (D1 limit is 10 GB) |
| Complex joins, stored procedures | — | ✓ |
| Global read replicas (Neon, PlanetScale, CockroachDB) | — | ✓ |
| Zero ops, fully managed | ✓ | — |
| Cost: pay per query | D1 is cheaper | Hyperdrive adds ~$0.50/1M rows + DB cost |

**Brian's default**: D1 for new projects. Hyperdrive for hybrid migrations and projects requiring Neon (branching, point-in-time recovery) or Postgres-specific features.

## Quick start

```bash
# 1. Create Hyperdrive config (one per DB)
npx wrangler hyperdrive create my-db \
  --connection-string="postgres://user:password@db.example.com:5432/mydb"

# 2. Output includes the config ID — copy it
# Output: Created Hyperdrive config my-db with ID: abc123...

# 3. With caching disabled (for write-heavy or real-time data):
npx wrangler hyperdrive create my-db-nocache \
  --connection-string="postgres://..." \
  --caching-disabled

# 4. Custom cache TTL (default is 60s):
npx wrangler hyperdrive create my-db-long \
  --connection-string="postgres://..." \
  --max-age=300
```

## wrangler.toml binding

```toml
[[hyperdrive]]
binding = "HYPERDRIVE"
id = "abc123yourhyperdriveConfigId"

# Local dev: point at local Postgres (bypasses Hyperdrive tunnel)
localConnectionString = "postgres://user:password@localhost:5432/mydb_dev"
```

Multiple Hyperdrive configs (read replica + primary):

```toml
[[hyperdrive]]
binding = "DB_PRIMARY"
id = "abc123primaryConfigId"

[[hyperdrive]]
binding = "DB_REPLICA"
id = "def456replicaConfigId"
```

## Worker code — postgres.js (recommended)

```ts
import postgres from 'postgres';

export interface Env {
  HYPERDRIVE: Hyperdrive;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Create a new client per request — Hyperdrive pools the actual TCP connection
    // so this is cheap: no new handshake, no TLS negotiation
    const sql = postgres(env.HYPERDRIVE.connectionString, {
      max: 5,           // max connections from this Worker instance
      fetch_types: false, // required for Workers compatibility
    });

    try {
      const users = await sql`
        SELECT id, email, created_at
        FROM users
        WHERE active = true
        ORDER BY created_at DESC
        LIMIT 50
      `;
      return Response.json(users);
    } finally {
      await sql.end(); // return connection to pool — do NOT skip
    }
  },
};
```

## Worker code — pg (node-postgres)

```ts
import { Client } from 'pg';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });
    await client.connect();

    try {
      const { rows } = await client.query(
        'SELECT id, name FROM products WHERE tenant_id = $1',
        ['tenant-abc']
      );
      return Response.json(rows);
    } finally {
      await client.end();
    }
  },
};
```

## Prepared statement caching

Hyperdrive caches prepared statements at the pooler layer — your Worker sends a parameterized query once, and Hyperdrive reuses the cached execution plan on subsequent calls. This is automatic and opt-in per-query.

```ts
// Hyperdrive caches the query plan for this parameterized form
// The first call parses + plans; subsequent calls skip planning overhead
const result = await sql`
  SELECT * FROM orders
  WHERE tenant_id = ${tenantId}
    AND status = ${status}
  ORDER BY created_at DESC
  LIMIT ${limit}
`;

// Hyperdrive does NOT cache non-parameterized queries with interpolated values
// BAD — no plan reuse, potential SQL injection:
const bad = await sql.unsafe(`SELECT * FROM orders WHERE tenant_id = '${tenantId}'`);
```

## Query result caching

Hyperdrive caches SELECT query results globally at the CF edge. Cache key = normalized SQL + parameters.

```ts
// This result is cached for up to max-age seconds (default 60s)
const cachedResult = await sql`SELECT * FROM products WHERE active = true`;

// Cache is bypassed automatically for:
// - Transactions (BEGIN/COMMIT)
// - Mutations (INSERT/UPDATE/DELETE)
// - Queries with session-level state (SET, pg_advisory_lock, etc.)

// Force cache bypass for real-time data (use --caching-disabled config instead)
// Or use a separate Hyperdrive config without caching for that binding
```

## Multi-region pattern with Neon

```toml
# wrangler.toml
[[hyperdrive]]
binding = "NEON_PRIMARY"
id = "primary-config-id"

[[hyperdrive]]
binding = "NEON_REPLICA"
id = "replica-config-id"   # Neon read replica in same region as CF PoP
```

```ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const method = request.method;

    // Route reads to replica (lower latency, cached), writes to primary
    const connString = method === 'GET'
      ? env.NEON_REPLICA.connectionString
      : env.NEON_PRIMARY.connectionString;

    const sql = postgres(connString, { max: 3, fetch_types: false });
    // ... query
    await sql.end();
  },
};
```

## Drizzle ORM integration

```ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export function getDb(env: Env) {
  const client = postgres(env.HYPERDRIVE.connectionString, {
    max: 5,
    fetch_types: false,
  });
  return drizzle(client, { schema });
}

// Usage in handler:
const db = getDb(env);
const users = await db.select().from(schema.users).where(eq(schema.users.active, true));
```

## Supported databases

| Database | Connection string prefix | Notes |
|---|---|---|
| PostgreSQL (self-hosted) | `postgres://` | v12+ |
| Neon | `postgres://` | Serverless driver or standard; use standard for Hyperdrive |
| Supabase | `postgres://` | Use pooler connection string (port 6543) |
| CockroachDB | `postgres://` | Use `sslmode=require` |
| TimescaleDB | `postgres://` | Postgres-compatible |
| MySQL | `mysql://` | v8.0+ |
| PlanetScale | `mysql://` | MySQL-compatible |

## Gotchas

- **Create client per request, not per Worker** — Hyperdrive manages the underlying pool; creating a new `postgres()` client per request is intentional and cheap (no new TCP/TLS per call)
- **`fetch_types: false` required** — postgres.js's type fetching queries the `pg_type` catalog on connection; this breaks Workers' restricted runtime. Always set this flag
- **Transactions bypass caching** — any query inside `BEGIN/COMMIT` is never cached; route transaction-heavy workloads to the primary only
- **`await sql.end()` in finally** — skipping this leaks the connection back to Hyperdrive's pool in an unknown state; always end in a `finally` block
- **Local dev uses `localConnectionString`** — `wrangler dev` bypasses Hyperdrive entirely and connects directly to your local Postgres; CI should use a separate local DB
- **Max 25 Hyperdrive configs** per account on free tier

## Cross-links

- `[[cloudflare-lock-in-is-leverage]]` — when NOT to migrate off Postgres
- `[[cf-agents-do-pattern]]` — agents use D1 (via sql`` tag) for agent-local state; Hyperdrive for shared relational data
- `[[drizzle-orm-and-migrations]]` — Drizzle works identically with Hyperdrive as with D1
