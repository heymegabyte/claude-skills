/**
 * oauth2-client-credentials-cache.ts — Generic OAuth2 client_credentials token cache
 *
 * Implements the OAuth2 `client_credentials` grant for ANY provider (Bitwarden,
 * Auth0, Okta, AWS Cognito, Azure AD, etc.) with a module-level in-process cache
 * keyed by `tokenEndpoint + clientId`. Multiple instances against different
 * providers cache independently — no cross-provider token leakage.
 *
 * Workers-compatible: uses Web Crypto + fetch only — zero Node.js built-ins.
 * Per [[state-is-the-enemy]] carve-out: ephemeral per-isolate cache, not shared
 * mutable state. No D1/KV/DO — each Worker isolate fetches its own token.
 *
 * @module oauth2-client-credentials-cache
 *
 * Typical flow:
 *   1. `const cache = createOAuth2ClientCredentialsCache(opts)`
 *   2. Call `cache.getToken()` before every API request.
 *   3. The first call fetches a token and caches it.
 *   4. Subsequent calls return the cached token (near-zero latency).
 *   5. On 401 from downstream, call `cache.invalidate()` then retry.
 *   6. The retry triggers a fresh fetch.
 *
 * @example
 *   // Bitwarden
 *   const bwCache = createOAuth2ClientCredentialsCache({
 *     tokenEndpoint: "https://identity.bitwarden.com/connect/token",
 *     clientId: env.BW_CLIENT_ID,
 *     clientSecret: env.BW_CLIENT_SECRET,
 *     scope: "api",
 *   });
 *   const token = await bwCache.getToken();
 *
 * @example
 *   // Auth0 Machine-to-Machine
 *   const auth0Cache = createOAuth2ClientCredentialsCache({
 *     tokenEndpoint: "https://my-tenant.us.auth0.com/oauth/token",
 *     clientId: env.AUTH0_CLIENT_ID,
 *     clientSecret: env.AUTH0_CLIENT_SECRET,
 *     scope: "read:users update:users",
 *   });
 *   const token = await auth0Cache.getToken();
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Seconds before token expiry at which we proactively refresh.
 * Standard tokens live 3600s. A 60s buffer avoids edge-expiry races.
 */
const DEFAULT_REFRESH_BUFFER_SECONDS = 60;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Options for {@link createOAuth2ClientCredentialsCache}. */
export interface OAuth2ClientCredentialsOptions {
  /**
   * Full token endpoint URL including path.
   *
   * @example "https://identity.bitwarden.com/connect/token"
   * @example "https://my-tenant.us.auth0.com/oauth/token"
   * @example "https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token"
   */
  tokenEndpoint: string;
  /** OAuth2 client_id. */
  clientId: string;
  /** OAuth2 client_secret. */
  clientSecret: string;
  /**
   * Space-separated OAuth2 scope string. Some providers require it; others
   * (Bitwarden) use a fixed scope per client grant.
   *
   * @example "api"
   * @example "read:users update:users"
   * @example "https://graph.microsoft.com/.default"
   */
  scope?: string;
  /**
   * Seconds before expiry to proactively refresh the token.
   *
   * @default 60
   */
  refreshBufferSec?: number;
}

/** The object returned by {@link createOAuth2ClientCredentialsCache}. */
export interface OAuth2TokenCache {
  /**
   * Return a valid Bearer token string, fetching a new one only when the
   * cached token is absent or within `refreshBufferSec` of expiry.
   *
   * The returned string is ready to use as an `Authorization: Bearer <token>`
   * header value.
   *
   * Throws {@link OAuth2AuthError} on credential or network failure.
   */
  getToken(): Promise<string>;
  /**
   * Evict the cached token, forcing {@link getToken} to fetch a new one on its
   * next call.
   *
   * Call this immediately after receiving HTTP 401 from a downstream API —
   * the token may have been revoked before its stated expiry.
   */
  invalidate(): void;
}

/** Internal shape of a cached token entry. */
interface CachedToken {
  /** Raw Bearer token string to pass in Authorization headers. */
  token: string;
  /**
   * Unix timestamp (ms) after which this token should be considered expired.
   * Already accounts for `refreshBufferSec`.
   */
  expiresAt: number;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/**
 * Thrown when the OAuth2 token endpoint returns a non-2xx response,
 * the response body is not valid JSON, the `access_token` field is absent,
 * or the network is unreachable.
 *
 * @example
 *   try {
 *     const token = await cache.getToken();
 *   } catch (err) {
 *     if (err instanceof OAuth2AuthError) {
 *       console.error("OAuth2 failure", err.status, err.body);
 *     }
 *   }
 */
export class OAuth2AuthError extends Error {
  /** HTTP status code from the token endpoint, or 0 for network errors. */
  readonly status: number;
  /** Raw response body text from the token endpoint, if available. */
  readonly body: string;

