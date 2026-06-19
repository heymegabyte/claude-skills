# PM Domain

Source: alirezarezvani/claude-skills product tier (17 skills)

Solo AI builder does not have a PM. Brian IS the PM. These frameworks ensure product decisions are structured, customer-grounded, and traceable.

---

## PRD (Product Requirements Document)

**When to write one:** Any feature >4h of implementation time, or any feature that will be customer-facing and requires stakeholder alignment.

**Template (lean — max 1 page):**

```markdown
## PRD: [Feature name]
Date: YYYY-MM-DD | Status: draft | approved | shipped | deprecated
Flag: `feature_flags.key_name` (experimental → beta → stable)

### Problem
[One paragraph. What user pain are we solving? Quantified if possible: "X% of users abandon at step Y".]

### Who
ICP: [Job title, company size, context]
User story: As a [persona], I want [action] so that [outcome].

### What (scope)
In: [Bullet list — what IS included]
Out: [Bullet list — what is explicitly NOT included]

### Success metrics
Primary: [One metric with target — e.g., "activation rate from 12% → 20% in 30 days"]
Secondary: [1-2 supporting metrics]
Anti-metric: [What we're NOT optimizing for]

### Acceptance criteria
- [ ] [Specific, testable, user-observable]
- [ ] [Map to E2E test steps in `e2e/FEATURES.md`]

### Design decisions
[Any non-obvious technical or UX choices and why]

### Risks
[Bullet list: risk + mitigation]

### Launch checklist
- [ ] Feature flag at `enabled=0, rollout=0, stage='experimental'`
- [ ] E2E test GREEN
- [ ] Lighthouse A11y ≥95
- [ ] PostHog event instrumented: `[feature]_[action]`
```

---

## OKR Framework

**Cadence:** Quarterly. Set week 1, review week 6, retrospect week 13.

**Structure:**

```
Objective: [Qualitative, inspirational, directional — not a metric]
  KR1: [Measurable, binary or 0-1 scale, specific deadline]
  KR2: [Same]
  KR3: [Same — max 3 KRs per O]
```

**Solo builder OKR rules:**

- Max 2 objectives per quarter (one = not stretching, three = fragmented)
- Every KR has a single owner: Brian (or a named agent/system)
- KR grade ≥0.7 = success. 1.0 = sandbagged. 0.3 = learning (not failure, document why)
- Tie each KR to a PostHog metric — if it can't be measured, it's not a KR

**Example:**

```
O1: Become the go-to AI-native tool for nonprofit finance teams
  KR1: 5 paying nonprofit orgs by June 30 (currently 1)
  KR2: NPS ≥50 among active users (survey via PostHog surveys)
  KR3: ≤2% monthly churn (PostHog: `subscription_cancelled` events)
```

---

## Roadmap Authoring

**Format:** Now / Next / Later (no Gantt, no Jira, no sprints).

```markdown
## Roadmap — [Product] — [Quarter YYYY]

### Now (this 6 weeks — committed)
- [Feature A] — ships YYYY-MM-DD — flag: `feature_a`
- [Feature B] — ships YYYY-MM-DD — flag: `feature_b`

### Next (7-12 weeks — planned, not committed)
- [Feature C] — depends on: [A customer signal or metric]
- [Feature D]

### Later (13+ weeks — ideas, no commitment)
- [Feature E] — revisit when MRR > $X or after [milestone]
- [Feature F]

### Dropped (with reason)
- [Feature G] — dropped YYYY-MM-DD: [one sentence why]
```

**Rules:**

- "Now" items have a flag, a test, and a ship date.
- "Later" items are never designed or specced — just a name.
- Every drop is documented with reason (prevents zombie features).
- Roadmap lives at `docs/ROADMAP.md` — single source of truth.

---

## Stakeholder Management

**Who are Brian's stakeholders (solo context):**

1. Paying customers (highest weight)
2. Prospective enterprise clients
3. Domain experts / advisors (technical, legal, domain)
4. AI agents (yes — treat output consumers as stakeholders)

**Communication cadence:**

- Customers: monthly changelog email via Resend (auto-draft from `CHANGELOG.md`)
- Enterprise prospects: quarterly business review (QBR) deck using `c-suite-personas.md` § CFO/CEO voice
- Advisors: async updates in shared Notion or email — no meetings unless time-boxed to 30 min

**Escalation matrix:**

| Decision type | Who decides | Who is informed |
|---|---|---|
| Feature scope | Brian | Customers (via changelog) |
| Pricing change | Brian + CFO framework | All active customers (30-day notice) |
| Security incident | Brian + CISO framework | Affected customers (72h per GDPR/SOC 2) |
| Pivot | Brian | Advisors + investors (email, same day) |

---

## Customer Interview Synthesis

**When:** Before building anything in the "Next" bucket. Minimum 3 interviews per feature area.

**Interview guide (20 min, Jobs-to-be-Done framing):**

1. "Walk me through the last time you tried to [solve problem area]."
2. "What did you use? What frustrated you most?"
3. "If you had a magic wand, what would it do differently?"
4. "How much would you pay for a solution that did X?" (for pricing signal)

**Synthesis output (after 3+ interviews):**

```markdown
## Interview synthesis — [Feature area] — [Date]
Interviews: N | Duration: ~20 min each

### Jobs (what they're hiring the product to do)
- [Job 1]: [frequency + pain intensity 1-5]
- [Job 2]: [...]

### Patterns (heard in ≥2 interviews)
- [Quote or paraphrase]

### Outliers (heard once — flag, don't build)
- [...]

### Decision
Build: [yes/no/wait]
Why: [One sentence grounded in pattern, not outlier]
Next action: [PRD | spike | defer]
```
