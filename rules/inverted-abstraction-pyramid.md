---
last_reviewed: 2026-06-29
superseded_by: null
name: "inverted-abstraction-pyramid"
priority: 2
pack: "backend"
triggers:
  - "abstraction"
  - "middleware"
  - "generic"
  - "reusable"
  - "shared util"
  - "base class"
  - "generic handler"
paths:
  - "*"
---

# Inverted Abstraction Pyramid

- Shared infrastructure layer: thin (≤200 lines per file).
- Feature module layer: as deep as the domain requires.
- Wide base at the bottom (feature specifics), narrow tip at the top (shared infrastructure).
- "Generic" is earned: write the specific thing twice, then extract. One use case does not justify an abstraction.

## Rules

- `worker/middleware/` stays thin: auth check, CORS headers, error handler, request ID, rate limiter. Each file ≤200 lines. No business logic.
- `worker/features/<name>/` can be as deep as the domain requires: Zod schemas, service class, multiple handlers, query builders, domain types, constants, README.
- When a generic utility grows past ~100 lines, audit for absorbed domain knowledge — extract it back to the feature.

## Correct patterns

- Thin middleware: one concern per file, no DB calls, no email side-effects, no plan checks. Auth file ~60 lines, error handler ~30 lines.
- Deep feature module: schema + service (300 lines is fine) + handler colocated in `worker/features/<name>/`.

See `reference/inverted-abstraction-pyramid.md` for the full implementation.

## Anti-patterns

- Middleware that checks billing plans, seat counts, or sends email as a side effect.
- A "generic" webhook handler abstraction created for a single payment rail — write two concrete files first.

See `reference/inverted-abstraction-pyramid.md` for full anti-pattern code.

## Size guidelines

- **`worker/middleware/*.ts`** — 30–80 lines expected, 200 lines ceiling.
- **`worker/middleware/`** (total) — 150–300 lines expected, 500 lines ceiling.
- **`worker/features/<name>/schemas.ts`** — 50–200 lines, no ceiling.
- **`worker/features/<name>/service.ts`** — 100–500 lines, no ceiling.
- **`worker/features/<name>/handlers.ts`** — 80–300 lines; split by resource at 400.
- **`worker/lib/*.ts`** — 30–100 lines expected, 150 lines ceiling; absorb domain back into feature past ceiling.

## Checklist

- `worker/middleware/` contains only: auth, CORS, error handler, request ID, rate limiter, logger. Anything else → move to a feature.
- Every file in `worker/middleware/` stays under 200 lines.
- Feature service classes can be as long as the domain requires.
- Before extracting a shared utility: does it exist in TWO or more features with REAL duplication? If not, leave it in the feature.
- When a shared utility grows past ~100 lines: audit for absorbed domain knowledge; return it to the feature.
- A generic abstraction requiring 20 lines of config per use is worse than two 50-line concrete implementations.

## See

- [[feature-module-architecture]] — canonical feature folder shape at the wide base
- [[hono-api]] — middleware order, `createFactory()`, and route group patterns
- [[zod-everywhere]] — where feature-level depth and sharing genuinely coexist
- [[code-style]] — file size conventions, module boundaries
