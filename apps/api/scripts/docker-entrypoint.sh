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

# Run Prisma migrations using pnpm to leverage workspace scripts
# prisma.config.js (compiled from prisma.config.ts) handles multi-file schema
echo "${YELLOW}Running Prisma migrations...${NC}"
cd /app
if pnpm database run db:deploy; then
  echo "${GREEN}✓ Migrations completed successfully${NC}"
else
  echo "${RED}✗ Migration failed${NC}"
  exit 1
fi

# Navigate to API directory and start the application
cd /app/apps/api
echo "${YELLOW}Starting NestJS API...${NC}"
exec node dist/main.js

