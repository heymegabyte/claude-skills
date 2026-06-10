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

Pattern for graduating a class of bug (drift, deprecation, missing field) from "we say to do this" to "the toolchain enforces it." Production-tested across 3 arcs (pass-43→52, pass-58→64, pass-72→84). Use it for every future audit class.

## The 6 steps

1. **Detect** — write `bin/check-<class>.sh` with a denylist / claim-vs-reality diff / required-field scan. Uniform-JSON output per `uniform-json-output.md`. Sources the shared `bin/lib/emit-json.sh` lib.
2. **Surface** — add as soft-info section in `bin/lint-all.sh`. Visibility every pre-commit run, but doesn't gate. Output flows into the `info[]` block of the JSON envelope per the composed-envelope doctrine.
3. **Migrate** — drive the count to zero via `sed` (per the codified migration recipe in `lint-doctrine.md § Codified incidents`) + `Read`-before-`Edit` discipline + filter refinements as edge cases surface. Use `grep -viE` exclusions for legitimate non-migration cases: retirement-docs, migration-notes, prose-list landscape references, historical anecdotes, codified-pattern docs.
4. **Codify** — write a row in `rules/lint-doctrine.md § Codified incidents` for any failure mode caught in-arc (stutter substitution, numeric-suffix collision, sed-then-Edit tracker desync, pipeline-exit-masking, `# shellcheck` prose-comment trap). Future maintainers consult before sed-driven migrations.
5. **Promote** — when the audit is stable at zero for ≥90 days OR ≥15 passes (whichever comes first), graduate from soft-info to a hard `runGate` call in `bin/lint-all.sh`. Removes the `runInfoSection` + `emitInfoSection` calls; adds a numbered gate entry.
6. **Regression protection** — the pre-commit hook (`bin/install-hooks.sh` → `.git/hooks/pre-commit` → `bash bin/lint-all.sh --quiet`) now blocks any commit that reintroduces the pattern. Discipline becomes a property of the toolchain, not the operator.

## When each step is the right move

- **Detect** when: 3+ instances of the same drift class have been caught manually in different passes. Below 3, defer (per the 3-caller threshold for shared-lib extraction).
- **Surface** when: detector is shipped. Always — info-section overhead is ~7 LOC and gives every-commit visibility.
- **Migrate** when: count > 0 AND scope is bounded. If count is genuinely unbounded (e.g. broken-link health across external URLs), keep as cron-driven tracking issue per `pricing-check.yml` / `doc-urls-check.yml` patterns.
- **Codify** when: an edge case caught in-arc would re-bite without documentation. Even single-pass-caught patterns deserve a row if the pattern is generic.
- **Promote** when: 0 hits AND stable for ≥90 days OR ≥15 passes. Earlier promotion risks blocking commits during normal drift surface.
- **Regression protect** when: gate is promoted. Automatic — the pre-commit hook is already wired (pass-52).

## Short-path: CI-mirroring promotions skip the stability period

When a gate already exists in CI (e.g. `publish.yml` validate job) but has no local mirror in `bin/lint-all.sh`, the local mirror graduates IMMEDIATELY upon being built. No 90-day stability period applies.

### Why the short-path is safe

1. The CI gate has been production-tested on every push for the workflow's lifetime — false-positive surface already proven
2. The local detector is a deliberate mirror of the same logic — same risk profile as the CI gate
3. The drift surface is typically already 0 (because the CI gate has been enforcing it)
4. Stability period exists to filter false-positive-prone fresh detectors; CI-mirroring gates aren't fresh

### Reference impls (production)

- **pass-91**: `bin/check-doc-counts.sh` immediately promoted to gate #14. Source: publish.yml "Check doc counts" step (failing 23+ passes before pass-89 unmasked it)
- **pass-92**: `bin/check-skill-submodules.sh` immediately promoted to gate #15. Source: publish.yml "Check SKILL.md submodule alignment" step (same blind-spot incident)

### When the short-path does NOT apply

- The CI step is **tracking-class** (cron-driven external probe, opens-issue-on-drift) — those stay tracking-class locally. Examples: `version-drift-check.yml` (probes external library versions), `doc-urls-check.yml` (external URLs), `pricing-check.yml` (dated content staleness).
- The CI step is **PR-only informational** (posts a comment, doesn't block merge) — those don't need local mirroring. Example: `supply-chain-pr-comment.yml` (gitleaks + trufflehog scan results as PR comment).

The short-path is for CI gates that BLOCK validate-job runs, not advisory ones.

## Anti-patterns

- **Skip step 2** (going Detect → Migrate without surfacing) — invisible to maintainers + future-you. The info section is the breadcrumb.
- **Skip step 4** (migrate without codifying) — same arc repeats next time. The codified row prevents re-discovery.
- **Promote before stability proof** — blocks unrelated commits during random drift. Wait for the threshold.
- **Treat all classes as migratable** — some are tracking-class (`check-doc-urls.sh` for external URLs, `check-pricing.sh` for dated content). Those stay info-only / cron-driven indefinitely.

## Reference impls (production)

- **Lint stack arc** (pass-43→52): Codify discipline → pre-commit hook. Caught 8+ latent bugs.
- **Audit pattern arc** (pass-58→64): 4 detectors (pricing, agent-routing, pack-frontmatter, agent-fallback). Caught 9 latent bugs.
- **Migration + promotion arc** (pass-72→84): deprecated-models 270→0. Caught 12+ latent bugs. 4 promotions to hard gates.

## See

- `bin/lib/emit-json.sh` — shared lib (15 callers as of pass-94, 5× the pass-38 extraction threshold)
- `rules/uniform-json-output.md` § Composed envelopes — JSON shape for soft-info section
- `rules/lint-doctrine.md` § Codified incidents — codified failure modes from each arc (10 disciplines as of pass-93)
- `bin/lint-all.sh` — reference impl of 15-gate suite + 3-info-section + quiet mode
- `bin/install-hooks.sh` — pre-commit hook installer (regression protection layer)
- `bin/check-ci-status.sh` — post-push CI verifier (closes the local-only mechanical-enforcement blind spot)
