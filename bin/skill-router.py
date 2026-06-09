#!/usr/bin/env python3
"""
~/.claude/bin/skill-router.py
Unified skill router. Loaded by hooks. Provides:
  - Embedding-based semantic top-K (#1)
  - Project fingerprint detection (#2)
  - Phrase-trigger matching (#3)
  - Tier budget enforcement (#4)
  - Pack expansion (#5)
  - Per-tool routing (#6)
  - Session skill caching (#9)

Usage:
  skill-router.py rebuild-index        # Generate embeddings for every skill/rule
  skill-router.py fingerprint <cwd>    # Emit project fingerprint JSON
  skill-router.py route <prompt> [--cwd PATH] [--cache PATH] [--tool TOOL]
                                       # Resolve full skill manifest for a prompt
  skill-router.py track <skill_id>     # Append used skill to session cache
"""
import hashlib
import json
import os
import re
import sqlite3
import subprocess
import sys
import time
from pathlib import Path
from urllib.error import URLError
from urllib.request import Request, urlopen

# -----------------------------------------------------------------------------
# Paths
# -----------------------------------------------------------------------------
HOME = Path.home()
CLAUDE_DIR = HOME / ".claude"
PLUGIN_DIR = CLAUDE_DIR / "plugins" / "heymegabyte-claude-skills"
DATA_DIR = CLAUDE_DIR / "data"
PROJECTS_DIR = CLAUDE_DIR / "projects"
PACKS_DIR = PLUGIN_DIR / "_packs"
DB_PATH = DATA_DIR / "skills.db"

# OpenAI embedding model
EMBED_MODEL = "text-embedding-3-small"  # $0.02 / 1M tokens
EMBED_DIM = 1536

# Token budget for preamble routing
DEFAULT_BUDGET_TOKENS = 40_000

# -----------------------------------------------------------------------------
# Secrets
# -----------------------------------------------------------------------------
def get_secret(key: str) -> str | None:
    """Use Brian's get-secret helper."""
    try:
        out = subprocess.run(
            ["/Users/Apple/.local/bin/get-secret", key],
            capture_output=True, text=True, timeout=5,
        )
        val = out.stdout.strip()
        if val.startswith('The file "'):
            return None
        return val or None
    except Exception:
        return None


# -----------------------------------------------------------------------------
# Frontmatter parser
# -----------------------------------------------------------------------------
def parse_frontmatter(text: str) -> tuple[dict, str]:
    """Return (frontmatter_dict, body)."""
    if not text.startswith("---\n"):
        return {}, text
    end = text.find("\n---\n", 4)
    if end == -1:
        return {}, text
    fm_block = text[4:end]
    body = text[end + 5:]
    # Minimal YAML — only what we use
    fm: dict = {}
    current_list = None
    for line in fm_block.split("\n"):
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if line.startswith("  - "):
            if current_list is not None:
                current_list.append(line[4:].strip().strip('"\''))
            continue
        if ":" not in line:
            continue
        key, _, val = line.partition(":")
        key = key.strip()
        val = val.strip().strip('"\'')
        if not val:
            # Could be a list start
            current_list = []
            fm[key] = current_list
        else:
            current_list = None
            # Strip enclosing quotes from val
            fm[key] = val
    return fm, body


