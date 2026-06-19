# Validator Precision Discipline

Validators are force-multipliers only when signal-to-noise stays near 1.0. A 10% false-positive rate halves effective sensitivity — engineers discount output proportionally. This rule codifies lessons from four false-positive clusters (Jun-18 arc): github-hardened (1,134), posthog-hardened (13), stripe-hardened (555) — all caused by regex syntax assumptions.

Cross-links: [[root-cause-validator-findings]], [[drift-detection]], [[verification-loop]]

---

## Core principle — err on the side of silence

**Validators MUST prefer false negatives over false positives.**

- **False positive** — flags correct code; destroys trust, wastes time; never fixed, becomes background noise.
- **False negative** — misses a violation; caught at next audit or runtime.
- When unsure, stay silent and document uncertainty in a comment. Never flag speculatively.

---

## The three root causes

### 1. Regex too greedy (over-broad scope)

- Regex matches inside regions it shouldn't — e.g., scanning all `case 'x':` branches including dead-code guards (`if (false) { ... }`) or unrelated switch statements.
- **Symptom**: single server reports N × (tool count) violations.
- **Fix**: scope to smallest defensible region. For ListTools names, scope to `setRequestHandler(ListToolsRequestSchema ...)` block. Filter lines matching `if\s*\(\s*false` before counting handler cases.

### 2. Regex too strict on quoted style (under-broad matching)

- Hard-coding `"name": "x"` misses all TS literal equivalents: `name: 'x'`, `name: "x"`, `"name": 'x'`.
- Causes missed declarations (false negatives) AND wrongly orphaned handlers (false positives) simultaneously.
- **Fix**: accept all four variants in every string-extraction regex:
  `(?:"key"|key)\s*:\s*(?:"([^"]+)"|'([^']+')')`
- Use `m[1] ?? m[2]` to extract regardless of quote style.

### 3. Syntax assumption about visibility modifiers

- `hasZodSchema` requiring `export const XInputSchema` missed module-private `const XInputSchema` (equally valid).
- **Fix**: make visibility optional: `(?:export\s+)?const\s+${pascal}InputSchema\s*=\s*z\.`

---

## Mandatory finding format

Every violation MUST carry:

```
{ tool: '<name>', kind: '<violation-type>', detail: '<message>', confidence: 'HIGH|MEDIUM|LOW' }
```

- **HIGH** — direct evidence; regex unambiguously matches specific scope → CI `exit 1`.
- **MEDIUM** — inferred; depends on naming convention or ordering assumption → reported, non-blocking.
- **LOW** — heuristic; cannot distinguish from valid alternative → suppressed unless `--verbose`.

---

## Discipline checklist (write once per new validator check)

Before shipping any new check, answer all five:

1. **Scope** — regex anchored to correct region? Test with a file that has the pattern in two places.
2. **Syntax variants** — handles single-quote, double-quote, template literal (if static), exported vs private, camelCase/PascalCase/snake_case?
3. **False-positive rate** — run against full server corpus. >5% invalid on manual inspection → not ready.
4. **Suppression path** — `// validator-ignore: <kind>` escape hatch exists? Without one, a single edge case disables the entire check.
5. **Test fixture** — synthetic `index.ts` in `bin/__fixtures__/<check-name>/` covering both positive and false-positive scenarios?

---

## Operator discipline — LOW-confidence batch

When a run returns a large cluster of same-`kind` findings on one server (e.g., 13 "orphaned-handler"):

1. Spot-check 3 random findings manually against source.
2. If any 1 of 3 is a false positive → treat entire cluster as LOW-confidence; fix the validator, not the code.
3. File root-cause entry in [[root-cause-validator-findings]] before closing the arc.
4. Do NOT mark server as "has violations" in any dashboard until cluster is reclassified as HIGH-confidence.

---

## Cross-links

- [[root-cause-validator-findings]] — per-incident RCA log
- [[drift-detection]] — validator regression vs. new check
- [[verification-loop]] — gates before a validator change ships to CI
- `bin/validate-mcp-tools.mjs` — reference implementation (patched Jun-18 arc)
