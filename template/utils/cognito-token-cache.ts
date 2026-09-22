/**
 * cognito-token-cache.ts — OAuth2 client_credentials token cache for AWS Cognito
 *
 * Thin AWS Cognito-specific preset over the generic
 * {@link createOAuth2ClientCredentialsCache} utility. Cognito User Pool app
 * clients with a client secret use the standard OAuth2 `client_credentials`
 * grant against the Cognito hosted UI domain.
 *
 * Token endpoint pattern:
 *   `https://{userPoolDomain}.auth.{region}.amazoncognito.com/oauth2/token`
 *
 * Workers-compatible: uses Web Crypto + fetch only — zero Node.js built-ins.
 * Per [[state-is-the-enemy]] carve-out: ephemeral per-isolate cache, not shared
 * mutable state. No D1/KV/DO — each Worker isolate fetches its own token.
 *
 * @module cognito-token-cache
 *
 * Typical flow:
 *   1. Call `getCognitoToken(opts)` before every Cognito-protected API request.
 *   2. The first call fetches a token and caches it.
 *   3. Subsequent calls return the cached token (near-zero latency).
 *   4. On 401 from downstream, call `invalidateCognitoToken(opts)` then retry.
 *
 * @example
 *   const token = await getCognitoToken({
 *     region: "us-east-1",
 *     userPoolDomain: "my-app-pool",
 *     clientId: env.COGNITO_CLIENT_ID,
 *     clientSecret: env.COGNITO_CLIENT_SECRET,
 *     scope: "my-api/read",
 *   });
 *   const res = await fetch("https://api.example.com/resource", {
 *     headers: { Authorization: `Bearer ${token}` },
 *   });
 */

import {
  createOAuth2ClientCredentialsCache,
  OAuth2AuthError,
} from "./oauth2-client-credentials-cache.ts";

export type { OAuth2TokenCache } from "./oauth2-client-credentials-cache.ts";

// ---------------------------------------------------------------------------
// Re-export generic error as the Cognito-branded name for call-site compat
// ---------------------------------------------------------------------------

/**
 * Thrown when Cognito returns a non-2xx response during token fetch,
 * or when the network is unreachable.
 *
 * Alias of {@link OAuth2AuthError} — identical shape, Cognito-branded name.
 *
 * @example
 *   try {
 *     const token = await getCognitoToken(opts);
 *   } catch (err) {
 *     if (err instanceof CognitoAuthError) {
 *       console.error("Cognito M2M failure", err.status, err.body);
 *     }
 *   }
 */
export { OAuth2AuthError as CognitoAuthError };

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

/** Default token refresh buffer in seconds. */
const DEFAULT_REFRESH_BUFFER_SECONDS = 60;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Options for {@link getCognitoToken}. */
export interface CognitoTokenOptions {
  /**
   * AWS region the Cognito User Pool is in.
   *
   * @example "us-east-1"
   * @example "eu-west-1"
   */
  region: string;
  /**
   * Cognito User Pool domain prefix (the subdomain portion only, not the full
   * FQDN). This is the value configured in User Pool → App integration →
   * Domain name.
   *
   * @example "my-app-pool"  (resolves to my-app-pool.auth.us-east-1.amazoncognito.com)
   */
  userPoolDomain: string;
  /** OAuth2 client_id from the Cognito app client. */
  clientId: string;
  /** OAuth2 client_secret from the Cognito app client (required for M2M). */
  clientSecret: string;
  /**
   * Space-separated OAuth2 scope string. Scopes must be defined as resource
   * server scopes in the Cognito User Pool and attached to the app client.
   *
   * @example "my-api/read"
   * @example "my-api/read my-api/write"
   */
  scope: string;
}

// ---------------------------------------------------------------------------
// Module-level singleton cache keyed per region+domain+clientId+scope
// ---------------------------------------------------------------------------

import type { OAuth2TokenCache } from "./oauth2-client-credentials-cache.ts";

const _cognitoCaches = new Map<string, OAuth2TokenCache>();

