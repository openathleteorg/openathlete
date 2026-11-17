import { ConnectorProvider } from '@openathlete/database';

import {
  COACH_ATHLETE_ID,
  DELETED_ATHLETE_ID,
  accountFixtureSql,
} from 'src/modules/auth/services/account-deletion.fixture';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { activityToTakeOver, moveActivityToAthlete } from './activity-owner';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

// The fixture's run (event 3002, activity 3501, 'garmin-1') belongs to the
// first athlete; the second connects the same Garmin user
const ACTIVITY_ID = 3501;
const EVENT_ID = 3002;
const GARMIN_USER = 'garmin-user-1';

describe('activities following their provider user (PostgreSQL)', () => {
  let prisma: PrismaService;
  const newAccount = {
    athleteId: COACH_ATHLETE_ID,
    provider: ConnectorProvider.GARMIN,
    externalUserId: GARMIN_USER,
  };

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> '_prisma_migrations'`;
    await prisma.$executeRawUnsafe(
      `TRUNCATE ${tables.map((t) => `"${t.table_name}"`).join(', ')} RESTART IDENTITY CASCADE`,
    );
    for (const sql of accountFixtureSql) await prisma.$executeRawUnsafe(sql);
    await prisma.eventActivity.update({
      where: { eventActivityId: ACTIVITY_ID },
      data: { provider: ConnectorProvider.GARMIN },
    });
    await prisma.providerAccount.updateMany({
      where: { athleteId: DELETED_ATHLETE_ID },
      data: { externalUserId: GARMIN_USER, status: 'revoked' },
    });
  });

  it('takes over the activity of an earlier connection of the same user', async () => {
    await expect(
      activityToTakeOver(prisma, newAccount, 'garmin-1'),
    ).resolves.toBe(ACTIVITY_ID);
  });

  it('leaves it while the earlier connection is still active', async () => {
    await prisma.providerAccount.updateMany({
      where: { athleteId: DELETED_ATHLETE_ID },
      data: { status: 'active' },
    });
    await expect(
      activityToTakeOver(prisma, newAccount, 'garmin-1'),
    ).resolves.toBeNull();
  });

  it('leaves the activity of another provider user', async () => {
    await expect(
      activityToTakeOver(
        prisma,
        { ...newAccount, externalUserId: 'someone-else' },
        'garmin-1',
      ),
    ).resolves.toBeNull();
  });

  it('moves the activity and unlinks what was the previous athlete’s', async () => {
    await moveActivityToAthlete(prisma, ACTIVITY_ID, COACH_ATHLETE_ID);

    const event = await prisma.event.findUniqueOrThrow({
      where: { eventId: EVENT_ID },
      include: { activity: true },
    });
    expect(event.athleteId).toBe(COACH_ATHLETE_ID);
    expect(event.trainingWeekId).toBeNull();
    expect(event.activity?.equipmentId).toBeNull();
    expect(
      await prisma.eventTraining.count({
        where: { relatedActivityId: ACTIVITY_ID },
      }),
    ).toBe(0);
    expect(
      await prisma.eventCompetition.count({
        where: { relatedActivityId: ACTIVITY_ID },
      }),
    ).toBe(0);
    expect(
      await prisma.athleteInjury.count({
        where: { sourceActivityId: ACTIVITY_ID },
      }),
    ).toBe(0);
    expect(
      await prisma.garminPersonalItem.count({
        where: { eventActivityId: ACTIVITY_ID },
      }),
    ).toBe(0);
    // Computed again for the new athlete by the processing that follows
    expect(
      await prisma.record.count({ where: { eventActivityId: ACTIVITY_ID } }),
    ).toBe(0);
    expect(
      await prisma.trainingLoadEntry.count({
        where: { activityId: ACTIVITY_ID },
      }),
    ).toBe(0);
    // The athlete's own feedback goes with the activity
    expect(
      await prisma.activityFeedbackQuestion.count({
        where: { eventActivityId: ACTIVITY_ID },
      }),
    ).toBe(1);
  });
});
