/**
 * fetch-with-retry.ts — Production-grade fetch wrapper for CF Workers + Node
 *
 * Zero external dependencies. Workers-compatible (no Node-only APIs).
 * Exponential backoff, circuit breaker, idempotency-key injection.
 *
 * @module fetch-with-retry
 */

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

/**
 * Thrown when all retry attempts are exhausted without a successful response.
 *
 * @example
 *   throw new FetchRetryExhaustedError('https://api.example.com', 3, 503);
 *   // Error: fetch https://api.example.com failed after 3 attempt(s) (last status 503)
 */
export class FetchRetryExhaustedError extends Error {
  constructor(
    public readonly url: string,
    public readonly attempts: number,
    public readonly lastStatus: number | null,
    cause?: unknown,
  ) {
    super(
      `fetch ${url} failed after ${attempts} attempt(s)` +
        (lastStatus != null ? ` (last status ${lastStatus})` : ""),
    );
    this.name = "FetchRetryExhaustedError";
    if (cause) this.cause = cause;
  }
}

/**
 * Thrown when a Promise exceeds the configured timeout.
 *
 * @example
 *   throw new TimeoutError(5000);
 *   // Error: Promise timed out after 5000ms
 */
export class TimeoutError extends Error {
  constructor(public readonly ms: number) {
    super(`Promise timed out after ${ms}ms`);
    this.name = "TimeoutError";
  }
}

/**
 * Thrown when the circuit breaker rejects a request in OPEN state.
 *
 * @example
 *   throw new CircuitOpenError('payments-api');
 *   // Error: Circuit "payments-api" is OPEN — call rejected
 */
export class CircuitOpenError extends Error {
  constructor(public readonly name: string) {
    super(`Circuit "${name}" is OPEN — call rejected`);
    this.name = "CircuitOpenError";
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3). */
  retries?: number;
  /** Base delay in ms between retries (default: 250). */
  baseDelayMs?: number;
  /** Maximum delay cap in ms (default: 5000). */
  maxDelayMs?: number;
  /** Jitter factor 0–1 applied to each delay (default: 0.2). */
  jitter?: number;
  /**
   * Auto-inject an idempotency key header on POST/PUT/PATCH requests.
   * Header name: `Idempotency-Key`. Value: random UUID v4.
   */
  idempotent?: boolean;
  /** Optional AbortSignal to cancel all attempts. */
  signal?: AbortSignal;
}

type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
  /** Number of consecutive failures before opening (default: 5). */
  failureThreshold?: number;
  /** Milliseconds to stay OPEN before moving to HALF_OPEN (default: 30_000). */
  cooldownMs?: number;
  /**
   * Predicate to classify a response as a failure.
   * Defaults to `isRetryable(response)`.
   */
  isFailure?: (response: Response) => boolean;
}

