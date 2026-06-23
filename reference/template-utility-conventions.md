# Template Utility Conventions — implementation reference

Sourced on demand by rules/template-utility-conventions.md.

---

## Co-located Vitest pattern

Tests live in the same `.ts` file, guarded by `if (import.meta.vitest)`. No separate spec siblings.

```ts
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;
  describe('scrubPii', () => {
    it('redacts email', () => expect(scrubPii('a@b.com')).not.toContain('@'));
  });
}
```

---

## Workers-compatible env pattern

Never read `process.env.FOO` in a utility — accept env as a typed parameter from the caller.

```ts
export function buildSignedUrl(path: string, env: Pick<Env, 'SIGNING_SECRET'>): string { ... }
```

---

## JSDoc with `@example` — full pattern

Every exported function, constant, class, and type alias requires JSDoc with summary, `@param`, `@returns`, `@example`, and `@throws` (when applicable).

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

---

## Typed Error subclass pattern

Declare the subclass in the same file, above the function that uses it.

```ts
export class PiiScrubError extends Error {
  constructor(message: string, public readonly input: unknown) {
    super(message);
    this.name = 'PiiScrubError';
  }
}
```

---

## `bin/validate-template-utils.mjs` — full compliance script

Create/maintain at repo root. Run in CI and pre-commit via lefthook.

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
