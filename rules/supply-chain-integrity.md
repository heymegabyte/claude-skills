---
name: "supply-chain-integrity"
priority: 1
pack: "core"
triggers:
  - "npm install"
  - "pnpm install"
  - "yarn install"
  - "package.json"
  - "lockfile"
  - "dependency"
  - "npm audit"
  - "snyk"
  - "socket"
  - "sbom"
  - "supply chain"
  - "malicious package"
  - "compromised"
  - "postinstall"
  - "lifecycle script"
paths:
  - "package.json"
  - "package-lock.json"
  - "pnpm-lock.yaml"
  - "yarn.lock"
  - ".github/workflows/**"
  - "scripts/**"
---

# Supply-Chain Integrity

npm packages are routinely compromised. In 2024-2026, high-profile incidents included
`event-stream` (malicious code injected via maintainer transfer), `ua-parser-js` (hijacked
to install a cryptominer), `node-ipc` (supply-chain protest code), and `polyfill.io` CDN
compromise affecting 100k+ sites. The attack surface is every transitive dependency you
install. This rule makes supply-chain hygiene automatic.

## Install policy: scripts off by default

Never run `npm install` without `--ignore-scripts` unless you have audited the `postinstall`
chain. Lifecycle scripts (`preinstall`, `postinstall`, `prepare`) execute arbitrary code
with the privileges of your shell.

```bash
# CORRECT — scripts disabled by default
npm install --ignore-scripts

# If a package genuinely needs scripts (native bindings, etc.):
# 1. Audit what the script does FIRST
# 2. Run with --foreground-scripts to see output
npm install --foreground-scripts <specific-package>

# Add to .npmrc to enforce project-wide
echo "ignore-scripts=true" >> .npmrc
```

Re-enable scripts only for packages that explicitly need them (e.g., `esbuild`, `sharp`
for native bindings). Document the exception in `.npmrc` inline comment.

## Lockfile integrity

Lockfiles are the ground truth for reproducibility. A tampered lockfile = supply-chain attack.

```bash
# Verify lockfile integrity on CI (fail if lockfile was modified)
npm ci --ignore-scripts  # npm ci fails if lockfile is out of sync with package.json

# For pnpm
pnpm install --frozen-lockfile --ignore-scripts

# For yarn berry
yarn install --immutable --ignore-scripts
```

Commit `package-lock.json` (or `pnpm-lock.yaml`). Never `.gitignore` a lockfile. The
lockfile is a security artifact — losing it loses reproducibility.

## Commit signing

Every commit to main must be signed. Unsigned commits can be forged by anyone with push
access (e.g., a compromised CI token).

```bash
# Enable signed commits globally
git config --global commit.gpgsign true
git config --global user.signingkey <YOUR_GPG_KEY_ID>

# Or use SSH signing (simpler for 1Password SSH agent users)
git config --global gpg.format ssh
git config --global user.signingkey "key::ssh-ed25519 AAAA..."
git config --global gpg.ssh.allowedSignersFile ~/.ssh/allowed_signers
```

Verify in CI:

```yaml
# .github/workflows/verify-commits.yml
- name: Verify commit signatures
  run: |
    git log --show-signature -1 | grep -E "(gpg|Good signature|using RSA|using ED25519)" \
      || (echo "ERROR: unsigned commit" && exit 1)
```

## SBOM generation

Every release generates a Software Bill of Materials (CycloneDX format) from the lockfile.
This is the audit trail for "what exactly shipped in this deploy."

```bash
# Generate CycloneDX SBOM from package-lock.json
npx @cyclonedx/cyclonedx-npm --output-file sbom.json --output-format JSON

# Or via cyclonedx-cli
cyclonedx-npm --package-lock-only --output-format JSON > sbom.json
```

Store the SBOM in R2 alongside the deploy artifact:

```typescript
// scripts/upload-sbom.mjs
import { execSync } from 'node:child_process';

const version = process.env.DEPLOY_VERSION ?? Date.now().toString();
execSync('npx @cyclonedx/cyclonedx-npm --output-file /tmp/sbom.json');

const sbom = await Bun.file('/tmp/sbom.json').text();
const r2Key = `sboms/${version}/sbom.cyclonedx.json`;

// Upload via wrangler r2 object put or via CF API
execSync(`wrangler r2 object put sboms/${r2Key} --file /tmp/sbom.json`);
console.log(`SBOM uploaded to R2: ${r2Key}`);
```

## Socket CLI / Snyk scanning in CI

```yaml
# .github/workflows/supply-chain.yml
name: Supply Chain Integrity

on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: npm audit (blocks on moderate+)
        run: npm audit --audit-level=moderate --ignore-scripts

      - name: Socket CLI deep scan
        uses: nicolo-ribaudo/socket-npm-action@v1
        # or run manually:
        # npx @socket.dev/cli@latest npm-audit --strict

      - name: Generate SBOM
        run: npx @cyclonedx/cyclonedx-npm --output-file sbom.json

      - name: Upload SBOM artifact
        uses: actions/upload-artifact@v4
        with:
          name: sbom
          path: sbom.json
```

Socket CLI catches things `npm audit` misses: malicious install scripts, protestware,
typosquatting, dependency confusion attacks, and obfuscated code. It maintains a reputation
database of package behavior.

## npm audit gate in PR

`npm audit` severity thresholds:

| Severity | Policy |
|---|---|
| critical | Blocks PR merge immediately |
| high | Blocks PR merge — fix or pin below-vulnerable version |
| moderate | Blocks PR merge — 7-day grace period with tracked issue |
| low | Warning only — tracked in dependency audit backlog |

```bash
# CI command — exits non-zero on moderate+
npm audit --audit-level=moderate --ignore-scripts

# Override for a specific advisory when no fix exists (document reason):
npm audit --audit-level=moderate --ignore-scripts \
  || true  # NEVER use true silently — investigate first
```

If a vulnerability has no fix, pin to the last clean version and open a tracked issue.
Do not suppress with `--audit-level=none`.

## Publishing policy

Only Brian's npm account publishes. 2FA required on the account. No automation token
publishes critical packages without a human 2FA approval step.

```bash
# Verify 2FA is enforced
npm profile get 2fa  # should return: auth-and-writes

# Explicitly log in before publish — never rely on cached token in CI
npm login --auth-type=legacy  # CI: use NPM_TOKEN env var + OTP via 1Password automation
```

Never publish packages with `files: []` omitted in `package.json` — this accidentally
publishes `.env`, `secrets/`, and build artifacts. Always allowlist explicitly:

```json
{
  "files": ["dist/", "src/", "README.md", "LICENSE"],
  "publishConfig": { "access": "public" }
}
```

## Anti-patterns

- `npm install` without `--ignore-scripts` — one malicious `postinstall` = full shell access
- Committing `node_modules/` — makes lockfile irrelevant; all supply-chain scanning skips it
- Suppressing `npm audit` with `--audit-level=none` — silent vulnerabilities ship to prod
- Using `latest` tag in `package.json` — unpinned; a compromised release auto-deploys
- Sharing a single npm automation token across all projects — one compromised project = all projects
- No SBOM = no audit trail = no forensics when an incident occurs

## Cross-links

- `[[lint-doctrine]]` — `npm audit` gate is part of the lint + CI gate stack
- `[[secret-provisioning]]` — npm token is a secret; rotation cadence applies
- `[[ci-cd-pipeline]]` — SBOM upload and audit gate belong in CI, not local dev
- `[[autonomous-engineering]]` — new dependency additions are `review-recommended` tier; this rule explains why
- `[[drift-detection]]` — an outdated lockfile with known-vulnerable packages is drift, fixed in-turn
