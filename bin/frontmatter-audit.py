#!/usr/bin/env python3
"""
~/.claude/bin/frontmatter-audit.py
Bulk-add routing frontmatter (priority, triggers, pack, paths) to every skill + rule.
Deterministic mapping based on filename — review-by-eye if needed.
"""
from pathlib import Path

PLUGIN_DIR = Path.home() / ".claude/plugins/heymegabyte-claude-skills"

# Mapping: filename pattern → frontmatter additions
# priority 1 = always load (~12 files max — tier-1 essentials)
# priority 2 = load when project matches
# priority 3 = load on phrase/embedding match (default)
# priority 4 = reference only, rare
# priority 5 = archive
ROUTING = {
    # Tier-1 ALWAYS (core policy + universal hygiene)
    "01-operating-system": {"priority": 1, "triggers": [], "pack": "core", "paths": ["*"]},
    "rules/brian-preferences": {"priority": 1, "triggers": [], "pack": "core", "paths": ["*"]},
    "rules/always": {"priority": 1, "triggers": [], "pack": "core", "paths": ["*"]},
    "rules/full-autonomy": {"priority": 1, "triggers": [], "pack": "core", "paths": ["*"]},
    "rules/autonomous-engineering": {"priority": 1, "triggers": [], "pack": "core", "paths": ["*"]},
    "rules/verification-loop": {"priority": 1, "triggers": [], "pack": "core", "paths": ["*"]},
    "rules/monitor-orchestration": {"priority": 1, "triggers": [], "pack": "core", "paths": ["*"]},
    "rules/prompt-as-training-signal": {"priority": 1, "triggers": [], "pack": "core", "paths": ["*"]},
    "rules/solo-builder-doctrine": {"priority": 1, "triggers": [], "pack": "core", "paths": ["*"]},
    "rules/main-only-branch": {"priority": 1, "triggers": [], "pack": "core", "paths": ["*"]},
    "rules/no-staging-doctrine": {"priority": 1, "triggers": [], "pack": "core", "paths": ["*"]},
    "rules/ai-permanence": {"priority": 1, "triggers": [], "pack": "core", "paths": ["*"]},

    # Tier-2 — project-type gated
    "rules/frontend-stack": {"priority": 2, "triggers": ["frontend", "react", "angular", "ui"], "pack": "frontend", "paths": ["stack:react-vite", "stack:angular-nx"]},
    "rules/rxjs-first-angular": {"priority": 2, "triggers": ["angular", "rxjs", "observable"], "pack": "angular", "paths": ["stack:angular-nx"]},
    "rules/angular-nx-monorepo": {"priority": 2, "triggers": ["angular", "nx", "monorepo"], "pack": "angular", "paths": ["stack:angular-nx"]},
    "rules/angular-large-app-supervisor": {"priority": 2, "triggers": ["angular"], "pack": "angular", "paths": ["stack:angular-nx"]},
    "rules/spartan-ui-only": {"priority": 2, "triggers": ["spartan", "angular"], "pack": "angular", "paths": ["stack:angular-nx"]},
    "rules/spartan-ui-design-system": {"priority": 2, "triggers": ["spartan ui"], "pack": "angular", "paths": ["stack:angular-nx"]},
    "rules/hono-api": {"priority": 2, "triggers": ["hono", "worker api"], "pack": "backend", "paths": ["concern:hono-stack", "concern:cloudflare-workers"]},
    "rules/code-style": {"priority": 2, "triggers": [], "pack": "core", "paths": ["*"]},
    "rules/zod-everywhere": {"priority": 2, "triggers": ["zod", "validation"], "pack": "backend", "paths": ["*"]},
    "rules/feature-flags": {"priority": 2, "triggers": ["feature flag", "rollout"], "pack": "core", "paths": ["*"]},
    "rules/cloudflare-lock-in-is-leverage": {"priority": 2, "triggers": ["cloudflare", "workers"], "pack": "backend", "paths": ["concern:cloudflare-workers"]},
    "rules/cloudflare-hostable-supervisor": {"priority": 2, "triggers": ["cloudflare"], "pack": "backend", "paths": ["concern:cloudflare-workers"]},
    "rules/payments-routing": {"priority": 2, "triggers": ["stripe", "square", "payment", "billing", "checkout"], "pack": "payments", "paths": ["concern:stripe-billing"]},
    "rules/error-recovery": {"priority": 2, "triggers": ["error", "exception", "rollback", "deploy fail"], "pack": "core", "paths": ["*"]},
    "rules/auto-meta-work": {"priority": 2, "triggers": [], "pack": "core", "paths": ["*"]},
    "rules/model-routing": {"priority": 2, "triggers": ["opus", "sonnet", "haiku", "claude model"], "pack": "ai", "paths": ["*"]},
    "rules/prompt-cache": {"priority": 2, "triggers": ["cache", "preamble"], "pack": "ai", "paths": ["*"]},
    "rules/agent-selection": {"priority": 2, "triggers": ["agent", "specialist", "spawn"], "pack": "core", "paths": ["*"]},
    "rules/parallel-subagent-economy": {"priority": 2, "triggers": ["subagent", "parallel", "fan out"], "pack": "core", "paths": ["*"]},
    "rules/delegate-when-saturated": {"priority": 2, "triggers": ["saturated", "context full"], "pack": "core", "paths": ["*"]},
    "rules/drift-detection": {"priority": 2, "triggers": ["drift"], "pack": "core", "paths": ["*"]},
    "rules/feature-module-architecture": {"priority": 2, "triggers": ["feature module"], "pack": "core", "paths": ["*"]},

    # Quality / testing
    "rules/e2e-tdd-organization": {"priority": 2, "triggers": ["test", "e2e", "playwright", "tdd"], "pack": "testing", "paths": ["concern:e2e-testing"]},
    "rules/e2e-visual-inspection": {"priority": 2, "triggers": ["visual", "screenshot", "ai vision"], "pack": "testing", "paths": ["concern:e2e-testing"]},
    "rules/quality-metrics": {"priority": 2, "triggers": ["lighthouse", "perf", "quality"], "pack": "testing", "paths": ["*"]},

    # Site building
    "rules/website-build-doctrine": {"priority": 3, "triggers": ["build website", "make a website", "build site", "rebuild", "make site"], "pack": "website-build", "paths": ["org:website_build"]},
    "rules/competitor-research": {"priority": 3, "triggers": ["competitor", "benchmark", "rebuild"], "pack": "website-build", "paths": ["org:website_build"]},
    "rules/source-site-enhancement": {"priority": 3, "triggers": ["rebuild", "optimize", "enhance", "modernize", "clone site"], "pack": "website-build", "paths": ["org:website_build"]},
    "rules/i18n-by-demographics": {"priority": 3, "triggers": ["spanish", "portuguese", "i18n", "translate", "locale"], "pack": "website-build", "paths": ["org:website_build"]},
    "rules/thin-source-amplification": {"priority": 3, "triggers": ["thin", "no content", "stub"], "pack": "website-build", "paths": ["org:website_build"]},
    "rules/timeline-authenticity": {"priority": 3, "triggers": ["timeline", "history", "founder"], "pack": "website-build", "paths": ["org:website_build"]},
    "rules/citations": {"priority": 3, "triggers": ["cite", "citation", "apa"], "pack": "content", "paths": ["org:website_build"]},
    "rules/copy-writing": {"priority": 2, "triggers": ["copy", "headline", "cta", "anti-slop"], "pack": "content", "paths": ["*"]},
    "rules/image-quality": {"priority": 3, "triggers": ["image", "photo", "hero image"], "pack": "media", "paths": ["org:website_build"]},
    "rules/text-contrast": {"priority": 2, "triggers": ["contrast", "wcag", "color"], "pack": "design", "paths": ["*"]},
    "rules/logo-contrast": {"priority": 3, "triggers": ["logo"], "pack": "design", "paths": ["org:website_build"]},
    "rules/cinematic-ui-patterns": {"priority": 3, "triggers": ["cinematic", "rolling counter", "stat", "appReveal"], "pack": "design", "paths": ["*"]},
    "rules/gorgeous-by-default": {"priority": 2, "triggers": ["pill", "0.333s", "gorgeous"], "pack": "design", "paths": ["*"]},

    # Polish / improvements
    "rules/supreme-polish": {"priority": 3, "triggers": ["polish", "100 ideas", "audit", "pixel perfect", "meta perfect"], "pack": "polish", "paths": ["*"]},
    "rules/proactive-improvements": {"priority": 2, "triggers": [], "pack": "core", "paths": ["*"]},
    "rules/extra-mile": {"priority": 2, "triggers": [], "pack": "core", "paths": ["*"]},
    "rules/auto-integrate-recs": {"priority": 2, "triggers": [], "pack": "core", "paths": ["*"]},
    "rules/context-spillover": {"priority": 2, "triggers": [], "pack": "core", "paths": ["*"]},

    # Secrets / infra
    "rules/secret-provisioning": {"priority": 2, "triggers": ["secret", "env var", "api key"], "pack": "infra", "paths": ["concern:cloudflare-workers"]},
    "rules/secret-auto-provisioning": {"priority": 3, "triggers": ["provision", "mint token", "stripe webhook secret"], "pack": "infra", "paths": ["concern:cloudflare-workers"]},
    "rules/fetch-defaults": {"priority": 3, "triggers": ["scrape", "web fetch", "curl", "user agent"], "pack": "research", "paths": ["*"]},

    # Ecommerce
    "rules/ecommerce-stack": {"priority": 3, "triggers": ["ecommerce", "shop", "cart", "checkout", "medusa"], "pack": "ecommerce", "paths": ["concern:ecommerce"]},

    # AI / agents
    "rules/contract-first-ai": {"priority": 2, "triggers": ["ai output", "structured output", "tool use"], "pack": "ai", "paths": ["concern:ai-features"]},
    "rules/evals": {"priority": 3, "triggers": ["eval", "regression"], "pack": "ai", "paths": ["concern:ai-features"]},
    "rules/sandbox-execution": {"priority": 3, "triggers": ["sandbox", "untrusted code"], "pack": "ai", "paths": ["concern:ai-features"]},
    "rules/tool-design-as-api": {"priority": 3, "triggers": ["tool", "mcp"], "pack": "ai", "paths": ["*"]},
    "rules/event-sourced-build-progress": {"priority": 3, "triggers": ["build event", "stream"], "pack": "ai", "paths": ["concern:ai-features"]},
    "rules/ai-agent-supervisor": {"priority": 3, "triggers": ["agent supervisor"], "pack": "ai", "paths": ["concern:ai-features"]},
    "rules/ai-seniority": {"priority": 2, "triggers": [], "pack": "core", "paths": ["*"]},

    # Backend / observability supervisors
    "rules/observability-ops-supervisor": {"priority": 3, "triggers": ["observability", "logging", "tracing"], "pack": "backend", "paths": ["*"]},
    "rules/auth-permissions-security-supervisor": {"priority": 3, "triggers": ["auth", "permission", "rbac", "tenant"], "pack": "backend", "paths": ["concern:auth"]},
    "rules/database-data-supervisor": {"priority": 3, "triggers": ["database", "schema", "migration", "d1", "neon"], "pack": "backend", "paths": ["concern:d1-database"]},
    "rules/validation-error-handling-supervisor": {"priority": 3, "triggers": ["validation", "error handler"], "pack": "backend", "paths": ["*"]},
    "rules/workflow-automation-supervisor": {"priority": 3, "triggers": ["workflow", "inngest", "queue", "cron"], "pack": "backend", "paths": ["concern:cloudflare-workers"]},
    "rules/notifications-email-webhooks-supervisor": {"priority": 3, "triggers": ["novu", "notification", "webhook", "email"], "pack": "backend", "paths": ["*"]},
    "rules/forms-editors-content-supervisor": {"priority": 3, "triggers": ["form", "editor", "monaco", "tiptap"], "pack": "backend", "paths": ["*"]},
    "rules/collaboration-sync-supervisor": {"priority": 4, "triggers": ["yjs", "automerge", "collab", "multiplayer"], "pack": "backend", "paths": ["*"]},
    "rules/visualization-maps-diagrams-supervisor": {"priority": 3, "triggers": ["chart", "echarts", "mermaid", "map", "graph"], "pack": "design", "paths": ["*"]},
    "rules/media-file-document-supervisor": {"priority": 3, "triggers": ["upload", "pdf", "image upload"], "pack": "backend", "paths": ["*"]},
    "rules/motion-interaction-supervisor": {"priority": 3, "triggers": ["motion", "animation"], "pack": "design", "paths": ["*"]},
    "rules/crawling-testing-browser-supervisor": {"priority": 3, "triggers": ["crawl", "playwright", "scrape"], "pack": "research", "paths": ["*"]},

    # Stack selector
    "rules/stack-selector": {"priority": 2, "triggers": ["react or angular", "what stack"], "pack": "core", "paths": ["*"]},
    "rules/package-preference-registry": {"priority": 3, "triggers": ["package", "library", "dep"], "pack": "core", "paths": ["*"]},

    # Misc
    "rules/computer-use-safety": {"priority": 2, "triggers": ["computer use", "desktop control", "screen"], "pack": "core", "paths": ["*"]},
    "rules/god-tier-engineering": {"priority": 3, "triggers": [], "pack": "core", "paths": ["*"]},
    "rules/opus-quota-fallback": {"priority": 2, "triggers": ["quota", "fallback"], "pack": "core", "paths": ["*"]},
    "rules/todos-are-roadmap": {"priority": 2, "triggers": ["todo"], "pack": "core", "paths": ["*"]},
    "rules/solo-rituals-eliminated": {"priority": 2, "triggers": [], "pack": "core", "paths": ["*"]},
    "rules/naming-no-transient-prefixes": {"priority": 3, "triggers": ["wave", "rename"], "pack": "core", "paths": ["*"]},
    "rules/supervisor-skills-index": {"priority": 4, "triggers": [], "pack": "core", "paths": ["*"]},

    # SKILLs — tier 2-3 based on usage
    "02-goal-and-brief": {"priority": 2, "triggers": ["new project", "project brief", "goals"], "pack": "core", "paths": ["*"]},
    "03-planning-and-research": {"priority": 2, "triggers": ["research", "plan", "competitor"], "pack": "core", "paths": ["*"]},
    "04-preference-and-memory": {"priority": 2, "triggers": ["remember", "memory", "preference"], "pack": "core", "paths": ["*"]},
    "05-architecture-and-stack": {"priority": 2, "triggers": ["architecture", "stack", "cloudflare", "d1", "workers"], "pack": "backend", "paths": ["concern:cloudflare-workers"]},
    "06-build-and-slice-loop": {"priority": 2, "triggers": ["build feature", "implement", "slice"], "pack": "core", "paths": ["*"]},
    "07-quality-and-verification": {"priority": 2, "triggers": ["test", "verify", "qa", "lighthouse"], "pack": "testing", "paths": ["*"]},
    "08-deploy-and-runtime-verification": {"priority": 2, "triggers": ["deploy", "wrangler deploy", "rollback"], "pack": "core", "paths": ["concern:cloudflare-workers"]},
    "09-brand-and-content-system": {"priority": 3, "triggers": ["brand", "content", "copy"], "pack": "content", "paths": ["org:website_build", "concern:public_facing"]},
    "10-experience-and-design-system": {"priority": 3, "triggers": ["design", "ui", "components", "theme"], "pack": "design", "paths": ["concern:public_facing"]},
    "11-motion-and-interaction-system": {"priority": 3, "triggers": ["motion", "animation", "transition"], "pack": "design", "paths": ["concern:public_facing"]},
    "12-media-orchestration": {"priority": 3, "triggers": ["image gen", "dalle", "media", "og image"], "pack": "media", "paths": ["org:website_build"]},
    "13-observability-and-growth": {"priority": 2, "triggers": ["posthog", "sentry", "analytics", "stripe", "growth"], "pack": "backend", "paths": ["*"]},
    "14-independent-idea-engine": {"priority": 3, "triggers": ["what else", "ideas", "co-founder"], "pack": "core", "paths": ["*"]},
    "15-site-generation": {"priority": 3, "triggers": ["site generation", "bolt artifact", "boltArtifact"], "pack": "website-build", "paths": ["org:website_build"]},
    "16-cinematic-website-prime-directive": {"priority": 3, "triggers": ["make a website", "build a site", "rebuild", "make site for", "build site for"], "pack": "website-build", "paths": ["org:website_build"]},
}

