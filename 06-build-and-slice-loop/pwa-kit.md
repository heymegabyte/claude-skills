---
name: "pwa-kit"
description: "Full PWA shipped on every site. Manifest with screenshots[] + icons[] + categories. Workbox service worker (precache + runtime cache + offline fallback). Branded offline.html. Update-flow toast (no white-screen reload). Real-not-stock manifest screenshots via Playwright."
updated: "2026-05-01"
---

# PWA Full Kit (***MANDATORY — EVERY SITE***)

Every projectsites.dev build ships a full PWA. Local business customers need contact info offline. SaaS visitors install to their dock. Lighthouse PWA score 100 is the floor.

## site.webmanifest (Required Fields)

```json
{
  "name": "{BusinessName}",
  "short_name": "{ShortName ≤12ch}",
  "description": "{120-156ch}",
  "start_url": "/?utm_source=pwa",
  "id": "/",
  "display": "standalone",
  "display_override": ["window-controls-overlay", "standalone", "minimal-ui", "browser"],
  "background_color": "{--bg-primary}",
  "theme_color": "{--brand-primary}",
  "orientation": "portrait",
  "lang": "en-US",
  "dir": "ltr",
  "scope": "/",
  "categories": ["business", "{primary-category}", "{secondary-category}"],
  "prefer_related_applications": false,
  "icons": [
    { "src": "/favicon-16x16.png", "sizes": "16x16", "type": "image/png" },
    { "src": "/favicon-32x32.png", "sizes": "32x32", "type": "image/png" },
    { "src": "/apple-touch-icon.png", "sizes": "180x180", "type": "image/png" },
    { "src": "/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/android-chrome-maskable-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "screenshots": [
    { "src": "/screenshots/desktop-1920x1080.jpg", "sizes": "1920x1080", "type": "image/jpeg", "form_factor": "wide", "label": "Homepage on desktop" },
    { "src": "/screenshots/mobile-390x844.jpg", "sizes": "390x844", "type": "image/jpeg", "form_factor": "narrow", "label": "Homepage on mobile" },
    { "src": "/screenshots/cover-1280x720.jpg", "sizes": "1280x720", "type": "image/jpeg", "label": "Brand cover" }
  ],
  "shortcuts": [
    { "name": "Contact", "url": "/contact", "icons": [{ "src": "/icons/contact-96.png", "sizes": "96x96" }] },
    { "name": "{Domain-specific}", "url": "/{path}", "icons": [{ "src": "/icons/x-96.png", "sizes": "96x96" }] }
  ]
}
```

## Real Manifest Screenshots (***PLAYWRIGHT — NEVER STOCK MOCKUPS***)

After build, before R2 upload, run `node scripts/generate-pwa-screenshots.mjs http://localhost:4173`:

- **Desktop wide 1920×1080** → `/screenshots/desktop-1920x1080.jpg` (Playwright Chromium, viewport 1920×1080, full-page=false, JPEG q=85)
- **Mobile narrow 390×844** → `/screenshots/mobile-390x844.jpg` (Playwright iPhone 14 Pro emulation)
- **Cover 1280×720** → optional `gpt-image-1.5` illustrative cover (brand colors + business name + tagline + abstract motif) for stores that prefer artistic covers

Each ≤200KB JPEG. **Gate** — `ls dist/screenshots/*.jpg` returns ≥2 files OR build fails.

## Service Worker via Workbox (`sw.js` generated at build)

```js
// vite.config.ts → vite-plugin-pwa with workbox preset
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);  // HTML/CSS/JS at install
registerRoute(({ request }) => request.destination === 'image',
  new CacheFirst({ cacheName: 'images', plugins: [new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 * 30, maxEntries: 200 })] }));
registerRoute(({ url, request }) => request.method === 'GET' && url.origin === self.location.origin && url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({ cacheName: 'api' }));
registerRoute(new NavigationRoute(new NetworkFirst({ cacheName: 'pages', networkTimeoutSeconds: 3 }), { allowlist: [/^\/(?!api|admin)/] }));
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
```

Navigation fallback to `/offline.html` when network fails AND cache empty.

## Static Head Tags (every page)

```html
<link rel="manifest" href="/site.webmanifest" />
<meta name="theme-color" content="{--brand-primary}" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="{ShortName}" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="application-name" content="{BusinessName}" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="mask-icon" href="/safari-pinned-tab.svg" color="{--brand-primary}" />
```

## Branded offline.html (***NEVER GENERIC***)

- Layout — site logo + headline "You're offline" + body "Last loaded at {HH:MM}. Check your connection and refresh." + retry button
- Brand colors, brand fonts, dark or light per `_brand.json.theme`
- NAP block (name + address + phone) embedded statically — phone is `tel:` link so user can call from offline state
- Clickable address opens device's offline maps
- ≤30KB HTML, all assets inlined or cached

## Update Flow (***NO WHITE-SCREEN RELOAD, NO INFINITE LOOP***)

SW registration script sends a discreet toast when a new version is ready, never auto-reloads:

```ts
import { registerSW } from 'virtual:pwa-register';
const updateSW = registerSW({
  onNeedRefresh() { showToast('New version available', { action: { label: 'Refresh', onClick: () => updateSW(true) } }); },
  onOfflineReady() { showToast('Ready to work offline'); },
});
```

- Toast uses skill 11 motion (slideInUp, 200ms)
- Click "Refresh" → calls `updateSW(true)` (skipWaiting + clients.claim + reload)
- NO automatic reload — user controls timing
- NO infinite loop guard needed because toast only shows once per `onNeedRefresh`

## Build Gates (***SKILL 07 `quality-gates.md` PWA VALIDATION***)

- `site.webmanifest` valid JSON, all required fields present
- ≥6 icon entries (16/32/180/192/512/maskable-512)
- ≥2 screenshots (wide + narrow), real not mocked, dimensions match declared
- `sw.js` registered in production HTML
- `offline.html` ≤30KB and contains business NAP
- Lighthouse PWA category score 100
- Update-flow toast component present in `src/`

## Lighthouse PWA Floor

- PWA score ≥0.95 (effectively 100)
- Installable
- Manifest valid
- SW registered + controls page
- `theme-color` matches manifest
- Apple touch icon ≥180×180
- Maskable icon present (≥192×192 with `purpose=maskable`)
