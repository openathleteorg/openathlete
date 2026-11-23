#!/bin/sh
# Points the /api, /socket.io and OAuth discovery proxies at API_UPSTREAM
# (host:port) instead of the default api:3000. A Coolify preview sets it to
# the API's generated service name, so the proxy never resolves the name
# of another stack's container (see docker-compose.preview.yml).
set -eu

[ -n "${API_UPSTREAM:-}" ] || exit 0

if ! printf '%s' "$API_UPSTREAM" | grep -Eq '^[A-Za-z0-9._-]+:[0-9]+$'; then
  echo "API_UPSTREAM must be host:port, such as api:3000 (got '$API_UPSTREAM')" >&2
  exit 1
fi

sed -i "s|http://api:3000|http://$API_UPSTREAM|g" /etc/nginx/conf.d/default.conf
echo "Web app proxying the API at $API_UPSTREAM"
