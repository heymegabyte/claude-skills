/**
 * mcp-error-response.ts — MCP tool response helpers with correct isError semantics.
 *
 * The MCP spec distinguishes two kinds of failure:
 *   - Protocol error   → throw, let the SDK surface it
 *   - Tool-level error → return { isError: true, content: [...] }
 *
 * A common mistake is returning { isError: false } (or omitting isError entirely)
 * when the upstream API returns 4xx/5xx. Claude sees `isError: false` and
 * assumes the call succeeded, so it proceeds on bad data. This module enforces
 * the correct contract at every call site.
 *
 * Reference incident: resend-mcp returned isError: false for HTTP 4xx/5xx
 * responses, surfacing the error body inside content[0].text JSON.
 * Fixed 2026-06-18 per rules/mcp-error-semantics.md.
 *
 * @module mcp-error-response
 *
 * @example — HTTP response check
 *   const res = await fetch(url, opts);
 *   const data = res.status === 204 ? {} : await res.json().catch(() => ({}));
 *   if (!res.ok) return mcpHttpError(res.status, data);
 *   return mcpOk(data);
 *
 * @example — Validation / caught error
 *   try {
 *     const result = await riskyOperation();
 *     return mcpOk(result);
 *   } catch (err) {
 *     return mcpCaughtError(err);
 *   }
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single MCP content block. */
export interface McpContentBlock {
  type: "text";
  text: string;
}

/** A well-formed MCP tool result. */
export interface McpToolResult {
  isError: boolean;
  content: McpContentBlock[];
}

/** Structured error payload written into content[0].text on failure. */
export interface McpErrorPayload {
  code: string;
  status?: number;
  message: string;
}

// ---------------------------------------------------------------------------
// Success helper
// ---------------------------------------------------------------------------

/**
 * Return a successful MCP tool result.
 *
 * Use when the upstream call completed with a 2xx (or a successful local
 * operation). An empty list / null result is still a SUCCESS — the operation
 * worked, it just found nothing.
 *
 * @param data — Any serialisable value to return to Claude.
 */
export function mcpOk(data: unknown): McpToolResult {
  return {
    isError: false,
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------

/**
 * Return an error MCP tool result for a non-2xx HTTP response.
 *
 * Always call this when `response.ok === false`. Claude will see isError: true
 * and know to surface the problem rather than act on the error body.
 *
 * @param status  — HTTP status code (e.g. 404, 422, 500).
 * @param body    — The parsed response body (may contain API error detail).
 */
export function mcpHttpError(status: number, body: unknown): McpToolResult {
  const payload: McpErrorPayload = {
    code: "HTTP_ERROR",
    status,
    message: extractMessage(body) ?? `HTTP ${status}`,
  };
  return {
    isError: true,
    content: [{ type: "text", text: JSON.stringify(payload) }],
  };
}

/**
 * Return an error MCP tool result for a caught exception.
 *
 * Use in `catch (err)` blocks for network failures, parse errors, or any
 * other thrown value. Sets code to FETCH_ERROR by default.
 *
 * @param err   — The caught value.
 * @param code  — Optional error code override (default: "FETCH_ERROR").
 */
export function mcpCaughtError(
  err: unknown,
  code: string = "FETCH_ERROR",
): McpToolResult {
  const payload: McpErrorPayload = {
    code,
    message: err instanceof Error ? err.message : String(err),
  };
  return {
    isError: true,
    content: [{ type: "text", text: JSON.stringify(payload) }],
  };
}

/**
 * Return an error MCP tool result for a Zod / input validation failure.
 *
 * @param message — Human-readable description of what was invalid.
 */
export function mcpValidationError(message: string): McpToolResult {
  const payload: McpErrorPayload = { code: "VALIDATION_ERROR", message };
  return {
    isError: true,
    content: [{ type: "text", text: JSON.stringify(payload) }],
  };
}

/**
 * Return an error MCP tool result for a known size-limit breach.
 *
 * @param what    — What exceeded the limit (e.g. "Input", "Response").
 * @param limit   — The limit that was exceeded (e.g. "64KB", "1MB").
 */
export function mcpSizeLimitError(what: string, limit: string): McpToolResult {
  const payload: McpErrorPayload = {
    code: "SIZE_LIMIT_EXCEEDED",
    message: `${what} exceeds ${limit} limit.`,
  };
  return {
    isError: true,
    content: [{ type: "text", text: JSON.stringify(payload) }],
  };
}

// ---------------------------------------------------------------------------
// Canonical handler pattern
// ---------------------------------------------------------------------------

/**
 * Wrap a fetch call with the canonical MCP error-semantics pattern.
 *
 * This is the reference implementation of the pattern described in
 * rules/mcp-error-semantics.md. Use it when authoring new tool handlers
 * or refactoring existing ones.
 *
 * @example
 *   return mcpFetch(() => fetch(url, { method: "GET", headers }));
 */
export async function mcpFetch(
  fetcher: () => Promise<Response>,
): Promise<McpToolResult> {
  try {
    const res = await fetcher();
    const data =
      res.status === 204 ? {} : await res.json().catch(() => ({}));
    if (!res.ok) return mcpHttpError(res.status, data);
    return mcpOk(data);
  } catch (err) {
    return mcpCaughtError(err);
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Best-effort extraction of a human-readable message from an API error body.
 * Returns undefined when no recognisable message field is found.
 */
function extractMessage(body: unknown): string | undefined {
  if (body == null || typeof body !== "object") return undefined;
  const b = body as Record<string, unknown>;
  // Common API error shapes: { message }, { error }, { error: { message } }, { detail }
  if (typeof b["message"] === "string") return b["message"];
  if (typeof b["error"] === "string") return b["error"];
  if (
    typeof b["error"] === "object" &&
    b["error"] !== null &&
    typeof (b["error"] as Record<string, unknown>)["message"] === "string"
  ) {
    return (b["error"] as Record<string, unknown>)["message"] as string;
  }
  if (typeof b["detail"] === "string") return b["detail"];
  return undefined;
}
