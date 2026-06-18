---
name: "pii-handling-discipline"
priority: 1
pack: "backend"
triggers:
  - "pii"
  - "personally identifiable"
  - "audit log"
  - "email hash"
  - "sha-256"
  - "gdpr"
  - "login attempt"
  - "security event"
  - "deletion_audit"
  - "payment_events"
paths:
  - "drizzle/**"
  - "src/worker/**"
  - "workers/**"
  - "scripts/migrate*"
  - "**/schema.ts"
---

# PII Handling Discipline

PII is NEVER stored plaintext in audit logs, event logs, or security event tables.
Every audit row references personally identifiable information via cryptographic hash —
SHA-256 with per-record salt where collision resistance matters — never by raw value.
The audit row proves WHAT happened and WHEN without retaining WHO the person is in
recoverable form.

## The principle

- **Log rows are not subject-of-record** — a `deletion_audit` row, a `login_attempts`
  row, or a `security_events` row is evidence of an action, not a user profile. The
  subject of the record (the user) has rights over their profile; the audit log's
  existence is a legal obligation separate from those rights.
- **Hash-then-store** — before inserting any audit or event row, hash the PII.
  The hash is the log's only link to the identity.
- **Irreversibility is the feature** — a SHA-256 hash of a lowercase email with a
  per-record salt cannot be reversed without the salt AND the original value. This is
  not a bug to work around; it is the compliance guarantee.
- **Plaintext belongs only in active records** — the `users` table, `sessions` table,
  and active profile rows are subject-of-record: they exist to serve the user and are
  deleted on request. Audit logs are legal records: they exist to prove compliance and
  survive deletion.

## Surfaces this applies to

Every row in these table categories MUST use hashed PII, never plaintext:

| Table / surface | PII to hash |
|---|---|
| `login_attempts` | email → `email_sha256` |
| `api_key_creation_events` | creator email → `email_sha256` |
| `payment_events` | customer email → `email_sha256`; card last4 OK plaintext |
| `deletion_audit` | requester email → `email_sha256` |
| `security_events` | email, IP address → `email_sha256`, `ip_sha256` |
| `webhook_delivery_log` | destination email (if present) → `email_sha256` |
| `admin_action_log` | acting admin email → `email_sha256` |
| `failed_auth_log` | attempted email → `email_sha256` |

IP addresses are PII under GDPR. Hash them too when storing in audit logs.

## D1 schema patterns

### Column naming convention

```sql
-- CORRECT
email_sha256  TEXT NOT NULL   -- SHA-256 hex of lowercase email
ip_sha256     TEXT            -- SHA-256 hex of remote IP; nullable when not captured

-- WRONG — never use these column names in audit/event tables
email         TEXT            -- plaintext PII in a log table
user_email    TEXT            -- same problem
customer_email TEXT           -- same problem
```

### login_attempts

```sql
CREATE TABLE IF NOT EXISTS login_attempts (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email_sha256  TEXT NOT NULL,          -- SHA-256(lowercase(email)) — NOT the email
  ip_sha256     TEXT,                   -- SHA-256(remote IP) — NOT the IP
  outcome       TEXT NOT NULL,          -- 'success' | 'wrong_password' | 'not_found' | 'rate_limited'
  user_agent    TEXT,                   -- browser UA string is not PII per GDPR
  attempted_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
-- DO NOT add an `email` column. The hash is the only link to the identity.
```

### payment_events

