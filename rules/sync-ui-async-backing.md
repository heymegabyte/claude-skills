---
name: "sync-ui-async-backing"
priority: 2
pack: "core"
triggers:
  - "optimistic"
  - "waitUntil"
  - "ctx.waitUntil"
  - "idempotency"
  - "async backing"
  - "queue"
  - "optimistic update"
paths:
  - "src/worker/**"
  - "src/web/**"
  - "apps/**"
  - "worker/**"
---

# Sync UI, Async Backing (Optimistic UI + Queue Truth)

The UI always responds immediately. The backing store catches up asynchronously.

When a user clicks "Save", the UI optimistically updates and the handler returns 200. The actual D1 write, queue publish, or Inngest event fires in `ctx.waitUntil()`. If the background work fails it retries — the user is never blocked waiting for it.

This pattern eliminates D1 write latency (20–80ms) and queue publish latency (10–30ms) from the critical user path. Every mutating action gets an idempotency key (UUID from the client) so retries are safe.

## The pattern

Every mutating Worker handler has three phases:

1. **Accept** — validate input with Zod, generate idempotency key if client omitted one, return `200` with an optimistic response body
2. **Background** — fan the actual write into `ctx.waitUntil()` or a Queues publish
3. **Retry** — the queue consumer or Inngest step handles failure with exponential backoff; the UI never sees a transient error

```ts
// worker/routes/save-note.ts
import { Hono } from 'hono'
import { z } from 'zod'
import { SaveNoteSchema } from '../schemas/note'

const app = new Hono<{ Bindings: Env }>()

app.post('/api/notes', async (c) => {
  const body = await c.req.json()
  const parsed = SaveNoteSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

  const { title, content } = parsed.data
  // Idempotency key: client provides or we mint
  const idempotencyKey = c.req.header('idempotency-key') ?? crypto.randomUUID()

  // Phase 1 — respond immediately (sync)
  c.executionCtx.waitUntil(
    // Phase 2 — write in background (async)
    persistNote(c.env, { title, content, idempotencyKey })
      .catch((err) => {
        console.error(JSON.stringify({ level: 'error', event: 'save-note-bg-fail', err: String(err), idempotencyKey }))
        // Phase 3 — enqueue for retry
        return c.env.NOTE_QUEUE.send({ title, content, idempotencyKey }, { delaySeconds: 5 })
      })
  )

  return c.json({ ok: true, idempotencyKey }, 200)
})
```

## Idempotency key convention

- Client sends `Idempotency-Key: <uuid>` request header per `fetch-defaults`
- Worker reads with `c.req.header('idempotency-key')` and mints a `crypto.randomUUID()` fallback
- Key stored alongside the record; duplicate publish is a no-op (`INSERT OR IGNORE` in D1)
- Expose key in response body so client can poll or reconcile

## `ctx.waitUntil()` rules

- Use for writes that are **safe to delay 0–5s** (non-financial, non-auth, non-security)
- Do NOT use for: payment captures, auth token revocation, GDPR deletions (those are synchronous per `autonomous-engineering` approval tier)
- Budget: `waitUntil()` work counts against the Worker's CPU time limit (30s on free, 15min on paid); keep background tasks fast or push to Queues

## Queue consumer pattern (retry)

```ts
// worker/queue-consumers/note-consumer.ts
export default {
  async queue(batch: MessageBatch<NoteMessage>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      const result = await persistNote(env, msg.body).catch(() => null)
      if (result) msg.ack()
      else msg.retry({ delaySeconds: 30 }) // exponential via Queues
    }
  }
}
```

## React optimistic UI (TanStack Query)

```tsx
const mutation = useMutation({
  mutationFn: (note: NoteInput) =>
    fetch('/api/notes', {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID(), 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    }).then(r => r.json()),

  onMutate: async (note) => {
    await queryClient.cancelQueries({ queryKey: ['notes'] })
    const snapshot = queryClient.getQueryData<Note[]>(['notes'])
    queryClient.setQueryData<Note[]>(['notes'], old => [{ ...note, id: 'temp' }, ...(old ?? [])])
    return { snapshot }
  },

  onError: (_err, _note, ctx) => {
    // Roll back on hard failure (network error, 4xx)
    queryClient.setQueryData(['notes'], ctx?.snapshot)
  },

  onSettled: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
})
```

## When NOT to optimistic-update

- Financial transactions — show pending state, poll until confirmed
- Auth mutations (password reset, session revoke) — confirm server-side before updating UI
- Destructive deletes on paid content — require confirmation + undo window per `error-recovery`

## Cross-links

- **[[hono-api]]** — `ctx.waitUntil()` usage in Hono handlers
- **[[fetch-defaults]]** — idempotency key header convention
- **[[event-sourced-build-progress]]** — event sourcing as the authoritative truth layer
- **[[background-jobs-and-workflows]]** — Inngest retry patterns; Queues consumer shape
- **[[zod-everywhere]]** — validate before accepting, never after
- **[[error-recovery]]** — undo windows, rollback patterns
