---
name: "heartbeat-polling"
description: "CF Workflows heartbeat polling pattern for long-running container jobs — avoids 25min step timeout"
updated: "2026-04-24"
---

# Heartbeat Polling for Cloudflare Workflows

Cloudflare Workflows have a ~25min per-step timeout and ~1MB step output limit. Long-running jobs (AI builds, batch processing) easily exceed both. Heartbeat polling solves both constraints.

## Pattern

### Step 1: start-job

- POST `/build` to container with payload
- Container starts async work, returns `{ jobId }` immediately (~1s)

### Steps 2..N: heartbeat-{i} (loop, max 120 × 30s = 60min)

- Sleep 30s → GET `/status?jobId=X`
- Returns `{ status, step, elapsed, fileCount, error }`
- Each poll is a tiny step (~5s) — never hits timeout
- Break when `status !== 'running'`

### Step N+1: fetch-result

- GET `/result?jobId=X`
- Upload large output to R2 INSIDE the step (avoids output limit)
- Return only metadata (version string, file count)

## Why This Works

- Each heartbeat step — 30s sleep + 5s fetch = 35s total. Well under 25min limit.
- Step output — ~200 bytes (status JSON). Well under 1MB.
- Total polling — 120 × 30s = 60min max. Configurable via `MAX_POLLS` constant.

## Stable Container IDs

- CF Containers use Durable Object IDs
- Use `idFromName(stableKey)` so all steps talk to the SAME container instance
- **Key pattern** — `${slug}-build-${siteId.slice(0,8)}`
- NEVER create new IDs per step — that spawns new containers

## Step Output Management

- Large data (files, images) must NOT be returned as step output
- Upload to R2/KV inside the step, return only a reference key
- Keeps every step under 1MB and avoids serialization overhead

## Container HTTP Server

- Minimal Node.js HTTP server on port 8080
- Three endpoints:
  - `POST /build` — start async
  - `GET /status` — poll
  - `GET /result` — fetch + cleanup
- Job store is in-memory (container lives for the duration of one build)
- Container cleans up build dir after `/result` is fetched

## Timeout Budgeting

- Container timeout = `timeoutMin × 60000` (default 45min)
- Workflow polls up to `MAX_POLLS × POLL_INTERVAL` (default 60min)
- Always set workflow budget > container budget so the workflow can detect container timeout vs. still-running
- Log elapsed time in heartbeats for debugging

## Error Handling

- Container crash → `/status` returns error or times out → workflow marks site as error
- Build timeout → `MAX_POLLS` exceeded → workflow marks error
- `/result` with 0 files → treated as error even if exit code = 0