DEFAULT = {"priority": 3, "triggers": [], "pack": "misc", "paths": ["*"]}


def parse_frontmatter(text: str) -> tuple[dict | None, list[str], str]:
    """Return (fm_dict, fm_lines, body)."""
    if not text.startswith("---\n"):
        return None, [], text
    end = text.find("\n---\n", 4)
    if end == -1:
        return None, [], text
    fm_block = text[4:end]
    body = text[end + 5:]
    fm_lines = fm_block.split("\n")
    # Parse minimally for current values
    fm = {}
    for line in fm_lines:
        if ":" in line and not line.lstrip().startswith("#") and not line.startswith(" "):
            key, _, val = line.partition(":")
            fm[key.strip()] = val.strip().strip('"\'')
    return fm, fm_lines, body


def write_frontmatter(routing: dict, existing_lines: list[str]) -> list[str]:
    """Insert/replace priority, triggers, pack, paths lines while preserving others."""
    # Strip lines we'll regenerate
    keep = []
    skip_until_dedent = False
    for line in existing_lines:
        if skip_until_dedent:
            if not line.startswith(" ") and not line.startswith("\t"):
                skip_until_dedent = False
            else:
                continue
        if line.startswith(("priority:", "pack:")):
            continue
        if line.startswith("triggers:"):
            skip_until_dedent = True
            continue
        if line.startswith("paths:"):
            skip_until_dedent = True
            continue
        keep.append(line)
    # Append new fields
    out = list(keep)
    out.append(f"priority: {routing['priority']}")
    out.append(f"pack: \"{routing['pack']}\"")
    if routing["triggers"]:
        out.append("triggers:")
        for t in routing["triggers"]:
            out.append(f'  - "{t}"')
    else:
        out.append("triggers: []")
    if routing["paths"]:
        out.append("paths:")
        for p in routing["paths"]:
            out.append(f'  - "{p}"')
    else:
        out.append("paths: []")
    return out


