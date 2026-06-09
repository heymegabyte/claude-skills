---
name: "i18n-by-demographics"
priority: 3
pack: "website-build"
triggers:
  - "spanish"
  - "portuguese"
  - "i18n"
  - "translate"
  - "locale"
paths:
  - "org:website_build"
---

# i18n by Community Demographics

## Rule

- Auto-fires ONLY when ALL FOUR conditions are met:
  1. Org has a defined **local physical service area** (not national, not online-only)
  2. Service area demographic shows ≥10% community share for the additional language
  3. Org type is in: `local-business`, `nonprofit`, `church`, `government`, `healthcare`, `legal`, `edu` (NOT `saas`, `portfolio`, `b2b-tool`)
  4. Org has bilingual staff to maintain the copy long-term — manual confirmation in `_research.json.has_bilingual_staff = true`
- If ANY condition fails, the locale mirror is NOT auto-generated
- **Manual opt-in**: orgs that want locale mirrors despite not meeting all 4 conditions can set `_research.json.i18n_opt_in = ['es','pt']` to override
- When auto-fire conditions ARE met, the rebuilt site MUST ship full route mirrors for every qualifying language
- Single-language sites for qualifying multilingual communities = build fail

## Phase order

1. **`geo_extract`** — pull service area from `_research.json` (Google Places `formatted_address` + `service_area[]`) or scrape footer/contact-page for city/county/state
2. **`demographics_lookup`** — query ACS 5-year `B16001 Language Spoken at Home` table via census.gov API for US; equivalent sources elsewhere:
   - Statistics Canada `Mother Tongue`
   - ONS `Main Language` (UK)
   - IBGE (BR), INE (ES), INSEE (FR), ABS (AU), Stats NZ
   - Cache 30 days in KV `demographics:{geohash}`
3. **`locale_select`** — every language with ≥10% community share gets a locale; secondary rule: every language with ≥5% AND >25k speakers in the metro also gets a locale
4. **`translate`** — every route content (titles, meta, body, FAQ, JSON-LD inLanguage) via Workers AI `@cf/meta/llama-3.3-70b-instruct` first pass, then human-tone polish via Claude Opus 4.8 for top 10 highest-traffic routes (home, about, donate, contact, services, faq)
5. **`route_emit`** — `/{locale}/*` prefix (`/es/donate`, `/pt/about`) with `<link rel="alternate" hreflang="{locale}">` cross-references + `x-default` on English root
6. **`hreflang_audit`** — every page has hreflang entries for every shipped locale + x-default; missing entry = build fail

## LOCALE_INFER_TABLE

- **Newark NJ** → `en|es|pt` — 36% Hispanic + 4th-largest Brazilian-American population in US
- **Miami FL** → `en|es|ht` — 66% Hispanic + Haitian-Creole community
- **Los Angeles CA** → `en|es|zh|ko|tl` — 48% Hispanic + Koreatown + Chinatown + Filipinotown
- **San Francisco CA** → `en|es|zh` — Cantonese + Mandarin
- **NYC Manhattan** → `en|es|zh`
- **NYC Queens** → `en|es|zh|ko|bn`
- **Houston TX** → `en|es|vi`
- **Chicago IL** → `en|es|pl`
- **Boston MA** → `en|es|pt|zh`
- **Minneapolis MN** → `en|es|so|hmn` — Somali + Hmong
- **Detroit MI** → `en|es|ar` — Arab-American hub
- **Phoenix AZ** → `en|es`
- **Toronto** → `en|fr|zh|pa`
- **Montréal** → `fr|en|es|ar`
- **London UK** → `en|pl|bn|ur|fr`
- **Madrid** → `es|ca|en|ar`
- **Berlin** → `de|tr|en|ar`
- **Paris** → `fr|ar|en|es`
- **Mumbai** → `hi|mr|en|gu`
- **São Paulo** → `pt|es|ja|en`
- **Mexico City** → `es|en`
- **Buenos Aires** → `es|en|it`

Unlisted geographies: query ACS/equivalent and apply the ≥10% rule fresh.

## ROUTE_SHAPE

- `/{locale}/{path}` — never query param (`?lang=es` fails Google hreflang validation, never indexed by AI crawlers)
- English stays unprefixed at `/` (NEVER `/en/*` for English — duplicates English content under two URLs + dilutes pagerank)
- Locale switcher in header (flag + native language name `Español`, not `Spanish`)
- Cookie + localStorage persistence of user choice + auto-detect via `Accept-Language` on first visit + manual override always wins
- `<html lang="{locale}" dir="{ltr|rtl}">` per route (Arabic, Hebrew, Urdu, Persian = `rtl`)

## TRANSLATION_QUALITY

- Workers AI Llama 3.3 70B is FIRST PASS only
- Every translated string runs through tone-check ("does this sound like a native speaker would write it on a nonprofit page?")
- Top-10 conversion-critical routes get Claude Opus 4.8 second pass with explicit "no calque, no literal-translate-from-English, use locale-natural phrasing" prompt: `/`, `/about`, `/donate`, `/contact`, `/services`, `/faq`, `/team`, `/volunteer`, `/ways-to-give`, `/planned-giving`
- Reference: `donate now` → ES native is `Dona ya` NOT `Donar ahora` (calque); PT-BR native is `Doe agora` NOT `Doar agora`
- Banned: "Lorem ipsum"-style placeholder translations, Google-Translate-direct output without tone pass

## JSON-LD per locale

- Every `Organization`/`LocalBusiness`/`NGO` block gets `inLanguage:"{locale}"` + per-locale `name`/`description`/`alternateName` when the org has a native-language name
- `FAQPage` Q&A translated entity-by-entity (not bulk-translated paragraph dump — preserves accordion granularity)
- `BreadcrumbList` `name` translated, `item` URL stays language-prefixed

## SEO_CITY_PAGES

- When serving multiple cities/neighborhoods (common for soup kitchens, clinics, services), every locale × every city = a route (`/es/newark|/es/east-orange|/pt/ironbound`)
- Use `15-site-generation/local-seo` pSEO templates per locale-city combo
- Caps at 200 city pages per locale to avoid thin-content flag — pick top-N by population density

## ACCESSIBILITY_TIE_IN

- WCAG 3.1.1 Language of Page (Level A) + 3.1.2 Language of Parts (Level AA) MUST be respected
- `<html lang>` for primary, `<span lang="{other}">` for inline foreign phrases
- NEVER assume English is the default for screen readers in locale-prefixed routes

## FAILURE_CASE

- English-only site for an entity serving a community where ≥10% speak another language at home
- Newark NJ nonprofit serving 36% Hispanic + significant Brazilian-Portuguese population MUST ship `/es/*` AND `/pt/*`
- English-only = exclusion of one-third the served community = ethical failure + AI search miss + ADA Title II 2027 compliance risk (effective communication standard)
