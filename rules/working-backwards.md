---
name: "working-backwards"
priority: 1
pack: "core"
triggers:
  - "press release"
  - "working backwards"
  - "user-visible feature"
  - "new route"
  - "new dashboard"
  - "new command"
  - "new surface"
  - "before coding"
  - "feature scoping"
  - "before implementation"
paths:
  - "*"
---

# Working Backwards (Amazon-Style Press Release First)

Write the user-outcome description first. Code second. Mis-scoped features are caught cheaply in prose — not in deployed code.

## When to Write One

**Write a press release before any feature that adds a new user-visible surface:**

- New route (e.g., `/reports`, `/onboarding/step-2`)
- New dashboard widget or panel
- New CLI command or flag
- New modal / drawer / sheet
- New API endpoint consumed by external callers
- New webhook or integration point
- Any change that warrants a line in the customer-facing changelog

**Skip for pure internals:**

- Library refactor with no user-visible change
- Schema migration with no new query surface
- Hook rewire or config change
- Performance optimization invisible to the user
- Build tooling change

Rule: if a user would notice the feature is missing, write a press release. If only the codebase would notice, skip it.

## The 1-Page Press Release Template

```markdown
# [PRODUCT NAME] [VERSION]: [HEADLINE — 8 words max, present tense, user-outcome focused]

## [Subheadline — one sentence amplifying the headline, still user-outcome focused]

### Summary (2–3 sentences)
What is this? Who is it for? What does it replace or improve?

### The Problem (3–5 sentences)
Describe the pain the user felt before this feature existed. Specific, not abstract.
"Users had to manually export to CSV, open Excel, filter, and paste back" beats
"data management was difficult." Name the friction, the workaround, the wasted time.

### The Solution (3–5 sentences)
Describe what the feature does, from the user's perspective. No implementation details.
"Click Export → choose date range → download. Done in 3 clicks, 10 seconds."
Not: "We added a CSV serializer behind a feature flag with a Hono route."

### Founder Quote (1–3 sentences)
First-person. Why does this matter to the product? What principle does it embody?

### Customer Quote (1–3 sentences)
Write the quote you WANT a real customer to say after using it. If you can't write it
convincingly, the feature isn't solving a real problem.

### Call to Action (1 sentence)
What does the user do next? "Try it at /reports → Export." "Run `mbyte export --format csv`."
```

Total length: 1 page. If it runs longer, the feature is over-scoped. Cut.

## Where It Lives

```
docs/decisions/PR-{slug}.md
```

- Same directory as ADRs (`docs/decisions/NNN-title.md`).
- Use the slug from the feature flag key (e.g., `csv_export` → `PR-csv-export.md`).
- `PR-` prefix distinguishes press releases from ADRs (`NNN-`).

## The Anti-Pattern: Post-Hoc Justification

A press release written AFTER the code is useless — it is marketing copy, not a design tool.

Signs you are writing a post-hoc press release:

- The solution section describes what you built, not what the user experiences.
- The problem section reads like justification, not felt pain.
- You are changing the headline to match the implementation rather than the other way.

If this happens: treat the press release as a forcing function to rethink scope, not a checkbox. Ask: "Would I have built this differently if I had written this first?"

## Integration with Project-Level Thinking

- **[[02-goal-and-brief]]** — the project-level thesis is the press release for the whole product. If a feature press release contradicts the product thesis, the feature is a distraction.
- **[[14-independent-idea-engine]]** — every idea that would add a user-visible surface needs a 15-minute press release session before it becomes a task.
- **[[autonomous-engineering]]** — the 4-tier approval model governs *whether* to ship; the press release governs *what* to ship. Both `review-recommended` and `autonomous` features still get a press release.
- **[[one-way-two-way-doors]]** — press releases are mandatory before one-way door features (new public API surface, new data model, new payment integration).

## Time Budget

- Good press release: 10–20 minutes. If longer, the feature is under-defined — time well spent.
- Under 5 minutes: the feature is trivial; the press release still confirms triviality.
- Payback 1: catches mis-scoped features that would have cost hours to build.
- Payback 2: the solution section becomes the customer-facing changelog entry verbatim.

## Cross-Links

- `[[02-goal-and-brief]]` — product-level thesis; feature press releases nest under it.
- `[[14-independent-idea-engine]]` — idea filter; press release is the gate between idea and task.
- `[[autonomous-engineering]]` — approval tiers; press release is the scoping complement.
- `[[one-way-two-way-doors]]` — reversibility classification; press releases mandatory before one-way-door features.
- `[[documentation-as-code]]` — press release lives in `docs/decisions/` alongside ADRs.
- `[[customer-facing-changelog]]` — solution section of the press release becomes the changelog entry.
- `[[principles-incident-log]]` — principle #20; gap closed 2026-06-18.

## Principle #20 Entry

This rule closes principle #20 in `rules/principles-incident-log.md`.

**Incident:** 2026-06-18 audit baseline (`30-30-saturated-2026-06-18.json`) revealed 29/30 principles present. Principle #3 ("Working backwards") was the sole gap. Baseline promoted to `30-30-true-saturated-2026-06-18.json` after this file was written.

**Why it matters:** features built without a press release habitually over-ship (infrastructure the user doesn't need) or under-ship (technical primitive without the user-facing surface that makes it valuable).

## See Also

- `docs/decisions/PR-*.md` — project-specific press releases (per repo).
- `rules/principles-incident-log.md` — principle #20 log entry.
- `rules/audit-baselines/30-30-true-saturated-2026-06-18.json` — milestone baseline confirming 30/30.
