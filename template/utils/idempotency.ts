/**
 * idempotency.ts — Idempotency key generation, parsing, and KV-based dedup helpers
 *
 * Zero external dependencies. Workers-compatible (no Node-only APIs).
 * UUIDv7 (time-ordered) is the preferred key format; falls back to UUIDv4
 * when the runtime does not expose `crypto.randomUUID` in the v7 variant.
 *
 * Reference: https://tools.ietf.org/html/draft-ietf-httpapi-idempotency-key-header
 *
 * @module idempotency
 */

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

/**
 * Thrown when an idempotency key header is missing on a mutating request.
 *
 * @example
 *   throw new MissingIdempotencyKeyError('POST');
 *   // Error: "POST request must include an Idempotency-Key header"
 */
export class MissingIdempotencyKeyError extends Error {
  constructor(public readonly method: string) {
    super(`${method} request must include an Idempotency-Key header`);
    this.name = "MissingIdempotencyKeyError";
  }
}

/**
 * Thrown when an idempotency key fails validation (e.g. exceeds max length).
 *
 * @example
 *   throw new InvalidIdempotencyKeyError('x'.repeat(256), 'exceeds maximum length of 255 characters');
 *   // Error: Invalid Idempotency-Key "xxx...": exceeds maximum length of 255 characters
 */
export class InvalidIdempotencyKeyError extends Error {
  constructor(
    public readonly key: string,
    public readonly reason: string,
  ) {
    super(`Invalid Idempotency-Key "${key}": ${reason}`);
    this.name = "InvalidIdempotencyKeyError";
  }
}

/**
 * Thrown when a KV store get or put operation fails during idempotency dedup.
 *
 * @example
 *   throw new IdempotencyKVError('order_abc', 'get', new Error('KV timeout'));
 *   // Error: KV get failed for idempotency key "order_abc"
 */
