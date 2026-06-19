---
name: "Architecture Thought Loop"
description: "30-point recursive thinking checklist that runs at every architecture decision. Pre-mortem, inversion, constraint-first, state machines, error-first, cost modeling, MECE decomposition, parallel path exploration. Fractalated — each point can spawn sub-analysis."
version: "2.0.0"
updated: "2026-04-23"
---

# Architecture Thought Loop (***EVERY ARCHITECTURE DECISION***)

## Phase 0: Before Thinking About Solutions

### 1. Pre-Mortem

- Imagine launch failed; write 5 reasons why and address each in the design.
- "We launched and nobody signed up because `___`" / "broke because `___`" / "ran out of money because `___`"

### 2. Inversion

- Ask "what would guarantee failure?" — then avoid those things.
- If "no auth" guarantees failure, auth is mandatory.

### 3. Boundary Definition

- Define IN scope and OUT scope explicitly before anything else; write it down.
- Features not on the IN list do not exist this session.

### 4. Constraint Inventory

List ALL constraints before designing:

- **CF Workers** — 10ms CPU, 128MB memory, 25MB bundle
- **D1** — 5M rows free, no JOINs >3 tables efficiently
- **KV** — 100K reads/day free, eventual consistency
- **R2** — 10GB free, S3-compatible
- **Budget** — $0/mo target (free tier only initially)
- **Time** — one session to deploy
- **Users** — zero on day one; design for first 100, not first million

### 5. Competitive Snapshot

- Firecrawl the top 3 competitors before building anything.
- Extract pricing, features, design patterns, tech stack (via Wappalyzer). Beat them on one axis, match on the rest.

## Phase 1: Decomposition

### 6. User Story Decomposition

- Every feature: "As a [user type], I want [action] so that [benefit]."
- Vague benefit ("so that things are better") = feature isn't needed.

### 7. MECE Decomposition

- **Mutually Exclusive, Collectively Exhaustive** — covers all user needs with no overlap.
- Two features doing the same thing → merge. User need with no feature → add one.

### 8. User Journey Mapping

Walk the complete journey before coding any screen:

1. Visit landing → 2. Read value prop → 3. Click CTA → 4. Sign up → 5. Onboard → 6. First value moment → 7. Return trigger → 8. Upgrade → 9. Refer

Every step must exist. Every transition must be designed. Dead ends = churn.

### 9. Data Flow Tracing

For every entity, trace: enter → store → transform → display → export → delete

- Example: User → Clerk webhook → D1 `users` table → API `/me` → UI profile → CSV export → account deletion
- Any unclear step = architecture hole.

### 10. State Machine Modeling

Every entity has states. Map them:

```
User: anonymous → signed_up → onboarded → active → churned → deleted
Subscription: trial → active → past_due → canceled → expired
Invoice: draft → open → paid → void → uncollectible
```

Missing transition = code crash on that edge case.

## Phase 2: Design Decisions

### 11. API-First

- Define the API contract (Zod schemas + routes) BEFORE any UI or database code.
- API is truth; UI is a view; database is storage. No API field needed = no DB column needed.

### 12. Error-First Design

Design error states BEFORE the happy path:

- API down → retry + fallback UI
- Auth expires mid-session → redirect to login
- Invalid data → inline validation
- Payment fails → grace period + retry
- Database full → alert + degrade gracefully

### 13. Parallel Path Exploration

- Design 3 approaches for every major decision; argue each; pick the winner.
- Document the decision AND the rejected alternatives with reasoning.

### 14. Reversibility Check (Bezos One-Way/Two-Way Door)

- **Two-way door (reversible)** — pick in 5 seconds (column name, UI color, copy text).
- **One-way door (irreversible)** — spend 5 minutes (schema, auth provider, payment processor, domain).

### 15. Dependency Audit

For every new package:

- Can I do this without it? Bundle cost? Maintained? CF Workers compatible (no Node.js APIs)?
- **Rule** — >10KB bundle addition + buildable in <1h = build it instead.

## Phase 3: Quality Thinking

### 16. Simplicity Audit

- Remove 30% of features after designing. If core value survives, removed features were premature.
- Ship the simpler version; add features when users ask.

