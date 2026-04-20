---
name: api-key-helper
description: When an API key or secret is missing, always print the env variable name, direct URL to generate the key, and step-by-step instructions. Never just say "you need X key" — always include the URL, steps, and the exact command to set it.
---

# API Key Helper

When any API key, secret, or credential is missing or not configured, you MUST:

1. **Print the environment variable name** in bold (e.g., `UNSPLASH_ACCESS_KEY`)
2. **Print the direct URL** to the page where the user can generate or find the key
3. **Print step-by-step instructions** for the easiest path to get the key
4. **Print the exact command** to set the key (e.g., `wrangler secret put`, `export`, `.env`)
5. **Mention the free tier** if one exists

## Complete API Keys Reference

---

### Image Services

#### Unsplash (Stock Photos)
- **Env Variable**: `UNSPLASH_ACCESS_KEY`
- **URL**: https://unsplash.com/oauth/applications
- **Free Tier**: Yes — 50 requests/hour
- **Steps**:
  1. Go to: https://unsplash.com/oauth/applications
  2. Click "New Application"
  3. Accept the terms, name your app
  4. Copy the "Access Key" (NOT the Secret Key)
- **Set it**:
  ```bash
  npx wrangler secret put UNSPLASH_ACCESS_KEY --env production
  echo 'UNSPLASH_ACCESS_KEY=your_key' >> .env.local
  ```

#### Pexels (Stock Photos)
- **Env Variable**: `PEXELS_API_KEY`
- **URL**: https://www.pexels.com/api/new/
- **Free Tier**: Yes — 200 requests/hour, 20K/month
- **Steps**:
  1. Go to: https://www.pexels.com/api/new/
  2. Fill in the form, describe your project
  3. Click "Generate API Key"
  4. Copy the API key from the confirmation page
- **Set it**:
  ```bash
  npx wrangler secret put PEXELS_API_KEY --env production
  echo 'PEXELS_API_KEY=your_key' >> .env.local
  ```

#### Pixabay (Stock Photos + Illustrations)
- **Env Variable**: `PIXABAY_API_KEY`
- **URL**: https://pixabay.com/api/docs/
- **Free Tier**: Yes — 100 requests/minute
- **Steps**:
  1. Go to: https://pixabay.com/accounts/register/
  2. Create account and verify email
  3. Go to: https://pixabay.com/api/docs/
  4. Your API key is shown at the top of the docs page
- **Set it**:
  ```bash
  npx wrangler secret put PIXABAY_API_KEY --env production
  echo 'PIXABAY_API_KEY=your_key' >> .env.local
  ```

---

### Google Services

#### Google Maps Embed + JavaScript API
- **Env Variable**: `GOOGLE_MAPS_API_KEY`
- **URL**: https://console.cloud.google.com/apis/credentials
- **Free Tier**: Yes — 28,000 map loads/month, $200/month free credit
- **Steps**:
  1. Go to: https://console.cloud.google.com/apis/credentials
  2. Click "Create Credentials" → "API Key"
  3. Click "Edit API Key" to restrict it
  4. Under "API restrictions", select these APIs:
     - Maps Embed API: https://console.cloud.google.com/apis/library/maps-embed-backend.googleapis.com
     - Maps JavaScript API: https://console.cloud.google.com/apis/library/maps-backend.googleapis.com
  5. Enable each API by clicking the link above → "Enable"
  6. Copy the API key
- **Set it**:
  ```bash
  npx wrangler secret put GOOGLE_MAPS_API_KEY --env production
  echo 'GOOGLE_MAPS_API_KEY=your_key' >> .env.local
  ```

#### Google Places API (Business Info, Photos, Reviews)
- **Env Variable**: `GOOGLE_PLACES_API_KEY` (can be same key as Maps)
- **URL**: https://console.cloud.google.com/apis/library/places-backend.googleapis.com
- **Free Tier**: Yes — included in $200/month free credit
- **Steps**:
  1. Go to: https://console.cloud.google.com/apis/library/places-backend.googleapis.com
  2. Click "Enable"
  3. Use the same API key from Google Maps (add Places API to its restrictions)
