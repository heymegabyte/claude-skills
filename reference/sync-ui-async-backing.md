# Sync UI, Async Backing — implementation reference

Sourced on demand by rules/sync-ui-async-backing.md.

## Worker handler — three-phase pattern

Full implementation of Accept → Background → Retry for a note-save endpoint.

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

## Queue consumer pattern (retry)

Exponential back-off via Cloudflare Queues — each failed message is retried with
increasing delay.

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

Client-side optimistic update with snapshot rollback on hard failure.

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
