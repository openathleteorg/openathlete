import axios from 'axios';

import { ConfigService } from '@nestjs/config';

import { ProviderAccount } from '@openathlete/database';
import type { ApiEnvSchemaType } from '@openathlete/shared';

import { accountFixtureSql } from '../../auth/services/account-deletion.fixture';
import { ActivityFileParserService } from '../../core/helpers/activity-file-parser.service';
import { PrismaService } from '../../prisma/services/prisma.service';
import { QueueService } from '../../queue/queue.service';
import { SuuntoProviderService } from './suunto.provider.service';

// The FIT SDK is ESM, which Jest cannot load
jest.mock('../../core/helpers/activity-file-parser.service', () => ({
  ActivityFileParserService: class {},
}));

jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  return {
    __esModule: true,
    ...actual,
    default: { ...actual, get: jest.fn() },
  };
});

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

const mockedGet = axios.get as jest.Mock;

const account = {
  providerAccountId: 3,
  athleteId: 2001,
  provider: 'SUUNTO',
  status: 'active',
  accessToken: 'access',
  refreshToken: 'refresh',
  expiresAt: new Date(Date.now() + 3600_000),
  importActivitiesEnabled: true,
  importMetricsEnabled: false,
} as unknown as ProviderAccount;

/** A workout of the list, which leaves `workoutName` empty as Suunto does */
const workout = (key: string, activityId: number) => ({
  workoutKey: key,
  activityId,
  startTime: Date.parse('2026-11-10T07:00:00Z'),
  totalTime: 1800,
  totalDistance: 0,
});

describe('SuuntoProviderService.queueFullImport (PostgreSQL)', () => {
  let prisma: PrismaService;

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
    // Saved by earlier imports: one whose FIT file was refused, one complete
    // but named after its key, one the athlete renamed
    await prisma.$executeRawUnsafe(
      `INSERT INTO event (event_id, start_date, end_date, name, type, athlete_id, updated_at) VALUES
        (3101, '2026-11-01', '2026-11-01', 'Suunto Workout 6af1bb4e14c9cd03', 'ACTIVITY', 2001, now()),
        (3102, '2026-11-02', '2026-11-02', 'Suunto Workout 6aef458e2c14341d', 'ACTIVITY', 2001, now()),
        (3103, '2026-11-03', '2026-11-03', 'Leg day', 'ACTIVITY', 2001, now())`,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO event_activity (event_id, distance, elevation_gain, external_id, average_speed, max_speed, moving_time, sport, provider, stream) VALUES
        (3101, 0, 0, '6af1bb4e14c9cd03', 0, 0, 1800, 'CYCLING', 'SUUNTO', '{}'),
        (3102, 0, 0, '6aef458e2c14341d', 0, 0, 1800, 'WEIGHT_TRAINING', 'SUUNTO', '{"time": [0, 1]}'),
        (3103, 0, 0, '6aeddf7c78c4740c', 0, 0, 1800, 'WEIGHT_TRAINING', 'SUUNTO', '{"time": [0, 1]}')`,
    );
    mockedGet.mockReset();
  });

  it('fetches again the files it missed, names activities after their sport, and keeps the names athletes chose', async () => {
    mockedGet.mockResolvedValue({
      data: {
        error: null,
        payload: [
          workout('6af1bb4e14c9cd03', 52),
          workout('6aef458e2c14341d', 23),
          workout('6aeddf7c78c4740c', 23),
          workout('6ae0000000000001', 1),
        ],
        metadata: {},
      },
    });
    const queue = { addActivityImportJobs: jest.fn() };
    const service = new SuuntoProviderService(
      prisma,
      { get: () => undefined } as unknown as ConfigService<
        ApiEnvSchemaType,
        true
      >,
      queue as unknown as QueueService,
      {} as ActivityFileParserService,
    );
    jest.spyOn(prisma.providerAccount, 'findUnique').mockResolvedValue(account);

    const result = await service.queueFullImport(account);

    const queued = queue.addActivityImportJobs.mock.calls[0][1];
    expect(
      queued.map((a: { externalId: string; name: string }) => [
        a.externalId,
        a.name,
      ]),
    ).toEqual([
      ['6af1bb4e14c9cd03', 'Indoor cycling'],
      ['6ae0000000000001', 'Running'],
    ]);
    expect(result).toMatchObject({ queuedActivities: 2 });

    const names = await prisma.event.findMany({
      where: { eventId: { in: [3101, 3102, 3103] } },
      orderBy: { eventId: 'asc' },
      select: { name: true },
    });
    expect(names.map((e) => e.name)).toEqual([
      'Indoor cycling',
      'Gym',
      'Leg day',
    ]);
  });
});
