#!/bin/bash
# Test if nupload.me watch page loads in an iframe
# Check headers for X-Frame-Options and CSP

echo "=== Testing nupload.me headers ==="
curl -s -D - --max-time 10 "https://nupload.me/watch/OX3jz3ERobdGObWuyq73jz3kZ3FCOwGg5f7kz7ZYJii5KHz49P1o" -o /dev/null 2>&1 | grep -iE 'frame|csp|x-frame|content-security'

echo ""
echo "=== Testing if resolve-video + stream-proxy works ==="
# First resolve the video URL
RESULT=$(curl -s --max-time 15 "http://localhost:3000/api/resolve-video?url=https://nupload.me/watch/OX3jz3ERobdGObWuyq73jz3kZ3FCOwGg5f7kz7ZYJii5KHz49P1o")
echo "Resolve result: $RESULT"
HLS_URL=$(echo "$RESULT" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
echo "HLS URL: $HLS_URL"

if [ -n "$HLS_URL" ]; then
  echo ""
  echo "=== Testing HLS URL through stream-proxy ==="
  PROXY_URL="http://localhost:3000/api/stream-proxy?url=$(echo "$HLS_URL" | python3 -c "import sys,urllib.parse; print(urllib.parse.quote(sys.stdin.read().strip()))" 2>/dev/null || echo "$HLS_URL")"
  echo "Proxy URL: $PROXY_URL"
  curl -s --max-time 15 "$PROXY_URL" | head -50
fi
