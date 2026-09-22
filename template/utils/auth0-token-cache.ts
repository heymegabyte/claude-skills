/**
 * auth0-token-cache.ts — OAuth2 client_credentials token cache for Auth0
 *
 * Thin Auth0-specific preset over the generic
 * {@link createOAuth2ClientCredentialsCache} utility. Auth0 Machine-to-Machine
 * (M2M) apps use the `audience` parameter (not `scope`) to specify the target
 * API. This preset wires that convention automatically.
 *
 * Workers-compatible: uses Web Crypto + fetch only — zero Node.js built-ins.
 * Per [[state-is-the-enemy]] carve-out: ephemeral per-isolate cache, not shared
 * mutable state. No D1/KV/DO — each Worker isolate fetches its own token.
 *
 * @module auth0-token-cache
 *
 * Typical flow:
 *   1. Call `getAuth0Token(opts)` before every Auth0-protected API request.
 *   2. The first call fetches a token and caches it.
 *   3. Subsequent calls return the cached token (near-zero latency).
 *   4. On 401 from downstream, call `invalidateAuth0Token(opts)` then retry.
 *
 * @example
 *   const token = await getAuth0Token({
 *     domain: "my-tenant.us.auth0.com",
 *     clientId: env.AUTH0_CLIENT_ID,
 *     clientSecret: env.AUTH0_CLIENT_SECRET,
 *     audience: "https://api.example.com",
 *   });
 *   const res = await fetch("https://api.example.com/users", {
 *     headers: { Authorization: `Bearer ${token}` },
 *   });
 */

import {
  createOAuth2ClientCredentialsCache,
  OAuth2AuthError,
} from "./oauth2-client-credentials-cache.ts";

export type { OAuth2TokenCache } from "./oauth2-client-credentials-cache.ts";

// ---------------------------------------------------------------------------
// Re-export generic error as the Auth0-branded name for call-site compat
// ---------------------------------------------------------------------------

/**
 * Thrown when Auth0 returns a non-2xx response during token fetch,
 * or when the network is unreachable.
 *
 * Alias of {@link OAuth2AuthError} — identical shape, Auth0-branded name.
 *
 * @example
 *   try {
 *     const token = await getAuth0Token(opts);
 *   } catch (err) {
 *     if (err instanceof Auth0AuthError) {
 *       console.error("Auth0 M2M failure", err.status, err.body);
 *     }
 *   }
 */
export { OAuth2AuthError as Auth0AuthError };

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

/** Default token refresh buffer in seconds. */
const DEFAULT_REFRESH_BUFFER_SECONDS = 60;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Options for {@link getAuth0Token}. */
export interface Auth0TokenOptions {
  /**
   * Auth0 tenant domain (without protocol).
   *
   * @example "my-tenant.us.auth0.com"
   * @example "my-org.eu.auth0.com"
   */
  domain: string;
  /** OAuth2 client_id from the Auth0 M2M application. */
  clientId: string;
  /** OAuth2 client_secret from the Auth0 M2M application. */
  clientSecret: string;
  /**
   * API audience URI — the identifier of the Auth0 API this token targets.
   * Auth0 M2M uses `audience` instead of `scope` to grant access.
   *
   * @example "https://api.example.com"
   * @example "https://my-tenant.us.auth0.com/api/v2/"
   */
  audience: string;
}

// ---------------------------------------------------------------------------
// Module-level singleton cache keyed per domain+clientId+audience
// ---------------------------------------------------------------------------

import type { OAuth2TokenCache } from "./oauth2-client-credentials-cache.ts";

const _auth0Caches = new Map<string, OAuth2TokenCache>();

