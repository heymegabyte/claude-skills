---
name: "todos-are-roadmap"
priority: 2
pack: "core"
triggers:
  - "todo"
paths:
  - "*"
---

# TODOs Are Roadmap

`TODO` / `FIXME` / `XXX` comments in source are **allowed** and often the right choice. A `TODO.md` at the repo root is a **legitimate lightweight roadmap**, not anti-pattern. The "ban TODOs" puritanism is a corporate-team artifact (someone's gonna grep `TODO` and shame you); for solo + AI it just pushes the same intention into invisible head-space, where it ages worse.

This rule REVERSES the "TODO is for cowards" proposal Claude made on 2026-05-28 in the Spirit Upgrade brainstorm. Brian explicitly corrected: *"You can have a TODO.md and TODO in source - no problem at all - why TODO is for cowards."*

## What's allowed

- **`// TODO: ...` in source** — marking future work an agent or Brian will return to. Annotate with the issue/feature scope when known: `// TODO(feature-flags-v3): unify with admin overrides`. Date-stamp when useful: `// TODO(2026-Q3): replace once X lands`.
- **`// FIXME: ...`** — marking a known bug or workaround. Pair with a brief WHY: `// FIXME: D1 batch API throws on empty arrays — guard at boundary`.
- **`// XXX: ...`** — marking surprising/hairy code that needs a second look. Same rules.
- **`TODO.md` at repo root** — lightweight roadmap. Bullet list of next-up work, ordered by priority. Companion to (not replacement for) `PORTFOLIO.md`, `CHANGELOG.md`, the Idea Engine, `supreme-polish` punch lists.
- **Per-feature `TODO.md`** under `libs/features/<slug>/TODO.md` — module-scoped backlog. Auto-grokked by the validate-features script in the future.

## Why TODOs are legitimate (not cowardly)

- **They show intentionality.** A `TODO` is a public declaration that something is coming. Pretending it doesn't exist doesn't make it not-coming.
- **They're greppable.** `grep -rn "TODO" src/` is a roadmap query. Banning the literal makes the same roadmap invisible.
- **They survive context loss.** Six months later, Brian's head doesn't remember the intention; the `TODO` does.
- **They're cheap audit trails.** `// TODO: this assumes US Eastern time` is a load-bearing invariant comment in disguise.
- **The "TODO rots" warning is half right.** Rotting TODOs are a symptom of no `supreme-polish` sweep, not of having TODOs in the first place. The sweep handles them; the fix is the sweep, not banning the marker.

## What's STILL banned (the existing rules stand)

- **TODOs in shipped user-visible strings** per `copy-writing` § Production-review copy gate. `<button>TODO: confirm copy</button>` ships → build fail. Source comments are fine; rendered output is not.
- **`TODO: fix the migration before deploy`** as a substitute for actually fixing critical-path work per `verification-loop`. If the gate requires it green, "TODO" doesn't pass the gate.
- **TODOs as architecture drift** per `drift-detection` § immediacy rule. Architecture drift gets fixed in-turn — "TODO: fix the missing manifest" is unacceptable, drift fixes ship NOW. This rule and `drift-detection` are complementary: drift-class TODOs ship-in-turn, future-real-work TODOs persist as roadmap.

## Sweep cadence (so TODOs stay roadmap, not rot)

- **Every supreme-polish run** per `supreme-polish` greps `TODO|FIXME|XXX` and triages each: ship-now / surface-in-Recs / re-annotate with target / delete if stale.
- **Every drift-detection run** per `drift-detection` flags TODOs in feature-module surfaces as drift candidates (not auto-removal, just review-prompting).
- **Brian's per-project sweep** during context-loading: a quick `rg TODO` to refresh on what's outstanding. The TODO list IS the lightweight bug tracker.
