# OpenAthlete

Open-source (AGPL-3.0) training platform for endurance athletes and coaches: planning, device sync (Strava, Garmin, Polar, Suunto, Coros), training load, AI coaching.

Two deployments, both first-class:

- **Hosted**: API and worker on Coolify (OVH), web app and website on Vercel.
- **Self-hosted**: `docker-compose.yml` or the GHCR images. Anything that only makes sense for the hosted instance (analytics, error monitoring, billing, AI keys) must be off unless its environment variable is set. Self-hosted instances must never send data to our services; an E2E test enforces it.

## Repository map

| Path | What | Notes |
| --- | --- | --- |
| `apps/api` | NestJS 11 API and worker | Prisma, BullMQ jobs, Mastra 1 AI agents. See `apps/api/CLAUDE.md` |
| `apps/web` | React 19 + Vite app | React Query, Paraglide i18n, Capacitor iOS/Android. See `apps/web/CLAUDE.md` |
| `apps/website` | Next.js marketing site | Landing pages, blog, legal notices |
| `apps/docs` | Fumadocs (Next.js) | **Standalone**: own `pnpm-lock.yaml`, not in the workspace |
| `libs/shared` | Code shared by API and web | Zod schemas and DTOs, enums, env schema, utils. Consumers use its build |
| `libs/database` | Prisma schema and migrations | Schema split by domain in `prisma/schema/*.prisma` |
| `e2e` | Playwright tests | Run against the production Docker images |
| `scripts/` | Repo tooling | `verify.sh`, translation checks |

## Commands

```bash
# First setup
nvm use && pnpm install
docker compose -f docker-compose.dev.yml up -d  # PostgreSQL (pgvector) and Redis
for f in apps/api apps/web libs/database; do cp $f/.env.example $f/.env; done
pnpm database run db:generate && pnpm shared build && pnpm database run db:deploy

pnpm dev                                     # API on :3000, web on :5173

# Checks, same as CI
scripts/verify.sh                            # lint, types, unit tests, translations
scripts/verify.sh --build                    # + production builds, AI agent tests
scripts/verify.sh --integration              # + PostgreSQL integration tests (Docker)
scripts/verify.sh --e2e                      # + Playwright on the Docker images
scripts/verify.sh --all

# Targeted
pnpm api test src/modules/auth               # Jest unit tests (*.spec.ts)
pnpm web test                                # Vitest (*.test.ts)
pnpm shared build                            # after any change in libs/shared
pnpm database exec prisma migrate dev --create-only --name <change>   # new migration
```

## Definition of done

Run `scripts/verify.sh` for every change, then add the targeted checks:

| Change touches | Also run |
| --- | --- |
| Prisma schema or anything that deletes data | `scripts/verify.sh --integration` |
| AI agents, prompts, structured outputs | `scripts/verify.sh --build` (runs `test:agents`) |
| Dockerfiles, nginx, env vars, auth, routing, a user flow | `scripts/verify.sh --e2e` |
| `apps/docs` | `cd apps/docs && pnpm install --frozen-lockfile && pnpm types:check && pnpm build` |
| Native projects, Capacitor plugins, `apps/web/fastlane` | `cd apps/web && bundle exec fastlane android check && bundle exec fastlane ios check` |

Behaviour changes come with tests at the lowest level that can catch the regression:
- unit tests for logic;
- integration tests for SQL and transactions;
- E2E tests for flows and deployment wiring.

## Conventions

- **Types**: no `any`. Request and response shapes are Zod schemas in `libs/shared`, with their inferred types used on both sides.
- **Environment variables**: declare each new one in four places:
  - the Zod schema in `libs/shared/src/types/config/environments/api.environment.ts` (empty values count as unset);
  - `apps/api/.env.example`;
  - the compose files, if self-hosters need it;
  - the self-hosting docs table.
- **Optional integrations** (Stripe, Brevo, Firebase, Sentry): create clients lazily. When the integration is unconfigured, degrade cleanly: feature off, or HTTP 503 on its endpoints. Never crash at boot.
- **AI**: users bring their own keys and models; instance keys are a fallback that depends on the user's plan. All model calls go through `modules/ai` (see `apps/api/CLAUDE.md`).
- **Slow or bulk work** (provider history, AI calls, processing) runs in BullMQ jobs, never in an HTTP request.
- **Translations**: every user-facing string is a Paraglide message in `en`, `fr`, `it` and `es`. `pnpm check:locale-parity` must pass.
- **Privacy and security**:
  - never log full emails (`maskEmail`);
  - auth endpoints use the `RATE_LIMITS` presets;
  - webhooks verify their signature and skip throttling;
  - deleting data goes through `AccountDeletionService` (see `apps/api/CLAUDE.md`).
- **Dates**: store and bucket in UTC (`core/helpers/training-load.ts`). Tests run in several timezones.
- **Comments**: explain why, not what. Match the density of the surrounding code.

## Git

- Conventional commits: `type(scope): summary` (`feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `build`, `ci`). The body explains the why and the user-visible effect.
- Small, focused commits, each passing CI on its own.
- Never commit secrets or `.env` files, nor `DISCORD_FEEDBACK.md`: it is a local export of community feedback, excluded through `.git/info/exclude`.
- Releases: push a `vX.Y.Z` tag. `.github/workflows/release.yml` publishes multi-arch images to GHCR, uploads the mobile apps to TestFlight and Google Play testing, and creates the GitHub release. See `apps/web/docs/mobile-releases.md`.

## Skills

Project workflows live in `.claude/skills/`:

- `verify`: pick and run the right checks for a change.
- `e2e`: run, debug and extend the Playwright suite.
- `api-endpoint`: add an endpoint end to end, from the shared schema to the web hook.
- `prisma-migration`: change the database schema safely.
- `i18n`: add or change user-facing text in all locales.
- `review-pr`: review and land an external contribution.
- `triage-feedback`: collect GitHub and Discord feedback into priorities and draft replies.
- `release`: cut and verify a release.

## Gotchas

- `libs/shared` is consumed from `dist/`: rebuild it (`pnpm shared build`) before type-checking API or web.
- Jest cannot load Mastra's ESM providers. Agent tests use `node:test` against the build (`pnpm api build && pnpm api test:agents`).
- Paraglide output (`apps/web/src/paraglide`) is generated: recompile after editing `apps/web/messages/*.json`.
- Login is limited to 10 requests per minute per IP. Tests set `X-Forwarded-For`, which the API trusts only from private networks.
- `apps/docs` must be installed with pnpm 9.15.9 (`packageManager` field); pnpm 10 rewrites its lockfile.
