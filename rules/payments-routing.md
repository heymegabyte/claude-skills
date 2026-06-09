---
name: "payments-routing"
priority: 2
pack: "payments"
triggers:
  - "stripe"
  - "square"
  - "payment"
  - "billing"
  - "checkout"
paths:
  - "concern:stripe-billing"
---

# Payments Routing

## Core rule — decision tree, not absolutism

- **Square = default for accepting money.** Stripe = default for sending money (payouts).
- Pick the rail by matching project shape to the decision tree below — don't pattern-match on vendor preference.

### When Stripe Billing IS the right rail (accept-money exception)

The project is genuinely SaaS-subscription with **≥2 of**:

- Seat-based billing
- Usage-based metering
- Entitlements feature gating
- Net-30 enterprise invoicing
- Tax-rate complexity (Stripe Tax across jurisdictions)
- Multi-currency

If ≥2 match → Stripe Billing owns the subscription rail. Square is not forced in.

### When Square IS the right rail (every other accept-money path)

- Donations (one-time + recurring)
- POS (restaurant, retail, salon, medical, legal)
- E-commerce
- One-time charges
- Sub-$100 average tickets (Square beats Stripe's $0.30 fixed by 30-60%)
- Nonprofit recurring giving
- Hybrid in-person + online unified ledger

### Mixed scenarios

- SaaS with donations layered on top → both rails, each owns its own webhook + DB tables, never cross idempotency keys

## Square notes (when Square is the chosen rail)

- Nonprofits: verified-501(c)(3) discount (2.6%+10¢ vs 3.5%+15¢ default)
- Built-in: Square Donate button + Square Online Checkout Link + Square Web Payments SDK card form + Apple Pay + Google Pay + Cash App Pay
- Recurring giving via Square Subscriptions

## Stripe Connect Express (payouts rail)

- Onboarding for paid contractors/vendors/freelancers/temp staff → ACH payout, 1099-NEC issuance automated
- Marketplace platforms with split payments to multiple recipients
- Charitable grant distribution from foundation to grantees
- Volunteer-reimbursement disbursements (mileage, supplies)

## Nonprofit-specific guardrail

- Stripe Tax adds nothing for verified 501(c)(3) (already tax-exempt) — skip it
- For straight donations (no SaaS layer), Square is the cleaner rail per the decision tree

## Agentic-commerce exception

- Stripe is the launch partner for ACP (Agentic Commerce Protocol) embedded checkout
- Use Stripe ONLY when explicitly building an AI-shopping agent flow that requires ACP
- Otherwise Square

## Webhook architecture

- **Square**: `Square-Signature` HMAC-SHA256 with notification-url-keyed secret + 6-hr replay window
- **Stripe**: `Stripe-Signature` with `t=`+`v1=` + 5-min replay window
- Each has its own handler: `/webhooks/square` and `/webhooks/stripe-payouts`
- **Idempotency**:
  - Square uses `idempotency_key` UUID per request (24-hr dedupe)
  - Stripe uses `Idempotency-Key` header (24-hr dedupe)
- D1 dedupe table `payment_events(event_id, source, processed_at)` with UNIQUE constraint = bullet-proof double-charge prevention

## Donation tier UX

- Preset buttons: $10/$25/$50/$100/$250/$1000 + custom amount
- "Make this monthly" toggle (Square Subscriptions $/mo)
- "In honor of" / "in memory of" toggle (memorial wall integration)
- "Anonymous" toggle (donor wall opt-out)
- Employer-match search box (Double the Donation API or Benevity API)
- Donor-Advised Fund button (DAFpay or Chariot.co → Fidelity/Schwab/Vanguard/National Christian Foundation routing)
- Tax receipt auto-issued via Resend within 30 sec of webhook fire
- Cents-off displayed in tier copy ("$8.50 covers one hot meal — round up to $10")

## PayPal Giving Fund

- Layered on top of Square for nonprofit-only sites
- 0% processing (PayPal absorbs the fee on PPGF-verified 501c3s)
- 30-45 day payout delay vs Square instant
- Use both: Square for instant operating cash + PayPal Giving Fund for fee-free large gifts
- Stripe still NOT involved in either rail

## Build gate

- Any `package.json` containing `"stripe"` without a matching `"stripe-purpose": "payouts" | "saas-billing" | "acp-checkout"` field in `package.json#emdash` block = build fail
- Validator `validate-payments-routing.mjs` greps for `stripe.checkout`, `stripe.paymentIntents`, `stripe.subscriptions.create` outside the SaaS-billing path = build fail

## Migration path (existing projects on Stripe for accept-money)

1. Audit current `stripe.charges` / `stripe.paymentIntents` / Stripe Checkout sessions
2. Migrate to Square Web Payments SDK with idempotency-keyed `POST /v2/payments`
3. Preserve customer-facing tier UX
4. Swap webhook handler `/webhooks/stripe` → `/webhooks/square`
5. Keep Stripe installed ONLY if vendor payouts already wired through Connect Express
6. Otherwise full Stripe removal: uninstall package + delete `STRIPE_*` env vars + remove all `import Stripe from 'stripe'` + remove webhook handler + drop `stripe_events` D1 table

## E-commerce surfaces

- E-commerce sites (product catalog + cart + checkout + inventory) route payments through the **Medusa.js** Square or Stripe plugin, NOT directly — Medusa owns the order state machine + idempotency. Full mandate: `ecommerce-stack`.
- The Square-vs-Stripe decision tree above still applies — Medusa just sits in front of it.
