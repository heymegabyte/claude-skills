---
name: "Coolify, Docker, and Proxmox"
description: "Orchestrate self-hosted services on Brian's Proxmox box via Coolify API. Deploy Docker containers, manage environment variables, restart services, and provision new services. REQUIRES USER CONFIRMATION on first use per project — ask before touching production infrastructure. 70+ services already running."
updated: "2026-04-23"
---

# Coolify, Docker, and Proxmox
## CRITICAL: First-Use Confirmation Required
**Before using this skill for the first time in any project, ALWAYS ask:**

```
Hey — this project needs [service/capability] which runs on your Proxmox
box via Coolify. I'll need to:

  [specific action: deploy a new service / configure an existing one / etc.]

This touches your production self-hosted infrastructure (70+ services).
Want me to go ahead?
```

**Wait for explicit "yes" before proceeding.** After first confirmation per project, subsequent Coolify operations in the same project don't need re-confirmation unless they:
- Deploy a NEW service (not just configure an existing one)
- Delete or restart an existing service
- Change environment variables on a shared service
- Modify DNS or networking

## Infrastructure Overview
### Proxmox Host (361 conversations about Proxmox in ChatGPT history)
Brian's Proxmox box runs Coolify as the PaaS layer. Coolify manages 70+ Docker services.
- Hardware: Bare metal Proxmox with ZFS storage
- VMs: OPNsense, Ubuntu Desktop, macOS, Windows 11, Home Assistant OS, Coolify server
- Backup: Daily ZFS snapshots → R2 (3-2-1 pattern)
- Network: VLAN segmentation, 10+ VLANs

### OPNsense (250 conversations)
- Virtualized on Proxmox as primary firewall/router
- VPN: Multi-provider WireGuard + OpenVPN + Cloudflare WARP
- DNS: Unbound with DNSSEC + DNS-over-TLS
- ACME: Let's Encrypt via Cloudflare DNS challenge for *.megabyte.space
- Authentik LDAP integration for authentication
- Mesh VPN coordination via Headscale

### Coolify Access (136 mentions — THE hub)
- **URL:** `{service}.megabyte.space` pattern (behind CF Tunnel + Authentik)
- **API:** `{coolify-url}/api/v1/`
- **Token:** `~/.config/emdash/coolify-token`
- Behind: Cloudflare tunnel (cloudflared) for zero-trust access
- Reverse proxy: Traefik with Authentik forward-auth middleware
- Docker-compose conventions: SERVICE_FQDN_*, SERVICE_URL_* magic variables

### Already-Running Services (ranked by usage from 3,102 ChatGPT conversations)
| Service | Pattern | Role |
|---------|---------|------|
| **Authentik** | `{service}.megabyte.space` | SSO for everything |
| **Healthchecks** | same pattern | Uptime monitoring |
| **OpenWebUI** | same pattern | AI chat interface |
| **Bolt.diy** | same pattern | AI website builder |
| **Dify** | same pattern | AI app builder |
| **Postiz** | same pattern | Social automation |
| **n8n** | same pattern | Workflow automation |
| **Sentry** | same pattern | Error tracking (mandatory) |
| **PostHog** | same pattern | Product analytics (mandatory) |
| **FireCrawl** | same pattern | Web scraping |
| **Listmonk** | same pattern | Email marketing |
| **Browserless** | same pattern | Headless Chrome |
| **Home Assistant** | (internal) | Smart home |

All services follow `{service}.megabyte.space` pattern. Discoverable via Coolify API.

### Common Coolify Problems (from debugging sessions)
1. Healthcheck failures in Docker compose (10+ conversations)
2. Container file permissions (9999:root pattern)
3. Redirect loops: Cloudflare -> Authentik -> Service
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
| Services needing > 128MB RAM | CF Containers | Coolify |
| Custom networking | CF Mesh | Coolify (complex VLAN) |
| Email marketing | CF Email Service (beta) | Listmonk on Coolify |

**Rule:** Default to Cloudflare. CF Containers GA eliminates most Coolify use cases for new projects. Use Coolify for existing 70+ services and complex self-hosted stacks.

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

## Disaster Recovery for Self-Hosted Services
### Backup Strategy
- Coolify auto-backs up configurations
- PostgreSQL databases: `pg_dump` via cron to R2
- Volumes: periodic tar to R2
- Environment variables: exported and stored encrypted

### Recovery
```bash
# 1. Restore Coolify from backup
# 2. Re-deploy services from docker-compose configs
# 3. Restore database from pg_dump
# 4. Restore volumes from R2 tarballs
# 5. Verify all services healthy
```

See 08/backup-and-disaster-recovery for the full single-zip restore plan.

## Troubleshooting
| Issue | Fix |
|-------|-----|
| Service unreachable | Check `curl $COOLIFY_URL/services/{id}` status |
| Container restarting | Check logs: `docker logs {container_id}` via Coolify UI |
| Out of memory | Scale up Proxmox VM or optimize service config |
| Disk full | Clean Docker: `docker system prune -a` |
| SSL cert expired | Coolify auto-renews via Let's Encrypt; check Traefik logs |
| API timeout | Coolify may be overloaded; check Proxmox CPU/RAM |

## What This Skill Owns
- Coolify API interaction
- Docker service deployment and management
- Self-hosted service orchestration
- Proxmox infrastructure awareness
- When-to-use-Coolify decision logic

