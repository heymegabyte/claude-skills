---
last_reviewed: 2026-06-29
superseded_by: null
name: "micro-test-instruction-wording"
priority: 2
pack: "core"
triggers:
  - "test the wording"
  - "does this prompt work"
  - "instruction wording"
  - "rule wording"
  - "prove the guidance"
paths:
  - "**/SKILL.md"
  - "rules/**"
---

# Micro-Test Instruction Wording

Before shipping a rule/skill/prompt line whose job is to change AI behavior, prove the *wording* actually binds — cheaply, before slow full pressure-scenarios. Most "the AI ignored my instruction" bugs are wording bugs, not model bugs.

Cross-links: `[[skill-authoring-contract]]` `[[instruction-compression-playbook]]` `[[evals]]` `[[vendored-skill-compression]]`

## The method (ordered)

1. **Always run a no-guidance control first.** If the control doesn't exhibit the failure, there's nothing to fix — stop, don't write the guidance.
2. **One fresh-context sample per call.** Raw API call or single-shot subagent. System prompt = the realistic context the line will live in (the full skill/template, not the line alone); user message = a task that tempts the failure.
3. **≥5 reps per variant.** Single samples lie. Compare control vs candidate wording.
4. **Read every flagged match by hand.** Template echoes and quoted counter-examples masquerade as hits; automated counts overstate both pass and fail.
5. **Treat variance as a metric.** When wording binds, reps converge on the same shape. Five different interpretations = the wording isn't binding — tighten the form before adding words.

## When to use

- Authoring or editing any discipline/shaping instruction (a rule, a SKILL.md section, a dispatch prompt).
- A live instruction is being ignored or followed inconsistently.
- Choosing between two phrasings ("recipe vs prohibition", per `[[skill-authoring-contract]]` § Match the form to the failure).

## Limits

- Micro-tests verify *wording*; they do NOT replace full pressure-scenarios for discipline skills (time + sunk-cost + authority + exhaustion). They are the fast first gate, not the last.
- Graduate to ≥3 co-located eval cases before a skill is `stable` (per `[[skill-authoring-contract]]` § Eval-first).

## See

- `20-superpowers/writing-skills/testing-skills.md` — full pressure-scenario method (vendored, compressed)
