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

Zod is the single source of truth at EVERY runtime boundary. Types are inferred via `z.infer` — never hand-maintained alongside a schema. If data crosses a boundary, a Zod schema guards it.

Complements `[[code-style]]` (TS strict + "Zod = source of truth") and `[[hono-api]]` (`@hono/zod-validator` on all bodies).

## The boundaries

- Env vars · Feature manifests · Feature flags
- API request bodies · API responses (where round-trip safety matters) · Route params · Query params
- Forms · Webhooks · Queue payloads · Durable Object messages
- AI outputs · Tool inputs · Tool outputs · Sandbox/build events · Eval cases + results
- Config files · Local/session storage reads · Third-party API responses

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

**Do:**

- `z.infer<typeof Schema>` for the type — one definition, zero drift
- Validate at the boundary, pass the typed object inward
- Colocate schema with the feature in `libs/features/<slug>/schemas.ts` per `[[feature-module-architecture]]`
- Parse env once at startup with a single `EnvSchema` — fail fast on missing/invalid config
- `safeParse` at I/O edges; `parse` only where a throw is the intended control flow

**Don't:**

- Write a manual `interface` mirroring a schema — it will drift
- Trust unvalidated `JSON.parse(...)` output
- `as any` / `as SomeType` past a boundary to skip validation
- Validate client-side only — server re-validates at its own boundary
- Scatter duplicate schemas — one schema per shape, imported everywhere

## Front-end + back-end parity (MANDATE — every processed input field)

Every input field a user fills that the system PROCESSES MUST be Zod-validated on BOTH sides from ONE shared schema:

- **One shared schema** in `src/shared/<feature>.ts` (or `libs/features/<slug>/schemas.ts`) — imported by client form AND server handler. Never two hand-kept copies.
- **Front end** — validate live (on change/blur) for instant feedback; gate submit on validity.
- **Back end** — re-validate the SAME schema at the boundary (`@hono/zod-validator` on every `POST`/`PATCH`, or `safeParse` at the edge). Client check is UX; server check is the contract.
- **Visible per-field affordance is the standard** — green check (valid) / red × (invalid) + `aria-invalid` on each processed field. Reference impl: pdf.megabyte.space Mail widget (`src/shared/postcard.ts` `isValidName` + `lobAddressSchema`).
- **Pure validity helpers** (`isValidName`, etc.) live beside the schema, are unit-tested, and drive both the live affordance and schema `.refine()`.

Retrofit discipline: when you touch ANY surface with a processed input lacking shared FE+BE Zod, fix it that turn per `[[drift-detection]]`; audit the rest of the app's forms as a tracked sweep.

## Type-safety baseline

- TS config enforces `"strict": true` + `"noUncheckedIndexedAccess": true` + `"exactOptionalPropertyTypes": true` per `[[code-style]]`
- Zod adds the RUNTIME guarantee TypeScript can't — strict types prove compile-time shape, Zod proves runtime shape
- `z.infer` is the bridge — schemas drive both at once
