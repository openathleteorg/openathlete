#!/usr/bin/env bash
# Stops the API and web app started by start.sh. The databases keep running
# with their data; stop them with:
#   docker compose -p openathlete-screenshots stop
set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
LOGS="${SCREENSHOTS_LOGS:-$HERE/.logs}"

# pnpm spawns the real servers as children: free the ports themselves.
for port in 3010 5180; do
  pids="$(lsof -t -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  [ -n "$pids" ] && kill $pids 2>/dev/null
done
for f in "$LOGS"/api.pid "$LOGS"/web.pid; do
  [ -f "$f" ] && { pkill -P "$(cat "$f")" 2>/dev/null; kill "$(cat "$f")" 2>/dev/null; rm -f "$f"; }
done
echo "Stopped the API and the web app."
