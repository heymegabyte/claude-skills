---
name: "google-analytics"
description: "Automatically configure Google Analytics 4 (GA4) and Google Tag Manager (GTM) for emdash project sites. Creates GA4 properties, GTM containers, configures tags/triggers/events, injects snippets into HTML, updates CSP headers, and deploys. Scans emdash project folders by domain name and sets up everything automatically. Use when deploying a new site, adding analytics, or managing tracking across projects."
---

# Google Analytics & Tag Manager Automation Skill

Fully automated GA4 + GTM setup for emdash project sites. One command: scan all projects, create analytics, deploy.

## Credentials

**GCP Service Account:** `/Users/apple/.config/emdash/gcp-service-account.json`
- Email: `ga-gtag@megabyte-labs.iam.gserviceaccount.com`
- Project: `megabyte-labs`

**Required permissions (must be added manually once):**
- GA4: Add service account email as **Editor** in GA4 Admin → Account Access Management
  URL: https://analytics.google.com/analytics/web/#/admin/account/access-management
- GTM: Add service account email as **Admin** in GTM Admin → User Management
  URL: https://tagmanager.google.com/#/admin/accounts

## Quick Setup URLs

| Action | URL |
|--------|-----|
| Create GA4 Account | https://analytics.google.com/analytics/web/#/provision/create |
| GA4 Admin | https://analytics.google.com/analytics/web/#/admin |
| GA4 Access Management | https://analytics.google.com/analytics/web/#/admin/account/access-management |
| Create GTM Account | https://tagmanager.google.com/#/admin/accounts/create |
| GTM Admin | https://tagmanager.google.com/#/admin/accounts |
| Enable Analytics Admin API | https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com?project=megabyte-labs |
| Enable Tag Manager API | https://console.cloud.google.com/apis/library/tagmanager.googleapis.com?project=megabyte-labs |
| GCP Service Accounts | https://console.cloud.google.com/iam-admin/serviceaccounts?project=megabyte-labs |

## Architecture

```
GCP Service Account (ga-gtag@megabyte-labs.iam.gserviceaccount.com)
  │
  ├── Google Analytics Admin API
  │   ├── List accounts
  │   ├── Create GA4 property per domain
  │   ├── Create web data stream → get Measurement ID (G-XXXXXXXX)
  │   └── Configure enhanced measurement
  │
  ├── Google Tag Manager API
  │   ├── List/create GTM account
  │   ├── Create container per domain → get Container ID (GTM-XXXXXXXX)
  │   ├── Create GA4 Configuration tag (linked to Measurement ID)
  │   ├── Create custom event triggers (donate, contact, newsletter, hotline)
  │   ├── Create GA4 Event tags for each trigger
  │   ├── Create version + publish
  │   └── Get GTM snippet code
  │
  └── Emdash Project Integration
      ├── Scan /Users/apple/emdash-projects/ for domain folders
      ├── Inject GTM <head> snippet + <body> noscript into all HTML
      ├── Update Cloudflare Worker CSP headers
      ├── Add dataLayer.push() calls on interactive elements
      └── Deploy via wrangler + purge Cloudflare cache
```

## Full Automation Flow

### Step 1: Authenticate

```javascript
const { GoogleAuth } = require('google-auth-library');

const auth = new GoogleAuth({
  keyFile: '/Users/apple/.config/emdash/gcp-service-account.json',
  scopes: [
    'https://www.googleapis.com/auth/analytics.edit',
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/tagmanager.edit.containers',
    'https://www.googleapis.com/auth/tagmanager.edit.containerversions',
    'https://www.googleapis.com/auth/tagmanager.publish',
    'https://www.googleapis.com/auth/tagmanager.manage.accounts',
    'https://www.googleapis.com/auth/tagmanager.manage.users',
  ]
});
const client = await auth.getClient();
const { token } = await client.getAccessToken();
```

### Step 2: Get or Create GA4 Account

```bash
# List accounts
GET https://analyticsadmin.googleapis.com/v1beta/accounts
Authorization: Bearer {token}

# If none exist, user must create one at:
# https://analytics.google.com/analytics/web/#/provision/create
```

### Step 3: Create GA4 Property

