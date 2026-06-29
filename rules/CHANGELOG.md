---
name: "CHANGELOG"
last_reviewed: 2026-06-29
superseded_by: null
---

# Rules Changelog — auto-maintained by the router-reconcile hook.

## 2026-06-29

- **20-superpowers** — feat(20-superpowers): pass 4 — reference code + eval seeds + human-voice cross-link
- **20-superpowers** — feat(20-superpowers): absorb while compressing — pass 2+3

## 2026-06-28

- **20-superpowers** — feat(20-superpowers): vendor obra/Superpowers into owned layer (MIT)

## 2026-06-27

- **secret-provisioning** — fix(rules): secret-provisioning — check get-secret BEFORE automating credential/app creation
- **agpl-isolation-via-http-boundary** — feat(rules): agpl-isolation-via-http-boundary (from projectsites Postiz)
- **tts-piper** — feat(rules): TTS = Piper (self-hosted, open-source), not ElevenLabs
- **secret-provisioning** — feat(rules): secret-provisioning § Persist EVERY new secret to get-secret (write side)
- **secret-provisioning** — fix(rules): secret-provisioning — add deployed-platform secrets (wrangler secret list) as a source to exhaust before 'missing'
- **feature-flags** — feat(feature-flags): mandate Cloudflare Flagship as THE feature-flag service
- **secret-provisioning** — fix(rules): secret-provisioning — get-secret TOOL is the authoritative presence check, never ls/grep of the chezmoi dir
- **secret-provisioning** — feat(rules): secret-provisioning § source-exhaustion order — exhaust get-secret + Emdash projects + self-derive BEFORE asking the human

## 2026-06-26

- **loop-driven-development** — feat(rules): loops MUST terminate — no infinite polish

## 2026-06-25

- **docker-slim-all-containers, neon-database-conservation** — docs(rules): Hadolint-before-build + neon-database-conservation

## 2026-06-24

- **loop-driven-development** — loop-driven-development: capture branch-divergence + blocked-loop anti-patterns
- **reference-conventions** — docs(reference): sub-agent absolute-path resolution + relax ratchet 67.5K→68K
- **flyio-voice-gateway** — feat(rules): voice gateway = canonical Fly.io escape-hatch (call-gpt fork, ADR-0011)
- **drift-detection** — drift-detection: add indexable-route ↔ page-meta guard (merged with SPA-route guard)
- **search-policy** — feat(rules): split search policy — Orama=generated child-sites, CF AI Search=admin/platform
- **projectsites-recommended-stack** — feat(rules): ProjectSites.dev selected-package policy (scoped rule)
- **package-preference-registry** — docs(deps): adopt zod-to-openapi + hono-openapi + effect — registry + rule cross-links
- **drift-detection** — drift-detection: add SPA-route ↔ known-route-manifest build guard
- **build-validators-manifest** — feat(gate): add reference-pointer integrity gate (24) for the dynamic-sourcing arc

## 2026-06-23

- **instruction-compression-playbook** — perf(context): final code extractions + conservative website-pack prose (arc fire 6)
- **instruction-compression-playbook** — perf(context): extract impl code from 12 more rules to reference/ (arc fire 5)
- **instruction-compression-playbook** — perf(context): extract impl code from 9 more rules to reference/ (arc fire 4)
- **instruction-compression-playbook** — perf(context): dynamic-sourcing — extract impl code to router-invisible reference/ (arc fire 3)
- **instruction-compression-playbook** — perf(context): compress 16 more always-loaded rules (arc fire 2)
- **instruction-compression-playbook** — perf(context): compress always-loaded rules + cap every-prompt budget (arc fire 1)
- **website-build-manifest** — feat(website): add validate-no-fabricated-people validator row

## 2026-06-21

- **website-build-doctrine** — feat(website): close the per-route OG-image generation HOW-gap
