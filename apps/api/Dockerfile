# syntax=docker/dockerfile:1.7

# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy monorepo manifests for better caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json

# Install dependencies (Hoisted with pnpm)
RUN pnpm install --frozen-lockfile

# Copy full repo (only after deps to maximize layer cache)
COPY . .

# Build API
WORKDIR /app/apps/api
RUN pnpm build

# ---- Runtime stage ----
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# Install pnpm and only production deps for the API
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Bring only necessary package manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json

RUN pnpm install --frozen-lockfile --filter ./apps/api... --prod

# Copy built artifacts
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json

EXPOSE 3000
WORKDIR /app/apps/api
CMD ["node", "dist/main.js"]


