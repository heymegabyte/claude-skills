/**
 * bitwarden-token-cache.ts — OAuth2 client_credentials token cache for Bitwarden
 *
 * Thin Bitwarden-specific preset over the generic
 * {@link createOAuth2ClientCredentialsCache} utility. Preserves the original
 * `getBitwardenToken` / `invalidateBitwardenToken` / `BitwardenAuthError` API
 * so existing call-sites require zero changes.
 *
 * Workers-compatible: uses Web Crypto + fetch only — zero Node.js built-ins.
 * Per [[state-is-the-enemy]] carve-out: ephemeral per-isolate cache, not shared
 * mutable state. No D1/KV/DO — each Worker isolate fetches its own token.
 *
 * @module bitwarden-token-cache
 *
 * Typical flow:
 *   1. Call `getBitwardenToken(opts)` before every Bitwarden API request.
 *   2. The first call fetches a token and caches it.
 *   3. Subsequent calls return the cached token (near-zero latency).
 *   4. On 401 from downstream, call `invalidateBitwardenToken()` then retry.
 *   5. The retry triggers a fresh fetch.
 */

import {
  createOAuth2ClientCredentialsCache,
  OAuth2AuthError,
} from "./oauth2-client-credentials-cache.ts";

export type { OAuth2TokenCache } from "./oauth2-client-credentials-cache.ts";

// ---------------------------------------------------------------------------
// Re-export generic error as the Bitwarden-branded name for call-site compat
// ---------------------------------------------------------------------------

/**
 * Thrown when Bitwarden returns a non-2xx response during token fetch,
 * or when the network is unreachable.
 *
 * Alias of {@link OAuth2AuthError} — identical shape, Bitwarden-branded name.
 *
 * @example
 *   try {
 *     const token = await getBitwardenToken(opts);
 *   } catch (err) {
 *     if (err instanceof BitwardenAuthError) {
 *       // Log and surface to caller — credentials are likely wrong
 *     }
 *   }
 */
export { OAuth2AuthError as BitwardenAuthError };

// ---------------------------------------------------------------------------
// Bitwarden presets
// ---------------------------------------------------------------------------

/** Default Bitwarden Identity Server URL (self-hosted overrides via opts). */
const DEFAULT_IDENTITY_URL = "https://identity.bitwarden.com";

/** Default Bitwarden OAuth2 scope — fixed per client grant. */
const DEFAULT_SCOPE = "api";

/** Default token refresh buffer in seconds. */
const DEFAULT_REFRESH_BUFFER_SECONDS = 60;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Options for {@link getBitwardenToken}. */
export interface BitwardenTokenOptions {
  /** OAuth2 client_id from Bitwarden API key. */
  clientId: string;
  /** OAuth2 client_secret from Bitwarden API key. */
  clientSecret: string;
  /**
   * Base URL of the Bitwarden Identity server.
   * Omit for Bitwarden Cloud; override for self-hosted instances.
   *
   * @default "https://identity.bitwarden.com"
   *
   * @example
   *   // Self-hosted
   *   identityUrl: "https://vault.example.com"
   */
  identityUrl?: string;
}

// ---------------------------------------------------------------------------
// Module-level singleton cache (keyed per opts — lazy init on first call)
// ---------------------------------------------------------------------------

// We maintain a Map<cacheKey, OAuth2TokenCache> so that different combinations
// of clientId + identityUrl cache independently, matching pre-refactor behavior
// where one module-level `cachedToken` variable served the default identity URL.
import type { OAuth2TokenCache } from "./oauth2-client-credentials-cache.ts";

const _bwCaches = new Map<string, OAuth2TokenCache>();

function _getBwCache(opts: Required<BitwardenTokenOptions>): OAuth2TokenCache {
  const key = `${opts.identityUrl}\x00${opts.clientId}`;
  let c = _bwCaches.get(key);
  if (!c) {
    c = createOAuth2ClientCredentialsCache({
      tokenEndpoint: `${opts.identityUrl}/connect/token`,
      clientId: opts.clientId,
      clientSecret: opts.clientSecret,
      scope: DEFAULT_SCOPE,
      refreshBufferSec: DEFAULT_REFRESH_BUFFER_SECONDS,
    });
    _bwCaches.set(key, c);
  }
  return c;
}

