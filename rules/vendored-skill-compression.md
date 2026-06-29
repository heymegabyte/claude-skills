---
last_reviewed: 2026-06-29
superseded_by: null
name: "vendored-skill-compression"
priority: 2
pack: "core"
triggers:
  - "vendor a skill"
  - "third-party skill"
  - "absorb skill"
  - "integrate plugin"
  - "import skill"
  - "vendor superpowers"
paths:
  - "**/SKILL.md"
  - "rules/**"
---

# Vendored-Skill Compression

When you pull a third-party skill/plugin/doc into the owned layer (`~/.agentskills`), it lands **compressed to house style in the SAME turn** — never verbatim. Verbatim vendoring imports another author's verbosity into a budget every prompt pays. The value is the *technique*, not the prose.

Cross-links: `[[instruction-compression-playbook]]` `[[skill-authoring-contract]]` `[[repo-folder-hygiene]]` `[[prompt-as-training-signal]]`

## The law

1. **Compress on the way in.** A vendored file gets the same compression pass an owned file gets — before the commit, not "later".
2. **Keep the non-obvious; cut the inferable.** Keep judgment calls, thresholds, the author's hard-won insight. Cut anything Claude already knows or can infer.
3. **Reference, don't restate, anything public.** If the content lives at a stable URL (vendor docs, Cialdini, RFCs) or a local reference file, link it and keep only the delta that matters here.
4. **Fold overlaps into the canonical owned file.** A vendored technique that duplicates an existing rule is folded there (attributed), not duplicated as a new skill — per `[[repo-folder-hygiene]]`.

## How (ordered, most load-bearing first)

1. **Strip the explainer.** Delete "what is X" sections — never define a PDF/HMAC/worktree/TDD. Omitting known context is free.
2. **Point public content out.** Replace a long restatement of a public doc with `See <url>` + a 5–15 line "what's non-obvious / what we changed" stub.
3. **Reorder by weight.** Lead with the most load-bearing constraint; ordered lists for scope/requirements (most important #1).
4. **Atomize.** One idea per bullet, ≤2 lines, imperative. Kill filler ("make sure", "in order to").
5. **Progressive disclosure.** SKILL.md becomes a table of contents; push depth to a sibling ref one level deep.
6. **Re-voice as a human.** Sound like one sharp engineer wrote it, not a committee — no slop, no hedging.
7. **Attribute once.** License + provenance live in the pack `NOTICE.md`, not repeated per file.

## Acceptance

- Vendored SKILL.md ≤ the repo line budget (`bin/check-skill-length.mjs`).
- No inline block restates a public doc verbatim — it's a pointer.
- Every overlapping technique is folded into its canonical rule, attributed.
- Reads like owned content, not a foreign import.

## See

- `[[instruction-compression-playbook]]` — the general compression method this specializes
- `20-superpowers/NOTICE.md` — reference application (Superpowers vendored 2026-06-28→29)
