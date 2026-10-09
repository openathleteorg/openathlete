import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { StripeService } from 'src/modules/subscription/services/stripe.service';

import {
  COACH_ATHLETE_ID,
  COACH_USER_ID,
  DELETED_ATHLETE_ID,
  DELETED_USER_ID,
  accountFixtureSql,
} from './account-deletion.fixture';
import { AccountDeletionService } from './account-deletion.service';

// Integration test: needs a migrated, disposable PostgreSQL database.
//   INTEGRATION_DATABASE_URL=postgresql://... pnpm test:integration
// Every table is truncated, so it refuses to run without that variable.
const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );
}

type ForeignKey = {
  table: string;
  column: string;
  ref: string;
  rule: string;
};

/**
 * Foreign keys that block deleting a user or anything they own. Each one
 * must be handled by AccountDeletionService; extend this list (and the
 * service) when the schema gains a new one.
 */
const HANDLED_RESTRICT_KEYS = [
  'activity_feedback_embedding.event_activity_id -> event_activity',
  'activity_feedback_question.event_activity_id -> event_activity',
  'agent_thread.user_id -> user',
  'athlete.user_id -> user',
  'athlete_injury.athlete_id -> athlete',
  'athlete_invitation.user_id -> user',
  'athlete_settings.athlete_id -> athlete',
  'coach_athlete.athlete_id -> athlete',
  'coach_athlete.user_id -> user',
  'coach_invitation.athlete_user_id -> user',
  'equipment.athlete_id -> athlete',
  'event_activity.event_id -> event',
  'event_activity_normalization.event_activity_id -> event_activity',
  'event_activity_normalization_factor.event_activity_normalization_id -> event_activity_normalization',
  'event_activity_weather.event_activity_id -> event_activity',
  'event_competition.event_id -> event',
  'event_note.event_id -> event',
  'event_template.event_id -> event',
  'event_template.user_id -> user',
  'event_template_folder.user_id -> user',
  'event_training.event_id -> event',
  'provider_account.athlete_id -> athlete',
  'provider_workout_export.athlete_id -> athlete',
  'provider_workout_export.workout_id -> workout',
  'record.athlete_id -> athlete',
  'subscription.user_id -> user',
  'token.user_id -> user',
  'training_zone.athlete_id -> athlete',
  'training_zone_value.training_zone_id -> training_zone',
];

describe('AccountDeletionService (PostgreSQL)', () => {
  let prisma: PrismaService;
  let service: AccountDeletionService;
  const cancelSubscriptionNow = jest.fn<Promise<void>, [string]>();

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    service = new AccountDeletionService(prisma, {
      cancelSubscriptionNow,
    } as unknown as StripeService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function tables(): Promise<string[]> {
    const rows = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        AND table_name <> '_prisma_migrations'`;
    return rows.map((row) => row.table_name).sort();
  }

  async function foreignKeys(): Promise<ForeignKey[]> {
    return prisma.$queryRaw<ForeignKey[]>`
      SELECT tc.table_name AS "table", kcu.column_name AS "column",
             ccu.table_name AS "ref", rc.delete_rule AS "rule"
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
      JOIN information_schema.referential_constraints rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'`;
  }

  async function rowCounts(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const table of await tables()) {
      const [{ count }] = await prisma.$queryRawUnsafe<{ count: number }[]>(
        `SELECT count(*)::int AS count FROM "${table}"`,
      );
      if (count > 0) counts[table] = count;
    }
    return counts;
  }

  beforeEach(async () => {
    cancelSubscriptionNow.mockReset().mockResolvedValue(undefined);
    const list = (await tables()).map((table) => `"${table}"`).join(', ');
    await prisma.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
    for (const sql of accountFixtureSql) {
      await prisma.$executeRawUnsafe(sql);
    }
  });

  it('deletes everything the user owns and keeps the other account', async () => {
    await service.deleteAccount(DELETED_USER_ID);

    // Only the coach's own data is left: their user and athlete profile,
    // their AI key and model choice, their agent's access, and the direct
    // conversation with the message they wrote
    expect(await rowCounts()).toEqual({
      user: 1,
      athlete: 1,
      ai_credential: 1,
      ai_model_preference: 1,
      oauth_client: 1,
      mcp_grant: 1,
      mcp_token: 1,
      message_thread: 1,
      message_thread_participant: 1,
      message: 1,
    });

    const coach = await prisma.user.findUnique({
      where: { userId: COACH_USER_ID },
      include: { athlete: true },
    });
    expect(coach?.athlete?.athleteId).toBe(COACH_ATHLETE_ID);

    for (const key of await foreignKeys()) {
      const id =
        key.ref === 'user'
          ? DELETED_USER_ID
          : key.ref === 'athlete'
            ? DELETED_ATHLETE_ID
            : undefined;
      if (id === undefined) continue;
      const [{ count }] = await prisma.$queryRawUnsafe<{ count: number }[]>(
        `SELECT count(*)::int AS count FROM "${key.table}" WHERE "${key.column}" = $1`,
        id,
      );
      expect({ key: `${key.table}.${key.column}`, count }).toEqual({
        key: `${key.table}.${key.column}`,
        count: 0,
      });
    }
  });

  it('cancels an active Stripe subscription before deleting', async () => {
    await prisma.$executeRawUnsafe(
      `UPDATE subscription SET stripe_subscription_id = 'sub_123' WHERE user_id = ${DELETED_USER_ID}`,
    );

    await service.deleteAccount(DELETED_USER_ID);

    expect(cancelSubscriptionNow).toHaveBeenCalledWith('sub_123');
    expect(
      await prisma.user.count({ where: { userId: DELETED_USER_ID } }),
    ).toBe(0);
  });

  it('keeps the account when Stripe cannot cancel the subscription', async () => {
    await prisma.$executeRawUnsafe(
      `UPDATE subscription SET stripe_subscription_id = 'sub_123' WHERE user_id = ${DELETED_USER_ID}`,
    );
    cancelSubscriptionNow.mockRejectedValue(new Error('Stripe is down'));
    const before = await rowCounts();

    await expect(service.deleteAccount(DELETED_USER_ID)).rejects.toThrow(
      'Stripe is down',
    );

    expect(await rowCounts()).toEqual(before);
  });

  it('leaves the database untouched when the user does not exist', async () => {
    const before = await rowCounts();

    await expect(service.deleteAccount(999_999)).rejects.toThrow();

    expect(await rowCounts()).toEqual(before);
  });

  it('handles every foreign key that could block a deletion', async () => {
    const blocking = (await foreignKeys())
      .filter((key) => key.rule === 'RESTRICT' || key.rule === 'NO ACTION')
      .map((key) => `${key.table}.${key.column} -> ${key.ref}`)
      .sort();

    // A new blocking key means a new table to clean up on account deletion
    expect(blocking).toEqual(HANDLED_RESTRICT_KEYS);
  });
});