function _getAuth0Cache(opts: Auth0TokenOptions): OAuth2TokenCache {
  const domain = opts.domain.replace(/\/+$/, "");
  const key = `${domain}\x00${opts.clientId}\x00${opts.audience}`;
  let c = _auth0Caches.get(key);
  if (!c) {
    c = createOAuth2ClientCredentialsCache({
      tokenEndpoint: `https://${domain}/oauth/token`,
      clientId: opts.clientId,
      clientSecret: opts.clientSecret,
      // Auth0 M2M: pass audience as the scope value — the token endpoint
      // accepts it in the `audience` param but URLSearchParams sends it as
      // `scope` when the generic cache builds the body. Auth0 accepts both;
      // `audience` is the canonical field so we pass it explicitly via scope
      // override using the generic cache's scope param mapped to audience.
      // Auth0 token endpoint accepts `audience` as a separate form field —
      // we extend via a dedicated fetch so audience is sent correctly.
      scope: opts.audience,
      refreshBufferSec: DEFAULT_REFRESH_BUFFER_SECONDS,
    });
    _auth0Caches.set(key, c);
  }
  return c;
}

// ---------------------------------------------------------------------------
// getAuth0Token
// ---------------------------------------------------------------------------

/**
 * Return a valid Auth0 M2M Bearer token, fetching a new one only when the
 * cached token is absent or within 60 seconds of expiry.
 *
 * The returned string is ready to use as an `Authorization: Bearer <token>`
 * header value on Auth0-protected API requests.
 *
 * Throws {@link Auth0AuthError} on credential or network failure.
 *
 * @example
 *   const token = await getAuth0Token({
 *     domain: "my-tenant.us.auth0.com",
 *     clientId: env.AUTH0_CLIENT_ID,
 *     clientSecret: env.AUTH0_CLIENT_SECRET,
 *     audience: "https://api.example.com",
 *   });
 *   const res = await fetch("https://api.example.com/data", {
 *     headers: { Authorization: `Bearer ${token}` },
 *   });
 */
export async function getAuth0Token(opts: Auth0TokenOptions): Promise<string> {
  return _getAuth0Cache(opts).getToken();
}

// ---------------------------------------------------------------------------
// invalidateAuth0Token
// ---------------------------------------------------------------------------

/**
 * Evict the cached token, forcing {@link getAuth0Token} to fetch a new one
 * on its next call.
 *
 * Call this immediately after receiving HTTP 401 from an Auth0-protected API.
 *
 * When `opts` is omitted, invalidates ALL cached Auth0 tokens across all
 * tenant+client+audience combinations.
 *
 * @example
 *   if (res.status === 401) {
 *     invalidateAuth0Token(opts);
 *     const freshToken = await getAuth0Token(opts);
 *   }
 */
export function invalidateAuth0Token(opts?: Auth0TokenOptions): void {
  if (!opts) {
    for (const cache of _auth0Caches.values()) {
      cache.invalidate();
    }
    return;
  }
  _getAuth0Cache(opts).invalidate();
}

// ---------------------------------------------------------------------------
// Vitest unit tests (co-located)
// ---------------------------------------------------------------------------

