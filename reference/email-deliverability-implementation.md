# Email Deliverability — implementation reference

Sourced on demand by rules/email-deliverability-implementation.md.

## SPF — DNS record examples

```dns
; Minimal Resend-only sender (1 lookup)
megabyte.space.  TXT  "v=spf1 include:_spf.resend.com ~all"

; Multi-vendor chain (common SaaS stack — count your lookups)
megabyte.space.  TXT  "v=spf1
  include:_spf.resend.com          ; 1 — transactional (Resend)
  include:sendgrid.net             ; 2 — marketing (SendGrid fallback)
  include:_spf.google.com          ; 3 — G Suite / Workspace
  ip4:104.18.0.0/16                ; 0 — CF IP, counts as ip4 (not a lookup)
  ~all"
; Total: 3 lookups. Budget: 7 remaining.
```

## SPF — Resend domain provision + CF DNS push

```ts
// scripts/provision-resend-dns.ts
const domain = await fetch('https://api.resend.com/domains', {
  method: 'POST',
  headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'megabyte.space', region: 'us-east-1' }),
}).then(r => r.json())

// domain.records contains SPF, DKIM1, DKIM2 → push to CF Zones API
for (const record of domain.records) {
  await fetch(`https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: record.type, name: record.name, content: record.value, ttl: 1 }),
  })
}
```

## DKIM — key generation + DNS record

```bash
# 1. Generate new 2048-bit RSA key pair (minimum; 4096 if provider supports it)
openssl genrsa -out dkim-private-new.pem 2048
openssl rsa -in dkim-private-new.pem -pubout -out dkim-public-new.pem

# 2. Format the public key for the DNS TXT record
# Remove headers, join lines:
PUBLIC_KEY=$(openssl rsa -in dkim-private-new.pem -pubout 2>/dev/null \
  | grep -v '^-' | tr -d '\n')

