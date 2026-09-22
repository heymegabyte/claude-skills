# Archives

Repository for artifacts that are no longer current canon but are preserved for reference, context, or potential revival.

## What goes here

| Type | Examples | Retention |
|---|---|---|
| **Superseded prompts** | A saved prompt that was replaced by a skill. The skill is the canonical version; the prompt text is archived. | Keep the `LEDGER.md` entry live, move the artifact file here. |
| **Overfit skills** | A skill written for one project's idiosyncrasy that couldn't be generalized to the agentskills layer. The `why_not_overfit` justification from `LEDGER.md` proved correct. | Archive when 2+ months without reuse. Remove when the project it overfits to is archived. |
| **Failed experiments** | A skill, prompt, or hook that demonstrably didn't work — produced wrong results, caused drift, or was never used. The failure is informative. | Keep permanently with an `_EXPERIMENT_FAILED.md` companion explaining what was tried and why it didn't work. |
| **Renamed/merged artifacts** | Old versions of skills that were split, merged, or renamed. The current file is canonical; preserved for `git blame` ancestry. | Keep until the next major agentskills version. |
| **Deprecated templates** | Templates superseded by a better template format or workflow. | Keep attached to the superseding template's `Related` section. |

## What does NOT go here

| Never archive | Why |
|---|---|
| **Secrets, API keys, passwords, tokens** | Archives are not encrypted. Secrets live in get-secret / chezmoi / Bitwarden. If a credential accidentally appears in an archived file, redact it immediately and annotate the archive entry. |
| **Sensitive data** | Customer PII, internal system architecture docs that include credentials, internal IPs or hostnames not publicly resolvable. These have no place in any agentskills layer. |
| **Current canonical material** | If a file is the canonical version — the one a trigger loads or a LEDGER entry points to — it's in the working directory, not here. Only move files here when superseded. |
| **Training ephemera** | One-off test outputs, debug logs, temporary notes that were never part of the artifact set. Delete them instead. |

## Naming conventions

- Keep the original filename when archiving a superseded artifact.
- Prepend the archival **YYYY-MM-DD** in ISO format: `2026-06-30--skill-name.md`
- If multiple versions exist, add a sequence number: `2026-06-30--skill-name--v2.md`
- Companions (failure reports, annotations) share the base name with a suffix: `2026-06-30--skill-name--EXPERIMENT_FAILED.md`
- No spaces in filenames. Use double-dash as separator.

## Referencing from current artifacts

When a current skill, rule, or prompt references archived material, use this pattern:

```
See also: `archives/2026-06-30--superseded-prompt.md` — the original prompt that this skill replaced.
Key difference: the original prompt was single-project; the skill is generalized.
```

With links, prefer the full relative path from the `.agentskills` root. Avoid bare filenames — the reader needs to know they're looking at an archive.

## Archive lifecycle

1. **Move** — file moves from its working location to `archives/` with the date prefix.
2. **Annotate** — `LEDGER.md` entry is updated: `"archived": "<YYYY-MM-DD>"` is appended, `"superseded_by": "<new artifact>"` is added if applicable.
3. **Verify** — the new canonical file's `Related` section links to the archive entry.
4. **Remove** — archived files may be deleted after the linked `LEDGER.md` entry is itself superseded or the project generating it is decommissioned. Archives are NOT permanent storage — they are a transition layer.
