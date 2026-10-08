# API (NestJS)

The same image runs as the HTTP API and as the background worker. Which BullMQ processors a container starts depends on `ENABLE_ACTIVITY_IMPORT`, `ENABLE_ACTIVITY_PROCESSING` and `ENABLE_TRAINING_LOAD_ESTIMATION`. In production the API runs none and the worker runs them. The self-host `docker-compose.yml` runs them in the API container.

## Layout

- `src/modules/<domain>/`: `controllers/`, `services/`, a `*.module.ts`. Domains include:
  - `auth` (users, JWT, CASL, invitations, account deletion);
  - `core` (events, workouts, athletes, metrics, training load);
  - `providers-sync` (Strava, Garmin, Polar, Suunto, Coros, with OAuth, webhooks, import and export);
  - `queue` (BullMQ queues and processors);
  - `notification` (emails, push);
  - `subscription` (Stripe on the web, App Store purchases in the iOS app, verified against Apple's signatures; see `apps/web/docs/mobile-releases.md`);
  - `agent` (AI features).
- `src/mastra/agents/`: Mastra 1 agents. Model ids (`provider/model`) come from `common/constants/ai-models.constant.ts`.
- `src/events/` and `src/listeners/`: typed in-process events (`EventEmitter2`). Use them for side effects such as emails, push notifications and AI feedback, so they stay out of request handlers.
- `src/common/`: env validation, rate limits, shared utils.

## Patterns

- **Endpoints**:
  - guard with `@UseGuards(AuthGuard('jwt'), UserTypeGuard)` and take the user from `@JwtUser() user: AuthUser`;
  - validate bodies with `new ZodValidationPipe(schemaFromShared)`;
  - parse ids with `ParseIntPipe`, using `{ optional: true }` for optional query params;
  - document with `@ApiOperation` and `@ApiResponse`.
- **Authorization**: get the user's ability (`this.abilities.getFor({ user })`) and filter queries with `accessibleBy(ability, 'read').Event`. A coach reads their athletes' data through the same rules, so never filter by `athleteId` alone.
- **Errors**: throw Nest HTTP exceptions (`NotFoundException`, `BadRequestException`...). A plain `Error` becomes a 500.
- **Rate limits**: a global default applies. Auth and public write endpoints use the presets in `common/security/rate-limits.ts`. Webhooks and `/health` use `@SkipThrottle()`.
- **Long work**:
  - add a job in `QueueService` and handle it in `modules/queue/processors/`;
  - register the queue in `queue.module.ts`, behind the matching `ENABLE_*` flag;
  - a processor must be idempotent;
  - throw `UnrecoverableError` for failures a retry cannot fix;
  - clear any "in progress" state once the last attempt fails.
- **Optional third parties** (Stripe, OpenAI, Brevo, Firebase): create the client on first use and throw `ServiceUnavailableException` when it is not configured. The API must boot with only `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET_KEY` and `HASH_PEPPER`.
- **Emails**: templates in `modules/notification/emails/templates/` hold one translation block per language (`FR`, `EN`, `IT`, `ES`). Send through the `SendEmailEvent`; `EmailTransportService` (Brevo) is a no-op without a key.

## Data and deletion

- Prisma comes from `PrismaService`. Use `$transaction` when several writes must succeed together.
- `AccountDeletionService` erases a user and everything they own. When you add a table with a foreign key to `user`, `athlete`, `event`, `event_activity` or `workout`:
  - handle it in the service;
  - add the key to `HANDLED_RESTRICT_KEYS` in `account-deletion.int-spec.ts`;
  - seed it in `account-deletion.fixture.ts`.

  The integration test fails until you do.

## AI features

Every model call goes through `modules/ai`. No agent runs on a hardcoded model or key.

- **Agents** are model-free specs (`AgentSpec`: id, name, instructions) in `src/mastra/agents/`. Their structured outputs are Zod schemas in `src/mastra/agents/outputs.ts`.
- **Which model and key**: `AiModelResolverService` decides, per `AiTask`, in this order:
  1. the user's model for that task, or their DEFAULT model, on their own encrypted key (Settings > AI);
  2. otherwise the instance keys from env (`AI_MODEL_*`, `AI_MODEL_DEFAULT`), when `AI_HOSTED_ACCESS` allows: subscribers, everyone or none.

  The instance keys also stop once the user's monthly budget is spent (`AI_HOSTED_MONTHLY_BUDGET_USD`, unset: no limit). `AiService` counts every call's tokens in `ai_usage`, per user, month, task and key source, and charges calls on the instance keys at the prices of `HOSTED_MODEL_PRICES` (`AiUsageService`). Add a model there before making it a hosted default.

  Use `resolveForUser` for user-triggered features: it throws `AI_NOT_CONFIGURED`, or `AI_HOSTED_QUOTA_EXCEEDED` when only the allowance is missing (403). Use `tryResolveForAthlete` for background work: it tries the athlete, then each coach, and returns null to skip.
- **Running**: `AiService.generateText` or `generateObject(agent, model, prompt, schema)`. It handles:
  - the timeout;
  - portable structured output (`jsonPromptInjection: 'auto'`, OpenAI strict mode off);
  - error mapping to 422 `AI_CREDENTIAL_REJECTED`, `AI_QUOTA_EXCEEDED` or `AI_PROVIDER_ERROR`;
  - the key's health (`lastError`, `lastUsedAt`).

  The provider SDK already retries transient errors. Callers retry only invalid answers (`isRetryableAiError`).
- **A new AI feature** needs:
  - a value in the `AiTask` enum (Prisma migration, plus the shared enum);
  - a hosted default in `common/constants/ai-models.constant.ts`;
  - a label in the web app (`aiTaskLabel`);
  - a call through the resolver and `AiService`.
- **Security**: keys are encrypted with AES-256-GCM (derived from `HASH_PEPPER`) and never returned. Custom endpoints and local-URL providers are refused unless `AI_ALLOW_CUSTOM_ENDPOINTS` (default: off with Stripe), since the server calls those URLs.
- **Verify against the build**: `pnpm build && pnpm test:agents` exercises fake OpenAI, Anthropic and OpenAI-compatible APIs. It checks which key each provider receives and how errors map, and that the module graph loads (circular imports).

## Tests

| Kind | Files | Run |
| --- | --- | --- |
| Unit | `src/**/*.spec.ts` (Jest) | `pnpm test` |
| Integration | `src/**/*.int-spec.ts` (Jest, real PostgreSQL) | `INTEGRATION_DATABASE_URL=... pnpm test:integration`, or `scripts/verify.sh --integration` |
| AI agents | `test/agents.test.cjs` (`node:test` on `dist/`) | `pnpm build && pnpm test:agents` |

Integration tests truncate every table, so point them at a disposable database only. Test files are excluded from the production build (`tsconfig.build.json`).
