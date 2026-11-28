---
name: prisma-migration
description: Change the OpenAthlete database schema safely with Prisma, covering the migration SQL, production safety, account deletion coverage and tests. Use whenever a .prisma file in libs/database changes or a migration is needed.
---

# Change the database schema

The schema is split by domain in `libs/database/prisma/schema/*.prisma`. Migrations are in `libs/database/prisma/schema/migrations/`. Production runs `prisma migrate deploy` when the API container starts (`apps/api/scripts/docker-entrypoint.sh`), including on self-hosted instances you don't control.

## Steps

1. Edit the model. Map names to snake_case (`@map`, `@@map`), as the existing models do.
2. Create the migration without applying it, against your dev database:
   ```bash
   pnpm database exec prisma migrate dev --create-only --name <short_description>
   ```
3. **Read the generated SQL** and make it safe for live data:
   - A new column on an existing table needs a default or must be nullable. Backfill it in the same migration if needed.
   - Never drop or rename a column that a running version still reads. Add the new one, deploy, migrate the reads, then drop it in a later release.
   - Enum values: `ALTER TYPE ... ADD VALUE` is fine. Removing a value needs a data migration.
   - Indexes on large tables (`event`, `event_activity`, `record`): consider `CREATE INDEX CONCURRENTLY` in a separate migration.
4. Apply and regenerate: `pnpm database run db:migrate` then `pnpm database run db:generate`.
5. **Account deletion**: a new foreign key to `user`, `athlete`, `event`, `event_activity` or `workout` must be handled in `apps/api/src/modules/auth/services/account-deletion.service.ts`. Then:
   - add it to `HANDLED_RESTRICT_KEYS` in `account-deletion.int-spec.ts`, if its delete rule is `RESTRICT` or `NO ACTION` (the keys that block a deletion);
   - seed a row in `account-deletion.fixture.ts`.

   Prefer `onDelete: Cascade` for data that has no meaning without its parent.
6. Update the Zod schemas in `libs/shared` if the API exposes the new fields.

## Verify

```bash
scripts/verify.sh --integration
```

It applies every migration to an empty database, then runs the integration tests, including the account deletion test that inspects foreign keys. Mention the migration in the commit body, as the deploy runs it.
