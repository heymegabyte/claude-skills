---
description: Scaffold a new spawnable specialist agent def and register it in the agent taxonomy
argument-hint: <agent name + role>
---

Scaffold a new specialist agent per [[agent-selection]] (anti-inflation: only when a role RECURS).

**Purpose** — turn a recurring role into a reusable, well-scoped spawnable agent def.

**When to use** — a role appeared in ≥2 runs and was handled ad-hoc by a generic worker. NOT for one-off roles (agent inflation is the failure mode).

**Inputs** — `$ARGUMENTS` = proposed agent name + role description.

Steps:

- Confirm recurrence first — if it's one-off, STOP and surface as a Rec instead.
- Write `~/.claude/agents/<name>.md` with frontmatter: `name`, `description`, `tools`, `model`, `effort` (+ `model_fallback`/`effort_fallback` if Opus-pinned per [[opus-quota-fallback]]).
- Body = system prompt + labeled sections: Purpose · Triggers · Non-goals · Inputs · Outputs (≤200-word summary contract) · Verification.
- Register the agent in the [[agent-selection]] taxonomy (routing table + when-to-use row).
- Cross-link `[[agent-selection]]` and any sibling agents.

**Outputs** — the new agent file path + the taxonomy edit + `[[backlinks]]`.

**Verification** — agent file has valid frontmatter (`head -8`); taxonomy edit committed in `~/.agentskills`; agent is spawnable by name.

**Can update ~/.agentskills or ~/.claude?** YES — writes the agent def under `~/.claude/agents/` and updates the taxonomy.

> ⚠️ **File-writing guard** — `~/.claude/{agents,commands,rules,skills}` are SYMLINKS into `~/.claude/plugins/heymegabyte-claude-skills/`. Author new files with the **Write tool only**, writing to the plugin path. NEVER `ln`/`ln -s` into a symlinked dir — it creates a circular self-symlink ("too many levels of symbolic links") and loses the content. (Reference incident 2026-05-28: a command-author agent ran `ln` and broke `dashboard-cockpit.md`; recovered by re-Writing as a plain file.)
