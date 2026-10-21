#!/bin/sh
# Screenshot a set of pages with headless Chrome. Usage: sh scripts/screenshots.sh <outdir> [width] [height]
OUT="$1"; W="${2:-1440}"; H="${3:-2400}"
CHROME="C:/Program Files/Google/Chrome/Application/chrome.exe"
mkdir -p "$OUT"
for p in "/" "/about/" "/about/leadership/" "/about/team/" "/about/partners/" "/education/" "/education/student-opportunities/" "/education/practicum/" "/education/from-texas-to-the-troubles/" "/education/projects-with-underserved-communities/" "/education/may-term/" "/education/certificate/" "/research/" "/research/northern-ireland/" "/research/chile/" "/research/ties/" "/research/faculty/" "/service/" "/stories/" "/events/" "/connect/" "/connect/listserv/" "/connect/media/" "/resources/international-students/" "/give/" "/404.html"; do
  name=$(echo "$p" | sed 's#^/##; s#/$##; s#/#_#g'); [ -z "$name" ] && name=home
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size="$W,$H" --screenshot="$OUT/$name.png" "http://127.0.0.1:8080$p" >/dev/null 2>&1
  echo "$name"
done