### 17. Performance Budget Allocation

200KB JS budget — divide BEFORE building:

- Framework (Angular) — ~100KB
- UI library (PrimeNG) — ~50KB
- Your code — ~30KB
- Third-party (Clerk, Stripe, PostHog) — ~20KB

Feature busting the budget → lazy load, server-side, or remove.

### 18. Security Threat Model (STRIDE)

For EVERY feature touching user data or money:

- **S**poofing / **T**ampering / **R**epudiation / **I**nformation disclosure / **D**enial of service / **E**levation of privilege

### 19. Accessibility-First Design

- Design for screen readers FIRST, then add visual polish.
- Coherent screen-reader experience forces correct information hierarchy.

### 20. Mobile-First Wireframe

- Sketch 375px layout before desktop. If a feature doesn't fit on mobile, question whether it belongs.

## Phase 4: Content & SEO Thinking

### 21. Content-First Design

- Write the ACTUAL headline, description, and CTA before designing the layout.
- Generic layouts with "Your headline here" produce generic products.

### 22. SEO Keyword Research

- Research the primary keyphrase BEFORE writing any copy (Google Autocomplete, Ahrefs free, Context7).
- Keyphrase determines: page title, H1, meta description, URL slug, alt text.

### 23. Copy Hierarchy

- **H1** — primary value prop (one per page) / **H2** — supporting benefits / **H3** — feature details / **CTA** — clear action verb.
- Can't write H1 in 8 words = don't understand the product.

## Phase 5: Infrastructure Thinking

### 24. Cost Modeling

Estimate monthly CF consumption before building:

- Workers: N requests × 10ms CPU / D1: N rows × N queries/day / KV: N reads/day / R2: N GB + N ops

Use cost-estimator agent. Exceeds free tier at 1000 users → redesign.

### 25. Failure Mode Analysis

| Service | What if down? | Fallback | Recovery |
|---------|--------------|----------|----------|
| Clerk | Auth fails | Cached session + retry | Auto-reconnect |
| Stripe | Payment fails | Queue + retry via Inngest | Webhook reconciliation |
| D1 | DB unavailable | KV cache fallback | Auto-retry |
| R2 | Storage unavailable | Serve cached version | Retry upload |

### 26. Migration Path

Design for today, document the escape hatch:

- **D1 → Neon** — when >3 table JOINs or >500MB
- **KV → Upstash Redis** — when need atomic ops or pub/sub
- **Clerk → self-hosted Authentik** — when >50K MAU or need SSO
- **Stripe → LemonSqueezy** — when need MoR for international tax

### 27. Integration Point Mapping

- List every external system; each is a failure point, a rate limit, and a cost.
- Example: Clerk → Stripe → D1 → R2 → Resend → PostHog → Sentry → CF Workers

## Phase 6: Meta-Thinking

### 28. Five Whys

- Ask "why" five times on every architecture decision until the choice is grounded in facts.

### 29. Second-Order Effects

- For every feature ask: what does it enable? what does it break?
- Second-order effects larger than the feature itself → defer it.

### 30. The "Delete It" Test

- After designing everything, ask "What if I deleted this feature entirely?"
- Product still works + users still get value → delete it. Every unbuilt feature = zero maintenance.

## Execution Pattern

For every architecture decision:

1. Phase 0 (pre-mortem, inversion, constraints) — 2 min
2. Phase 1 (decompose, MECE, journey, data flow) — 5 min
3. Phase 2 (API-first, error-first, 3 paths) — 5 min
4. Phase 3 (simplify, budget, STRIDE, a11y, mobile) — 3 min
5. Phase 4 (content-first, SEO, copy hierarchy) — 2 min
6. Phase 5 (cost, failures, migration, integrations) — 3 min
7. Phase 6 (five whys, second-order, delete test) — 2 min

**Total** — ~22 min of thinking saves 22 hours of rework

## Fractal Property

- Each of the 30 points can spawn sub-analysis.
- Pre-mortem → competitive research. Cost model → CF pricing analysis. STRIDE → security-reviewer agent.
- The thought loop IS the fractal — every facet generates new facets, each terminating at a clear decision.
