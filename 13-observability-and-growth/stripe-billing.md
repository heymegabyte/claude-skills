---
name: "Stripe Billing"
description: "SaaS subscriptions + enterprise billing default. Tiered pricing, seat-based billing, Stripe Tax, Billing Meters (metered usage), Entitlements (feature gating), Connect (marketplaces), Atlas, Agentic Commerce (ACP). Use Stripe ONLY when SaaS subscriptions / metered usage / Entitlements / Connect marketplaces / enterprise invoicing are involved — for nonprofits, donations, and small-business one-time charges use 13/square-payments instead."
updated: "2026-05-10"
---

> **Routing rule (***FIRST DECISION***):** If the feature is nonprofit donations, small-business one-time checkout, restaurant/retail POS, or sub-$100 average ticket → use [13/square-payments](square-payments.md). Stripe is reserved for SaaS subscriptions, metered usage, Entitlements feature gating, Connect marketplaces, and enterprise invoicing. Hybrid is allowed (Square for donations + Stripe for SaaS subs on same site).

# Stripe Billing

## Default Pricing Models

### SaaS Products

- **Free** — $0/mo — limited features, no payment required
- **Pro** — $50/mo — all features, priority support, cancel anytime
- **Enterprise** — custom — SSO, SLA, dedicated support, volume pricing

**Seat-Based Billing** — `quantity` on subscription items:

```typescript
stripe.subscriptions.update(subId, { items: [{ id: itemId, quantity: seatCount }] })
```

- Auto-adjust on member add/remove via Clerk org webhook; prorate mid-cycle
- Display: `"$12/seat/mo × 8 seats = $96/mo"`

**Stripe Tax** — automatic tax calculation:

```typescript
stripe.subscriptions.create({ automatic_tax: { enabled: true } })
```

- Requires `tax_behavior: 'exclusive'|'inclusive'` on each Price
- Register jurisdictions: `stripe.tax.registrations.create({ country, state, type })`
- Display tax line on invoices; no tax on $0 free tiers

- Annual billing default (20% discount) — $480/year vs $600
- Stripe Link enabled for one-click checkout (7%+ conversion lift)
- Show monthly price on annual plan: `"$40/mo billed annually"`

### Nonprofit / Donation

- **$10** — "Feeds a family for a day"
- **$25** — "Covers supplies for a week"
- **$50** — "Powers the hotline for a month"
- **$100** — "Sponsors a full program"
- **$250** — "Transforms a life"
- **$500** — "Makes a lasting impact"
- **Custom** — "Choose your amount"
- Monthly recurring as default; one-time as option
- Impact labels on every amount — specific, concrete, not vague
- Progress bar showing goal achievement

## Auto-Setup Workflow

### 1. Create Stripe Product + Prices

```typescript
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

// Create product
const product = await stripe.products.create({
  name: 'Project Name Pro',
  description: 'All features, priority support',
  metadata: { project: 'domain.com' },
});

// Create prices
const monthlyPrice = await stripe.prices.create({
  product: product.id,
  unit_amount: 5000, // $50.00
  currency: 'usd',
  recurring: { interval: 'month' },
});

const annualPrice = await stripe.prices.create({
  product: product.id,
  unit_amount: 48000, // $480.00 (20% off)
  currency: 'usd',
  recurring: { interval: 'year' },
});
```

### 2. Create Checkout Endpoint

