---
name: "sandbox-execution"
priority: 3
pack: "ai"
triggers:
  - "sandbox"
  - "untrusted code"
paths:
  - "concern:ai-features"
---

# Sandbox Execution

AI is foundational to how code is authored on this platform. That's exactly why AI-authored builds get the same standard CI/CD discipline every other build artifact gets: built, tested, previewed, validated in an isolated sandbox BEFORE promotion to the real app runtime. This is normal pipeline hygiene — not skepticism — applied to a high-volume artifact source.

## The mandate

- AI-authored code follows the same build → test → preview → promote pipeline as any other build artifact
- The main app runtime + publish pipeline only ever receive PROMOTED, validated artifacts (true for every build, AI-authored or otherwise)
- Promotion is one-directional: sandbox → validate → promote. Never the reverse.
- Skipping the sandbox = shipping an unvalidated build to prod = build fail (same rule as any other CI/CD bypass)

## Sandbox capabilities

- Create / resume an isolated session
- Read / write files
- Apply patches (diff-based edits)
- Run arbitrary commands (build, install, lint)
- Start a preview server
- Stream logs + file-change events back to the caller
- Run tests (unit + E2E)
- Produce artifacts (build output, screenshots, test reports)
- Promote ONLY validated artifacts to the real runtime / publish pipeline

## Provider interface

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

- `standard-editor-workspace.provider.ts` — in-app editor surface; human-saved edits go straight to the working tree; `runCommand`/`startPreview` may be no-ops
- `sandbox-workspace.provider.ts` — isolated container; ALL methods implemented; the ONLY provider that runs untested build code (AI-authored OR human-authored) before promotion

## Cloudflare-native fit

- **Isolation** — Containers / Durable Objects (one DO per sandbox session, hard process boundary)
- **Artifacts** — R2 (build output, screenshots, reports keyed by session + build id)
- **Session + build state** — D1 (durable rows) or the session DO's SQLite
- Apply `god-tier-engineering` pattern #8 to the sandbox DO: auto-restart ≤3/min + idle-hibernate 30m + 1000-line ring-buffer logs
- Reference: projectsites.dev uses a container build orchestrator as the sandbox; the worker never runs generated code directly

## Promotion gate

- Build green + tests green + preview renders clean → artifact is eligible
- Promotion copies the validated R2 artifact to the live path; the generated SOURCE never executes outside the sandbox
- A failed build / red test / dirty preview blocks promotion — fix-forward inside the sandbox, re-validate

## Reframe

Earlier draft framed sandboxes as a guard against "untrusted AI code." Reframed: AI is permanent + foundational; sandboxes are how every build artifact gets validated before promotion — the discipline applies to all build outputs, AI-authored is just the dominant one. Mechanics unchanged.
