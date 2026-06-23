# Portable Audit Discipline — implementation reference

Sourced on demand by rules/portable-audit-discipline.md.

---

## Concrete pattern — inline fallback (TypeScript)

`audit-mcp-error-semantics` checks that handlers return MCP-compliant error shapes.
`mcpHttpError` is the canonical helper in `template/utils/mcp-error-response.ts`.
If that file doesn't exist in the target project, the audit emits the inline guard instead.

```ts
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

Both forms below are wrong and MUST NOT appear in audit commands.

```ts
// BAD: audit silently fails if the helper file doesn't exist
import { mcpHttpError } from '../../utils/mcp-error-response.js'; // ReferenceError at runtime

// WORSE: audit throws a hard error and aborts the run
if (!existsSync(HELPER_PATH)) {
  throw new Error('audit-mcp-error-semantics requires template/utils/mcp-error-response.ts');
}
```

The first crashes mid-run. The second blocks audit entirely and gives the developer
no actionable output — it tells them to adopt a helper instead of showing them where
their error semantics are broken.

---

## Detection idiom — canonical shape

Use this exact shape in every audit command.

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

## Adoption gradient (three states)

```
State 0: No template utils      → audit runs, emits inline-fallback fixes
State 1: Partial template utils → audit runs, uses present helpers, emits inline for absent ones
State 2: Full template utils    → audit runs, points to helpers for all findings
```

The audit command must work identically in all three states: same issues found, same
findings emitted; only the suggested-fix wording differs.
