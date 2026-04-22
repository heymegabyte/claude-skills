---
name: "Semgrep Codebase Rules"
description: "Custom Semgrep rules that the AI creates and evolves per-project. Enforces style, patterns, anti-patterns, and architectural constraints. Rules grow as the AI learns the codebase. Deterministic enforcement — hooks, not suggestions."
---

# Semgrep Codebase Rules

## Why Semgrep Over ESLint for This
ESLint rules require JavaScript plugin authoring. Semgrep rules are YAML — the AI writes and iterates them in seconds. Semgrep matches AST patterns, not text — fewer false positives than grep. Rules are per-project in `.semgrep/`, versioned in git, and grow as the AI learns patterns.

## Setup
```bash
# Install (Python)
pip install semgrep
# Or via Homebrew
brew install semgrep
# Create project rules directory
mkdir -p .semgrep/rules
```

## Rule Anatomy
```yaml
# .semgrep/rules/no-raw-fetch.yaml
rules:
  - id: no-raw-fetch
    pattern: fetch($URL, ...)
    message: "Use hc<AppType> RPC client instead of raw fetch. See 05/api-design."
    severity: WARNING
    languages: [typescript, javascript]
    paths:
      include: ["src/**"]
      exclude: ["src/lib/fetch.ts"]  # the one place raw fetch is allowed
```

## Rule Categories (AI creates these per-project)

### 1. Architecture Enforcement
```yaml
# No direct DB access outside repository layer
- id: no-direct-d1
  pattern: c.env.DB.prepare(...)
  message: "Use repository functions from src/db/. Direct D1 access breaks the data layer."
  severity: ERROR
  paths:
    exclude: ["src/db/**"]

# No importing from other feature's internals
- id: no-cross-feature-import
  pattern: import { ... } from "../$FEATURE/internal/..."
  message: "Import from feature's public API (index.ts), not internals."
  severity: ERROR

# Clerk auth required on API routes
- id: missing-auth-middleware
  patterns:
    - pattern: app.get($PATH, async ($C) => { ... })
    - pattern-not: app.get($PATH, requireAuth(), ...)
  message: "API route missing requireAuth() middleware. Add it or document why it's public."
  severity: WARNING
  paths:
    include: ["src/routes/**"]
    exclude: ["src/routes/webhooks/**", "src/routes/health.ts"]
```

### 2. Style Enforcement
```yaml
# No console.log in production code
- id: no-console-log
  pattern: console.log(...)
  message: "Use structured logging (Sentry breadcrumb or PostHog event), not console.log."
  severity: WARNING
  paths:
    exclude: ["**/*.test.*", "**/*.spec.*", "scripts/**"]

# No any type
- id: no-any-type
  pattern: "$X: any"
  message: "Use unknown instead of any. See code-style rule."
  severity: ERROR
  languages: [typescript]

# Error responses must use envelope
- id: error-envelope
  pattern: "c.json({ error: $MSG }, $STATUS)"
  fix: "c.json({ error: $MSG, code: 'UNKNOWN', details: null }, $STATUS)"
  message: "Use full error envelope: {error, code, details}."
  severity: WARNING
```

### 3. Security Rules
```yaml
# No hardcoded secrets
- id: hardcoded-secret
  patterns:
    - pattern: |
        $KEY = "sk_..."
    - pattern: |
        $KEY = "pk_..."
    - pattern: |
        $KEY = "Bearer ..."
  message: "Hardcoded secret detected. Use get-secret or env var."
  severity: ERROR

# Zod validation required on all request bodies
- id: missing-zod-validation
  patterns:
    - pattern: app.post($PATH, async ($C) => { const body = await $C.req.json(); ... })
    - pattern-not: app.post($PATH, zValidator(...), ...)
  message: "POST/PUT routes must use @hono/zod-validator. No raw req.json()."
  severity: ERROR
```

### 4. Anti-Pattern Detection
```yaml
# No TODO/FIXME in committed code
- id: no-todo
  pattern-regex: "(TODO|FIXME|HACK|XXX|TEMP)"
  message: "Resolve before committing. No TODOs in production code."
  severity: WARNING
  paths:
    exclude: ["**/*.md"]

# No placeholder content
- id: no-placeholder
  pattern-regex: "(lorem ipsum|coming soon|placeholder|example\\.com|sample data)"
  message: "Replace with real content. No placeholders."
  severity: ERROR
  paths:
    exclude: ["**/*.test.*", "**/*.md"]
```

## AI Rule Evolution Protocol

### When to Create a Rule
1. AI fixes the same pattern 3+ times → create a rule to catch it at commit time
2. Code review finds a recurring issue → codify as a rule
3. Architecture decision made → enforce with a rule immediately
4. Security vulnerability found → add prevention rule

### How the AI Creates Rules
```bash
# AI writes the rule
cat > .semgrep/rules/new-rule.yaml << 'EOF'
rules:
  - id: descriptive-name
    pattern: the-pattern-to-match
    message: "Why this is wrong and what to do instead."
    severity: WARNING|ERROR
    languages: [typescript]
EOF

# Test against codebase
semgrep --config .semgrep/rules/new-rule.yaml src/

# If it catches real issues → keep. If too noisy → refine patterns/paths.
```

### Rule Lifecycle
1. **Create** — AI writes rule after identifying a pattern
2. **Test** — Run against codebase, check for false positives
3. **Refine** — Adjust patterns, add path excludes, tune severity
4. **Enforce** — Add to pre-commit hook and CI
5. **Evolve** — As codebase patterns change, update rules
6. **Retire** — If a rule catches nothing for 30 days, consider removing

## Integration

### Pre-commit hook (add to .pre-commit-config.yaml)
```yaml
- repo: https://github.com/semgrep/semgrep
  rev: v1.95.0
  hooks:
    - id: semgrep
      args: ['--config', '.semgrep/rules/', '--error']
```

### CI (add to GitHub Actions)
```yaml
- name: Semgrep
  run: semgrep --config .semgrep/rules/ --error src/
```

### PostToolUse hook (runs after every Write/Edit)
The format-on-save.sh hook can be extended:
```bash
*.ts|*.tsx)
  npx eslint --fix "$FILE" 2>/dev/null || true
  npx prettier --write "$FILE" 2>/dev/null || true
  semgrep --config .semgrep/rules/ --quiet "$FILE" 2>/dev/null
  ;;
```

## Starter Rule Set
For every new Emdash project, copy this starter set:
```bash
cp -r ~/.agentskills/templates/semgrep-rules/ .semgrep/rules/
```

The AI then adds project-specific rules as it learns the codebase. By the end of a build session, the project has 10-20 custom rules that enforce its specific patterns — a codebase fingerprint that makes future modifications safer and more consistent.

## The Compounding Effect
Each session the AI works on a project, it may add 1-3 new rules. After 10 sessions, the project has 30+ rules encoding every architectural decision, style convention, and security requirement. The rules ARE the codebase knowledge — deterministic, testable, versionable. New agents (or new sessions after compaction) read the rules and immediately understand the project's constraints without needing the full conversation history.
