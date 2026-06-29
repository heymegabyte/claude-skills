---
last_reviewed: 2026-06-29
superseded_by: null
name: "prompt-as-training-signal"
priority: 1
pack: "core"
triggers: []
paths:
  - "*"
---

# Prompt as Training Signal

Every user prompt is a training signal — and evidence the previous turn under-delivered. Extract the wisdom and fold it into the durable layer (skills, rules, prefs, memory) IN THE SAME TURN before doing the requested work.

## The principle

- If the user prompts again on the same project/domain/surface, the prior turn was incomplete. The prompt names the dimension.
- A second prompt is a corrective gradient — capture it, update the model.
- Cost of capturing: seconds. Cost of relearning next month: hours.

## The seven prompt shapes (and what each teaches)

### 1. "Now do X" / "Also do Y" / "Don't forget Z"

- **Means:** prior turn under-scoped; X/Y/Z was implicit and got dropped.
- **Extract:** the missing element is part of the surface's invariant set.
- **Write to:**
  - Universal must-have → `rules/always.md` § matching section
  - Domain-specific → skill that owns that domain
  - Brian habit → `rules/brian-preferences.md`

### 2. `"Make sure to ___"` / `"Always ___"` / `"Never ___"` <!-- validator-ignore: filler -->

- **Means:** a hard rule the user expects respected, not a request.
- **Write to:** `rules/always.md` (if universal) OR the relevant rule file. Phrasing: declarative, build-fail if violated.

### 3. `"Actually ___"` / `"I meant ___"` / `"It should be ___"`

- **Means:** a wrong assumption was baked in; the user just corrected the model.
- **Write to:** `feedback_<topic>.md` memory file with **Why:** + **How to apply:**

### 4. Re-issuing a near-identical prompt

- **Means:** prior turn was wrong-SHAPED (decomposition / monitor-fire / parallelization failed), not wrong-content.
- **Write to:** `rules/monitor-orchestration.md` § Known shortcomings — new numbered entry: `<symptom>` → `<root cause>` → `<rule that prevents it>`.

### 5. `"How can we improve ___"` / `"What else ___"` / `"Top N ideas"`

- **Means:** invitation to operate at full extra-mile/auto-integrate-recs surface.
- **Extract:** which surface the user is investing in — note in a project memory entry.

### 6. `"Ensure ___ is in ___"` / `"Save ___ to memory"` / `"Add ___ to the rules"`

- **Means:** explicit meta-instruction; the user is teaching.
- **Do:** highest-priority capture. Write the artifact this turn. Cross-link from sibling rules so the lesson surfaces in unrelated contexts later.

### 7. `"Why didn't ___?"` / `"How come ___?"` / venting

- **Means:** a behavior violated a prior preference or the user's implicit model.
- **Write to:** `feedback_<topic>.md` memory with the prohibited behavior + reason given. Surface conflict in `rules/conflict-resolution.md` if applicable.

## Extraction protocol

For every prompt:

1. **Read the prompt shape** (which of the 7 above?).
2. **Name the gradient** — what did the prior turn miss / get wrong / under-scope / mis-shape?
3. **Identify the durable home** — which skill, rule, preference, or memory should grow?
4. **Write the artifact** — append to the file, update the index, commit + push.
5. **Cross-link** — add `[[backlink]]` from both sides. Skipping this step lets the same lesson recur in unrelated projects weeks later.
6. **THEN execute the requested work** with the new wisdom already in force.

## Where the artifacts live

- **Universal rules** → `~/.claude/plugins/heymegabyte-claude-skills/rules/<topic>.md`
- **Universal skills** → `~/.claude/plugins/heymegabyte-claude-skills/<NN-skill-name>/SKILL.md`
- **User-level overrides** → `~/.claude/CLAUDE.md` § Local Overrides
- **Project-level rules** → `<project>/.claude/rules/<topic>.md` (path-scoped)
- **Project memories** → `~/.claude/projects/<encoded-path>/memory/<name>.md` + index in `MEMORY.md`
- **Brian preferences** → `rules/brian-preferences.md`
- **Stack preferences** → `rules/code-style.md`
- **Recurring shortcomings** → `rules/monitor-orchestration.md` § Known shortcomings

## What NOT to capture

- Code patterns derivable from `git log` / `git blame` / current repo state
- Project-specific scaffolding choices (lives in project's CLAUDE.md, not `~/.claude/`)
- Ephemeral conversation context (use TaskCreate/plan instead)
- Anything already covered by an existing rule — UPDATE the existing rule, never duplicate

## Boil-the-lake gradient extraction

When a prompt produces a lesson, also ask:

- "What CLASS of gap does this belong to?"
- "What sibling projects / surfaces / future prompts will hit the same class?"
- "Is there a generalizable rule one level higher?"

Write the GENERALIZED rule, not the project-specific instance. Project instances become `## Reference incident` blocks anchoring the abstract rule.

## Self-reinforcement

This rule is subject to itself. If a future prompt teaches that prompt-extraction missed a dimension, append a §8/§9/§N prompt-shape entry above with the new pattern and reference incident.
