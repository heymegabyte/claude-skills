# Supply-Chain Integrity — Implementation Reference

Sourced on demand by rules/supply-chain-integrity.md.

---

## Install scripts: disable lifecycle scripts

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

---

## Lockfile enforcement commands

```bash
# Verify lockfile integrity on CI (fail if lockfile was modified)
npm ci --ignore-scripts  # npm ci fails if lockfile is out of sync with package.json

# For pnpm
pnpm install --frozen-lockfile --ignore-scripts

# For yarn berry
yarn install --immutable --ignore-scripts
```

---

## Commit signing setup

```bash
# Enable signed commits globally (GPG)
git config --global commit.gpgsign true
git config --global user.signingkey <YOUR_GPG_KEY_ID>

# Or use SSH signing (simpler for 1Password SSH agent users)
git config --global gpg.format ssh
git config --global user.signingkey "key::ssh-ed25519 AAAA..."
git config --global gpg.ssh.allowedSignersFile ~/.ssh/allowed_signers
```

CI verification step:

```yaml
# .github/workflows/verify-commits.yml
- name: Verify commit signatures
  run: |
    git log --show-signature -1 | grep -E "(gpg|Good signature|using RSA|using ED25519)" \
      || (echo "ERROR: unsigned commit" && exit 1)
```

---

## SBOM generation and R2 upload

```bash
# Generate CycloneDX SBOM from package-lock.json
npx @cyclonedx/cyclonedx-npm --output-file sbom.json --output-format JSON

# Or via cyclonedx-cli
cyclonedx-npm --package-lock-only --output-format JSON > sbom.json
```

Upload script (`scripts/upload-sbom.mjs`):

```typescript
import { execSync } from 'node:child_process';

const version = process.env.DEPLOY_VERSION ?? Date.now().toString();
execSync('npx @cyclonedx/cyclonedx-npm --output-file /tmp/sbom.json');

const sbom = await Bun.file('/tmp/sbom.json').text();
const r2Key = `sboms/${version}/sbom.cyclonedx.json`;

execSync(`wrangler r2 object put sboms/${r2Key} --file /tmp/sbom.json`);
console.log(`SBOM uploaded to R2: ${r2Key}`);
```

---

## Full CI workflow: supply-chain audit

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

---

## npm audit override discipline

```bash
# CI command — exits non-zero on moderate+
npm audit --audit-level=moderate --ignore-scripts

# Override for a specific advisory when no fix exists (document reason):
npm audit --audit-level=moderate --ignore-scripts \
  || true  # NEVER use true silently — investigate first
```

---

## Publishing config

```bash
# Verify 2FA is enforced
npm profile get 2fa  # should return: auth-and-writes

# Explicitly log in before publish — never rely on cached token in CI
npm login --auth-type=legacy  # CI: use NPM_TOKEN env var + OTP via 1Password automation
```

`package.json` files allowlist (required):

```json
{
  "files": ["dist/", "src/", "README.md", "LICENSE"],
  "publishConfig": { "access": "public" }
}
```
