---
name: "conditional-ci-gates"
priority: 1
pack: "core"
triggers:
  - "ci gate"
  - "github actions"
  - "hashFiles"
  - "validate-manifests"
  - "workflow conditional"
  - "ci failure"
  - "bare template"
  - "skip gate"
paths:
  - ".github/workflows/**"
  - "wrangler.toml"
  - "wrangler.jsonc"
  - "scripts/validate-*.mjs"
  - "scripts/validate-*.ts"
  - "tools/evals/**"
---

# Conditional CI Gates

CI gates must fail OPEN when the project lacks the feature being gated. A gate that fires on a bare template repo is noise that trains engineers to ignore failures.

## The principle

- **Presence check before gate** — every CI step validating an optional feature MUST verify the feature exists before running validation.
- **Absence ≠ failure** — a repo without `scripts/validate-email-auth.mjs` has not violated the email-auth rule; it hasn't implemented that feature yet.
- **Gates travel with features** — when a feature lands, its gate becomes mandatory for that repo. The conditional keeps gate and feature lifecycle aligned.
- **Template repos ship with zero mandatory gates** — the starter template must pass CI on first clone. Every gate must be conditional until the feature is proven present.

## GitHub Actions pattern: `hashFiles` conditional

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

`validate-manifests.yml` demonstrated this correctly: `hashFiles('src/**/manifest.ts') != ''` allows the workflow to run safely across all repo types — app repos execute the validator; bare template repos skip without error.

## Wrangler pattern: content-based presence check

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

## Anti-pattern: hardcoded checks that fail on bare-template repos

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

## Correct patterns for each anti-pattern above

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

## Example: email-auth gate

```yaml
- name: Validate email auth (SPF / DKIM / DMARC)
  if: hashFiles('scripts/validate-email-auth.mjs') != ''
  run: node scripts/validate-email-auth.mjs
  env:
    RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
    DOMAIN: ${{ vars.DOMAIN }}
```

- The script itself must also exit 0 with a warning when `DOMAIN` or `RESEND_API_KEY` is absent — two layers of conditional defense.

## Example: eval gate

```yaml
- name: Run LLM evals
  if: hashFiles('tools/evals/cases/**/*.json') != ''
  run: |
    node tools/evals/runner.mjs --fail-threshold 0.85
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

- Zero case files → step skipped → CI green.
- First case file committed → gate activates automatically on next push. No workflow edits required.

## Gate lifecycle

| Phase | Gate state |
|---|---|
| Template clone | All optional gates skip (no feature files present) |
| Feature implemented | Gate activates automatically via `hashFiles` |
| Feature removed | Gate deactivates automatically — no orphaned mandatory steps |
| Feature mandatory (all repos) | Move condition to always-run; add to bare template |

## Cross-links

- `[[verification-loop]]` — deploy gates that must pass before DONE
- `[[fail-fast-build-fail-soft-prod]]` — build-time failures block deploys; CI is build-time
- `[[drift-detection]]` — orphaned gates (guarding removed features) = drift, fix in-turn
- `[[feature-flags]]` — feature flag CI steps follow the same conditional pattern
