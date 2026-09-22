# Research to Stack Decision

## Trigger phrases

- "research the best"
- "evaluate X vs Y"
- "make a stack decision"
- "compare options"
- "which should I use"

## When to use

- When choosing between two or more technology options (libraries, services, patterns)
- When evaluating whether to adopt a new tool
- Before making a decision that affects repo-level direction
- When existing stack decisions have degraded or been superseded

## When not to use

- For trivial choices (lodash vs native array — just decide)
- When the options are not meaningfully different (no clear trade-offs)
- When the decision is already made and just needs implementation
- For personal preference questions (editor choice, color scheme)

## Full reusable prompt

```
Convert research into a durable, repo-level stack decision. The output must be an actionable ADR (Architecture Decision Record) that future contributors can reference.

## Process

### 1. Define the decision

Write a one-line decision statement:
"We need to decide between X and Y for [purpose]."

Define evaluation criteria (customize for your domain):
- **Functionality**: does it do what we need? Any critical gaps?
- **Ecosystem**: community size, package health, maintenance cadence
- **Learning curve**: how long until a new contributor is productive?
- **Performance**: benchmarks relevant to our use case
- **Bundle size / cost**: resource impact
- **License**: compatible with our project?
- **Vendor risk**: single point of failure? Easy to replace?
- **Future-proofing**: aligned with long-term direction?

### 2. Gather evidence

For each option:
- Visit the official site and docs
- Check GitHub: stars, last commit, open issues, release cadence
- Search for real-world usage and case studies
- Check npm trends or similar
- Note any significant breaking changes in recent history
- Check competitor/comparison pages

### 3. Score each option

| Criterion | X (score 1-5) | Y (score 1-5) | Notes |
|-----------|--------------|--------------|-------|
| Functionality | 4 | 3 | X covers auth + ORM, Y is ORM-only |
| Ecosystem | 5 | 5 | Both well-maintained |
| ... | | | |

### 4. Make the decision

- Choose the option with the highest total, or recommend a hybrid approach
- Write the decision as an ADR in `docs/adr/<NNN>-decision-title.md`
- The ADR must include: title, status (accepted), context, decision, consequences, date, and links to research

### 5. Implement the decision

- Create any configuration files needed
- Install dependencies
- Add initial code showing the pattern (even if minimal)
- Write a brief usage example in the ADR or a companion file

### 6. Propagate

- Update README if the decision affects the stack section
- Update any relevant `.claude/` rules or prompts
- If this replaces an existing decision, mark the old ADR as superseded
```

## Expected outputs

- Research table scoring each option against criteria
- A written ADR in `docs/adr/` with decision, rationale, and consequences
- Initial implementation (config, dependency, usage example)
- Updated README and related docs

## Verification checklist

- [ ] At least 2 options evaluated against ≥5 criteria
- [ ] ADR written with proper format (title, status, context, decision, consequences)
- [ ] ADR filed in `docs/adr/` with sequential number
- [ ] Decision is actionable — someone can follow it without re-researching
- [ ] Old ADR marked superseded if applicable
- [ ] Implementation reflects the decision (configs, deps, examples)

## Related skills

- `research-to-stack-decision`
- `saas`
- `06-build-and-slice-loop`
- `forge-stack-pack`

## Last updated

2026-06-30
