# MCP Error Semantics

MCP tool results carry an `isError` boolean. Getting it wrong causes Claude to
act on bad data — the single most common correctness failure in MCP servers.
This rule is the authoritative doctrine for every tool handler in this repo.

## The contract

- `isError: true` — The tool call **failed**. Claude surfaces the error to the
  user and does not proceed with the result data.
- `isError: false` (or field omitted) — The tool call **succeeded**. Claude
  uses the content body as ground truth for the next step.

There are only two legitimate `isError: false` cases:

1. The API returned a 2xx response (including 204 No Content).
2. A local operation completed without throwing (e.g. a read from KV, a Zod
   parse that passed).

An **empty result** (empty list, null body, zero rows) is still `isError: false`
— the operation worked, it just found nothing.

## When to set isError: true

| Situation | Code | Notes |
|---|---|---|
| HTTP 4xx (bad request, auth, not found) | `HTTP_ERROR` | Set status in payload |
| HTTP 5xx (upstream server fault) | `HTTP_ERROR` | Set status in payload |
| Network / DNS / timeout | `FETCH_ERROR` | Caught in try/catch |
| Zod / input validation failure | `VALIDATION_ERROR` | Before fetch |
| Input or response exceeds size limit | `SIZE_LIMIT_EXCEEDED` | Guard before parse |
| Any other thrown exception | `FETCH_ERROR` | Catch-all |

## Reference incident — 2026-06-18

**Server:** `resend-mcp` (and `resend-hardened-mcp`)
**Bug:** Every tool handler returned `{ isError: false, ... }` for HTTP 4xx/5xx responses.
Only network-level exceptions (caught in the outer `catch`) set `isError: true`.
**Impact:** Claude could not distinguish a successful email send from a 422 "invalid
recipient" error — it treated error bodies as successful results.
**Root cause:** Success-path return written before `res.ok` was checked (83 handlers × 2 files).

See `reference/mcp-error-semantics.md` for the wrong/correct code diff and the full
canonical handler pattern.

## Canonical handler: required steps

Every tool handler MUST implement these six steps. No exceptions:

- Validate inputs with Zod `safeParse`; return `isError: true` with `VALIDATION_ERROR` on failure — never throw.
- Guard input size: if `JSON.stringify(input).length > 65_536` return `isError: true` with `SIZE_LIMIT_EXCEEDED`.
- Wrap `fetch` in `try/catch`; the `catch` block MUST return `isError: true` with `FETCH_ERROR`.
- Gate on `res.ok` BEFORE using the response body — `if (!res.ok) return { isError: true, ... }`.
- Return success without `isError` (defaults false) only when `res.ok === true`.
- Handle 204 No Content: `const data = res.status === 204 ? {} : await res.json().catch(() => ({}))`.

See `reference/mcp-error-semantics.md` for the full annotated handler implementation.

## Worker-side helper

- Use `mcpOk`, `mcpHttpError`, `mcpCaughtError`, `mcpFetch` from `template/utils/mcp-error-response.ts`.
- `mcpFetch(() => fetch(url, opts))` is the idiomatic one-liner that handles all six steps automatically.

See `reference/mcp-error-semantics.md` for import example and step-by-step alternative.

## forge-mcp-from-openapi compliance

- The forge generator MUST emit the canonical pattern for every generated handler.
- Verify with `node bin/validate-mcp-tools.mjs <server-name>` (0 violations = compliant).
- Validator checks: `[missing-zod-schema]` · `[orphaned-handler]` · `[unhandled-tool]`.
- `isError` semantic correctness is NOT detected by the validator — require manual review or eval coverage.

## Drift checklist (per-server, run at forge time)

- [ ] Every `fetch()` call is inside `try/catch`
- [ ] Every `catch` block returns `{ isError: true, ... }`
- [ ] Every non-204 `res.json()` result is gated behind `if (!res.ok)` before
      the success return
- [ ] `isError` is never set to `true` when `res.ok === true`
- [ ] Empty lists / null bodies are returned with `isError: false`

## Cross-links

- [[mcp-server-hardening]] — size guards, timeout, CORS, rate-limiting
- [[error-recovery]] — how to respond when MCP tools return isError: true
- [[verification-loop]] — post-deploy E2E that catches silent failures
- [[principles-incident-log]] — archive of production incidents
- [[tool-design-as-api]] — narrow, typed, idempotent tool design