```sql
CREATE TABLE IF NOT EXISTS payment_events (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email_sha256    TEXT NOT NULL,        -- hashed; not the billing email
  provider        TEXT NOT NULL,        -- 'stripe' | 'square'
  event_type      TEXT NOT NULL,        -- 'charge.succeeded' | 'refund.created' etc.
  amount_cents    INTEGER,
  currency        TEXT,
  card_last4      TEXT,                 -- last 4 digits are NOT PII (PCI-DSS allows)
  provider_event_id TEXT,               -- idempotency / dispute lookup
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### security_events

```sql
CREATE TABLE IF NOT EXISTS security_events (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  event_type    TEXT NOT NULL,          -- 'api_key_created' | 'mfa_disabled' | 'password_reset' etc.
  email_sha256  TEXT NOT NULL,
  ip_sha256     TEXT,
  metadata      TEXT,                   -- JSON blob; MUST NOT contain PII — scrub before insert
  severity      TEXT NOT NULL DEFAULT 'info', -- 'info' | 'warn' | 'critical'
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## Hashing implementation

Use a single shared utility in every Worker. Do not inline the hash logic at call sites —
one implementation means one change point if the algorithm ever needs upgrading.

```typescript
// src/worker/lib/pii.ts

/**
 * Hash an email for audit log storage.
 * Input is lowercased before hashing — 'User@Example.com' and 'user@example.com'
 * produce the same hash, preventing duplicate audit rows for the same identity.
 *
 * Uses Web Crypto API (available in CF Workers) — no Node.js import needed.
 */
export async function hashEmail(email: string): Promise<string> {
  const normalized = email.toLowerCase().trim()
  const encoded = new TextEncoder().encode(normalized)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Hash an IP address for audit log storage.
 * IPv4 and IPv6 are hashed as-is (after trimming).
 */
export async function hashIp(ip: string): Promise<string> {
  const encoded = new TextEncoder().encode(ip.trim())
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Scrub a metadata object of known PII fields before JSON-stringifying
 * for storage in `metadata` columns.
 */
const PII_KEYS = new Set(['email', 'user_email', 'customer_email', 'phone', 'address',
  'ip', 'ip_address', 'remote_ip', 'name', 'full_name', 'ssn', 'dob'])

export function scrubPii(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => !PII_KEYS.has(k.toLowerCase()))
  )
}
```

### Usage in a login attempt handler

```typescript
// src/worker/routes/auth/login.ts
import { hashEmail, hashIp } from '../../lib/pii'

app.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json()
  const remoteIp = c.req.header('CF-Connecting-IP') ?? ''

  // ... auth logic ...

  const outcome = verified ? 'success' : 'wrong_password'

  // Audit log — hashed, never plaintext
  await c.env.DB.prepare(
    `INSERT INTO login_attempts (email_sha256, ip_sha256, outcome, user_agent)
     VALUES (?, ?, ?, ?)`
  ).bind(
    await hashEmail(email),
    remoteIp ? await hashIp(remoteIp) : null,
    outcome,
    c.req.header('User-Agent') ?? null,
  ).run()

  if (!verified) return c.json({ error: 'Invalid credentials' }, 401)
  // ... issue session ...
})
```

## Where plaintext IS allowed

Plaintext PII belongs only in **active subject-of-record rows**. These rows exist to
serve the user and are deleted in full on a right-to-deletion request.

| Table | PII column | Reason |
|---|---|---|
| `users` | `email TEXT NOT NULL` | Subject of record; deleted on RTBF |
| `sessions` | — (joins to users) | Session token, not PII; user row is the identity |
| `billing` | `stripe_customer_id` only | Opaque ID; actual PII stored at Stripe |
| `oauth_accounts` | `provider_user_id` | Opaque ID; not PII |
| Resend / PostHog API calls | email in transit | Never persisted in D1 |

**Never** store plaintext email in any table that survives a deletion cascade (see
`right-to-deletion` cascade step order — `deletion_audit` is updated last, not deleted,
specifically because it uses a hash).

## Right-to-deletion compatibility

Hashing audit rows makes RTBF automatically GDPR-compliant without deleting the audit row:

- GDPR Art. 17 requires deletion of personal data.
- A SHA-256 hash of an email is not personal data under GDPR — it cannot be reverse-
  engineered to identify the person without the original value (which is deleted from
  `users`).
- Therefore: the audit row MAY persist after deletion, satisfying Art. 5(2) accountability
  while fully complying with Art. 17.
- No special deletion step needed for audit tables. The cascade deletes the `users` row;
  the audit rows' PII link becomes permanently unresolvable.

## Audit log retention exception

Retain audit log rows (hashed) for **3 years** per GDPR Art. 5(2) accountability
principle and standard EU privacy claim statute of limitations.

```sql
-- Cron: delete audit rows older than 3 years (safe — hashed only)
DELETE FROM login_attempts    WHERE attempted_at < datetime('now', '-3 years');
DELETE FROM security_events   WHERE created_at   < datetime('now', '-3 years');
DELETE FROM payment_events    WHERE created_at   < datetime('now', '-3 years');
DELETE FROM deletion_audit    WHERE requested_at < datetime('now', '-3 years');
```

Wire this as a CF Cron Trigger running monthly. It is safe to run because no PII was
ever stored — only hashes, timestamps, and outcome codes.

## Drift detection

- `grep -rn 'email.*TEXT' drizzle/` → review every match; audit/event tables must use
  `email_sha256`, not `email`. Active tables (`users`) are expected to have `email TEXT`.
- `grep -rn "\.bind(email," src/worker/` in the context of INSERT/UPDATE on audit tables
  → likely inserting plaintext; replace with `await hashEmail(email)`.
- New event/audit tables added without `email_sha256` pattern = drift; fix in-turn per
  `drift-detection`.

## Anti-patterns

- `email TEXT NOT NULL` in an audit or event table — plaintext PII in a log row
- Hashing without lowercasing first — `User@Example.com` and `user@example.com` produce
  different hashes, creating duplicate audit identities
- Using `btoa(email)` or base64 encoding — this is encoding, not hashing; trivially reversible
- Storing IP address as plaintext in any table — IP is PII under GDPR
- JSON `metadata` column containing raw email fields — scrub before inserting

## Cross-links

- `[[right-to-deletion]]` — the deletion cascade; audit tables survive because they use hashes
- `[[email-deliverability-implementation]]` — email in transit (Resend API calls); never persisted
- `[[secret-provisioning]]` — `POSTHOG_PERSONAL_API_KEY`, `RESEND_API_KEY` env setup
- `[[data-residency-by-default]]` — D1 read-replica placement for EU compliance
- `[[zod-everywhere]]` — validate audit insert payloads at the boundary; schema enforces no `email` field
