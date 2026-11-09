import { ConfigService } from '@nestjs/config';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import {
  EmailTransportService,
  OutgoingEmail,
} from '../services/email-transport.service';
import { LifecycleEmailScheduler } from './lifecycle-email.scheduler';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
// A Monday, 10:00 UTC, early in the month: every email can go out
const NOW = new Date('2026-11-02T10:00:00Z');
const ago = (ms: number) => new Date(NOW.getTime() - ms);

describe('lifecycle emails (PostgreSQL)', () => {
  let prisma: PrismaService;
  let sent: OutgoingEmail[];
  let failNext: boolean;
  let env: Partial<ApiEnvSchemaType>;
  let scheduler: LifecycleEmailScheduler;

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
    sent = [];
    failNext = false;
    env = {
      EMAIL_SIGNATURE: 'Tristan',
      APP_URL: 'https://app.example',
      API_PUBLIC_URL: 'https://api.example',
      JWT_SECRET_KEY: 'secret',
    };
    const transport = {
      isEnabled: () => true,
      send: async (email: OutgoingEmail) => {
        if (failNext) {
          failNext = false;
          throw new Error('Brevo is down');
        }
        sent.push(email);
        return true;
      },
    } as unknown as EmailTransportService;
    scheduler = new LifecycleEmailScheduler(prisma, transport, {
      get: (key: keyof ApiEnvSchemaType) => env[key],
    } as unknown as ConfigService<ApiEnvSchemaType, true>);
  });

  let nextId = 1;
  const createUser = (
    overrides: { createdAt?: Date; onboardingCompleted?: boolean } = {},
  ) => {
    const id = nextId++;
    return prisma.user.create({
      data: {
        email: `runner${id}@example.com`,
        password: 'x',
        firstName: 'Ana',
        lastName: 'Lopez',
        language: 'EN',
        timeZone: 'UTC',
        onboardingCompleted: overrides.onboardingCompleted ?? true,
        createdAt: overrides.createdAt ?? ago(30 * HOUR),
        athlete: { create: {} },
      },
      select: { userId: true, athlete: { select: { athleteId: true } } },
    });
  };

  const addActivity = (athleteId: number, startDate: Date, distance: number) =>
    prisma.event.create({
      data: {
        name: `Run of ${startDate.toISOString().slice(0, 10)}`,
        type: 'ACTIVITY',
        startDate,
        endDate: new Date(startDate.getTime() + HOUR),
        athleteId,
        activity: {
          create: {
            distance,
            elevationGain: 50,
            movingTime: 3600,
            averageSpeed: 3,
            maxSpeed: 4,
            externalId: `${athleteId}-${startDate.getTime()}`,
            sport: 'RUNNING',
          },
        },
      },
    });

  it('reminds a new account to connect a watch, once', async () => {
    const user = await createUser();
    // Robots never finish onboarding
    await createUser({ onboardingCompleted: false });

    expect(await scheduler.sendLifecycleEmails(NOW)).toBe(1);
    expect(await scheduler.sendLifecycleEmails(NOW)).toBe(0);

    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe('runner1@example.com');
    expect(sent[0].subject).toBe("Your watch isn't connected yet");
    expect(sent[0].senderName).toBe('Tristan · OpenAthlete');
    expect(sent[0].headers).toEqual({
      'List-Unsubscribe': expect.stringMatching(
        new RegExp(
          `^<https://api\\.example/emails/unsubscribe\\?token=${user.userId}\\.tips\\.[\\w-]+>$`,
        ),
      ),
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    });
    expect(sent[0].text).toContain(
      'https://app.example/dashboard/settings?tab=connectors',
    );
    expect(
      await prisma.lifecycleEmail.findMany({
        select: { userId: true, kind: true, ref: true },
      }),
    ).toEqual([{ userId: user.userId, kind: 'CONNECT_REMINDER', ref: '' }]);
  });

  it('gives the claim back when sending fails, to try again later', async () => {
    await createUser();
    failNext = true;

    expect(await scheduler.sendLifecycleEmails(NOW)).toBe(0);
    expect(await prisma.lifecycleEmail.count()).toBe(0);

    expect(await scheduler.sendLifecycleEmails(NOW)).toBe(1);
  });

  it('sends nothing without a signature', async () => {
    await createUser();
    env.EMAIL_SIGNATURE = undefined;

    expect(await scheduler.sendLifecycleEmails(NOW)).toBe(0);
    expect(sent).toEqual([]);
  });

  it('tells, with figures, when the history is in', async () => {
    const user = await createUser({ createdAt: ago(3 * DAY) });
    const athleteId = user.athlete!.athleteId;
    await prisma.providerAccount.create({
      data: {
        athleteId,
        provider: 'GARMIN',
        accessToken: 'x',
        createdAt: ago(2 * DAY),
        fullImportCompletedAt: ago(DAY),
      },
    });
    await addActivity(athleteId, new Date('2025-03-10T07:00:00Z'), 8000);
    await addActivity(athleteId, ago(3 * DAY), 10_000);
    await addActivity(athleteId, ago(10 * DAY), 12_500);

    expect(await scheduler.sendLifecycleEmails(NOW)).toBe(1);
    expect(sent[0].subject).toBe('3 sessions imported');
    expect(sent[0].text).toContain(
      'Your Garmin history is in: 3 sessions since March 2025.',
    );
    expect(sent[0].text).toContain(
      'Sessions: 2\nDistance: 22.5 km\nTime: 2h 00m',
    );
    expect(sent[0].text).toContain(
      'Add my race: https://app.example/dashboard/calendar',
    );
  });

  it('recaps the past month of a regular, on its own list', async () => {
    const user = await createUser({ createdAt: ago(200 * DAY) });
    const athleteId = user.athlete!.athleteId;
    await prisma.providerAccount.create({
      data: {
        athleteId,
        provider: 'STRAVA',
        accessToken: 'x',
        createdAt: ago(200 * DAY),
      },
    });
    // Already told about the import, long ago, and planning: only the recap is due
    await prisma.lifecycleEmail.create({
      data: {
        userId: user.userId,
        kind: 'IMPORT_DONE',
        sentAt: ago(190 * DAY),
      },
    });
    await prisma.event.create({
      data: {
        name: 'Tempo',
        type: 'TRAINING',
        startDate: ago(-DAY),
        endDate: ago(-DAY),
        athleteId,
      },
    });
    for (const day of [3, 8, 15, 22]) {
      await addActivity(
        athleteId,
        new Date(`2026-10-${String(day).padStart(2, '0')}T07:00:00Z`),
        10_000,
      );
    }
    await addActivity(athleteId, new Date('2026-09-12T07:00:00Z'), 20_000);

    expect(await scheduler.sendLifecycleEmails(NOW)).toBe(1);
    expect(sent[0].subject).toBe('October: 40 km in 4 sessions');
    expect(sent[0].text).toContain("That's 100% more than in September.");
    expect(sent[0].headers!['List-Unsubscribe']).toContain(
      `token=${user.userId}.recap.`,
    );
    expect(
      await prisma.lifecycleEmail.findFirst({
        where: { kind: 'MONTHLY_RECAP' },
        select: { ref: true },
      }),
    ).toEqual({ ref: '2026-10' });
  });
});
