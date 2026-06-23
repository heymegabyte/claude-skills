---
name: "conditional-ci-gates"
priority: 2
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
- **Absence is not failure** — a repo without `scripts/validate-email-auth.mjs` has not violated the email-auth rule; it hasn't implemented that feature yet.
- **Gates travel with features** — when a feature lands, its gate becomes mandatory for that repo. The conditional keeps gate and feature lifecycle aligned.
- **Template repos ship with zero mandatory gates** — the starter template must pass CI on first clone. Every gate must be conditional until the feature is proven present.

## GitHub Actions pattern: `hashFiles` conditional

- Use `if: hashFiles('glob') != ''` to gate a step on feature presence — `hashFiles` returns an empty string when no files match.
- No external scripts, no env flags required.
- `validate-manifests.yml` demonstrated this correctly: `hashFiles('src/**/manifest.ts') != ''` allows the workflow to run safely across all repo types — app repos execute the validator; bare template repos skip without error.

## Wrangler pattern: content-based presence check

- `hashFiles` returns a hash string, not file contents — use a `grep` step for content-based gating of Cloudflare-specific features (e.g., `[observability]` in `wrangler.toml`).
- Emit a named output (`echo "enabled=true" >> $GITHUB_OUTPUT`) and gate the next step on `steps.<id>.outputs.<name> == 'true'`.

## Eval gate behavior

- Zero case files → step skipped → CI green.
- First case file committed → gate activates automatically on next push. No workflow edits required.
- Scripts used in gated steps must also exit 0 with a warning when required secrets are absent — two layers of conditional defense.

See `reference/conditional-ci-gates.md` for all YAML patterns: `hashFiles` gates, wrangler grep steps, anti-patterns, correct alternatives, and named email-auth / eval gate examples.

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
