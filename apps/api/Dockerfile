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
# Also compile prisma.config.ts to prisma.config.js for Docker runtime
WORKDIR /app/libs/database
RUN pnpm db:generate && pnpm build:config

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
COPY --from=build /app/libs/database/prisma.config.js ./libs/database/prisma.config.js

# Copy and set up entrypoint script
COPY apps/api/scripts/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh


EXPOSE 3000

# Use entrypoint script to handle migrations and start the API
CMD ["/app/docker-entrypoint.sh"]
