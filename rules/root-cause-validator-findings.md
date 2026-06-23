---
name: "root-cause-validator-findings"
priority: 2
pack: "core"
triggers:
  - "validator finding"
  - "false positive"
  - "lint error"
  - "static analysis"
  - "validator bug"
  - "tool says orphan"
  - "validator says violation"
paths:
  - "concern:observability"
---

# Root-Cause Validator Findings Before Applying Fixes

**Principle #21 — extracted 2026-06-18.**

When an automated validator (linter, static analyser, custom script, CI gate) surfaces
findings, the FIRST question is **"is the validator correct?"** — not "how do I make the
finding go away?"

Apply `[[verification-loop]]` rigor to the validator itself before treating its output as
source-of-truth. A validator with a detection bug will cause you to modify source code
that was correct, layering noise, dead code, or regressions on top of a non-problem.

---

## The Discipline (checklist — run before touching source)

1. **Read the violation, not just the count.** Understand exactly what the validator
   claims is wrong. Is the claim plausible for the flagged symbol?

2. **Trace the flagged code path manually.** Is the code the validator flagged actually
   reachable / active / a real mismatch? If the code is inside a dead-code guard
   (`if (false)`, `#[cfg(false)]`, `0 && ...`), the validator may be reading cold code as
   live.

3. **Check the detection pattern.** If the validator uses regex or simple AST matching
   (not a full program-analysis pass), look for edge cases: does it handle multiline
   patterns? Does it check surrounding context (dead-code guards, conditional imports)?

4. **Construct a minimal reproduction.** Write or copy the pattern the validator flags,
   confirm the flag fires, then add the surrounding context that should suppress it. If
   the flag doesn't suppress, the validator is wrong.

5. **Fix in the validator first.** If the detection is incorrect, patch the validator
   before touching source. Commit the validator fix. Re-run. Confirm the false positive
   disappears. Only then assess whether any true positives remain.

6. **Document the false-positive class.** If you found a systematic pattern of false
   positives, write a comment in the validator explaining the edge case and add a test
   fixture so the same bug cannot regress silently.

---

## Anti-Patterns

- **Appease-the-tool refactors** — adding guards, stubs, or no-op branches to source code
  solely to silence a validator that is itself wrong. The bug is now invisible AND the
  source is dirtier.

- **Batch "fixing" all violations before investigating even one** — running
  `fix all 1,134 orphaned handlers` before verifying that a single one is actually
  orphaned. The count is a smell, not a mandate.

- **Assuming tool accuracy without sampling** — treating a new or rarely-run validator as
  if it had been battle-tested. New validators are hypotheses; their first run against a
  large codebase should be sampled (5-10 random findings hand-verified) before acting on
  the full count.

- **Hiding the validator run behind CI** — merging "fixed" source and making the validator
  pass without recording that the validator itself had a bug. Future maintainers lose the
  institutional memory.

---

## Canonical Example — The if(false) False Positive (2026-06-18)

**Context.** `bin/validate-mcp-tools.mjs` checks MCP server source files for handler
coverage — every tool listed in `ListTools` must have a matching `case` branch in the
`CallTools` handler, and every handler must be listed in `ListTools`.

**The finding.** Task #61 ran the validator against github-mcp and got **1,134 orphaned
handler violations** — the largest violation count ever seen. The recommended fix was to
wrap each handler in an `if (false)` guard to suppress future detection.

**The diagnostic moment.** Before touching github-mcp source, the agent asked: "Why are
there 1,134 orphaned handlers? Were they always there, or did something change?" Sampling
10 random violations showed every flagged handler was ALREADY inside an `if (false)` guard
block — the pruning mechanism used to ship a reduced-scope server. The handlers were
intentionally dead.

**The root cause.** The validator's regex:

```js
const ifRe = /request\.params\.name\s*===\s*['"]([^'"]+)['"]/g;
```

matched `request.params.name === "GetRepository"` whether it appeared in live code or
inside `if (false) { ... }`. No context-check. Every pruned handler was counted as an
active handler, then flagged as orphaned when it didn't appear in `ListTools`.

**The fix — in the validator, not the source.**

```js
// Two-pass scan: collect all names, then collect only live (non-pruned) names.
const liveNames = new Set();
for (const line of src.split('\n')) {
  if (/if\s*\(\s*false/.test(line)) continue;   // skip dead-code guard lines
  const lm = line.match(/request\.params\.name\s*===\s*['"]([^'"]+)['"]/);
  if (lm) liveNames.add(lm[1]);
  const cm = line.match(/case\s+['"]([^'"]+)['"]\s*:/);
  if (cm) liveNames.add(cm[1]);
}
```

**Result.** 1,134 false-positive violations → 0. github-mcp source was never modified.
The "fix" that would have been applied (wrapping handlers in MORE `if (false)` guards) would
have added dead code on top of dead code and made the pruning pattern ambiguous for future
maintainers.

**Pre-patch vs post-patch counts (all 16 MCP servers):**

| Server | Pre-patch | Post-patch | Violation class | Real? |
|---|---|---|---|---|
| github-mcp | 1,134 | 0 | orphaned-handler | No — false positive |
| github-hardened-mcp | (skipped) | 0 | — | — |
| stripe-mcp | 555 | 555 | unhandled-tool | Yes — tools in ListTools with no handler |
| stripe-hardened-mcp | 0 | 0 | — | Clean |
| posthog-mcp | 26 | 13 | missing-zod-schema | Yes — tools missing Zod schemas |
| posthog-hardened-mcp | 0 | 13 | orphaned-handler | Yes — handlers not in ListTools |
| All others | 0 | 0 | — | Clean |

The stripe-mcp and posthog violations survived the patch because they are a different
violation class (`unhandled-tool` / `missing-zod-schema` / `orphaned-handler` in live
code), not the `if (false)` dead-code false-positive. Those require real fixes in source.

---

## Scope — When This Rule Applies

- Any custom validator or lint script run in CI or manually
- Static analysis tools (ESLint, oxlint, semgrep, tsc) when violation counts are
  surprising or implausible
- Coverage reporters claiming 0% on files that are clearly tested
- Type-checkers reporting errors on code that demonstrably runs

**Does NOT apply** when the validator is well-established and the violation is
unambiguous (e.g., `tsc` reporting a missing property on a concrete type). Use judgment:
the more "custom" or "new" the validator, the more skepticism is warranted.

---

## Cross-Links

- `[[verification-loop]]` — inspect → plan → implement → validate → repair; validate the
  validator the same way you validate code
- `[[error-recovery]]` — first hypothesis is not always correct; false-positive detections
  are a class of incorrect hypothesis
- `[[drift-detection]]` — a validator firing false positives creates drift pressure toward
  incorrect "fixes"; when detected, fix immediately
- `[[autonomous-engineering]]` — fixing source based on unvalidated tooling output is
  "review-recommended" tier; fixing the validator itself is autonomous
- `[[principles-incident-log]]` — Principle #21, reference incident 2026-06-18 / Task #61
