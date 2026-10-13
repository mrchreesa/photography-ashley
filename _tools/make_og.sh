#!/bin/sh
# Renders the 1200x630 share cards (WhatsApp / iMessage / social previews) from _tools/og.html.
# Needs the local server running on :4173 (see .claude/launch.json) and Google Chrome.
set -e
cd "$(dirname "$0")/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TMP="$(mktemp -d)"
for card in darkroom stage cover; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=1200,630 --virtual-time-budget=6000 \
    --screenshot="$TMP/$card.png" "http://127.0.0.1:4173/_tools/og.html#$card" >/dev/null 2>&1
  python3 -I -c "
from PIL import Image; import sys
im = Image.open(sys.argv[1]).convert('RGB').crop((0, 0, 1200, 630))
im.save(sys.argv[2], 'JPEG', quality=84, optimize=True, progressive=True)" "$TMP/$card.png" "shared/og/$card.jpg"
done
rm -rf "$TMP"
ls -la shared/og
