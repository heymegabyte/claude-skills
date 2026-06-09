---
name: "zod-everywhere"
priority: 2
pack: "backend"
triggers:
  - "zod"
  - "validation"
paths:
  - "*"
---

# Zod Everywhere

Zod is the single source of truth at EVERY runtime boundary. Types are inferred from schemas via `z.infer` — never hand-maintained alongside a schema where they can silently drift. If data crosses a boundary, a Zod schema guards it.

This rule fires on every boundary-touching change. It complements ``code-style`` (TS strict + "Zod = source of truth") and ``hono-api`` (`@hono/zod-validator` on all bodies).

## The boundaries

- Env vars
- Feature manifests
- Feature flags
- API request bodies
- API responses (where round-trip safety matters)
- Route params
- Query params
- Forms
- Webhooks
- Queue payloads
- Durable Object messages
- AI outputs
- Tool inputs
- Tool outputs
- Sandbox / build events
- Eval cases + results
- Config files
- Local / session storage reads
- Third-party API responses

## Infer, never duplicate

```ts
import { z } from 'zod';

export const CreateSiteSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{1,63}$/),
  orgId: z.string().uuid(),
  template: z.enum(['saas', 'nonprofit', 'local', 'portfolio']),
  primaryHostname: z.string().optional(),
});

export type CreateSiteInput = z.infer<typeof CreateSiteSchema>; // never hand-write this
```

### Do

- `z.infer<typeof Schema>` for the type — one definition, zero drift.
- Validate at the boundary, then pass the typed object inward.
- Colocate the schema with the feature in `libs/features/<slug>/schemas.ts` per ``feature-module-architecture``.
- Parse env once at startup with a single `EnvSchema` — fail fast on missing/invalid config.
- Use `safeParse` at I/O edges; `parse` only where a throw is the intended control flow.

### Don't

- Don't write a manual `interface` that mirrors a schema — it will drift the moment one side changes.
- Don't trust unvalidated `JSON.parse(...)` output — parse it through a schema first.
- Don't `as any` (or `as SomeType`) past a boundary to skip validation — that defeats the contract.
- Don't validate client-side only — the server re-validates at its own boundary.
- Don't scatter duplicate schemas; one schema per shape, imported everywhere it's needed.

## Type-safety baseline

- TS config already enforces `"strict": true` + `"noUncheckedIndexedAccess": true` + `"exactOptionalPropertyTypes": true` per ``code-style``.
- Zod adds the RUNTIME guarantee TypeScript can't: strict types prove compile-time shape, Zod proves runtime shape.
- `z.infer` is the bridge — schemas drive both at once.
