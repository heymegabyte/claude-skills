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

## Concrete pattern (TypeScript example)

```ts
// audit-mcp-error-semantics checks that handlers return MCP-compliant error shapes.
// mcpHttpError is the canonical helper in template/utils/mcp-error-response.ts.
// If that file doesn't exist in the target project, emit the inline guard instead.

import { existsSync } from 'node:fs';
import { join } from 'node:path';

const HELPER_PATH = join(projectRoot, 'src/utils/mcp-error-response.ts');
const hasHelper = existsSync(HELPER_PATH);

if (hasHelper) {
  // Point to the existing helper — no new code needed.
  finding.fix = `import { mcpHttpError } from '../../utils/mcp-error-response.js';`;
} else {
  // Emit a self-contained inline guard the developer can paste immediately.
  finding.fix = `
function mcpHttpError(status: number, message: string) {
  return { content: [{ type: 'text', text: \`Error \${status}: \${message}\` }], isError: true };
}`;
}
```

This pattern applies to any audit command that references a shared utility:

- `/audit-mcp-error-semantics` → `mcpHttpError`
- `/audit-mcp-mock-drift` → `MockRegistry` / `createMockHandler`
- `/audit-hook-wiring` → `HookDescriptor` type
- `/audit-prune-completeness` → `PruneManifest` schema

---

## Anti-pattern — erroring on missing dependency

```ts
// BAD: audit silently fails if the helper file doesn't exist
import { mcpHttpError } from '../../utils/mcp-error-response.js'; // ReferenceError at runtime

// WORSE: audit throws a hard error and aborts the run
if (!existsSync(HELPER_PATH)) {
  throw new Error('audit-mcp-error-semantics requires template/utils/mcp-error-response.ts');
}
```

Both forms are wrong. The first crashes mid-run. The second blocks audit entirely
and gives the developer no actionable output — it tells them to adopt a helper
instead of showing them where their error semantics are broken.

An audit command that requires its target to already be partially migrated is not
an audit command — it's a gate that only passes when nothing is wrong.

---

## Adoption gradient (three states a project can be in)

```
State 0: No template utils     → audit runs, emits inline-fallback fixes
State 1: Partial template utils → audit runs, uses present helpers, emits inline for absent ones
State 2: Full template utils   → audit runs, points to helpers for all findings
```

The audit command must work identically in all three states from the developer's
perspective: it finds the same issues, it emits the same findings, only the
suggested-fix wording differs.

---

## Detection idiom (use this exact shape in every audit command)

```ts
function resolveHelper(projectRoot: string, relativePath: string): 'present' | 'absent' {
  return existsSync(join(projectRoot, relativePath)) ? 'present' : 'absent';
}

// Usage in a finding emitter:
const helperState = resolveHelper(root, 'src/utils/mcp-error-response.ts');
const fix = helperState === 'present'
  ? `Use mcpHttpError() from 'utils/mcp-error-response'`
  : INLINE_FALLBACK_SNIPPET;
```

Centralising the detection keeps each audit command's logic focused on finding
violations, not on filesystem probing.

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
