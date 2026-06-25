# DockerSlim All Containers

Every custom Dockerfile we author is **linted with Hadolint** before it builds, and every custom image we BUILD-AND-PUSH (registry-deployed containers, local/dev images, CI sidecars) is minified with **DockerSlim (`slim build`)** and **functional-tested still-working** before it ships. A Dockerfile with Hadolint errors does not build; a slimmed image that fails its smoke test is NOT shipped — the slim is reverted, never the functionality.

Cross-links: `[[cloudflare-lock-in-is-leverage]]` `[[verification-loop]]` `[[supply-chain-integrity]]` `[[cost-per-request-accountability]]` `[[lint-doctrine]]`

## The mandate

- **Lint every Dockerfile with Hadolint FIRST** — `hadolint <Dockerfile>` before any `docker build`. It catches unpinned base tags/apt versions, missing `--no-install-recommends`, `ADD`-where-`COPY`, root-user runtime, shell-form `CMD`, layer-cache busters, and `latest` tags. Wire it into lefthook + CI (`hadolint **/Dockerfile*`); a DL-code error fails the build. Pin the base image by digest, run as non-root, `--no-install-recommends` + clean apt lists in the same layer — most Hadolint findings ARE the slimming win restated. Install: `brew install hadolint`. (Per `[[lint-doctrine]]` § Shell + ops.)
- **Slim every custom image** — `slim build --http-probe` (or `--exec`/`--include-path` for non-HTTP) produces a `.slim` image with only the files the running container actually touches (typically 10–30× smaller, smaller attack surface).
- **Functional-test the slimmed image** — the slim is only accepted if the container still boots AND serves its real workload (HTTP 2xx on its health/route, or its CLI entrypoint exits 0). No test = no ship.
- **Slim ≠ break** — DockerSlim drops files the probe didn't exercise; if the app uses a path lazily (a rarely-hit route, a runtime `require`, a spawned binary), add it via `--include-path`/`--include-bin`/`--include-exe` and re-probe. Never ship a slim that 500s a real path.
- **Install once:** `brew install docker-slim` (macOS) or `curl -sL https://raw.githubusercontent.com/slimtoolkit/slim/master/scripts/install-slim.sh | sudo -E bash -`. Binary is `slim` (the project renamed from `docker-slim` → SlimToolkit).

## CRITICAL caveat — Cloudflare Containers build FROM the Dockerfile (slim doesn't feed them)

- A CF Workers Container declared `image = "./Dockerfile"` in `wrangler.toml` is **rebuilt by Cloudflare's own pipeline on `wrangler deploy`** — it does NOT consume a locally-built `.slim` image. `slim build` on it produces an artifact CF never pulls.
- **Therefore the slim lever for CF containers is Dockerfile optimization, not `slim build`:** slim/alpine base (`node:22-alpine` / `-bookworm-slim`), multi-stage (build deps → copy only `dist` + `node_modules --omit=dev` into the final stage), `.dockerignore` everything not needed, no apt cache layers, pin + prune. Then `slim build` is used only to MEASURE what's unused (run it locally, read the report, fold the deletions back into the Dockerfile by hand).
- **`slim build` DOES ship the image** for: registry-pushed images (you build → slim → `docker push` the `.slim` → CF/Fly/anything pulls the registry ref), local dev containers, CI sidecars, and any image consumed as a pre-built artifact rather than built-from-Dockerfile.

## The pipeline (per image)

```bash
# 1. Build the fat image
docker build -t myimg:fat -f path/Dockerfile path/

# 2. Slim it — HTTP server: probe the live routes; CLI: drive the entrypoint
slim build --http-probe --http-probe-cmd '/health' --target myimg:fat --tag myimg:slim   # server
slim build --exec 'node dist/cli.js --version' --target myimg:fat --tag myimg:slim        # CLI

# 3. Functional-test the SLIM (the gate)
docker run -d --rm -p 8099:8080 --name slimtest myimg:slim
curl -fsS http://localhost:8099/health   # MUST 2xx — else add --include-path and re-slim
docker rm -f slimtest

# 4. Size delta (report it)
docker images myimg --format '{{.Tag}} {{.Size}}'
```

- **Include-list escape hatch** when the probe under-covers: `--include-path /app/templates --include-bin /usr/bin/git --include-exe node --include-shell`.
- **CI:** run `bin/slim-containers.sh --check` (build + slim + smoke every canonical Dockerfile) on any Dockerfile change; fail the build if a slim image fails its smoke test or grows.

## Reference impl (projectsites.dev, 2026-06-19)

- `apps/project-sites/scripts/slim-containers.sh` — enumerates the canonical Dockerfiles (skips `.claude/worktrees/*` dupes), installs `slim` if missing, builds → `slim build` → smoke-tests → prints size deltas. CF-container Dockerfiles are MEASURED (report only, fold deltas into the Dockerfile); push-deployed images are SHIPPED slim.
- The two CF containers (`./Dockerfile`, `./containers/app-runtime/Dockerfile`) already run slim/alpine multi-stage bases — their win is Dockerfile-level, per the caveat above.

## Audit cadence

- Any new `Dockerfile*` (not under `node_modules/` or `.claude/worktrees/`) → add to the slim script + smoke-test it the same turn (`[[drift-detection]]`).
- Re-measure on base-image bumps — a new base can re-introduce unused weight.
