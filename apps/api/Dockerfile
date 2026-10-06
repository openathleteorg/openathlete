# syntax=docker/dockerfile:1.7

# ---- Build stage ----
FROM node:22.23.3-alpine AS build
WORKDIR /app

# Prisma engines on Alpine need OpenSSL; libc6-compat for Node native addons
RUN apk add --no-cache openssl libc6-compat \
  && corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY libs/shared/package.json libs/shared/package.json
COPY libs/database/package.json libs/database/package.json

# Coolify injects ARG NODE_ENV=production into this stage (build-args).
# That makes pnpm skip devDependencies — including `prisma` CLI required
# for `pnpm db:generate`. Force a full install on this RUN only.
RUN NODE_ENV=development pnpm install --frozen-lockfile --prod=false

COPY . .

# Dummy URL is enough for `prisma generate` (no DB connection).
# Keep NODE_ENV=development so prisma (devDependency) remains on PATH.
ENV NODE_ENV=development
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"

WORKDIR /app/libs/database
RUN NODE_ENV=development pnpm db:generate
RUN NODE_ENV=development pnpm build:config

WORKDIR /app/libs/shared
RUN NODE_ENV=development pnpm build

WORKDIR /app/apps/api
RUN NODE_ENV=development pnpm build

# ---- Runtime stage ----
FROM node:22.23.3-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
# Mastra (AI agents) ships anonymous usage telemetry; keep it off
ENV MASTRA_TELEMETRY_DISABLED=1

RUN apk add --no-cache wget openssl libc6-compat su-exec \
  && corepack enable && corepack prepare pnpm@9.15.9 --activate \
  && npm install -g prisma@6.19.3 \
  && addgroup -g 1001 -S openathlete \
  && adduser -S openathlete -u 1001 -G openathlete

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY libs/shared/package.json libs/shared/package.json
COPY libs/database/package.json libs/database/package.json

RUN pnpm install --frozen-lockfile --filter ./apps/api... --prod

COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/assets ./apps/api/assets
COPY --from=build /app/libs/shared/dist ./libs/shared/dist
COPY --from=build /app/libs/shared/package.json ./libs/shared/package.json
COPY --from=build /app/libs/database/generated ./libs/database/generated
COPY --from=build /app/libs/database/package.json ./libs/database/package.json
COPY --from=build /app/libs/database/prisma ./libs/database/prisma
COPY --from=build /app/libs/database/prisma.config.js ./libs/database/prisma.config.js

# Files stay owned by root and read-only for the app user, which writes
# nothing under /app. (A `chown -R /app` copied every file into a new layer,
# 600 MB.)
COPY --chmod=755 apps/api/scripts/docker-entrypoint.sh /app/docker-entrypoint.sh

USER root

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=120s --retries=8 \
  CMD wget -qO- http://127.0.0.1:3000/health | grep -q '"status":"ok"' || exit 1

CMD ["/app/docker-entrypoint.sh"]