def discover_skills() -> list[dict]:
    """Walk the plugin dir, return list of {id, type, path, name, description, priority, triggers, paths, pack, body}."""
    out = []
    # SKILL.md files
    for skill_md in sorted(PLUGIN_DIR.glob("*/SKILL.md")):
        try:
            text = skill_md.read_text()
        except OSError:
            continue
        fm, body = parse_frontmatter(text)
        skill_id = skill_md.parent.name
        out.append({
            "id": skill_id,
            "type": "skill",
            "path": str(skill_md.relative_to(PLUGIN_DIR)),
            "name": fm.get("name", skill_id),
            "description": fm.get("description", ""),
            "priority": int(fm.get("priority", 3) or 3),
            "triggers": fm.get("triggers", []) if isinstance(fm.get("triggers"), list) else [],
            "paths": fm.get("paths", []) if isinstance(fm.get("paths"), list) else [],
            "pack": fm.get("pack", ""),
            "body": body,
        })
    # Rule files
    for rule_md in sorted((PLUGIN_DIR / "rules").glob("*.md")):
        try:
            text = rule_md.read_text()
        except OSError:
            continue
        fm, body = parse_frontmatter(text)
        rid = "rules/" + rule_md.stem
        out.append({
            "id": rid,
            "type": "rule",
            "path": str(rule_md.relative_to(PLUGIN_DIR)),
            "name": rule_md.stem,
            "description": fm.get("description", ""),
            "priority": int(fm.get("priority", 3) or 3),
            "triggers": fm.get("triggers", []) if isinstance(fm.get("triggers"), list) else [],
            "paths": fm.get("paths", []) if isinstance(fm.get("paths"), list) else [],
            "pack": fm.get("pack", ""),
            "body": body,
        })
    return out


# -----------------------------------------------------------------------------
# Embeddings (OpenAI text-embedding-3-small)
# -----------------------------------------------------------------------------
def embed_text(text: str, api_key: str) -> list[float]:
    """One embedding via OpenAI HTTPS — no SDK dependency."""
    payload = json.dumps({"input": text[:8000], "model": EMBED_MODEL}).encode()
    req = Request(
        "https://api.openai.com/v1/embeddings",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urlopen(req, timeout=15) as r:
        data = json.loads(r.read())
    return data["data"][0]["embedding"]


def cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b, strict=False))
    na = sum(x * x for x in a) ** 0.5
    nb = sum(y * y for y in b) ** 0.5
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


# -----------------------------------------------------------------------------
# SQLite store
# -----------------------------------------------------------------------------
SCHEMA = """
CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  path TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 3,
  triggers TEXT NOT NULL DEFAULT '[]',
  paths TEXT NOT NULL DEFAULT '[]',
  pack TEXT NOT NULL DEFAULT '',
  body_hash TEXT NOT NULL,
  embedding TEXT,
  tokens INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
"""


def db_open() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(SCHEMA)
    return conn


def body_hash(body: str) -> str:
    return hashlib.sha256(body.encode()).hexdigest()


