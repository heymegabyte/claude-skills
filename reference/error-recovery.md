# Error Recovery — Reference Implementations

Companion code for `[[error-recovery]]` § Folded from Superpowers. These are the two concrete patterns the folded rule describes — keep here (0 tokens until Read), not inline.

## condition-based-waiting

Replace arbitrary `sleep`/`setTimeout` with polling on the real condition. From obra/Superpowers (MIT).

```typescript
async function waitFor<T>(
  condition: () => T | undefined | null | false,
  description: string,
  timeoutMs = 5000
): Promise<T> {
  const startTime = Date.now();
  while (true) {
    const result = condition();
    if (result) return result;
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Timeout waiting for ${description} after ${timeoutMs}ms`);
    }
    await new Promise(r => setTimeout(r, 10)); // poll every 10ms
  }
}
```

Quick patterns:

- Wait for event: `waitFor(() => events.find(e => e.type === 'DONE'))`
- Wait for count: `waitFor(() => items.length >= 5)`
- Wait for file: `waitFor(() => fs.existsSync(path))`

Call the getter inside the loop (fresh data). Always timeout with a clear error. Poll every ~10ms — any faster wastes CPU. The only legitimate `setTimeout` is testing real timed behavior (debounce/throttle): wait for the trigger FIRST, THEN the known interval, with a comment justifying why.

## defense-in-depth

When you fix a bug caused by bad data, validate at EVERY layer data passes through — one check is bypassed by other code paths, mocks, or refactors. Four layers:

1. **Entry point** — reject obviously invalid input at the API boundary (type, range, not-empty).
2. **Business logic** — assert the value makes sense for THIS operation, even if it passed entry validation.
3. **Environment guard** — prevent dangerous ops in specific contexts (e.g. no `git init` outside `/tmp` during tests).
4. **Debug instrumentation** — log stack + context before the dangerous op for forensics.

All four are necessary — during testing, each layer catches bugs the others miss. Don't stop at one validation point.
