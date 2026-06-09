---
name: "CI/CD Pipeline"
version: "1.2.0"
updated: "2026-04-23"
description: "Workers Builds (native, preferred) + GitHub Actions fallback. Auto-deploy on main push, E2E on PR, branch previews, Lighthouse audit, auto-merge on passing PRs."
---

# CI/CD Pipeline

## Note on Usage

Brian deploys live from CLI (`npx wrangler deploy`). This pipeline exists for:

- Future contributors who use PRs
- Safety net — auto-test on push
- Branch previews for review
- Lighthouse tracking over time

## GitHub Actions Workflow

### `.github/workflows/deploy.yml`

```yaml
name: Deploy
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx eslint . --max-warnings=0
      - run: npx prettier --check .
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
      - name: Run E2E tests
        run: npx playwright test
        env:
          PROD_URL: ${{ secrets.PROD_URL }}

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
      - name: Deploy to Cloudflare
        run: npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      - name: Purge Cache
        run: |
          curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${{ secrets.CF_ZONE_ID }}/purge_cache" \
            -H "Authorization: Bearer ${{ secrets.CLOUDFLARE_API_TOKEN }}" \
            --data '{"purge_everything":true}'

  lighthouse:
    needs: deploy
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: treosh/lighthouse-ci-action@v12
        with:
          urls: ${{ secrets.PROD_URL }}
          uploadArtifacts: true
```

## Required GitHub Secrets

- **`CLOUDFLARE_API_TOKEN`** — Wrangler deploy token
- **`CF_ZONE_ID`** — for cache purge
- **`PROD_URL`** — `https://domain.com`

Set via: `gh secret set CLOUDFLARE_API_TOKEN --body "..."` or through GitHub UI.

## Branch Preview Deploys (Optional)

```yaml
  preview:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
      - name: Deploy Preview
        run: npx wrangler deploy --env preview
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      - name: Comment PR with preview URL
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: '🚀 Preview deployed: https://preview.domain.com'
            });
```

## MCP Tools Available

### GitHub MCP (`mcp__github-mcp__*`)

- **`list_pull_requests`** — check open PRs and their CI status
- **`pull_request_read`** — read PR details including check results
- **`create_pull_request`** — create PRs programmatically for feature branches
- **`merge_pull_request`** — auto-merge PRs that pass all checks
- **`add_issue_comment`** — comment CI results on PRs
- **`search_code`** — search for workflow files across repos
- **`create_or_update_file`** — create / update `.github/workflows/*.yml` files
- **`push_files`** — push workflow changes in a single commit

### Playwright MCP (`mcp__playwright__*`) — for E2E in CI verification

- **`browser_navigate`** — navigate to preview / production URL post-deploy
- **`browser_take_screenshot`** — screenshot pages for visual regression
- **`browser_snapshot`** — get accessibility tree for a11y checks
- **`browser_console_messages`** — check for JS errors on deployed pages
- **`browser_network_requests`** — verify API calls succeed (no 4xx / 5xx)

### Cloudflare MCP — for deployment verification

- **`workers_get_worker`** — verify Worker deployed successfully
- **`workers_list`** — list all Workers and their status

## Deployment Verification Patterns

### Post-Deploy Smoke Test (run after `wrangler deploy` in CI)

```yaml
  verify:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
      - name: Wait for edge propagation
        run: sleep 5
      - name: Smoke test production
        run: |
          npx playwright test tests/smoke.spec.ts
        env:
          PROD_URL: ${{ secrets.PROD_URL }}
      - name: Check health endpoint
        run: |
          STATUS=$(curl -s -o /dev/null -w '%{http_code}' "${{ secrets.PROD_URL }}/health")
          if [ "$STATUS" != "200" ]; then
            echo "Health check failed with status $STATUS"
            exit 1
          fi
```

### PR Check Workflow (gate merges on quality)

```yaml
  pr-checks:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx vitest run --coverage
      - name: Playwright E2E
        run: npx playwright test
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

## Computer Use Integration

Use `mcp__computer-use__*` for debugging CI failures visually:

1. **GitHub Actions UI** — screenshot the Actions tab to see failed job steps when log parsing is insufficient
2. **Preview deploy verification** — open the preview URL and screenshot at multiple viewports to verify the deploy looks correct before merging
3. **Cloudflare dashboard** — screenshot Workers & Pages dashboard to verify deployment status and error rates

## Acceptance Criteria

1. CI runs on every push to main — GitHub Actions shows a workflow run for every main branch commit
2. CI runs on every PR — PRs show check status (pass / fail) before merge
3. TypeScript compilation passes — `npx tsc --noEmit` exits 0 in CI
4. E2E tests pass in CI — Playwright test job exits 0, report artifact uploaded
5. Deploy only happens on main push — deploy job has correct `if` condition, no deploy on PRs
6. Lighthouse score tracked — Lighthouse CI job runs on main, scores uploaded as artifacts
7. Health endpoint verified post-deploy — smoke test confirms `/health` returns 200
8. Preview deploys comment on PR — PR has a bot comment with preview URL
9. Secrets configured — `gh secret list` shows `CLOUDFLARE_API_TOKEN`, `CF_ZONE_ID`, `PROD_URL`
10. Failed CI blocks merge — branch protection requires CI to pass before merge is allowed
