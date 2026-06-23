---
name: "vendor-risk-tiering"
priority: 2
pack: "core"
triggers:
  - "vendor"
  - "third party"
  - "third-party"
  - "dependency risk"
  - "vendor lock"
  - "migration plan"
  - "replacement plan"
  - "vendor tier"
  - "load-bearing"
  - "replaceable"
paths:
  - "ARCHITECTURE.md"
  - "wrangler.toml"
  - "package.json"
  - "worker/**"
  - "src/**"
---

# Vendor Risk Tiering (Load-Bearing vs Replaceable)

Every third-party service used in a project is classified at integration time. The tier determines the overhead applied to that relationship.

## The two tiers

### Load-bearing

Replacing this vendor requires a **multi-week migration** touching data, auth contracts, or core infrastructure. Examples: Cloudflare (Workers, D1, R2, Durable Objects), Clerk (auth), Stripe (billing/payouts), Square (POS payments), Resend (transactional email).

**Overhead for load-bearing vendors:**

- Documented replacement plan in `ARCHITECTURE.md` (≤1 paragraph: "to replace X, we would Y in Z weeks")
- Secret rotation schedule ≤ 90 days (per `secret-provisioning`)
- Abstraction layer wrapping the vendor surface — no raw SDK calls scattered across 30 files
- No single-point-of-failure usage: at least one tested fallback path or degraded-mode behavior

### Replaceable

Equivalent alternatives exist and migration would take **days**, not weeks. Examples: PostHog (→ Plausible / Amplitude), Sentry (→ Axiom / BugSnag), Upstash (→ CF KV directly), Inngest (→ CF Queues + Workflows).

**Overhead for replaceable vendors:**

- None. Use the SDK directly, no abstraction layer required.
- Swap decision is autonomous per `autonomous-engineering` — no approval needed.

---

## The CF lock-in exception

Cloudflare primitives are **load-bearing BY DESIGN**. Deep CF lock-in is the declared strategy per `cloudflare-lock-in-is-leverage`. There is no replacement plan for CF itself — that is intentional. All other load-bearing dependencies need active justification at integration time.

---

## Classification decision tree

```
Is replacing this vendor:
  A) A day of work or less? → Replaceable
  B) Painful but < 1 week?  → Replaceable (still no overhead)
  C) Multi-week + data migration or auth change? → Load-bearing

Is it CF (Workers / D1 / R2 / DO / KV / Queues / Cache)?
  → Load-bearing by doctrine; NO replacement plan required
```

---

## Abstraction layer for load-bearing vendors

- Wrap every load-bearing vendor SDK in a thin service module under `worker/services/<vendor>.ts`.
- Consumers import from the service module only — never import the SDK directly elsewhere.
- The module translates between vendor API shape and internal domain types.

See `reference/vendor-risk-tiering.md` for the canonical Resend service module example.

---

## ARCHITECTURE.md vendor section

- Every project MUST have a `## Vendor Inventory` table in `ARCHITECTURE.md` listing each vendor, its tier, and its replacement plan (load-bearing) or swap time (replaceable).
- Add this table at integration time, not after.

See `reference/vendor-risk-tiering.md` for the table template and example entries.

---

## Secret rotation schedule

- All load-bearing vendor secrets MUST rotate on a ≤90-day cadence per `secret-provisioning`.
- Add one calendar entry per load-bearing vendor to `~/.claude/rules/secret-rotation-calendar.md`.

See `reference/vendor-risk-tiering.md` for the calendar entry format.

---

## Cross-links

- **[[cloudflare-lock-in-is-leverage]]** — CF lock-in as a deliberate architectural choice
- **[[secret-provisioning]]** — rotation cadence by vendor tier
- **[[payments-routing]]** — Stripe vs Square routing (both are load-bearing; never mix usage patterns for the same payment type)
- **[[autonomous-engineering]]** — adding a new load-bearing vendor is `review-recommended`; removing one is `approval-required`
- **[[drift-detection]]** — raw SDK calls scattered outside the service module = drift; consolidate in-turn
