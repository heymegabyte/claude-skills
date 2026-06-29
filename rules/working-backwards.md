---
last_reviewed: 2026-06-29
superseded_by: null
name: "working-backwards"
priority: 2
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

Write the user-outcome description first. Code second.

## When to Write One

**Write before any feature that adds a new user-visible surface:**

- New route, dashboard widget/panel, CLI command/flag, modal/drawer/sheet
- New API endpoint consumed by external callers, webhook or integration point
- Any change warranting a line in the customer-facing changelog

**Skip for pure internals:** library refactor, schema migration (no new query surface), hook rewire, perf optimization, build tooling.

Rule: user would notice it's missing → write one. Only the codebase would notice → skip.

## The 1-Page Press Release Template

```markdown
# [PRODUCT NAME] [VERSION]: [HEADLINE — 8 words max, present tense, user-outcome focused]

## [Subheadline — one sentence amplifying the headline]

### Summary (2–3 sentences)
What is this? Who is it for? What does it replace or improve?

### The Problem (3–5 sentences)
Specific pain before this feature. Name friction, workaround, wasted time.

### The Solution (3–5 sentences)
What the feature does, from the user's perspective. No implementation details.

### Founder Quote (1–3 sentences)
First-person. Why does this matter to the product?

### Customer Quote (1–3 sentences)
Write the quote you WANT a real customer to say. Can't write it convincingly → feature isn't solving a real problem.

### Call to Action (1 sentence)
What does the user do next?
```

Total length: 1 page. Longer → feature is over-scoped. Cut.

## Where It Lives

```
docs/decisions/PR-{slug}.md
```

- Same directory as ADRs (`docs/decisions/NNN-title.md`).
- Use the slug from the feature flag key (e.g. `csv_export` → `PR-csv-export.md`).
- `PR-` prefix distinguishes from ADRs (`NNN-`).

## Anti-Pattern: Post-Hoc Justification

A press release written AFTER the code is useless — it's marketing copy, not a design tool.

Signs: solution section describes what you built (not what user experiences); problem section reads like justification; headline changed to match implementation.

If this happens: use it as a forcing function to rethink scope. Ask "Would I have built this differently if written first?"

## Time Budget

- Good press release: 10–20 minutes.
- Payback 1: catches mis-scoped features before hours of build.
- Payback 2: solution section becomes the customer-facing changelog entry verbatim.

## Cross-Links

- `[[02-goal-and-brief]]` — product-level thesis; feature press releases nest under it
- `[[14-independent-idea-engine]]` — idea filter; press release gates idea → task
- `[[autonomous-engineering]]` — approval tiers; press release governs *what* to ship
- `[[one-way-two-way-doors]]` — press releases mandatory before one-way-door features
- `[[documentation-as-code]]` — lives in `docs/decisions/` alongside ADRs
- `[[customer-facing-changelog]]` — solution section becomes the changelog entry
- `[[principles-incident-log]]` — principle #20; gap closed 2026-06-18

## See Also

- `docs/decisions/PR-*.md` — project-specific press releases (per repo)
- `rules/principles-incident-log.md` — principle #20 log entry
- `rules/audit-baselines/30-30-true-saturated-2026-06-18.json` — milestone baseline
