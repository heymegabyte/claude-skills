# Skill Packs

Hierarchical groupings. When a prompt or fingerprint matches a pack name, the
router loads all members deterministically.

## Convention

- One YAML per pack
- `name` matches filename (sans `.yml`)
- `description` one-liner
- `members` list of skill IDs (`<skill-folder>` or `rules/<rule-name>`)

## Pack list

- **core** — Tier-1 essentials, always loaded (~12k tokens)
- **frontend** — React/Angular frontend
- **angular** — Angular-specific (Nx, Spartan, RxJS)
- **backend** — CF Workers + Hono + D1
- **testing** — Playwright + Vitest + AI vision
- **design** — Visual + motion + WCAG
- **ai** — Contract-first AI + evals + agents
- **content** — Copy + brand + citations
- **media** — Image/video/audio gen
- **research** — Web research + competitor scan
- **payments** — Stripe + Square
- **ecommerce** — Medusa.js
- **polish** — 100-ideas audit + supreme polish
- **infra** — Secrets + deploy
- **website-build** — One-line site build doctrine

## How packs are resolved

`~/.claude/bin/skill-router.py` reads each YAML, expands `members` into the
selected skill set when:

1. Prompt mentions pack name (`"angular project"` → angular pack)
2. Fingerprint signals it (`stack:angular-nx` → angular pack via skill `paths`)
3. Trigger phrase matches a member (transitively pulls pack)
