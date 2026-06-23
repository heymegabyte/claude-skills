---
name: "supply-chain-integrity"
priority: 2
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

npm packages are routinely compromised (`event-stream`, `ua-parser-js`, `node-ipc`, `polyfill.io` CDN — all 2024–2026). Every transitive dependency is attack surface.

## Install policy: scripts off by default

- Always pass `--ignore-scripts` to `npm install` unless you have audited the `postinstall` chain first.
- Re-enable scripts only for packages that explicitly need them (e.g., `esbuild`, `sharp`).
- Document every exception in `.npmrc` with an inline comment; add `ignore-scripts=true` to `.npmrc` to enforce project-wide.

See `reference/supply-chain-integrity.md` for the full implementation.

## Lockfile integrity

- Commit `package-lock.json` (or `pnpm-lock.yaml`). Never `.gitignore` a lockfile.
- CI MUST use `npm ci --ignore-scripts` (or `--frozen-lockfile` / `--immutable` for pnpm/yarn) — these fail when the lockfile is out of sync with `package.json`.

See `reference/supply-chain-integrity.md` for the full implementation.

## Commit signing

- Every commit to main must be signed. Unsigned commits can be forged by anyone with push access.
- Enable globally via `git config --global commit.gpgsign true` (GPG) or `gpg.format ssh` (SSH / 1Password).
- CI must verify the signature with `git log --show-signature` and exit 1 on failure.

See `reference/supply-chain-integrity.md` for the full implementation.

## SBOM generation

- Every release generates a CycloneDX SBOM from the lockfile — the audit trail for "what exactly shipped."
- Use `npx @cyclonedx/cyclonedx-npm --output-file sbom.json`.
- Store the SBOM in R2 alongside the deploy artifact via `wrangler r2 object put`.

See `reference/supply-chain-integrity.md` for the full implementation.

## Socket CLI / Snyk scanning in CI

- Run `npm audit --audit-level=moderate --ignore-scripts` + Socket CLI on every push and PR.
- Socket CLI catches what `npm audit` misses: malicious install scripts, protestware, typosquatting, dependency confusion attacks, obfuscated code.
- Generate and upload the SBOM as a CI artifact on every run.

See `reference/supply-chain-integrity.md` for the full CI workflow.

## npm audit gate in PR

| Severity | Policy |
|---|---|
| critical | Blocks PR merge immediately |
| high | Blocks PR merge — fix or pin below-vulnerable version |
| moderate | Blocks PR merge — 7-day grace period with tracked issue |
| low | Warning only — tracked in dependency audit backlog |

- If a vulnerability has no fix, pin to the last clean version and open a tracked issue. Never suppress with `--audit-level=none`.

## Publishing policy

- Only Brian's npm account publishes. 2FA required (`auth-and-writes`).
- No automation token publishes critical packages without a human 2FA approval step.
- Always allowlist `files` in `package.json` — omitting it accidentally publishes `.env`, `secrets/`, and build artifacts.

See `reference/supply-chain-integrity.md` for the full implementation.

## Anti-patterns

- `npm install` without `--ignore-scripts` — one malicious `postinstall` = full shell access.
- Committing `node_modules/` — makes lockfile irrelevant; all supply-chain scanning skips it.
- Suppressing `npm audit` with `--audit-level=none` — silent vulnerabilities ship to prod.
- Using `latest` tag in `package.json` — a compromised release auto-deploys.
- Sharing a single npm automation token across all projects — one breach = all projects.
- No SBOM = no audit trail = no forensics when an incident occurs.

## Cross-links

- `[[lint-doctrine]]` — `npm audit` gate is part of the lint + CI gate stack
- `[[secret-provisioning]]` — npm token is a secret; rotation cadence applies
- `[[ci-cd-pipeline]]` — SBOM upload and audit gate belong in CI, not local dev
- `[[autonomous-engineering]]` — new dependency additions are `review-recommended` tier
- `[[drift-detection]]` — outdated lockfile with known-vulnerable packages = drift, fixed in-turn
