---
name: "listmonk"
description: "Deploy, configure, and interface with Listmonk (self-hosted newsletter and mailing list manager) on Cloudflare Containers at listmonk.megabyte.space. Use when the user wants to set up email newsletters, manage mailing lists, send campaigns, add subscribers, or integrate Listmonk with their sites."
---

# Listmonk Skill

Deploys and manages a Listmonk instance on Cloudflare Workers Containers, and provides an interface for common operations like adding subscribers, creating campaigns, and managing lists.

## When to use

- Deploying a new Listmonk instance to Cloudflare Containers
- Adding subscribers to a Listmonk mailing list
- Creating and sending email campaigns
- Integrating a website's newsletter form with Listmonk
- Managing lists, templates, or subscriber segments
- Querying subscriber or campaign analytics

## Architecture

```
┌─────────────────────────────────┐
│  Cloudflare Worker (Proxy)      │
│  listmonk.megabyte.space        │
│  - CF Access SSO for admin UI   │
│  - Public API for subscriptions │
├─────────────────────────────────┤
│  Cloudflare Container           │
│  listmonk/listmonk:latest       │
│  Port 9000                      │
├─────────────────────────────────┤
│  PostgreSQL (Neon.tech)         │
│  Serverless Postgres            │
└─────────────────────────────────┘
```

## Deployment

### Prerequisites

1. Docker running locally (for building container image)
2. Cloudflare account with Containers enabled
3. Neon.tech PostgreSQL database (free tier works)
4. Cloudflare Access configured for SSO

### wrangler.toml

```toml
name = "listmonk"
main = "src/index.ts"
compatibility_date = "2025-04-14"
account_id = "84fa0d1b16ff8086dd958c468ce7fd59"

[[containers]]
class_name = "ListmonkContainer"
image = "./Dockerfile"
max_instances = 1

[[durable_objects.bindings]]
name = "LISTMONK"
class_name = "ListmonkContainer"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["ListmonkContainer"]

[env.production]
routes = [
  { pattern = "listmonk.megabyte.space", custom_domain = true }
]
```

### Dockerfile

```dockerfile
FROM listmonk/listmonk:latest
ENV LISTMONK_app__address=0.0.0.0:9000
EXPOSE 9000
```

### Worker (src/index.ts)

```typescript
import { Container } from 'cloudflare:workers';

export class ListmonkContainer extends Container {
  defaultPort = 9000;
  sleepAfter = '30m'; // keep alive for 30 min after last request
  envVars = {
    LISTMONK_app__address: '0.0.0.0:9000',
    LISTMONK_db__host: '<NEON_HOST>',
    LISTMONK_db__port: '5432',
    LISTMONK_db__user: '<NEON_USER>',
    LISTMONK_db__password: '<NEON_PASSWORD>',
    LISTMONK_db__database: 'listmonk',
    LISTMONK_db__ssl_mode: 'require',
  };
}

export default {
  async fetch(request, env) {
    const container = env.LISTMONK.getByName('primary');
    return await container.fetch(request);
  }
};
```

## Listmonk API Reference

Base URL: `https://listmonk.megabyte.space/api`

### Authentication

All API calls require HTTP Basic Auth:
```
Authorization: Basic base64(username:password)
```
Default: `listmonk:listmonk` (change after first login)

### Subscribers

**Add subscriber:**
```bash
curl -u 'admin:password' -X POST \
  https://listmonk.megabyte.space/api/subscribers \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "name": "User Name",
    "status": "enabled",
    "lists": [1],
    "preconfirm_subscriptions": true
  }'
```

**Get subscriber:**
```bash
curl -u 'admin:password' \
  https://listmonk.megabyte.space/api/subscribers/1
```

**Query subscribers:**
```bash
curl -u 'admin:password' \
  'https://listmonk.megabyte.space/api/subscribers?page=1&per_page=50'
```

### Lists

**Get all lists:**
```bash
curl -u 'admin:password' \
  https://listmonk.megabyte.space/api/lists
```

**Create list:**
```bash
curl -u 'admin:password' -X POST \
  https://listmonk.megabyte.space/api/lists \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Mission Updates",
    "type": "public",
    "optin": "single",
    "tags": ["newsletter"]
  }'
```

### Campaigns

**Create campaign:**
```bash
curl -u 'admin:password' -X POST \
  https://listmonk.megabyte.space/api/campaigns \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Monthly Update - April 2026",
    "subject": "What We Built This Month",
    "lists": [1],
    "type": "regular",
    "content_type": "richtext",
    "body": "<h1>Monthly Update</h1><p>Here is what happened...</p>",
    "from_email": "noreply@megabyte.space",
    "messenger": "email",
    "template_id": 1
  }'
```

**Start campaign:**
```bash
curl -u 'admin:password' -X PUT \
  https://listmonk.megabyte.space/api/campaigns/1/status \
  -H 'Content-Type: application/json' \
  -d '{"status": "running"}'
```

### Templates

**Get templates:**
```bash
curl -u 'admin:password' \
  https://listmonk.megabyte.space/api/templates
```

### Public Subscription (no auth needed)

**Subscribe via public API:**
```bash
curl -X POST \
  https://listmonk.megabyte.space/subscription/form \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'email=user@example.com&name=User&l=LISTMONK_LIST_UUID'
```

## Website Integration

### Newsletter Form (client-side)

```javascript
const form = document.getElementById('newsletterForm');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = form.querySelector('input[name="email"]').value;
  await fetch('https://listmonk.megabyte.space/subscription/form', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `email=${encodeURIComponent(email)}&l=LIST_UUID`
  });
});
```

### Worker-side (proxy to Listmonk)

```typescript
// In your site's Worker, add a route that forwards to Listmonk
app.post('/api/subscribe', async (c) => {
  const { email, name } = await c.req.json();
  const res = await fetch('https://listmonk.megabyte.space/api/subscribers', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa('admin:password'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email, name,
      status: 'enabled',
      lists: [1],
      preconfirm_subscriptions: true,
    }),
  });
  return c.json(await res.json());
});
```

## Cloudflare Access SSO

To protect the Listmonk admin UI behind Cloudflare Access:

1. Go to Cloudflare Zero Trust Dashboard
2. Add Application > Self-hosted
3. Domain: `listmonk.megabyte.space`
4. Add policy: Allow if email matches `blzalewski@gmail.com` or `brian@megabyte.space`
5. The public subscription API endpoint (`/subscription/form`) should be bypassed from Access

### Bypass rule for public endpoints:
- Path: `/subscription/*` → Bypass
- Path: `/api/public/*` → Bypass
- Everything else: Require SSO login

## Troubleshooting

- **Container won't start:** Ensure Docker is running locally and the Listmonk image supports linux/amd64
- **Database connection:** Verify Neon.tech connection string and SSL mode
- **Email delivery:** Configure SMTP in Listmonk admin UI (Settings > SMTP) or use Resend SMTP relay
- **Cold starts:** First request after `sleepAfter` timeout will take ~10-30s as the container spins up
