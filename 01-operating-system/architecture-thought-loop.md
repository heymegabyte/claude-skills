---
name: "Architecture Thought Loop"
description: "30-point recursive thinking checklist that runs at every architecture decision. Pre-mortem, inversion, constraint-first, state machines, error-first, cost modeling, MECE decomposition, parallel path exploration. Fractalated — each point can spawn sub-analysis."
version: "2.0.0"
updated: "2026-04-23"
---

# Architecture Thought Loop (***EVERY ARCHITECTURE DECISION***)

## Phase 0: Before Thinking About Solutions

### 1. Pre-Mortem

- Imagine the project launched and failed
- Write 5 reasons why; address each in the design
- "We launched and nobody signed up because ___"
- "We launched and it broke because ___"
- "We launched and we ran out of money because ___"

### 2. Inversion

- Instead of "what should I build?", ask "what would guarantee this fails?" — then avoid those things
- Bad architecture = doing the inverse
- If "no auth" guarantees failure, auth is mandatory, not a nice-to-have

### 3. Boundary Definition

- Define IN scope and OUT scope explicitly before anything else
- Write it down
- If a feature isn't on the IN list, it doesn't exist this session
- Prevents scope creep mid-build

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

- Before building ANYTHING, Firecrawl the top 3 competitors
- Extract: pricing, features, design patterns, tech stack (via Wappalyzer)
- Beat them on one axis, match on the rest

## Phase 1: Decomposition

### 6. User Story Decomposition

- Every feature becomes: "As a [user type], I want [action] so that [benefit]"
- If you can't write the story, you don't understand the feature
- If the benefit is vague ("so that things are better"), the feature isn't needed

### 7. MECE Decomposition

- **Mutually Exclusive, Collectively Exhaustive**
- Every feature set must cover all user needs (exhaustive) with no overlap (exclusive)
- Two features doing the same thing → merge
- User need with no feature → add one

### 8. User Journey Mapping

Walk the COMPLETE journey before coding any screen:

1. Visit landing
2. Read value prop
3. Click CTA
4. Sign up
5. Onboard
6. First value moment
7. Return trigger
8. Upgrade
9. Refer

Every step must exist. Every transition must be designed. Dead ends = churn.

### 9. Data Flow Tracing

For every entity, trace: enter → store → transform → display → export → delete

- Example: User → Clerk webhook → D1 `users` table → API `/me` → UI profile → CSV export → account deletion
- If any step is unclear, the architecture has a hole

### 10. State Machine Modeling

Every entity has states. Map them:

```
User: anonymous → signed_up → onboarded → active → churned → deleted
Subscription: trial → active → past_due → canceled → expired
Invoice: draft → open → paid → void → uncollectible
```

If a transition is missing, the code will crash on that edge case.

## Phase 2: Design Decisions

### 11. API-First

- Define the API contract (Zod schemas + routes) BEFORE any UI or database code
- The API is the truth; UI is a view of it; database is storage for it
- If the API doesn't need a field, the database doesn't need a column

### 12. Error-First Design

Design error states BEFORE the happy path:

- API down → retry + fallback UI
- Auth expires mid-session → redirect to login
- User submits invalid data → inline validation
- Payment fails → grace period + retry
- Database full → alert + degrade gracefully

### 13. Parallel Path Exploration

- For every major decision, design 3 approaches; argue each; pick the winner
- Example: "D1 vs Neon vs KV — D1 wins (relational data, free tier sufficient, Drizzle). Neon loses (overkill). KV loses (no relational queries)."
- Document the decision AND the rejected alternatives — future-you needs to know WHY

### 14. Reversibility Check (Bezos One-Way/Two-Way Door)

- **Two-way door (reversible)** — pick in 5 seconds (DB column name, UI color, copy text)
- **One-way door (irreversible)** — spend 5 minutes (schema design, auth provider, payment processor, domain name)
- Most decisions are two-way doors being treated as one-way — move faster

### 15. Dependency Audit

For every new package, ask:

