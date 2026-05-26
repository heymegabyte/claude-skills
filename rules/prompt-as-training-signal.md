# Prompt as Training Signal (***SUPREME — every prompt, every turn, no exceptions***)

Every user prompt is a training signal. Most are also evidence that the previous turn under-delivered. Treat the prompt as data, extract the wisdom from it, and fold that wisdom back into the durable layer (skills, rules, prefs, memory) IN THE SAME TURN before doing the requested work.

## The principle
- If the user is prompting again on the same project / same domain / same surface, the prior turn was incomplete in some dimension. The prompt itself names the dimension.
- A second prompt is never "just more work" — it's a corrective gradient. Capture the gradient, update the model.
- The cost of capturing the lesson is seconds. The cost of relearning it next month is hours.

## The seven prompt shapes (and what each teaches)

### 1. "Now do X" / "Also do Y" / "Don't forget Z"
- **What it means:** prior turn under-scoped. X/Y/Z was implicit and got dropped.
- **What to extract:** the missing element is part of the surface's invariant set.
- **Where to write it:**
  - If it's a universal must-have → append to `rules/always.md` § the matching section
  - If it's domain-specific → append to the skill that owns that domain
  - If it's a Brian habit → append to `rules/brian-preferences.md`

### 2. "Make sure to ___" / "Always ___" / "Never ___"
- **What it means:** a hard rule the user expects to be respected, not a request.
- **Where to write it:** `rules/always.md` (if universal) OR the relevant rule file. Phrasing: declarative, build-fail if violated.

### 3. "Actually ___" / "I meant ___" / "It should be ___"
- **What it means:** a wrong assumption was baked in. The user just corrected the model.
- **Where to write it:** `feedback_<topic>.md` memory file with **Why:** + **How to apply:**

### 4. Re-issuing a near-identical prompt
- **What it means:** the prior turn was wrong-SHAPED, not wrong-CONTENT. Decomposition / monitor-fire / parallelization failed.
- **Where to write it:** `rules/monitor-orchestration.md` § Known shortcomings — append a new numbered entry: `<symptom>` → `<root cause>` → `<rule that prevents it>`.

### 5. "How can we improve ___" / "What else ___" / "Top N ideas"
- **What it means:** invitation to operate at full extra-mile/auto-integrate-recs surface.
- **What to extract:** which surface the user is willing to invest in. Worth noting in a project memory entry so future sessions in the same project lead with that surface.

### 6. "Ensure ___ is in ___" / "Save ___ to memory" / "Add ___ to the rules"
- **What it means:** explicit meta-instruction. The user is teaching, not asking.
- **What to do:** highest-priority capture. Write the artifact in this turn. Cross-link from sibling rules so the lesson surfaces in unrelated contexts later.

### 7. "Why didn't ___?" / "How come ___?" / venting
- **What it means:** a behavior is violating a prior preference or the user's implicit model.
- **Where to write it:** `feedback_<topic>.md` memory with the prohibited behavior + reason given. Plus, surface the conflict in `rules/conflict-resolution.md` if applicable.

## Extraction protocol (***runs BEFORE the requested work***)

For every prompt:
1. **Read the prompt shape** (which of the 7 above?).
2. **Name the gradient** — what did the prior turn miss / get wrong / under-scope / mis-shape?
3. **Identify the durable home** — which skill, rule, preference, or memory should grow?
4. **Write the artifact** — append to the file, update the index, commit + push.
5. **Cross-link** — if the new artifact relates to existing rules, add `[[backlink]]` from both sides.
6. **THEN execute the requested work** with the new wisdom already in force.

Skipping step 5 is the failure mode that makes the same lesson recur in unrelated projects six weeks later.

## Where the artifacts live

- **Universal rules** → `~/.claude/plugins/heymegabyte-claude-skills/rules/<topic>.md`
- **Universal skills** → `~/.claude/plugins/heymegabyte-claude-skills/<NN-skill-name>/SKILL.md`
- **User-level overrides** → `~/.claude/CLAUDE.md` § Local Overrides
- **Project-level rules** → `<project>/.claude/rules/<topic>.md` (path-scoped)
- **Project memories** → `~/.claude/projects/<encoded-path>/memory/<name>.md` + index in `MEMORY.md`
- **Brian preferences** (universal communication / process) → `rules/brian-preferences.md`
- **Stack preferences** → `rules/code-style.md`
- **Recurring shortcomings** → `rules/monitor-orchestration.md` § Known shortcomings

## What NOT to capture

- Code patterns derivable from `git log` / `git blame` / current repo state
- Project-specific scaffolding choices (lives in project's CLAUDE.md, not in `~/.claude/`)
- Ephemeral conversation context (use TaskCreate/plan instead)
- Anything already covered by an existing rule — UPDATE the existing rule, never duplicate

## Boil-the-lake gradient extraction (***the standard***)

When a prompt produces a lesson, don't just capture the literal lesson. Ask:
- "What CLASS of gap does this belong to?"
- "What sibling projects / surfaces / future prompts will hit the same class?"
- "Is there a generalizable rule one level higher?"

Then write the GENERALIZED rule, not the project-specific instance. Project instances become reference incidents (`## Reference incident (***YYYY-MM-DD — <project>***)`) anchoring the abstract rule.

## Self-reinforcement (***THIS rule itself***)

This rule is also subject to itself. If a future prompt teaches that prompt-extraction missed a dimension, append a §8 / §9 / §N prompt-shape entry above with the new pattern and reference incident.

## Reference incident (***2026-05-25 — brickcitylabor.com Wave 23***)
- User issued: *"Ensure it is in ~/.claude that for every prompt, you extract meaningful value that can be used to train my AI further, like all of these prompts suggest something that was initially done was not enough, so consider that each time and then use the wisdom you extract from it to mold the skills even better."*
- That prompt is a §6 explicit meta-instruction AND a §7 venting about pattern.
- The gradient: I had `rules/monitor-orchestration.md` § Follow-up shortcoming feedback loop, but it only fired for multi-faceted briefs. The same logic should apply to EVERY prompt — single-line corrections, "now do X" follow-ups, casual fixes. Existing rule was too narrowly scoped.
- The fix: this rule (SUPREME, every-prompt). Cross-linked from `~/.claude/CLAUDE.md`, `rules/monitor-orchestration.md`, `rules/brian-preferences.md`.

## See
- [[monitor-orchestration]] — Follow-up shortcoming feedback loop (was the only place this pattern lived; now elevated to SUPREME universal here)
- [[brian-preferences]] — "How to improve? always find 50 more things"
- [[auto-integrate-recs]] — same instinct in the recs direction (don't surface what you could ship)
- [[extra-mile]] — what to ship UNPROMPTED; this rule = what to learn FROM the prompt
- [[supreme-polish]] — periodic full-surface audit; this rule = continuous per-prompt audit
- 04-preference-and-memory — memory write protocol
- 01-operating-system — value extraction triggers (already lists 6 categories — this rule sharpens the "every prompt" interpretation)