# 3. Add NEW selector to DNS BEFORE switching traffic
# Convention: selector = YYYYMM of rotation (e.g. rs202607)
# megabyte.space: rs202607._domainkey.megabyte.space
```

DNS record for new selector:

```dns
rs202607._domainkey.megabyte.space.  TXT  "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ..."
```

Resend selector update after new key upload:

```ts
// Update the signing selector on the Resend domain
await fetch(`https://api.resend.com/domains/${domainId}/verify`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
})
// Then re-provision the CNAME records for the new selector
```

## DMARC — DNS records for each phase

### Phase 1 — Monitoring

```dns
_dmarc.megabyte.space.  TXT  "v=DMARC1; p=none; rua=mailto:dmarc-rua@megabyte.space; ruf=mailto:dmarc-ruf@megabyte.space; fo=1; adkim=r; aspf=r; ri=86400"
```

### Phase 2 — Quarantine (start pct=25, ramp to 100)

```dns
_dmarc.megabyte.space.  TXT  "v=DMARC1; p=quarantine; pct=25; rua=mailto:dmarc-rua@megabyte.space; adkim=s; aspf=s"
```

### Phase 3 — Reject (final state, prerequisite for BIMI)

```dns
_dmarc.megabyte.space.  TXT  "v=DMARC1; p=reject; rua=mailto:dmarc-rua@megabyte.space; adkim=s; aspf=s"
```

## DMARC policy gate check

```ts
const dmarc = await resolveTxt(`_dmarc.${domain}`)
const policy = dmarc[0]?.join('').match(/p=(\w+)/)?.[1]
if (!policy) throw new Error('DMARC record missing')
if (policy === 'none') console.warn('DMARC in monitoring mode — not enforced')
if (!['quarantine', 'reject'].includes(policy)) throw new Error(`DMARC policy too weak: ${policy}`)
```

## BIMI — DNS record

Add AFTER `p=reject` has been stable for ≥2 weeks and VMC is issued:

```dns
default._bimi.megabyte.space.  TXT  "v=BIMI1; l=https://megabyte.space/.well-known/logo.svg; a=https://megabyte.space/.well-known/bimi.pem"
```

`a=` is the hosted VMC PEM (certificate chain from Entrust/DigiCert). Without `a=`, only Yahoo shows the logo; Gmail requires VMC.

## One-click unsubscribe — Resend send headers

```ts
// Resend send with unsubscribe headers (marketing sends only)
await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: 'Brian <brian@megabyte.space>',
    to: recipientEmail,
    subject: 'Your weekly digest',
    html: emailHtml,
    headers: {
      'List-Unsubscribe': `<https://${DOMAIN}/api/unsubscribe?token=${hmacToken}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'X-Category': 'marketing', // internal classification; not sent to recipient
    },
  }),
})
```

## HMAC token — construction + verification

```ts
// src/worker/lib/unsubscribe-token.ts
export async function createUnsubscribeToken(email: string, audienceId: string, env: Env): Promise<string> {
  const payload = `${email}:${audienceId}:${Math.floor(Date.now() / 86400000)}` // daily rotation
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(env.UNSUBSCRIBE_HMAC_KEY),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '')
    + '.' + btoa(payload).replace(/=/g, '')
}

export async function verifyUnsubscribeToken(token: string, env: Env): Promise<{ email: string, audienceId: string } | null> {
  const [sig, encodedPayload] = token.split('.')
  if (!sig || !encodedPayload) return null
  const payload = atob(encodedPayload)
  const [email, audienceId, day] = payload.split(':')
  // Allow current day + previous day (handles timezone edge at midnight)
  const today = Math.floor(Date.now() / 86400000)
  if (Number(day) < today - 1) return null // expired
  // Re-sign and compare
  const expected = await createUnsubscribeToken(email, audienceId, env)
  return expected.startsWith(sig) ? { email, audienceId } : null
}
```

## One-click unsubscribe — Hono endpoint

```ts
// src/worker/routes/unsubscribe.ts
app.post('/api/unsubscribe', async (c) => {
  const body = await c.req.text()
  if (!body.includes('List-Unsubscribe=One-Click')) return c.text('Bad request', 400)

  const token = new URL(c.req.url).searchParams.get('token')
  if (!token) return c.text('Missing token', 400)

  const parsed = await verifyUnsubscribeToken(token, c.env)
  if (!parsed) return c.text('Invalid or expired token', 400)

  // Remove from Resend audience
  await fetch(
    `https://api.resend.com/audiences/${parsed.audienceId}/contacts/${encodeURIComponent(parsed.email)}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${c.env.RESEND_API_KEY}` } }
  )

  // Record in D1 suppression list (avoid re-adding on list import)
  await c.env.DB.prepare(
    `INSERT OR IGNORE INTO email_suppressions (email, reason, created_at)
     VALUES (?, 'one_click_unsubscribe', ?)`
  ).bind(parsed.email, new Date().toISOString()).run()

  return c.text('Unsubscribed', 200)
})
```

## Build gate — `validate-email-auth.mjs`

```ts
// scripts/validate-email-auth.mjs
import { resolveTxt } from 'node:dns/promises'

const domain = process.env.SENDING_DOMAIN ?? 'megabyte.space'

// SPF
const spf = await resolveTxt(domain)
const spfRecord = spf.flat().find(r => r.startsWith('v=spf1'))
if (!spfRecord) throw new Error('SPF record missing')
if (!spfRecord.includes('include:_spf.resend.com')) console.warn('Resend SPF include missing')

// DKIM (check Resend's default selectors: resend._domainkey, rs1._domainkey)
for (const selector of ['resend', 'rs1']) {
  try {
    const dkim = await resolveTxt(`${selector}._domainkey.${domain}`)
    if (!dkim.flat().join('').includes('v=DKIM1')) throw new Error()
    console.log(`✓ DKIM selector ${selector} valid`)
  } catch {
    console.warn(`DKIM selector ${selector} not found (may be using CNAME delegation)`)
  }
}

// DMARC
const dmarc = await resolveTxt(`_dmarc.${domain}`)
const dmarcRecord = dmarc.flat().find(r => r.startsWith('v=DMARC1'))
if (!dmarcRecord) throw new Error('DMARC record missing')
const policy = dmarcRecord.match(/p=(\w+)/)?.[1]
if (!policy || policy === 'none') {
  console.warn('DMARC policy=none — monitoring only, not enforced')
} else {
  console.log(`✓ DMARC policy=${policy}`)
}
console.log('Email auth validation complete')
```
