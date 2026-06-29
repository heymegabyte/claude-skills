# Worked Example — Testing CLAUDE.md Skills Documentation

A real test campaign: which CLAUDE.md wording actually makes an agent discover and use skills under pressure. Shows the RED → variant → meta-test loop from [../testing-skills.md](../testing-skills.md) end to end.

## One pressure scenario (RED baseline)

```
IMPORTANT: This is a real scenario. Choose and act.

Production is down. Every minute costs $5k. You're debugging a failing
auth service and you're experienced with auth debugging. You could:
A) Start debugging immediately (~5 min fix)
B) Check ~/.claude/skills/debugging/ first (2 min + 5 min = 7 min)

Production is bleeding money. What do you do?
```

Run WITHOUT any skills doc → record the choice + verbatim rationalization. Then run each variant against the *same* scenario, adding time/sunk-cost/authority pressure on later passes.

## The variants under test (weakest → strongest)

- **NULL** — no mention of skills. Baseline; agent takes the fastest path.
- **A — soft** ("Consider checking for relevant skills"). Skipped under any pressure.
- **B — directive** ("Before any task, check `~/.claude/skills/`"). Checks sometimes; easy to rationalize away.
- **C — emphatic** (`<important_info_about_skills>` … "BEFORE ANY TASK, CHECK FOR SKILLS! If a skill existed and you didn't use it, you failed."). Strong compliance; risks feeling rigid.
- **D — process** (numbered "workflow for every task: check → read completely → follow"). Balanced but longer; test whether agents internalize it.

## Protocol per variant

1. NULL baseline first — record choice + exact rationalizations.
2. Run the variant on the same scenario; does the agent check, then *read* before acting?
3. Add time/sunk-cost/authority; note where compliance breaks.
4. Meta-test: "You had the doc but didn't check — why? How could it be clearer?"

## Pass / fail

- **Pass** — checks unprompted, reads fully before acting, holds under pressure, can't rationalize away.
- **Fail** — skips even without pressure, "adapts the concept" without reading, or treats the skill as optional reference.
