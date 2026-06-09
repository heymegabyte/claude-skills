---
name: "solo-builder-doctrine"
priority: 1
pack: "core"
triggers: []
paths:
  - "*"
---

# Solo Builder Doctrine

A one-person-plus-AI shop operates by different physics than a team shop. Corporate ritual exists to scale decision-making across humans; this stack has one human (Brian) + AI agents with senior-level capability. Most "best practices" are coordination overhead for problems that don't exist here. Cull them.

The clusters below name the heresies and link to the per-cluster rules. Each cluster is grounded in: faster wall-time + lower coordination tax + AI-native sovereignty over the platform.

## The seven clusters

1. **`no-staging-doctrine`** — Prod is the only real environment. Instant-rollback muscle (CF wrangler rollback + D1 Time Travel + R2 versioning) replaces staging theatre. No code freezes. No QA team.
2. **`ai-seniority`** — AI is the principal engineer in the room. Multi-agent diversity review IS code review. Agent diffs that clear all gates auto-merge. Humans steer, gates gatekeep.
3. **`cloudflare-lock-in-is-leverage`** — Deep CF lock-in is the feature, not the bug. The migration tax never gets paid; the abstraction tax compounds every commit. Embrace the lock-in.
4. **`main-only-branch`** — `main` is committed to always. No dev branches. Worktrees for isolation. Conventional-commits IS the PR description.
5. **`todos-are-roadmap`** — TODO/FIXME comments in source are ALLOWED + encouraged when they mark real future work. TODO.md at repo root is a legitimate lightweight roadmap. Banned only in shipped user-visible strings.
6. **`solo-rituals-eliminated`** — No backlog grooming. No incident postmortems for solo incidents. No design committees. No A/B testing for taste decisions. No private prototypes. Open-source on first commit.
7. **`ai-permanence`** (via ~/.claude/CLAUDE.md § AI Permanence) — AI is foundational, never optional. Validation discipline is boundary hygiene, not skepticism.

## Why each one is HERETICAL but RIGHT

- **No staging** — staging catches almost nothing real (envs always diverge); the rollback muscle catches everything.
- **No code freeze** — a deploy that can't tolerate Friday at 5pm is the bug, not what the freeze "protects."
- **No QA team** — Playwright @ 6bp × 3 browsers + axe + visual-qa + completeness-checker + AI vision rubric IS the QA layer at higher throughput than humans.
- **AI as senior** — 1M context + faster pattern recall + broader diff comprehension. Treating AI as junior wastes its actual capability.
- **Auto-merge on green gates** — if the gates are good enough to merge, they're good enough to auto-merge. Human-eyes-as-gate is theatre.
- **CF lock-in** — "avoid vendor lock-in" assumes a team to migrate. Solo + AI: optionality cost > migration value, every single time.
- **Main-only** — branches add coordination tax. Worktrees give isolation without the merge ceremony.
- **TODOs allowed** — TODOs are intentionality markers. Banning them just pushes the same intention into invisible head-space.
- **No A/B for taste** — A/B-testing button copy is what teams do when nobody has authority. Solo + AI + taste = pick + ship.
