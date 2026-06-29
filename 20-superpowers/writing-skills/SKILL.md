---
name: writing-skills
description: Use when creating new skills, editing existing skills, or verifying skills work before deployment
---

# Writing Skills

Writing a skill IS TDD on process documentation: watch an agent fail the task WITHOUT the skill (RED), write the skill against those exact failures (GREEN), close the loopholes it then invents (REFACTOR). If you never watched it fail without the skill, you don't know the skill teaches the right thing.

Vendored from [obra/Superpowers](https://github.com/obra/Superpowers) (MIT, Jesse Vincent), compressed to house style per `[[vendored-skill-compression]]`.

**REQUIRED BACKGROUND:** superpowers:test-driven-development defines the RED-GREEN-REFACTOR cycle this adapts.

## Authoring contract lives in one canonical place

Ordered-by-weight bullets, the behavior-anchored `description` template, description-SDO (WHEN not WHAT), and "match the form to the failure" are the house authoring contract — see `[[skill-authoring-contract]]`, don't restate them. Token-efficient prose style: `[[instruction-compression-playbook]]`. This file covers only what's specific to *creating + testing* a skill.

## What a skill is

A reference guide for a proven technique, pattern, or tool — reusable, not a narrative of how you solved something once. Three shapes:

- **Technique** — a concrete method with steps (`condition-based-waiting`, `root-cause-tracing`).
- **Pattern** — a way of thinking about a class of problem (`flatten-with-flags`).
- **Reference** — API/syntax/tool docs.

## When to create one

- Create when: the technique wasn't obvious to you, you'd reuse it across projects, and it applies broadly.
- Don't create for: one-offs, things well-documented elsewhere, project-specific conventions (put those in the instructions file), or anything a regex/validator can enforce — automate that instead of documenting it.

## Iron Law

NO SKILL — OR EDIT — SHIPS WITHOUT A FAILING TEST FIRST. Wrote it before testing? Delete it, start from baseline. No exception for "simple additions", "just a section", or "documentation updates". Don't keep untested changes "as reference". Delete means delete.

## Structure

Two required frontmatter fields: `name` (letters/numbers/hyphens only) and `description` (≤1024 chars total; see [agentskills.io/specification](https://agentskills.io/specification) for the rest). Then a lean body:

```markdown
## Overview        # what + core principle, 1-2 sentences
## When to Use     # symptoms / use cases; when NOT to; small flowchart only if the decision is non-obvious
## Core Pattern    # before/after for techniques & patterns
## Quick Reference # table or bullets for scanning
## Implementation  # inline code for simple cases; link a file for heavy reference
## Common Mistakes # what goes wrong + the fix
```

SKILL.md is a table of contents (progressive disclosure). Inline only what changes per task; split out when content is heavy:

- **Heavy reference** (100+ lines of API/syntax) → its own file, loaded on demand.
- **Reusable tool** (script, template) → its own file.
- Keep inline: principles, concepts, code patterns under ~50 lines.

Cross-reference other skills by name with an explicit marker (`**REQUIRED:** superpowers:test-driven-development`) — never `@path`, which force-loads the file and burns 200k+ context before you need it.

## Code examples

One excellent example beats five languages. Make it complete, runnable, from a real scenario, commented with WHY — not a fill-in-the-blank template. You're good at porting; one great example is enough.

## Flowcharts

Use a small inline flowchart ONLY for a non-obvious decision point, a process loop where you might stop too early, or an "A vs B" choice. Never for reference material (use tables/lists), code (use markdown blocks), or linear steps (use a numbered list). Style rules: `graphviz-conventions.dot`. Render for a human: `./render-graphs.js ../some-skill [--combine]`.

## Testing & bulletproofing

The full method — pressure scenarios, the RED-GREEN-REFACTOR loop for skills, rationalization tables, red-flags, micro-testing wording against a no-guidance control, and the per-skill deployment gate — lives in **[testing-skills.md](testing-skills.md)**. A worked campaign is in [examples/CLAUDE_MD_TESTING.md](examples/CLAUDE_MD_TESTING.md). Persuasion levers that make a discipline skill bind: persuasion-principles.md.

The one-line discipline: discipline/judgment skills get pressure-tested under 3+ stacked pressures; pure reference skills get retrieval-tested instead.

## See

- [testing-skills.md](testing-skills.md) — the testing + bulletproofing method
- anthropic-best-practices.md — pointer to Anthropic's public authoring guide + local deltas
- persuasion-principles.md — Cialdini levers for compliance under pressure
- `[[skill-authoring-contract]]` — the canonical authoring contract (structure, description template, form-to-failure)
- `[[instruction-compression-playbook]]` — token-efficient prose style
- `[[micro-test-instruction-wording]]` — prove guidance wording binds before shipping it
