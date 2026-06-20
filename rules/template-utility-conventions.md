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
- Pattern:

  ```ts
  if (import.meta.vitest) {
    const { describe, it, expect } = import.meta.vitest;
    describe('scrubPii', () => {
      it('redacts email', () => expect(scrubPii('a@b.com')).not.toContain('@'));
    });
  }
  ```

- Why: colocation keeps the test next to the thing it describes; reduces file count per `repo-folder-hygiene`.

### 2. Zero external deps — `node:` and Web Crypto only

- Imports allowed: `node:crypto`, `node:buffer`, `node:url`, `node:stream` — and any sub-module thereof.
- Web Crypto (`globalThis.crypto.subtle`) is preferred over `node:crypto` for Workers compat.
- NEVER import npm packages inside `template/utils/`. If a dep is unavoidable, promote to a named library and document the exception in the file header.
- Grep gate: `grep -rE '^import .* from "[^node]' template/utils/` must be empty.

### 3. Workers-compatible — no `process.env` direct

- Never read `process.env.FOO` anywhere in a utility.
- Accept env via a typed parameter (e.g. `env: Env`) passed from the caller (`c.env` in Hono).
- Exception: `process.env.NODE_ENV` inside `if (import.meta.vitest)` blocks is tolerated.
- Pattern:

  ```ts
  export function buildSignedUrl(path: string, env: Pick<Env, 'SIGNING_SECRET'>): string { ... }
  ```

### 4. JSDoc on every export with `@example`

Every exported function, constant, class, and type alias requires JSDoc with:

- One-line summary (imperative mood).
- `@param` for every parameter (except trivial primitives where type is self-evident).
- `@returns` describing the value.
- At least one `@example` block showing real input → real output.
- `@throws` naming the typed Error subclass when the function throws.

```ts
/**
 * Redact PII tokens from an arbitrary string.
 *
 * @param raw - Unsanitised user-supplied text.
 * @returns The input with email, phone, and SSN patterns replaced by `[REDACTED]`.
 * @throws {PiiScrubError} When `raw` is not a string.
 * @example
 * scrubPii('call me at 555-867-5309')
 * // → 'call me at [REDACTED]'
 */
export function scrubPii(raw: string): string { ... }
```

### 5. Pure functions where possible

- A utility function should be pure: same inputs → same output, no observable side-effects.
- If I/O is unavoidable (e.g. crypto key generation), mark it explicitly in JSDoc: `@remarks Impure — calls Web Crypto RNG.`
- Avoid module-level mutable state. Constants (`const`, `Object.freeze`) are fine.

### 6. Typed Error subclasses on throws

- Never `throw new Error(...)` from a utility — always a named subclass.
- Declare it in the same file, above the function that uses it.

```ts
export class PiiScrubError extends Error {
  constructor(message: string, public readonly input: unknown) {
    super(message);
    this.name = 'PiiScrubError';
  }
}
```

- Why: callers can `catch (e) { if (e instanceof PiiScrubError) }` for precise handling.

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

Create/maintain this script at repo root. Run in CI and pre-commit via lefthook.

```js
#!/usr/bin/env node
// Validates template/utils/ against authoring conventions.
// Exit 1 on any violation.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = new URL('../template/utils/', import.meta.url).pathname;
const files = (await readdir(ROOT)).filter(f => f.endsWith('.ts'));
let violations = 0;

for (const file of files) {
  const src = await readFile(join(ROOT, file), 'utf8');
  const fail = (msg) => { console.error(`FAIL ${file}: ${msg}`); violations++; };

  if (!src.includes('import.meta.vitest'))       fail('missing co-located vitest block');
  if (/^import .* from "[^node"']/.test(src))    fail('external dep import detected');
  if (/process\.env\.[A-Z]/.test(src))           fail('direct process.env access');
  if (/export (function|const|class)/.test(src) &&
      !src.includes('@example'))                  fail('exported symbol missing @example JSDoc');
  if (/throw new Error\(/.test(src))              fail('bare Error throw — use typed subclass');
  if (/^export default/.test(src))                fail('default export — use named exports only');
  if (/require\(/.test(src))                      fail('require() call — ESM only');
}

if (violations) { console.error(`\n${violations} violation(s). Fix before committing.`); process.exit(1); }
console.log(`✓ ${files.length} utility file(s) passed all conventions.`);
```

---

## See also

- `repo-folder-hygiene` — ≤10 items per folder; co-location pattern
- `zod-everywhere` — Zod at every runtime boundary (utilities accept typed params, not `any`)
- `drift-detection` — violations are drift, fixed in-turn
- `code-style` — TypeScript 5.9+, `verbatimModuleSyntax`, strict mode
