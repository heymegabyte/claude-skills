---
last_reviewed: 2026-06-29
superseded_by: null
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

Companion to `[[email-deliverability]]` (WHAT/WHY). This rule covers the HOW: DNS record requirements, DKIM rotation procedure, DMARC progression, one-click unsubscribe, and monitoring. Read `[[email-deliverability]]` first for the bulk-sender bar and enforcement context.

See `reference/email-deliverability-implementation.md` for all DNS record examples, provision scripts, DKIM key-gen bash, HMAC token code, Hono endpoint, and `validate-email-auth.mjs`.

## SPF — Record requirements

- SPF has a **10 DNS lookup limit** (RFC 7208 §4.6.4). Every `include:` costs one lookup. Flatten aggressively; alert at 9.
- Use `~all` (softfail) during DMARC `p=none` ramp; switch to `-all` only AFTER reaching `p=reject`.
- Resend include: `include:_spf.resend.com`. Verify the sending domain in the Resend dashboard first, then push returned SPF + DKIM CNAME records to CF zone API.

## DKIM — Key rotation (180-day cycle)

- Rotate every **180 days**. Never rotate more than one selector at a time.
- Selector naming convention: `rs<YYYYMM>` (e.g. `rs202607`). Minimum 2048-bit RSA; 4096 if provider supports it.

Rotation steps — do NOT skip the overlap window:

1. Generate new key pair; add new selector to DNS — wait 48h for propagation.
2. Upload new private key to Resend; switch traffic to new selector.
3. Keep old selector in DNS for **30 days** (in-flight messages signed by old key still validate).
4. Remove old selector after 30 days.

For Resend managed DKIM (CNAME delegation): Resend handles rotation internally. Verify the CNAME is current whenever running `validate-email-auth.mjs`.

## DMARC — Policy progression

Never go straight to `p=reject`. Progress through phases to prevent mail disruption.

**Phase 1 — Monitoring (weeks 1–4):** `p=none`. Enable `rua` (aggregate reports, daily XML) and `ruf` (forensic, omit if GDPR concern). Set `fo=1` to report on ANY failure.

**Phase 2 — Quarantine (weeks 5–8, after zero unauthorized senders in rua):** `p=quarantine`. Ramp `pct=25` → `pct=50` → `pct=100` over 2-week intervals watching rua. Use strict alignment (`adkim=s; aspf=s`).

**Phase 3 — Reject (week 9+, after pct=100 quarantine shows clean reports):** `p=reject` is the done state and a prerequisite for BIMI. Continue monitoring rua — legitimate senders can break alignment after ESP swaps.

Run `validate-email-auth.mjs` as a build gate; it checks SPF, DKIM selectors, and DMARC policy and warns on `p=none`.

## BIMI — Brand Indicators for Message Identification

BIMI displays your logo in Gmail/Yahoo/Apple Mail next to authenticated messages.

**Prerequisites (all required before adding the DNS record):**

- DMARC `p=reject` stable for ≥2 weeks.
- Logo in SVG Tiny PS format (validate at bimigroup.org/svg-validator/).
- VMC from Entrust or DigiCert (~$1,500/yr per domain; requires trademark registration — USPTO/EUIPO/JPO; takes 2–4 weeks).
- Logo SVG and VMC PEM hosted at stable HTTPS URLs on your own domain.

Without the `a=` VMC field, only Yahoo shows the logo; Gmail requires VMC.

## Gmail + Yahoo 2024 Bulk-Sender Requirements — One-Click Unsubscribe

RFC 8058 defines `List-Unsubscribe: One-Click`. A clickable body link does NOT satisfy this. Both headers are required on every marketing send:

```
List-Unsubscribe: <https://megabyte.space/api/unsubscribe?token=HMAC_TOKEN>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

The endpoint MUST:

- Accept `POST application/x-www-form-urlencoded` with body `List-Unsubscribe=One-Click`.
- Process the unsubscribe **without requiring login or another click**.
- Honor within **2 days** per Gmail enforcement.
- Return `200 OK` (no redirect).
- Write to a D1 suppression table to prevent re-adding on list import.

Use a daily-rotating HMAC token (Web Crypto `HMAC`/`SHA-256`) — token valid for current day + previous day to handle timezone edge.

## Monitoring — Google Postmaster Tools + Microsoft SNDS

Set up both before the first marketing send (both are free).

**Google Postmaster Tools:**

- Add domain at postmaster.google.com — verify via DNS TXT record.
- `Spam Rate > 0.08%` → investigate suppression list + content. `> 0.10%` → pause sends.
- Google enforces at 0.30% but reputation damage starts at 0.10%.
- Domain Reputation "Bad" or "Low" → audit all SPF-authorized senders for rogue sends.

**Microsoft SNDS:**

- Register at sendersupport.olc.protection.outlook.com/snds; add Resend's sending IP ranges.
- Target: trap hit rate 0%, complaint rate as low as possible, filter status Green.
- Red filter status → warm up IP/domain with low volume before resuming bulk.

## See

- `[[email-deliverability]]` — the WHAT: bulk-sender bar, enforcement context, build gate mandate
- `[[right-to-deletion]]` — unsubscribe suppression list feeds into deletion cascade
- `[[secret-provisioning]]` — RESEND_API_KEY + UNSUBSCRIBE_HMAC_KEY + CF_API_TOKEN provisioning
- `[[hono-api]]` — one-click unsubscribe Hono route patterns
- `[[notifications-email-webhooks-supervisor]]` — Resend as the email adapter, Novu backbone
