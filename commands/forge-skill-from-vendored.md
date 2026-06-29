---
description: Vendor a third-party skill repo/URL into the owned layer — clone, compress to house style, cross-link, commit — in one keystroke
argument-hint: <github-url> [<pack-number>]
---

<!-- <SUBAGENT-STOP>: skip this command when running inside a subagent. -->
<SUBAGENT-STOP/>

Vendor any third-party skill repo into `~/.agentskills`, compressed to house style per `[[vendored-skill-compression]]`. The law: compress on the way in, never verbatim. Reference public content; fold overlaps into the canonical owned rule; cross-link; commit same turn.

## Steps

1. Clone the repo to `/tmp/vendor-<name>/`.
2. Analyze: which files are skills (SKILL.md)? Which are public docs already at a stable URL? Which overlap with an existing `~/.agentskills` rule?
3. Build the pack folder `NN-<name>/` with:
   - `NOTICE.md` — provenance + upstream version + MIT license copy
   - `LICENSE-<name>` — the upstream license, verbatim
   - `SKILL.md` — compressed dispatcher with decision-flow + agent map + fold-list
   - One compressed sub-skill per non-overlapping upstream skill
4. For any overlapping technique: fold into the existing OWNED rule (attributed, cross-linked), do NOT create a duplicate skill folder.
5. For any public doc (>200 lines of upstream's own prose restating a known source): replace with a ≤20-line pointer + local deltas.
6. Register in `plugin.json` skills array, `_router.md` map, `llms.txt`, and `_packs/core.yml` (or the best pack).
7. Run `npm run lint`, fix any failures in YOUR files only.
8. Commit + push same turn per auto-push doctrine.

## Skip (true negatives, not laziness)

- The repo is a config/metadata-only wrapper (a marketplace entry, a plugin.json wrapper pointing at another repo).
- Every file in the repo duplicates an existing `~/.agentskills` rule with no net-new technique.
- The repo's license is incompatible with MIT vendoring.

## See

- `[[vendored-skill-compression]]` — the rule this command automates
- `20-superpowers/NOTICE.md` — worked example (obra/Superpowers → pack 20)
- `[[repo-folder-hygiene]]` — ≤10 items per folder, one canonical per concept
- `[[skill-authoring-contract]]` — the house format every skill must meet
