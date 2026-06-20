---
name: "email-deliverability-implementation"
priority: 2
pack: "infra"
triggers:
  - "spf"
  - "dkim"
  - "dmarc"
  - "bimi"
  - "email dns"
  - "list-unsubscribe"
  - "postmaster"
  - "snds"
paths:
  - "concern:email"
---

# Email Deliverability — Implementation Deep Dive

Companion to `[[email-deliverability]]` (WHAT/WHY). This rule covers the HOW: DNS records, DKIM rotation, DMARC progression, one-click unsubscribe, and monitoring. Read `[[email-deliverability]]` first for the bulk-sender bar and enforcement context.

## SPF — Record Format + Multi-Vendor Chain

SPF has a **10 DNS lookup limit** (RFC 7208 §4.6.4). Every `include:` costs one lookup. Flatten aggressively at 9.

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

SPF qualifiers:

- `~all` (softfail) — use during DMARC `p=none` ramp; fails gracefully.
- `-all` (hardfail) — switch only AFTER DMARC reaches `p=reject`; before that, `-all` can break forwarded mail.

Verify sending domain in Resend dashboard (`POST /domains`) → push returned `include:` and DKIM CNAME records to CF zone API:

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

## DKIM — Key Rotation (180-Day Cycle)

Rotate every **180 days**. Never rotate more than one selector at a time — old signatures in transit must still validate.

### Key rotation procedure

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

Rotation steps — do NOT skip the overlap window:

1. Add new selector to DNS — wait 48h for propagation.
2. Upload new private key to Resend → switch traffic to new selector.
3. Keep old selector in DNS for **30 days** (in-flight messages signed by old key still validate).
4. Remove old selector after 30 days.

Resend MCP to update selector:

```ts
// Update the signing selector on the Resend domain
await fetch(`https://api.resend.com/domains/${domainId}/verify`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
})
// Then re-provision the CNAME records for the new selector
```

For Resend managed DKIM (CNAME delegation): Resend handles rotation internally. Verify the CNAME is current whenever running `validate-email-auth.mjs`.

## DMARC — Policy Progression

Never go straight to `p=reject`. Progress through phases to prevent mail disruption.

### Phase 1 — Monitoring (weeks 1–4)

```dns
_dmarc.megabyte.space.  TXT  "v=DMARC1; p=none; rua=mailto:dmarc-rua@megabyte.space; ruf=mailto:dmarc-ruf@megabyte.space; fo=1; adkim=r; aspf=r; ri=86400"
```

- `p=none` — no enforcement.
- `rua` — aggregate reports (daily XML digest); pipe to Dmarcian, Postmark, or Valimail.
- `ruf` — forensic reports (per-message failures); omit if GDPR concerns.
- `fo=1` — report on ANY failure (SPF or DKIM, not both required).
- `ri=86400` — report interval 24h.

### Phase 2 — Quarantine (weeks 5–8, after zero unauthorized senders in rua)

```dns
_dmarc.megabyte.space.  TXT  "v=DMARC1; p=quarantine; pct=25; rua=mailto:dmarc-rua@megabyte.space; adkim=s; aspf=s"
```

- `p=quarantine` — failing mail goes to spam.
- Ramp `pct=25` → `pct=50` → `pct=100` over 2-week intervals; watch rua for unexpected failures.
- `adkim=s` / `aspf=s` — strict alignment; `r` (relaxed) allows subdomain matches.

### Phase 3 — Reject (week 9+, after pct=100 quarantine shows clean reports)

```dns
_dmarc.megabyte.space.  TXT  "v=DMARC1; p=reject; rua=mailto:dmarc-rua@megabyte.space; adkim=s; aspf=s"
```

- `p=reject` is the "done" state and a prerequisite for BIMI.
- Continue monitoring rua — legitimate senders can break alignment after ESP swaps.

Gate check in `validate-email-auth.mjs`:

```ts
const dmarc = await resolveTxt(`_dmarc.${domain}`)
const policy = dmarc[0]?.join('').match(/p=(\w+)/)?.[1]
if (!policy) throw new Error('DMARC record missing')
if (policy === 'none') console.warn('DMARC in monitoring mode — not enforced')
if (!['quarantine', 'reject'].includes(policy)) throw new Error(`DMARC policy too weak: ${policy}`)
```

## BIMI — Brand Indicators for Message Identification

BIMI displays your logo in Gmail/Yahoo/Apple Mail next to authenticated messages.

**Prerequisites:**

- DMARC `p=reject` (hard requirement from all BIMI-supporting providers).
- Logo: SVG Tiny PS format (use `svgo` → validate at bimigroup.org/svg-validator/).
- VMC: Entrust or DigiCert (~$1,500/yr per domain); takes 2–4 weeks (requires trademark registration — USPTO/EUIPO/JPO).
- Host SVG logo and VMC PEM at stable HTTPS URLs on your own domain.

```dns
; BIMI record (add AFTER DMARC p=reject is stable for ≥2 weeks)
default._bimi.megabyte.space.  TXT  "v=BIMI1; l=https://megabyte.space/.well-known/logo.svg; a=https://megabyte.space/.well-known/bimi.pem"
```

`a=` is the hosted VMC PEM (certificate chain from Entrust/DigiCert). Without `a=`, only Yahoo shows the logo; Gmail requires VMC.

## Gmail + Yahoo 2024 Bulk-Sender Requirements — One-Click Unsubscribe

RFC 8058 defines `List-Unsubscribe: One-Click`. A clickable body link does NOT satisfy this. Both headers are required:

```
List-Unsubscribe: <https://megabyte.space/api/unsubscribe?token=HMAC_TOKEN>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

