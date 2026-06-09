---
name: "contract-first-ai"
priority: 2
pack: "ai"
triggers:
  - "ai output"
  - "structured output"
  - "tool use"
paths:
  - "concern:ai-features"
---

# Contract-First AI

AI is foundational to the platform — that's exactly why its outputs deserve first-class typing. Every AI output MUST be structured, schema-bound, Zod-validated, and converted to a typed domain object BEFORE the app touches it. This is the same boundary discipline applied to every other input (env, webhook, queue, form) per `zod-everywhere` — AI is a first-class data source, treated like one. The contract — not the prose — is the interface.

This rule fires on every model call that feeds app logic. It complements ``verification-loop`` (deploy + prod-E2E) and ``auto-meta-work`` (analytics + Structured Outputs wiring).

## The pipeline

`AI output → schema → Zod validation → typed object → app logic`

- Define a Zod schema for the expected shape FIRST.
- Request the output as structured JSON (not prose) via Structured Outputs or a tool call.
- Validate on receipt with `schema.safeParse()`.
- On success → use the inferred typed object. On failure → repair-or-reject. Never pass raw through.

## Surfaces this applies to (every one needs a schema)

- Plans + roadmaps
- Code patches + diffs
- Tool-call results
- Generated components / pages
- SEO metadata (title / desc / JSON-LD)
- Translation bundles per locale
- Eval results + scores
- Build events (sandbox progress)
- Publish / deploy decisions
- Agent task assignments

## Canonical schema (AI code patch)

```ts
import { z } from 'zod';

const FileChangeSchema = z.object({
  path: z.string().min(1),
  action: z.enum(['create', 'update', 'delete']),
  content: z.string().optional(), // full file for create/update
  patch: z.string().optional(),   // unified diff when action === 'update'
});

export const AiPatchSchema = z.object({
  id: z.string().uuid(),
  featureSlug: z.string().regex(/^[a-z0-9_]{1,32}$/),
  summary: z.string().min(8),
  files: z.array(FileChangeSchema).min(1),
  risks: z.array(z.string()).default([]),
  verificationCommands: z.array(z.string()).min(1),
});

export type AiPatch = z.infer<typeof AiPatchSchema>;
```

## Requesting structured output

- **Anthropic Structured Outputs beta** — header `structured-outputs-2025-11-13` + `output_config.format` with the JSON schema derived from the Zod schema (`zod-to-json-schema`). Header dated; re-verify graduation status quarterly via `docs.anthropic.com/en/docs/build-with-claude/structured-outputs`. Last verified: 2026-06-09.
- **OR a tool call** whose `input_schema` is the Zod-derived JSON schema — the model fills the tool args, you validate the args. Tool-use path is GA — no beta header required, safe as the conservative fallback when Structured Outputs beta status changes.
- **Incompatible with Citations** (returns 400) — pick one per request per ``auto-meta-work``. Use Citations only when source attribution is the payload; otherwise Structured Outputs.

## Validate-on-receipt + repair-or-reject

### Do

- `safeParse` every AI response at the boundary.
- On validation failure, send the Zod error back to the model ONCE for a structured repair.
- Reject + log to Sentry if the repair also fails — typed contracts in, typed contracts out, no raw-text fallthrough.
- Carry `featureSlug` on every parsed object for traceability per ``feature-module-architecture``.

### Don't

- Don't `JSON.parse` model text and use it untyped.
- Don't `as AiPatch` to silence the compiler — that bypasses the runtime contract.
- Don't act on a partial parse; an invalid contract is a no-op, not a guess.
- Don't let prose ("here's your plan…") leak into app state.

## AutoRAG escape hatch (managed RAG over R2)

- When the contract is "retrieve + cite over R2-stored docs", AutoRAG / AI Search beats hand-rolled Vectorize + chunker + embedder + retriever pipelines.
- One endpoint, points at R2 bucket, auto-handles chunking + embedding + indexing + retrieval + generation. Still typed at boundary (Zod schema on the response payload).
- Source: Cloudflare. (2025, April 7). *AutoRAG open beta*. `developers.cloudflare.com/changelog/post/2025-04-07-autorag-open-beta/`
- Trade-off: less knob-control than bespoke pipeline. Pick AutoRAG for the common case; reach for Vectorize directly when you need custom retrieval (hybrid BM25+vector, custom rerank, multi-tenant index sharding).

## Reframe

Earlier draft framed this rule as "never trust AI." Reframed: AI is permanent + foundational; validation is standard hygiene at every runtime boundary per `zod-everywhere`, not skepticism. The rule is unchanged in mechanics — every AI output still flows `output → Zod → typed`. Only the frame: AI is a first-class data source the platform is built on.
