# Event-Sourced Build Progress (***SUPREME — every AI build pipeline, every project***)

AI build progress MUST emit durable, typed, replayable events. Dashboards then show progress, generated components, tests, previews, failures, and publish status clearly — without polling, without log-scraping, without guessing. The event stream IS the source of truth for a build's state.

## Event types (***the canonical set***)
- `build.started` — pipeline kicked off
- `agent.started` — an agent began a unit of work
- `file.changed` — a file was written / patched
- `component.generated` — a UI component was produced
- `tests.started` — test run began
- `tests.completed` — test run finished (with pass/fail counts)
- `preview.updated` — preview server reflects new state
- `publish.completed` — validated artifact promoted to live
- `build.failed` — terminal failure (with reason)

## Every event's contract (***all five, no exceptions***)
- **Typed** — discriminated union on `type`, no loose `any` payloads
- **Zod-validated** — parsed at the boundary before persistence; invalid events rejected
- **Durable** — written to D1 / a session DO's SQLite / R2 (never in-memory only)
- **Replayable** — re-reading the ordered stream reconstructs full build state
- **Dashboard-displayable** — carries enough payload to render without a second fetch
- Carries a `buildId` (correlation id) + `featureSlug` where relevant

## Schema shape
```ts
import { z } from 'zod';

const Base = z.object({ buildId: z.string(), ts: z.string(), featureSlug: z.string().optional() });

export const BuildEventSchema = z.discriminatedUnion('type', [
  Base.extend({ type: z.literal('build.started'), prompt: z.string() }),
  Base.extend({ type: z.literal('component.generated'), name: z.string(), path: z.string() }),
  Base.extend({ type: z.literal('tests.completed'), passed: z.number(), failed: z.number() }),
  Base.extend({ type: z.literal('build.failed'), reason: z.string(), code: z.string() }),
  // ...remaining variants
]);

export type BuildEvent = z.infer<typeof BuildEventSchema>;
```

## Append-only discipline
- Events are append-only — never mutate or delete a recorded event
- Ordering is by monotonic `ts` + insertion id; replay walks them in order
- Dashboards subscribe (SSE / WS) and also backfill via replay on reconnect
- A build's terminal state is the last `publish.completed` OR `build.failed`

## Per-repo home
- `libs/core/build-events/` — schema + emitter + replay helper
- Emitter validates via `BuildEventSchema.parse` before persisting; rejects malformed events
- The sandbox is the producer; the admin dashboard is the consumer

## Reference incident (***2026-05-28 — global AI-dev OS upgrade***)
Brian directive to formalize event-sourced build progress so every emdash AI-build pipeline emits typed, Zod-validated, durable, replayable events that render cleanly on the admin dashboard.

## See
- [[contract-first-ai]] — events are a contract between the sandbox producer and dashboard consumer
- [[zod-everywhere]] — every event parsed at the boundary
- [[sandbox-execution]] — the sandbox emits the stream as it builds + validates
- [[verification-loop]] — `tests.completed` + `publish.completed` events mirror the deploy gate
- [[god-tier-engineering]] — durable event log pairs with pattern #8 ring-buffer logging