interface CircuitBreakerInstance {
  /** Execute a fetch factory under circuit-breaker control. */
  execute(fetchFn: () => Promise<Response>): Promise<Response>;
  /** Current circuit state. */
  readonly state: CircuitState;
  /** Reset the breaker to CLOSED with zero failure count. */
  reset(): void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Clamp `value` to [min, max]. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Sleep for `ms` milliseconds, respecting an optional AbortSignal. */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const id = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(id);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

/** Random UUID v4 via Web Crypto — Workers-compatible. */
function randomUUID(): string {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// isRetryable
// ---------------------------------------------------------------------------

/**
 * Returns `true` when a response status warrants a retry.
 *
 * Retryable statuses: 408, 429, 502, 503, 504.
 * When a `Retry-After` header is present on a 429, the suggested delay is
 * exposed via the returned boolean's companion — callers can read it from
 * `response.headers.get("Retry-After")` themselves.
 *
 * @example
 *   const res = await fetch("/api");
 *   if (isRetryable(res)) {
 *     // safe to retry
 *   }
 */
export function isRetryable(response: Response): boolean {
  return [408, 429, 502, 503, 504].includes(response.status);
}

/**
 * Parse the `Retry-After` header and return a delay in ms, or `null` if absent.
 * Handles both integer seconds and HTTP-date strings.
 *
 * @internal
 */
function retryAfterMs(response: Response): number | null {
  const header = response.headers.get("Retry-After");
  if (!header) return null;
  const seconds = Number(header);
  if (!Number.isNaN(seconds)) return seconds * 1000;
  const date = new Date(header);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, date.getTime() - Date.now());
}

// ---------------------------------------------------------------------------
// withTimeout
// ---------------------------------------------------------------------------

/**
 * Race `promise` against a timeout.
 * Rejects with `TimeoutError` if `ms` elapses first.
 *
 * @example
 *   const data = await withTimeout(fetch("/slow-api"), 5000);
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  if (ms <= 0) throw new RangeError("withTimeout: ms must be > 0");
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(ms)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

// ---------------------------------------------------------------------------
// circuitBreaker
// ---------------------------------------------------------------------------

/** Registry so each named breaker is a singleton. */
const _breakers = new Map<string, CircuitBreakerInstance>();

/**
 * Create (or retrieve) a named circuit breaker.
 *
 * State machine:
 *   CLOSED  → normal operation; failures increment counter
 *   OPEN    → rejects all calls with `CircuitOpenError`
 *   HALF_OPEN → allows a single probe call; success → CLOSED, failure → OPEN
 *
 * @example
 *   const cb = circuitBreaker("payments-api", { failureThreshold: 3 });
 *   const res = await cb.execute(() => fetch("https://pay.example.com/charge"));
 */
export function circuitBreaker(
  name: string,
  opts: CircuitBreakerOptions = {},
): CircuitBreakerInstance {
  if (_breakers.has(name)) return _breakers.get(name)!;

  const failureThreshold = opts.failureThreshold ?? 5;
  const cooldownMs = opts.cooldownMs ?? 30_000;
  const isFailure = opts.isFailure ?? isRetryable;

  let state: CircuitState = "CLOSED";
  let failures = 0;
  let openedAt = 0;

  const instance: CircuitBreakerInstance = {
    get state() {
      return state;
    },

    reset() {
      state = "CLOSED";
      failures = 0;
      openedAt = 0;
    },

    async execute(fetchFn) {
      if (state === "OPEN") {
        if (Date.now() - openedAt >= cooldownMs) {
          state = "HALF_OPEN";
        } else {
          throw new CircuitOpenError(name);
        }
      }

      try {
        const res = await fetchFn();
        if (isFailure(res)) {
          failures++;
          if (state === "HALF_OPEN" || failures >= failureThreshold) {
            state = "OPEN";
            openedAt = Date.now();
          }
        } else {
          // success — reset
          failures = 0;
          state = "CLOSED";
        }
        return res;
      } catch (err) {
        failures++;
        if (state === "HALF_OPEN" || failures >= failureThreshold) {
          state = "OPEN";
          openedAt = Date.now();
        }
        throw err;
      }
    },
  };

  _breakers.set(name, instance);
  return instance;
}

// ---------------------------------------------------------------------------
// fetchWithRetry
// ---------------------------------------------------------------------------

/**
 * Production-grade `fetch` wrapper with exponential backoff and retry logic.
 *
 * - Retries on network errors and retryable HTTP status codes (408/429/502/503/504).
 * - Respects `Retry-After` header on 429 responses.
 * - Injects `Idempotency-Key` header on POST/PUT/PATCH when `opts.idempotent=true`.
 * - Compatible with CF Workers, Deno, and Node 18+.
 *
 * @example
 *   const res = await fetchWithRetry("https://api.example.com/data", {
 *     method: "POST",
 *     body: JSON.stringify({ key: "value" }),
 *     headers: { "Content-Type": "application/json" },
 *   }, { retries: 3, idempotent: true });
 *   const data = await res.json();
 */
export async function fetchWithRetry(
  url: string | URL,
  init: RequestInit = {},
  opts: RetryOptions = {},
): Promise<Response> {
  const retries = opts.retries ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 250;
  const maxDelayMs = opts.maxDelayMs ?? 5_000;
  const jitter = clamp(opts.jitter ?? 0.2, 0, 1);
  const signal = opts.signal;

  const urlStr = url.toString();
  const method = (init.method ?? "GET").toUpperCase();
  const idempotentMethods = ["POST", "PUT", "PATCH"];

  // Clone headers so we don't mutate caller's object
  const headers = new Headers(init.headers ?? {});

  if (opts.idempotent && idempotentMethods.includes(method)) {
    if (!headers.has("Idempotency-Key")) {
      headers.set("Idempotency-Key", randomUUID());
    }
  }

  let lastStatus: number | null = null;
  let attempt = 0;

  while (true) {
    attempt++;

    try {
      const res = await fetch(url, { ...init, headers, signal });
      lastStatus = res.status;

      if (!isRetryable(res) || attempt > retries) {
        return res;
      }

      // Respect Retry-After on 429
      let delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      const ra = retryAfterMs(res);
      if (ra !== null) delay = Math.min(ra, maxDelayMs);

      // Apply jitter
      const spread = delay * jitter;
      delay = delay - spread / 2 + Math.random() * spread;

      await sleep(delay, signal);
    } catch (err) {
      if (attempt > retries) {
        throw new FetchRetryExhaustedError(urlStr, attempt, lastStatus, err);
      }

      // Abort errors are not retried
      if (err instanceof DOMException && err.name === "AbortError") throw err;

      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      await sleep(delay, signal);
    }
  }
}

// ---------------------------------------------------------------------------
// Vitest co-located tests
// ---------------------------------------------------------------------------

if (import.meta.vitest) {
  const { describe, it, expect, vi, beforeEach } = import.meta.vitest;

  // ---- withTimeout --------------------------------------------------------

  describe("withTimeout", () => {
    it("resolves when promise settles before deadline", async () => {
      const p = Promise.resolve(42);
      expect(await withTimeout(p, 1000)).toBe(42);
    });

    it("rejects with TimeoutError when deadline passes", async () => {
      const p = new Promise<void>(() => {}); // never resolves
      await expect(withTimeout(p, 10)).rejects.toBeInstanceOf(TimeoutError);
    });

    it("throws RangeError for non-positive ms", () => {
      expect(() => withTimeout(Promise.resolve(), 0)).toThrow(RangeError);
    });
  });

  // ---- isRetryable --------------------------------------------------------

  describe("isRetryable", () => {
    it.each([408, 429, 502, 503, 504])("returns true for %i", (status) => {
      const res = new Response(null, { status });
      expect(isRetryable(res)).toBe(true);
    });

    it.each([200, 201, 400, 401, 403, 404, 500])("returns false for %i", (status) => {
      const res = new Response(null, { status });
      expect(isRetryable(res)).toBe(false);
    });
  });

  // ---- circuitBreaker -----------------------------------------------------

  describe("circuitBreaker", () => {
    beforeEach(() => {
      // Reset singleton registry between tests
      // @ts-expect-error — accessing module-level private map for test isolation
      _breakers.clear();
    });

    it("starts CLOSED and returns successful response", async () => {
      const cb = circuitBreaker("test-closed", { failureThreshold: 3 });
      expect(cb.state).toBe("CLOSED");
      const res = await cb.execute(() => Promise.resolve(new Response("ok", { status: 200 })));
      expect(res.status).toBe(200);
      expect(cb.state).toBe("CLOSED");
    });

    it("opens after failureThreshold consecutive failures", async () => {
      const cb = circuitBreaker("test-open", { failureThreshold: 2, cooldownMs: 60_000 });
      const fail = () => Promise.resolve(new Response(null, { status: 503 }));
      await cb.execute(fail);
      await cb.execute(fail);
      expect(cb.state).toBe("OPEN");
    });

    it("throws CircuitOpenError when OPEN", async () => {
      const cb = circuitBreaker("test-throws", { failureThreshold: 1, cooldownMs: 60_000 });
      const fail = () => Promise.resolve(new Response(null, { status: 503 }));
      await cb.execute(fail);
      await expect(cb.execute(fail)).rejects.toBeInstanceOf(CircuitOpenError);
    });

    it("reset() returns to CLOSED", async () => {
      const cb = circuitBreaker("test-reset", { failureThreshold: 1 });
      const fail = () => Promise.resolve(new Response(null, { status: 503 }));
      await cb.execute(fail);
      expect(cb.state).toBe("OPEN");
      cb.reset();
      expect(cb.state).toBe("CLOSED");
    });
  });

  // ---- fetchWithRetry -----------------------------------------------------

  describe("fetchWithRetry", () => {
    it("returns immediately on 200", async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
      vi.stubGlobal("fetch", mockFetch);
      const res = await fetchWithRetry("https://example.com", {}, { retries: 3 });
      expect(res.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      vi.unstubAllGlobals();
    });

    it("injects Idempotency-Key on POST when idempotent=true", async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
      vi.stubGlobal("fetch", mockFetch);
      await fetchWithRetry("https://example.com", { method: "POST" }, { idempotent: true });
      const calledHeaders = mockFetch.mock.calls[0][1].headers as Headers;
      expect(calledHeaders.has("Idempotency-Key")).toBe(true);
      vi.unstubAllGlobals();
    });

    it("does NOT inject Idempotency-Key on GET", async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
      vi.stubGlobal("fetch", mockFetch);
      await fetchWithRetry("https://example.com", { method: "GET" }, { idempotent: true });
      const calledHeaders = mockFetch.mock.calls[0][1].headers as Headers;
      expect(calledHeaders.has("Idempotency-Key")).toBe(false);
      vi.unstubAllGlobals();
    });
  });
}