def estimate_tokens(s: str) -> int:
    # Rough estimate: 1 token ≈ 4 chars
    return max(1, len(s) // 4)


def cmd_rebuild_index():
    """Generate embeddings for every skill/rule. Idempotent — skips unchanged bodies."""
    api_key = get_secret("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY not in get-secret", file=sys.stderr)
        sys.exit(1)
    conn = db_open()
    skills = discover_skills()
    print(f"[skill-router] indexing {len(skills)} skills/rules")
    updated = 0
    skipped = 0
    for s in skills:
        h = body_hash(s["body"])
        cur = conn.execute("SELECT body_hash FROM skills WHERE id=?", (s["id"],))
        row = cur.fetchone()
        if row and row[0] == h:
            skipped += 1
            continue
        # Build embedding input: description + first 4000 chars of body
        embed_input = f"{s['name']}\n{s['description']}\n{s['body'][:4000]}"
        try:
            emb = embed_text(embed_input, api_key)
        except URLError as e:
            print(f"[skill-router] embed failed for {s['id']}: {e}", file=sys.stderr)
            continue
        conn.execute(
            """INSERT OR REPLACE INTO skills
               (id, type, path, name, description, priority, triggers, paths, pack,
                body_hash, embedding, tokens, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                s["id"], s["type"], s["path"], s["name"], s["description"],
                s["priority"],
                json.dumps(s["triggers"]),
                json.dumps(s["paths"]),
                s["pack"],
                h,
                json.dumps(emb),
                estimate_tokens(s["body"]),
                int(time.time()),
            ),
        )
        updated += 1
        print(f"  [{updated}/{len(skills)}] {s['id']}", file=sys.stderr)
    conn.execute("INSERT OR REPLACE INTO meta(key, value) VALUES('last_rebuild', ?)",
                 (str(int(time.time())),))
    conn.commit()
    conn.close()
    print(f"[skill-router] done — {updated} updated, {skipped} skipped")


# -----------------------------------------------------------------------------
# Project fingerprint (#2)
# -----------------------------------------------------------------------------
def cmd_fingerprint(cwd: str | None = None) -> dict:
    """Inspect cwd; return {stack, concerns, scale, org_type, has_payments, …}."""
    cwd_p = Path(cwd or os.getcwd()).resolve()
    fp = {
        "cwd": str(cwd_p),
        "stack": "unknown",
        "concerns": [],
        "scale": "solo",
        "has_payments": False,
        "has_ai": False,
        "has_auth": False,
        "is_website_build": False,
        "is_internal_app": False,
        "is_nonprofit": False,
        "is_saas": False,
        "frameworks": [],
        "languages": [],
    }
    if not cwd_p.exists():
        return fp

    # package.json signals
    pkg_path = cwd_p / "package.json"
    if pkg_path.exists():
        try:
            pkg = json.loads(pkg_path.read_text())
            deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
            if "@angular/core" in deps:
                fp["stack"] = "angular-nx"
                fp["frameworks"].append("angular")
            elif "react" in deps and "vite" in deps:
                fp["stack"] = "react-vite"
                fp["frameworks"].append("react")
            elif "next" in deps:
                fp["stack"] = "react-next"
                fp["frameworks"].append("next")
            elif "astro" in deps:
                fp["stack"] = "astro"
                fp["frameworks"].append("astro")
            elif "hono" in deps and not deps.get("react"):
                fp["stack"] = "hono-only"
                fp["frameworks"].append("hono")
            if "stripe" in deps or "@stripe/stripe-js" in deps:
                fp["has_payments"] = True
                fp["concerns"].append("stripe-billing")
            if "@anthropic-ai/sdk" in deps or "openai" in deps:
                fp["has_ai"] = True
                fp["concerns"].append("ai-features")
            if "@clerk/clerk-sdk-node" in deps or "@clerk/backend" in deps:
                fp["has_auth"] = True
                fp["concerns"].append("auth")
            if "@hono/zod-validator" in deps or "drizzle-orm" in deps:
                fp["concerns"].append("hono-stack")
            if "playwright" in deps or "@playwright/test" in deps:
                fp["concerns"].append("e2e-testing")
            fp["languages"].append("typescript" if (cwd_p / "tsconfig.json").exists() else "javascript")
        except Exception:
            pass

    # wrangler signal
    if (cwd_p / "wrangler.toml").exists() or (cwd_p / "wrangler.jsonc").exists():
        fp["concerns"].append("cloudflare-workers")
        try:
            for f in ("wrangler.toml", "wrangler.jsonc"):
                p = cwd_p / f
                if p.exists():
                    content = p.read_text().lower()
                    if "d1_database" in content:
                        fp["concerns"].append("d1-database")
                    if "r2_bucket" in content:
                        fp["concerns"].append("r2-storage")
                    if "[ai]" in content or '"ai"' in content:
                        fp["concerns"].append("workers-ai")
        except Exception:
            pass

    # Python project signals
    if (cwd_p / "pyproject.toml").exists() or (cwd_p / "requirements.txt").exists():
        fp["languages"].append("python")
        if fp["stack"] == "unknown":
            fp["stack"] = "python"

    # Marker file signals
    for f in cwd_p.iterdir():
        if not f.is_file():
            continue
        name = f.name.lower()
        if name in {"_research.json", "_brand.json", "_url_inventory.json", "_competitor_aggregate.json"}:
            fp["is_website_build"] = True
            fp["concerns"].append("website-build")
        if name in {"form_990.pdf", "_nonprofit.json"} or "nonprofit" in name:
            fp["is_nonprofit"] = True

    # CLAUDE.md signals
    claude_md = cwd_p / "CLAUDE.md"
    if claude_md.exists():
        try:
            content = claude_md.read_text().lower()
            if "saas" in content or "subscription" in content or "pricing" in content:
                fp["is_saas"] = True
            if "nonprofit" in content or "501(c)(3)" in content or "donation" in content:
                fp["is_nonprofit"] = True
            if "internal" in content and ("dashboard" in content or "admin" in content):
                fp["is_internal_app"] = True
        except Exception:
            pass

    # Dedupe concerns
    fp["concerns"] = list(dict.fromkeys(fp["concerns"]))
    fp["frameworks"] = list(dict.fromkeys(fp["frameworks"]))
    fp["languages"] = list(dict.fromkeys(fp["languages"]))

    return fp


def fingerprint_path(cwd: str) -> Path:
    """Cached fingerprint path per encoded cwd."""
    encoded = cwd.replace("/", "-").lstrip("-")
    return PROJECTS_DIR / encoded / "fingerprint.json"


def session_cache_path(cwd: str, session_id: str = "default") -> Path:
    encoded = cwd.replace("/", "-").lstrip("-")
    return PROJECTS_DIR / encoded / f"active-skills-{session_id}.json"


# -----------------------------------------------------------------------------
# Pack resolution (#5)
# -----------------------------------------------------------------------------
def resolve_pack(pack_name: str) -> list[str]:
    """Read pack YAML; return list of skill IDs."""
    pack_file = PACKS_DIR / f"{pack_name}.yml"
    if not pack_file.exists():
        return []
    out = []
    in_members = False
    for line in pack_file.read_text().split("\n"):
        if line.startswith("members:"):
            in_members = True
            continue
        if in_members:
            if line.startswith("  - "):
                out.append(line[4:].strip())
            elif line and not line.startswith(" "):
                in_members = False
    return out


def all_packs() -> dict[str, list[str]]:
    if not PACKS_DIR.exists():
        return {}
    return {p.stem: resolve_pack(p.stem) for p in PACKS_DIR.glob("*.yml")}


# -----------------------------------------------------------------------------
# Per-tool routing (#6)
# -----------------------------------------------------------------------------
TOOL_TO_SKILLS = {
    # Playwright tools → testing skills
    "mcp__playwright__": ["07-quality-and-verification", "rules/e2e-tdd-organization",
                          "rules/e2e-visual-inspection", "rules/verification-loop"],
    "mcp__plugin_playwright_": ["07-quality-and-verification", "rules/e2e-tdd-organization"],
    # CF tools → CF skills
    "mcp__plugin_cloudflare_": ["05-architecture-and-stack", "rules/cloudflare-lock-in-is-leverage",
                                 "rules/hono-api", "08-deploy-and-runtime-verification"],
    # Sentry → observability
    "mcp__plugin_sentry_": ["13-observability-and-growth", "rules/auto-meta-work"],
    "mcp__sentry__": ["13-observability-and-growth", "rules/error-recovery"],
    # Stripe → payments
    "mcp__stripe__": ["13-observability-and-growth", "rules/payments-routing"],
    # PostHog → analytics
    "mcp__posthog__": ["13-observability-and-growth", "rules/auto-meta-work"],
    # Resend → email
    "mcp__plugin_resend_": ["13-observability-and-growth", "rules/auto-meta-work"],
    "mcp__resend__": ["13-observability-and-growth"],
    # Computer use → safety
    "mcp__desktop-control__": ["rules/computer-use-safety", "rules/full-autonomy"],
    "mcp__computer-use__": ["rules/computer-use-safety", "rules/full-autonomy"],
    # GitHub → repo + CI
    "mcp__github__": ["08-deploy-and-runtime-verification", "rules/main-only-branch"],
    "mcp__github-mcp__": ["08-deploy-and-runtime-verification"],
    # Research
    "WebFetch": ["03-planning-and-research", "rules/fetch-defaults"],
    "WebSearch": ["03-planning-and-research"],
    "mcp__tavily__": ["03-planning-and-research"],
    "mcp__firecrawl__": ["03-planning-and-research", "rules/fetch-defaults"],
    # Bash with specific commands
    "Bash:wrangler": ["05-architecture-and-stack", "08-deploy-and-runtime-verification",
                       "rules/cloudflare-lock-in-is-leverage"],
    "Bash:npm test": ["07-quality-and-verification", "rules/e2e-tdd-organization"],
    "Bash:npm run e2e": ["07-quality-and-verification", "rules/e2e-tdd-organization"],
    "Bash:npm run deploy": ["08-deploy-and-runtime-verification", "rules/verification-loop"],
}


def tool_to_skills(tool: str, command: str = "") -> list[str]:
    """Map tool + optional command to skill list."""
    out = []
    # Direct prefix match
    for pat, skills in TOOL_TO_SKILLS.items():
        if ":" in pat:
            t, _, c = pat.partition(":")
            if tool == t and c in command:
                out.extend(skills)
        elif tool.startswith(pat) or tool == pat:
            out.extend(skills)
    return list(dict.fromkeys(out))


# -----------------------------------------------------------------------------
# Phrase trigger matching (#3)
# -----------------------------------------------------------------------------
def match_triggers(prompt: str, conn: sqlite3.Connection) -> list[str]:
    """Return skill IDs whose trigger phrases match the prompt."""
    prompt_lower = prompt.lower()
    cur = conn.execute("SELECT id, triggers FROM skills WHERE triggers != '[]'")
    out = []
    for sid, triggers_json in cur.fetchall():
        try:
            triggers = json.loads(triggers_json)
        except json.JSONDecodeError:
            continue
        for trig in triggers:
            t = trig.lower()
            # Support {placeholder} = wildcard
            pattern = re.escape(t).replace(r"\{[^}]+\}", r"[^\s]+")
            if re.search(pattern, prompt_lower):
                out.append(sid)
                break
    return out


# -----------------------------------------------------------------------------
# Top-K embedding search (#1)
# -----------------------------------------------------------------------------
def embedding_topk(prompt: str, conn: sqlite3.Connection, k: int = 8) -> list[tuple[str, float]]:
    """Return [(skill_id, similarity)] sorted desc."""
    api_key = get_secret("OPENAI_API_KEY")
    if not api_key:
        return []
    try:
        prompt_emb = embed_text(prompt, api_key)
    except URLError:
        return []
    out = []
    cur = conn.execute("SELECT id, embedding FROM skills WHERE embedding IS NOT NULL")
    for sid, emb_json in cur.fetchall():
        try:
            emb = json.loads(emb_json)
        except json.JSONDecodeError:
            continue
        sim = cosine(prompt_emb, emb)
        out.append((sid, sim))
    out.sort(key=lambda x: -x[1])
    return out[:k]


# -----------------------------------------------------------------------------
# Tier budget (#4)
# -----------------------------------------------------------------------------
REASON_PRIORITY_BUMP = {
    "tier-1 always": 0,         # tier-1 essentials (keep at base)
    "trigger-match": -3,        # explicit phrase = strong signal — loads first
    "pack:": -3,                # pack named in prompt — loads first
    "semantic": -2,             # embedding top-K — high confidence
    "tool:": -2,                # tool-activated — relevant to current op
    "session-cache": -1,        # known to be used recently — soft prefer
    "path-match": 0,            # paths-wildcard doesn't bump
}


def reason_priority(reason: str, base_priority: int) -> float:
    """Apply reason-based priority bump. Lower = loads first."""
    for prefix, bump in REASON_PRIORITY_BUMP.items():
        if reason.startswith(prefix):
            return base_priority + bump
    return base_priority


def apply_budget(selections: list[tuple[str, str]], conn: sqlite3.Connection,
                 budget_tokens: int = DEFAULT_BUDGET_TOKENS) -> list[str]:
    """Filter skill set to fit under budget; sort by (reason-adjusted) priority asc.
    selections = [(skill_id, reason)]"""
    if not selections:
        return []
    skill_ids = [s[0] for s in selections]
    reason_map = dict(selections)
    cur = conn.execute(
        f"SELECT id, priority, tokens FROM skills WHERE id IN ({','.join('?' * len(skill_ids))})",
        skill_ids,
    )
    rows = []
    for sid, pri, toks in cur.fetchall():
        eff_pri = reason_priority(reason_map.get(sid, ""), pri)
        rows.append((sid, eff_pri, toks))
    # Sort by effective priority asc, then size asc (load smaller first within tier to fit more)
    rows.sort(key=lambda r: (r[1], r[2]))
    out = []
    used = 0
    for sid, _eff, toks in rows:
        if used + toks > budget_tokens:
            continue
        out.append(sid)
        used += toks
    return out


# -----------------------------------------------------------------------------
# Path matching (#2 applies fingerprint to skill `paths`)
# -----------------------------------------------------------------------------
def path_match(skill_paths: list[str], fingerprint: dict) -> bool:
    """Return True if skill's paths constraint allows this project."""
    if not skill_paths:
        return True
    cwd = fingerprint.get("cwd", "")
    for pattern in skill_paths:
        # Glob-like patterns operating on fingerprint
        if pattern.startswith("stack:"):
            if fingerprint.get("stack") == pattern[6:]:
                return True
        elif pattern.startswith("concern:"):
            if pattern[8:] in fingerprint.get("concerns", []):
                return True
        elif pattern.startswith("org:"):
            if fingerprint.get(f"is_{pattern[4:]}", False):
                return True
        elif pattern in cwd:
            return True
        elif pattern == "*":
            return True
    return False


# -----------------------------------------------------------------------------
# Main router — unified route command
# -----------------------------------------------------------------------------
def cmd_route(prompt: str, cwd: str | None = None, cache_only: bool = False,
              tool: str = "", command: str = "") -> dict:
    """
    Return {selected_skills, fingerprint, reasons, total_tokens}.
    Selection order:
      1. Tier-1 always-loaded (priority=1)
      2. Project-fingerprint matches
      3. Session cache (#9)
      4. Phrase triggers (#3)
      5. Pack expansion (#5)
      6. Tool→skills (#6)
      7. Embedding top-K (#1) — only if budget allows
    Then apply tier budget (#4).
    """
    cwd = cwd or os.getcwd()
    conn = db_open()

    # Fingerprint
    fp = cmd_fingerprint(cwd)

    selected: dict[str, str] = {}  # id → reason

    # 1. Tier-1 always
    cur = conn.execute("SELECT id FROM skills WHERE priority = 1")
    for (sid,) in cur.fetchall():
        selected[sid] = "tier-1 always"

    # 2. Fingerprint-path matching for tier-2+
    cur = conn.execute("SELECT id, paths FROM skills WHERE priority > 1 AND paths != '[]'")
    for sid, paths_json in cur.fetchall():
        try:
            paths = json.loads(paths_json)
        except json.JSONDecodeError:
            continue
        if path_match(paths, fp):
            selected[sid] = f"path-match {paths}"

    # 3. Session cache
    cache_p = session_cache_path(cwd)
    if cache_p.exists():
        try:
            cache = json.loads(cache_p.read_text())
            for sid in cache.get("active", []):
                if sid not in selected:
                    selected[sid] = "session-cache"
        except json.JSONDecodeError:
            pass

    # Reasons by strength — stronger overwrites weaker
    REASON_STRENGTH = {
        "tier-1 always": 100,    # immutable
        "trigger-match": 90,     # explicit user phrase
        "semantic": 80,          # embedding similarity
        "pack:": 70,             # pack membership
        "tool:": 60,             # tool-activated
        "session-cache": 50,     # historical
        "path-match": 10,        # weakest — wildcard match
    }

    def reason_strength(r: str) -> int:
        for prefix, s in REASON_STRENGTH.items():
            if r.startswith(prefix):
                return s
        return 0

    def upgrade_reason(sid: str, new_reason: str) -> None:
        existing = selected.get(sid)
        if existing is None or reason_strength(new_reason) > reason_strength(existing):
            selected[sid] = new_reason

    if not cache_only:
        # 4. Phrase triggers — strong signal, upgrades reason
        triggered = match_triggers(prompt, conn)
        for sid in triggered:
            upgrade_reason(sid, "trigger-match")

        # 5a. Pack expansion — when prompt mentions pack name
        prompt_lower = prompt.lower()
        packs = all_packs()
        for pack_name, members in packs.items():
            if pack_name.replace("-", " ") in prompt_lower or pack_name in prompt_lower:
                for m in members:
                    upgrade_reason(m, f"pack:{pack_name}")

        # 5b. Pack auto-expand — when a triggered skill is a pack member,
        #     pull in pack siblings (only for explicit name-packs, not catch-all)
        TRIGGERED_PACK_EXPANSION = {"website-build", "angular", "ecommerce", "payments", "ai", "testing", "media"}
        for sid in list(selected.keys()):
            if not selected[sid].startswith("trigger-match"):
                continue
            for pack_name, members in packs.items():
                if pack_name not in TRIGGERED_PACK_EXPANSION:
                    continue
                if sid in members:
                    for m in members:
                        upgrade_reason(m, f"pack:{pack_name}")

        # 6. Tool routing
        if tool:
            for sid in tool_to_skills(tool, command):
                upgrade_reason(sid, f"tool:{tool}")

        # 7. Embedding top-K — only if we have budget
        try:
            for sid, score in embedding_topk(prompt, conn, k=8):
                if score > 0.35:
                    upgrade_reason(sid, f"semantic({score:.2f})")
        except Exception:
            pass

    # Apply tier budget — reason-aware priority bumps
    final = apply_budget(list(selected.items()), conn, DEFAULT_BUDGET_TOKENS)
    final_set = set(final)
    dropped = [sid for sid in selected if sid not in final_set]

    # Token total
    if final:
        cur = conn.execute(
            f"SELECT SUM(tokens) FROM skills WHERE id IN ({','.join('?' * len(final))})",
            final,
        )
        total = cur.fetchone()[0] or 0
    else:
        total = 0

    conn.close()

    return {
        "selected": [{"id": sid, "reason": selected[sid]} for sid in final],
        "dropped_for_budget": dropped,
        "fingerprint": fp,
        "total_tokens": total,
        "budget": DEFAULT_BUDGET_TOKENS,
    }


# -----------------------------------------------------------------------------
# Track skill usage (#9)
# -----------------------------------------------------------------------------
def cmd_track(skill_id: str, cwd: str | None = None) -> None:
    cwd = cwd or os.getcwd()
    p = session_cache_path(cwd)
    p.parent.mkdir(parents=True, exist_ok=True)
    if p.exists():
        try:
            data = json.loads(p.read_text())
        except json.JSONDecodeError:
            data = {"active": []}
    else:
        data = {"active": []}
    if skill_id not in data["active"]:
        data["active"].append(skill_id)
    data["updated_at"] = int(time.time())
    p.write_text(json.dumps(data, indent=2))


# -----------------------------------------------------------------------------
# CLI dispatch
# -----------------------------------------------------------------------------
def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__, file=sys.stderr)
        return 1
    cmd = argv[1]
    if cmd == "rebuild-index":
        cmd_rebuild_index()
        return 0
    if cmd == "fingerprint":
        cwd = argv[2] if len(argv) > 2 else None
        print(json.dumps(cmd_fingerprint(cwd), indent=2))
        return 0
    if cmd == "route":
        prompt = argv[2] if len(argv) > 2 else ""
        cwd = None
        tool = ""
        command = ""
        for i, arg in enumerate(argv[3:], start=3):
            if arg == "--cwd" and i + 1 < len(argv):
                cwd = argv[i + 1]
            elif arg == "--tool" and i + 1 < len(argv):
                tool = argv[i + 1]
            elif arg == "--command" and i + 1 < len(argv):
                command = argv[i + 1]
        result = cmd_route(prompt, cwd=cwd, tool=tool, command=command)
        print(json.dumps(result, indent=2))
        return 0
    if cmd == "track":
        if len(argv) < 3:
            print("usage: track <skill_id> [--cwd PATH]", file=sys.stderr)
            return 1
        cwd = None
        if "--cwd" in argv:
            cwd = argv[argv.index("--cwd") + 1]
        cmd_track(argv[2], cwd)
        return 0
    print(f"unknown command: {cmd}", file=sys.stderr)
    print(__doc__, file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
