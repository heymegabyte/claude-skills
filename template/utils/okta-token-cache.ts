/**
 * okta-token-cache.ts — OAuth2 client_credentials token cache for Okta
 *
 * Thin Okta-specific preset over the generic
 * {@link createOAuth2ClientCredentialsCache} utility. Defaults to Okta's
 * `default` authorization server (`/oauth2/default/v1/token`). Custom
 * authorization servers are supported via `authServerId`.
 *
 * Workers-compatible: uses Web Crypto + fetch only — zero Node.js built-ins.
 * Per [[state-is-the-enemy]] carve-out: ephemeral per-isolate cache, not shared
 * mutable state. No D1/KV/DO — each Worker isolate fetches its own token.
 *
 * @module okta-token-cache
 *
 * Typical flow:
 *   1. Call `getOktaToken(opts)` before every Okta-protected API request.
 *   2. The first call fetches a token and caches it.
 *   3. Subsequent calls return the cached token (near-zero latency).
 *   4. On 401 from downstream, call `invalidateOktaToken(opts)` then retry.
 *
 * @example
 *   const token = await getOktaToken({
 *     orgDomain: "my-org.okta.com",
 *     clientId: env.OKTA_CLIENT_ID,
 *     clientSecret: env.OKTA_CLIENT_SECRET,
 *     scope: "okta.users.read",
 *   });
 *   const res = await fetch("https://my-org.okta.com/api/v1/users", {
 *     headers: { Authorization: `Bearer ${token}` },
 *   });
 */

import {
  createOAuth2ClientCredentialsCache,
  OAuth2AuthError,
} from "./oauth2-client-credentials-cache.ts";

export type { OAuth2TokenCache } from "./oauth2-client-credentials-cache.ts";

// ---------------------------------------------------------------------------
// Re-export generic error as the Okta-branded name for call-site compat
// ---------------------------------------------------------------------------

/**
 * Thrown when Okta returns a non-2xx response during token fetch,
 * or when the network is unreachable.
 *
 * Alias of {@link OAuth2AuthError} — identical shape, Okta-branded name.
 *
 * @example
 *   try {
 *     const token = await getOktaToken(opts);
 *   } catch (err) {
 *     if (err instanceof OktaAuthError) {
 *       console.error("Okta M2M failure", err.status, err.body);
 *     }
 *   }
 */
export { OAuth2AuthError as OktaAuthError };

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

/** Default Okta authorization server ID. Okta orgs always have a `default` server. */
const DEFAULT_AUTH_SERVER_ID = "default";

/** Default token refresh buffer in seconds. */
const DEFAULT_REFRESH_BUFFER_SECONDS = 60;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Options for {@link getOktaToken}. */
export interface OktaTokenOptions {
  /**
   * Okta organization domain (without protocol or trailing slash).
   *
   * @example "my-org.okta.com"
   * @example "my-org.oktapreview.com"
   */
  orgDomain: string;
  /** OAuth2 client_id from the Okta service app. */
  clientId: string;
  /** OAuth2 client_secret from the Okta service app. */
  clientSecret: string;
  /**
   * Space-separated OAuth2 scope string.
   *
   * @example "okta.users.read"
   * @example "okta.groups.manage okta.users.manage"
   */
  scope: string;
  /**
   * Okta authorization server ID.
   * Omit to use the `default` server. Use a custom ID for non-default
   * authorization servers (e.g. `"aus1abc123"`).
   *
   * @default "default"
   */
  authServerId?: string;
}

// ---------------------------------------------------------------------------
// Module-level singleton cache keyed per orgDomain+authServerId+clientId+scope
// ---------------------------------------------------------------------------

import type { OAuth2TokenCache } from "./oauth2-client-credentials-cache.ts";

const _oktaCaches = new Map<string, OAuth2TokenCache>();

