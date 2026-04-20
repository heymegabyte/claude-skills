---
name: always-deploy-and-test
description: "MANDATORY BLOCKING RULE — Every response that changes code MUST deploy to production, run E2E tests, visually verify, and fix any issues before ending. No exceptions. Claude Code IS the deployment pipeline."
---

# Always Deploy and Test — MANDATORY

## The Rule

**Every response that modifies ANY source file MUST end with:**

1. **Typecheck** — `npx tsc --noEmit`
2. **Deploy** — `npx wrangler deploy --env production`
3. **Cache purge** — Cloudflare API purge_cache
4. **E2E tests** — `npx playwright test --reporter=list` → 0 failures
5. **Visual verify** — confirm the live site works

If ANY step fails → fix → redeploy → re-verify. Do NOT end the response until production is verified working.

## Why

Claude Code IS the deployment pipeline. No CI/CD reviews changes. If code changes but doesn't deploy, the user sees stale behavior and has to ask again. This wastes time and breaks trust.

## Quick Template

```bash
# The 4-step deploy sequence (copy-paste ready)
npx tsc --noEmit && \
npx wrangler deploy --env production && \
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
  -H "X-Auth-Email: blzalewski@gmail.com" \
  -H "X-Auth-Key: CF_API_KEY" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}' && \
npx playwright test --reporter=list
```

## What Triggers This

- ANY edit to `.ts`, `.html`, `.css`, `.js`, `.json`, `.toml` files
- ANY new file creation or deletion
- ANY config change

## What Does NOT

- Reading files without changing them
- Answering questions about code
- Writing to `~/.agentskills/` or memory files
- Creating plans or tasks

## Exceptions

- User explicitly says "don't deploy yet"
- Deployment credentials are missing (ask)
- The project has no wrangler.toml (not a Cloudflare project)

## End-of-Response Template

```
Deploy: [version ID]
Cache: purged
Tests: X/X passing
Visual: verified
```

## Also Do (While Deploying)

Since you're already deploying, also:
- Compress any images > 200KB
- Verify all links return 200
- Check structured data count (`grep -c 'ld+json'`)
- Ensure no console errors in browser