```bash
POST https://analyticsadmin.googleapis.com/v1beta/properties
Authorization: Bearer {token}
Content-Type: application/json

{
  "displayName": "{domain}",
  "timeZone": "America/New_York",
  "currencyCode": "USD",
  "industryCategory": "TECHNOLOGY",
  "parent": "accounts/{ga4AccountId}"
}
```

### Step 4: Create Web Data Stream (gets Measurement ID)

```bash
POST https://analyticsadmin.googleapis.com/v1beta/properties/{propertyId}/dataStreams
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "WEB_DATA_STREAM",
  "displayName": "{domain} web stream",
  "webStreamData": {
    "defaultUri": "https://{domain}"
  }
}

# Response contains: webStreamData.measurementId = "G-XXXXXXXXXX"
```

### Step 5: Get or Create GTM Account

```bash
# List accounts
GET https://tagmanager.googleapis.com/tagmanager/v2/accounts
Authorization: Bearer {token}

# Create if needed
POST https://tagmanager.googleapis.com/tagmanager/v2/accounts
{
  "name": "Megabyte Labs"
}
```

### Step 6: Create GTM Container

```bash
POST https://tagmanager.googleapis.com/tagmanager/v2/accounts/{gtmAccountId}/containers
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "{domain}",
  "usageContext": ["web"],
  "domainName": ["{domain}"]
}

# Response contains: publicId = "GTM-XXXXXXXX"
```

### Step 7: Create GA4 Configuration Tag

```bash
POST https://tagmanager.googleapis.com/tagmanager/v2/{containerPath}/workspaces/2/tags
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "GA4 Configuration",
  "type": "gaawc",
  "parameter": [
    {"type": "TEMPLATE", "key": "measurementId", "value": "{measurementId}"},
    {"type": "BOOLEAN", "key": "sendPageView", "value": "true"}
  ],
  "firingTriggerId": ["2147479553"],
  "tagFiringOption": "ONCE_PER_LOAD"
}
```

### Step 8: Create Custom Event Triggers

For each interactive element, create a trigger:

```javascript
const events = [
  { name: 'Donate Click', event: 'donate_click' },
  { name: 'Contact Form Submit', event: 'contact_form_submit' },
  { name: 'Newsletter Signup', event: 'newsletter_signup' },
  { name: 'Hotline Call', event: 'hotline_call' },
  { name: 'Video Play', event: 'video_play' },
  { name: 'PDF Download', event: 'pdf_download' },
];

for (const { name, event } of events) {
  await fetch(`${containerPath}/workspaces/2/triggers`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Custom - ${name}`,
      type: 'customEvent',
      customEventFilter: [{
        type: 'EQUALS',
        parameter: [
          { type: 'TEMPLATE', key: 'arg0', value: '{{_event}}' },
          { type: 'TEMPLATE', key: 'arg1', value: event }
        ]
      }]
    })
  });
}
```

### Step 9: Create GA4 Event Tags

For each trigger, create a corresponding GA4 event tag:

```javascript
for (const { name, event, triggerId } of eventsWithIds) {
  await fetch(`${containerPath}/workspaces/2/tags`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `GA4 Event - ${name}`,
      type: 'gaawe',
      parameter: [
        { type: 'TEMPLATE', key: 'eventName', value: event },
        { type: 'TAG_REFERENCE', key: 'measurementId', value: 'GA4 Configuration' }
      ],
      firingTriggerId: [triggerId],
      tagFiringOption: 'ONCE_PER_EVENT'
    })
  });
}
```

### Step 10: Publish

```javascript
// Create version
const versionRes = await fetch(`${containerPath}/workspaces/2:create_version`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'v1.0 - GA4 + Events', notes: 'Auto-configured by emdash' })
});
const versionData = await versionRes.json();
const versionPath = versionData.containerVersion.path;