// ---------------------------------------------------------------------------
// getBitwardenToken
// ---------------------------------------------------------------------------

/**
 * Return a valid Bitwarden Bearer token, fetching a new one only when the
 * cached token is absent or within 60 seconds of expiry.
 *
 * The returned string is ready to use as an `Authorization: Bearer <token>`
 * header value on Bitwarden API requests.
 *
 * Throws {@link BitwardenAuthError} on credential or network failure.
 *
 * @example
 *   const token = await getBitwardenToken({
 *     clientId: env.BW_CLIENT_ID,
 *     clientSecret: env.BW_CLIENT_SECRET,
 *   });
 *   const res = await fetch("https://api.bitwarden.com/items", {
 *     headers: { Authorization: `Bearer ${token}` },
 *   });
 *
 * @example
 *   // Self-hosted vault
 *   const token = await getBitwardenToken({
 *     clientId: env.BW_CLIENT_ID,
 *     clientSecret: env.BW_CLIENT_SECRET,
 *     identityUrl: "https://vault.corp.example.com",
 *   });
 */
export async function getBitwardenToken(
  opts: BitwardenTokenOptions,
): Promise<string> {
  const resolved: Required<BitwardenTokenOptions> = {
    clientId: opts.clientId,
    clientSecret: opts.clientSecret,
    identityUrl: (opts.identityUrl ?? DEFAULT_IDENTITY_URL).replace(/\/+$/, ""),
  };
  return _getBwCache(resolved).getToken();
}

// ---------------------------------------------------------------------------
// invalidateBitwardenToken
// ---------------------------------------------------------------------------

/**
 * Evict the cached token, forcing {@link getBitwardenToken} to fetch a new one
 * on its next call.
 *
 * Call this immediately after receiving an HTTP 401 from a Bitwarden API
 * request — the token may have been revoked server-side before its stated expiry.
 *
 * When `opts` is omitted, invalidates the default cloud identity token.
 * Pass `opts` to target a specific `clientId` + `identityUrl` combination.
 *
 * @example
 *   const res = await fetch("https://api.bitwarden.com/items", {
 *     headers: { Authorization: `Bearer ${token}` },
 *   });
 *   if (res.status === 401) {
 *     invalidateBitwardenToken();
 *     // Retry with a fresh token:
 *     const freshToken = await getBitwardenToken(opts);
 *   }
 */
export function invalidateBitwardenToken(opts?: BitwardenTokenOptions): void {
  if (!opts) {
    // Invalidate ALL cached Bitwarden tokens (backwards-compat: prior API had
    // a single module-level token with no opts argument).
    for (const cache of _bwCaches.values()) {
      cache.invalidate();
    }
    return;
  }
  const resolved: Required<BitwardenTokenOptions> = {
    clientId: opts.clientId,
    clientSecret: opts.clientSecret,
    identityUrl: (opts.identityUrl ?? DEFAULT_IDENTITY_URL).replace(/\/+$/, ""),
  };
  _getBwCache(resolved).invalidate();
}

// ---------------------------------------------------------------------------
// Vitest unit tests (co-located — run with `vitest run src/utils/bitwarden-token-cache.ts`)
// ---------------------------------------------------------------------------

