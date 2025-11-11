# syntax=docker/dockerfile:1.7

# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# Copy monorepo manifests for better caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY libs/shared/package.json libs/shared/package.json
COPY libs/database/package.json libs/database/package.json

# Install dependencies (Hoisted with pnpm)
RUN pnpm install --frozen-lockfile

# Copy full repo (only after deps to maximize layer cache)
COPY . .

# Generate Prisma client FIRST (required by shared and API)
WORKDIR /app/libs/database
RUN pnpm db:generate

# Build shared (depends on database types)
WORKDIR /app/libs/shared
RUN pnpm build

# Build API (depends on shared and database)
WORKDIR /app/apps/api
RUN pnpm build

# ---- Runtime stage ----
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# Install Prisma CLI globally for migrations
RUN npm install -g prisma@6.15.0

# Bring only necessary package manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY libs/shared/package.json libs/shared/package.json
COPY libs/database/package.json libs/database/package.json

# Install production dependencies (including shared and database)
RUN pnpm install --frozen-lockfile --filter ./apps/api... --prod

# Copy built artifacts
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/libs/shared/dist ./libs/shared/dist
COPY --from=build /app/libs/shared/package.json ./libs/shared/package.json
COPY --from=build /app/libs/database/generated ./libs/database/generated
COPY --from=build /app/libs/database/package.json ./libs/database/package.json
COPY --from=build /app/libs/database/prisma ./libs/database/prisma
# Also copy prisma config for completeness
COPY --from=build /app/libs/database/prisma.config.ts ./libs/database/prisma.config.ts

EXPOSE 3000

# Run migrations before starting the API
# Use explicit schema path to avoid config resolution issues in container
CMD ["sh", "-c", "cd /app/libs/database && prisma migrate deploy --schema=./prisma/schema/schema.prisma && cd /app/apps/api && node dist/main.js"]


