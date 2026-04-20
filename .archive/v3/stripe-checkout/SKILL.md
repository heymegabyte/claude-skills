---
name: stripe-checkout
description: Create the ultimate brand-matched Stripe checkout experience. Configures Stripe account, products, prices, payment links, and checkout sessions via the API to create a seamless, beautiful donation/payment flow that matches the project's visual identity. Use when the user mentions Stripe, donations, payments, checkout, or accepting money.
---

# Stripe Checkout — Brand-Matched Payment Experience

Create a perfectly branded Stripe checkout that feels native to the project's UI. This skill handles everything from API key setup to a fully customized checkout page.

## When to Trigger
- User mentions Stripe, donations, payments, checkout, accepting money
- User provides a Stripe API key
- User wants to set up a payment/donation page
- Project has a "Donate" button that needs a real payment link

## Prerequisites
- Stripe API key (sk_live_* or sk_test_*)
- Project must have: brand colors, logo URL, product name, description

## Workflow

### Step 1: Get API Key
Ask for the Stripe API key if not provided:
```
Please paste your Stripe API key (starts with sk_live_ or sk_test_).
Get it at: https://dashboard.stripe.com/apikeys
```

### Step 2: Extract Brand Identity from Project
Scan the project for:
- **Primary color** (hex) — use for Stripe branding
- **Logo URL** — for checkout page header
- **Product name** — from project title
- **Product description** — from meta description or tagline
- **Support email** — from contact info
- **Domain** — for success/cancel redirect URLs

### Step 3: Configure Stripe Account Branding
```javascript
const stripe = require('stripe')(STRIPE_API_KEY);

// Set account branding to match project
await stripe.accounts.update({
  settings: {
    branding: {
      primary_color: '#D4A853',     // From project theme
      secondary_color: '#050D1A',   // From project background
      icon: 'https://unique.megabyte.space/assets/icon-512.png',
      logo: 'https://unique.megabyte.space/assets/logo-horizontal.png',
    },
  },
});
```

### Step 4: Create Product + Price
```javascript
const product = await stripe.products.create({
  name: 'Support Unique Voice',
  description: 'Fund AI infrastructure that helps homeless people apply for government benefits.',
  images: ['https://unique.megabyte.space/assets/og-image.png'],
});

// Create multiple price tiers
const prices = await Promise.all([
  stripe.prices.create({ product: product.id, unit_amount: 500, currency: 'usd', nickname: 'Coffee' }),
  stripe.prices.create({ product: product.id, unit_amount: 1500, currency: 'usd', nickname: 'Monthly server costs' }),
  stripe.prices.create({ product: product.id, unit_amount: 5000, currency: 'usd', nickname: 'Sponsor a month' }),
  stripe.prices.create({ product: product.id, unit_amount: 15000, currency: 'usd', nickname: 'Sponsor a quarter' }),
]);
```

### Step 5: Create Payment Link
```javascript
const paymentLink = await stripe.paymentLinks.create({
  line_items: [{ price: prices[0].id, quantity: 1, adjustable_quantity: { enabled: true } }],
  allow_promotion_codes: true,
  after_completion: {
    type: 'redirect',
    redirect: { url: 'https://unique.megabyte.space/?donated=true' },
  },
  custom_text: {
    submit: { message: '100% funds AI infrastructure for homeless benefits automation.' },
  },
});
```

### Step 6: Update Project
- Replace placeholder `donate.stripe.com` URLs with the real Payment Link URL
- Add the Stripe API key to environment variables
- Update the Donate button to use the payment link
- Optionally add a dedicated /donate page with tier cards

### Step 7: Verify
- Test the payment link in browser
- Verify branding matches
- Confirm redirect works
- Check Stripe Dashboard for the product

## Key Principles
- **Match the brand perfectly** — colors, fonts, logo should feel like the same product
- **Multiple donation tiers** — let people choose how much to give
- **Transparency** — always show what the money funds (server costs, AI, etc.)
- **One-click** — payment link should work with zero friction
- **Mobile-first** — Stripe checkout is already mobile-optimized
- **Test mode first** — use sk_test_ key until everything looks perfect, then switch to live

## Environment Variable
```
STRIPE_API_KEY=sk_live_... or sk_test_...
```

Store in .env and Fly.io secrets. Never commit to version control.
