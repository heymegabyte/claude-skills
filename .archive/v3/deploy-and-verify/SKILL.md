---
name: deploy-and-verify
description: "Deploy → purge → test → inspect → fix → redeploy loop. Continues until everything passes AND looks beautiful. Implements improvements discovered during inspection — don't just verify, enhance."
---

# Deploy and Verify — The Loop

## The Pattern

```
Deploy → Purge Cache → E2E Tests → Visual Inspect → Fix Issues → Redeploy
   ↑                                                              |
   └──────────────────────────────────────────────────────────────┘
   (repeat until 0 failures AND visually perfect)
```

## Step by Step

### 1. Deploy
```bash
npx wrangler deploy --env production
```

### 2. Purge Cache (ALWAYS)
```bash
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/ZONE/purge_cache" \
  -H "X-Auth-Email: blzalewski@gmail.com" \
  -H "X-Auth-Key: CF_KEY" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

### 3. E2E Tests
```bash
npx playwright test --reporter=list
# MUST be 0 failures
```

### 4. Visual Inspect
- Take screenshots (desktop + mobile)
- Check layout, typography, colors, animations
- Verify all interactive elements work

### 5. Fix Issues
For each issue:
- Identify root cause
- Fix it
- Go back to step 1

### 6. Enhance
After all issues fixed, ask:
- "Is there a quick improvement I can make?" (< 5 min)
- If yes → implement → go back to step 1
- If no → declare done

## The "Done" Criteria

- [ ] Deployed to production
- [ ] Cache purged
- [ ] E2E tests: 0 failures
- [ ] Desktop screenshot: no issues
- [ ] Mobile screenshot: no issues
- [ ] All links return 200
- [ ] No console errors
- [ ] No visual regressions
- [ ] Enhancement pass complete

## Report Template

```
Deploy: version [ID]
Cache: purged
Tests: X/X passing
Visual: ✓ desktop, ✓ mobile
Enhancements: [list any improvements made during inspection]
```