function _getOktaCache(opts: OktaTokenOptions): OAuth2TokenCache {
  const domain = opts.orgDomain.replace(/\/+$/, "");
  const authServerId = opts.authServerId ?? DEFAULT_AUTH_SERVER_ID;
  const key = `${domain}\x00${authServerId}\x00${opts.clientId}\x00${opts.scope}`;
  let c = _oktaCaches.get(key);
  if (!c) {
    c = createOAuth2ClientCredentialsCache({
      tokenEndpoint: `https://${domain}/oauth2/${authServerId}/v1/token`,
      clientId: opts.clientId,
      clientSecret: opts.clientSecret,
      scope: opts.scope,
      refreshBufferSec: DEFAULT_REFRESH_BUFFER_SECONDS,
    });
    _oktaCaches.set(key, c);
  }
  return c;
}

// ---------------------------------------------------------------------------
// getOktaToken
// ---------------------------------------------------------------------------

/**
 * Return a valid Okta Bearer token, fetching a new one only when the cached
 * token is absent or within 60 seconds of expiry.
 *
 * The returned string is ready to use as an `Authorization: Bearer <token>`
 * header value on Okta-protected API requests.
 *
 * Throws {@link OktaAuthError} on credential or network failure.
 *
 * @example
 *   const token = await getOktaToken({
 *     orgDomain: "my-org.okta.com",
 *     clientId: env.OKTA_CLIENT_ID,
 *     clientSecret: env.OKTA_CLIENT_SECRET,
 *     scope: "okta.users.read",
 *   });
 *   const res = await fetch("https://my-org.okta.com/api/v1/users", {
 *     headers: { Authorization: `Bearer ${token}` },
 *   });
 *
 * @example
 *   // Custom authorization server
 *   const token = await getOktaToken({
 *     orgDomain: "my-org.okta.com",
 *     clientId: env.OKTA_CLIENT_ID,
 *     clientSecret: env.OKTA_CLIENT_SECRET,
 *     scope: "custom.scope",
 *     authServerId: "aus1abc123",
 *   });
 */
export async function getOktaToken(opts: OktaTokenOptions): Promise<string> {
  return _getOktaCache(opts).getToken();
}

// ---------------------------------------------------------------------------
// invalidateOktaToken
// ---------------------------------------------------------------------------

/**
 * Evict the cached token, forcing {@link getOktaToken} to fetch a new one
 * on its next call.
 *
 * Call this immediately after receiving HTTP 401 from an Okta-protected API.
 *
 * When `opts` is omitted, invalidates ALL cached Okta tokens across all
 * org+server+client+scope combinations.
 *
 * @example
 *   if (res.status === 401) {
 *     invalidateOktaToken(opts);
 *     const freshToken = await getOktaToken(opts);
 *   }
 */
export function invalidateOktaToken(opts?: OktaTokenOptions): void {
  if (!opts) {
    for (const cache of _oktaCaches.values()) {
      cache.invalidate();
    }
    return;
  }
  _getOktaCache(opts).invalidate();
}

// ---------------------------------------------------------------------------
// Vitest unit tests (co-located)
// ---------------------------------------------------------------------------

