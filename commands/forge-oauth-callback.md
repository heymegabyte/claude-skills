---
description: Scaffold a complete OAuth2 callback + init Hono route pair (code exchange, PKCE, KV token storage) for a named provider
argument-hint: <provider>  # auth0 | okta | cognito | pkce-auth0
allowed-tools: Bash, Read, Write, Edit, Glob
---

Scaffold a production-ready OAuth2 callback route + a matching `/oauth/start/:provider` init route for the named provider. Reads provider preset from `template/utils/<provider>-token-cache.ts` if present. One command, two routes, one E2E spec.

> **Pattern B — Write each file in a SEPARATE Write tool call. Do not batch into one.**

## Supported providers

| Provider | Flow | Notes |
|---|---|---|
| `auth0` | Authorization Code | Standard; no PKCE unless `pkce-auth0` chosen |
| `okta` | Authorization Code | OIDC-compatible; `.well-known/openid-configuration` discovery |
| `cognito` | Authorization Code | AWS; `TOKEN_ENDPOINT` from User Pool domain |
| `pkce-auth0` | Authorization Code + PKCE | Auth0 with S256 code challenge; no client secret needed |

> **M2M flag:** if user passes `bitwarden` or any provider described as M2M / client-credentials, print a clear warning:
> "M2M flows use client_credentials grant — there is no user callback. Use `/oauth/start/:provider` with grant_type=client_credentials to obtain a token server-side, then store it in KV. No callback route needed." Then exit — do not scaffold a callback for M2M.

## What gets generated

```
src/web/routes/
  oauth-callback.ts     ← GET /oauth/callback/:provider — code exchange + token KV storage
  oauth-init.ts         ← GET /oauth/start/:provider — state + PKCE setup + redirect to provider

e2e/oauth/
  <provider>.spec.ts    ← Playwright happy-path E2E
```

## Execution

```bash
PROVIDER="${ARGUMENTS%% *}"
echo "Forging OAuth routes for: $PROVIDER"
```

### Step 1 — validate provider arg

```bash
VALID="auth0 okta cognito pkce-auth0"
if ! echo "$VALID" | grep -qw "$PROVIDER"; then
  echo "ERROR: unknown provider '$PROVIDER'. Supported: $VALID"
  exit 1
fi
```

### Step 2 — read preset if present

```bash
ls template/utils/${PROVIDER}-token-cache.ts 2>/dev/null \
  && cat template/utils/${PROVIDER}-token-cache.ts \
  || echo "No preset found — will synthesize from provider defaults"
```

### Step 3 — detect project root + existing files

```bash
find . -maxdepth 3 -name "wrangler.jsonc" -o -name "wrangler.toml" | head -1
ls src/web/routes/ 2>/dev/null | head -20 || echo "no routes dir yet"
ls e2e/oauth/ 2>/dev/null || echo "no oauth E2E dir yet"
```

### Step 4 — write `src/web/routes/oauth-init.ts`

Write as **separate Write call**. File must contain:

