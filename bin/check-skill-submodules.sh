#!/usr/bin/env bash
# check-skill-submodules.sh — verify each [0-9][0-9]-*/SKILL.md frontmatter
# `submodules:` list points to files that actually exist in the skill dir.
#
# Parallels publish.yml's "Check SKILL.md submodule alignment" step but as a
# uniform-JSON bin script for local pre-commit visibility. Follows the
# codified maturity ladder (rules/audit-arc-maturity-ladder.md) Steps 1+2.
#
# Usage:
#   bash ~/.agentskills/bin/check-skill-submodules.sh [--json]
#
# --json: uniform envelope per rules/uniform-json-output.md (13th caller of
#         bin/lib/emit-json.sh).

set -uo pipefail

JSON=0
for arg in "$@"; do
  case "$arg" in
    --json) JSON=1 ;;
  esac
done

SKILLS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SKILLS_ROOT" || exit 1

# shellcheck source=lib/emit-json.sh
. "$SKILLS_ROOT/bin/lib/emit-json.sh"

RESULT=$(
  python3 <<'PY'
import os, re, glob, json
drift = []
total_skills = 0
total_submodules = 0
for f in sorted(glob.glob('[0-9][0-9]-*/SKILL.md')):
    skill_dir = os.path.dirname(f)
    skill = os.path.basename(skill_dir)
    total_skills += 1
    txt = open(f).read()
    fm_match = re.match(r'^---\n(.*?)\n---', txt, re.DOTALL)
    if not fm_match:
        continue
    fm = fm_match.group(1)
    # Find submodules: block — list items prefixed with `  - `
    sub_match = re.search(r'^submodules:\s*\n((?:\s+-\s+.+\n?)+)', fm, re.M)
    if not sub_match:
        continue
    for line in sub_match.group(1).splitlines():
        m = re.match(r'^\s+-\s+(.+?)\s*$', line)
        if not m:
            continue
        submodule = m.group(1).strip()
        total_submodules += 1
        path = os.path.join(skill_dir, submodule)
        if not os.path.exists(path):
            drift.append({"skill": skill, "submodule": submodule, "expected_path": path})
print(json.dumps({"drift": drift, "total_skills": total_skills, "total_submodules": total_submodules}))
PY
)

DRIFT_COUNT=$(printf '%s' "$RESULT" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['drift']))")
TOTAL_SKILLS=$(printf '%s' "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['total_skills'])")
TOTAL_SUBMODULES=$(printf '%s' "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['total_submodules'])")

EXIT=0
[ "$DRIFT_COUNT" -gt 0 ] && EXIT=1

if [ "$JSON" = "0" ]; then
  printf '▸ Checking SKILL.md submodules: declarations exist as files in skill dir...\n' >&2
  printf '  Skills scanned: %d · Total submodules declared: %d\n' "$TOTAL_SKILLS" "$TOTAL_SUBMODULES" >&2
  if [ "$DRIFT_COUNT" -gt 0 ]; then
    printf '%s' "$RESULT" | python3 -c '
import sys, json
d = json.load(sys.stdin)["drift"]
for x in d:
    skill = x["skill"]
    sub = x["submodule"]
    path = x["expected_path"]
    print(f"  ✗ {skill}/{sub} (expected at {path})")
' >&2
    printf '\n━━━ SUMMARY: %d submodules · %d missing\n' "$TOTAL_SUBMODULES" "$DRIFT_COUNT" >&2
    printf '✗ SKILL.md submodule drift detected — fix the path or remove the declaration\n' >&2
  else
    printf '\n━━━ SUMMARY: %d submodules · 0 missing\n' "$TOTAL_SUBMODULES" >&2
    printf '✓ all SKILL.md submodule declarations resolve to existing files\n' >&2
  fi
fi

if [ "$JSON" = "1" ]; then
  META_TS=$(emit_iso_ts)
  META_GIT_SHA=$(emit_git_sha "$SKILLS_ROOT")
  META_BLOCK=$(emit_meta_block "$SKILLS_ROOT" "$META_TS" "$META_GIT_SHA" "default")
  DRIFT_JSON=$(printf '%s' "$RESULT" | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)['drift']))")
  printf '{%s,"drift":%s,"summary":{"total_skills":%d,"total_submodules":%d,"drift_count":%d,"exit":%d}}\n' \
    "$META_BLOCK" "$DRIFT_JSON" "$TOTAL_SKILLS" "$TOTAL_SUBMODULES" "$DRIFT_COUNT" "$EXIT"
fi

exit "$EXIT"
