---
name: "audit-arc-maturity-ladder"
priority: 3
pack: "core"
triggers:
  - "detector"
  - "audit script"
  - "soft gate"
  - "hard gate"
paths:
  - "*"
---

# Audit Arc Maturity Ladder

Pattern for graduating a class of bug from "we say to do this" to "the toolchain enforces it." Production-tested across 3 arcs (pass-43→52, pass-58→64, pass-72→84).

## The 6 steps

1. **Detect** — write `bin/check-<class>.sh` with denylist / claim-vs-reality diff / required-field scan. Uniform-JSON output per `uniform-json-output.md`. Sources shared `bin/lib/emit-json.sh` lib.
2. **Surface** — add as soft-info section in `bin/lint-all.sh`. Visible every pre-commit run, non-blocking. Output flows into `info[]` block of JSON envelope per the composed-envelope doctrine.
3. **Migrate** — drive count to zero via `sed` (per `lint-doctrine.md § Codified incidents`) + `Read`-before-`Edit` discipline + filter refinements. Use `grep -viE` exclusions for legitimate non-migration cases: retirement-docs, migration-notes, prose-list landscape references, historical anecdotes, codified-pattern docs.
4. **Codify** — write a row in `rules/lint-doctrine.md § Codified incidents` for any failure mode caught in-arc. Future maintainers consult before sed-driven migrations.
5. **Promote** — when stable at zero for ≥90 days OR ≥15 passes (whichever first), graduate from soft-info to a hard `runGate` call in `bin/lint-all.sh`.
6. **Regression protection** — pre-commit hook (`bin/install-hooks.sh` → `.git/hooks/pre-commit` → `bash bin/lint-all.sh --quiet`) blocks any commit that reintroduces the pattern.

## When each step applies

- **Detect** when: 3+ instances of the same drift class caught manually in different passes.
- **Surface** when: detector is shipped. Always — ~7 LOC overhead, every-commit visibility.
- **Migrate** when: count > 0 AND scope is bounded. If genuinely unbounded (e.g. external URLs), keep as cron-driven tracking per `pricing-check.yml` / `doc-urls-check.yml`.
- **Codify** when: an edge case caught in-arc would re-bite without documentation.
- **Promote** when: 0 hits AND stable ≥90 days OR ≥15 passes. Earlier promotion risks blocking unrelated commits.
- **Regression protect** when: gate is promoted. Automatic — pre-commit hook is already wired (pass-52).

## Short-path: CI-mirroring promotions skip the stability period

When a gate already exists in CI but has no local mirror in `bin/lint-all.sh`, the local mirror graduates IMMEDIATELY upon being built. No 90-day stability period applies.

Safe because: (1) CI gate already production-tested on every push; (2) local detector is a deliberate mirror of the same logic; (3) drift surface is typically already 0; (4) stability period filters false-positive-prone fresh detectors — CI-mirroring gates aren't fresh.

Reference impls:

- **pass-91**: `bin/check-doc-counts.sh` → gate #14. Source: publish.yml "Check doc counts" (failing 23+ passes).
- **pass-92**: `bin/check-skill-submodules.sh` → gate #15. Source: publish.yml "Check SKILL.md submodule alignment".

Short-path does NOT apply when:

- CI step is **tracking-class** (cron-driven external probe, opens-issue-on-drift) — stay tracking-class locally.
- CI step is **PR-only informational** (posts comment, doesn't block merge).

Short-path is for CI gates that BLOCK validate-job runs only.

## Anti-patterns

- **Skip step 2** (Detect → Migrate without surfacing) — invisible to maintainers + future-you.
- **Skip step 4** (migrate without codifying) — same arc repeats next time.
- **Promote before stability proof** — blocks unrelated commits during random drift.
- **Treat all classes as migratable** — some are tracking-class (`check-doc-urls.sh`, `check-pricing.sh`). Those stay info-only / cron-driven indefinitely.

## Reference impls (production)

- **Lint stack arc** (pass-43→52): Codify discipline → pre-commit hook. Caught 8+ latent bugs.
- **Audit pattern arc** (pass-58→64): 4 detectors (pricing, agent-routing, pack-frontmatter, agent-fallback). Caught 9 latent bugs.
- **Migration + promotion arc** (pass-72→84): deprecated-models 270→0. Caught 12+ latent bugs. 4 promotions to hard gates.

## See

- `bin/lib/emit-json.sh` — shared lib (15 callers as of pass-94)
- `rules/uniform-json-output.md` § Composed envelopes — JSON shape for soft-info section
- `rules/lint-doctrine.md` § Codified incidents — codified failure modes (10 disciplines as of pass-93)
- `bin/lint-all.sh` — reference impl of 15-gate suite + 3-info-section + quiet mode
- `bin/install-hooks.sh` — pre-commit hook installer
- `bin/check-ci-status.sh` — post-push CI verifier
