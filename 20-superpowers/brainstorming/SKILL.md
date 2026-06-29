---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation."
---

# Brainstorming Ideas Into Designs

Turn ideas into designs through collaborative dialogue, BEFORE any code. Pairs with Brian's `14-independent-idea-engine` and the SUPREME "brainstorm-first" rule.

<HARD-GATE>
No implementation skill, code, scaffold, or implementation action until a design is presented AND the user approves it. EVERY project, regardless of perceived simplicity.
</HARD-GATE>

## "Too simple to need a design" is the trap

"Simple" projects (todo list, one-function util, config change) hide the most unexamined assumptions. Design can be a few sentences — but present it and get approval.

## Checklist (one task each, in order)

1. **Explore project context** — files, docs, recent commits. Follow existing patterns.
2. **Offer the visual companion just-in-time** — NOT upfront. Offer (own message) the first time a question is genuinely clearer shown than told; never if no visual question arises. See `visual-companion.md`.
3. **Ask clarifying questions** — one per message, multiple-choice preferred. Purpose / constraints / success criteria.
4. **Propose 2-3 approaches** — trade-offs, lead with your recommendation + why.
5. **Present design** — sections scaled to complexity (sentences → 200-300 words). Approval after each. Cover architecture, components, data flow, error handling, testing.
6. **Write design doc** — `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` (user pref overrides path), commit.
7. **Spec self-review** — inline scan: placeholders/TBD, contradictions, ambiguity, scope. Fix and move on; no re-review.
8. **User reviews written spec** — ask, wait. Changes → fix + re-review. Proceed only on approval.
9. **Transition** — invoke `writing-plans`. This is the ONLY skill you invoke next — never frontend-design, mcp-builder, or any other implementation skill.

## Scope before refining

- If the request spans multiple independent subsystems (chat + storage + billing + analytics), flag it BEFORE refining details.
- Too large for one spec → decompose into sub-projects (pieces, relations, build order); brainstorm the first through the normal flow. Each sub-project gets its own spec → plan → implement cycle.

## Design for isolation

- Split into units with one clear purpose, well-defined interfaces, independently testable. For each: what it does, how to use it, what it depends on.
- Can someone understand a unit without reading internals? Can you change internals without breaking consumers? If not, boundaries need work. A file growing large signals it does too much.

## Working in existing code

- Explore structure first; follow existing patterns.
- Fold in targeted improvements where existing problems affect the work (oversized file, tangled responsibilities) — like a good dev improving code they touch. No unrelated refactoring.

## Principles

- One question at a time; multiple-choice preferred.
- YAGNI ruthlessly. Always explore 2-3 approaches. Validate incrementally. Go back and clarify when something doesn't fit.

## Visual Companion (summary)

A browser tool, not a mode — available for visual questions, doesn't route every question through the browser.

- **Offer just-in-time, as its own message** — no other content. Wait for response. Accept → start server with `--open`. Decline → text-only, don't re-offer.
- **Decide per question:** would the user understand this better seen than read? Browser for mockups / wireframes / layout comparisons / diagrams; terminal for requirements / concepts / tradeoffs / scope. A UI *topic* is not automatically a visual question.
- On accept, read `visual-companion.md` before proceeding.

<!-- budget: ~56 -->
