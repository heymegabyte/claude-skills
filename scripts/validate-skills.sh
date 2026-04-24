#!/bin/bash
set -euo pipefail

ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

python3 - "$ROOT" <<'PY'
from pathlib import Path
import re
import sys

root = Path(sys.argv[1]).resolve()
failures = []

def fail(msg: str) -> None:
    failures.append(msg)

skill_dirs = sorted(root.glob("[0-9][0-9]-*"))
skill_md = {p.name: p / "SKILL.md" for p in skill_dirs}
actual_refs = {}
for skill in skill_dirs:
    prefix = skill.name[:2]
    actual_refs[prefix] = {p.stem for p in skill.glob("*.md") if p.name != "SKILL.md"}

for path in sorted(root.rglob("*.md")):
    text = path.read_text()
    if text.startswith("---"):
      closes = [i for i, line in enumerate(text.splitlines()[1:], start=2) if line.strip() == "---"]
      if not closes:
          fail(f"{path.relative_to(root)}: missing closing frontmatter delimiter")

    if path.name == "SKILL.md":
        lines = text.splitlines()
        if len(lines) > 500:
            fail(f"{path.relative_to(root)}: {len(lines)} lines (keep SKILL.md under 500)")

    if "templates" in path.parts:
        continue

    # Strip fenced code blocks and inline code before checking links
    stripped = re.sub(r"```[^`]*```", "", text, flags=re.DOTALL)
    stripped = re.sub(r"`[^`]+`", "", stripped)

    for match in re.finditer(r"\[[^\]]+\]\(([^)#]+)(?:#[^)]+)?\)", stripped):
        ref = match.group(1)
        if ref.startswith(("http://", "https://", "/", "mailto:")):
            continue
        target = (path.parent / ref).resolve()
        try:
            target.relative_to(root)
        except ValueError:
            continue
        if not target.exists():
            fail(f"{path.relative_to(root)}: broken relative link -> {ref}")

for file_name in ("_router.md", "SKILL_PROFILES.md"):
    text = (root / file_name).read_text()
    for prefix, slug in re.findall(r"(\d{2})/([A-Za-z0-9-]+)", text):
        if slug not in actual_refs.get(prefix, set()):
            fail(f"{file_name}: missing reference {prefix}/{slug}")

llms = root / "llms.txt"
if llms.exists():
    text = llms.read_text()
    for match in re.finditer(r"\[[^\]]+\]\(([^)#]+)\)", text):
        ref = match.group(1)
        if ref.startswith(("http://", "https://", "/")):
            continue
        target = (llms.parent / ref).resolve()
        try:
            target.relative_to(root)
        except ValueError:
            continue
        if not target.exists():
            fail(f"llms.txt: broken link -> {ref}")

if failures:
    print("Skill validation failed:", file=sys.stderr)
    for item in failures:
        print(f"- {item}", file=sys.stderr)
    sys.exit(1)

print("Skill validation passed.")
PY
