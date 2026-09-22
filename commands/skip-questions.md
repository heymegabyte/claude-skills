---
description: Suppress 5-question enforcement for rapid sessions
argument-hint: ""
---

# Skip Questions Mode

Disable the 5-clarifying-questions enforcement hooks for the remainder of this session. Use when iterating rapidly and questions would disrupt flow.

**What it does:**

- Instructs Claude to ignore the 5-question requirement for this session
- The Stop hook will still fire but Claude will acknowledge the skip
- The UserPromptSubmit priming hook is acknowledged but its reminder is disregarded

**To re-enable:** start a new session, or explicitly ask Claude to resume asking 5 questions.

**Session only** — does not persist across restarts.
