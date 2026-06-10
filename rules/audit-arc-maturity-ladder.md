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

- `bin/lib/emit-json.sh` — shared lib (10+ callers)
- `rules/uniform-json-output.md` § Composed envelopes — JSON shape for soft-info section
- `rules/lint-doctrine.md` § Codified incidents — codified failure modes from each arc
- `bin/lint-all.sh` — reference impl of 13-gate suite + info section + quiet mode
- `bin/install-hooks.sh` — pre-commit hook installer (regression protection layer)
