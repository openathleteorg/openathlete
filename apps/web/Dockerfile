# syntax=docker/dockerfile:1.7

# ---- Build stage ----
FROM node:26.10.0-alpine AS build
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# Copy monorepo manifests for better caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/package.json
COPY libs/shared/package.json libs/shared/package.json

# Install dependencies (Hoisted with pnpm)
RUN pnpm install --frozen-lockfile

# Copy full repo (only after deps to maximize layer cache)
COPY . .

# Build shared (required by web)
WORKDIR /app/libs/shared
RUN pnpm build

# Build web app
# VITE_API_BASE_URL is baked into the bundle. By default it is a placeholder
# replaced at container start from API_PUBLIC_URL (see docker/), so the same
# image works for any deployment.
ARG VITE_API_BASE_URL="__OPENATHLETE_API_BASE_URL__"
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

WORKDIR /app/apps/web
RUN pnpm build

# ---- Runtime stage ----
FROM nginx:alpine AS runtime

# Copy built assets
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Run by the nginx image entrypoint before nginx starts
COPY --chmod=755 apps/web/docker/40-api-public-url.sh /docker-entrypoint.d/40-api-public-url.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

