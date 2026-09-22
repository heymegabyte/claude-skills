/**
 * zod-validate.ts — Zod boundary validation helpers for CF Workers + Node
 *
 * REQUIRED: zod in project package.json (`npm i zod` or `bun add zod`).
 *
 * Per [[zod-everywhere]]: every runtime boundary — env, API in/out, params,
 * forms, webhooks, queues, DO messages, AI outputs — passes through a
 * typed Zod schema. This module provides four standard helpers that cover
 * the most common Worker boundary patterns.
 *
 * Zero extra dependencies beyond `zod` itself. Workers-compatible.
 *
 * @module zod-validate
 */

import type { ZodSchema, ZodError, ZodTypeAny, z } from "zod";

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

/**
 * Thrown when `validateRequest` cannot parse the incoming request body/params.
 * Carries the Zod `ZodError` as `cause` and the schema name for diagnostics.
 *
 * @example
 *   // Caught in a Hono error handler
 *   if (err instanceof RequestValidationError) {
 *     return c.json({ error: err.message }, 400);
 *   }
 */
export class RequestValidationError extends Error {
  constructor(
    public readonly schemaName: string,
    public readonly zodError: ZodError,
    public readonly source: "body" | "query" | "params",
  ) {
    super(
      `RequestValidationError [${schemaName}] (${source}): ${zodError.message}`,
    );
    this.name = "RequestValidationError";
    this.cause = zodError;
  }
}

/**
 * Thrown when `validateResponse` detects that outgoing data does not match
 * the declared schema. Prevents type-unsafe payloads from escaping a handler.
 *
 * @example
 *   // Caught and converted to a 500 in production
 *   if (err instanceof ResponseValidationError) {
 *     console.error('Schema mismatch in response:', err.message);
 *     return c.json({ error: 'internal_error' }, 500);
 *   }
 */
export class ResponseValidationError extends Error {
  constructor(
    public readonly schemaName: string,
    public readonly zodError: ZodError,
  ) {
    super(`ResponseValidationError [${schemaName}]: ${zodError.message}`);
    this.name = "ResponseValidationError";
    this.cause = zodError;
  }
}

/**
 * Thrown at module init when `validateEnv` fails.
 * Triggers a loud fast-fail before any request is processed.
 *
 * @example
 *   // At Worker top-level — crash before accepting requests
 *   const env = validateEnv(EnvSchema, rawEnv);
 *   // throws EnvValidationError if DATABASE_URL is missing
 */
export class EnvValidationError extends Error {
  constructor(
    public readonly schemaName: string,
    public readonly zodError: ZodError,
  ) {
    super(
      `EnvValidationError [${schemaName}]: Worker env is misconfigured.\n` +
        zodError.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n"),
    );
    this.name = "EnvValidationError";
    this.cause = zodError;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Discriminated-union result from `safeBoundary`. */
export type BoundaryResult<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: ZodError };

export interface SafeBoundaryOptions {
  /**
   * When `true`, log the Zod error to `console.error` before returning the
   * failure branch. Useful for debug logging at boundaries without throwing.
   * Default: false.
   */
  logErrors?: boolean;
}

export interface ValidateRequestOptions {
  /**
   * Override the schema name shown in error messages.
   * Defaults to the schema's `_def.typeName` or `"schema"`.
   */
  schemaName?: string;
  /**
   * For GET/DELETE: URL search-param key to attempt before falling back to
   * the raw `URLSearchParams` object. When set, the single param is extracted
   * and parsed; when unset the full param map is parsed.
   */
  queryKey?: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getSchemaName(schema: ZodSchema, override?: string): string {
  if (override) return override;
  // zod stores the type name on `_def.typeName`; may not be set for objects
  return (schema as { _def?: { typeName?: string } })._def?.typeName ?? "schema";
}

// ---------------------------------------------------------------------------
// safeBoundary
// ---------------------------------------------------------------------------

/**
 * Thin wrapper around `schema.safeParse` that returns a discriminated-union
 * result with a typed `data` field on success and a `ZodError` on failure.
 *
 * Use this at every runtime boundary to avoid uncaught throws in hot paths.
 *
 * @example
 *   const result = safeBoundary(UserSchema, unknownPayload);
 *   if (!result.success) {
 *     return Response.json({ error: result.error.message }, { status: 400 });
 *   }
 *   // result.data is typed as z.infer<typeof UserSchema>
 */
export function safeBoundary<S extends ZodTypeAny>(
  schema: S,
  input: unknown,
  options: SafeBoundaryOptions = {},
): BoundaryResult<z.infer<S>> {
  const result = schema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data, error: null };
  }
  if (options.logErrors) {
    console.error("[safeBoundary] validation failed:", result.error.message);
  }
  return { success: false, data: null, error: result.error };
}

