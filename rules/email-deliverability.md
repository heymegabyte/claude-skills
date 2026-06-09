---
name: "email-deliverability"
priority: 3
pack: "infra"
triggers: []
paths:
  - "*"
---

# Email Deliverability

Email that bounces is a feature that silently doesn't work. Since Feb 2024 (Google + Yahoo) and May 2025 (Microsoft), any domain sending bulk mail to Gmail/Yahoo/Outlook MUST authenticate and offer one-click unsubscribe or messages get **rejected at SMTP** — not spam-foldered, bounced. A broken signup confirmation, receipt, or digest is invisible until a user reports it. This gate is non-negotiable on every project that sends mail (Resend / Listmonk / SendGrid).

## When this fires

- Any project that sends transactional OR marketing email
- Before first deploy of any send path (signup, receipt, reset, digest, newsletter)

## The bulk-sender bar (≥5,000 msgs/day to a provider)

- Gmail classifies a domain a **bulk sender permanently at ≥5,000/day** — it never un-classifies even if volume drops. Build to the bar from day one.
- Microsoft enforces the same three pillars since May 2025; Google + Yahoo since Feb 2024.

## Pillar 1 — Authentication (SPF + DKIM + DMARC)

- **All three required.** DMARC minimum policy `p=none` is accepted; `p=quarantine`/`p=reject` is stronger.
- **Alignment** — the `From:` domain must align with SPF OR DKIM. Set up both; align at least one. Google has signaled full SPF+DKIM alignment will become required — align both now.
- **Yahoo** additionally requires **DKIM key ≥1024 bits**.
- Auto-provision sending-domain DNS via the provider API → push records to CF zone API per `secret-provisioning` (Resend `POST /domains` returns the records).

## Pillar 2 — One-click unsubscribe (RFC 8058) — marketing only

- Marketing/subscription mail MUST send **`List-Unsubscribe` AND `List-Unsubscribe-Post`** headers (RFC 8058). A link to a landing page does NOT comply.
- **Honor within 2 days.**
- **Transactional mail is exempt** — password reset, receipts, reservation/form confirmations don't need it. Tag every send `transactional | marketing` so the header logic is correct.

## Pillar 3 — Spam rate < 0.3%

- **0.3% is the enforcement line, not a target.** Keep Postmaster-reported spam rate **< 0.1%**.
- Yahoo's denominator is inbox-delivered only (stricter) — the same complaints read higher on Yahoo.
- Monitor via Google Postmaster Tools; alert before 0.1%.

## Failure mode (why this is a build gate, not a nicety)

- Non-compliant mail is **rejected at SMTP**: Google `550 5.7.26`, Yahoo `550 5.7.9`, Microsoft `550 5.7.515`. It never reaches inbox or spam.
- Once spam rate >0.3% or auth/unsubscribe is missing, provider remediation is unavailable — you're stuck until fixed.
- Enforcement is tightening, not relaxing — "good enough" partial setups that worked in 2024 bounce in 2026.

## Build gate

- `validate-email-auth.mjs` — pre-deploy: query DNS for SPF + DKIM selector + DMARC on the sending domain; fail if any missing or DMARC `p=` absent.
- Every marketing template asserts `List-Unsubscribe` + `List-Unsubscribe-Post` headers in test; every transactional send is tagged and exempt.
- iOS Safari push: pair with **Declarative Web Push** where in-app notification is the better channel per `notifications-email-webhooks-supervisor`.

## See

- `notifications-email-webhooks-supervisor` — Novu backbone; Resend as the email adapter behind it
- `secret-provisioning` — sending-domain DNS auto-provision (provider API → CF zone)
- `always` § Every form — Turnstile + Zod + Resend; this rule gates the send path those forms trigger
- `13-observability-and-growth` — Listmonk-on-Coolify newsletters via Resend SMTP relay
