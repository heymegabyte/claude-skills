---
name: "cf-zero-trust-access"
priority: 2
pack: "architecture"
triggers:
  - "zero trust"
  - "CF Access"
  - "cloudflare access"
  - "access policy"
  - "admin dashboard"
  - "internal tool"
  - "beta feature"
  - "JWT verification"
  - "protect route"
  - "auth without boilerplate"
paths:
  - "**/wrangler.{toml,jsonc}"
  - "**/middleware*"
  - "**/admin/**"
  - "**/internal/**"
---

# CF Zero Trust Access

Protect Worker routes with identity-aware access policies — no auth boilerplate, no session management, no login UI to build. CF Access sits in front of your Worker, validates identity via your IdP (Google, GitHub, Okta, Azure AD, etc.), issues a signed JWT, and forwards it on every request.

Source: `developers.cloudflare.com/cloudflare-one`, `@hono/cloudflare-access`. See `[[cloudflare-lock-in-is-leverage]]`.

## When to use CF Access vs Clerk

| Scenario | Use |
|---|---|
| Admin dashboard, internal tooling, `/admin/*` routes | **CF Access** — zero code, IdP-backed, audit logs included |
| End-user SaaS login, multi-tenant user accounts | **Clerk** — full UI, magic links, MFA, org management |
| Beta feature gate for specific emails/groups | **CF Access** — policy by email list or IdP group |
| Machine-to-machine (M2M) service tokens | **CF Access** — service tokens with no human login |
| Developer tools, staging environments | **CF Access** — one policy, no env vars in app code |

## Setup (CF Dashboard)

1. Zero Trust → Access → Applications → Add an application → Self-hosted
2. Set **Application domain**: `admin.yourdomain.com` or `yourdomain.com/admin/*`
3. Create policy: Allow → Include → Emails / Email domain / IdP group / Everyone
4. Copy the **Audience tag** (AUD) — needed for JWT verification
5. Note your **Team domain**: `your-team.cloudflareaccess.com`

CF now intercepts every request to that path, redirects unauthenticated users to your IdP login, and forwards authenticated requests with a signed `Cf-Access-Jwt-Assertion` header.

## JWT structure

CF Access injects this header on every authenticated request:

```
Cf-Access-Jwt-Assertion: eyJ...
```

Claims in the payload:

```json
{
  "iss": "https://your-team.cloudflareaccess.com",
  "aud": ["your-application-audience-tag"],
  "email": "brian@megabyte.space",
  "sub": "user-uuid",
  "iat": 1718700000,
  "exp": 1718703600
}
```

Public keys for verification: `https://your-team.cloudflareaccess.com/cdn-cgi/access/certs`

Always match the `kid` in the JWT header to `public_certs` (not `public_cert`) — the single-cert endpoint may serve a cached expired key during rotation.

## Pattern 1 — `@hono/cloudflare-access` middleware (recommended)

Zero manual JWT verification. The middleware fetches CF's public keys, verifies the token, and populates `c.get('accessPayload')`.

```bash
npm i @hono/cloudflare-access
```

```ts
// src/worker/index.ts
import { Hono } from 'hono';
import { cloudflareAccess, type CloudflareAccessVariables } from '@hono/cloudflare-access';

type Variables = CloudflareAccessVariables; // adds accessPayload to c.get()

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Protect all /admin/* routes
app.use(
  '/admin/*',
  cloudflareAccess(
    'your-team',              // team name (subdomain of cloudflareaccess.com)
    'your-aud-tag-here'       // audience tag from CF Access dashboard
  )
);

app.get('/admin/dashboard', (c) => {
  const payload = c.get('accessPayload');
  return c.json({
    message: `Hello ${payload.email}`,
    sub: payload.sub,
  });
});

app.get('/admin/feature-flags', (c) => {
  // payload.email is the verified CF Access identity — use for audit logs
  const { email } = c.get('accessPayload');
  console.log(`Feature flag change by ${email}`);
  return c.json({ flags: [] });
});

export default app;
```

## Pattern 2 — Manual JWT verification (jose library)

Use when you need fine-grained control, custom claims, or are not using Hono.

