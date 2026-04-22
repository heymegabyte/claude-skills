---
name: "OpenAPI Generation"
description: "Auto-generate OpenAPI specs from Hono routes using @hono/zod-openapi. Define routes with createRoute() + Zod schemas, serve Swagger UI via middleware, generate client SDKs with openapi-typescript-codegen. Versioned /api/v1/ prefix with spec at /doc endpoint."
---

# OpenAPI Generation

## Route Definition (createRoute)
```typescript
// src/routes/users.ts
import { createRoute, z, OpenAPIHono } from '@hono/zod-openapi';

const userSchema = z.object({
  id: z.string().ulid(),
  email: z.string().email(),
  name: z.string().min(1).max(255),
  role: z.enum(['admin', 'member', 'viewer']),
  createdAt: z.string().datetime(),
}).openapi('User');

const errorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
}).openapi('Error');

const listUsersRoute = createRoute({
  method: 'get',
  path: '/api/v1/users',
  tags: ['Users'],
  summary: 'List all users',
  request: {
    query: z.object({
      limit: z.coerce.number().int().min(1).max(100).default(20),
      cursor: z.string().optional(),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ users: z.array(userSchema), nextCursor: z.string().nullable() }) } },
      description: 'Paginated user list',
    },
    401: { content: { 'application/json': { schema: errorSchema } }, description: 'Unauthorized' },
  },
});

const createUserRoute = createRoute({
  method: 'post',
  path: '/api/v1/users',
  tags: ['Users'],
  summary: 'Create a user',
  request: {
    body: { content: { 'application/json': { schema: z.object({ email: z.string().email(), name: z.string().min(1), role: z.enum(['admin', 'member', 'viewer']).default('member') }) } } },
  },
  responses: {
    201: { content: { 'application/json': { schema: userSchema } }, description: 'Created' },
    400: { content: { 'application/json': { schema: errorSchema } }, description: 'Validation error' },
    409: { content: { 'application/json': { schema: errorSchema } }, description: 'Email exists' },
  },
});
```

## App Setup with OpenAPI + Swagger UI
```typescript
// src/index.ts
import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';

const app = new OpenAPIHono<{ Bindings: Env }>();

// Register routes (handlers use c.req.valid for type-safe params)
app.openapi(listUsersRoute, async (c) => {
  const { limit, cursor } = c.req.valid('query');
  const users = await db.select().from(usersTable).limit(limit);
  return c.json({ users, nextCursor: null }, 200);
});

app.openapi(createUserRoute, async (c) => {
  const body = c.req.valid('json');
  const user = await db.insert(usersTable).values({ id: ulid(), ...body, createdAt: new Date().toISOString() }).returning();
  return c.json(user[0], 201);
});

// OpenAPI JSON spec endpoint
app.doc('/api/v1/doc', {
  openapi: '3.1.0',
  info: { title: 'My API', version: '1.0.0', description: 'Auto-generated from Hono + Zod schemas' },
  servers: [{ url: 'https://api.example.com' }],
});

// Swagger UI
app.get('/api/v1/ui', swaggerUI({ url: '/api/v1/doc' }));

export default app;
```

## Client SDK Generation
```bash
# Generate TypeScript client from live OpenAPI spec
npx openapi-typescript-codegen --input https://api.example.com/api/v1/doc --output src/client --client fetch

# Or from local spec file (build-time)
npx openapi-typescript-codegen --input openapi.json --output src/client --client fetch --name ApiClient
```

Generated client provides typed methods: `ApiClient.users.listUsers({ limit: 20 })`, `ApiClient.users.createUser({ email, name })`. RPC via `hc<AppType>` still preferred for same-repo consumers; generated SDK for external/third-party consumers.

## Versioning Strategy
```typescript
// Version prefix on all route groups
const v1 = new OpenAPIHono<{ Bindings: Env }>();
v1.openapi(listUsersRoute, handler);
v1.openapi(createUserRoute, handler);

const app = new OpenAPIHono<{ Bindings: Env }>();
app.route('/api/v1', v1);
// Future: app.route('/api/v2', v2);

// Each version gets its own doc endpoint
v1.doc('/doc', { openapi: '3.1.0', info: { title: 'My API', version: '1.0.0' } });
```

## Security Definitions
```typescript
app.doc('/api/v1/doc', {
  openapi: '3.1.0',
  info: { title: 'My API', version: '1.0.0' },
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Clerk session token' },
    },
  },
});

// Per-route security override (public endpoint)
const publicRoute = createRoute({
  method: 'get',
  path: '/api/v1/health',
  security: [], // No auth required
  responses: { 200: { content: { 'application/json': { schema: z.object({ status: z.literal('ok'), version: z.string(), timestamp: z.string() }) } }, description: 'Health check' } },
});
```

## Dependencies
```bash
pnpm add @hono/zod-openapi @hono/swagger-ui
pnpm add -D openapi-typescript-codegen
```

Pattern: Zod schemas are single source of truth → createRoute defines request/response contracts → OpenAPI spec auto-generated → Swagger UI for manual testing → SDK codegen for external consumers. Never manually write OpenAPI YAML.
