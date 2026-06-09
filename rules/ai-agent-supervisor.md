---
name: "ai-agent-supervisor"
priority: 3
pack: "ai"
triggers:
  - "agent supervisor"
paths:
  - "concern:ai-features"
---

# AI + Agent Supervisor

AI is foundational to the platform per `ai-permanence` — never a bolt-on, never optional-as-in-second-class. AND every AI output is Zod-validated, every AI feature ships a deterministic fallback, every AI action is logged/traced. The two are not in tension: validation + fallback are boundary hygiene applied to a load-bearing layer, exactly like typing an HTTP response. The AI arm of the supervisor system.

## Framing

- **AI is foundational** (`ai-permanence`) — reach for AI wherever it makes the surface easier/faster/safer/clearer.
- **Deterministic fallback is hygiene, NOT demotion** — "not AI-dependent" means the UX degrades gracefully when a model is down/slow/refuses, the same way a typed boundary handles a malformed input. It does NOT mean AI is an accessory.
- A brief that argues AI should move from foundation to accessory gets pushed back on per `prompt-as-training-signal` §8. A brief that asks for fallbacks + validation (this one) is aligned.

## When this fires

- Any feature whose value depends on a model output (generation, classification, summarization, assist, search)

## Tooling + when to use

- **Vercel AI SDK** — streaming, structured outputs, tool calling, provider abstraction (has Angular hooks)
- **assistant-ui** — ONLY where an assistant UI genuinely fits
- **Ollama** / **vLLM** — local / self-hosted inference (prefer where practical)
- **transformers.js** — browser/JS-native ML where practical
- **LangChain.js** / **LlamaIndex.js** — ONLY where they reduce complexity (not by default)
- **Cloudflare AI Gateway** / **Vectorize** / **Sandbox SDK** — behind adapters (`AiPort`/`VectorPort`) per `cloudflare-hostable-supervisor`

## Rules

- **Validate every AI output with Zod** per `contract-first-ai` — structured output / tool call, parse-then-type, repair-or-reject, never raw-through
- **Every AI feature has a deterministic fallback** — model down/slow/refusing → the workflow still completes (cached result, manual path, or graceful empty state)
- **Every AI action is logged + traced** — `ai_trace_id` flows to `observability-ops-supervisor`; prompt template version + model config logged safely (no secrets)
- **Prefer local/self-hostable** AI where practical (Ollama/vLLM/transformers.js) per cost + privacy
- **Tenant-scoped + permission-aware + flag-gated** — every AI feature behind a server flag + killswitch + budget/timeout/truncation per `feature-flags`
- **Evals** for AI-heavy behavior per `evals` — generation quality is tracked like any load-bearing layer