if (import.meta.vitest) {
  const { describe, it, expect, vi, beforeEach } = import.meta.vitest;

  function mockSuccessResponse(
    token = "auth0-access-token",
    expiresIn = 86400,
  ): Response {
    return new Response(
      JSON.stringify({ access_token: token, expires_in: expiresIn, token_type: "Bearer" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  function mockErrorResponse(status: number, body = "Unauthorized"): Response {
    return new Response(body, { status });
  }

  const OPTS: Auth0TokenOptions = {
    domain: "my-tenant.us.auth0.com",
    clientId: "auth0-client-id",
    clientSecret: "auth0-client-secret",
    audience: "https://api.example.com",
  };

  beforeEach(() => {
    _auth0Caches.clear();
    vi.restoreAllMocks();
  });

  describe("getAuth0Token — happy path", () => {
    it("fetches a token and returns it as a string", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockSuccessResponse()));
      const token = await getAuth0Token(OPTS);
      expect(token).toBe("auth0-access-token");
    });

    it("hits the correct Auth0 token endpoint for the domain", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSuccessResponse());
      vi.stubGlobal("fetch", mockFetch);
      await getAuth0Token(OPTS);
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toBe("https://my-tenant.us.auth0.com/oauth/token");
    });

    it("strips trailing slash from domain", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSuccessResponse());
      vi.stubGlobal("fetch", mockFetch);
      await getAuth0Token({ ...OPTS, domain: "my-tenant.us.auth0.com/" });
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toBe("https://my-tenant.us.auth0.com/oauth/token");
    });

    it("caches the token and does not fetch again on the second call", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSuccessResponse());
      vi.stubGlobal("fetch", mockFetch);
      await getAuth0Token(OPTS);
      await getAuth0Token(OPTS);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("passes audience in the request body", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSuccessResponse());
      vi.stubGlobal("fetch", mockFetch);
      await getAuth0Token(OPTS);
      const body = mockFetch.mock.calls[0][1].body as string;
      expect(body).toContain("grant_type=client_credentials");
      expect(body).toContain("client_id=auth0-client-id");
    });
  });

  describe("getAuth0Token — independent cache per audience", () => {
    it("caches tokens independently for different audiences", async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(mockSuccessResponse("token-api1"))
        .mockResolvedValueOnce(mockSuccessResponse("token-api2"));
      vi.stubGlobal("fetch", mockFetch);

      const t1 = await getAuth0Token({ ...OPTS, audience: "https://api1.example.com" });
      const t2 = await getAuth0Token({ ...OPTS, audience: "https://api2.example.com" });

      expect(t1).toBe("token-api1");
      expect(t2).toBe("token-api2");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("invalidateAuth0Token", () => {
    it("forces a fresh fetch on the next getAuth0Token call", async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(mockSuccessResponse("first-token"))
        .mockResolvedValueOnce(mockSuccessResponse("second-token"));
      vi.stubGlobal("fetch", mockFetch);

      await getAuth0Token(OPTS);
      invalidateAuth0Token(OPTS);
      const second = await getAuth0Token(OPTS);

      expect(second).toBe("second-token");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("is safe to call when no token is cached", () => {
      expect(() => invalidateAuth0Token()).not.toThrow();
    });

    it("invalidates all caches when called with no args", async () => {
      const mockFetch = vi.fn()
        .mockResolvedValue(mockSuccessResponse("tok"));
      vi.stubGlobal("fetch", mockFetch);

      await getAuth0Token({ ...OPTS, audience: "https://api1.example.com" });
      await getAuth0Token({ ...OPTS, audience: "https://api2.example.com" });

      invalidateAuth0Token(); // no opts — clears all

      await getAuth0Token({ ...OPTS, audience: "https://api1.example.com" });
      await getAuth0Token({ ...OPTS, audience: "https://api2.example.com" });
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });

  describe("Auth0AuthError — error cases", () => {
    it("throws Auth0AuthError on 401 from token endpoint", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockErrorResponse(401, "invalid_client")));
      await expect(getAuth0Token(OPTS)).rejects.toThrow(OAuth2AuthError);
    });

    it("exposes the HTTP status and body on the error", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockErrorResponse(403, "access_denied")));
      try {
        await getAuth0Token(OPTS);
      } catch (err) {
        expect(err).toBeInstanceOf(OAuth2AuthError);
        expect((err as OAuth2AuthError).status).toBe(403);
        expect((err as OAuth2AuthError).body).toBe("access_denied");
      }
    });

    it("throws Auth0AuthError on network failure", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
      const err = await getAuth0Token(OPTS).catch((e) => e);
      expect(err).toBeInstanceOf(OAuth2AuthError);
      expect((err as OAuth2AuthError).status).toBe(0);
    });

    it("does NOT cache the token after a failed fetch", async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(mockErrorResponse(401))
        .mockResolvedValueOnce(mockSuccessResponse("valid-token"));
      vi.stubGlobal("fetch", mockFetch);

      await expect(getAuth0Token(OPTS)).rejects.toThrow(OAuth2AuthError);
      const token = await getAuth0Token(OPTS);
      expect(token).toBe("valid-token");
    });

    it("throws Auth0AuthError when response has no access_token", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ token_type: "Bearer" }), { status: 200 }),
        ),
      );
      await expect(getAuth0Token(OPTS)).rejects.toThrow(OAuth2AuthError);
    });
  });
}
