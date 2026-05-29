# Sandbox Execution (***SUPREME — every AI-generated or risky AI-authored code path***)

Generated or risky AI-authored code MUST be built, tested, previewed, and validated in an isolated sandbox BEFORE it touches the real app runtime or the publish pipeline. Untrusted generated code never executes in the main app runtime — full stop.

## The mandate
- AI-authored code is untrusted until a sandbox proves it builds, tests green, and previews clean
- The main app runtime + publish pipeline only ever receive PROMOTED, validated artifacts
- Promotion is one-directional: sandbox → validate → promote. Never the reverse.
- Skipping the sandbox = running unvetted generated code in prod = build fail

## Sandbox capabilities (***the full surface***)
- Create / resume an isolated session
- Read / write files
- Apply patches (diff-based edits)
- Run arbitrary commands (build, install, lint)
- Start a preview server
- Stream logs + file-change events back to the caller
- Run tests (unit + E2E)
- Produce artifacts (build output, screenshots, test reports)
- Promote ONLY validated artifacts to the real runtime / publish pipeline

## Provider interface (***one abstraction, two impls***)
```ts
export interface WebsiteWorkspaceProvider {
  readFile(path: string): Promise<string>;
  writeFile(path: string, contents: string): Promise<void>;
  listFiles(dir?: string): Promise<string[]>;
  applyPatch(patch: string): Promise<void>;
  runCommand?(cmd: string, args?: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }>;
  startPreview?(): Promise<{ url: string; stop: () => Promise<void> }>;
}
```
- `standard-editor-workspace.provider.ts` — in-app editor surface; trusted edits, no isolation needed; `runCommand`/`startPreview` may be no-ops
- `sandbox-workspace.provider.ts` — isolated container; ALL methods implemented; the ONLY provider allowed to execute AI-authored code

## Cloudflare-native fit
- **Isolation** — Containers / Durable Objects (one DO per sandbox session, hard process boundary)
- **Artifacts** — R2 (build output, screenshots, reports keyed by session + build id)
- **Session + build state** — D1 (durable rows) or the session DO's SQLite
- Apply [[god-tier-engineering]] pattern #8 to the sandbox DO: auto-restart ≤3/min + idle-hibernate 30m + 1000-line ring-buffer logs
- Reference: projectsites.dev uses a container build orchestrator as the sandbox; the worker never runs generated code directly

## Promotion gate (***artifacts only, never raw code***)
- Build green + tests green + preview renders clean → artifact is eligible
- Promotion copies the validated R2 artifact to the live path; the generated SOURCE never executes outside the sandbox
- A failed build / red test / dirty preview blocks promotion — fix-forward inside the sandbox, re-validate

## Reference incident (***2026-05-28 — global AI-dev OS upgrade***)
Brian directive to formalize the sandbox-first execution model so every emdash AI-build pipeline runs untrusted generated code in an isolated Container/DO and promotes only validated artifacts, mirroring projectsites.dev's container build orchestrator.

## See
- [[event-sourced-build-progress]] — the sandbox streams typed build events to dashboards
- [[contract-first-ai]] — generated output validated against a contract before promotion
- [[god-tier-engineering]] — pattern #8 (Container DO auto-restart/hibernate/ring-buffer) for the sandbox runtime
- [[verification-loop]] — promotion is gated by the same build + test + preview discipline
- [[full-autonomy]] — spawning + driving sandboxes counts as authorized infrastructure