- Can I do this without it?
- What's the bundle cost?
- Is it maintained?
- Does it work on CF Workers (no Node.js APIs)?
- If the package disappeared tomorrow, how hard is the replacement?

**Rule** — If it adds >10KB to the bundle and you could build it in <1 hour, build it.

## Phase 3: Quality Thinking

### 16. Simplicity Audit

- After designing, remove 30% of features
- If the product still delivers its core value, the removed features were premature
- Ship the simpler version; add features when users ask, not when you imagine they'll need them

### 17. Performance Budget Allocation

200KB JS budget — divide it BEFORE building:

- Framework (Angular) — ~100KB
- UI library (PrimeNG) — ~50KB
- Your code — ~30KB
- Third-party (Clerk, Stripe, PostHog) — ~20KB

If a feature would bust the budget, use a different approach (lazy load, server-side, remove).

### 18. Security Threat Model (STRIDE)

For EVERY feature touching user data or money:

- **S**poofing — can someone pretend to be another user?
- **T**ampering — can someone modify data they shouldn't?
- **R**epudiation — can someone deny they did something?
- **I**nformation disclosure — can someone see data they shouldn't?
- **D**enial of service — can someone break the system for others?
- **E**levation of privilege — can someone gain admin access?

### 19. Accessibility-First Design

- Design for screen readers FIRST, then add visual polish
- If the screen reader experience is coherent, the visual design will be better — information hierarchy is forced correct

### 20. Mobile-First Wireframe

- Sketch 375px layout before desktop
- Mobile constraints force prioritization
- If a feature doesn't fit on mobile, question whether it belongs at all

## Phase 4: Content & SEO Thinking

### 21. Content-First Design

- Write the ACTUAL headline, description, and CTA before designing the layout
- The content dictates the design, not the other way around
- Generic layouts with "Your headline here" produce generic products

### 22. SEO Keyword Research

- Research the primary keyphrase BEFORE writing any copy
- Tools: Google Autocomplete, Ahrefs free, Context7 for related terms
- Keyphrase determines: page title, H1, meta description, URL slug, alt text

### 23. Copy Hierarchy

- **H1** — primary value prop (one per page)
- **H2** — supporting benefits
- **H3** — feature details
- **CTA** — clear action verb
- If you can't write the H1 in 8 words, you don't understand the product

## Phase 5: Infrastructure Thinking

### 24. Cost Modeling

Estimate monthly CF consumption before building:

- Workers — N requests × 10ms CPU
- D1 — N rows × N queries/day
- KV — N reads/day
- R2 — N GB storage + N operations

Use cost-estimator agent. If it exceeds free tier at 1000 users, redesign.

### 25. Failure Mode Analysis

For each external integration:

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

- List every external system the product touches
- Each one is a failure point, a rate limit, and a cost
- Example: Clerk (auth) → Stripe (payments) → D1 (data) → R2 (files) → Resend (email) → PostHog (analytics) → Sentry (errors) → CF Workers (compute)

## Phase 6: Meta-Thinking

### 28. Five Whys

- For every architecture decision, ask "why" five times
- Example: "Use D1." Why? "Need relational data." Why relational? "Users have subscriptions." Why not KV? "Need JOINs for billing queries." Why not Neon? "Free tier sufficient, D1 is simpler." → Decision grounded.

### 29. Second-Order Effects

- For every feature, ask: what does it enable? what does it break?
- Example: "Add team support" → enables collaboration + higher pricing tier → breaks all queries (need `org_id` scope), permissions model, invite flow, billing per-seat
- If the second-order effects are larger than the feature itself, defer it

### 30. The "Delete It" Test

- After designing everything, ask: "What if I deleted this feature entirely?"
- If the product still works and users still get value, delete it
- Every feature you DON'T build is maintenance you DON'T have

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

- Each of the 30 points can spawn sub-analysis
- Pre-mortem spawns "why did we fail?" which spawns competitive research
- Cost model spawns CF pricing analysis
- STRIDE spawns security-reviewer agent
- The thought loop IS the fractal — every facet generates new facets, but each terminates when it reaches a clear decision
