import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { EventEmitter2 } from '@nestjs/event-emitter';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { QueueService } from 'src/modules/queue/queue.service';

import { ActivityDuplicateService } from './activity-duplicate.service';
import { EventService } from './event.service';
import { ManualFitImportService } from './manual-fit-import.service';

// An ESM package Jest cannot load, pulled in by the FIT import; unused here
jest.mock('@garmin/fitsdk', () => ({}));

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

const GPX = readFileSync(
  join(__dirname, '../../../../../../e2e/fixtures/synthetic-run.gpx'),
);
const ATHLETES = 8;
const file = () => ({
  buffer: GPX,
  originalname: 'run.gpx',
  size: GPX.length,
});
const user = (i: number) => ({ userId: 6000 + i }) as AuthUser;

describe('manual imports at the same moment (PostgreSQL)', () => {
  let prisma: PrismaService;
  let service: ManualFitImportService;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    const events = new EventService(
      prisma,
      new CaslAbilityFactory(),
      new EventEmitter2(),
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    service = new ManualFitImportService(
      prisma,
      {
        addActivityProcessingJob: jest.fn().mockResolvedValue(undefined),
      } as unknown as QueueService,
      new ActivityDuplicateService(prisma, events, {} as never),
    );
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
    for (let i = 0; i < ATHLETES; i++) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "user" (user_id, email, password, first_name, last_name, updated_at)
         VALUES (${6000 + i}, 'runner${i}@example.test', 'x', 'Runner', '${i}', now())`,
      );
      await prisma.$executeRawUnsafe(
        `INSERT INTO athlete (athlete_id, user_id, updated_at) VALUES (${7000 + i}, ${6000 + i}, now())`,
      );
    }
  });

  // The same run, uploaded by several athletes at once, used to fail to
  // serialize and come back as GPX_CONFLICT
  it('saves every athlete their own copy of the same workout', async () => {
    const results = await Promise.all(
      Array.from({ length: ATHLETES }, (_, i) =>
        service.importGpx(user(i), file(), 'Morning run'),
      ),
    );

    expect(results.every((result) => !result.alreadyImported)).toBe(true);
    expect(await prisma.event.count({ where: { type: 'ACTIVITY' } })).toBe(
      ATHLETES,
    );
  });

  it('keeps one copy when an athlete sends the same file twice at once', async () => {
    const results = await Promise.all([
      service.importGpx(user(0), file(), 'Morning run'),
      service.importGpx(user(0), file(), 'Morning run'),
    ]);

    expect(results.map((result) => result.alreadyImported).sort()).toEqual([
      false,
      true,
    ]);
    expect(await prisma.event.count({ where: { athleteId: 7000 } })).toBe(1);
  });
});
