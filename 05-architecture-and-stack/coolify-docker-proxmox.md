---
name: "Coolify, Docker, and Proxmox"
description: "Orchestrate self-hosted services on Brian's Proxmox box via Coolify API. Deploy Docker containers, manage environment variables, restart services, and provision new services. REQUIRES USER CONFIRMATION on first use per project — ask before touching production infrastructure. 70+ services already running."
updated: "2026-04-23"
---

# Coolify, Docker, and Proxmox

## CRITICAL: First-Use Confirmation Required

Ask before ANY Coolify action in a new project:

```
Hey — this project needs [service/capability] which runs on your Proxmox
box via Coolify. I'll need to:

  [specific action: deploy a new service / configure an existing one / etc.]

This touches your production self-hosted infrastructure (70+ services).
Want me to go ahead?
```

Wait for explicit "yes". Re-confirm within the same project only for: new service deploys, deletes/restarts, changes to shared-service env vars, or DNS/networking modifications.

## Infrastructure Overview

### Proxmox Host

- Hardware: bare metal Proxmox with ZFS storage
- VMs: OPNsense, Ubuntu Desktop, macOS, Windows 11, Home Assistant OS, Coolify server
- Backup: daily ZFS snapshots → R2 (3-2-1)
- Network: VLAN segmentation, 10+ VLANs

### OPNsense

- Primary firewall/router virtualized on Proxmox
- VPN: multi-provider WireGuard + OpenVPN + Cloudflare WARP
- DNS: Unbound with DNSSEC + DNS-over-TLS
- ACME: Let's Encrypt via Cloudflare DNS challenge for `*.megabyte.space`
- Authentik LDAP integration + Headscale mesh VPN

### Coolify Access

- URL: `{service}.megabyte.space` (behind CF Tunnel + Authentik)
- API: `{coolify-url}/api/v1/`
- Token: `~/.config/emdash/coolify-token`
- Reverse proxy: Traefik with Authentik forward-auth middleware
- Docker-compose magic vars: `SERVICE_FQDN_*`, `SERVICE_URL_*`

### Already-Running Services

| Service | Role |
|---------|------|
| Authentik | SSO for everything |
| Healthchecks | Uptime monitoring |
| OpenWebUI | AI chat interface |
| Bolt.diy | AI website builder |
| Dify | AI app builder |
| Postiz | Social automation |
| n8n | Workflow automation |
| Sentry | Error tracking (mandatory) |
| PostHog | Product analytics (mandatory) |
| FireCrawl | Web scraping |
| Listmonk | Email marketing |
| Browserless | Headless Chrome |
| Home Assistant | Smart home (internal) |

All follow `{service}.megabyte.space`. Discoverable via Coolify API.

### Common Problems

1. Healthcheck failures in Docker compose
2. Container file permissions (9999:root pattern)
3. Redirect loops — Cloudflare → Authentik → Service
4. Port conflicts between containers
5. Volume permission issues
6. TLS handshake timeouts

## Coolify API Reference

### Authentication

```bash
COOLIFY_TOKEN=$(cat ~/.config/emdash/coolify-token)
COOLIFY_URL="https://coolify.megabyte.space/api/v1"
```

### List All Services

```bash
curl -s "$COOLIFY_URL/services" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" | jq '.[].name'
```

### Get Service Details

```bash
curl -s "$COOLIFY_URL/services/{service_id}" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" | jq '{name, status, fqdn}'
```

### Get Environment Variables

```bash
curl -s "$COOLIFY_URL/services/{service_id}/envs" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" | jq '.[].key'
```

### Set Environment Variable

```bash
# CONFIRMATION REQUIRED for shared services
curl -X POST "$COOLIFY_URL/services/{service_id}/envs" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key": "ENV_NAME", "value": "env_value", "is_build_time": false}'
```

### Restart Service

```bash
# CONFIRMATION REQUIRED
curl -X POST "$COOLIFY_URL/services/{service_id}/restart" \
  -H "Authorization: Bearer $COOLIFY_TOKEN"
```

### Deploy New Service

```bash
# CONFIRMATION REQUIRED — always ask first
curl -X POST "$COOLIFY_URL/services" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "service-name",
    "type": "docker-compose",
    "docker_compose": "version: \"3\"\nservices:\n  app:\n    image: service:latest\n    ports:\n      - \"8080:8080\"",
    "server_id": 1
  }'
```

### Check Service Health

```bash
curl -s "$COOLIFY_URL/services/{service_id}" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" | jq '.status'
```

## When to Use Coolify vs Cloudflare

| Need | Use Cloudflare | Use Coolify |
|------|---------------|-------------|
| API endpoints | Workers (Hono) | — |
| Static sites | Workers Static Assets | — |
| SQLite database | D1 (1TB, global replicas) | — |
| Object storage | R2 | — |
| Key-value cache | KV | — |
| Stateful connections | Durable Objects | — |
| Docker containers | CF Containers (GA, DO-based) | Coolify (more control, custom networking) |
| Sandboxed execution | CF Sandboxes (GA) or Dynamic Workers | — |
| PostgreSQL | Neon (managed) | Coolify (self-hosted) |
| Long-running processes | Workflows v2 + Queues | Coolify |
| Full-stack apps (Django, Rails, etc.) | CF Containers | Coolify (existing infra) |
| Services needing persistent disk | CF Containers | Coolify |
| Services needing >128MB RAM | CF Containers | Coolify |
| Custom networking | CF Mesh | Coolify (complex VLAN) |
| Email marketing | CF Email Service (beta) | Listmonk on Coolify |

**Rule** — Default to Cloudflare. CF Containers GA eliminates most Coolify use cases for new projects. Use Coolify for existing 70+ services and complex self-hosted stacks.

## Docker Compose Patterns

### Simple Service

```yaml
version: "3"
services:
  app:
    image: service/image:latest
    restart: unless-stopped
    environment:
      - DATABASE_URL=postgresql://...
      - SECRET_KEY=${SECRET_KEY}
    ports:
      - "8080:8080"
    volumes:
      - data:/app/data
volumes:
  data:
```

### Service with PostgreSQL

```yaml
version: "3"
services:
  app:
    image: service/image:latest
    restart: unless-stopped
    depends_on: [db]
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/app
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=app
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

## Disaster Recovery

- Coolify auto-backs up configurations
- PostgreSQL: `pg_dump` via cron to R2
- Volumes: periodic tar to R2
- Env vars: exported and stored encrypted

```bash
# 1. Restore Coolify from backup
# 2. Re-deploy services from docker-compose configs
# 3. Restore database from pg_dump
# 4. Restore volumes from R2 tarballs
# 5. Verify all services healthy
```

See `08/backup-and-disaster-recovery` for the full single-zip restore plan.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Service unreachable | Check `curl $COOLIFY_URL/services/{id}` status |
| Container restarting | Check logs — `docker logs {container_id}` via Coolify UI |
| Out of memory | Scale up Proxmox VM or optimize service config |
| Disk full | Clean Docker — `docker system prune -a` |
| SSL cert expired | Coolify auto-renews via Let's Encrypt; check Traefik logs |
| API timeout | Coolify may be overloaded; check Proxmox CPU/RAM |

## What This Skill Owns

- Coolify API interaction
- Docker service deployment and management
- Self-hosted service orchestration
- Proxmox infrastructure awareness
- When-to-use-Coolify decision logic
