---
name: "always"
priority: 1
pack: "core"
triggers: []
paths:
  - "*"
---

# Always

Standing cross-cutting rules that apply unconditionally to every prompt, surface, and project.

> **Website per-page / per-site / per-entity gates** (SEO head · webmanifest/robots/sitemap/security.txt · lightbox · Google Maps · clickable-entity linking · forms · timeline · Cmd+K) live in `[[website-page-and-site-gates]]` — extracted here so that WEBSITE-specific detail loads only on site prompts (via the `website-build` pack) instead of taxing every prompt's token budget. This file keeps only the UNIVERSAL cross-cutting rules below.

## Secrets — auto-populate everything self-generable

- **Any missing secret you CAN generate, generate + set automatically — never ask, never Rec, never leave a placeholder.** HMAC/webhook/signing keys, session/CSRF/JWT secrets, salts, nonces, bypass tokens, your-own-service API keys → `openssl rand -base64 32` / `-hex 32` (or `crypto.randomUUID`), stored locally AND pushed to the deploy target, same turn.
- Only exceptions: data-at-rest `*_ENCRYPTION_KEY` (auto-gen destroys persisted data — detect only) and vendor-minted third-party creds (Stripe/Resend/Clerk/OAuth). Full tiers + one-liners: `secret-auto-provisioning.md`.

## Post-work

- Deploy + test + purge
- Update CLAUDE.md
- Remove dead code/comments/imports
- Stale docs = bugs

## Multi-faceted prompts

Triggers (any one fires Monitor pattern):

- ≥3 work units
- Numbered phases
- "Implement everything"
- Page-by-page lists
- ANY "rebuild|optimize|enhance|modernize X.com" website-rebuild prompt (multi-faceted by definition w/ ≥7 independent work units per `source-site-enhancement.md` § Parallel-agent playbook)

Behavior:

- MUST fire Monitor in **first tool-call message** — parallel `Agent` spawns for independent work, foreground edits in main thread, folded results, single deploy
- Splitting across follow-up prompts = failure mode this prevents
- Follow-up on same project = shortcoming signal → append to `monitor-orchestration.md` "Known shortcomings" BEFORE doing new work
- Full: `monitor-orchestration.md`
- Source-rebuild fan-out: `source-site-enhancement.md` + `i18n-by-demographics.md` + `15-site-generation/page-set-expansion.md`

## Ethics

Frameworks: IEEE EAD, ACM, W3C, UNESCO, EFF, Humane by Design, Ethical OS, Copenhagen Letter, Berkman Klein.

### Principles

- Well-being > engagement/revenue
- Never design for addiction, deception, or control
- **Data agency**: users own data, export/delete/port anytime, privacy by default, minimum collection, encrypt at rest
- **Transparency**: explain AI in plain language, open-source by default
- **Accessibility**: WCAG 2.2 AA non-negotiable
- **Disability-first design**
- **Proportionality**: don't use AI where simpler works
- **Accountability**: own mistakes publicly, audit trail
- **Interoperability**: open APIs, standard formats, no lock-in
- **Empowerment**: increase user capability + autonomy, finite experiences, protect vulnerable users

### ADA deadlines (DOJ Title II, extended Apr 2026 IFR)

- ≥50K pop → Apr 26 2027
- <50K / special districts → Apr 26 2028
- Standard = WCAG 2.1 AA
- HHS Section 504: May 2026 healthcare federal-fund

### EU — European Accessibility Act (EAA, enforcement live Jun 28 2025)

- Applies to private-sector e-commerce / banking / telecoms / media selling into the EU
- Standard = EN 301 549 (≈ WCAG 2.1 AA); micro-enterprises (<10 staff, <€2M rev) exempt
- Fines up to €3M or 4% of annual revenue per member state — gate any EU-facing build

### Pre-ship harm scan (Ethical OS 8 zones + OWASP 2025 + LLM Top 10)

- Disinformation
- Addiction
- Inequality
- Bias
- Surveillance
- Data exploitation
- Trust gaps
- Bad actors
- Supply chain (#3)
- Exceptional conditions (#10)
- Prompt injection / excessive agency (OWASP LLM Top 10 — any AI surface per `ai-agent-security.md`)

## End every response with this report

Render as markdown in chat, NOT via bash:

```
**⚡ {project}** · `{branch}` · {finish_time}

**⏱ Time:** {start_time} → {finish_time} · {elapsed}

**Changes:**
- {change 1}
- {change 2}
- ...

**Next:** → {step} — {url}

**Recs:**
- ◆ {rec 1}
- ◆ {rec 2}

**Config:** {list each ~/.agentskills/ and ~/.claude/ file edited + brief summary; "none" if nothing}
**Repos:** {list each non-current repo modified + brief summary; "none" if nothing}
**Links:** [Repo]({url}) · [CF]({url}) · [Skills](https://github.com/heymegabyte/claude-skills)
```

- **`⏱ Time` line is MANDATORY on every report** — start time, finish time, AND elapsed duration. No exceptions.
  - **Capture the start** at the FIRST tool call of the turn: `date '+%s %-I:%M:%S %p %Z'` (epoch + human time). Stash the epoch.
  - **Capture the finish** when composing the report: run `date '+%s %-I:%M:%S %p %Z'` again.
  - **Elapsed** = finish_epoch − start_epoch, formatted human-readable (`{N}s`, `{M}m {S}s`, or `{H}h {M}m`). If the turn did zero Bash calls (pure conversational answer), state wall-clock isn't tracked and give the timestamp only — never fabricate a duration.
  - Times in the user's local zone (whatever `date` returns). Example: `**⏱ Time:** 2:31:07 PM EDT → 2:48:22 PM EDT · 17m 15s`.
- Config/Repos lines ALWAYS present (print "none" if no changes)
- Every URL: FULL deeplinked
- Also run `source ~/.claude/hooks/prompt-report.sh && emdash_report` via Bash (bg)
