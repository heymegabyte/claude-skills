# Prompt Library Policy

The canonical prompt library lives at `~/.agentskills/prompts/`. It holds ~10 copy-pasteable, reusable prompts for humans and agents.

## Rules

1. **10-prompt cap.** When adding would exceed 10, merge the weakest into a broader prompt or archive it.
2. **Merge > create.** Before adding a new prompt, check if an existing one covers 80%+ of the same ground. Update the existing one.
3. **Archive weak prompts.** If a prompt hasn't been used in 30+ days, move it to `archives/` with a one-line reason.
4. **Every prompt needs trigger phrases.** These map repeated user wording to the prompt. Without triggers, the prompt is undiscoverable.
5. **Every prompt has a "when not to use" section.** Prevents over-application.
6. **Index is the source of truth.** `00-index.md` must be updated after every prompt add/merge/archive.
7. **Keep prompts copy-pasteable.** No external dependencies. No "see skill X for context." Self-contained.
8. **Add examples only when they improve future execution.** Don't pad.
9. **Prompt files are markdown with no frontmatter.** They're human-readable documents, not executable skills.
10. **Review quarterly.** Prune, merge, archive, update trigger phrases.

## Prompt File Format

```
# <Title>

## Trigger phrases
- "phrase 1"
- "phrase 2"

## When to use
- ...
## When not to use
- ...

## Full reusable prompt
<copy-pasteable prompt text>

## Expected outputs
- ...

## Verification checklist
- [ ] ...

## Related skills
- `skill-name`

## Last updated
YYYY-MM-DD
```

## See Also

- `prompts/00-index.md` — canonical index of all active prompts
- `routing-matrix.md` — when to use a prompt vs a skill vs a hook
- `archives/README.md` — archival policy
