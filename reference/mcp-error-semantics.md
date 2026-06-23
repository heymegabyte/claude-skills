# MCP Error Semantics — implementation reference

Sourced on demand by rules/mcp-error-semantics.md.

## Reference incident root-cause code (2026-06-18)

The bug was a missing `res.ok` gate before the success return path.

```typescript
// WRONG — isError omitted, 4xx body silently treated as success
const data = res.status === 204 ? {} : await res.json().catch(() => ({}));
return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
```

```typescript
// CORRECT — res.ok gate before success return
const data = res.status === 204 ? {} : await res.json().catch(() => ({}));
if (!res.ok) return { isError: true, content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
```

## Canonical handler pattern (full)

Every tool handler MUST follow this six-step shape. No exceptions.

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

## Worker-side helper usage

`template/utils/mcp-error-response.ts` exports typed helpers. Prefer these over inline
literals to keep error shapes consistent across all handlers.

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
