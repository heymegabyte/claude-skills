---
name: "cf-saas-template-stack"
priority: 2
pack: "architecture"
triggers:
  - "saas"
  - "starter"
  - "template"
  - "better auth"
  - "drizzle"
  - "tanstack start"
paths:
  - "**/auth.ts"
  - "**/drizzle.config.ts"
  - "**/alchemy.run.ts"
---

# CF SaaS Template Stack — Battle-tested Building Blocks

Distilled from 5 production CF SaaS starters (sagyzdop/mvp-app, darkhorse-03/Zynth, zett-8/hono-react-router, yusukebe/honox-starter, AmanVarshney01/create-better-t-stack). These are the exact patterns to clone-and-adapt into `megabytespace/saas-starter` for the `/saas` slash command.

## Better Auth on D1 — TanStack Start wiring

`tanstackStartCookies()` is non-obvious and required for SSR cookie handling. Without it, sessions don't survive page reloads.

```ts
// src/lib/auth/auth.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { tanstackStartCookies } from 'better-auth/cookies'; // CRITICAL for TanStack Start SSR
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';

export const createAuth = (env: Env) => betterAuth({
  database: drizzleAdapter(drizzle(env.DB), {
    provider: 'sqlite',
    schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification },
  }),
  plugins: [tanstackStartCookies()],
  socialProviders: {
    google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
    github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET },
  },
  emailAndPassword: { enabled: true },
});
```

Source: `sagyzdop/mvp-app:src/lib/auth/auth.ts`. Lands in: `megabytespace/saas-starter/src/lib/auth.ts`.

## Drizzle config — D1-HTTP for remote migrations

```ts
// drizzle.config.ts — `driver: 'd1-http'` enables remote migration without local wrangler dev
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID!,
    token: process.env.CLOUDFLARE_API_TOKEN!,
  },
});
```

Source: `sagyzdop/mvp-app`. Required for CI-driven migration workflows.

## Hono RPC — fully typed client via dummy-URL trick

```ts
// src/hc.ts — workspace ref carries types, dummy URL never used
import { hc } from 'hono/client';
import type { AppType } from './worker'; // your Hono app type

const client = hc<AppType>(''); // dummy URL — types only
export type Client = typeof client;

export const hcWithType = (...args: Parameters<typeof hc>): Client =>
  hc<AppType>(...args);
```

Then in React Query:

```ts
const c = hcWithType(window.location.origin);
const { data } = useQuery({
  queryKey: ['orders'],
  queryFn: async () => (await c.api.orders.$get()).json(),
});
```

Zero codegen. Types flow from Hono routes → client → React Query. Source: `darkhorse-03/Zynth:src/hc.ts`.

## drizzle-zod — Zod schemas from Drizzle tables

```ts
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { orders } from './schema';

// Form schema: omit auto-generated fields with `{ id: z.undefined() }` trick
export const insertOrderSchema = createInsertSchema(orders, {
  id: z.undefined(), // auto-incremented in D1
  createdAt: z.undefined(), // defaultNow()
});

export const selectOrderSchema = createSelectSchema(orders);

// Use in Hono route + react-hook-form — same schema, zero duplication
```

Source: `yusukebe/cloudflare-d1-drizzle-honox-starter`. Eliminates Zod boilerplate for every CRUD form.

## D1 per-request in Hono middleware

```ts
// Cleanest pattern from 5 repos:
import { createMiddleware } from 'hono/factory';
import { drizzle } from 'drizzle-orm/d1';

export const dbMiddleware = createMiddleware<{ Bindings: Env; Variables: { db: ReturnType<typeof drizzle> } }>(
  async (c, next) => {
    c.set('db', drizzle(c.env.DB));
    await next();
  }
);

app.use('*', dbMiddleware);

// In routes:
app.get('/orders', async (c) => {
  const db = c.get('db');
  const orders = await db.select().from(ordersTable);
  return c.json(orders);
});
```

Source: `yusukebe/cloudflare-d1-drizzle-honox-starter:app/routes/_middleware.ts`.

## React Router v7 framework mode on Workers

```ts
// worker.ts — 3-line bridge from Workers to React Router 7 framework build
import { createRequestHandler } from 'react-router';
import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>();

app.use('*', async (c) => {
  const handler = createRequestHandler(
    // @ts-expect-error virtual module
    () => import('virtual:react-router/server-build'),
    'production'
  );
  return await handler(c.req.raw, { cloudflare: { env: c.env, ctx: c.executionCtx } });
});

export default app;
```

Source: `zett-8/hono-react-router:worker.ts`. SSR React Router 7 framework mode on Workers without Next.js.

## Alchemy IaC — replaces wrangler.toml at scale

```ts
// alchemy.run.ts — programmatic CF resource provisioning, idempotent via `adopt: true`
import alchemy from 'alchemy';
import { Worker, D1Database, R2Bucket, Vectorize } from 'alchemy/cloudflare';

const app = alchemy('my-saas');

const db = await D1Database('db', { adopt: true });
const bucket = await R2Bucket('uploads', { adopt: true });
const index = await Vectorize('semantic', { adopt: true, dimensions: 768, metric: 'cosine' });

await Worker('api', {
  adopt: true,
  entrypoint: './src/worker.ts',
  bindings: { DB: db, BUCKET: bucket, INDEX: index },
});

await app.finalize();
```

Run `bun run deploy` once → all resources provisioned + Worker deployed. `adopt: true` makes it idempotent — safe to re-run.

Source: `darkhorse-03/Zynth:alchemy.run.ts`. Alternative to wrangler.jsonc when multi-resource provisioning gets complex.

## Dual-mode CLI binary — same bin dispatches CLI or MCP stdio

```ts
// apps/cli/src/cli.ts
if (process.argv[2] === 'mcp') {
  await startMcpServer(); // stdio MCP server
} else {
  await runCli(); // interactive scaffolder
}
```

Source: `AmanVarshney01/create-better-t-stack:apps/cli/src/cli.ts`. Pattern for shipping a tool that's both a CLI and an MCP server from one binary.

## See also

- `[[cloudflare-lock-in-is-leverage]]` — these are all CF primitives
- `[[zod-everywhere]]` — `drizzle-zod` is the seam
- `cf-agents-do-pattern` (this dir) — stateful agents on top
- `cf-rag-vectorize-pattern` (this dir) — RAG on top
- `cf-workflows-pattern` (this dir) — durable execution on top
- `[[code-style]]` — TypeScript + Hono + Drizzle conventions
- `commands/saas.md` — the `/saas` slash command that ties this all together
