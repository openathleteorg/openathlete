#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  exit 1
fi

if [ -n "$DATABASE_URL" ]; then
  if ! echo "$DATABASE_URL" | grep -qE '^(postgresql|postgres)://'; then
    DECODED=$(echo "$DATABASE_URL" | base64 -d 2>/dev/null)
    if [ $? -eq 0 ] && echo "$DECODED" | grep -qE '^(postgresql|postgres)://'; then
      DATABASE_URL="$DECODED"
    else
      exit 1
    fi
  fi

  PROTOCOL=$(echo "$DATABASE_URL" | cut -d: -f1)

  if [ "$PROTOCOL" != "postgresql" ] && [ "$PROTOCOL" != "postgres" ]; then
    exit 1
  fi
else
  exit 1
fi

if [ -n "$REDIS_URL" ]; then
  if ! echo "$REDIS_URL" | grep -qE '^redis://'; then
    DECODED=$(echo "$REDIS_URL" | base64 -d 2>/dev/null)
    if [ $? -eq 0 ] && echo "$DECODED" | grep -qE '^redis://'; then
      REDIS_URL="$DECODED"
    else
    fi
  fi

  PROTOCOL=$(echo "$REDIS_URL" | cut -d: -f1)

  if [ "$PROTOCOL" != "redis" ]; then
    exit 1
  fi

  export REDIS_URL
fi

cd /app/libs/database

export DATABASE_URL

if prisma migrate deploy; then
  echo "✓ Migrations completed successfully${NC}"
else
  exit 1
fi

cd /app/apps/api
exec node dist/main.js

