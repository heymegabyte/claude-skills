# Anthropic claude-plugins-official Submission

**Target repo:** `anthropics/claude-plugins-official`
**PR title:** `feat: add heymegabyte/claude-skills — 19-category solo-SaaS-founder OS`

---

## Files to add

### 1. Entry in `marketplace.json`

Add the following object to the `plugins` array in `marketplace.json`:

```json
{
  "name": "claude-skills",
  "displayName": "Emdash Skills",
  "description": "19-category solo-SaaS-founder platform. Autonomous engineering OS with 18 agents, 117 doctrine rules, 20+ slash commands, production forge, LLM eval harness, MCP registry, DO agent scaffolding, RAG pipeline, multi-tenant subdomain provisioning, document processing (DOCX/XLSX/PDF/PPTX), non-engineering verticals (finance, compliance, PM, C-suite), and 32 AI-tool platform variants. One-line prompts to deployed Cloudflare Workers products.",
  "version": "7.2.1",
  "author": "Brian Zalewski",
  "repository": "https://github.com/heymegabyte/claude-skills",
  "homepage": "https://claude.megabyte.space",
  "license": "Rutgers",
  "categories": [
    "development",
    "deployment",
    "testing",
    "design",
    "mcp",
    "ai-agents",
    "document-processing"
  ],
  "tags": [
    "cloudflare-workers",
    "angular",
    "hono",
    "saas",
    "autonomous",
    "enterprise",
    "full-stack",
    "agents",
    "mcp",
    "evals",
    "document-processing",
    "rag",
    "multi-tenant",
    "forge"
  ],
  "compatibility": {
    "claude-code": ">=2.0.0"
  },
  "install": {
    "type": "github",
    "repo": "heymegabyte/claude-skills"
  }
}
```

---

## PR description (copy-paste)

```
## Summary

Adds heymegabyte/claude-skills to the official marketplace.

This plugin is a complete solo-SaaS-founder platform, not just a rules pack:

- 19 numbered skill categories covering engineering, non-engineering verticals
  (finance, compliance, PM, C-suite), document processing, and MCP authoring
- 18 specialized agents routed by model tier (Opus/Sonnet/Haiku)
- 117 doctrine rules enforced via 5 PreToolUse hooks + lint suite
- 20+ slash commands including /saas, /forge-from-openapi, /forge-webhook-handler,
  /generate-prp, /execute-prp, /run-evals, /audit-mcp-fleet, /dashboard-cockpit
- Production forge: bin/forge-skill-from-openapi.mjs generates full SKILL.md + command
  scaffold from any OpenAPI spec
- LLM eval harness with schema-validated results and regression tracking
- MCP server registry with /audit-mcp-fleet health-check and version-pinning
- DO agent scaffolding + RAG pipeline + multi-tenant subdomain provisioning (Cloudflare)
- Full document pipeline: DOCX/XLSX/PDF/PPTX — read, write, generate, parse
- 32 AI-tool platform variants (Cursor, Windsurf, Copilot, Augment, Devin, Codex,
  Gemini CLI, Amazon Q, JetBrains, Kiro, and 22 more)

Install:
  claude plugin install heymegabyte/claude-skills

## Checklist

- [x] plugin.json present at .claude-plugin/plugin.json
- [x] marketplace.json present at .claude-plugin/marketplace.json
- [x] CLAUDE.md present at root
- [x] README.md present at root with install instructions
- [x] LICENSE present (Rutgers license)
- [x] SECURITY.md present
- [x] No secrets or credentials in repository
- [x] Repository is public: github.com/heymegabyte/claude-skills
- [x] Homepage resolves: claude.megabyte.space
- [x] npm package published: @heymegabyte/claude-skills
- [x] JSR package published: @heymegabyte/claude-skills
- [x] All 19 skills have SKILL.md with valid frontmatter
- [x] All 18 agents have agent definition files
- [x] All 20+ commands have command definition files
```

---

## Checklist of files Brian needs to verify before submitting

- [ ] Fork `anthropics/claude-plugins-official` on GitHub
- [ ] Create branch `feat/add-heymegabyte-claude-skills`
- [ ] Add the JSON block above to `marketplace.json` in the correct alphabetical position (after any `e` entries, before `f` entries)
- [ ] Confirm `https://claude.megabyte.space` resolves (homepage field)
- [ ] Run `npm run validate` if the repo has a validation script
- [ ] Open PR with the description above
- [ ] Tag the PR with `new-plugin` label if that exists on the repo

---

## Key repo URLs to reference in the PR

- Repo: `https://github.com/heymegabyte/claude-skills`
- npm: `https://www.npmjs.com/package/@heymegabyte/claude-skills`
- JSR: `https://jsr.io/@heymegabyte/claude-skills`
- Homepage: `https://claude.megabyte.space`
- plugin.json: `https://raw.githubusercontent.com/heymegabyte/claude-skills/master/.claude-plugin/plugin.json`
