---
name: "<skill-name>"
description: "<one-line trigger description — what this skill does, when Claude should use it>"
allowed-tools:
  - "Read"
  - "Write"
  - "Edit"
  - "Bash"
  - "Agent"
  - "<other tools needed>"
triggers:
  - "<trigger-phrase-1>"
  - "<trigger-phrase-2>"
---

# <Skill Name>

> **One-sentence elevator pitch.** What this skill accomplishes and why it exists.

---

## Purpose

- **Problem:** <what gap or friction this skill fills>
- **Solution:** <how the skill resolves it>
- **Outcome:** <what the user/AI/CI gets after running this skill>

## Procedure

### Phase 1 — <Name>

1. <Step-by-step action. Each step is a doable command or decision.>
2. <Prefer exact CLI invocations or known tool calls.>
3. <When a step depends on a prior result, say so: "Use the output from step 2.">

### Phase 2 — <Name>

(Repeat as needed for 2-5 phases. If only one phase, remove the Phase wrapper.)

## Rules

- <Hard rule. Imperative mood. Zero ambiguity.>
- <Second rule. "Never X without Y.">
- <Third rule. "Always Z when W.">

### Validation gates

- [ ] <Checklist item — run this before marking completion>
- [ ] <Checklist item — verify with this assertion>
- [ ] <Skip condition: "Only when X, otherwise Y.">

## Related

- **`<../other-skill.md>`** — <what it provides and when to delegate to it instead>
- **`<rules/xyz.md>`** — <specific rule this skill enforces or references>
- **`<template/*.md>`** — <template this skill populates>

---

## Authoring conventions

### Frontmatter fields

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Hyphenated kebab-case. Matches filename. |
| `description` | Yes | One line, no period. Claude reads this to decide whether to trigger. |
| `allowed-tools` | Yes | Restrictive list. Omitted tools the skill should NOT use automatically. |
| `triggers` | No | Phrases that should activate this skill. Optional but recommended. |

### Body structure

- Start with a **Purpose** block (3 bullets max). If the reader can't decide from this alone, add more, not less.
- **Procedure** is action-oriented. Each numbered step is a concrete action the AI can take — never a vague "evaluate the situation."
- **Rules** are non-negotiable. If there's an exception, state it as "Exception: ..."
- **Validation gates** are the exit criteria. Read these before starting.
- **Related** prevents duplicated effort. If two skills cover adjacent ground, the Related block in each must cross-reference the other and state the boundary.
- **Authoring conventions** (this section) is part of the template, not the skill. Delete it when filling the template for a real skill.

### Tone

- Imperative mood. "Run this command" not "You should run this command."
- Bullets are one idea, two lines max.
- Procedural steps are numbered, not bulleted.

### Cross-referencing

- Other skills: link the relative path from the skill root.
- Rules: link the absolute rule path conventionally.
- Templates: link relative path from the templates directory.
