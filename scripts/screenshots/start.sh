#!/usr/bin/env bash
# Starts the screenshot stack: PostgreSQL and Redis in Docker (own project and
# ports), the API on :3010 and the web app on :5180, without reading the
# regular apps/api/.env or the analytics keys of apps/web/.env.
# Stop it with scripts/screenshots/stop.sh.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HERE="$ROOT/scripts/screenshots"
LOGS="${SCREENSHOTS_LOGS:-$HERE/.logs}"
mkdir -p "$LOGS"

docker compose -p openathlete-screenshots \
  -f "$ROOT/docker-compose.dev.yml" -f "$HERE/compose.override.yml" up -d --wait

set -a
# shellcheck source=/dev/null
source "$HERE/api.env"
set +a
(cd "$ROOT/libs/database" && pnpm exec prisma migrate deploy >/dev/null)

(cd "$ROOT/apps/api" && DOTENV_CONFIG_PATH="$HERE/api.env" nohup pnpm dev >"$LOGS/api.log" 2>&1 &
  echo $! >"$LOGS/api.pid")

(cd "$ROOT/apps/web" && \
  VITE_API_BASE_URL=http://localhost:3010 \
  VITE_WEBSITE_URL=https://openathlete.org \
  VITE_PUBLIC_POSTHOG_PROJECT_TOKEN= VITE_PUBLIC_POSTHOG_HOST= \
  VITE_CONTENTSQUARE_TAG_ID= \
  VITE_FIREBASE_API_KEY= VITE_FIREBASE_APP_ID= VITE_FIREBASE_AUTH_DOMAIN= VITE_FIREBASE_PROJECT_ID= \
  nohup pnpm exec vite --port 5180 --strictPort >"$LOGS/web.log" 2>&1 &
  echo $! >"$LOGS/web.pid")

echo "Waiting for the API (:3010) and the web app (:5180)..."
for _ in $(seq 1 90); do
  if curl -sf http://localhost:3010/health >/dev/null && curl -sf http://localhost:5180 >/dev/null; then
    echo "Ready. Logs in $LOGS"
    exit 0
  fi
  sleep 2
done
echo "Timed out; see $LOGS" >&2
exit 1
