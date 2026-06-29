---
last_reviewed: 2026-06-29
superseded_by: null
name: "solo-rituals-eliminated"
priority: 2
pack: "core"
triggers: []
paths:
  - "*"
---

# Solo Rituals Eliminated

Team-coordination overhead that exists for scaling decisions across humans. Solo + AI doesn't need it. The genuine safety gates (`autonomous-engineering` approval-required tier, `verification-loop` deploy + prod-E2E, `drift-detection`, `feature-flags` dark-launch defaults) survive untouched. The rituals below don't.

## Killed

### Backlog grooming + sprint planning

- **Replacement:** every session reads `PORTFOLIO.md` + last `CHANGELOG.md` entry + asks "what surfaces a regression?" (via `feedback_*` memories per `prompt-as-training-signal`). Sprint planning = calendarized procrastination.

### Incident postmortems / RCA docs

- **Replacement:** same-turn deliverables: (a) fix commit, (b) regression spec per `e2e-tdd-organization` § bug-fix protocol, (c) memory entry naming the gradient, (d) rule sharpened so next incident of that class is impossible. The 4 artifacts ARE the postmortem.

### Design committees + pixel review meetings

- **Replacement:** visual-qa agent on every commit + Brian's eye on deployed surface per `verification-loop`. Brian's taste + `09-brand-and-content-system` + `10-experience-and-design-system` + AI vision rubric ≥8/10 + 100-point `competitor-research` rubric IS the design review.

### A/B testing for taste decisions

- **Replacement:** Brian + design doctrine picks; PostHog measures conversion. A/B is reserved for **revenue-critical funnel optimizations** (checkout flow, upgrade prompt, signup CTA) where revenue-per-variant is measurably testable in ≤2 weeks.

### Pre-ship demos / "let me Slack the team before deploying"

- **Replacement:** ship + write CHANGELOG entry. `CHANGELOG.md` + deploy + `feedback_*` memory + auto-generated GitHub Release notes = the announcement.

### Long PR descriptions + commit-message etiquette

- **Replacement:** `feat(scope): summary` + 1-3 body lines for WHY. `main-only-branch` kills the PR queue. Conventional-commits captures intent; changelog-generator captures human narrative.

### Private prototypes ("let me clean it up first")

- **Replacement:** `gh repo create --public` from first commit per `01-operating-system` § Broadcast. README can be one line for a week. Polish ships in commits.

## What survives (actual safety gates)

- **`autonomous-engineering` approval-required tier** — charging money, dropping tables, bulk customer outreach, secret rotation, billing/auth changes still pause for Brian.
- **`verification-loop`** — deploy + prod-E2E, console-error gate, axe 0 violations, Lighthouse ≥95.
- **`drift-detection`** — architecture coherence non-negotiable, fixed in-turn.
- **`feature-flags`** — dark-launch defaults (`enabled=0, rollout=0, stage='experimental'`) survive every "ship fast" reflex.
- **`secret-provisioning` + `secret-auto-provisioning`** — secrets discipline unchanged.
- **`ai-permanence` + `contract-first-ai` + `zod-everywhere`** — boundary validation discipline unchanged.
