# Skill Retrospective

## Trigger phrases

- "review my skills"
- "what skills need updating"
- "skill audit"
- "run a retrospective on skills"
- "check skill health"

## When to use

- Periodically (monthly or quarterly) to audit skill inventory health
- When skills have been created rapidly without consolidation passes
- Before a major context-loading event to ensure skills are efficient
- When agent behavior seems outdated — the skill it loaded may be stale

## When not to use

- When you just added or updated a skill (it's already fresh — do this next cycle)
- For skills you've never used (consider deleting instead of auditing)
- When the skill count is under 5 and all were created recently

## Full reusable prompt

```
Run a retrospective across all skills. The goal is to audit health, identify gaps, detect drift, and surface skills that need updates or consolidation.

## Inventory

List every skill:
- Under `~/.agentskills/skills/` and `~/.claude/plugins/heymegabyte-claude-skills/`
- List their name, trigger phrases, and last-updated date

## Assessment criteria

For each skill, score 1-5 on:

| Criterion | Description |
|-----------|-------------|
| **Accuracy** | Does the skill still describe correct behavior? Or has the stack/process changed? |
| **Usefulness** | Has this skill been used more than once? Would you miss it if deleted? |
| **Token efficiency** | Could it say the same thing in half the lines? |
| **Uniqueness** | Does it overlap significantly with another skill? Could they merge? |
| **Trigger coverage** | Do the trigger phrases cover all the ways someone would invoke this? |

## Actions by score

| Score | Action |
|-------|--------|
| 5/5 | No action needed |
| 4/5 | Minor update (tweak triggers, tighten examples) |
| 3/5 | Moderate rewrite (outdated patterns, needs consolidation) |
| 2/5 | Major rewrite or merge with another skill |
| 1/5 | Archive — skill is no longer relevant |

## Process

1. Read each skill file in full
2. Score it on the 5 criteria
3. Check if its trigger phrases still match actual usage patterns
4. Check for drift between what the skill says and current reality

## Output format

```

## Skill Retrospective: YYYY-MM-DD

### Keep (scored 4-5)

- skill-name (5/5) — still accurate, used regularly

### Update (scored 3)

- skill-name (3/5) — triggers need updating, patterns have shifted

### Merge candidates (overlap detected)

- skill-a + skill-b — both cover auth patterns, 60% overlap

### Archive (scored 1-2, or unused >60 days)

- skill-name (1/5) — technology deprecated

### Gaps identified

- Missing: "How to configure X" — should add

```

Apply the updates immediately: edit files, merge overlaps, archive dead weight.
```

## Expected outputs

- Complete skill inventory with scores
- Updated skills (accuracy fixes, compression, trigger improvements)
- Merged overlapping skills
- Archived dead skills moved to `.archive/`
- Gap list for future skill creation

## Verification checklist

- [ ] Every skill scored on all 5 criteria
- [ ] 3-4/5 scores resulted in edits (not just noted)
- [ ] 1-2/5 scores resulted in archive or merge
- [ ] Merged skills tested (the merged version still covers all trigger scenarios)
- [ ] Trigger phrases updated to match actual usage
- [ ] Gaps documented for next creation cycle

## Related skills

- `agentskills-retrospective`
- `skill-health`
- `review-global-prompts`
- `self-improve`
- `prompt-library-curator`

## Last updated

2026-06-30
