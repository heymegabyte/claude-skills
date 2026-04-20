---
name: "security-best-practices"
description: "Security audit and hardening for web applications. Covers CSP, auth, input validation, RBAC, rate limiting, secret management, and OWASP Top 10. Applied automatically during code review and explicitly when requested."
---

# Security Best Practices

## Always-On Rules (Apply to Every Project)

### 1. Content Security Policy (CSP)
Every Cloudflare Worker MUST set CSP headers:
```typescript
contentSecurityPolicy: {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com"],
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  fontSrc: ["'self'", "https://fonts.gstatic.com"],
  imgSrc: ["'self'", "data:", "https://www.google-analytics.com"],
  frameSrc: ["https://www.youtube.com", "https://www.google.com"],
  connectSrc: ["'self'", "https://www.google-analytics.com"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
}
```

### 2. Input Validation
- **Server-side:** Zod schemas at every API boundary — NEVER trust client input
- **Client-side:** HTML5 validation + JavaScript checks for UX (not security)
- **Max lengths:** name 200, email 200, message 5000, subject 200
- **Email regex:** `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Sanitize HTML:** `escapeHtml()` for any user content rendered in emails/pages

### 3. Authentication
- Bearer tokens: SHA-256 hash stored, plaintext returned once
- Session expiry: 30 days, bump `last_active_at` on each request
- Magic links: 24hr expiry, single-use
- OTP: 5min expiry, max 3 attempts
- `timingSafeEqual()` for ALL token/password comparisons

### 4. RBAC
- Roles: owner > admin > member > viewer
- Every query scoped to `org_id` — NEVER expose cross-org data
- Soft deletes: `deleted_at IS NULL` in ALL queries

### 5. Rate Limiting
- KV-based: `{ip}:{endpoint}` → counter with TTL
- Limits: 10 req/min for auth, 60 req/min for API, 5 req/min for contact forms
- Return 429 with `Retry-After` header

### 6. Secrets
- Never commit `.env` files — use `.env.example`
- Cloudflare secrets via `wrangler secret put`
- PII redaction in all logs: emails → `***@***.com`, tokens → `***`
- No API keys in client-side JavaScript

### 7. OWASP Top 10 Checklist
- [ ] Injection: Parameterized queries, Zod validation
- [ ] Auth: Strong sessions, MFA support, brute-force protection
- [ ] Access Control: RBAC enforced at data layer, not just UI
- [ ] Cryptographic: HTTPS everywhere, bcrypt for passwords
- [ ] Security Misconfiguration: CSP, HSTS, X-Frame-Options
- [ ] Vulnerable Components: npm audit, keep dependencies updated
- [ ] Logging: Structured logs with correlation IDs, PII redacted
- [ ] SSRF: Validate all URLs before fetching
- [ ] Insecure Design: Threat model before building

## Quick Audit Command

```bash
# Check for common security issues
grep -rn 'eval(\|innerHTML\|document.write\|window.location =' src/
grep -rn 'console.log\|password\|secret\|token' src/ | grep -v 'test\|spec'
```