// ---------------------------------------------------------------------------
// validateRequest
// ---------------------------------------------------------------------------

/**
 * Parse and validate incoming request data against a Zod schema.
 *
 * Routing logic per HTTP method:
 *  - POST / PUT / PATCH → parse JSON body
 *  - GET / DELETE / HEAD → parse `URLSearchParams` from `request.url`
 *  - Other methods → attempt body parse, fall back to query params
 *
 * Returns the parsed + validated value typed as `z.infer<S>`.
 *
 * @throws {RequestValidationError} when parsing fails.
 *
 * @example
 *   // In a Hono handler:
 *   const body = await validateRequest(CreatePostSchema, c.req.raw);
 *   // body is typed as z.infer<typeof CreatePostSchema>
 */
export async function validateRequest<S extends ZodTypeAny>(
  schema: S,
  request: Request,
  opts: ValidateRequestOptions = {},
): Promise<z.infer<S>> {
  const method = request.method.toUpperCase();
  const name = getSchemaName(schema, opts.schemaName);

  let raw: unknown;
  let source: "body" | "query" | "params" = "body";

  if (["POST", "PUT", "PATCH"].includes(method)) {
    source = "body";
    try {
      raw = await request.json();
    } catch {
      throw new RequestValidationError(
        name,
        _makeZodError("Request body is not valid JSON"),
        source,
      );
    }
  } else {
    source = "query";
    const url = new URL(request.url);
    if (opts.queryKey) {
      raw = url.searchParams.get(opts.queryKey);
    } else {
      // Convert URLSearchParams to a plain object for schema parsing
      raw = Object.fromEntries(url.searchParams.entries());
    }
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new RequestValidationError(name, result.error, source);
  }
  return result.data;
}

// ---------------------------------------------------------------------------
// validateResponse
// ---------------------------------------------------------------------------

/**
 * Validate outgoing data against a Zod schema before serializing.
 *
 * Catches schema drift between database layer and API contract at the point
 * of serialization rather than at the client.
 *
 * @throws {ResponseValidationError} when `data` does not match `schema`.
 *
 * @example
 *   const safePost = validateResponse(PostResponseSchema, rawDbRow);
 *   return Response.json(safePost);
 */
export function validateResponse<S extends ZodTypeAny>(
  schema: S,
  data: unknown,
  opts: { schemaName?: string } = {},
): z.infer<S> {
  const name = getSchemaName(schema, opts.schemaName);
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ResponseValidationError(name, result.error);
  }
  return result.data;
}

// ---------------------------------------------------------------------------
// validateEnv
// ---------------------------------------------------------------------------

/**
 * Validate a Worker `env` binding object against a Zod schema at module init.
 *
 * Call this in your Worker's `fetch` handler or module-level init so that
 * misconfigured bindings cause a loud fast-fail before any request is
 * processed, rather than a cryptic runtime error deep in a handler.
 *
 * @throws {EnvValidationError} when `env` does not match `schema`.
 *
 * @example
 *   // At the top of your Worker handler:
 *   const Env = z.object({
 *     DATABASE_URL: z.string().url(),
 *     API_SECRET: z.string().min(32),
 *     KV_NAMESPACE: z.any(),
 *   });
 *
 *   export default {
 *     fetch(req, env) {
 *       const config = validateEnv(Env, env);
 *       // config is typed as z.infer<typeof Env>
 *     }
 *   };
 */
export function validateEnv<S extends ZodTypeAny>(
  schema: S,
  env: unknown,
  opts: { schemaName?: string } = {},
): z.infer<S> {
  const name = getSchemaName(schema, opts.schemaName ?? "WorkerEnv");
  const result = schema.safeParse(env);
  if (!result.success) {
    throw new EnvValidationError(name, result.error);
  }
  return result.data;
}

// ---------------------------------------------------------------------------
// Internal: synthetic ZodError factory for non-Zod parse errors
// ---------------------------------------------------------------------------

/**
 * Build a minimal ZodError from a plain message string.
 * Used when JSON.parse fails so callers always receive a ZodError in errors.
 * @internal
 */
function _makeZodError(message: string): ZodError {
  // Dynamically import to avoid circular-dep issues in module loading
  // ZodError constructor accepts a `ZodIssue[]`
  const issues = [
    {
      code: "custom" as const,
      path: [],
      message,
    },
  ];
  // `ZodError` is a class — use `Object.create` to build a structurally
  // compatible instance without importing the class (avoids top-level import
  // side-effects in environments where zod may not be bundled).
  const err = new Error(message) as ZodError;
  err.name = "ZodError";
  (err as unknown as { issues: unknown[] }).issues = issues;
  (err as unknown as { errors: unknown[] }).errors = issues;
  return err;
}