def process_file(path: Path, skill_id: str) -> bool:
    routing = ROUTING.get(skill_id, DEFAULT)
    text = path.read_text()
    fm, fm_lines, body = parse_frontmatter(text)

    if fm is None:
        # No frontmatter — add one
        new_fm = ["---"]
        new_fm.append(f"name: \"{skill_id.replace('rules/', '')}\"")
        new_fm.append(f"priority: {routing['priority']}")
        new_fm.append(f"pack: \"{routing['pack']}\"")
        if routing["triggers"]:
            new_fm.append("triggers:")
            for t in routing["triggers"]:
                new_fm.append(f'  - "{t}"')
        else:
            new_fm.append("triggers: []")
        if routing["paths"]:
            new_fm.append("paths:")
            for p in routing["paths"]:
                new_fm.append(f'  - "{p}"')
        else:
            new_fm.append("paths: []")
        new_fm.append("---")
        new_text = "\n".join(new_fm) + "\n\n" + text
    else:
        new_lines = write_frontmatter(routing, fm_lines)
        new_text = "---\n" + "\n".join(new_lines) + "\n---\n" + body

    if new_text != text:
        path.write_text(new_text)
        return True
    return False


def main():
    changed = 0
    skipped = 0

    # SKILLs
    for skill_md in sorted(PLUGIN_DIR.glob("*/SKILL.md")):
        skill_id = skill_md.parent.name
        if process_file(skill_md, skill_id):
            changed += 1
        else:
            skipped += 1

    # Rules
    for rule_md in sorted((PLUGIN_DIR / "rules").glob("*.md")):
        skill_id = "rules/" + rule_md.stem
        if process_file(rule_md, skill_id):
            changed += 1
        else:
            skipped += 1

    print(f"frontmatter audit: {changed} updated, {skipped} unchanged")


if __name__ == "__main__":
    main()