- **Set it**:
  ```bash
  npx wrangler secret put GOOGLE_PLACES_API_KEY --env production
  echo 'GOOGLE_PLACES_API_KEY=your_key' >> .env.local
  ```

#### Google Custom Search Engine (Image Discovery)
- **Env Variable**: `GOOGLE_CSE_KEY` (API Key) + `GOOGLE_CSE_CX` (Search Engine ID)
- **URL (API Key)**: https://console.cloud.google.com/apis/credentials
- **URL (Search Engine)**: https://programmablesearchengine.google.com/controlpanel/create
- **Free Tier**: Yes — 100 queries/day
- **Steps for API Key**:
  1. Go to: https://console.cloud.google.com/apis/credentials
  2. Click "Create Credentials" → "API Key"
  3. Enable Custom Search API: https://console.cloud.google.com/apis/library/customsearch.googleapis.com
- **Steps for Search Engine ID (CX)**:
  1. Go to: https://programmablesearchengine.google.com/controlpanel/create
  2. Enter a name, select "Search the entire web", enable "Image search"
  3. Click "Create" → copy the "Search engine ID"
- **Set it**:
  ```bash
  npx wrangler secret put GOOGLE_CSE_KEY --env production
  npx wrangler secret put GOOGLE_CSE_CX --env production
  echo 'GOOGLE_CSE_KEY=your_key' >> .env.local
  echo 'GOOGLE_CSE_CX=your_cx' >> .env.local
  ```

#### Google Geocoding API (Address → lat/lng)
- **Env Variable**: `GOOGLE_GEOCODING_API_KEY` (can be same key as Maps)
- **URL**: https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com
- **Free Tier**: Yes — included in $200/month free credit
- **Steps**:
  1. Go to: https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com
  2. Click "Enable"
  3. Use the same API key from Google Maps
- **Note**: Can share the same key as GOOGLE_MAPS_API_KEY

#### Google OAuth (Sign-in with Google)
- **Env Variable**: `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
- **URL**: https://console.cloud.google.com/apis/credentials
- **Free Tier**: Yes — unlimited
- **Steps**:
  1. Go to: https://console.cloud.google.com/apis/credentials
  2. Click "Create Credentials" → "OAuth client ID"
  3. Application type: "Web application"
  4. Add authorized redirect URI: `https://projectsites.dev/api/auth/google/callback`
  5. Copy Client ID and Client Secret
- **Set it**:
  ```bash
  npx wrangler secret put GOOGLE_CLIENT_ID --env production
  npx wrangler secret put GOOGLE_CLIENT_SECRET --env production
  ```

---

### Reviews & Ratings

#### Yelp Fusion API
- **Env Variable**: `YELP_API_KEY`
- **URL**: https://www.yelp.com/developers/v3/manage_app
- **Free Tier**: Yes — 5,000 requests/day
- **Steps**:
  1. Go to: https://www.yelp.com/developers/v3/manage_app
  2. Sign in with your Yelp account (or create one)
  3. Click "Create New App"
  4. Fill in app name, description, select "Business Search"
  5. Copy the "API Key"
- **Set it**:
  ```bash
  npx wrangler secret put YELP_API_KEY --env production
  echo 'YELP_API_KEY=your_key' >> .env.local
  ```

---

### AI Services

#### OpenAI (GPT-4o, DALL-E 3)
- **Env Variable**: `OPENAI_API_KEY`
- **URL**: https://platform.openai.com/api-keys
- **Free Tier**: No — pay-as-you-go (DALL-E 3: $0.04/image standard, $0.08/image HD)
- **Steps**:
  1. Go to: https://platform.openai.com/api-keys
  2. Click "Create new secret key"
  3. Name it, copy immediately (shown only once)
  4. Add billing: https://platform.openai.com/account/billing
