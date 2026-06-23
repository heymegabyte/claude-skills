# Conditional CI Gates — implementation reference

Sourced on demand by rules/conditional-ci-gates.md.

## GitHub Actions: `hashFiles` conditional pattern

`hashFiles(...)` returns an empty string when no files match the glob. Use this to gate entire steps on feature presence — no external scripts, no env flags.

```yaml
# .github/workflows/validate.yml

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:

      # Gate: only runs if the email-auth validation script exists
      - name: Validate email auth config
        if: hashFiles('scripts/validate-email-auth.mjs') != ''
        run: node scripts/validate-email-auth.mjs

      # Gate: only runs if eval cases directory is non-empty
      - name: Run evals
        if: hashFiles('tools/evals/cases/**') != ''
        run: node tools/evals/runner.mjs

      # Gate: only runs if feature manifests exist anywhere in src/
      - name: Validate feature manifests
        if: hashFiles('src/**/manifest.ts') != ''
        run: node scripts/validate-manifests.mjs

      # Gate: only runs if Sentry is wired (sentry.client.config.ts present)
      - name: Sentry source maps upload
        if: hashFiles('sentry.client.config.ts') != ''
        run: npx @sentry/cli sourcemaps upload dist/

      # Gate: only runs if Playwright specs exist
      - name: E2E tests
        if: hashFiles('e2e/**/*.spec.ts') != ''
        run: npx playwright test --config=playwright.config.ts
```

## Wrangler: content-based presence check

For Cloudflare-specific features, `hashFiles` returns a hash string — not file contents. Use a grep step for content-based gating.

```yaml
# .github/workflows/deploy.yml

jobs:
  deploy:
    steps:

      # Better: use a lightweight presence script
      - name: Check observability opt-in
        id: obs-check
        run: |
          if grep -q '\[observability\]' wrangler.toml 2>/dev/null; then
            echo "enabled=true" >> $GITHUB_OUTPUT
          else
            echo "enabled=false" >> $GITHUB_OUTPUT
          fi

      - name: Validate observability config
        if: steps.obs-check.outputs.enabled == 'true'
        run: node scripts/validate-observability.mjs
```

For multi-environment wrangler setups:

```yaml
      - name: Check D1 binding exists for prod
        id: d1-check
        run: |
          if grep -qA5 '\[env\.production\]' wrangler.toml | grep -q 'd1_databases'; then
            echo "has_d1=true" >> $GITHUB_OUTPUT
          fi

      - name: Validate D1 schema drift
        if: steps.d1-check.outputs.has_d1 == 'true'
        run: npx drizzle-kit check
```

## Anti-patterns: hardcoded checks that fail on bare-template repos

```yaml
# WRONG — fails if the script does not exist yet
- name: Validate email auth
  run: node scripts/validate-email-auth.mjs   # FileNotFound exit 1

# WRONG — assumes feature flags table always exists
- name: Check feature flags
  run: npx wrangler d1 execute DB --command "SELECT 1 FROM feature_flags LIMIT 1"
  # D1 table not created yet on first deploy

# WRONG — hard-requirement on evals that not every project uses
- name: Run evals
  run: node tools/evals/runner.mjs
  # Directory doesn't exist → crash

# WRONG — env var required even on projects that don't need it
- name: Upload to Sentry
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
  run: npx sentry-cli sourcemaps upload dist/
  # Secret not set in template repos → masked empty string → CLI error
```

## Correct patterns for each anti-pattern

```yaml
# CORRECT — file-presence gate
- name: Validate email auth
  if: hashFiles('scripts/validate-email-auth.mjs') != ''
  run: node scripts/validate-email-auth.mjs

# CORRECT — gate on migration file that creates the table
- name: Check feature flags table
  if: hashFiles('drizzle/**/feature_flags*') != ''
  run: npx wrangler d1 execute DB --command "SELECT 1 FROM feature_flags LIMIT 1"

# CORRECT — gate on cases directory
- name: Run evals
  if: hashFiles('tools/evals/cases/**') != ''
  run: node tools/evals/runner.mjs

# CORRECT — gate on sentry config presence
- name: Upload to Sentry
  if: |
    hashFiles('sentry.client.config.ts') != '' &&
    env.SENTRY_AUTH_TOKEN != ''
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
  run: npx sentry-cli sourcemaps upload dist/
```

## Named example: email-auth gate

The script itself must also exit 0 with a warning when `DOMAIN` or `RESEND_API_KEY` is absent — two layers of conditional defense.

```yaml
- name: Validate email auth (SPF / DKIM / DMARC)
  if: hashFiles('scripts/validate-email-auth.mjs') != ''
  run: node scripts/validate-email-auth.mjs
  env:
    RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
    DOMAIN: ${{ vars.DOMAIN }}
```

## Named example: eval gate

Zero case files → step skipped → CI green. First case file committed → gate activates automatically on next push. No workflow edits required.

```yaml
- name: Run LLM evals
  if: hashFiles('tools/evals/cases/**/*.json') != ''
  run: |
    node tools/evals/runner.mjs --fail-threshold 0.85
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```
