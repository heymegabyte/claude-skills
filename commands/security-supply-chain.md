---
name: security-supply-chain
description: Unified supply-chain audit. Checks GitHub Actions SHA-pinning (`sha-pin:check`), package.json git+https deps (per `no-gitlab-megabytelabs-deps` semgrep), gitleaks scan, and trufflehog verified-only sweep. Surfaces any tag-mutable, git-URL, or secret-exposed surface. Per rules/ai-agent-security.md § Supply chain.
argument-hint: "[project-dir]"
user-invocable: true
---

# /security-supply-chain

One-command supply-chain audit per `rules/ai-agent-security.md` § Supply chain.

## What it checks

1. **GitHub Actions SHA-pinning** — `node ~/.agentskills/scripts/sha-pin-actions.mjs --check .github/workflows/*.yml`
   - Exits 1 if any `uses: owner/repo@vN` tag-ref found.
   - Tags get re-pointed → supply-chain compromise risk (TanStack CVE-2026-45321 class).
2. **`package.json` git+https deps** — grep for `git+https://` patterns in `package.json` and `package-lock.json`.
   - Per `lint-doctrine.md` § Package philosophy: mainstream npm only, no git+https.
3. **Gitleaks (working tree)** — `gitleaks detect --redact --verbose`.
   - Scans for committed secrets.
4. **Trufflehog (verified-only)** — `trufflehog git file://. --only-verified --fail`.
   - Confirms any flagged secrets are real (live API check), kills false positives.

## Invocation

```bash
# Run audit (exits 0 if clean, 1 if any check fails)
bash <(cat <<'AUDIT'
set -eo pipefail
cd "${1:-$PWD}"
echo "▸ 1. GitHub Actions SHA-pinning"
if compgen -G ".github/workflows/*.yml" >/dev/null; then
  node ~/.agentskills/scripts/sha-pin-actions.mjs --check .github/workflows/*.yml
fi
echo "▸ 2. package.json git+https deps"
if [ -f package.json ]; then
  if grep -nE '"git\+https://' package.json package-lock.json 2>/dev/null; then
    echo "  ✗ git+https deps found — see lint-doctrine § Package philosophy"
    exit 1
  fi
  echo "  ✓ no git+https deps"
fi
echo "▸ 3. Gitleaks (working tree)"
if command -v gitleaks >/dev/null; then gitleaks detect --redact --verbose; fi
echo "▸ 4. Trufflehog (--only-verified)"
if command -v trufflehog >/dev/null; then trufflehog git file://. --only-verified --fail; fi
echo "✓ Supply chain audit clean."
AUDIT
)
```

## JSON mode (CI integration)

Pass `--json` to emit a single uniform envelope per `rules/uniform-json-output.md`:

```bash
# Full envelope
bash ~/.agentskills/bin/security-supply-chain.sh . --json

# Pretty-print
bash ~/.agentskills/bin/security-supply-chain.sh . --json | jq

# Just the summary line
bash ~/.agentskills/bin/security-supply-chain.sh . --json | jq -r '"pass:\(.summary.pass) fail:\(.summary.fail) skip:\(.summary.skip)"'

# Fail-only filter — list failing checks with details
bash ~/.agentskills/bin/security-supply-chain.sh . --json | jq '.checks[] | select(.status=="fail")'

# CI gate — exit non-zero if any check failed
bash ~/.agentskills/bin/security-supply-chain.sh . --json | jq -e '.summary.fail == 0' >/dev/null
```

Envelope shape: `{meta:{skills_root,project,timestamp,generated_at,git_sha}, checks:[{name,status,details}], summary:{pass,fail,skip,exit}}`. Human-readable report still prints to stderr in JSON mode, so `2>/dev/null` silences it while keeping the JSON on stdout.

## After clean exit

The agentskills-distributed pre-push lefthook gate (`sha-pin-check` step) runs `--check` mode automatically on every push. This slash command is for on-demand audits + when adding new dependencies.

## After a failure

- **Tag-ref found** → `npm run sha-pin` (resolves SHAs automatically).
- **git+https dep found** → replace with mainstream npm equivalent per `lint-doctrine.md` table.
- **Gitleaks hit** → remove secret + rotate exposed key. Per `secret-provisioning.md` use chezmoi + get-secret.
- **Trufflehog hit** → same; trufflehog verifies the secret is live so rotate immediately.

## See

- `rules/ai-agent-security.md` § Supply chain
- `rules/lint-doctrine.md` § Package philosophy
- `scripts/sha-pin-actions.mjs` (3 modes: default/--check/--bump)
- `templates/lint-stack/lefthook.yml` § pre-push § sha-pin-check
- `rules/secret-provisioning.md` + `rules/secret-auto-provisioning.md`
