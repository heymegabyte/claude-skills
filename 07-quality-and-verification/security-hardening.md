---
name: "Security Hardening"
description: "Canonical owner of CSP headers, OWASP Top 10 prevention, Zod validation at all boundaries, Turnstile CAPTCHA integration, KV-based rate limiting, secret rotation, dependency scanning, and XSS/CSRF/injection prevention. Every deploy is secure by default."
always-load: false---

# Security Hardening

## Security Headers (MANDATORY every Worker)
```typescript
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '0');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  c.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  c.header('Cross-Origin-Opener-Policy', 'same-origin');
  c.header('Cross-Origin-Embedder-Policy', 'require-corp');
  c.header('Cross-Origin-Resource-Policy', 'same-origin');
});
```

## CSP Template
```typescript
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://challenges.cloudflare.com https://*.posthog.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https://images.unsplash.com https://images.pexels.com https://*.stripe.com https://*.cloudflare.com",
  "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://*.posthog.com https://*.sentry.io https://challenges.cloudflare.com",
  "frame-src https://www.youtube.com https://www.google.com https://js.stripe.com https://challenges.cloudflare.com",
  "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'", "upgrade-insecure-requests",
].join('; ');
```

## OWASP Top 10 Prevention
| # | Vulnerability | Prevention |
|---|--------------|------------|
| A01 | Broken Access | Clerk JWT on protected routes |
| A02 | Crypto Failures | HTTPS-only, wrangler secrets |
| A03 | Injection | Zod + Drizzle parameterized queries |
| A04 | Insecure Design | Threat modeling at architecture phase |
| A05 | Misconfiguration | Security headers on every response |
| A06 | Vulnerable Components | `npm audit` in CI, Dependabot |
| A07 | Auth Failures | Clerk, rate limit login |
| A08 | Data Integrity | Webhook sig verification, SRI |
| A09 | Logging Failures | Sentry captures all errors |
| A10 | SSRF | No user-controlled URLs in server fetch without allowlist |

## Rules
1. Zod on ALL input (body, query, params, headers). No unvalidated input touches logic.
2. Never `eval()`, `innerHTML`, `document.write()`. Use `textContent`.
3. Parameterized queries only. Drizzle default. Raw must `.bind()`.
4. Secrets in `wrangler secret put` only. Never in code, .env in repos, or wrangler.toml vars.
5. CORS: exact origins only. Never `'*'` in production.
6. Rate limit all public endpoints (60/min default, 10/min auth). KV-based.
7. Turnstile on every public form. No exceptions.
8. Webhook signatures verified before parsing payload.
9. `npm audit --production` in CI. Critical/high blocks deploy.
10. No sensitive data in URLs (tokens, PIIs appear in logs/Referer).
11. Cookies: HttpOnly, Secure, SameSite=Strict. Prefer Clerk JWT.
12. Log security events (failed auth, rate limits, invalid sigs) to Sentry.

## Key Patterns

**Rate Limiting (KV):**
```typescript
function rateLimit({ limit, window, keyPrefix }: RateLimitConfig) {
  return async (c, next) => {
    const ip = c.req.header('cf-connecting-ip') || 'unknown';
    const key = `rl:${keyPrefix}:${ip}`;
    const current = parseInt(await c.env.KV.get(key) || '0');
    if (current >= limit) return c.json({ error: 'Too many requests', code: 'RATE_LIMITED' }, 429);
    await c.env.KV.put(key, String(current + 1), { expirationTtl: window });
    await next();
  };
}
```

**Turnstile Verification:**
```typescript
async function verifyTurnstile(token: string, secret: string, ip: string): Promise<boolean> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  });
  return (await res.json<{ success: boolean }>()).success;
}
```

**Auth Middleware (Clerk JWT):**
```typescript
function requireAuth() {
  return async (c, next) => {
    const token = c.req.header('authorization')?.slice(7);
    if (!token) return c.json({ error: 'Unauthorized' }, 401);
    try { const payload = await verifyToken(token, { secretKey: c.env.CLERK_SECRET_KEY }); c.set('userId', payload.sub); }
    catch { return c.json({ error: 'Invalid token' }, 401); }
    await next();
  };
}
```

**XSS Prevention:** `escapeHtml()` for dynamic content in server-rendered HTML.

## Secret Rotation (Every 90 days)
Rotate: STRIPE_API_KEY, TURNSTILE_SECRET, CLERK_SECRET_KEY. Verify npm audit 0 critical/high. Review Dependabot. Check CF WAF.

## Security Audit Quick Scan
```bash
grep -rn 'eval\|innerHTML\|document\.write' src/ --include="*.ts"
grep -rn 'password.*=.*["\x27]\|api_key.*=.*["\x27]' src/ --include="*.ts"
grep -rn "origin.*['\"]\\*['\"]" src/ --include="*.ts"
```

## Ownership
**Owns:** CSP, security headers, OWASP prevention, Zod validation, Turnstile, rate limiting, secret management, dependency scanning, XSS/CSRF/injection prevention, CORS, auth middleware, security audits.
**Never owns:** Auth provider selection (->05), webhook logic (->45), form UI (->32), CI/CD (->35), API routes (->25).
