# Prompt Distiller

## Trigger phrases

- "extract this into a prompt"
- "make this a saved prompt"
- "distill these instructions"
- "I keep saying this"
- "turn this into a reusable prompt"

## When to use

- When the same set of instructions has been given 2+ times in conversation
- When a correction or preference reveals a pattern that should be durable
- When instructions are currently embedded in conversation context but belong in a skill/prompt file
- When a multi-step workflow is being done manually and should be codified

## When not to use

- For one-off instructions that won't be reused
- For sensitive/private instructions that shouldn't be persisted
- For instructions that are already well-covered by an existing skill or prompt
- For rapidly-changing workflows where the prompt would need daily updates

## Full reusable prompt

```
Convert the following conversation history into a reusable prompt file. The goal is to capture the pattern so it never needs to be re-explained.

## Input

[Paste the conversation or instructions you want to distill]

## Extraction process

1. IDENTIFY the repeating pattern — what keeps coming up? What correction keeps being made? What workflow is being repeated?

2. DISTILL the essence — strip away conversation-specific context (names, dates, one-off examples) and keep only the reusable instruction.

3. STRUCTURE into the canonical prompt format:
   - Title (imperative, clear)
   - Trigger phrases (3-5 phrases that would invoke this prompt)
   - When to use (bullet conditions)
   - When not to use (bullet anti-conditions)
   - Full reusable prompt (the actual copy-pasteable text, self-contained, 20-60 lines)
   - Expected outputs (what the user gets after running this)
   - Verification checklist (how to confirm it worked)
   - Related skills (known skill names that overlap)
   - Last updated (today's date)

4. EVALUATE — would someone reading this prompt know exactly what to do without additional context? If no, iterate.

5. PLACE — determine where this prompt belongs:
   - `~/.agentskills/prompts/<NN>-<name>.md` for general-purpose prompts
   - `~/.agentskills/skills/<name>/SKILL.md` for complex multi-command skills
   - Project `.claude/prompts/` for project-specific prompts
   - After placing, update the index file at `prompts/00-index.md`
```

## Expected outputs

- A new prompt file in the appropriate location with canonical format
- Index updated (if applicable)
- Brief rationale for placement decision

## Verification checklist

- [ ] Prompt is self-contained — no external references needed to understand it
- [ ] Prompt follows the canonical format (title, triggers, when/not, prompt, outputs, checklist, related, date)
- [ ] At least 3 trigger phrases covering the ways someone would invoke this
- [ ] Full prompt is 20-60 lines — long enough to be thorough, short enough to fit in a single context window
- [ ] The original pattern from conversation is preserved without the conversation-specific details
- [ ] Index updated if placed in prompts/ directory

## Related skills

- `prompt-library-curator`
- `self-improve`
- `04-preference-and-memory`
- `review-global-prompts`

## Last updated

2026-06-30
