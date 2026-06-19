# Compliance OS

Source: alirezarezvani/claude-skills compliance tier (18 core + 9 specialized skills)

Compliance is not a one-time audit — it is an operating posture. Each framework below: what it requires, what the current stack already enforces, and what gaps remain.

---

## GDPR (EU General Data Protection Regulation)

**Scope:** Any product with EU users (including residents in the US).

**Core requirements:**

- **Art. 6** — lawful basis for every data collection (consent / contract / legitimate interest)
- **Art. 13/14** — privacy notice at collection point
- **Art. 17** — right to erasure ("delete my account" = 30-day response SLA)
- **Art. 20** — data portability (export in machine-readable format)
- **Art. 30** — record of processing activities (internal doc, not public)
- **Art. 32** — appropriate technical security (encryption at rest + in transit)
- **Art. 33** — 72-hour breach notification to supervisory authority
- **Art. 35** — DPIA required for high-risk processing (AI profiling, health data)

**What CF Workers stack already enforces:**

- TLS 1.3 everywhere (CF edge) — Art. 32 ✓
- D1 encryption at rest — Art. 32 ✓
- Clerk handles auth data in GDPR-compliant infra — Art. 32 ✓
- CSP + Trusted Types limit XSS data exfiltration surface — Art. 32 partial ✓

**Gaps to close:**

- [ ] Art. 17 — implement account deletion endpoint + D1 cascade + R2 object purge
- [ ] Art. 20 — `/api/user/export` → JSON download of all user data
- [ ] Art. 30 — maintain `docs/data-processing-record.md` per product
- [ ] Art. 33 — document breach response runbook; set CF alert for anomalous 5xx spike
- [ ] Cookie consent banner if using analytics cookies (PostHog uses cookieless mode by default — confirm)

**Enforcement:** `/c-suite-personas.md` § GC voice handles DPA drafts.

---

## SOC 2 Type II

**Scope:** Any B2B SaaS storing customer data. Required for mid-market / enterprise sales.

**Trust Service Criteria (TSC) relevant to CF Workers SaaS:**

| CC | Name | What it requires | Stack enforcement |
|---|---|---|---|
| CC1 | Control environment | Documented policies, risk assessment | `rules/autonomous-engineering.md` approval tiers |
| CC6 | Logical access | MFA, least privilege, access review | Clerk MFA + per-route auth guards |
| CC7 | System operations | Monitoring, anomaly detection, incident response | PostHog + Sentry + CF alerts |
| CC8 | Change management | Deployment controls, testing before prod | CI/CD gates + Playwright E2E + feature flags |
| CC9 | Risk mitigation | Vendor risk assessment | `rules/ai-agent-security.md` |
| A1 | Availability | Uptime SLA, backup, recovery | CF 99.99% SLA + D1 Time Travel + R2 versioning |
| C1 | Confidentiality | Encrypt sensitive data | D1 at-rest encryption + R2 SSE + TLS 1.3 |
| PI1 | Privacy | GDPR alignment | See GDPR section above |

**Evidence collection checklist (for auditor):**

- [ ] Access log: Clerk audit trail exported monthly
- [ ] Change log: git conventional commits + PR history (or `wrangler deployments list`)
- [ ] Incident log: Sentry issue history + resolution times
- [ ] Backup test: D1 Time Travel restore test quarterly (document in `ops/backup-tests.md`)
- [ ] Vulnerability scan: `npm audit` + `npx oxlint` + Playwright axe in CI — artifact per run
- [ ] Penetration test: annual (HackerOne self-managed or hired firm)

**Fastest path to SOC 2 Type I (declaration):** 3-6 months. Hire Vanta or Drata for automation if >$500K ARR.

---

## ISO 27001

**Scope:** Enterprise clients in EU, finance, healthcare, government — often required for procurement.

**Key controls (Annex A, relevant subset):**

- A.8.1 — Asset inventory (D1 tables, R2 buckets, KV namespaces, API keys)
- A.9.2 — User access management (Clerk roles + offboarding checklist)
- A.12.1 — Operational procedures documented
- A.12.6 — Vulnerability management (`npm audit` in CI, Dependabot alerts)
- A.14.2 — Security in development (code review gates, SAST)
- A.16.1 — Incident management (Sentry + runbook)
- A.17.1 — Business continuity (D1 Time Travel + R2 versioning + `wrangler rollback`)
- A.18.1 — Legal compliance (GDPR, local data residency)

**Gap vs. SOC 2:** ISO 27001 requires formal ISMS documentation and certification body audit. Skip unless a specific enterprise deal requires it — SOC 2 Type II satisfies most US buyers.

---

## HIPAA (Health Insurance Portability and Accountability Act)

**Scope:** Any product handling PHI (Protected Health Information) — patient data, health records, lab results.

**Core rules:**

- **Privacy Rule** — minimum necessary data collection; patient right to access + amendment
- **Security Rule** — administrative, physical, and technical safeguards for ePHI
- **Breach Notification Rule** — notify affected individuals + HHS within 60 days

**Technical safeguards (Security Rule §164.312):**

- Unique user ID + auto-logoff (Clerk satisfies)
- Encryption at rest + in transit (CF stack satisfies)
- Audit controls — all ePHI access logged (must add D1 audit log per-PHI-table)
- Integrity controls — detect unauthorized alteration (hash + timestamp on PHI records)

**CF Workers considerations:**

- CF has signed BAA — use CF-hosted infra only; no third-party APMs logging PHI payloads
- R2 presigned URLs with short TTL for any file containing PHI
- Never log PHI in Sentry or PostHog event properties — sanitize before capture
- Workers AI: do NOT send PHI to Workers AI unless CF has confirmed HIPAA eligibility for that model

**Brian's current gap:** No product handles PHI. If a client requires it, activate HIPAA mode: add BAA checklist, PHI-tagged D1 columns, audit log middleware, and data residency pin.

---

## ADA Title II (Americans with Disabilities Act)

**Scope:** State/local government programs AND businesses open to the public. Rule effective April 2026 for most entities.

**Technical standard:** WCAG 2.1 AA (DOJ rule) — WCAG 2.2 AA is the stack default (stricter, always satisfies).

**What the stack already enforces:**

- Playwright axe-core in CI at 6 breakpoints — zero violations gate per `rules/e2e-tdd-organization.md`
- `text-wrap: balance/pretty`, fluid type, OKLCH contrast — visual compliance
- Keyboard navigation tested in every E2E spec
- Lighthouse A11y ≥95 hard gate per `01-OS Hard Gates`

**Gaps to close for full ADA Title II compliance:**

- [ ] Published Accessibility Conformance Report (VPAT 2.4) for enterprise sales
- [ ] Feedback mechanism: `accessibility@domain.com` or in-app form (required by DOJ rule)
- [ ] Annual re-audit: schedule `npm run e2e:a11y` + manual keyboard walk + screen reader test (VoiceOver + NVDA)
- [ ] Caption all video content (auto-caption via Workers AI Whisper + human review)

**Enforcement hook:** `rules/e2e-tdd-organization.md` — axe violations = build fail. ADA Title II is already enforced at the test layer; the gap is documentation + feedback channel.