  constructor(message: string, status: number, body: string) {
    super(message);
    this.name = "OAuth2AuthError";
    this.status = status;
    this.body = body;
  }
}

// ---------------------------------------------------------------------------
// Module-level cache map
// Key: `${tokenEndpoint}\x00${clientId}` — isolates per provider+client pair.
// (per [[state-is-the-enemy]] carve-out: ephemeral per-isolate, not shared)
// ---------------------------------------------------------------------------

const _cache = new Map<string, CachedToken>();

function _cacheKey(tokenEndpoint: string, clientId: string): string {
  return `${tokenEndpoint}\x00${clientId}`;
}

// ---------------------------------------------------------------------------
// Internal: fetch a fresh token from the OAuth2 token endpoint
// ---------------------------------------------------------------------------

async function _fetchToken(
  opts: Required<OAuth2ClientCredentialsOptions>,
): Promise<CachedToken> {
  const params: Record<string, string> = {
    grant_type: "client_credentials",
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
  };

  if (opts.scope) {
    params["scope"] = opts.scope;
  }

  const body = new URLSearchParams(params);

  let response: Response;

  try {
    response = await fetch(opts.tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch (networkErr) {
    throw new OAuth2AuthError(
      `Network error fetching OAuth2 token from ${opts.tokenEndpoint}: ${String(networkErr)}`,
      0,
      "",
    );
  }

  const responseText = await response.text();

  if (!response.ok) {
    throw new OAuth2AuthError(
      `OAuth2 token endpoint returned HTTP ${response.status} at ${opts.tokenEndpoint}. ` +
        `Check clientId / clientSecret and tokenEndpoint.`,
      response.status,
      responseText,
    );
  }

  let json: Record<string, unknown>;

  try {
    json = JSON.parse(responseText) as Record<string, unknown>;
  } catch {
    throw new OAuth2AuthError(
      `OAuth2 token endpoint returned non-JSON response (HTTP ${response.status}).`,
      response.status,
      responseText,
    );
  }

  const accessToken = json["access_token"];
  const expiresIn = json["expires_in"];

  if (typeof accessToken !== "string" || !accessToken) {
    throw new OAuth2AuthError(
      `OAuth2 token response missing access_token field.`,
      response.status,
      responseText,
    );
  }

  const expiresInSeconds =
    typeof expiresIn === "number" && expiresIn > 0 ? expiresIn : 3600;

  return {
    token: accessToken,
    expiresAt:
      Date.now() + (expiresInSeconds - opts.refreshBufferSec) * 1_000,
  };
}

// ---------------------------------------------------------------------------
// createOAuth2ClientCredentialsCache
// ---------------------------------------------------------------------------

/**
 * Create a reusable OAuth2 `client_credentials` token cache for a given
 * provider. Returns a `{getToken(), invalidate()}` handle.
 *
 * Multiple calls with different `tokenEndpoint`+`clientId` combinations cache
 * independently — safe to instantiate at module scope per provider.
 *
 * @example
 *   // Bitwarden
 *   const bwCache = createOAuth2ClientCredentialsCache({
 *     tokenEndpoint: "https://identity.bitwarden.com/connect/token",
 *     clientId: env.BW_CLIENT_ID,
 *     clientSecret: env.BW_CLIENT_SECRET,
 *     scope: "api",
 *   });
 *   const token = await bwCache.getToken();
 *   // Use token → if 401 → bwCache.invalidate() → retry
 *
 * @example
 *   // Auth0 M2M
 *   const auth0Cache = createOAuth2ClientCredentialsCache({
 *     tokenEndpoint: "https://my-tenant.us.auth0.com/oauth/token",
 *     clientId: env.AUTH0_CLIENT_ID,
 *     clientSecret: env.AUTH0_CLIENT_SECRET,
 *     scope: "read:users",
 *   });
 *   const token = await auth0Cache.getToken();
 */
export function createOAuth2ClientCredentialsCache(
  opts: OAuth2ClientCredentialsOptions,
): OAuth2TokenCache {
  const resolved: Required<OAuth2ClientCredentialsOptions> = {
    tokenEndpoint: opts.tokenEndpoint.replace(/\/+$/, ""),
    clientId: opts.clientId,
    clientSecret: opts.clientSecret,
    scope: opts.scope ?? "",
    refreshBufferSec: opts.refreshBufferSec ?? DEFAULT_REFRESH_BUFFER_SECONDS,
  };

  const key = _cacheKey(resolved.tokenEndpoint, resolved.clientId);

  return {
    async getToken(): Promise<string> {
      const now = Date.now();
      const cached = _cache.get(key);

      if (cached !== undefined && cached.expiresAt > now) {
        return cached.token;
      }

      const fresh = await _fetchToken(resolved);
      _cache.set(key, fresh);
      return fresh.token;
    },

    invalidate(): void {
      _cache.delete(key);
    },
  };
}

// ---------------------------------------------------------------------------
// Vitest unit tests (co-located — run with `vitest run src/utils/oauth2-client-credentials-cache.ts`)
// ---------------------------------------------------------------------------

if (import.meta.vitest) {
  const { describe, it, expect, vi, beforeEach } = import.meta.vitest;

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  function mockSuccessResponse(
    token = "test-access-token",
    expiresIn = 3600,
  ): Response {
    return new Response(
      JSON.stringify({
        access_token: token,
        expires_in: expiresIn,
        token_type: "Bearer",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  function mockErrorResponse(status: number, body = "Unauthorized"): Response {
    return new Response(body, { status });
  }

  const BW_OPTS: OAuth2ClientCredentialsOptions = {
    tokenEndpoint: "https://identity.bitwarden.com/connect/token",
    clientId: "bw-client-id",
    clientSecret: "bw-client-secret",
    scope: "api",
  };

  const AUTH0_OPTS: OAuth2ClientCredentialsOptions = {
    tokenEndpoint: "https://my-tenant.us.auth0.com/oauth/token",
    clientId: "auth0-client-id",
    clientSecret: "auth0-client-secret",
    scope: "read:users",
  };

  // Reset module-level cache map before each test so tests are hermetic.
  beforeEach(() => {
    _cache.clear();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------

  describe("getToken — happy path", () => {
    it("fetches a token and returns it as a string", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockSuccessResponse()));
      const cache = createOAuth2ClientCredentialsCache(BW_OPTS);
      const token = await cache.getToken();
      expect(token).toBe("test-access-token");
    });

    it("sends grant_type=client_credentials with client_id and client_secret", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSuccessResponse());
      vi.stubGlobal("fetch", mockFetch);
      const cache = createOAuth2ClientCredentialsCache(BW_OPTS);
      await cache.getToken();
      const body = mockFetch.mock.calls[0][1].body as string;
      expect(body).toContain("grant_type=client_credentials");
      expect(body).toContain("client_id=bw-client-id");
      expect(body).toContain("client_secret=bw-client-secret");
      expect(body).toContain("scope=api");
    });

    it("omits scope param when scope is not provided", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSuccessResponse());
      vi.stubGlobal("fetch", mockFetch);
      const cache = createOAuth2ClientCredentialsCache({
        tokenEndpoint: "https://example.com/token",
        clientId: "cid",
        clientSecret: "csec",
      });
      await cache.getToken();
      const body = mockFetch.mock.calls[0][1].body as string;
      expect(body).not.toContain("scope=");
    });

    it("strips trailing slash from tokenEndpoint", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSuccessResponse());
      vi.stubGlobal("fetch", mockFetch);
      const cache = createOAuth2ClientCredentialsCache({
        ...BW_OPTS,
        tokenEndpoint: "https://identity.bitwarden.com/connect/token/",
      });
      await cache.getToken();
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toBe("https://identity.bitwarden.com/connect/token");
    });

    it("caches the token and does not fetch again on the second call", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSuccessResponse());
      vi.stubGlobal("fetch", mockFetch);
      const cache = createOAuth2ClientCredentialsCache(BW_OPTS);
      await cache.getToken();
      await cache.getToken();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------

  describe("getToken — independent cache per provider", () => {
    it("caches Bitwarden and Auth0 tokens independently", async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(mockSuccessResponse("bw-token"))
        .mockResolvedValueOnce(mockSuccessResponse("auth0-token"));
      vi.stubGlobal("fetch", mockFetch);

      const bwCache = createOAuth2ClientCredentialsCache(BW_OPTS);
      const auth0Cache = createOAuth2ClientCredentialsCache(AUTH0_OPTS);

      const bwToken = await bwCache.getToken();
      const auth0Token = await auth0Cache.getToken();

      expect(bwToken).toBe("bw-token");
      expect(auth0Token).toBe("auth0-token");
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Second calls must hit cache — no more fetches
      await bwCache.getToken();
      await auth0Cache.getToken();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("invalidating one provider does not affect the other", async () => {
      const mockFetch = vi.fn()
        .mockResolvedValue(mockSuccessResponse("shared-token"));
      vi.stubGlobal("fetch", mockFetch);

      const bwCache = createOAuth2ClientCredentialsCache(BW_OPTS);
      const auth0Cache = createOAuth2ClientCredentialsCache(AUTH0_OPTS);

      await bwCache.getToken();
      await auth0Cache.getToken();

      bwCache.invalidate();

      await auth0Cache.getToken(); // should hit cache — no new fetch
      expect(mockFetch).toHaveBeenCalledTimes(2);

      await bwCache.getToken(); // must re-fetch
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  // -------------------------------------------------------------------------

  describe("getToken — cache expiry", () => {
    it("re-fetches when the cached token is expired", async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(mockSuccessResponse("first-token", 61))
        .mockResolvedValueOnce(mockSuccessResponse("second-token", 3600));
      vi.stubGlobal("fetch", mockFetch);

      const cache = createOAuth2ClientCredentialsCache(BW_OPTS);
      const first = await cache.getToken();
      expect(first).toBe("first-token");

      // expires_in=61, buffer=60 → effective TTL = 1s
      vi.useFakeTimers();
      vi.advanceTimersByTime(2_000);
      const second = await cache.getToken();
      expect(second).toBe("second-token");
      expect(mockFetch).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    });

    it("respects a custom refreshBufferSec", async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(mockSuccessResponse("first", 120))
        .mockResolvedValueOnce(mockSuccessResponse("second", 3600));
      vi.stubGlobal("fetch", mockFetch);

      const cache = createOAuth2ClientCredentialsCache({
        ...BW_OPTS,
        refreshBufferSec: 100,
      });
      await cache.getToken();

      vi.useFakeTimers();
      vi.advanceTimersByTime(25_000); // 25s past: 120-100=20s effective TTL exceeded
      const second = await cache.getToken();
      expect(second).toBe("second");
      vi.useRealTimers();
    });
  });

  // -------------------------------------------------------------------------

  describe("invalidate", () => {
    it("forces a fresh fetch on the next getToken call", async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(mockSuccessResponse("first-token"))
        .mockResolvedValueOnce(mockSuccessResponse("second-token"));
      vi.stubGlobal("fetch", mockFetch);

      const cache = createOAuth2ClientCredentialsCache(BW_OPTS);
      await cache.getToken();
      cache.invalidate();
      const second = await cache.getToken();

      expect(second).toBe("second-token");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("is safe to call when no token is cached", () => {
      const cache = createOAuth2ClientCredentialsCache(BW_OPTS);
      expect(() => cache.invalidate()).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------

  describe("OAuth2AuthError — error cases", () => {
    it("throws OAuth2AuthError on 401 from token endpoint", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(mockErrorResponse(401, "invalid_client")),
      );
      const cache = createOAuth2ClientCredentialsCache(BW_OPTS);
      await expect(cache.getToken()).rejects.toThrow(OAuth2AuthError);
    });

    it("exposes the HTTP status and body on the error", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(mockErrorResponse(403, "forbidden")),
      );
      const cache = createOAuth2ClientCredentialsCache(BW_OPTS);
      try {
        await cache.getToken();
      } catch (err) {
        expect(err).toBeInstanceOf(OAuth2AuthError);
        expect((err as OAuth2AuthError).status).toBe(403);
        expect((err as OAuth2AuthError).body).toBe("forbidden");
      }
    });

    it("throws OAuth2AuthError on network failure (status 0)", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
      );
      const cache = createOAuth2ClientCredentialsCache(BW_OPTS);
      const err = await cache.getToken().catch((e) => e);
      expect(err).toBeInstanceOf(OAuth2AuthError);
      expect((err as OAuth2AuthError).status).toBe(0);
    });

    it("throws OAuth2AuthError when access_token field is absent", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ token_type: "Bearer" }), { status: 200 }),
        ),
      );
      const cache = createOAuth2ClientCredentialsCache(BW_OPTS);
      await expect(cache.getToken()).rejects.toThrow(OAuth2AuthError);
    });