- **Set it**:
  ```bash
  npx wrangler secret put OPENAI_API_KEY --env production
  echo 'OPENAI_API_KEY=your_key' >> .env.local
  ```

#### Anthropic (Claude API)
- **Env Variable**: `ANTHROPIC_API_KEY`
- **URL**: https://console.anthropic.com/settings/keys
- **Free Tier**: No — pay-as-you-go
- **Steps**:
  1. Go to: https://console.anthropic.com/settings/keys
  2. Click "Create Key"
  3. Name it, copy immediately
  4. Add billing: https://console.anthropic.com/settings/billing
- **Set it**:
  ```bash
  npx wrangler secret put ANTHROPIC_API_KEY --env production
  echo 'ANTHROPIC_API_KEY=your_key' >> .env.local
  ```

#### Groq (Fast LLM Inference)
- **Env Variable**: `GROQ_API_KEY`
- **URL**: https://console.groq.com/keys
- **Free Tier**: Yes — generous free tier
- **Steps**:
  1. Go to: https://console.groq.com/keys
  2. Click "Create API Key"
  3. Copy the key
- **Set it**:
  ```bash
  npx wrangler secret put GROQ_API_KEY --env production
  echo 'GROQ_API_KEY=your_key' >> .env.local
  ```

#### OpenRouter (Multi-model routing)
- **Env Variable**: `OPEN_ROUTER_API_KEY`
- **URL**: https://openrouter.ai/keys
- **Free Tier**: Some free models available
- **Steps**:
  1. Go to: https://openrouter.ai/keys
  2. Click "Create Key"
  3. Copy the key
- **Set it**:
  ```bash
  echo 'OPEN_ROUTER_API_KEY=your_key' >> .env.local
  ```

---

### Cloudflare Services

#### Cloudflare Global API Key
- **Env Variable**: `CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL`
- **URL**: https://dash.cloudflare.com/profile/api-tokens
- **Free Tier**: Yes — included with account
- **Steps**:
  1. Go to: https://dash.cloudflare.com/profile/api-tokens
  2. Scroll to "API Keys" section
  3. Click "View" next to "Global API Key"
  4. Enter your password to reveal the key
  5. Your email is the one you log in to Cloudflare with
- **Set it**:
  ```bash
  echo 'CLOUDFLARE_API_KEY=your_key' >> .env.local
  echo 'CLOUDFLARE_EMAIL=your_email' >> .env.local
  ```

#### Cloudflare API Token (Scoped)
- **Env Variable**: `CF_API_TOKEN`
- **URL**: https://dash.cloudflare.com/profile/api-tokens
- **Steps**:
  1. Go to: https://dash.cloudflare.com/profile/api-tokens
  2. Click "Create Token"
  3. Use "Edit Cloudflare Workers" template or create custom with:
     - Zone:DNS:Edit, Zone:Zone:Read, Account:Workers:Edit, Account:D1:Edit, Account:R2:Edit
- **Set it**:
  ```bash
  npx wrangler secret put CF_API_TOKEN --env production
  ```

#### Cloudflare Images (Image Optimization)
- **Env Variable**: N/A (uses account-level feature)
- **URL**: https://dash.cloudflare.com/?to=/:account/images
- **Pricing**: $5/month for 100K images, $1/100K additional
- **Steps**:
  1. Go to: https://dash.cloudflare.com/?to=/:account/images
  2. Click "Get Started" or "Subscribe"
  3. No API key needed — uses your existing CF API key
  4. API endpoint: `https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1`

---

### Payments

#### Stripe
- **Env Variables**: `STRIPE_SECRET_KEY` + `STRIPE_PUBLISHABLE_KEY` + `STRIPE_WEBHOOK_SECRET`
- **URL**: https://dashboard.stripe.com/apikeys
- **Free Tier**: No monthly fee — 2.9% + $0.30 per transaction
- **Steps for API Keys**:
  1. Go to: https://dashboard.stripe.com/apikeys
  2. Copy "Publishable key" (starts with `pk_`)
  3. Copy "Secret key" (starts with `sk_`) — click "Reveal" first