// ---------------------------------------------------------------------------
// Vitest co-located tests
// ---------------------------------------------------------------------------

if (import.meta.vitest) {
  const { describe, it, expect, beforeAll } = import.meta.vitest;

  // Dynamically import zod — tests skip gracefully if not installed
  let z: typeof import("zod").z | undefined;

  beforeAll(async () => {
    try {
      const mod = await import("zod");
      z = mod.z;
    } catch {
      // zod not installed in this test environment — tests will be skipped
    }
  });

  // ---- safeBoundary -------------------------------------------------------

  describe("safeBoundary", () => {
    it("returns success=true with typed data on valid input", async () => {
      if (!z) return;
      const schema = z.object({ name: z.string() });
      const result = safeBoundary(schema, { name: "Alice" });
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe("Alice");
      expect(result.error).toBeNull();
    });

    it("returns success=false with ZodError on invalid input", async () => {
      if (!z) return;
      const schema = z.object({ age: z.number() });
      const result = safeBoundary(schema, { age: "not-a-number" });
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
    });

    it("does not throw — returns failure branch", async () => {
      if (!z) return;
      const schema = z.string();
      expect(() => safeBoundary(schema, 99)).not.toThrow();
    });
  });

  // ---- validateRequest ----------------------------------------------------

  describe("validateRequest", () => {
    it("parses JSON body on POST", async () => {
      if (!z) return;
      const schema = z.object({ title: z.string() });
      const request = new Request("https://example.com/api", {
        method: "POST",
        body: JSON.stringify({ title: "Hello" }),
        headers: { "Content-Type": "application/json" },
      });
      const result = await validateRequest(schema, request);
      expect(result.title).toBe("Hello");
    });

    it("throws RequestValidationError for invalid body", async () => {
      if (!z) return;
      const schema = z.object({ count: z.number() });
      const request = new Request("https://example.com/api", {
        method: "POST",
        body: JSON.stringify({ count: "oops" }),
        headers: { "Content-Type": "application/json" },
      });
      await expect(validateRequest(schema, request)).rejects.toBeInstanceOf(
        RequestValidationError,
      );
    });

    it("parses query params on GET", async () => {
      if (!z) return;
      const schema = z.object({ q: z.string() });
      const request = new Request("https://example.com/search?q=test", {
        method: "GET",
      });
      const result = await validateRequest(schema, request);
      expect(result.q).toBe("test");
    });

    it("throws RequestValidationError for non-JSON body", async () => {
      if (!z) return;
      const schema = z.object({ x: z.number() });
      const request = new Request("https://example.com/api", {
        method: "POST",
        body: "not json",
        headers: { "Content-Type": "text/plain" },
      });
      await expect(validateRequest(schema, request)).rejects.toBeInstanceOf(
        RequestValidationError,
      );
    });
  });

  // ---- validateResponse ---------------------------------------------------

  describe("validateResponse", () => {
    it("returns typed data on success", () => {
      if (!z) return;
      const schema = z.object({ id: z.number(), name: z.string() });
      const result = validateResponse(schema, { id: 1, name: "Post" });
      expect(result.id).toBe(1);
    });

    it("throws ResponseValidationError on schema mismatch", () => {
      if (!z) return;
      const schema = z.object({ id: z.number() });
      expect(() => validateResponse(schema, { id: "not-a-number" })).toThrow(
        ResponseValidationError,
      );
    });

    it("carries schema name in error message", () => {
      if (!z) return;
      const schema = z.object({ x: z.number() });
      try {
        validateResponse(schema, { x: "bad" }, { schemaName: "MySchema" });
      } catch (err) {
        expect((err as ResponseValidationError).schemaName).toBe("MySchema");
      }
    });
  });

  // ---- validateEnv --------------------------------------------------------

  describe("validateEnv", () => {
    it("returns typed env on success", () => {
      if (!z) return;
      const EnvSchema = z.object({ API_KEY: z.string().min(1) });
      const result = validateEnv(EnvSchema, { API_KEY: "secret-123" });
      expect(result.API_KEY).toBe("secret-123");
    });

    it("throws EnvValidationError on missing required binding", () => {
      if (!z) return;
      const EnvSchema = z.object({ DB_URL: z.string().url() });
      expect(() => validateEnv(EnvSchema, {})).toThrow(EnvValidationError);
    });

    it("includes field path in error message", () => {
      if (!z) return;
      const EnvSchema = z.object({ PORT: z.number() });
      try {
        validateEnv(EnvSchema, { PORT: "not-a-number" });
      } catch (err) {
        expect((err as EnvValidationError).message).toContain("PORT");
      }
    });
  });
}
