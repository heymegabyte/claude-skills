# Finance Domain

Source: alirezarezvani/claude-skills CFO + finance tier

Unit economics and SaaS metrics for solo AI builder. No MBA required — just the numbers that matter and what to do when they're off.

---

## Core SaaS Metrics

### MRR / ARR

```
MRR = sum of all active monthly subscriptions (normalized to monthly)
ARR = MRR × 12

MRR movement:
  New MRR     = revenue from new customers this month
  Expansion   = revenue from upgrades / seat adds
  Contraction = revenue from downgrades
  Churn MRR   = revenue lost from cancellations
  Net New MRR = New + Expansion − Contraction − Churn
```

**Healthy benchmarks (early SaaS, <$1M ARR):**

- MoM growth: ≥10% (T2D3 path requires 3× then 2× annual)
- Net MRR churn: <2% monthly (<−2% = net revenue retention growth)
- Net Revenue Retention (NRR): ≥100% (expansion covers churn)

---

### CAC (Customer Acquisition Cost)

```
CAC (blended) = total sales + marketing spend in period ÷ new customers acquired

CAC (paid)    = paid channel spend ÷ customers from paid channels
CAC (organic) = time cost of content + SEO ÷ customers from organic
```

**Solo AI builder CAC reality:** Organic + AI-assisted content is the primary channel. Paid CAC is a validation metric, not a growth engine until unit economics are proven.

**PostHog instrumentation:**

- Event: `signup_completed` with `{source: 'organic'|'paid'|'referral', channel: 'google'|'direct'|...}`
- Funnel: `landing_page_view` → `signup_started` → `signup_completed` → `activated` (first value action)

---

### LTV (Lifetime Value)

```
LTV = ARPU × gross margin % ÷ monthly churn rate

ARPU (Average Revenue Per User) = MRR ÷ active customers
Gross margin % = (revenue − COGS) ÷ revenue
  COGS for CF Workers SaaS: API costs + AI inference + D1/R2 storage + Clerk + Resend
Monthly churn rate = customers churned ÷ customers at start of month
```

**Example:**

```
ARPU = $49/mo, gross margin = 82%, churn = 3%/mo
LTV = $49 × 0.82 ÷ 0.03 = $1,337
```

---

### LTV:CAC Ratio

```
LTV:CAC = LTV ÷ CAC

Target:  ≥3:1 (sustainable)
Minimum: ≥1:1 (not losing money on customers)
Ideal:   ≥5:1 (capital-efficient growth)
```

**Warning signals:**

- LTV:CAC <3:1 → either reduce CAC (invest in SEO/content over paid) or increase LTV (pricing, expansion, reduce churn)
- LTV:CAC >10:1 → likely under-investing in growth; allocate more to acquisition

---

### Payback Period

```
Payback period = CAC ÷ (ARPU × gross margin %)

Target:     ≤12 months (SaaS standard)
Bootstrapped target: ≤6 months (cash-flow sensitivity)
```

**Example:**

```
CAC = $200, ARPU = $49, gross margin = 82%
Payback = $200 ÷ ($49 × 0.82) = $200 ÷ $40.18 = ~5 months ✓
```

---

## Runway Modeling

**Formula:**

```
Runway (months) = cash on hand ÷ monthly net burn

Net burn = monthly expenses − monthly revenue (MRR)
```

**Solo builder cash flow model (simple):**

| Line item | Monthly |
|---|---|
| Revenue (MRR) | +$X |
| CF Workers + Cloudflare stack | −$50-200 |
| AI inference (Workers AI / Anthropic) | −$X |
| Clerk | −$25-100 |
| Resend | −$20-50 |
| PostHog | −$0-450 (free tier generous) |
| Sentry | −$0-26 |
| Domain + SSL | −$5-20 (annualized) |
| Contractor / tools | −$X |
| **Net burn** | −$remaining |

**Runway rule:** Maintain ≥12 months runway at all times. Below 12 months → activate revenue acceleration or raise.

---

## Pricing Strategy

**Framework: Value Metric Pricing**

1. Identify the value metric (what correlates with customer value? — seats, usage, records, API calls)
2. Anchor price to value metric growth → expansion revenue without sales effort
3. Tiered: Free (viral / PLG) → Pro (individual) → Business (team) → Enterprise (custom)

**Brian's stack defaults:**

- Free tier: Clerk `free` plan + CF generous free tier — zero marginal cost for <100 users
- Pro: flat monthly (simple — reduces friction)
- Business: per-seat or per-usage (aligns with customer ROI)
- Enterprise: annual contract + custom D1 schema isolation + SLA + SOC 2 attestation

**Pricing decision tree:**

```
Is the value clearly volume-based (API calls, records processed)?
  → Usage-based pricing (metered via Stripe Billing)
Is value per-user (seats, logins)?
  → Per-seat pricing
Is value binary (use it or don't)?
  → Flat monthly
Is the buyer a large org with procurement process?
  → Annual contract with monthly equivalent + 15-20% discount for annual prepay
```

**Discount rules (protect pricing integrity):**

- Never discount >20% without board/advisor sign-off
- Discounts for: nonprofits (up to 50%), annual prepay (15%), pilot/POC (time-limited 30 days)
- Never discount for urgency, budget sensitivity alone — preserves perceived value

---

## Financial Reporting Templates

### Monthly P&L (solo SaaS)

```
Revenue
  MRR (subscriptions): $X
  One-time (setup/consulting): $X
  Total revenue: $X

COGS
  AI inference: $X
  CF infrastructure: $X
  Auth (Clerk): $X
  Email (Resend): $X
  Total COGS: $X

Gross profit: $X (XX%)

OpEx
  Software/tools: $X
  Contractors: $X
  Legal/accounting: $X
  Total OpEx: $X

EBITDA: $X (XX%)
```

### Investor-ready SaaS metrics table

| Metric | This month | Last month | MoM Δ | Target |
|---|---|---|---|---|
| MRR | $X | $X | +X% | $X |
| ARR | $X | — | — | $X |
| New MRR | $X | $X | — | — |
| Churn MRR | $X | $X | — | <2% |
| NRR | XX% | XX% | — | ≥100% |
| Active customers | N | N | +N | — |
| CAC | $X | $X | — | ≤$X |
| LTV | $X | $X | — | ≥3× CAC |
| Payback (mo) | N | N | — | ≤12 |
| Gross margin | XX% | XX% | — | ≥75% |
| Runway | N mo | N mo | — | ≥12 mo |