export class IdempotencyKVError extends Error {
  constructor(
    public readonly key: string,
    public readonly op: "get" | "put",
    cause?: unknown,
  ) {
    super(`KV ${op} failed for idempotency key "${key}"`);
    this.name = "IdempotencyKVError";
    if (cause) this.cause = cause;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Options for `generateIdempotencyKey`. */
export interface GenerateIdempotencyKeyOpts {
  /**
   * Preferred key format. `"v7"` (time-ordered UUID) is used when supported;
   * falls back to `"v4"` if the runtime only has standard `randomUUID`.
   * Defaults to `"v7"`.
   */
  format?: "v7" | "v4";
  /** Optional prefix, e.g. `"order"` → `"order_018f..."`. */
  prefix?: string;
}

/** Minimal Hono context used by `requireIdempotencyKey`. */
export interface HonoContextLike {
  req: {
    method: string;
    header(name: string): string | undefined;
  };
  json(body: unknown, status?: number): Response;
}

/** Minimal KV namespace interface compatible with CF Workers KVNamespace. */
export interface KVNamespaceLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}

/** Result of `idempotencyCheck`. */
export type IdempotencyCheckResult<T> =
  | { hit: true; cached: T }
  | { hit: false; cached: null };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum allowed length for an Idempotency-Key value (bytes). */
const MAX_KEY_LENGTH = 255;

/** HTTP methods that require idempotency keys. */
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH"]);

// ---------------------------------------------------------------------------
// generateIdempotencyKey
// ---------------------------------------------------------------------------

/**
 * Generate an idempotency key string.
 *
 * Produces a UUIDv7 (time-ordered, monotonic) by default. When the runtime
 * lacks a native UUIDv7 implementation it falls back to UUIDv4 via
 * `crypto.randomUUID()`.
 *
 * @param opts - Optional format and prefix configuration.
 * @returns A unique string suitable for use as an `Idempotency-Key` header value.
 * @remarks Impure — calls Web Crypto RNG.
 *
 * @example
 *   generateIdempotencyKey();
 *   // → "018f4b1a-3c2d-7e8f-9012-3456789abcde"  (UUIDv7, no prefix)
 *
 * @example
 *   generateIdempotencyKey({ prefix: 'order' });
 *   // → "order_018f4b1a-3c2d-7e8f-9012-3456789abcde"
 *
 * @example
 *   generateIdempotencyKey({ format: 'v4' });
 *   // → "550e8400-e29b-41d4-a716-446655440000"  (UUIDv4)
 */
export function generateIdempotencyKey(opts: GenerateIdempotencyKeyOpts = {}): string {
  const { format = "v7", prefix } = opts;

  let uuid: string;
  if (format === "v7") {
    uuid = generateUUIDv7();
  } else {
    uuid = crypto.randomUUID();
  }

  return prefix ? `${prefix}_${uuid}` : uuid;
}

// ---------------------------------------------------------------------------
// parseIdempotencyKey
// ---------------------------------------------------------------------------

/**
 * Extract the idempotency key from an `Idempotency-Key` request header value.
 *
 * Returns `null` when the header is absent or empty.
 * Strips surrounding double-quotes per the draft specification.
 *
 * @param headerValue - Raw value of the `Idempotency-Key` header, or `null`/`undefined`.
 * @returns Cleaned key string, or `null` if absent.
 * @throws {InvalidIdempotencyKeyError} When the key exceeds `MAX_KEY_LENGTH`.
 *
 * @example
 *   parseIdempotencyKey('"018f4b1a-3c2d-7e8f-9012-3456789abcde"');
 *   // → "018f4b1a-3c2d-7e8f-9012-3456789abcde"
 *
 * @example
 *   parseIdempotencyKey(null);
 *   // → null
 *
 * @example
 *   parseIdempotencyKey('');
 *   // → null
 */
export function parseIdempotencyKey(headerValue: string | null | undefined): string | null {
  if (!headerValue) return null;

  // Strip surrounding double-quotes per HTTPAPI draft
  const cleaned = headerValue.replace(/^"|"$/g, "").trim();
  if (!cleaned) return null;

  if (cleaned.length > MAX_KEY_LENGTH) {
    throw new InvalidIdempotencyKeyError(
      cleaned.slice(0, 40) + "…",
      `exceeds maximum length of ${MAX_KEY_LENGTH} characters`,
    );
  }

  return cleaned;
}

// ---------------------------------------------------------------------------
// requireIdempotencyKey
// ---------------------------------------------------------------------------

/**
 * Hono middleware that enforces the presence of an `Idempotency-Key` header
 * on POST, PUT, and PATCH requests.
 *
 * Returns a `400 Bad Request` JSON response with a structured error body if the
 * key is absent or invalid. Returns `null` when the request is valid or uses a
 * non-mutating method (the caller should continue processing).
 *
 * @param c - Hono context.
 * @returns `Response` (400) on missing/invalid key, `null` on success.
 * @throws {MissingIdempotencyKeyError} Internally — caught and converted to a 400 response.
 *
 * @example
 *   app.post('/orders', async (c) => {
 *     const guard = requireIdempotencyKey(c);
 *     if (guard) return guard;          // 400 if key missing
 *     // ... process order
 *   });
 *
 * @example
 *   // GET requests pass through without requiring a key
 *   app.get('/health', (c) => {
 *     const guard = requireIdempotencyKey(c);
 *     // guard === null — no key required for GET
 *   });
 */
export function requireIdempotencyKey(c: HonoContextLike): Response | null {
  const method = c.req.method.toUpperCase();
  if (!MUTATING_METHODS.has(method)) return null;

  const raw = c.req.header("Idempotency-Key") ?? null;

  try {
    const key = parseIdempotencyKey(raw);
    if (key === null) {
      return c.json(
        {
          error: "missing_idempotency_key",
          message: `${method} requests must include an Idempotency-Key header`,
        },
        400,
      );
    }
  } catch (err) {
    if (err instanceof InvalidIdempotencyKeyError) {
      return c.json(
        {
          error: "invalid_idempotency_key",
          message: err.message,
        },
        400,
      );
    }
    throw err;
  }

  return null;
}

// ---------------------------------------------------------------------------
// idempotencyCheck
// ---------------------------------------------------------------------------

/**
 * KV-based idempotency deduplication helper.
 *
 * If the key exists in KV (meaning a prior request already processed it),
 * returns the cached response object. Otherwise returns `{ hit: false }`.
 * Callers should store the result in KV after successful processing using
 * the companion pattern shown in the example.
 *
 * @param kv  - CF Workers KVNamespace (or compatible mock).
 * @param key - Idempotency key string (from `parseIdempotencyKey`).
 * @param ttl - Time-to-live in seconds for the cached entry. Defaults to 86400 (24h).
 * @returns `{ hit: true, cached: T }` on cache hit; `{ hit: false, cached: null }` on miss.
 * @throws {IdempotencyKVError} When the KV get operation fails.
 *
 * @example
 *   const key = parseIdempotencyKey(c.req.header('Idempotency-Key'));
 *   if (key) {
 *     const result = await idempotencyCheck<OrderResponse>(env.KV, key);
 *     if (result.hit) return c.json(result.cached);
 *   }
 *   // ... process the request ...
 *   const response = { orderId: '123', status: 'created' };
 *   if (key) await env.KV.put(key, JSON.stringify(response), { expirationTtl: 86400 });
 *   return c.json(response, 201);
 *
 * @example
 *   // Miss path — key not yet processed
 *   const check = await idempotencyCheck(env.KV, 'new-key-abc');
 *   check.hit     // → false
 *   check.cached  // → null
 */
export async function idempotencyCheck<T>(
  kv: KVNamespaceLike,
  key: string,
  ttl = 86400,
): Promise<IdempotencyCheckResult<T>> {
  let raw: string | null;
  try {
    raw = await kv.get(key);
  } catch (err) {
    throw new IdempotencyKVError(key, "get", err);
  }

  if (raw === null) {
    return { hit: false, cached: null };
  }

  // Refresh TTL on hit so long-running multi-step flows stay alive
  try {
    await kv.put(key, raw, { expirationTtl: ttl });
  } catch {
    // Non-fatal — best effort TTL refresh; don't block the response
  }

  return { hit: true, cached: JSON.parse(raw) as T };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Generate a UUIDv7 (time-ordered) using Web Crypto.
 *
 * UUIDv7 layout (RFC 9562 §5.7):
 *   - bits 0–47:  unix_ts_ms  (48 bits)
 *   - bits 48–51: version "7" (4 bits)
 *   - bits 52–63: rand_a      (12 bits random)
 *   - bits 64–65: variant "10" (2 bits)
 *   - bits 66–127: rand_b     (62 bits random)
 *
 * @returns UUID string in standard hyphenated form.
 */
function generateUUIDv7(): string {
  const nowMs = BigInt(Date.now());
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // Encode timestamp into first 6 bytes (48 bits)
  bytes[0] = Number((nowMs >> 40n) & 0xffn);
  bytes[1] = Number((nowMs >> 32n) & 0xffn);
  bytes[2] = Number((nowMs >> 24n) & 0xffn);
  bytes[3] = Number((nowMs >> 16n) & 0xffn);
  bytes[4] = Number((nowMs >> 8n) & 0xffn);
  bytes[5] = Number(nowMs & 0xffn);

  // Set version bits (0111 = 7)
  bytes[6] = (bytes[6] & 0x0f) | 0x70;

  // Set variant bits (10xx)
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ---------------------------------------------------------------------------
// Vitest co-located tests
// ---------------------------------------------------------------------------

if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  // ---------------------------------------------------------------------------
  // generateIdempotencyKey
  // ---------------------------------------------------------------------------
  describe("generateIdempotencyKey", () => {
    it("returns a UUID-formatted string by default", () => {
      const key = generateIdempotencyKey();
      expect(key).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it("returns a unique value on each call", () => {
      const keys = Array.from({ length: 10 }, () => generateIdempotencyKey());
      expect(new Set(keys).size).toBe(10);
    });

    it("prepends prefix with underscore when provided", () => {
      const key = generateIdempotencyKey({ prefix: "order" });
      expect(key).toMatch(/^order_/);
    });

    it("falls back to v4 when format is v4", () => {
      const key = generateIdempotencyKey({ format: "v4" });
      expect(key).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    });

    it("UUIDv7 has version nibble 7", () => {
      const key = generateIdempotencyKey({ format: "v7" });
      // 3rd group starts with 7
      expect(key.split("-")[2]).toMatch(/^7/);
    });
  });

  // ---------------------------------------------------------------------------
  // parseIdempotencyKey
  // ---------------------------------------------------------------------------
  describe("parseIdempotencyKey", () => {
    it("returns null for null input", () => {
      expect(parseIdempotencyKey(null)).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(parseIdempotencyKey("")).toBeNull();
    });

    it("strips surrounding double-quotes", () => {
      expect(parseIdempotencyKey('"abc-123"')).toBe("abc-123");
    });

    it("returns the key as-is when not quoted", () => {
      expect(parseIdempotencyKey("abc-123")).toBe("abc-123");
    });

    it("throws InvalidIdempotencyKeyError for key exceeding max length", () => {
      const long = "x".repeat(MAX_KEY_LENGTH + 1);
      expect(() => parseIdempotencyKey(long)).toThrow(InvalidIdempotencyKeyError);
    });

    it("accepts key at exactly max length", () => {
      const exact = "a".repeat(MAX_KEY_LENGTH);
      expect(parseIdempotencyKey(exact)).toBe(exact);
    });
  });

  // ---------------------------------------------------------------------------
  // requireIdempotencyKey
  // ---------------------------------------------------------------------------
  describe("requireIdempotencyKey", () => {
    function makeCtx(method: string, keyHeader?: string): HonoContextLike {
      return {
        req: {
          method,
          header: (name: string) =>
            name.toLowerCase() === "idempotency-key" ? keyHeader : undefined,
        },
        json: (body: unknown, status?: number) =>
          new Response(JSON.stringify(body), {
            status: status ?? 200,
            headers: { "Content-Type": "application/json" },
          }),
      };
    }

    it("returns null for GET requests (no key required)", () => {
      const c = makeCtx("GET");
      expect(requireIdempotencyKey(c)).toBeNull();
    });

    it("returns 400 response for POST without key", () => {
      const c = makeCtx("POST");
      const res = requireIdempotencyKey(c);
      expect(res).toBeInstanceOf(Response);
      expect((res as Response).status).toBe(400);
    });

    it("returns null for POST with valid key", () => {
      const c = makeCtx("POST", "valid-key-123");
      expect(requireIdempotencyKey(c)).toBeNull();
    });

    it("returns 400 for PUT without key", () => {
      const c = makeCtx("PUT");
      expect((requireIdempotencyKey(c) as Response).status).toBe(400);
    });

    it("returns 400 for PATCH without key", () => {
      const c = makeCtx("PATCH");
      expect((requireIdempotencyKey(c) as Response).status).toBe(400);
    });
  });

  // ---------------------------------------------------------------------------
  // idempotencyCheck
  // ---------------------------------------------------------------------------
  describe("idempotencyCheck", () => {
    function makeKV(initial: Record<string, string> = {}): KVNamespaceLike & { store: Record<string, string> } {
      const store = { ...initial };
      return {
        store,
        async get(key: string) { return store[key] ?? null; },
        async put(key: string, value: string) { store[key] = value; },
      };
    }

    it("returns hit: false on cache miss", async () => {
      const kv = makeKV();
      const result = await idempotencyCheck(kv, "new-key");
      expect(result.hit).toBe(false);
      expect(result.cached).toBeNull();
    });

    it("returns hit: true with cached value on cache hit", async () => {
      const kv = makeKV({ "existing-key": JSON.stringify({ orderId: "123" }) });
      const result = await idempotencyCheck<{ orderId: string }>(kv, "existing-key");
      expect(result.hit).toBe(true);
      expect(result.cached).toEqual({ orderId: "123" });
    });

    it("throws IdempotencyKVError when KV get fails", async () => {
      const kv: KVNamespaceLike = {
        async get() { throw new IdempotencyKVError("key", "get"); },
        async put() {},
      };
      await expect(idempotencyCheck(kv, "key")).rejects.toThrow(IdempotencyKVError);
    });
  });
}
