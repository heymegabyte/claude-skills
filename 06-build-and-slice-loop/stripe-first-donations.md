---
name: "Stripe-First Donations"
version: "1.0.0"
updated: "2026-05-03"
description: "Every non-profit/donation-CTA site uses Stripe Connect Standard as the primary payment rail with GiveDirectly-style preset amounts, monthly-default frequency toggle, 2.9%+30¢ platform fee with cover-the-fees checkbox. PayPal/Donorbox/Network for Good are NEVER primary — they may appear as secondary fallbacks only. Build-breaking validator `validate-donation-stripe-first.mjs` fails any site whose primary donation widget is not Stripe Connect."
---

# Stripe-First Donations
## Why Stripe Connect Standard (***NON-NEGOTIABLE PRIMARY RAIL***)
GiveDirectly|GiveWell|charity:water|Watsi|Mercy Corps|Wikimedia all run Stripe Connect Standard. Reasons: (1) lowest published rate 2.2% + 30¢ for verified non-profits via Stripe's non-profit pricing program (`https://stripe.com/nonprofits`), (2) inline embedded checkout (no redirect), (3) ACH+SEPA+iDEAL+Apple Pay+Google Pay native, (4) recurring (`price.recurring.interval=month`) with one API call, (5) Stripe Tax handles sales-tax/VAT/GST automatically, (6) Stripe Radar fraud-blocks bad cards. PayPal Smart Buttons require redirect, lose 1.7-3% of conversions, no native ACH. Donorbox/Network for Good iframe widgets degrade brand recognition + add ~$50/mo fees on top of processing. Stripe Connect Standard onboards the org's own bank account so funds settle T+2 to the org, NOT to a platform account.

## The Component Contract (drop into `src/components/donation/StripeDonationForm.tsx`)
```tsx
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface StripeDonationFormProps {
  orgConnectId: string;          // acct_xxx from Stripe Connect onboarding (server-side env)
  presets?: number[];            // default GiveDirectly: [10, 25, 50, 100, 250, 500]
  defaultMonthly?: boolean;      // default true — recurring is the bottom-line move
  defaultAmount?: number;        // default 50
  currency?: 'usd' | 'eur' | 'gbp' | 'cad' | 'aud';  // default 'usd'
  coverFees?: boolean;           // default true — checkbox shown checked
  brandColor: string;            // primary brand hex for button + selected preset border
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (msg: string) => void;
}

export function StripeDonationForm(props: StripeDonationFormProps) {
  const presets = props.presets ?? [10, 25, 50, 100, 250, 500];
  const [amount, setAmount] = useState(props.defaultAmount ?? 50);
  const [frequency, setFrequency] = useState<'one-time' | 'monthly'>(props.defaultMonthly ? 'monthly' : 'one-time');
  const [coverFees, setCoverFees] = useState(props.coverFees ?? true);
  // Stripe + Elements wiring — see /api/donate/intent endpoint below
  // ...
}
```

## Preset Amounts (GiveDirectly Pattern)
Universal preset ladder: `[10, 25, 50, 100, 250, 500]`. The 6-tile grid (3×2) is the highest-converting layout (Donorbox 2024 benchmark: 6 presets vs 4 presets = +18% completion). $50 is highlighted as default. Custom-amount input shows beneath the grid with `min={1} max={50000} step={1}`. Currency symbol prefix matches `currency` prop. **Never** use round even ladders like `[5, 10, 20, 50, 100, 200]` — the GiveDirectly spread tests significantly better.

## Frequency Toggle (Monthly = Default)
Two-tab segmented control above the amount grid: `[Monthly] [One-time]`. Monthly is selected by default and visually emphasized (brand-color background, white text). Below the toggle: small italic copy `"Monthly donations help us plan and budget — change or cancel anytime"`. Why monthly default: GiveDirectly + charity:water both default monthly; LTV per donor is 4-7× higher than one-time when monthly is the default vs opt-in (Bloomerang, 2023). Build-breaking: any donation widget where one-time is the default OR monthly is hidden behind a click = fail.

## Cover-The-Fees Checkbox
Label: `"Cover the 2.9% + $0.30 fee so 100% of my gift reaches the mission"`. Checkbox checked by default. Math: `displayedTotal = amount + (amount * 0.029 + 0.30)` rounded to nearest cent. Show the bumped total under the checkbox: `"You'll be charged $51.78 — $50.00 to {OrgName} + $1.78 fee coverage"`. When unchecked: `"You'll be charged $50.00 — {OrgName} receives $48.25 after Stripe fees"`. ~75% of donors leave the box checked when default-on (Classy 2024 study). For non-profit Stripe pricing rate (2.2% + 30¢), substitute: `amount * 0.022 + 0.30`. Fee-cover math MUST live server-side — client value is display-only.

