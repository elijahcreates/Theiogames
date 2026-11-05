#!/bin/bash
# Concatenate the source parts into the single deliverable index.html
cd "$(dirname "$0")/.."
{ cat src/head.html; cat src/core.js; for f in src/games/*.js; do echo; echo "/* ==== $(basename $f) ==== */"; cat "$f"; done; cat src/boot.js; } > index.html
# syntax check the script
python3 - <<'PY'
import re
h=open('index.html').read()
s=h[h.index('<script>')+8:h.rindex('</script>')]
open('/tmp/_tiog_check.js','w').write(s)
PY
node --check /tmp/_tiog_check.js && echo "OK syntax, $(wc -c < index.html) bytes"