function _getCognitoCache(opts: CognitoTokenOptions): OAuth2TokenCache {
  const domain = opts.userPoolDomain.replace(/\/+$/, "");
  const key = `${opts.region}\x00${domain}\x00${opts.clientId}\x00${opts.scope}`;
  let c = _cognitoCaches.get(key);
  if (!c) {
    c = createOAuth2ClientCredentialsCache({
      tokenEndpoint: `https://${domain}.auth.${opts.region}.amazoncognito.com/oauth2/token`,
      clientId: opts.clientId,
      clientSecret: opts.clientSecret,
      scope: opts.scope,
      refreshBufferSec: DEFAULT_REFRESH_BUFFER_SECONDS,
    });
    _cognitoCaches.set(key, c);
  }
  return c;
}

// ---------------------------------------------------------------------------
// getCognitoToken
// ---------------------------------------------------------------------------

/**
 * Return a valid AWS Cognito Bearer token, fetching a new one only when the
 * cached token is absent or within 60 seconds of expiry.
 *
 * The returned string is ready to use as an `Authorization: Bearer <token>`
 * header value on Cognito-protected API requests.
 *
 * Throws {@link CognitoAuthError} on credential or network failure.
 *
 * @example
 *   const token = await getCognitoToken({
 *     region: "us-east-1",
 *     userPoolDomain: "my-app-pool",
 *     clientId: env.COGNITO_CLIENT_ID,
 *     clientSecret: env.COGNITO_CLIENT_SECRET,
 *     scope: "my-api/read",
 *   });
 *   const res = await fetch("https://api.example.com/resource", {
 *     headers: { Authorization: `Bearer ${token}` },
 *   });
 */
export async function getCognitoToken(
  opts: CognitoTokenOptions,
): Promise<string> {
  return _getCognitoCache(opts).getToken();
}

// ---------------------------------------------------------------------------
// invalidateCognitoToken
// ---------------------------------------------------------------------------

/**
 * Evict the cached token, forcing {@link getCognitoToken} to fetch a new one
 * on its next call.
 *
 * Call this immediately after receiving HTTP 401 from a Cognito-protected API.
 *
 * When `opts` is omitted, invalidates ALL cached Cognito tokens across all
 * region+domain+client+scope combinations.
 *
 * @example
 *   if (res.status === 401) {
 *     invalidateCognitoToken(opts);
 *     const freshToken = await getCognitoToken(opts);
 *   }
 */
export function invalidateCognitoToken(opts?: CognitoTokenOptions): void {
  if (!opts) {
    for (const cache of _cognitoCaches.values()) {
      cache.invalidate();
    }
    return;
  }
  _getCognitoCache(opts).invalidate();
}

// ---------------------------------------------------------------------------
// Vitest unit tests (co-located)
// ---------------------------------------------------------------------------

