---
name: api-endpoint
description: Add or change an OpenAthlete API endpoint end to end, from the shared Zod schema to the NestJS controller and service, the web API client, the React Query hook and the UI, with tests. Use for any feature that needs new data from or to the API.
---

# Add an endpoint

Work from the contract outwards, in this order. Each step names the file to follow as an example.

## 1. Contract in `libs/shared`

- Add the request schema next to related ones in `libs/shared/src/types/dtos/<area>/`, for example `equipment.dto.ts`: `export const createXDtoSchema = z.object({...})` and `export type CreateXDto = z.infer<typeof createXDtoSchema>`.
- Export it from the folder's `index.ts`. Response types come from `entities/` or a `*.response.dto.ts`.
- Constrain what the API must enforce (lengths, ranges, enums), because the web form reuses the schema.
- Run `pnpm shared build`.

## 2. API in `apps/api`

- **Controller**, in `modules/<domain>/controllers/`:
  - `@UseGuards(AuthGuard('jwt'), UserTypeGuard)` and `@ApiBearerAuth()`;
  - `@Body(new ZodValidationPipe(schema)) body: Dto`;
  - ids through `ParseIntPipe`;
  - `@ApiOperation` and `@ApiResponse` describing the success case and each error status.

  Keep it thin and call one service method.
- **Service**:
  - check access through CASL (`this.abilities.getFor({ user })`, then `accessibleBy(ability, 'read' | 'update').<Model>` in the Prisma `where`);
  - throw Nest HTTP exceptions;
  - use `$transaction` for several dependent writes.
- Anything slow (provider calls, AI, bulk work) goes in a BullMQ job. See "Patterns" in `apps/api/CLAUDE.md`.
- Unauthenticated public endpoints need a rate limit preset from `common/security/rate-limits.ts`.
- **Unit test** the service logic (`*.spec.ts`), with Prisma mocked when the logic is not SQL. A query whose correctness depends on SQL gets an integration test (`*.int-spec.ts`).

## 3. Web in `apps/web`

- `src/utils/axios.ts`: add the path to `routes.<domain>`, using functions for path parameters.
- `src/api/<domain>/<domain>.api.ts`: a static method typed with the shared DTOs.
- `<domain>.keys.ts` and `<domain>.hooks.ts`: a `useXQuery` or `useXMutation`. Mutations invalidate the keys whose data changed.
- UI:
  - forms use React Hook Form with the shared schema and the `RHF*` fields;
  - success and error feedback through `toast`;
  - every string through Paraglide, in all eight locales (`i18n` skill).

## 4. Verify

```bash
scripts/verify.sh            # plus --integration if SQL changed, --e2e for a new user flow
```

For a new user-facing flow, add a Playwright test in `e2e/tests/web/` (`e2e` skill). Open http://localhost:3000/docs to check the Swagger entry reads well.
