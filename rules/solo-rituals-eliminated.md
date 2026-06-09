---
name: "solo-rituals-eliminated"
priority: 2
pack: "core"
triggers: []
paths:
  - "*"
---

# Solo Rituals Eliminated

A pile of "best practices" exist to scale decision-making across teams of humans. They're not safety mechanisms; they're coordination overhead. For a solo + AI shop, they're tax with no return. This rule names them and kills them explicitly so future agents don't reflex-defer to ritual when shipping.

The genuinely safety-bearing gates (`autonomous-engineering` approval-required tier, `verification-loop` deploy + prod-E2E, `drift-detection` architecture coherence, `feature-flags` dark-launch defaults) survive untouched. The rituals below DON'T.

## Killed

### Backlog grooming + sprint planning

- **What it is:** calendarized work-prioritization meetings with stakeholders.
- **Why solo doesn't need it:** `14-independent-idea-engine` surfaces ideas; `PORTFOLIO.md` orders them by ROI; the rules + Brian's daily priority pick the next thing. Sprint planning is calendarized procrastination.
- **Replacement:** every session starts by reading `PORTFOLIO.md` + checking last `CHANGELOG.md` entry + asking "what surfaces a regression?" (via `feedback_*` memories per `prompt-as-training-signal`).

### Incident postmortems / RCA docs

- **What it is:** multi-page root-cause-analysis documents written after a P1/P2.
- **Why solo doesn't need it:** Brian is the only "team member" who needs to learn the lesson. The commit that fixed it + a `feedback_<incident>.md` memory + a sharpened rule per `prompt-as-training-signal` IS the postmortem. No more theatre.
- **Replacement:** when an incident bites, the same-turn deliverables are (a) the fix commit, (b) a regression spec per `e2e-tdd-organization` § bug-fix protocol, (c) a memory entry naming the gradient, (d) a rule sharpened so the next incident of that class is impossible. The 4 artifacts ARE the postmortem.

### Design committees + pixel review meetings

- **What it is:** a designer/PM/EM walking through screens for sign-off before shipping.
- **Why solo doesn't need it:** Brian's taste + `09-brand-and-content-system` + `10-experience-and-design-system` + visual-qa agent + AI vision rubric ≥ 8/10 per `e2e-visual-inspection` + the 100-point `competitor-research` rubric IS the design review at higher throughput than a committee.
- **Replacement:** visual-qa agent on every commit + Brian's eye on the deployed surface per `verification-loop`. Pixel feedback comes from real production traffic, not pre-ship rehearsals.

### A/B testing for taste decisions

- **What it is:** running experiments on button copy, hero headline variants, color choices.
- **Why solo doesn't need it:** A/B-ing taste is what teams do when nobody has authority to pick. Solo + AI + brand voice + cinematic-prime-directive = pick the better one + ship. A/B is reserved for **revenue-critical funnel optimizations** (checkout flow, upgrade prompt, signup CTA) where revenue-per-variant is measurably testable in ≤ 2 weeks.
- **Replacement:** Brian + the design doctrine pick; PostHog still measures conversion; if a measured surface underperforms, that's the trigger for an A/B — not "let's A/B everything."

### Pre-ship demos / "let me Slack the team before deploying"

- **What it is:** rehearsing the ship to peers before clicking deploy.
- **Why solo doesn't need it:** solo IS the team. Self-announcement is wasted ritual. The `CHANGELOG.md` entry + the deploy + the `feedback_*` memory + the auto-generated GitHub Release notes are the announcement.
- **Replacement:** ship + write the CHANGELOG entry. If Brian wants narration, it goes into a Recs section or a public blog post at his cadence, not pre-ship.

### Long PR descriptions + commit-message etiquette

- **What it is:** multi-paragraph PR bodies with screenshots, test plans, deployment notes.
- **Why solo doesn't need it:** `main-only-branch` kills the PR queue. Conventional-commits convention captures intent; changelog-generator captures the human narrative; deploy logs capture the operational receipt.
- **Replacement:** `feat(scope): summary` + 1-3 body lines for WHY. The CHANGELOG explains downstream; the commit explains upstream.

### Private prototypes ("let me clean it up first")

- **What it is:** keeping early-stage repos private until they're "presentable."
- **Why solo doesn't need it:** the clean-up-first instinct delays distribution by months. Open-source on first commit per `01-operating-system` § Broadcast — the audit trail IS the marketing. People find rough early-stage repos via search; cleaning happens in public.
- **Replacement:** `gh repo create --public` from the start. README can be a single line for a week. The polish ships in commits.

## What survives (the actual safety gates)

- **`autonomous-engineering` approval-required tier** — charging money, dropping tables, bulk customer outreach, secret rotation, billing changes, auth changes still pause for Brian. No ritual; genuine safety.
- **`verification-loop`** — deploy + prod-E2E mandate, console-error gate, axe 0 violations, Lighthouse ≥ 95.
- **`drift-detection`** — architecture coherence is non-negotiable, fixed in-turn.
- **`feature-flags`** — dark-launch defaults (enabled=0, rollout=0, stage='experimental') survive every "ship fast" reflex.
- **`secret-provisioning` + `secret-auto-provisioning`** — secrets discipline is unchanged.
- **`ai-permanence` + `contract-first-ai` + `zod-everywhere`** — boundary validation discipline is unchanged.
