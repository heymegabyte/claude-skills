#!/usr/bin/env bash
# check-skill-pack-claim.sh — verify each [0-9][0-9]-*/SKILL.md frontmatter
# `pack:` declaration matches an actual `_packs/<name>.yml` file AND the pack
# file lists the skill dir. Parallels check-pack-frontmatter.sh but for
# skill-dirs instead of rules.
#
# Per rules/audit-arc-maturity-ladder.md — Steps 1 + 2 (Detect + Surface).
# Promote to hard gate after ≥90 days OR ≥15 passes stable.
#
# Usage:
#   bash ~/.agentskills/bin/check-skill-pack-claim.sh [--json]
#
# --json: uniform envelope per rules/uniform-json-output.md (12th caller of
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
skills = {}
for f in glob.glob('[0-9][0-9]-*/SKILL.md'):
    name = os.path.basename(os.path.dirname(f))
    # Read only frontmatter (between first 2 `---` lines)
    txt = open(f).read()
    fm_match = re.match(r'^---\n(.*?)\n---', txt, re.DOTALL)
    if not fm_match:
        continue
    fm = fm_match.group(1)
    m = re.search(r'^pack:\s*"?([\w-]+)"?\s*$', fm, re.M)
    if m:
        skills[name] = m.group(1)
packs = {}
for f in glob.glob('_packs/*.yml'):
    pname = os.path.basename(f).replace('.yml','')
    # Skill-dir members look like `  - 01-operating-system` (no rules/ prefix)
    members = set(re.findall(r'^\s*-\s+(\d{2}-[\w-]+)\s*$', open(f).read(), re.M))
    packs[pname] = members
drift = []
for skill, claimed in sorted(skills.items()):
    actual = sorted(p for p, ms in packs.items() if skill in ms)
    if claimed not in packs:
        drift.append({"skill": skill, "claimed_pack": claimed, "actual_packs": actual, "kind": "pack_file_missing"})
    elif skill not in packs[claimed]:
        drift.append({"skill": skill, "claimed_pack": claimed, "actual_packs": actual, "kind": "skill_not_in_claimed_pack"})
print(json.dumps({"drift": drift, "total_skills": len(skills), "total_packs": len(packs)}))
PY
)

DRIFT_COUNT=$(printf '%s' "$RESULT" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['drift']))")
TOTAL_SKILLS=$(printf '%s' "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['total_skills'])")
TOTAL_PACKS=$(printf '%s' "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['total_packs'])")

EXIT=0
[ "$DRIFT_COUNT" -gt 0 ] && EXIT=1

if [ "$JSON" = "0" ]; then
  printf '▸ Checking skill SKILL.md pack: claims vs _packs/*.yml membership...\n' >&2
  printf '  Skills with pack: frontmatter: %d · Total pack files: %d\n' "$TOTAL_SKILLS" "$TOTAL_PACKS" >&2
  if [ "$DRIFT_COUNT" -gt 0 ]; then
    printf '%s' "$RESULT" | python3 -c '
import sys, json
d = json.load(sys.stdin)["drift"]
for x in d:
    actual = ", ".join(x["actual_packs"]) if x["actual_packs"] else "NONE"
    skill = x["skill"]
    claimed = x["claimed_pack"]
    print(f"  ✗ {skill:<40s} claimed→{claimed:<10s} actual→{actual}")
' >&2
    printf '\n━━━ SUMMARY: %d total skills · %d drift\n' "$TOTAL_SKILLS" "$DRIFT_COUNT" >&2
    printf '✗ skill pack: claim drift detected — fix the SKILL.md frontmatter or add it to the claimed pack\n' >&2
  else
    printf '\n━━━ SUMMARY: %d total skills · 0 drift\n' "$TOTAL_SKILLS" >&2
    printf '✓ all SKILL.md pack: claims match _packs/*.yml membership\n' >&2
  fi
fi

if [ "$JSON" = "1" ]; then
  META_TS=$(emit_iso_ts)
  META_GIT_SHA=$(emit_git_sha "$SKILLS_ROOT")
  META_BLOCK=$(emit_meta_block "$SKILLS_ROOT" "$META_TS" "$META_GIT_SHA" "default")
  DRIFT_JSON=$(printf '%s' "$RESULT" | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)['drift']))")
  printf '{%s,"drift":%s,"summary":{"total_skills":%d,"total_packs":%d,"drift_count":%d,"exit":%d}}\n' \
    "$META_BLOCK" "$DRIFT_JSON" "$TOTAL_SKILLS" "$TOTAL_PACKS" "$DRIFT_COUNT" "$EXIT"
fi

exit "$EXIT"
