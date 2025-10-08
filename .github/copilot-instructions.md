## OpenAthlete – AI Coding Agent Instructions

Purpose: Help you produce high–quality, idiomatic contributions quickly. Follow these project-specific patterns; avoid generic boilerplate.

### 1. Monorepo Layout & Workspaces

Packages managed with `pnpm` (see root `package.json`). Main areas:

- `apps/api` NestJS backend (Auth, Core domain, Notifications, Prisma integration)
- `apps/web` React + Vite frontend (React Query, Tailwind, ShadCN, Inlang i18n)
- `libs/database` Prisma client + schema (PostgreSQL, snake_case DB columns)
- `libs/shared` Cross-cutting TS utilities, DTO-ish types, key mappers, email helpers
  Lab prototypes under `lab/` (do NOT assume production stability there).

### 2. Data & Naming Conventions

- Database (Prisma schemas in `libs/database/prisma/schema/*.prisma`) uses `snake_case`.
- API & frontend use `camelCase` objects. Always convert DB results with `keysToCamel` (`libs/shared/src/utils/data.mapper.ts`). Example: in services (`apps/api/src/modules/core/services/athlete.service.ts`) results are wrapped before returning.
- When accepting inbound payloads to persist, convert to snake_case with `keysToSnake` if writing generic helpers.
- Avoid duplicating mapper logic; import from `@openathlete/shared`.

### 3. Authorization & Access Control

- CASL governs fine-grained permissions. Factory: `apps/api/src/modules/auth/services/casl-ability.factory.ts`.
- Pattern: build ability per request, check with `ability.can('read', subject('athlete', athleteEntity))` before returning sensitive data.
- When adding a new entity: extend Subjects in the ability factory and add `can()` rules close to similar ones (group by domain not alphabetically).

### 4. Service / Module Structure (Backend)

- Modules reside in `apps/api/src/modules/*`.
- Keep pure domain logic in `core/services/*` (e.g. `athlete.service.ts`, `equipment.service.ts`). Each service: fetch via `PrismaService`, authorize via CASL, map keys.
- Shared includes selectors (`ATHLETE_INCLUDES` pattern) to prevent over-fetching—reuse or define const include objects near top of service.
- Environment validation via Zod: `libs/shared/src/types/config/environments/*`. Add new required vars to schema + `.env.example`.

### 5. Environment & Secrets

- Local setup: copy `apps/web/.env.example` & `apps/api/.env.example` to real `.env` files.
- Required backend vars include STRAVA*\* and BREVO*\* (see `ApiEnvSchema`). If adding integration require: update schema + docs + example file.

### 6. OAuth / Connector Integrations

- Current external sport provider: Strava.
- Frontend trigger: `apps/web/src/views/dashboard/settings-view/connectors-tab.tsx` calling mutation to fetch provider auth URI.
- For new connector: mirror Strava pattern—add provider enum mapping (`utils/connector-provider.ts`, label map, icon), extend env schema, backend endpoint to generate OAuth URL, and DB persistence for tokens.

### 7. Frontend Patterns

- State & data fetching via React Query; mutations follow `useXMutation` naming inside `apps/web/src/services/`.
- Routing: React Router v7 under `apps/web/src/routes` (check before modifying navigation flows).
- UI components (ShadCN/Radix) use Tailwind utility classes. Favor composition over deep prop drilling.
- Internationalization uses Inlang Paraglide (`project.inlang`, `messages/`). When adding user-visible strings: use translation functions not literals.

### 8. Testing & Quality Gates

- Backend uses Jest (see `apps/api/package.json` `jest` section). Name tests `*.spec.ts` inside `src`.
- Run type/lint/format checks repo-wide: `pnpm tsc:check`, `pnpm lint`, `pnpm format`.
- Prefer adding a focused spec when introducing new service logic or authorization rule.

### 9. Build & Dev Workflows

- Install: `pnpm install` (Node 22 per root `engines`).
- First build shared libs if needed: `pnpm shared build` (some scripts rely on prior dist output).
- DB migrations deploy: `pnpm database run db:deploy` (wraps Prisma migrate deploy). Do NOT hand-edit generated client.
- Start dev (parallel web + api): `pnpm dev`.
- Individual package dev: `pnpm api dev` or `pnpm web dev`.

### 10. Database & Prisma

- Schema split across multiple prisma files; root `schema.prisma` just wires generator + datasource.
- Each domain file (e.g. `athlete.prisma`, `event.prisma`) contributes models via `prisma/schema/schema.prisma` inclusion pattern (ensure imports consistent when adding new file).
- After changing schema: run migration (appropriate script in `libs/database`) then commit both migration folder + updated generated types if generated.

### 11. Error & Exception Handling

- Backend throws Nest exceptions (`NotFoundException`, `ForbiddenException`) early; do not return `null` for missing entities—match existing services.
- Wrap external API failures (Strava, Brevo) with meaningful Nest HTTP exceptions to propagate consistent error shapes.

### 12. Adding New Domain Features (Backend Checklist)

1. Define Prisma model / extend existing.
2. Run migration + regenerate client.
3. Add service in `core/services`, include: fetch (Prisma), authorize (CASL), map (keysToCamel).
4. Expose via controller in `core/controllers` (follow existing naming; use DTO or Zod schema if pattern emerges).
5. Update CASL factory if new resource needs access control.

### 13. Common Anti-Patterns to Avoid

- Duplicating key conversion code—import from shared utils.
- Returning raw Prisma objects (snake_case) to controllers.
- Adding env vars without updating Zod schema + example files.
- Bypassing ability checks for user-bound resources.

### 14. Helpful Imports

- Prisma client: `import { PrismaService } from 'src/modules/prisma/services/prisma.service';`
- Key mapping: `import { keysToCamel } from '@openathlete/shared';`
- Ability: `const ability = await this.abilities.getFor({ user });`

### 15. When Unsure

Look for an analogue service/controller and mirror structure; consistency > novelty.

### Miscellaneous

- All the comments in the codebase should be written in English.
- Use `// TODO:` comments to indicate areas needing future work.
- Always add text in multiple languages using the i18n system and paraglide.

---

Provide feedback if any section is unclear or missing for future refinement.
