---
last_reviewed: 2026-06-29
superseded_by: null
name: portable-audit-discipline
description: Portable Audit Discipline
pack: "testing"
priority: 2
triggers:
  - "audit command"
  - "portable"
  - "inline fallback"
---

# Portable Audit Discipline

Audit commands in a plugin are consumed by N independent projects, none of which
has adopted every template utility on day one. An audit command that errors when its
helper dependency is missing is unusable in exactly the projects that need it most
(early-stage or partially-migrated).

This rule, extracted from the Task #69 arc (Jun-18), codifies the principle that
every audit command must work portably — with or without the plugin's own
`template/utils/` folder being present in the target project.

Cross-links: [[run-mcp-evals]], [[audit-mcp-error-semantics]], [[conditional-ci-gates]]

---

## Core principle — audit commands ship inline fallbacks

Every helper an audit command depends on MUST have an inline fallback:

1. **Detect** — check whether the helper is available in the target project.
2. **Use it** if present (avoids duplication, keeps projects on the latest pattern).
3. **Emit an inline equivalent** if absent (never error, never skip the finding).

The audit command's value is the finding, not the helper. Blocking on the helper's
absence defeats the purpose.

---

## Portable fallback pattern

- MUST detect helper presence via `existsSync` before referencing it.
- MUST emit an importable inline equivalent when the helper is absent — never throw, never skip.
- MUST produce the same findings regardless of which state the project is in.
- The canonical detection idiom is `resolveHelper(projectRoot, relativePath)` returning `'present' | 'absent'`.

See `reference/portable-audit-discipline.md` for the TypeScript detection idiom, full inline-fallback pattern, and anti-pattern examples.

---

## Adoption gradient (three states)

A project can be in one of three states; the audit MUST handle all three identically:

- **State 0** — No template utils → audit runs, emits inline-fallback fixes.
- **State 1** — Partial template utils → audit runs, uses present helpers, emits inline for absent ones.
- **State 2** — Full template utils → audit runs, points to helpers for all findings.

---

## Skill authoring checklist

When writing or patching an audit skill/command, answer these before shipping:

1. List every external helper the command references.
2. For each: does an inline fallback exist in the command itself?
3. Run the command against a project that does NOT have the helper. Does it produce
   findings + inline fixes, or does it error / produce nothing?
4. Run it against a project that DOES have the helper. Does it reference the helper
   correctly in the suggested fix?
5. Add a fixture entry to `bin/__fixtures__/audit-portable/` covering both scenarios.

If any answer is "no" or "errors", the command is not portable and must not ship.

---

## Cross-links

- [[run-mcp-evals]] — eval harness that exercises audit commands against real projects
- [[audit-mcp-error-semantics]] — canonical example of a portable audit command
- [[conditional-ci-gates]] — how to gate CI on audit findings without blocking on helper absence
- `rules/validator-precision-discipline.md` — companion rule on false-positive discipline
- `rules/template-utility-conventions.md` — the helper conventions audits reference
