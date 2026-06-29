---
last_reviewed: 2026-06-29
superseded_by: null
name: template-utility-conventions
description: Template Utility Conventions
pack: "core"
priority: 2
triggers:
  - "template/utils"
  - "utility"
  - "jsdoc"
  - "vitest"
---

# Template Utility Conventions

Codifies the authoring contract for every file under `template/utils/`. Enforced by `bin/validate-template-utils.mjs`. Violations are drift — fix in-turn per `drift-detection`.

---

## Frontmatter

```
priority: 2
pack: core
triggers:
  - "template/utils/**"
  - "src/utils/**"
  - "worker/utils/**"
paths:
  - template/utils/
  - bin/validate-template-utils.mjs
```

---

## Authoring rules (all are hard gates — every rule must pass validation)

### 1. Co-located Vitest via `import.meta.vitest`

- Tests live IN the same file, guarded by `if (import.meta.vitest) { ... }`.
- NO separate `*.test.ts` or `*.spec.ts` siblings for utility files.
- Why: colocation keeps the test next to the thing it describes; reduces file count per `repo-folder-hygiene`.

See `reference/template-utility-conventions.md` for the pattern.

### 2. Zero external deps — `node:` and Web Crypto only

- Imports allowed: `node:crypto`, `node:buffer`, `node:url`, `node:stream` — and any sub-module thereof.
- Web Crypto (`globalThis.crypto.subtle`) is preferred over `node:crypto` for Workers compat.
- NEVER import npm packages inside `template/utils/`. If a dep is unavoidable, promote to a named library and document the exception in the file header.
- Grep gate: `grep -rE '^import .* from "[^node]' template/utils/` must be empty.

### 3. Workers-compatible — no `process.env` direct

- Never read `process.env.FOO` anywhere in a utility. Accept env via a typed parameter (`env: Env`) from the caller.
- Exception: `process.env.NODE_ENV` inside `if (import.meta.vitest)` blocks is tolerated.

See `reference/template-utility-conventions.md` for the pattern.

### 4. JSDoc on every export with `@example`

Every exported function, constant, class, and type alias requires JSDoc with:

- One-line summary (imperative mood).
- `@param` for every parameter (except trivial primitives where type is self-evident).
- `@returns` describing the value.
- At least one `@example` block showing real input → real output.
- `@throws` naming the typed Error subclass when the function throws.

See `reference/template-utility-conventions.md` for the full JSDoc example.

### 5. Pure functions where possible

- A utility function should be pure: same inputs → same output, no observable side-effects.
- If I/O is unavoidable (e.g. crypto key generation), mark it explicitly in JSDoc: `@remarks Impure — calls Web Crypto RNG.`
- Avoid module-level mutable state. Constants (`const`, `Object.freeze`) are fine.

### 6. Typed Error subclasses on throws

- Never `throw new Error(...)` from a utility — always a named subclass.
- Declare it in the same file, above the function that uses it.
- Why: callers can `catch (e) { if (e instanceof PiiScrubError) }` for precise handling.

See `reference/template-utility-conventions.md` for the subclass pattern.

### 7. Type-only imports use `import type`

- Importing a type, interface, or enum for type-checking only: `import type { Foo } from './foo.ts'`.
- Value imports: `import { bar } from './bar.ts'`.
- Mixed: `import { baz, type Qux } from './baz.ts'`.
- Prevents accidental runtime value inclusion; required for `verbatimModuleSyntax`.

### 8. ESM only

- All files use `import`/`export`. No `require()`, `module.exports`, or `exports.foo`.
- File extensions in relative imports: `.ts` (not `.js`) — let the bundler/runtime resolve.
- No default exports — use named exports only. Reason: refactor-safe, tree-shakeable, grep-friendly.

---

## `bin/validate-template-utils.mjs` — compliance script

- Create/maintain at repo root. Run in CI and pre-commit via lefthook.
- Checks: `import.meta.vitest` present · no external imports · no `process.env` access · `@example` JSDoc present · no bare `throw new Error(` · no default export · no `require(`.
- Exit 1 on any violation; reports `FAIL <file>: <reason>` per violation.

See `reference/template-utility-conventions.md` for the full script.

---

## See also

- `repo-folder-hygiene` — ≤10 items per folder; co-location pattern
- `zod-everywhere` — Zod at every runtime boundary (utilities accept typed params, not `any`)
- `drift-detection` — violations are drift, fixed in-turn
- `code-style` — TypeScript 5.9+, `verbatimModuleSyntax`, strict mode
