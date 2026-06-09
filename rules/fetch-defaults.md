---
name: "fetch-defaults"
priority: 3
pack: "research"
triggers:
  - "scrape"
  - "web fetch"
  - "curl"
  - "user agent"
paths:
  - "*"
---

# Fetch Defaults

## Mandate

- Raw fetch/curl/WebFetch/Node fetch/Bun fetch/Python requests = realistic browser UA mandatory
- Default UA strings get blocked by Cloudflare Bot Management, CF Protect, AWS WAF, Akamai, Imperva, PerimeterX
- Skipping UA = 403/blocked/empty body, then retry storm

## Canonical UA (rotate quarterly, mirror current Chrome stable)

- Desktop: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36`
- iOS (for mobile-only sites): `Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1`
- Verified Chrome stable via `https://chromiumdash.appspot.com/fetch_releases?channel=Stable` (2026-06-08 → 149.0.7827.55)
- **Implementation lives at `15-site-generation/_real-ua.mjs`** (exports `REAL_UA_DESKTOP`, `REAL_UA_IOS`, `REAL_HEADERS`). Every site-generation script imports from there — no inline hardcoded UAs. Update both the rule's UA line AND the constant in one commit.
- **Drift gate**: `.github/workflows/version-drift-check.yml` (weekly Mondays 09:17 UTC) auto-opens a deduped issue when Chrome stable drifts ≥5 majors from the pinned constant.

## Companion headers (always pair with UA)

- `Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8`
- `Accept-Language: en-US,en;q=0.9`
- `Accept-Encoding: gzip, deflate, br`
- `Sec-Fetch-Site: none`
- `Sec-Fetch-Mode: navigate`
- `Sec-Fetch-User: ?1`
- `Sec-Fetch-Dest: document`
- `Upgrade-Insecure-Requests: 1`
- Missing `Sec-Fetch-*` triggers CF challenge

## Custom UAs ALWAYS-rejected

- `curl/*`
- `python-requests/*`
- `node-fetch/*`
- `Bun/*`
- `Go-http-client/*`
- `Java/*`
- `axios/*`
- `wget/*`
- Bot-named (`SiteMigration/1.0`, `MyBot/1.0`)
- Even "compatible;" suffix doesn't save you — CF Bot Management fingerprints the entire request signature (TLS, header order, JA3)

## Code patterns

- bash: `curl -A "$REAL_UA" -H "Accept-Language: en-US,en;q=0.9" ...`
- Node: `fetch(url, { headers: { 'User-Agent': REAL_UA, ... } })`
- Python: `requests.get(url, headers={"User-Agent": REAL_UA, ...})`
- Bun: same as Node
- Export `REAL_UA` env var in `~/.zshrc` or scripts so every place uses one source
- Skill 15 `squarespace-full-crawl.mjs` and any new scraper MUST use `REAL_UA` — `SiteMigration/1.0` strings get blocked

## Escalation when CF Protect still blocks (Turnstile/JS challenge)

1. Playwright headless with `playwright.devices['Desktop Chrome']` (real browser fingerprint)
2. Chrome MCP (real Chrome instance)
3. Firecrawl (residential proxy + headless)
4. Bright Data/ScraperAPI for hard targets

- Never bypass via spoofed Cloudflare-internal headers (`CF-Connecting-IP`, `CF-IPCountry`) — that's evasion, not legitimate access

## Ethics

- Respect `robots.txt`, `crawl-delay`, rate limits
- Realistic UA serves legitimate access (research, monitoring, our own sites that block default UAs by mistake), not abuse
- If a site explicitly blocks all bots, find another source

## Never

- Send default tool UA to public sites
- Rotate UA per request to evade rate limits
- Impersonate Googlebot/Bingbot (fraud risk, blocked by reverse-DNS check)
- Spoof `X-Forwarded-For` to bypass geofence