## Backend Endpoint (`POST /api/donate/intent`)
```ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import Stripe from 'stripe';

const donateBody = z.object({
  amount: z.number().int().min(100).max(5_000_000),  // cents
  frequency: z.enum(['one-time', 'monthly']),
  coverFees: z.boolean(),
  email: z.string().email(),
  name: z.string().min(1).max(120),
  currency: z.enum(['usd', 'eur', 'gbp', 'cad', 'aud']).default('usd'),
});

app.post('/api/donate/intent', zValidator('json', donateBody), async (c) => {
  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' });
  const { amount, frequency, coverFees, email, name, currency } = c.req.valid('json');

  const totalCents = coverFees
    ? Math.round((amount / 100 + (amount / 100) * 0.029 + 0.30) * 100)
    : amount;

  if (frequency === 'monthly') {
    const customer = await stripe.customers.create(
      { email, name, metadata: { source: 'donation_widget' } },
      { stripeAccount: c.env.ORG_CONNECT_ID }
    );
    const price = await stripe.prices.create(
      { unit_amount: totalCents, currency, recurring: { interval: 'month' }, product_data: { name: `Monthly donation to ${c.env.ORG_NAME}` } },
      { stripeAccount: c.env.ORG_CONNECT_ID }
    );
    const subscription = await stripe.subscriptions.create(
      { customer: customer.id, items: [{ price: price.id }], payment_behavior: 'default_incomplete', payment_settings: { save_default_payment_method: 'on_subscription' }, expand: ['latest_invoice.payment_intent'] },
      { stripeAccount: c.env.ORG_CONNECT_ID }
    );
    const pi = (subscription.latest_invoice as Stripe.Invoice).payment_intent as Stripe.PaymentIntent;
    return c.json({ clientSecret: pi.client_secret, type: 'subscription', subscriptionId: subscription.id });
  }

  const paymentIntent = await stripe.paymentIntents.create(
    { amount: totalCents, currency, automatic_payment_methods: { enabled: true }, receipt_email: email, metadata: { donor_name: name, original_amount_cents: String(amount), cover_fees: String(coverFees) } },
    { stripeAccount: c.env.ORG_CONNECT_ID }
  );
  return c.json({ clientSecret: paymentIntent.client_secret, type: 'one-time' });
});
```
Note `stripeAccount: ORG_CONNECT_ID` on every call — funds route to the org's connected account, NOT the platform. Webhook handler at `/webhooks/stripe` MUST verify `event.account === ORG_CONNECT_ID` for donation events.

## Connect Onboarding Flow (one-time per org)
1. Org owner signs into admin dashboard → "Set up donations" → POST `/api/connect/onboard`.
2. Server creates Account Link via `stripe.accountLinks.create({ account, refresh_url, return_url, type: 'account_onboarding' })`.
3. Owner completes Stripe-hosted onboarding (bank account, EIN/501c3 verification, identity).
4. Webhook `account.updated` with `charges_enabled=true` and `details_submitted=true` flips `orgs.stripe_connect_status='live'` in D1.
5. Donation widget hides until `stripe_connect_status='live'`. Until then, show `"Donations open soon — sign up for alerts"` + email capture.

## Receipt Email (Resend)
Triggered by webhook `payment_intent.succeeded` (one-time) or `invoice.payment_succeeded` (recurring). Template includes: org name + 501(c)(3) EIN + donation amount + date + payment method last4 + tax-deductible language + monthly cancel link (recurring only). Send via Resend with `from: "donations@{org-domain}"` (verified). Subject: `"Your $50 donation to {OrgName} — receipt"`.

## Secondary Rails (NEVER PRIMARY)
PayPal Smart Buttons|Donorbox|Network for Good|Givebutter|GoFundMe Charity may appear as a "More ways to give" expand below the Stripe form for donors who insist. Acceptable secondary widget shape: `<details><summary>More ways to give</summary>...</details>` collapsed by default. **Never** an iframe widget that competes with the Stripe form for above-the-fold attention. Build-breaking: any site with a Donorbox/PayPal/Givebutter widget rendered ABOVE the Stripe form OR with no Stripe form at all = fail.

## Validator (`scripts/validators/validate-donation-stripe-first.mjs`)
```js
// Pseudo: load every page HTML, find donation sections (heuristic: contains 'donate'|'give'|'support our mission'),
// assert: Stripe Elements present (script src=js.stripe.com OR @stripe/stripe-js bundle string),
// assert: NOT preceded above-the-fold by donorbox.org iframe OR paypal.com/sdk/js.
fail when: donation page exists AND js.stripe.com NOT in HTML.
fail when: donorbox.org iframe present AND js.stripe.com missing.
fail when: paypal.com/sdk/js present AND js.stripe.com missing.
fail when: monthly toggle missing on donation form (assert ['monthly','one-time'] both as text content of toggle buttons).
fail when: presets missing — assert at least 5 of [10, 25, 50, 100, 250, 500] visible as button labels with $ prefix.
fail when: cover-fees checkbox missing — assert any input[type=checkbox] sibling text contains 'cover'+'fee'.
```
Runs in `report` mode initially → flips to `strict` after njsk.org + lonemountainglobal.com benchmarks pass clean.

## Reference Incidents (canonical fixes)
- **njsk.org (2026-05-02):** Original site uses PayPal Smart Buttons exclusively → rebuild MUST replace with Stripe Connect form using GiveDirectly presets. Connect onboarding deferred to admin dashboard; widget shows "Donations launching soon" until org completes onboarding.
- **lonemountainglobal.com (2026-05-02):** Source uses Donorbox iframe widget. Rebuild replaces with native Stripe form. Donorbox kept ONLY in the `<details>` "More ways to give" expand for donor familiarity.

## Cross-Refs
- Validator registered in `~/.agentskills/15-site-generation/quality-gates.md` row 67 (`validate-donation-stripe-first.mjs`).
- Component lives in `~/.agentskills/15-site-generation/template-system.md` `<StripeDonationForm>` entry.
- Fee-cover banned-words exemption: "100% of my gift reaches the mission" stays — it's a quantitative, sourced claim (the math actually delivers 100% to the org when fees covered).
- Pricing program: `https://stripe.com/nonprofits` — orgs MUST apply once verified 501(c)(3) for the 2.2% + 30¢ rate.
