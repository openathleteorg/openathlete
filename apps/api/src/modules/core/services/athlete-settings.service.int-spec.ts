import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { accountFixtureSql } from 'src/modules/auth/services/account-deletion.fixture';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { AthleteSettingsService } from './athlete-settings.service';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

// User 1001 of the fixture, athlete 2001
const athlete: AuthUser = {
  userId: 1001,
  email: 'athlete@example.com',
  athlete: { athleteId: 2001 },
  coachAthletes: [],
};

describe('AthleteSettingsService (PostgreSQL)', () => {
  let prisma: PrismaService;
  let service: AthleteSettingsService;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    const abilities = { getFor: async () => ({ can: () => true }) };
    service = new AthleteSettingsService(prisma, abilities as never);
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
    // A new account: no settings yet
    await prisma.athleteSettings.deleteMany({ where: { athleteId: 2001 } });
  });

  it('creates the settings once when several pages ask for them at the same time', async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        service.getSettingsForAthlete(athlete, 2001),
      ),
    );

    const ids = new Set(results.map((s) => s.athleteSettingsId));
    expect(ids.size).toBe(1);
    expect(results[0]).toMatchObject({
      requireRpe: false,
      requireComment: false,
      requireFeedbackQuestions: true,
    });
    await expect(
      prisma.athleteSettings.count({ where: { athleteId: 2001 } }),
    ).resolves.toBe(1);
  });

  it('returns the settings already saved', async () => {
    await service.updateSettings(athlete, 2001, { requireRpe: true });
    await expect(
      service.getSettingsForAthlete(athlete, 2001),
    ).resolves.toMatchObject({ requireRpe: true });
  });
});
