---
name: "ecommerce-stack"
priority: 3
pack: "ecommerce"
triggers:
  - "ecommerce"
  - "shop"
  - "cart"
  - "checkout"
  - "medusa"
paths:
  - "concern:ecommerce"
---

# E-commerce Stack

## Mandate

- Every e-commerce site (product catalog + cart + checkout + orders + inventory) MUST use **Medusa.js** as the headless commerce backend
- Frontend stays React+Vite or Angular+Ionic per `frontend-stack` — Medusa is the backend/API layer, never the frontend
- Hand-rolled cart/checkout/inventory tables in your own D1 schema for an e-commerce surface = build fail

## What counts as "e-commerce" (auto-fire triggers)

- Product catalog with ≥2 SKUs + cart + checkout
- Inventory tracking, variants (size/color/SKU), fulfillment, returns, RMAs
- Multi-product purchases in one transaction (cart vs single-item checkout)
- Domain phrases that fire this rule: `shop|store|cart|checkout|catalog|inventory|sku|variant|order|fulfillment|return|rma|wholesale|b2b commerce|marketplace`

## Why Medusa

- **MIT-licensed**, self-hostable (Coolify / Fly / Cloudflare Container DO)
- **Headless** — clean REST + GraphQL APIs; pairs with React+Vite or Angular+Ionic
- **Plugin ecosystem** — Stripe, Square, PayPal, Klarna, Meilisearch, Sanity, Strapi, S3/R2, Algolia
- **Batteries included** — products, variants, inventory across locations, taxes, discounts, gift cards, returns, RMAs, multi-currency, multi-region, sales channels
- **Admin dashboard ships free** (React) — never build your own
- **Beats**: WooCommerce (PHP, slow, plugin sprawl), Shopify (closed + expensive), Saleor (Python + GraphQL-only), Vendure (Node but lower adoption), commerce.js (deprecated)

## Frontend pairing

- **React+Vite + `@medusajs/medusa-js` client** → storefront, product pages, cart, checkout. Tailwind + shadcn for UI.
- **Angular+Ionic + typed HTTP client** when the project is pinned to Angular per `frontend-stack`
- The Medusa Next.js starter is **NOT permitted** — Next.js is banned by `frontend-stack` unless Brian explicitly says otherwise

## Payment integration

- Medusa supports both Stripe and Square via official plugins
- Pick the rail per `payments-routing` decision tree:
  - POS / sub-$100 average ticket / hybrid in-person+online → **Square** Medusa plugin
  - SaaS-with-commerce-on-top / multi-currency + tax complexity → **Stripe** Medusa plugin
- NEVER bypass Medusa to wire payments directly — Medusa owns the order state machine + idempotency
- Webhook handlers terminate at Medusa, not at custom Worker routes

## Deployment

- **Medusa server** → Cloudflare Container DO OR Coolify VPS (Docker image)
- **Postgres** → Neon (Medusa requires Postgres; D1 is not supported)
- **Redis** → Upstash (Medusa uses Redis for events + workflow state + caching)
- **File storage** → R2 via S3-compatible Medusa plugin
- **Admin dashboard** → built static, served via Cloudflare Pages or R2 + Worker

## Required secrets (per `secret-auto-provisioning`)

- `DATABASE_URL` (Neon connection string)
- `REDIS_URL` (Upstash REST URL)
- `MEDUSA_JWT_SECRET` (Tier 1 generated — `openssl rand -base64 32`)
- `MEDUSA_COOKIE_SECRET` (Tier 1 generated)
- `MEDUSA_ADMIN_API_KEY` (Tier 2 minted on first admin user creation)
- `STRIPE_*` / `SQUARE_*` per `payments-routing`

## Observability (per `auto-meta-work`)

- Sentry `@sentry/node` SDK in the Medusa server
- PostHog server-side capture on every order event (`order.placed`, `order.fulfilled`, `order.refunded`)
- Workers Tracing OTLP exporter for I/O spans when Medusa runs on Container DO

## NEVER

- Roll your own cart/checkout/inventory tables for an e-commerce surface
- Use WooCommerce / Shopify / Saleor / Vendure / commerce.js without Brian's explicit "use X this time"
- Bypass Medusa to write directly to its DB tables — always use the Medusa API/SDK
- Skip the Medusa admin and build your own admin from scratch — the bundled one is polished
- Ship the Medusa Next.js starter — Next.js is banned per `frontend-stack`
- Put Medusa on D1 — it requires Postgres

## ALWAYS

- Medusa.js for every e-commerce backend
- React+Vite or Angular+Ionic for the storefront frontend
- Square or Stripe Medusa plugin per `payments-routing`
- Neon Postgres + Upstash Redis + R2 storage triplet
- Admin dashboard served as a static build, gated by Clerk M2M JWT for staff access