```typescript
// src/web/routes/oauth-init.ts
import { Hono } from 'hono'
import { z } from 'zod'

// Provider configs (fill from preset or synthesize)
const PROVIDERS = {
  'auth0':     { authUrl: process.env.AUTH0_DOMAIN + '/authorize', clientId: process.env.AUTH0_CLIENT_ID, scope: 'openid profile email' },
  'okta':      { authUrl: process.env.OKTA_DOMAIN  + '/oauth2/v1/authorize', clientId: process.env.OKTA_CLIENT_ID, scope: 'openid profile email' },
  'cognito':   { authUrl: process.env.COGNITO_DOMAIN + '/oauth2/authorize', clientId: process.env.COGNITO_CLIENT_ID, scope: 'openid email' },
  'pkce-auth0':{ authUrl: process.env.AUTH0_DOMAIN + '/authorize', clientId: process.env.AUTH0_CLIENT_ID, scope: 'openid profile email' },
} as const

export const oauthInitApp = new Hono()

oauthInitApp.get('/start/:provider', async (c) => {
  const provider = c.req.param('provider') as keyof typeof PROVIDERS
  const config = PROVIDERS[provider]
  if (!config) return c.json({ error: 'unknown_provider' }, 400)

  const returnTo = c.req.query('return_to') ?? '/'
  const state    = crypto.randomUUID()

  // PKCE: generate code_verifier + code_challenge
  let codeVerifier: string | undefined
  let codeChallenge: string | undefined
  if (provider === 'pkce-auth0') {
    codeVerifier = generateCodeVerifier()
    codeChallenge = await generateCodeChallenge(codeVerifier)
  }

  // Persist state + verifier in KV (60s TTL — auth must complete within 1 min)
  const kv = (c.env as any).SESSIONS as KVNamespace
  await kv.put(`oauth:state:${state}`, JSON.stringify({ provider, returnTo, codeVerifier }), { expirationTtl: 600 })

  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     config.clientId ?? '',
    redirect_uri:  new URL('/oauth/callback/' + provider, c.req.url).toString(),
    scope:         config.scope,
    state,
    ...(codeChallenge ? { code_challenge: codeChallenge, code_challenge_method: 'S256' } : {}),
  })

  return c.redirect(`${config.authUrl}?${params.toString()}`)
})

// PKCE helpers
function generateCodeVerifier(): string {
  const buf = new Uint8Array(48)
  crypto.getRandomValues(buf)
  return btoa(String.fromCharCode(...buf)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data   = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'')
}
```

Adapt `PROVIDERS` map from the preset if one was found in Step 2. Preserve all keys and import paths that already exist in the project.

### Step 5 — write `src/web/routes/oauth-callback.ts`

Write as **separate Write call**. File must contain:

```typescript
// src/web/routes/oauth-callback.ts
import { Hono } from 'hono'
import { z } from 'zod'

const CallbackQuerySchema = z.object({
  code:  z.string().min(1),
  state: z.string().uuid(),
})

export const oauthCallbackApp = new Hono()

oauthCallbackApp.get('/callback/:provider', async (c) => {
  const provider = c.req.param('provider')
  const kv = (c.env as any).SESSIONS as KVNamespace

  // Parse + validate query params
  const parsed = CallbackQuerySchema.safeParse({
    code:  c.req.query('code'),
    state: c.req.query('state'),
  })
  if (!parsed.success) return c.json({ error: 'invalid_request' }, 400)
  const { code, state } = parsed.data

  // Load + verify state from KV
  const raw = await kv.get(`oauth:state:${state}`, 'json') as { provider: string; returnTo: string; codeVerifier?: string } | null
  if (!raw || raw.provider !== provider) return c.json({ error: 'state_mismatch' }, 400)
  await kv.delete(`oauth:state:${state}`)

  // Exchange code for token
  const tokens = await exchangeCode({ provider, code, codeVerifier: raw.codeVerifier, redirectUri: new URL('/oauth/callback/' + provider, c.req.url).toString() })
  if (!tokens.access_token) return c.json({ error: 'token_exchange_failed' }, 502)

  // Persist tokens in KV keyed by user session (derive session ID from state-based session or new UUID)
  const sessionId = crypto.randomUUID()
  await kv.put(`session:${sessionId}`, JSON.stringify({
    provider,
    access_token:  tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    expires_at:    tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : null,
  }), { expirationTtl: tokens.expires_in ?? 3600 })

  // Set session cookie + redirect
  c.header('Set-Cookie', `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Secure`)
  return c.redirect(raw.returnTo + '?login=success')
})

// Token exchange — extend with provider-specific TOKEN_ENDPOINT from env / preset
async function exchangeCode(opts: { provider: string; code: string; codeVerifier?: string; redirectUri: string }): Promise<Record<string, any>> {
  const tokenEndpoints: Record<string, string> = {
    'auth0':     (process.env.AUTH0_DOMAIN    ?? '') + '/oauth/token',
    'pkce-auth0':(process.env.AUTH0_DOMAIN    ?? '') + '/oauth/token',
    'okta':      (process.env.OKTA_DOMAIN     ?? '') + '/oauth2/v1/token',
    'cognito':   (process.env.COGNITO_DOMAIN  ?? '') + '/oauth2/token',
  }
  const endpoint = tokenEndpoints[opts.provider]
  if (!endpoint) throw new Error(`No token endpoint for provider: ${opts.provider}`)

  const body = new URLSearchParams({
    grant_type:   'authorization_code',
    code:         opts.code,
    redirect_uri: opts.redirectUri,
    client_id:    process.env[opts.provider.toUpperCase().replace('-', '_') + '_CLIENT_ID'] ?? '',
    ...(opts.codeVerifier ? { code_verifier: opts.codeVerifier } : { client_secret: process.env[opts.provider.toUpperCase().replace('-', '_') + '_CLIENT_SECRET'] ?? '' }),
  })

  const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  if (!res.ok) throw new Error(`Token exchange ${res.status}: ${await res.text()}`)
  return res.json()
}
```

