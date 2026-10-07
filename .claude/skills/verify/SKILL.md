---
name: verify
description: Run the right OpenAthlete checks before committing or pushing a change (lint, types, unit, integration, AI agent and end-to-end tests). Use after editing code, before a commit, or when asked whether a change is safe.
---

# Verify a change

Always start with the fast suite, which mirrors the CI static jobs:

```bash
scripts/verify.sh
```

It installs dependencies, generates the Prisma client, builds `libs/shared`, compiles translations, checks locale parity, then lints, type-checks and runs every unit test (in a non-UTC timezone). It stops at the first failure and prints that step's log.

Then add what the change touches:

| Changed | Command | Why |
| --- | --- | --- |
| `libs/database` schema, SQL, transactions, anything deleting data | `scripts/verify.sh --integration` | Runs `*.int-spec.ts` on a throwaway PostgreSQL (Docker, port 15436) |
| `apps/api/src/mastra`, prompts, structured outputs, AI SDK versions | `scripts/verify.sh --build` | Builds everything and runs `test:agents` against a fake OpenAI API |
| Dockerfiles, nginx, env vars, auth, routing, a page or user flow | `scripts/verify.sh --e2e` | Builds the production images and runs Playwright (ports 13000 and 18080) |
| Dependency upgrades, release preparation | `scripts/verify.sh --all` | Everything CI runs |
| `apps/docs` | `cd apps/docs && pnpm install --frozen-lockfile && pnpm types:check && pnpm build` | Standalone project |
| `apps/web/android`, `apps/web/ios`, Capacitor plugins, `apps/web/fastlane` | `cd apps/web && bundle exec fastlane android check && bundle exec fastlane ios check` | Builds both native apps unsigned, as the Mobile workflow does (needs Ruby, Java 21 and the Android SDK, Xcode 26+) |

## When a step fails

- Read the printed log and fix the cause. Never skip a check or weaken a test to get green.
- `type-check` errors in API or web after a `libs/shared` change: the shared build is stale. `verify.sh` rebuilds it, so check the shared code itself.
- `unit-tests` failing only in `TZ=America/New_York`: a date is computed in local time. Use the UTC helpers in `apps/api/src/modules/core/helpers/training-load.ts`.
- `e2e-*` failures: follow the `e2e` skill to read the report and service logs.

## Report

State which suites ran and their result. If something could not be run (Docker unavailable, a port in use), say so explicitly rather than implying it passed.