- **Steps for Webhook Secret**:
  1. Go to: https://dashboard.stripe.com/webhooks
  2. Click "Add endpoint"
  3. URL: `https://projectsites.dev/webhooks/stripe`
  4. Events: `checkout.session.completed`, `customer.subscription.*`
  5. After creating, click the endpoint → "Signing secret" → "Reveal"
- **Set it**:
  ```bash
  npx wrangler secret put STRIPE_SECRET_KEY --env production
  npx wrangler secret put STRIPE_PUBLISHABLE_KEY --env production
  npx wrangler secret put STRIPE_WEBHOOK_SECRET --env production
  ```

---

### Email

#### Resend
- **Env Variable**: `RESEND_API_KEY`
- **URL**: https://resend.com/api-keys
- **Free Tier**: Yes — 100 emails/day, 3,000/month
- **Steps**:
  1. Go to: https://resend.com/api-keys
  2. Click "Create API Key"
  3. Name it, select "Full Access" or "Sending Access"
  4. Copy the key (starts with `re_`)
  5. Verify sending domain: https://resend.com/domains → Add `projectsites.dev`
- **Set it**:
  ```bash
  npx wrangler secret put RESEND_API_KEY --env production
  ```

#### SendGrid
- **Env Variable**: `SENDGRID_API_KEY`
- **URL**: https://app.sendgrid.com/settings/api_keys
- **Free Tier**: Yes — 100 emails/day
- **Steps**:
  1. Go to: https://app.sendgrid.com/settings/api_keys
  2. Click "Create API Key"
  3. Select "Full Access" or "Restricted Access" (needs Mail Send)
  4. Copy the key (starts with `SG.`)
  5. Verify sender: https://app.sendgrid.com/settings/sender_auth
- **Set it**:
  ```bash
  npx wrangler secret put SENDGRID_API_KEY --env production
  ```

---

### Analytics & Monitoring

#### PostHog (Analytics)
- **Env Variable**: `POSTHOG_API_KEY` + `POSTHOG_HOST`
- **URL**: https://app.posthog.com/project/settings
- **Free Tier**: Yes — 1M events/month
- **Steps**:
  1. Go to: https://app.posthog.com/project/settings
  2. Copy "Project API Key"
  3. Host is usually `https://app.posthog.com` (or your self-hosted URL)
- **Set it**:
  ```bash
  npx wrangler secret put POSTHOG_API_KEY --env production
  ```

#### Sentry (Error Tracking)
- **Env Variable**: `SENTRY_DSN`
- **URL**: https://sentry.io/settings/projects/
- **Free Tier**: Yes — 5K errors/month
- **Steps**:
  1. Go to: https://sentry.io/ → Create account/org
  2. Create a new project (platform: "JavaScript" or "Browser")
  3. Go to: Settings → Projects → Your Project → Client Keys (DSN)
  4. Copy the DSN URL (looks like `https://xxx@sentry.io/123`)
- **Set it**:
  ```bash
  npx wrangler secret put SENTRY_DSN --env production
  ```

---

### Domain Registration

#### Cloudflare Registrar (Domain Purchase API)
- **Env Variable**: N/A (uses existing `CLOUDFLARE_API_KEY`)
- **URL**: https://dash.cloudflare.com/?to=/:account/domains/register
- **Pricing**: At-cost (~$9.77/yr for .com — cheapest registrar)
- **Steps**: No additional setup — uses your existing Cloudflare API key
- **API Endpoints**:
  - Check availability: `GET /accounts/{account_id}/registrar/domains?domain={domain}`
  - Register: `POST /accounts/{account_id}/registrar/domains`
  - Add DNS: `POST /zones/{zone_id}/dns_records`

---

### GitHub