```ts
import { createRemoteJWKSet, jwtVerify } from 'jose';

interface AccessPayload {
  iss: string;
  aud: string[];
  email: string;
  sub: string;
  iat: number;
  exp: number;
}

async function verifyAccessToken(
  token: string,
  teamDomain: string,    // e.g. 'your-team.cloudflareaccess.com'
  audienceTag: string
): Promise<AccessPayload> {
  const JWKS = createRemoteJWKSet(
    new URL(`https://${teamDomain}/cdn-cgi/access/certs`)
  );

  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://${teamDomain}`,
    audience: audienceTag,
  });

  return payload as unknown as AccessPayload;
}

// In your Worker fetch handler:
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const token = request.headers.get('Cf-Access-Jwt-Assertion');
    if (!token) return new Response('Unauthorized', { status: 401 });

    try {
      const payload = await verifyAccessToken(
        token,
        env.CF_ACCESS_TEAM_DOMAIN,
        env.CF_ACCESS_AUD
      );
      // payload.email, payload.sub available
      return Response.json({ user: payload.email });
    } catch {
      return new Response('Forbidden', { status: 403 });
    }
  },
};
```

## Pattern 3 — Service tokens (M2M, no human login)

```ts
// CF Access → Service Auth → Create a service token
// Outputs: CF-Access-Client-Id + CF-Access-Client-Secret headers

// In your calling Worker/script:
const res = await fetch('https://admin.yourdomain.com/api/internal', {
  headers: {
    'CF-Access-Client-Id': env.SERVICE_TOKEN_ID,
    'CF-Access-Client-Secret': env.SERVICE_TOKEN_SECRET,
  },
});

// In the receiving Worker — CF verifies the service token automatically,
// no code needed. The Cf-Access-Jwt-Assertion header is still present.
```

## wrangler.toml (env vars for manual verification)

```toml
[vars]
CF_ACCESS_TEAM_DOMAIN = "your-team.cloudflareaccess.com"
CF_ACCESS_AUD = "your-application-audience-tag-32-chars"
```

For `@hono/cloudflare-access`, these are passed directly in code (not env vars) since the middleware signature takes the team name and aud as string literals.

## Identity provider integrations

CF Access supports these IdPs out of the box — no SDK needed in your Worker:

- Google Workspace (email domain or specific group)
- GitHub (org membership)
- Microsoft Azure AD / Entra (group-based)
- Okta / OneLogin / SAML 2.0
- OTP via email (no IdP account required — useful for external contractors)
- PIN-based one-time codes

Switch IdP without changing Worker code. CF handles the OIDC/SAML dance.

## Protecting specific Hono route groups

```ts
// Layered: public API + CF-Access-protected admin
const app = new Hono<{ Bindings: Env; Variables: CloudflareAccessVariables }>();

// Public routes — no Access required
app.get('/api/status', (c) => c.json({ ok: true }));
app.get('/api/v1/*', publicApiHandler);

// Admin routes — CF Access JWT required
const adminAccess = cloudflareAccess('your-team', 'your-aud-tag');
app.use('/admin/*', adminAccess);
app.get('/admin/*', adminRouter.fetch);

// Internal cron trigger — also protect via Access service token
app.post('/internal/cron-trigger', adminAccess, cronHandler);
```

## Audit logs

Every Access request is logged in Zero Trust → Logs → Access with:

- User email
- Timestamp
- Allowed/denied decision
- Policy matched
- IP + country

No code needed. Built-in compliance trail for SOC 2 / HIPAA requirements.

## Gotchas

- **Local dev bypass** — `@hono/cloudflare-access` throws in local `wrangler dev` because CF cannot inject the JWT locally. Use `wrangler dev --remote` or skip Access middleware behind an `env.CF_ENV !== 'local'` guard during dev
- **Cookie vs header** — CF Access sets both a cookie (`CF_Authorization`) and the `Cf-Access-Jwt-Assertion` header. The middleware reads the header; direct browser navigation uses the cookie. Both are verified the same way
- **Session duration** — Access sessions last the duration you configure (default 24h). After expiry, CF prompts re-authentication transparently
- **Audience tag is not secret** — it is the identifier for your application, not a secret. Store it as a plain var, not a Secret

## Cross-links

- `[[cloudflare-lock-in-is-leverage]]` — no external auth vendor for internal tooling
- `[[feature-flags]]` — `/admin/feature-flags` route protected by CF Access
- `[[cf-do-rate-limiter]]` — even Access-protected routes benefit from rate limiting for abuse prevention