```typescript
app.post('/api/checkout', async (c) => {
  const { priceId, successUrl, cancelUrl } = await c.req.json();

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription', // or 'payment' for one-time
    payment_method_types: ['card', 'link'], // Stripe Link for one-click
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl || `${c.req.url.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${c.req.url.origin}/pricing`,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    customer_creation: 'always',
  });

  return c.json({ url: session.url });
});
```

### 3. Brand the Checkout

```typescript
// Set Stripe account branding to match site
await stripe.accounts.update('acct_...', {
  settings: {
    branding: {
      icon: 'https://domain.com/favicon-32x32.png',
      logo: 'https://domain.com/logo.png',
      primary_color: '#00E5FF',
      secondary_color: '#060610',
    }
  }
});
```

### 4. Webhook Handler

```typescript
app.post('/api/webhooks/stripe', async (c) => {
  const sig = c.req.header('stripe-signature')!;
  const body = await c.req.text();
  const event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);

  switch (event.type) {
    case 'checkout.session.completed':
      // Activate subscription, send welcome email via Resend
      break;
    case 'customer.subscription.deleted':
      // Deactivate subscription, send retention email
      break;
    case 'invoice.payment_failed':
      // Notify user, retry logic
      break;
  }
  return c.json({ received: true });
});
```

## Donation Page Design (givedirectly.org style)

- Full-screen split: left 60% cause imagery + impact story + real numbers; right 40% amount selector + checkout form + progress bar

### Donation Goal + Progress Bar

```typescript
// Real-time via Durable Objects + Stripe webhooks
app.get('/api/donation-progress', async (c) => {
  const goal = 10000; // $10,000 goal
  const raised = await getDonationTotal(c.env.DO); // from Durable Object
  return c.json({ goal, raised, percentage: Math.min(100, (raised / goal) * 100) });
});
```

### Post-Donation Flow

1. Success page with confetti animation (06/easter-eggs energy)
2. Auto-email via Resend: thank you + tax receipt + ask to share
3. Auto-email all participants when goal is met
4. PostHog event: `donation_complete` with amount and method

## Conversion Optimization (Research-Backed)

- 3 tiers maximum (paradox of choice — 3 converts better than 5)
- Highlight middle tier as "Most Popular" (anchoring effect)
- Show annual savings prominently (`"Save $120/year"`)
- Include FAQ below pricing; feature comparison table
- Trust signals near CTA: `"Trusted by X users"`, security badge
- Stripe Link reduces checkout time 7× (one-click for returning users)
- Show `"Powered by Stripe"` security badge near payment form
- Guest checkout default; show total prominently before final submit

## Psychology of Pricing (04/wisdom-and-human-psychology)

- **Anchoring (Kahneman)** — show annual price first; $480/year makes $50/month feel reasonable
- **Loss Aversion (Kahneman & Tversky)** — `"Don't lose your progress"` > `"Keep your progress"`
- **Reciprocity (Cialdini)** — generous free tier creates internal drive to convert or refer
- **Social Proof (Cialdini)** — `"Join 1,200 supporters"` near every pricing CTA
- **Peak-End Rule (Kahneman)** — confetti + warm email + later impact update = memory of joy

### The Ethical Line

- Real scarcity only (actual limited spots, actual deadline)
- No confirmshaming (`"No, I don't want to help"` = dark pattern)
- Easy cancellation — as easy as signup; no hidden fees at checkout

## Billing Meter API v2 (GA 2026)

Required for metered/usage-based pricing. `POST /v1/billing/meters` creates meter; `POST /v1/billing/meter_events` streams events. Track usage in KV → batch flush via `ctx.waitUntil()`.

```typescript
// Create meter (once)
const meter = await stripe.billing.meters.create({
  display_name: 'API Calls',
  event_name: 'api_call',
  default_aggregation: { formula: 'sum' },
});
// Stream events (per request)
await stripe.billing.meterEvents.create({
  event_name: 'api_call',
  payload: { stripe_customer_id: customerId, value: '1' },
});
```

## Entitlements API (GA 2026)

Define Features (`POST /v1/entitlements/features`), attach to Products; check at API boundary:

```typescript
const { data } = await stripe.entitlements.activeEntitlements.list({ customer: customerId });
const hasFeature = data.some(e => e.feature.lookup_key === 'advanced_analytics');
if (!hasFeature) return c.json({ error: 'Upgrade required', code: 'ENTITLEMENT_MISSING' }, 403);
```

- Use for plan-tier feature gating; auto-updates when plan changes — no webhook needed for feature access

## Stripe Agentic Commerce (ACP — 2026)

Agent calls `stripe.checkout.sessions.create()` with `ui_mode: 'embedded'` → user confirms in Stripe-hosted UI → agent receives confirmation. No agent handles raw card data.

```typescript
// Agent-initiated checkout (user confirms in Stripe UI)
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  ui_mode: 'embedded',
  line_items: [{ price: agentSelectedPriceId, quantity: 1 }],
  return_url: `${origin}/agent-purchase-complete?session_id={CHECKOUT_SESSION_ID}`,
});
// Return session.client_secret to agent for user confirmation
```

## Metronome (Acquired Jan 2026)

Multidimensional metering for AI/usage-based billing at scale: per-token, per-seat, per-API-call combos. Supersedes Billing Meter API for complex scenarios.

## Key Locations

- **Stripe API key** — shared key pool (05/shared-api-pool)
- **Webhook secret** — `wrangler secret` per project
- **Test mode** — always use `sk_test_` before going live

## SaaS Business Strategy (Source: Stripe Atlas Guides + YC 2026)

### Two Core SaaS Models

- **Low-Touch SaaS** — self-serve; optimize for onboarding speed + activation rate; target monthly churn <5% (ideally <3%); growth via PLG + SEO
- **High-Touch SaaS** — enterprise sales; optimize for demo + integration support; target Net Revenue Retention >120%; growth via outbound + partnerships

### Critical SaaS Metrics (Monitor From Day 1)

- **MRR** — growing month-over-month (primary health indicator)
- **Churn Rate** — <5% monthly SMB, <1% enterprise
- **LTV:CAC Ratio** — >3:1
- **Time to Value** — <60 seconds for free tier
- **Activation Rate** — 20-40% of signups

### Pricing Strategy (YC + Stripe Consensus)

1. Generous free tier → higher paid conversion via reciprocity
2. Annual billing default + 20% discount → lower churn, better cash flow
3. Price anchoring — show enterprise/annual first
4. Three tiers maximum (Hick's Law)
5. AI-native baseline — every 2026 SaaS delivers more value than static software
