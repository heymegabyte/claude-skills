---
name: "tool-design-as-api"
priority: 3
pack: "ai"
triggers:
  - "tool"
  - "mcp"
paths:
  - "*"
---

# Tool Design as API

Every tool the AI builds or wields — a script, a generator, an automation entrypoint, an MCP tool — is a real API. It MUST be narrow, typed, Zod-validated on BOTH input and output, documented, tested, safe-by-default, and hard-to-misuse. A loose `runAnything(cmd)` mega-tool is the failure mode this rule kills.

This rule fires on every "write a script / build a generator / add a tool / expose an automation" prompt. It complements ``hono-api`` (HTTP edge) and extends the same contract discipline inward to every callable surface.

## The contract

- **Zod input schema** — narrow, named fields; reject unknown keys (`.strict()`); no free-form `command` string.
- **Zod output schema** — typed result envelope `{ ok, data?, error?, correlationId }`; never return raw stdout.
- **Unit tests** — happy path + invalid input + failure path; mock external I/O per ``verification-loop`` § TDD.
- **Typed errors** — taxonomy code + user-safe message + retry hint; never throw raw strings.
- **Safe logging** — redact secrets (`val.slice(0,7)…val.slice(-3)`), carry `correlationId`, structured fields only.
- **Docs** — JSDoc `@remarks`/`@example`/`@throws` on the export + one-line entry in the tool registry/README.
- **Idempotency** — re-running with the same input is a no-op or returns the same result, where practical.

## Prefer task-specific tools

- `createFeatureModule(input)` — scaffolds `libs/features/<slug>/` per ``feature-module-architecture``
- `validateFeatureManifest(input)` — checks the 7 required fields, returns typed violations
- `runAffectedTests(input)` — `{ scope, baseRef }` → `{ passed, failed[], coverage }`
- `applyTypedPatch(input)` — `{ file, edits[] }` with pre-image assertions, never blind overwrite
- `createSandboxSession(input)` — `{ runtime, ttlMs }` → scoped, auto-expiring session handle
- `streamBuildEvents(input)` — `{ jobId }` → typed event stream (SSE/observable), not raw log tail
- `runFeatureEval(input)` — `{ slug, cases? }` → Zod-validated eval results per ``evals``

## Safe-by-default discipline

- Destructive ops require an explicit `confirm: true` field — never destructive on the default path.
- Every mutating tool accepts `dryRun: boolean` and defaults to the safest behavior.
- Scope every tool to the narrowest target (one feature, one file, one session) — no implicit "all".
- Validate input at the boundary, validate output before returning — both with the same Zod-everywhere rigor.

### Do

- Name tools after the TASK (`createFeatureModule`), not the mechanism (`runScript`)
- Ship the Zod input + output schema in the same file as the tool
- Return a typed envelope every time, success or failure
- Write the unit test BEFORE the tool body (TDD per ``verification-loop``)
- Document the tool in the registry the same turn you author it

### Don't

- Build unsafe mega-tools: `runAnything(command)`, `editWhatever(files)`, `deployNow()`, `sqlExec(query)`
- Accept a free-form string where a typed enum/union would do
- Return raw stdout, raw JSON, or untyped objects to the caller
- Let a tool silently swallow errors or log secret values
- Ship a tool without tests "because it's just a script" — scripts are APIs

## MCP tools

- An MCP tool is a public API surface — typed input schema, typed output, documented, safe-by-default.
- Prefer the official vendor MCP per ``full-autonomy`` § MCP spec before building a custom server.
- Custom MCP servers MUST validate every tool's params with Zod and return structured results, never prose blobs.
- Computer-use tools follow the access-tier + focus discipline in ``computer-use-safety`` — that IS their safe-by-default contract.
