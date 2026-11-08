#!/bin/bash
# Concatenate the source parts into the single deliverable index.html
cd "$(dirname "$0")/.."
{ cat src/head.html; cat src/core.js; for f in src/games/*.js; do echo; echo "/* ==== $(basename $f) ==== */"; cat "$f"; done; cat src/analytics.js; cat src/boot.js; } > index.html
# syntax check the script
python3 - <<'PY'
import re
h=open('index.html').read()
s=h[h.index('<script>')+8:h.rindex('</script>')]
open('/tmp/_tiog_check.js','w').write(s)
PY
node --check /tmp/_tiog_check.js && echo "OK syntax, $(wc -c < index.html) bytes"
# admin dashboard: inject the game id -> [title, emoji] map
python3 - <<'PY'
import re, json, glob
games = {}
for f in sorted(glob.glob('src/games/*.js')):
    src = open(f, encoding='utf8').read()
    for m in re.finditer(r"id:\s*'([a-z0-9_-]+)',\s*title:\s*'((?:[^'\\]|\\.)*)',\s*emoji:\s*'([^']*)'", src):
        games[m.group(1)] = [m.group(2).replace("\\'", "'"), m.group(3)]
html = open('src/admin.html', encoding='utf8').read().replace('/*__GAMES__*/{}', json.dumps(games, ensure_ascii=False))
open('admin.html', 'w', encoding='utf8').write(html)
print('admin.html:', len(games), 'games')
PY
