---
name: "agpl-isolation-via-http-boundary"
last_reviewed: 2026-06-29
superseded_by: null
pack: "compliance"
---

# AGPL Isolation via HTTP Boundary

When integrating an AGPL (or any strong-copyleft) service into a non-open codebase, isolate it behind a network boundary so copyleft never propagates to your application. The HTTP boundary is the license firewall.

## The rules

- Run the AGPL service as its **own process/container** — never inside your main app process.
- Communicate over **HTTP/RPC ONLY**. No `import`, no shared libraries.
- **No shared types** — types are code; copying them is importing the library. Re-declare all request/response shapes locally.
- **No shared DB tables or ORM schemas** — schema sharing is implicit coupling.
- **No AGPL packages in `package.json`**, including `devDependencies`.
- **Reading the source to learn patterns is safe** — copyleft triggers on INCLUSION of the code (modified or not) in your distributed work, not on reading it.
- Keep the integration surface **minimal** — fewer call sites = a cleaner firewall.

## Pattern

- Vendor service runs as a container on its own subdomain (e.g. `social.projectsites.dev`).
- A thin client (`src/services/<vendor>.ts`) calls it via `fetch` with a bearer token; every request/response shape is declared locally, not imported.
- Worker env carries only HTTP coordinates (`{VENDOR}_URL`, `{VENDOR}_API_KEY`, `{VENDOR}_SECRET`), never the vendor's SDK.

## Reference incident

projectsites.dev Postiz (AGPL social scheduler) at `social.projectsites.dev` — HTTP-only client (`src/services/postiz.ts`), no `@gitroom/*` packages, no shared types/schema. Patterns studied from source; zero code included. See `docs/SERVICES-AND-SOCIAL.md` § Postiz.

## See

- `vendor-risk-tiering` — load-bearing vs replaceable classification
- `package-preference-registry` — OSS license gate at install time
