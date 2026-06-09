---
name: "ai-agent-security"
priority: 3
pack: "ai"
triggers:
  - "prompt injection"
  - "mcp security"
  - "llm security"
paths:
  - "*"
---

# AI Agent Security

Every surface that consumes untrusted content through a model — AI chat panels, generated sites, RAG, tool-calling agents, MCP clients — is an attack surface. The model is a confused deputy by default: text it reads can become instructions it follows. Treat every model boundary as hostile-input territory, the same way `zod-everywhere` treats every data boundary. This is the AI-specific arm of `auth-permissions-security-supervisor`.

## When this fires

- Any feature that feeds user/third-party/retrieved content into a model
- Any tool-calling agent, MCP client, or generated-code execution path
- Any AI surface with access to secrets, filesystem, network, or a writeable DB

## OWASP LLM Top 10 v2 (2025) — the must-defend set

- **LLM01 Prompt Injection** (#1) — direct (user types an override) AND indirect (override hidden in a fetched page / document / email / tool output)
- **LLM06 Excessive Agency** — agent has broader tool scope than the task needs; an injection then wields it
- **System Prompt Leakage** — never put secrets/keys/policy in the system prompt; assume it's extractable
- **Vector / Embedding Weaknesses** — poisoned documents in the RAG store steer retrieval; validate + provenance-tag ingested corpora
- Separate **OWASP Agentic AI Top 10** (2025) covers autonomous multi-step agents — read it before shipping any unattended agent loop

## Prompt-injection defenses (mandatory on every AI surface)

- **Never pass retrieved/untrusted text as raw tool arguments** — Zod-validate + sanitize first per `contract-first-ai`
- **Trust domains** — keep system instructions, user input, and retrieved content in separate, labeled context blocks; the model treats retrieved content as data, not instructions
- **Scan tool outputs for instruction-override phrases** before acting on them ("ignore previous", "now do X", embedded fake system tags)
- **Gateway-side classifier** — mount Llama Guard 3-8B (`@cf/meta/llama-guard-3-8b`) as Hono middleware on every `/ai/*` route. Reject inbound text on `unsafe` ≥ 0.85 confidence; log all blocks to AI Gateway via `patchLog()` per `auto-meta-work`. Sub-ms latency on Workers AI; free up to quota.
- **Least privilege** — scope `allowedTools` / `disallowedTools` per task; read-only by default, write/destructive tools require explicit per-call authorization (not agent-init grant)
- **Out-of-band confirm** destructive tool calls (delete, charge, send, deploy) — never on the model's say-so alone
- **Sandbox generated/executed code** per `sandbox-execution` — never run model-authored code in the main runtime
- Multi-model verification chain for high-stakes actions (one model proposes, another adversarially reviews)

## MCP security

- **OAuth 2.1 mandatory** for remote MCP servers (spec, June 18 2025) + **RFC 8707 Resource Indicators** — bind each token to ONE audience so a server can't replay it elsewhere (confused-deputy fix)
- **Attack classes** — tool poisoning (malicious tool descriptions), rug pulls (server silently redefines a tool after you approved it), cross-server shadowing, OAuth confused deputy
- **Vet before adding** — prefer official registry servers; pin versions; re-review on update (CVE-2025-49596 MCP Inspector RCE CVSS 9.4; CVE-2025-6514 mcp-remote command injection; first malicious MCP package in the wild Sept 2025)
- Treat a third-party MCP tool as untrusted code with network access

## Supply chain (AI-assisted commits leak at ~2× baseline)

- **`npm ci` not `npm install`** in CI — install from the lockfile, never resolve fresh
- **Pin GitHub Actions to a commit SHA, not a tag** — tags get re-pointed. Auto-resolver: `node ~/.agentskills/scripts/sha-pin-actions.mjs .github/workflows/*.yml` (rewrites every `uses: owner/repo@vX` → `uses: owner/repo@<sha> # vX`). Idempotent.
- **Signed ≠ safe** — SLSA/Sigstore attestations verify the pipeline, NOT the code (TanStack CVE-2026-45321: 84 packages with valid Level-3 attestations from a hijacked CI). Add behavioral scanning (Socket.dev) on top
- AI-coding-agent PRs are a documented injection vector (Axios RAT, March 2026) — review dependency-adding diffs from agents

## Secret hygiene (tiered scanners)

- **Gitleaks** — pre-commit block (fast, regex+entropy, SARIF)
- **TruffleHog `--only-verified`** — CI sweep with live-credential verification (kills false positives)
- **detect-secrets** — baseline mode for legacy-codebase onboarding
- Never log model prompts/outputs that may contain secrets; redact at the boundary (`val.slice(0,7)…val.slice(-3)`)

## See

- `auth-permissions-security-supervisor` — server-side enforcement this rule's AI cases sit inside
- `contract-first-ai` + `zod-everywhere` — validate-then-type every model output + tool arg
- `tool-design-as-api` — narrow, typed, safe-by-default tools = the least-agency posture
- `sandbox-execution` — isolate generated/executed code
- `full-autonomy` — MCP spec + registry-first; this rule sets the security bar for what you add
- `auto-meta-work` — OWASP 2025 web/API scan; this is the LLM/agent companion
- `secret-auto-provisioning` + `secret-provisioning` — encrypted-at-rest creds, RFC 8707 audience binding
