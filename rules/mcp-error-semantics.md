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
**Bug:** Every tool handler returned `{ isError: false, content: [{ text: <error JSON> }] }` for HTTP 4xx/5xx responses. Only network-level exceptions (caught in the outer `catch`) set `isError: true`.
**Impact:** Claude could not distinguish a successful email send from a 422 "invalid recipient" error — it treated error bodies as successful results and continued the conversation with incorrect state.
**Root cause:** The success-path return was written before `res.ok` was checked:

```typescript
// WRONG — isError omitted, 4xx body silently treated as success
const data = res.status === 204 ? {} : await res.json().catch(() => ({}));
return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
```

**Fix (applied to 83 handlers × 2 files = 166 call sites):**

```typescript
// CORRECT — res.ok gate before success return
const data = res.status === 204 ? {} : await res.json().catch(() => ({}));
if (!res.ok) return { isError: true, content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
```

## Canonical handler pattern

Every tool handler MUST follow this shape. No exceptions.

```typescript
if (request.params.name === "my-tool") {
  // 1. Validate inputs — set isError: true on failure, never throw
  const parsed = MyInputSchema.safeParse(request.params.arguments ?? {});
  if (!parsed.success) {
    return { isError: true, content: [{ type: 'text', text: JSON.stringify({
      code: 'VALIDATION_ERROR', message: parsed.error.message
    }) }] };
  }
  const input = parsed.data;

  // 2. Guard on input size (hardened servers)
  if (JSON.stringify(input).length > 65_536) {
    return { isError: true, content: [{ type: 'text', text: JSON.stringify({
      code: 'SIZE_LIMIT_EXCEEDED', message: 'Input exceeds 64KB limit.'
    }) }] };
  }

  // 3. Execute — wrap fetch in try/catch
  try {
    const res = await fetch(url, { method, headers, body });
    const data = res.status === 204 ? {} : await res.json().catch(() => ({}));

    // 4. Gate on HTTP status — isError: true for any non-2xx
    if (!res.ok) {
      return { isError: true, content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }

    // 5. Success — omit isError (defaults false) or set explicitly
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };

  } catch (err) {
    // 6. Network / parse errors
    return { isError: true, content: [{ type: 'text', text: JSON.stringify({
      code: 'FETCH_ERROR', message: String(err)
    }) }] };
  }
}
```

## Worker-side helper

`template/utils/mcp-error-response.ts` exports typed helpers for every case
above. Prefer these over inline literals to keep error shapes consistent.

```typescript
import { mcpOk, mcpHttpError, mcpCaughtError, mcpFetch } from '@/utils';

// Idiomatic one-liner using mcpFetch
return mcpFetch(() => fetch(url, { method: 'GET', headers }));

// Or step-by-step for custom logic
const res = await fetch(url, opts);
const data = res.status === 204 ? {} : await res.json().catch(() => ({}));
if (!res.ok) return mcpHttpError(res.status, data);
return mcpOk(data);
```

Exports: `mcpOk` · `mcpHttpError` · `mcpCaughtError` · `mcpValidationError` ·
`mcpSizeLimitError` · `mcpFetch` + types `McpToolResult` · `McpContentBlock` ·
`McpErrorPayload`.

## forge-mcp-from-openapi compliance

The `forge-mcp-from-openapi` generator MUST emit the canonical pattern above
for every generated handler. Verify with:

```bash
node bin/validate-mcp-tools.mjs <server-name>
```

A server that passes the validator with 0 violations is compliant. The
validator checks:

- `[missing-zod-schema]` — exported InputSchema absent
- `[orphaned-handler]` — handler case with no ListTools entry
- `[unhandled-tool]` — ListTools entry with no handler case

Note: `isError` semantic correctness is NOT currently detected by the
validator (it is a runtime behaviour check). Manual review or eval coverage is
required.

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
