#!/bin/sh
set -e

# Docker entrypoint script for OpenAthlete API
# Handles Prisma migrations and starts the NestJS application

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verify required environment variables
if [ -z "$DATABASE_URL" ]; then
  echo "${RED}ERROR: DATABASE_URL is not set${NC}"
  echo "This should be injected by Scaleway Secret Manager"
  exit 1
fi

# Scaleway Secret Manager stores secrets as base64-encoded strings
# When injected as environment variables, they may still be encoded
# Try to decode if it looks like base64 and doesn't start with postgresql://
if [ -n "$DATABASE_URL" ]; then
  # Check if it's base64 encoded (doesn't start with postgresql:// or postgres://)
  if ! echo "$DATABASE_URL" | grep -qE '^(postgresql|postgres)://'; then
    echo "${YELLOW}Detected base64-encoded DATABASE_URL, decoding...${NC}"
    # Try to decode base64
    DECODED=$(echo "$DATABASE_URL" | base64 -d 2>/dev/null)
    if [ $? -eq 0 ] && echo "$DECODED" | grep -qE '^(postgresql|postgres)://'; then
      DATABASE_URL="$DECODED"
      echo "${GREEN}✓ Successfully decoded DATABASE_URL${NC}"
    else
      echo "${RED}ERROR: Failed to decode DATABASE_URL or decoded value is invalid${NC}"
      exit 1
    fi
  fi
  
  # Debug: Show that DATABASE_URL is available (without exposing the full value)
  echo "${GREEN}✓ DATABASE_URL is set (length: ${#DATABASE_URL} chars)${NC}"
  PROTOCOL=$(echo "$DATABASE_URL" | cut -d: -f1)
  echo "${YELLOW}  Protocol: ${PROTOCOL}${NC}"
  
  # Verify it starts with postgresql:// or postgres://
  if [ "$PROTOCOL" != "postgresql" ] && [ "$PROTOCOL" != "postgres" ]; then
    echo "${RED}ERROR: DATABASE_URL must start with postgresql:// or postgres://${NC}"
    echo "${RED}  Got: ${PROTOCOL}://...${NC}"
    exit 1
  fi
else
  echo "${RED}ERROR: DATABASE_URL is empty${NC}"
  exit 1
fi

# Handle REDIS_URL (optional, has default value)
# Scaleway Secret Manager stores secrets as base64-encoded strings
# When injected as environment variables, they may still be encoded
# Try to decode if it looks like base64 and doesn't start with redis://
if [ -n "$REDIS_URL" ]; then
  # Check if it's base64 encoded (doesn't start with redis://)
  if ! echo "$REDIS_URL" | grep -qE '^redis://'; then
    echo "${YELLOW}Detected base64-encoded REDIS_URL, decoding...${NC}"
    # Try to decode base64
    DECODED=$(echo "$REDIS_URL" | base64 -d 2>/dev/null)
    if [ $? -eq 0 ] && echo "$DECODED" | grep -qE '^redis://'; then
      REDIS_URL="$DECODED"
      echo "${GREEN}✓ Successfully decoded REDIS_URL${NC}"
    else
      echo "${YELLOW}WARNING: Failed to decode REDIS_URL or decoded value is invalid, using as-is${NC}"
    fi
  fi
  
  # Debug: Show that REDIS_URL is available (without exposing the full value)
  echo "${GREEN}✓ REDIS_URL is set (length: ${#REDIS_URL} chars)${NC}"
  PROTOCOL=$(echo "$REDIS_URL" | cut -d: -f1)
  echo "${YELLOW}  Protocol: ${PROTOCOL}${NC}"
  
  # Verify it starts with redis:// (warn but don't fail, as it has a default)
  if [ "$PROTOCOL" != "redis" ]; then
    echo "${YELLOW}WARNING: REDIS_URL should start with redis://${NC}"
    echo "${YELLOW}  Got: ${PROTOCOL}://...${NC}"
  fi
  
  # Export REDIS_URL explicitly to ensure it's available to the application
  export REDIS_URL
fi

# Run Prisma migrations directly
# prisma.config.js handles multi-file schema
# Note: When prisma.config.js is present, Prisma skips auto-loading env vars from .env files,
# but it still reads from process.env, so we ensure DATABASE_URL is exported
echo "${YELLOW}Running Prisma migrations...${NC}"
cd /app/libs/database

# Export DATABASE_URL explicitly to ensure it's available to Prisma
export DATABASE_URL

# Run Prisma migrate deploy directly (prisma CLI is installed globally in Docker)
# This ensures the environment variable is properly passed
if prisma migrate deploy; then
  echo "${GREEN}✓ Migrations completed successfully${NC}"
else
  echo "${RED}✗ Migration failed${NC}"
  exit 1
fi

# Navigate to API directory and start the application
cd /app/apps/api
echo "${YELLOW}Starting NestJS API...${NC}"
exec node dist/main.js