Adapt `tokenEndpoints` and env var names from the preset if one was found in Step 2.

### Step 6 — write `e2e/oauth/<provider>.spec.ts`

Write as **separate Write call**.

```typescript
// e2e/oauth/<provider>.spec.ts
import { test, expect } from '@playwright/test'

const PROD_URL = process.env.PROD_URL ?? 'http://localhost:8787'

test.describe('<provider> OAuth flow — happy path', () => {
  test('GET /oauth/start/<provider> redirects to provider authorize URL', async ({ page }) => {
    const response = await page.goto(`${PROD_URL}/oauth/start/<provider>`)
    // Should redirect to provider auth page (not 4xx/5xx)
    expect(page.url()).toMatch(/(auth0|okta|amazon|localhost)/)
    await page.screenshot({ path: 'e2e/screenshots/oauth/<provider>/start.png', fullPage: true })
  })

  test('GET /oauth/callback/<provider> with bad state returns 400', async ({ request }) => {
    const res = await request.get(`${PROD_URL}/oauth/callback/<provider>?code=fake&state=00000000-0000-0000-0000-000000000000`)
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('state_mismatch')
  })

  test('GET /oauth/callback/<provider> with missing code returns 400', async ({ request }) => {
    const res = await request.get(`${PROD_URL}/oauth/callback/<provider>?state=00000000-0000-0000-0000-000000000000`)
    expect(res.status()).toBe(400)
  })
})
```

Replace `<provider>` with the actual provider arg throughout.

### Step 7 — print env secrets needed

```bash
echo ""
echo "=== Env vars to provision (wrangler secret put) ==="
case "$PROVIDER" in
  auth0|pkce-auth0)
    echo "  wrangler secret put AUTH0_DOMAIN"
    echo "  wrangler secret put AUTH0_CLIENT_ID"
    [[ "$PROVIDER" == "auth0" ]] && echo "  wrangler secret put AUTH0_CLIENT_SECRET"
    ;;
  okta)
    echo "  wrangler secret put OKTA_DOMAIN"
    echo "  wrangler secret put OKTA_CLIENT_ID"
    echo "  wrangler secret put OKTA_CLIENT_SECRET"
    ;;
  cognito)
    echo "  wrangler secret put COGNITO_DOMAIN"
    echo "  wrangler secret put COGNITO_CLIENT_ID"
    echo "  wrangler secret put COGNITO_CLIENT_SECRET"
    ;;
esac
echo ""
echo "Also ensure SESSIONS KV namespace is bound in wrangler.jsonc:"
echo '  [[kv_namespaces]]'
echo '  binding = "SESSIONS"'
echo '  id = "<your-kv-namespace-id>"'
```

### Step 8 — report

List every file written, note any preset loaded, print the 3 `wrangler secret put` commands. If any file already existed, note it was skipped. Flag if tests could not be run (missing dev server) and give the command to run them manually.

## Anti-patterns

- Do NOT store tokens in cookies directly — store only the opaque `sessionId`; full token lives in KV
- Do NOT skip state verification — CSRF is the most common OAuth attack vector
- Do NOT use `Math.random()` for state or code verifier — always `crypto.getRandomValues`
- Do NOT return 302 on token exchange failure — return 502 so callers can retry
- Do NOT log `access_token` or `refresh_token` values — log only `provider` + `expires_at`
- Do NOT use PKCE for server-side flows that already have a client secret — choose one