if (import.meta.vitest) {
  const { describe, it, expect, vi, beforeEach } = import.meta.vitest;

  function mockSuccessResponse(
    token = "cognito-access-token",
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

  const OPTS: CognitoTokenOptions = {
    region: "us-east-1",
    userPoolDomain: "my-app-pool",
    clientId: "cognito-client-id",
    clientSecret: "cognito-client-secret",
    scope: "my-api/read",
  };

  beforeEach(() => {
    _cognitoCaches.clear();
    vi.restoreAllMocks();
  });

  describe("getCognitoToken — happy path", () => {
    it("fetches a token and returns it as a string", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockSuccessResponse()));
      const token = await getCognitoToken(OPTS);
      expect(token).toBe("cognito-access-token");
    });

    it("hits the correct Cognito token endpoint", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSuccessResponse());
      vi.stubGlobal("fetch", mockFetch);
      await getCognitoToken(OPTS);
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toBe(
        "https://my-app-pool.auth.us-east-1.amazoncognito.com/oauth2/token",
      );
    });

    it("interpolates region into the token endpoint URL", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSuccessResponse());
      vi.stubGlobal("fetch", mockFetch);
      await getCognitoToken({ ...OPTS, region: "eu-west-1" });
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("eu-west-1.amazoncognito.com");
    });

    it("strips trailing slash from userPoolDomain", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSuccessResponse());
      vi.stubGlobal("fetch", mockFetch);
      await getCognitoToken({ ...OPTS, userPoolDomain: "my-app-pool/" });
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toBe(
        "https://my-app-pool.auth.us-east-1.amazoncognito.com/oauth2/token",
      );
    });

    it("caches the token and does not fetch again on the second call", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSuccessResponse());
      vi.stubGlobal("fetch", mockFetch);
      await getCognitoToken(OPTS);
      await getCognitoToken(OPTS);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("sends scope in the request body", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSuccessResponse());
      vi.stubGlobal("fetch", mockFetch);
      await getCognitoToken(OPTS);
      const body = mockFetch.mock.calls[0][1].body as string;
      expect(body).toContain("grant_type=client_credentials");
      expect(body).toContain("scope=my-api%2Fread");
    });
  });

  describe("getCognitoToken — independent cache per region+scope", () => {
    it("caches tokens independently for different regions", async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(mockSuccessResponse("us-token"))
        .mockResolvedValueOnce(mockSuccessResponse("eu-token"));
      vi.stubGlobal("fetch", mockFetch);

      const t1 = await getCognitoToken({ ...OPTS, region: "us-east-1" });
      const t2 = await getCognitoToken({ ...OPTS, region: "eu-west-1" });

      expect(t1).toBe("us-token");
      expect(t2).toBe("eu-token");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("invalidateCognitoToken", () => {
    it("forces a fresh fetch on the next getCognitoToken call", async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(mockSuccessResponse("first-token"))
        .mockResolvedValueOnce(mockSuccessResponse("second-token"));
      vi.stubGlobal("fetch", mockFetch);

      await getCognitoToken(OPTS);
      invalidateCognitoToken(OPTS);
      const second = await getCognitoToken(OPTS);

      expect(second).toBe("second-token");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("is safe to call when no token is cached", () => {
      expect(() => invalidateCognitoToken()).not.toThrow();
    });

    it("invalidates all caches when called with no args", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSuccessResponse("tok"));
      vi.stubGlobal("fetch", mockFetch);

      await getCognitoToken({ ...OPTS, region: "us-east-1" });
      await getCognitoToken({ ...OPTS, region: "eu-west-1" });

      invalidateCognitoToken();

      await getCognitoToken({ ...OPTS, region: "us-east-1" });
      await getCognitoToken({ ...OPTS, region: "eu-west-1" });
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });

  describe("CognitoAuthError — error cases", () => {
    it("throws CognitoAuthError on 401 from token endpoint", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockErrorResponse(401, "invalid_client")));
      await expect(getCognitoToken(OPTS)).rejects.toThrow(OAuth2AuthError);
    });

    it("exposes the HTTP status and body on the error", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockErrorResponse(400, "invalid_scope")));
      try {
        await getCognitoToken(OPTS);
      } catch (err) {
        expect(err).toBeInstanceOf(OAuth2AuthError);
        expect((err as OAuth2AuthError).status).toBe(400);
        expect((err as OAuth2AuthError).body).toBe("invalid_scope");
      }
    });

    it("throws CognitoAuthError on network failure", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
      const err = await getCognitoToken(OPTS).catch((e) => e);
      expect(err).toBeInstanceOf(OAuth2AuthError);
      expect((err as OAuth2AuthError).status).toBe(0);
    });

    it("does NOT cache the token after a failed fetch", async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(mockErrorResponse(401))
        .mockResolvedValueOnce(mockSuccessResponse("valid-token"));
      vi.stubGlobal("fetch", mockFetch);

      await expect(getCognitoToken(OPTS)).rejects.toThrow(OAuth2AuthError);
      const token = await getCognitoToken(OPTS);
      expect(token).toBe("valid-token");
    });

    it("throws CognitoAuthError when response has no access_token", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ token_type: "Bearer" }), { status: 200 }),
        ),
      );
      await expect(getCognitoToken(OPTS)).rejects.toThrow(OAuth2AuthError);
    });

    it("throws CognitoAuthError on non-JSON response body", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response("not-json", { status: 200 })),
      );
      await expect(getCognitoToken(OPTS)).rejects.toThrow(OAuth2AuthError);
    });
  });
}