if (import.meta.vitest) {
  const { describe, it, expect, vi, beforeEach } = import.meta.vitest;

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  function mockSuccessResponse(
    token = "test-bearer-token",
    expiresIn = 3600,
  ): Response {
    return new Response(
      JSON.stringify({ access_token: token, expires_in: expiresIn, token_type: "Bearer" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  function mockErrorResponse(status: number, body = "Unauthorized"): Response {
    return new Response(body, { status });
  }

  const OPTS: BitwardenTokenOptions = {
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
  };

  // Reset both the BW cache map and the underlying generic cache before each test.
  beforeEach(() => {
    _bwCaches.clear();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------

  describe("getBitwardenToken — happy path", () => {
    it("fetches a token and returns it as a string", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockSuccessResponse()));
      const token = await getBitwardenToken(OPTS);
      expect(token).toBe("test-bearer-token");
    });

    it("hits the default Bitwarden identity URL", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSuccessResponse());
      vi.stubGlobal("fetch", mockFetch);
      await getBitwardenToken(OPTS);
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toBe("https://identity.bitwarden.com/connect/token");
    });

    it("uses a custom identityUrl when provided", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSuccessResponse());
      vi.stubGlobal("fetch", mockFetch);
      await getBitwardenToken({ ...OPTS, identityUrl: "https://vault.corp.example.com/" });
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      // Trailing slash should be stripped
      expect(calledUrl).toBe("https://vault.corp.example.com/connect/token");
    });

    it("caches the token and does not fetch again on the second call", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSuccessResponse());
      vi.stubGlobal("fetch", mockFetch);
      await getBitwardenToken(OPTS);
      await getBitwardenToken(OPTS);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("sends client_credentials grant in the request body", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSuccessResponse());
      vi.stubGlobal("fetch", mockFetch);
      await getBitwardenToken(OPTS);
      const body = mockFetch.mock.calls[0][1].body as string;
      expect(body).toContain("grant_type=client_credentials");
      expect(body).toContain("client_id=test-client-id");
    });
  });

  // -------------------------------------------------------------------------

  describe("getBitwardenToken — cache expiry", () => {
    it("re-fetches when the cached token is expired", async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(mockSuccessResponse("first-token", 61))
        .mockResolvedValueOnce(mockSuccessResponse("second-token", 3600));
      vi.stubGlobal("fetch", mockFetch);

      const first = await getBitwardenToken(OPTS);
      expect(first).toBe("first-token");

      // expires_in=61, buffer=60 → effective TTL = 1s
      vi.useFakeTimers();
      vi.advanceTimersByTime(2_000);
      const second = await getBitwardenToken(OPTS);
      expect(second).toBe("second-token");
      expect(mockFetch).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    });
  });

  // -------------------------------------------------------------------------

  describe("invalidateBitwardenToken", () => {
    it("forces a fresh fetch on the next getBitwardenToken call", async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(mockSuccessResponse("first-token"))
        .mockResolvedValueOnce(mockSuccessResponse("second-token"));
      vi.stubGlobal("fetch", mockFetch);

      await getBitwardenToken(OPTS);
      invalidateBitwardenToken();
      const second = await getBitwardenToken(OPTS);

      expect(second).toBe("second-token");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("is safe to call when no token is cached", () => {
      expect(() => invalidateBitwardenToken()).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------

  describe("BitwardenAuthError — error cases", () => {
    it("throws BitwardenAuthError on 401 from identity server", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockErrorResponse(401, "invalid_client")));
      await expect(getBitwardenToken(OPTS)).rejects.toThrow(OAuth2AuthError);
    });

    it("exposes the HTTP status on the error", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockErrorResponse(403, "forbidden")));
      try {
        await getBitwardenToken(OPTS);
      } catch (err) {
        expect(err).toBeInstanceOf(OAuth2AuthError);
        expect((err as OAuth2AuthError).status).toBe(403);
        expect((err as OAuth2AuthError).body).toBe("forbidden");
      }
    });

    it("throws BitwardenAuthError on network failure", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
      );
      await expect(getBitwardenToken(OPTS)).rejects.toThrow(OAuth2AuthError);
    });

    it("throws BitwardenAuthError when response has no access_token", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ token_type: "Bearer" }), { status: 200 }),
        ),
      );
      await expect(getBitwardenToken(OPTS)).rejects.toThrow(OAuth2AuthError);
    });

    it("throws BitwardenAuthError on non-JSON response body", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response("not-json", { status: 200 })),
      );
      await expect(getBitwardenToken(OPTS)).rejects.toThrow(OAuth2AuthError);
    });

    it("does NOT cache the token after a failed fetch", async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(mockErrorResponse(401))
        .mockResolvedValueOnce(mockSuccessResponse("valid-token"));
      vi.stubGlobal("fetch", mockFetch);

      await expect(getBitwardenToken(OPTS)).rejects.toThrow(OAuth2AuthError);
      const token = await getBitwardenToken(OPTS);
      expect(token).toBe("valid-token");
    });
  });
}