if (import.meta.vitest) {
  const { describe, it, expect, vi, beforeEach } = import.meta.vitest;

  function mockSuccessResponse(
    token = "okta-access-token",
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

  const OPTS: OktaTokenOptions = {
    orgDomain: "my-org.okta.com",
    clientId: "okta-client-id",
    clientSecret: "okta-client-secret",
    scope: "okta.users.read",
  };

  beforeEach(() => {
    _oktaCaches.clear();
    vi.restoreAllMocks();
  });

  describe("getOktaToken — happy path", () => {
    it("fetches a token and returns it as a string", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockSuccessResponse()));
      const token = await getOktaToken(OPTS);
      expect(token).toBe("okta-access-token");
    });

    it("hits the default Okta authorization server endpoint", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSuccessResponse());
      vi.stubGlobal("fetch", mockFetch);
      await getOktaToken(OPTS);
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toBe("https://my-org.okta.com/oauth2/default/v1/token");
    });

    it("uses a custom authServerId when provided", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSuccessResponse());
      vi.stubGlobal("fetch", mockFetch);
      await getOktaToken({ ...OPTS, authServerId: "aus1abc123" });
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toBe("https://my-org.okta.com/oauth2/aus1abc123/v1/token");
    });

    it("strips trailing slash from orgDomain", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSuccessResponse());
      vi.stubGlobal("fetch", mockFetch);
      await getOktaToken({ ...OPTS, orgDomain: "my-org.okta.com/" });
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toBe("https://my-org.okta.com/oauth2/default/v1/token");
    });

    it("caches the token and does not fetch again on the second call", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSuccessResponse());
      vi.stubGlobal("fetch", mockFetch);
      await getOktaToken(OPTS);
      await getOktaToken(OPTS);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("sends scope in the request body", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSuccessResponse());
      vi.stubGlobal("fetch", mockFetch);
      await getOktaToken(OPTS);
      const body = mockFetch.mock.calls[0][1].body as string;
      expect(body).toContain("grant_type=client_credentials");
      expect(body).toContain("scope=okta.users.read");
    });
  });

  describe("getOktaToken — independent cache per authServerId", () => {
    it("caches tokens independently for default vs custom auth server", async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(mockSuccessResponse("default-token"))
        .mockResolvedValueOnce(mockSuccessResponse("custom-token"));
      vi.stubGlobal("fetch", mockFetch);

      const t1 = await getOktaToken(OPTS);
      const t2 = await getOktaToken({ ...OPTS, authServerId: "aus1abc123" });

      expect(t1).toBe("default-token");
      expect(t2).toBe("custom-token");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("invalidateOktaToken", () => {
    it("forces a fresh fetch on the next getOktaToken call", async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(mockSuccessResponse("first-token"))
        .mockResolvedValueOnce(mockSuccessResponse("second-token"));
      vi.stubGlobal("fetch", mockFetch);

      await getOktaToken(OPTS);
      invalidateOktaToken(OPTS);
      const second = await getOktaToken(OPTS);

      expect(second).toBe("second-token");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("is safe to call when no token is cached", () => {
      expect(() => invalidateOktaToken()).not.toThrow();
    });

    it("invalidates all caches when called with no args", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSuccessResponse("tok"));
      vi.stubGlobal("fetch", mockFetch);

      await getOktaToken(OPTS);
      await getOktaToken({ ...OPTS, authServerId: "aus1abc123" });

      invalidateOktaToken();

      await getOktaToken(OPTS);
      await getOktaToken({ ...OPTS, authServerId: "aus1abc123" });
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });

  describe("OktaAuthError — error cases", () => {
    it("throws OktaAuthError on 401 from token endpoint", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockErrorResponse(401, "invalid_client")));
      await expect(getOktaToken(OPTS)).rejects.toThrow(OAuth2AuthError);
    });

    it("exposes the HTTP status and body on the error", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockErrorResponse(403, "access_denied")));
      try {
        await getOktaToken(OPTS);
      } catch (err) {
        expect(err).toBeInstanceOf(OAuth2AuthError);
        expect((err as OAuth2AuthError).status).toBe(403);
        expect((err as OAuth2AuthError).body).toBe("access_denied");
      }
    });

    it("throws OktaAuthError on network failure", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
      const err = await getOktaToken(OPTS).catch((e) => e);
      expect(err).toBeInstanceOf(OAuth2AuthError);
      expect((err as OAuth2AuthError).status).toBe(0);
    });

    it("does NOT cache the token after a failed fetch", async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(mockErrorResponse(401))
        .mockResolvedValueOnce(mockSuccessResponse("valid-token"));
      vi.stubGlobal("fetch", mockFetch);

      await expect(getOktaToken(OPTS)).rejects.toThrow(OAuth2AuthError);
      const token = await getOktaToken(OPTS);
      expect(token).toBe("valid-token");
    });

    it("throws OktaAuthError when response has no access_token", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ token_type: "Bearer" }), { status: 200 }),
        ),
      );
      await expect(getOktaToken(OPTS)).rejects.toThrow(OAuth2AuthError);
    });
  });
}
