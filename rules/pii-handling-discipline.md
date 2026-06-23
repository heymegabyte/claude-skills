---
name: "pii-handling-discipline"
priority: 2
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

PII is **never** stored plaintext in audit logs, event logs, or security event tables. Every audit row references PII via SHA-256 hash — never by raw value.

## Core Principles

- **Audit rows are not subject-of-record** — `deletion_audit`, `login_attempts`, `security_events` are legal evidence; the user has rights over their profile row, not the audit row.
- **Hash-then-store** — hash PII before inserting any audit or event row.
- **Irreversibility is the feature** — SHA-256 of lowercase email + per-record salt cannot be reversed without both the salt and original value.
- **Plaintext belongs only in active subject-of-record rows** (`users`, `sessions`) — those are deleted on RTBF request. Audit logs survive deletion.

## Surfaces Requiring Hashed PII

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

IP addresses are PII under GDPR — hash them too.

## D1 Schema Patterns

- Audit/event table columns MUST be named `email_sha256` (TEXT NOT NULL) and `ip_sha256` (TEXT, nullable).
- Never use `email`, `user_email`, or `customer_email` as column names in any audit or event table.
- `metadata` JSON columns MUST be scrubbed of all PII keys before insert.

See `reference/pii-handling-discipline.md` for full SQL table definitions and the TypeScript utility.

## Hashing Implementation

- Use the shared utility at `src/worker/lib/pii.ts` — never inline hash logic at call sites.
- `hashEmail(email)` lowercases + trims before hashing; ensures `User@Example.com` and `user@example.com` produce identical hashes.
- `hashIp(ip)` hashes IPv4 or IPv6 as-is after trimming.
- `scrubPii(obj)` strips keys: `email`, `user_email`, `customer_email`, `phone`, `address`, `ip`, `ip_address`, `remote_ip`, `name`, `full_name`, `ssn`, `dob`.
- All functions use Web Crypto (`crypto.subtle.digest`) — no Node.js import required; CF Workers compatible.

See `reference/pii-handling-discipline.md` for the full implementation and a login handler usage example.

## Where Plaintext Is Allowed

Plaintext PII belongs only in **active subject-of-record rows** deleted in full on right-to-deletion.

| Table | PII column | Reason |
|---|---|---|
| `users` | `email TEXT NOT NULL` | Subject of record; deleted on RTBF |
| `sessions` | — (joins to users) | Session token, not PII; user row is the identity |
| `billing` | `stripe_customer_id` only | Opaque ID; actual PII stored at Stripe |
| `oauth_accounts` | `provider_user_id` | Opaque ID; not PII |
| Resend / PostHog API calls | email in transit | Never persisted in D1 |

Never store plaintext email in any table that survives a deletion cascade — `deletion_audit` is updated last, not deleted, because it uses a hash.

## Right-to-Deletion Compatibility

- GDPR Art. 17 requires deletion of personal data.
- A SHA-256 hash is not personal data under GDPR — it cannot be reverse-engineered once the `users` row is deleted.
- Audit rows **may persist** after deletion, satisfying Art. 5(2) accountability while complying with Art. 17.
- No special deletion step needed for audit tables.

## Audit Log Retention

- Retain hashed audit rows for **3 years** per GDPR Art. 5(2) and EU privacy claim statute of limitations.
- Wire a monthly CF Cron Trigger that deletes rows older than 3 years from `login_attempts`, `security_events`, `payment_events`, and `deletion_audit`.

See `reference/pii-handling-discipline.md` for the cron SQL.

## Drift Detection

- `grep -rn 'email.*TEXT' drizzle/` — audit/event tables must use `email_sha256`, not `email`; active tables (`users`) expect `email TEXT`.
- `grep -rn "\.bind(email," src/worker/` in INSERT/UPDATE context on audit tables — likely inserting plaintext; replace with `await hashEmail(email)`.
- New event/audit tables added without `email_sha256` pattern = drift; fix in-turn per `drift-detection`.

## Anti-Patterns

- `email TEXT NOT NULL` in an audit or event table.
- Hashing without lowercasing first — `User@Example.com` and `user@example.com` produce different hashes, creating duplicate audit identities.
- `btoa(email)` or base64 encoding — encoding, not hashing; trivially reversible.
- Storing IP address as plaintext in any table.
- JSON `metadata` column containing raw email fields — scrub before inserting.

## Cross-links

- `[[right-to-deletion]]` — deletion cascade; audit tables survive because they use hashes
- `[[email-deliverability-implementation]]` — email in transit (Resend API calls); never persisted
- `[[secret-provisioning]]` — `POSTHOG_PERSONAL_API_KEY`, `RESEND_API_KEY` env setup
- `[[data-residency-by-default]]` — D1 read-replica placement for EU compliance
- `[[zod-everywhere]]` — validate audit insert payloads at the boundary; schema enforces no `email` field
