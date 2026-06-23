---
name: "right-to-deletion"
priority: 2
pack: "compliance"
triggers:
  - "gdpr"
  - "ccpa"
  - "lgpd"
  - "deletion request"
  - "right to be forgotten"
  - "data subject request"
  - "rtbf"
paths:
  - "concern:d1-database"
---

# Right to Deletion — GDPR Art. 17 + CCPA + LGPD Cascade

Every project storing PII MUST implement automated deletion via CF Workflows v2. Manual deletion is a compliance liability.

## When this fires

- Any project with a D1 `users` table AND at least one of: Stripe/Square records, R2 uploads, Vectorize embeddings, Resend/PostHog/Sentry user records.
- Before first deployment of any user-account feature.
- GDPR applies to EU residents' data regardless of server location.

## Legal SLA

| Regulation | Deadline | Exception |
|---|---|---|
| GDPR Art. 17 | 30 days (extendable 60 more with notice) | Legal obligation, public interest, archiving |
| CCPA / CPRA | 45 days (extendable 45 more) | Security, fraud detection, legal obligation |
| LGPD (Brazil) Art. 18 | Immediate or at next feasible moment | Legal basis persists |

- **Target: complete cascade within 24 hours of intake.** 30-day SLA is for extreme edge cases only.

## Intake channels (all three REQUIRED)

### 1. Web form (self-serve)

- Hono route `POST /account/delete` with `DeletionRequestSchema` (`email`, optional `reason`, `turnstileToken`).
- Verify Turnstile before touching any user data — prevents abuse.
- Verify Clerk session ownership; if no session, send a signed email-confirmation token instead.
- On verified request: create CF Workflow instance immediately (durable from that moment) + write `deletion_audit` row with `status='pending'`.

See `reference/right-to-deletion.md` for the full implementation.

### 2. Email intake (DSR@yourdomain.com)

- Wire Resend inbound webhook (or Email Workers) to `POST /internal/deletion-email`.
- Parse subject for "delete my account" / "right to erasure" / "RTBF"; auto-queue the Workflow.
- Reply with confirmation email within **5 minutes**.
- Parse body with Workers AI (`@cf/meta/llama-3-8b-instruct`) to extract requester email and intent.

### 3. Admin dashboard

- `/admin/deletion-requests` — lists `deletion_audit` rows, shows status (`pending|running|complete|failed`), allows manual trigger.
- Use `[[feature-flags]]` with key `deletion_dashboard`, `stage='beta'` at launch.

## Cascade entities (ordered by dependency)

```
1. Clerk session invalidation → revoke all sessions for email
2. KV cache purge           → namespace:user:{id}:*
3. D1 application rows      → FK-ordered batch delete (sessions → oauth_accounts → notifications → feature_flag_overrides → users)
4. Vectorize embeddings     → by external_id = user.id
5. R2 uploaded files        → by prefix users/{id}/  (paginate with cursor until not truncated)
6. Stripe customer.delete   → if customer_id exists
7. Square customer archive  → if square_customer_id exists
8. Resend audience remove   → by email from all audiences
9. PostHog person delete    → by distinct_id
10. Sentry user delete      → by username/email
11. Audit log UPDATE        → mark complete, preserve required fields only
```

Every step in the CF Workflow uses `retries: { limit: 3 }`. See `reference/right-to-deletion.md` for the full `DeletionCascade` WorkflowEntrypoint.

## Receipt email (Resend)

- Send from `privacy@yourdomain.com`; subject: `"Your data has been deleted — [date]"`.
- Body MUST state: (1) request received date, (2) completion date, (3) what was deleted, (4) what was retained and why, (5) contact for disputes.
- Mark `X-Category: transactional` — exempt from unsubscribe requirement.

See `reference/right-to-deletion.md` for the `sendDeletionReceipt` implementation.

## Audit log — what MUST survive

- GDPR Art. 17(3)(b) + Art. 5(2) require proof of deletion. Store email hash (SHA-256), never plaintext.
- Retain audit rows for **3 years** (statute of limitations for most EU privacy claims).
- **Retained fields (all non-personal):** `id`, `email_hash` (SHA-256 of lowercase email), `requested_at`, `completed_at`, `channel`, `status`.
- **Must NOT persist:** name, phone, address, device IDs, IP address, plaintext email, any behavioral data.
- Add DDL to a migration file; `DO NOT` add an `email` column. See `reference/right-to-deletion.md` for the full `deletion_audit` DDL.

## wrangler.jsonc binding

```jsonc
// wrangler.jsonc — add to existing bindings
{
  "workflows": [
    {
      "name": "DELETION_WORKFLOW",
      "binding": "DELETION_WORKFLOW",
      "class_name": "DeletionCascade",
      "script_name": "your-worker-name"
    }
  ]
}
```

## Drift detection

- `grep -rn 'users.*INSERT\|users.*UPDATE' src/worker/` — every new user-data write needs a deletion step added to the Workflow.
- Monthly: query `deletion_audit` for `status='failed'` rows; investigate and rerun.
- Annually: verify all third-party deletion APIs still work (Stripe, Square, Resend, PostHog, Sentry endpoints change).

## See

- `[[hono-api]]` — Workflows v2 step-do patterns + retry semantics
- `[[feature-flags]]` — `deletion_dashboard` flag lifecycle
- `[[zod-everywhere]]` — DeletionParamsSchema at every Workflow boundary
- `[[secret-provisioning]]` — STRIPE_SECRET_KEY + RESEND_API_KEY + POSTHOG_PERSONAL_API_KEY env setup
- `[[email-deliverability]]` + `[[email-deliverability-implementation]]` — receipt email send path
- `[[drift-detection]]` — new data writes that skip cascade registration = drift
