---
name: "Agentic Security"
version: "1.0.0"
updated: "2026-04-23"
description: "OWASP Agentic Top 10:2026 prevention. Prompt injection hardening, MCP server vetting, tool misuse prevention, agent sandboxing, kill switches, human-in-the-loop gates. For any app calling LLM APIs."
---

# Agentic Security

For any app with AI chat, copilot features, agent workflows, or MCP integrations. Distinct from traditional web security — AI introduces new attack surfaces.

## OWASP Agentic Top 10 (2026) Prevention

**1. Prompt Injection:** System prompt isolation (never include user input in system messages). Input sanitization: strip XML/markdown injection patterns. Output filtering: scan LLM responses for injection payloads before execution. Defense-in-depth: no single layer sufficient.

**2. Trust Boundary Failures:** Treat all tool outputs as untrusted. Validate MCP server responses against expected schemas. Separate agent permissions from user permissions. Never pass raw tool output to another tool without validation.

**3. Tool Misuse:** Strict Zod schemas on all tool inputs. Allowlist permitted actions (deny by default). Audit log every tool call with input/output/timestamp. Rate limit tool invocations per session.

**4. Excessive Permissions:** Least-privilege per agent — scoped API keys, read-only where possible. Agent should only access resources needed for current task. Rotate agent credentials separately from user credentials.

**5. Insecure Output Handling:** Sanitize LLM output before rendering in HTML (XSS via AI). Never `eval()` or `innerHTML` LLM output. Markdown rendering: use allowlisted tags only. Code execution: CF Dynamic Workers/Sandboxes for isolation.

**6-7. Data Poisoning + Sandboxing:** Validate RAG data sources (checksums, provenance). Isolate agent execution in CF Sandboxes or Dynamic Workers. Network egress controls via Outbound Workers.

**8. Supply Chain (MCP Servers):** Vet all MCP server source code before connecting. Pin MCP server versions in `.mcp.json`. Audit tool definitions for unexpected capabilities. Monitor for MCP server updates that add new tools.

**9. Logging:** Log all agent actions, tool calls, and decisions to Sentry with context tags. Breadcrumbs before risky operations. Alert on unusual patterns (high tool call rate, unexpected tools, repeated failures).

**10. Kill Switches:** Max iterations per agent (prevent infinite loops). Human-in-the-loop gates for irreversible actions. `PermissionDenied` hook with `retry:true` for alternate approaches. Session timeout for autonomous runs.

## Cloudflare AI Code Review Pattern (Production)

Risk-tiered resource allocation: classify MRs as Trivial/Lite/Full by diff size and affected files. Frontier models (Opus) for Coordinator only; Sonnet for sub-reviewers. Circuit breaker: 429/503 triggers model switch, not retry. Streaming JSONL over buffered JSON for early failure detection.

7 concurrent domain-specific reviewers (Security/Performance/Quality/Docs/Compliance + Coordinator). Coordinator reads all 7, deduplicates, makes approval call. **Metrics:** $1.19/review avg, 3m39s median, 85.7% cache hit rate.

## Ownership
**Owns:** AI-specific attack surfaces, prompt injection prevention, MCP vetting, agent sandboxing, agentic OWASP compliance.
**Cross-refs:** security-hardening.md (traditional web security), semgrep-codebase-rules.md (static analysis).