The endpoint MUST:

- Accept `POST application/x-www-form-urlencoded` with body `List-Unsubscribe=One-Click`.
- Process the unsubscribe **without requiring login or another click**.
- Honor within **2 days** per Gmail enforcement.
- Return `200 OK` (no redirect).

### Resend — setting List-Unsubscribe

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

### HMAC token construction

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

### One-click endpoint

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

## Monitoring — Google Postmaster Tools + Microsoft SNDS

Set up both before the first marketing send (both are free).

### Google Postmaster Tools

1. Add domain at postmaster.google.com — verify via DNS TXT record.
2. Dashboard shows: **Domain Reputation** (Bad/Low/Medium/High), IP Reputation, Spam Rate, Delivery Errors, Encryption, DKIM/DMARC.
3. `Spam Rate > 0.08%` — investigate suppression list + content. `> 0.10%` — pause sends until root cause resolved. Google enforces at 0.30% but reputation damage starts at 0.10%.
4. Domain Reputation "Bad" or "Low" — investigate all senders on the domain (SPF allows?) for rogue sends.

### Microsoft SNDS

1. Register at sendersupport.olc.protection.outlook.com/snds.
2. Add sending IP ranges (check Resend's IP pools via `dig +short mx megabyte.space` or `https://api.resend.com/domains/{id}` response).
3. SNDS shows: trap hit rate (target 0%), complaint rate, filter status (Green/Yellow/Red).
4. Red filter status — warm up the IP/domain with low volume before resuming bulk.

### Build gate — `validate-email-auth.mjs`

```ts
// scripts/validate-email-auth.mjs (extend from email-deliverability rule)
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

## See

- `[[email-deliverability]]` — the WHAT: bulk-sender bar, enforcement context, build gate mandate
- `[[right-to-deletion]]` — unsubscribe suppression list feeds into deletion cascade
- `[[secret-provisioning]]` — RESEND_API_KEY + UNSUBSCRIBE_HMAC_KEY + CF_API_TOKEN provisioning
- `[[hono-api]]` — one-click unsubscribe Hono route patterns
- `[[notifications-email-webhooks-supervisor]]` — Resend as the email adapter, Novu backbone