// Publish
await fetch(`https://tagmanager.googleapis.com/tagmanager/v2/${versionPath}:publish`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` }
});
```

### Step 11: Inject GTM Snippet into HTML

**In `<head>` (as high as possible):**
```html
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','{GTM_CONTAINER_ID}');</script>
```

**Right after `<body>`:**
```html
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id={GTM_CONTAINER_ID}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
```

### Step 12: Add dataLayer Events to Interactive Elements

Use AI to scan the HTML and identify interactive elements, then add appropriate `dataLayer.push()` calls:

```javascript
// Donate buttons
document.querySelectorAll('a[href*="donate"]').forEach(el => {
  el.addEventListener('click', () => {
    window.dataLayer.push({ event: 'donate_click', link_url: el.href });
  });
});

// Contact form
document.getElementById('contactForm')?.addEventListener('submit', () => {
  window.dataLayer.push({ event: 'contact_form_submit', form_subject: form.subject.value });
});

// Newsletter
document.getElementById('newsletterForm')?.addEventListener('submit', () => {
  window.dataLayer.push({ event: 'newsletter_signup' });
});

// Phone links (hotline)
document.querySelectorAll('a[href^="tel:"]').forEach(el => {
  el.addEventListener('click', () => {
    window.dataLayer.push({ event: 'hotline_call', phone_number: el.href });
  });
});

// PDF downloads
document.querySelectorAll('a[href$=".pdf"]').forEach(el => {
  el.addEventListener('click', () => {
    window.dataLayer.push({ event: 'pdf_download', file_url: el.href });
  });
});

// Video plays
document.querySelectorAll('.video-thumb').forEach(el => {
  el.addEventListener('click', () => {
    window.dataLayer.push({ event: 'video_play', video_id: el.dataset.video });
  });
});
```

### Step 13: Update CSP Headers

In the Cloudflare Worker's Hono `secureHeaders`:

```typescript
contentSecurityPolicy: {
  scriptSrc: [..., "https://www.googletagmanager.com", "https://www.google-analytics.com"],
  connectSrc: [..., "https://www.google-analytics.com", "https://www.googletagmanager.com",
               "https://analytics.google.com", "https://region1.google-analytics.com"],
  imgSrc: [..., "https://www.google-analytics.com", "https://www.googletagmanager.com"],
  frameSrc: [..., "https://www.googletagmanager.com"],
}
```

### Step 14: Deploy

```bash
npx wrangler deploy --env production
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zoneId}/purge_cache" \
  -H "X-Auth-Email: blzalewski@gmail.com" \
  -H "X-Auth-Key: {cfApiKey}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

## Multi-Project Scanning

The skill scans `/Users/apple/emdash-projects/` for project folders named after their domains:

```bash
ls /Users/apple/emdash-projects/
# mission.megabyte.space/
# projectsites.dev/
# editor.megabyte.space/
# ai.megabyte.space/
# fundl.ink/
```

For each folder:
1. Extract domain from folder name
2. Check if GA4 property exists for that domain
3. Check if GTM container exists
4. If missing, create them
5. Scan HTML files for GTM snippet
6. If missing, inject it
7. Check for dataLayer event code
8. If missing, AI-generate custom events based on the page content
9. Deploy

## AI-Powered Event Configuration

For each project, the skill should:

1. Read all HTML files in the public/ directory
2. Identify interactive elements (forms, buttons, links, videos)
3. Generate appropriate `dataLayer.push()` calls
4. Create matching GTM triggers and GA4 event tags
5. Map each event to meaningful GA4 parameters

The AI should consider:
- **E-commerce sites:** purchase, add_to_cart, begin_checkout events
- **Nonprofit sites:** donate_click, volunteer_signup, hotline_call events
- **SaaS sites:** sign_up, login, feature_use events
- **Content sites:** scroll_depth, video_play, article_read events

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `{}` response from accounts API | Service account not added as user in GA4/GTM. Add manually via the URLs above. |
| `403 Forbidden` | API not enabled. Enable at the URLs in the Quick Setup table. |
| `401 Unauthorized` | Token expired. Re-authenticate with service account. |
| GTM not loading on site | Check CSP headers allow `googletagmanager.com`. |
| GA4 not receiving data | Ensure GTM container is published (not just saved). |
| Events not tracking | Check `dataLayer.push()` fires before GTM loads. Use GTM Preview mode. |
| Preview mode blocked | Add `https://www.googletagmanager.com` to `frame-src` in CSP. |
