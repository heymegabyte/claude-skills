---
name: "new-project-bootstrap"
description: "Complete bootstrap checklist for new emdash projects. When a new domain folder appears in /Users/apple/emdash-projects/, this skill ensures the FULL product is built in one prompt: Cloudflare Worker, HTML, CSS, JS, SEO, PWA, analytics, email, payments, legal pages, tests, deployment, and cache purge. The domain IS the folder name."
---

# New Project Bootstrap

When a new project folder appears in `/Users/apple/emdash-projects/` or a new worktree is created, this skill ensures a complete product ships in one prompt.

## The Rule

**The folder name IS the domain.** If the folder is `donate.megabyte.space`, the site deploys to `https://donate.megabyte.space`.

## Phase 1: Context Gathering (< 2 minutes)

Before writing code, gather:
1. Read the README.md (if exists) for project intent
2. Check CLAUDE.md for any project-specific instructions
3. Check if a site overlay skill exists at `/Users/apple/.agentskills/{domain}/`
4. Determine the project type: marketing site, SaaS app, API service, documentation
5. Check if the user provided a prompt — if not, infer from the domain name

**If truly ambiguous, ask ONE question:** "Is {domain} a [marketing site / SaaS app / API / docs site]?"

Otherwise, make the best decision and build.

## Phase 2: Scaffold (5 minutes)

Create the complete project structure:

```
{domain}/
├── public/
│   ├── index.html          # Main page (beautiful, complete)
│   ├── privacy.html        # Privacy policy (sci-fi legal style)
│   ├── terms.html          # Terms of service
│   ├── 404.html            # Custom error page
│   ├── robots.txt          # SEO
│   ├── sitemap.xml         # SEO
│   ├── site.webmanifest    # PWA
│   ├── favicon.ico         # Generated from Ideogram logo
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── apple-touch-icon.png
│   ├── android-chrome-192x192.png
│   ├── android-chrome-512x512.png
│   ├── og-image.png        # Generated with DALL-E/Ideogram
│   └── images/             # Stock photos from Pexels
├── src/
│   └── index.ts            # Hono worker (CSP, email, API routes)
├── e2e/
│   └── site.spec.ts        # Playwright E2E tests
├── wrangler.toml            # CF Worker config with account_id
├── package.json
├── tsconfig.json
├── playwright.config.ts
└── .gitignore
```

## Phase 3: Build Everything

### HTML (`index.html`)
- Beautiful dark theme (Sora + Space Grotesk fonts)
- Hero section with video background + animated particles
- Scroll-triggered reveal animations
- Glassmorphism cards
- Contact form (sends email via Resend)
- Newsletter signup (connects to Listmonk)
- Social media icons with brand-color hover
- Footer with Megabyte Labs logo
- All phone numbers hyperlinked
- All interactive elements: cursor:pointer + hover + focus + active

### Meta Tags
- Title, description, keywords
- OG tags (title, description, image 1200x630, url)
- Twitter Card (summary_large_image)
- Canonical URL
- Theme color, color scheme
- Geo meta (region, placename)
- Robots (index, follow, max-image-preview:large)

### Structured Data (JSON-LD)
- Organization/NGO
- WebSite
- WebPage
- FAQ (if applicable)
- LocalBusiness (if applicable)
- DonateAction (if donations)

### PWA
- site.webmanifest with icons, shortcuts, screenshots
- Apple touch icon
- MSApplication config

### Analytics
- Auto-configure GA4 + GTM using `/google-analytics` skill
- Add dataLayer events for all interactive elements
- CSP headers allowing GA/GTM domains

### Legal Pages
- Privacy policy (comprehensive, sci-fi literary style)
- Terms of service (enforceable, sci-fi literary style)
- Both with dark theme, fadeIn animations, table of contents

### Logo & Favicons
- Generate via Ideogram API using `/auto-logo` skill
- Process into all sizes using Pillow
- Create OG image (1200x630) with DALL-E or Pillow composite

## Phase 4: Deploy

```bash
npm install --legacy-peer-deps
npx tsc --noEmit
npx wrangler deploy --env production
# Set secrets (Resend, Stripe, etc.)
echo "KEY" | npx wrangler secret put SECRET_NAME --env production
# Purge cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE/purge_cache" ...
```

## Phase 5: Verify

Run the quality-gate skill:
1. Playwright E2E (0 failures)
2. Visual screenshots
3. All links return 200
4. 4+ JSON-LD blocks
5. Images < 200KB
6. Accessibility checks
7. Security headers present

## Phase 6: Report

Tell the user:
- Live URL
- What was built (section by section)
- Test results (X/X passing)
- What API keys need manual setup (GA4 Measurement ID, etc.)
- What's next (suggested improvements)
