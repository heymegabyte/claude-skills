---
last_reviewed: 2026-09-20
superseded_by: null
name: "browser-automation-routing"
priority: 2
pack: "infra"
triggers:
  - "browser automation"
  - "stagehand"
  - "browser rendering"
  - "scrape"
  - "browser interaction"
  - "playwright"
paths:
  - "**/e2e/**"
  - "**/*.spec.ts"
  - "src/**/*browser*"
---

# Browser Automation Routing

Standing preference for EVERY agent-driven browser task — navigate, click, fill, extract, screenshot, scrape, or verify a deployed page. Default to a **Cloudflare Browser Rendering** instance driven by **Stagehand**; fall back to the **user's own Chrome** when cookies / a logged-in session must persist. Brian directive 2026-09-20.

Cross-links: `[[computer-use-safety]]` `[[fetch-defaults]]` `[[crawling-testing-browser-supervisor]]` `[[stagehand-ai-testing]]` `[[cloudflare-lock-in-is-leverage]]` `[[god-tier-engineering]]`

## The routing chain (in order)

1. **DEFAULT — Cloudflare Browser Rendering + Stagehand.** Launch a headless browser on CF Browser Rendering (Workers Browser binding + `@cloudflare/playwright`, or the REST API for one-shots) and drive it with Stagehand's AI `act`/`observe`/`extract`/`agent` on the a11y tree. CF-native (per `cloudflare-lock-in-is-leverage`), zero local resource cost, reproducible. Point Stagehand at the CF session's CDP endpoint instead of spinning a Browserbase-managed session whenever CF Browser is available.
2. **FALLBACK — the user's provided/local Chrome instance.** Drive the real local Chrome (the user's profile) via Chrome DevTools MCP (`mcp__chrome-devtools__*`) or Playwright `connectOverCDP` to a `--remote-debugging-port` Chrome. Use when **cookies / an existing logged-in session / the user's real profile must persist**, when CF Browser + Stagehand is unavailable, or when a human is mid-flow and state must carry across steps.

## When each is right (routing is by state, not just availability)

- **Cookies / auth / logged-in state REQUIRED** (SSO dashboards, a session the user already opened) → go STRAIGHT to the **user's Chrome**. A fresh cloud browser has no cookies — here the "fallback" is the correct FIRST choice.
- **Stateless automation** (public pages, scraping, post-deploy verification, screenshots, extraction) → **CF Browser + Stagehand** default.
- **Bot-detected / Cloudflare-challenged target** → Stagehand-managed session (a11y-tree `act` evades brittle selectors) per `crawling-testing-browser-supervisor`; escalate proxies per `fetch-defaults` § Escalation only if still blocked.

## Tool mapping

- **CF Browser Rendering** — Workers Browser binding (`env.BROWSER`) + `@cloudflare/playwright` `launch()/connect()`; REST `/accounts/{id}/browser-rendering/{screenshot,content,snapshot,scrape,pdf,links,json}` for one-shots (per `god-tier-engineering` #9: REST > binding for single ops).
- **Stagehand** — `mcp__stagehand__*` (`browserbase_stagehand_act/observe/extract/navigate/agent`); the REQUIRED interface for AI interaction — never drive a managed/cloud session with raw CDP clicks.
- **User Chrome** — `mcp__chrome-devtools__*` (attaches to the running Chrome) OR Playwright `connectOverCDP('http://localhost:9222')`. The ONLY tier where the user's cookies persist.
- **Playwright MCP (`mcp__playwright__*`)** — its own bundled Chromium; acceptable for a quick stateless check, but NOT the default here (no CF-native benefit, no cookie persistence). Prefer CF Browser for cloud, user Chrome for stateful.

## Guardrails (unchanged)

- Session-bound / auth / payment flows still require explicit user confirmation per `computer-use-safety`.
- Never submit real payment cards from an agent-driven session — test cards live in the E2E suite only.
- Playwright TEST SUITES (`e2e-tdd-organization`, `verification-loop`) keep their own runner + PROD target; this rule governs AGENT-DRIVEN interaction. Those suites MAY use CF Browser Rendering as the launch backend.

## Anti-patterns

- Defaulting to Playwright-MCP's throwaway Chromium for a task that needs the user's logged-in cookies → use the user's Chrome.
- Spinning a Browserbase-managed session when a CF Browser Rendering instance is available → prefer CF-native.
- Driving a cloud/managed browser with raw CDP clicks instead of Stagehand's a11y-tree `act` → brittle; use Stagehand.