    it("throws OAuth2AuthError on non-JSON response body", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response("not-json", { status: 200 })),
      );
      const cache = createOAuth2ClientCredentialsCache(BW_OPTS);
      await expect(cache.getToken()).rejects.toThrow(OAuth2AuthError);
    });

    it("does NOT cache the token after a failed fetch", async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(mockErrorResponse(401))
        .mockResolvedValueOnce(mockSuccessResponse("valid-token"));
      vi.stubGlobal("fetch", mockFetch);

      const cache = createOAuth2ClientCredentialsCache(BW_OPTS);
      await expect(cache.getToken()).rejects.toThrow(OAuth2AuthError);
      const token = await cache.getToken();
      expect(token).toBe("valid-token");
    });

    it("falls back to 3600s TTL when expires_in is missing or zero", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({ access_token: "tok", token_type: "Bearer" }),
            { status: 200 },
          ),
        ),
      );
      const cache = createOAuth2ClientCredentialsCache(BW_OPTS);
      const token = await cache.getToken();
      expect(token).toBe("tok");
      // Cache entry should exist — a second call must NOT fetch again
      const mockFetch2 = vi.fn();
      vi.stubGlobal("fetch", mockFetch2);
      await cache.getToken();
      expect(mockFetch2).not.toHaveBeenCalled();
    });
  });
}
