# Vercel Labs / npx skills Registration

**Target:** Vercel's `npx skills` CLI registry (if/when public)
**PR target:** likely `vercel-labs/ai-skills` or a `registry.json` in their skills tooling repo

> NOTE (2026-06-18): As of this writing, Vercel's `npx skills` CLI and public registry
> are in early preview. The steps below are based on the published CLI API surface.
> Check https://github.com/vercel-labs for the current registry repo before submitting.

---

## Registration command

```bash
# From inside the heymegabyte/claude-skills repo root:
npx skills publish \
  --name "emdash-skills" \
  --display-name "Emdash Skills" \
  --description "19-category solo-SaaS-founder platform — 18 agents, 117 rules, 20+ commands, MCP forge, LLM evals, document processing, 32 platform variants. One-line prompts to Cloudflare Workers." \
  --repo "heymegabyte/claude-skills" \
  --homepage "https://claude.megabyte.space" \
  --tags "cloudflare,saas,autonomous,agents,mcp,evals,document-processing" \
  --license "Rutgers"
```

---

## skills.json config (if registry uses file-based registration)

Create or update `skills.json` at the repo root (Vercel's scanner may auto-detect it):

```json
{
  "name": "emdash-skills",
  "displayName": "Emdash Skills",
  "version": "7.2.1",
  "description": "19-category solo-SaaS-founder platform. Autonomous engineering OS: 18 agents, 117 doctrine rules, 20+ slash commands, production forge, LLM eval harness, MCP registry, DO agent scaffolding, RAG pipeline, multi-tenant subdomain provisioning, document processing (DOCX/XLSX/PDF/PPTX), non-engineering verticals (finance, compliance, PM, C-suite), 32 AI-tool platform variants.",
  "author": {
    "name": "Brian Zalewski",
    "email": "brian@megabyte.space",
    "url": "https://megabyte.space"
  },
  "homepage": "https://claude.megabyte.space",
  "repository": "https://github.com/heymegabyte/claude-skills",
  "license": "Rutgers",
  "categories": [
    "development",
    "deployment",
    "ai-agents",
    "mcp",
    "document-processing",
    "testing",
    "design"
  ],
  "tags": [
    "cloudflare-workers",
    "hono",
    "angular",
    "react",
    "saas",
    "autonomous",
    "agents",
    "mcp",
    "evals",
    "forge",
    "document-processing",
    "rag",
    "multi-tenant"
  ],
  "install": {
    "npm": "@heymegabyte/claude-skills",
    "jsr": "@heymegabyte/claude-skills",
    "github": "heymegabyte/claude-skills"
  },
  "entrypoint": "CLAUDE.md",
  "platforms": [
    "claude-code",
    "cursor",
    "windsurf",
    "copilot",
    "augment",
    "devin",
    "codex",
    "gemini-cli",
    "amazon-q",
    "jetbrains",
    "kiro",
    "aider",
    "zed",
    "cline",
    "roo-code",
    "continue",
    "void",
    "bolt",
    "qodo",
    "trae",
    "tabnine",
    "replit",
    "goose",
    "openhands"
  ]
}
```

---

## Alternative: PR to Vercel's registry repo

If `npx skills publish` requires a PR to a central registry instead of self-serve:

**Target file:** `registry/plugins.json` or `data/skills.json` in the Vercel Labs registry repo.

**Entry to add:**

```json
{
  "id": "heymegabyte-claude-skills",
  "name": "Emdash Skills",
  "description": "19-category solo-SaaS-founder platform — autonomous engineering OS, 18 agents, 117 rules, 20+ slash commands, production forge, LLM evals, MCP registry, document processing, 32 platform variants.",
  "author": "Brian Zalewski",
  "repo": "heymegabyte/claude-skills",
  "homepage": "https://claude.megabyte.space",
  "npm": "@heymegabyte/claude-skills",
  "jsr": "@heymegabyte/claude-skills",
  "license": "Rutgers",
  "tags": ["cloudflare", "saas", "agents", "mcp", "evals", "document-processing"],
  "verified": false
}
```

**PR description:**

```
## Summary

Registers Emdash Skills in the npx skills registry.

19-category autonomous engineering OS for solo SaaS founders:
- 18 agents (Opus/Sonnet/Haiku tiered)
- 117 doctrine rules, 5 PreToolUse hooks
- 20+ slash commands (/saas, /forge-from-openapi, /run-evals, /audit-mcp-fleet, ...)
- Production forge: OpenAPI → typed Hono + Zod in one command
- LLM eval harness with schema-validated results
- MCP authoring: HTTP server on Workers, stdio templates, registry audit
- Document processing: DOCX/XLSX/PDF/PPTX pipelines
- Non-engineering verticals: finance, compliance, PM, C-suite
- 32 platform variants (Cursor, Windsurf, Copilot, Augment, Kiro, ...)

npm: @heymegabyte/claude-skills
jsr: @heymegabyte/claude-skills
GitHub: heymegabyte/claude-skills
```

---

## Steps to complete

1. Check `https://github.com/vercel-labs` for the active skills/registry repo
2. If `npx skills publish` is available: run the command above from the repo root
3. If file-based: add `skills.json` to the repo root + commit
4. If PR-based: fork the registry repo, add the entry, open PR
5. Verify the skill appears at `npx skills search emdash` after approval