#### GitHub Personal Access Token
- **Env Variable**: `VITE_GITHUB_ACCESS_TOKEN` or `GITHUB_TOKEN`
- **URL**: https://github.com/settings/tokens?type=beta
- **Free Tier**: Yes — unlimited
- **Steps**:
  1. Go to: https://github.com/settings/tokens?type=beta
  2. Click "Generate new token"
  3. Name it, set expiration
  4. Permissions needed: `repo` (read/write), `read:org`
  5. Copy the token (starts with `github_pat_` or `ghp_`)
- **Set it**:
  ```bash
  echo 'VITE_GITHUB_ACCESS_TOKEN=your_token' >> .env.local
  ```

---

## Quick Reference: All Environment Variables

| Variable | Service | Free? | URL |
|----------|---------|-------|-----|
| `UNSPLASH_ACCESS_KEY` | Unsplash | ✅ 50 req/hr | https://unsplash.com/oauth/applications |
| `PEXELS_API_KEY` | Pexels | ✅ 200 req/hr | https://www.pexels.com/api/new/ |
| `PIXABAY_API_KEY` | Pixabay | ✅ 100 req/min | https://pixabay.com/api/docs/ |
| `GOOGLE_MAPS_API_KEY` | Google Maps | ✅ $200/mo credit | https://console.cloud.google.com/apis/credentials |
| `GOOGLE_PLACES_API_KEY` | Google Places | ✅ same credit | https://console.cloud.google.com/apis/credentials |
| `GOOGLE_CSE_KEY` | Custom Search | ✅ 100/day | https://console.cloud.google.com/apis/credentials |
| `GOOGLE_CSE_CX` | Search Engine ID | ✅ | https://programmablesearchengine.google.com/controlpanel/create |
| `YELP_API_KEY` | Yelp Fusion | ✅ 5K/day | https://www.yelp.com/developers/v3/manage_app |
| `OPENAI_API_KEY` | OpenAI | ❌ pay-per-use | https://platform.openai.com/api-keys |
| `ANTHROPIC_API_KEY` | Anthropic | ❌ pay-per-use | https://console.anthropic.com/settings/keys |
| `GROQ_API_KEY` | Groq | ✅ generous | https://console.groq.com/keys |
| `OPEN_ROUTER_API_KEY` | OpenRouter | ✅ some models | https://openrouter.ai/keys |
| `CLOUDFLARE_API_KEY` | Cloudflare | ✅ | https://dash.cloudflare.com/profile/api-tokens |
| `CLOUDFLARE_EMAIL` | Cloudflare | ✅ | Your login email |
| `STRIPE_SECRET_KEY` | Stripe | ✅ no monthly | https://dashboard.stripe.com/apikeys |
| `STRIPE_PUBLISHABLE_KEY` | Stripe | ✅ | https://dashboard.stripe.com/apikeys |
| `STRIPE_WEBHOOK_SECRET` | Stripe | ✅ | https://dashboard.stripe.com/webhooks |
| `RESEND_API_KEY` | Resend | ✅ 100/day | https://resend.com/api-keys |
| `SENDGRID_API_KEY` | SendGrid | ✅ 100/day | https://app.sendgrid.com/settings/api_keys |
| `POSTHOG_API_KEY` | PostHog | ✅ 1M events/mo | https://app.posthog.com/project/settings |
| `SENTRY_DSN` | Sentry | ✅ 5K errors/mo | https://sentry.io/settings/projects/ |
| `GOOGLE_CLIENT_ID` | Google OAuth | ✅ | https://console.cloud.google.com/apis/credentials |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | ✅ | https://console.cloud.google.com/apis/credentials |
| `VITE_GITHUB_ACCESS_TOKEN` | GitHub | ✅ | https://github.com/settings/tokens?type=beta |

## Rules

- NEVER say "you need to set up X" without the direct URL
- ALWAYS print the env variable name first in bold
- ALWAYS include the fastest path (skip unnecessary steps)
- If a key has a free tier, mention it and the limits
- If there are multiple ways to get a key, recommend the easiest one first
- Print commands to set the key after obtaining it
- If multiple services can share one key (e.g., Google Maps + Places + Geocoding), say so
