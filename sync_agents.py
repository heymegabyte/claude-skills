import re, os

AGENTS_DIR = '/Users/apple/.agentskills/agents'
CLAUDE_DIR = '/Users/apple/.claude/agents'
SYNC_FIELDS = ['model', 'permissionMode', 'maxTurns', 'effort', 'skills', 'memory', 'color', 'disallowedTools', 'background', 'isolation', 'initialPrompt']

def parse_fm(path):
    with open(path) as f:
        content = f.read()
    m = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not m: return {}, content
    fields = {}
    for line in m.group(1).split('\n'):
        if ':' in line and not line.startswith(' '):
            key = line.split(':')[0].strip()
            val = ':'.join(line.split(':')[1:]).strip()
            fields[key] = val
    return fields, content

def update_fm(content, field, value):
    pattern = rf'^({field}:\s*).*$'
    if re.search(pattern, content, re.MULTILINE):
        return re.sub(pattern, rf'\g<1>{value}', content, count=1, flags=re.MULTILINE)
    return content.replace('\n---\n', f'\n{field}: {value}\n---\n', 1)

changes = []
for fname in sorted(os.listdir(AGENTS_DIR)):
    if not fname.endswith('.md'): continue
    ap = os.path.join(AGENTS_DIR, fname)
    cp = os.path.join(CLAUDE_DIR, fname)
    if not os.path.exists(cp): continue
    af, ac = parse_fm(ap)
    cf, _ = parse_fm(cp)
    modified = False
    for field in SYNC_FIELDS:
        if field in cf:
            if cf[field] != af.get(field):
                ac = update_fm(ac, field, cf[field])
                changes.append(f'{fname}: {field} = {af.get(field, "MISSING")} -> {cf[field]}')
                modified = True
    if modified:
        with open(ap, 'w') as f:
            f.write(ac)

for c in changes: print(c)
print(f'\nTotal: {len(changes)} field updates')
