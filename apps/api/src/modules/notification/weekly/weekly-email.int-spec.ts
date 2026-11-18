import { ConfigService } from '@nestjs/config';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import {
  EmailTransportService,
  OutgoingEmail,
} from '../services/email-transport.service';
import { WeeklyEmailService } from './weekly-email.service';
import { showsSupporterBar } from './weekly-window';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const MONDAY = '2026-11-23';
// Monday 7:05 in Paris (UTC+1)
const NOW = new Date('2026-11-23T06:05:00Z');
const ago = (ms: number) => new Date(NOW.getTime() - ms);
const at = (local: string) => new Date(`${local}+01:00`);

describe('weekly email (PostgreSQL)', () => {
  let prisma: PrismaService;
  let sent: OutgoingEmail[];
  let failNext: boolean;
  let env: Partial<ApiEnvSchemaType>;
  let service: WeeklyEmailService;

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
    // Ids start again at 1 with the tables: emails follow them
    nextId = 1;
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
          throw new Error('The provider is down');
        }
        sent.push(email);
        return true;
      },
    } as unknown as EmailTransportService;
    service = new WeeklyEmailService(prisma, transport, {
      get: (key: keyof ApiEnvSchemaType) => env[key],
    } as unknown as ConfigService<ApiEnvSchemaType, true>);
  });

  let nextId = 1;
  const createUser = (
    overrides: {
      timeZone?: string;
      emailWeekly?: boolean;
      emailNewsConsentAt?: Date;
      language?: 'EN' | 'FR';
    } = {},
  ) => {
    const id = nextId++;
    return prisma.user.create({
      data: {
        email: `runner${id}@example.com`,
        password: 'x',
        firstName: 'Ana',
        lastName: 'Lopez',
        language: overrides.language ?? 'EN',
        timeZone: overrides.timeZone ?? 'Europe/Paris',
        onboardingCompleted: true,
        emailWeekly: overrides.emailWeekly ?? true,
        emailNewsConsentAt: overrides.emailNewsConsentAt ?? null,
        athlete: { create: {} },
      },
      select: { userId: true, athlete: { select: { athleteId: true } } },
    });
  };

  let nextActivity = 1;
  const addActivity = async (
    athleteId: number,
    startDate: Date,
    options: { distance?: number; trimp?: number; provider?: 'GARMIN' } = {},
  ) => {
    const event = await prisma.event.create({
      data: {
        name: `Run ${nextActivity}`,
        type: 'ACTIVITY',
        startDate,
        endDate: new Date(startDate.getTime() + HOUR),
        athleteId,
        activity: {
          create: {
            distance: options.distance ?? 10_000,
            elevationGain: 100,
            movingTime: 3600,
            averageSpeed: 3,
            maxSpeed: 4,
            externalId: `activity-${nextActivity++}`,
            sport: 'RUNNING',
            provider: options.provider ?? 'STRAVA',
          },
        },
      },
      select: { activity: { select: { eventActivityId: true } } },
    });
    const activityId = event.activity!.eventActivityId;
    if (options.trimp) {
      const calculation = await prisma.trainingLoadCalculation.upsert({
        where: { athleteId_type: { athleteId, type: 'TRIMP' } },
        create: { athleteId, type: 'TRIMP' },
        update: {},
      });
      await prisma.trainingLoadEntry.create({
        data: {
          calculationId: calculation.trainingLoadCalculationId,
          activityId,
          value: options.trimp,
          date: new Date(`${startDate.toISOString().slice(0, 10)}T00:00:00Z`),
        },
      });
    }
    return activityId;
  };

  const addSession = (
    athleteId: number,
    startDate: Date,
    name: string,
    relatedActivityId?: number,
  ) =>
    prisma.event.create({
      data: {
        name,
        type: 'TRAINING',
        startDate,
        endDate: new Date(startDate.getTime() + HOUR),
        athleteId,
        training: {
          create: { sport: 'RUNNING', goalDuration: 3600, relatedActivityId },
        },
      },
    });

  const sendDue = async (now = NOW) => {
    const due = await service.dueRecipients(now);
    for (const job of due) await service.send(job, now);
    return due;
  };

  it('recaps a planned week: done against planned, the form, what comes', async () => {
    const { userId, athlete } = await createUser();
    const athleteId = athlete!.athleteId;
    // The week before, for the comparison
    await addActivity(athleteId, at('2026-11-10T08:00:00'), { trimp: 50 });
    const run = await addActivity(athleteId, at('2026-11-17T08:00:00'), {
      trimp: 60,
    });
    // Sunday 23:30 local is Sunday 22:30 UTC: still the past week
    await addActivity(athleteId, at('2026-11-22T23:30:00'), { trimp: 40 });
    await addSession(athleteId, at('2026-11-17T08:00:00'), 'Tempo', run);
    await addSession(athleteId, at('2026-11-19T08:00:00'), 'Intervals');
    await addSession(athleteId, at('2026-11-24T08:00:00'), 'Easy run');
    // Monday 0:30 local is Sunday 23:30 UTC: already the coming week
    await addSession(athleteId, at('2026-11-23T00:30:00'), 'Night shakeout');

    expect(await sendDue()).toEqual([{ userId, monday: MONDAY }]);
    expect(sent).toHaveLength(1);
    const [email] = sent;
    expect(email.subject).toBe('Your week: 1 of 2 planned sessions');
    expect(email.senderName).toBe('Tristan · OpenAthlete');
    expect(email.text).toContain('Sessions: 1 of 2');
    expect(email.text).toContain('Load: 100 TRIMP. 100% more');
    expect(email.text).toContain('Fitness (CTL)');
    expect(email.text).toContain('Mon 23: Night shakeout · 1h 00m');
    expect(email.text).toContain('Tue 24: Easy run · 1h 00m');
    expect(email.text).toContain(
      'See my week: https://app.example/dashboard/calendar?utm_source=openathlete&utm_medium=email&utm_campaign=weekly_recap',
    );
    expect(email.text).toContain(
      `https://app.example/emails/unsubscribe?token=${userId}.weekly.`,
    );
    expect(email.headers).toEqual({
      'List-Unsubscribe': expect.stringMatching(
        new RegExp(
          `^<https://api\\.example/emails/unsubscribe\\?token=${userId}\\.weekly\\.[\\w-]+>$`,
        ),
      ),
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    });
    // Strava data only: no Garmin attribution
    expect(email.text).not.toContain('Garmin');

    // Once a week, whatever runs again
    expect(await sendDue(new Date(NOW.getTime() + HOUR))).toEqual([]);
    expect(await service.send({ userId, monday: MONDAY }, NOW)).toBe(false);
    expect(sent).toHaveLength(1);
  });

  it('asks an athlete without a plan to plan their week', async () => {
    const { athlete } = await createUser({ language: 'FR' });
    await addActivity(athlete!.athleteId, at('2026-11-18T08:00:00'), {
      distance: 21_100,
      provider: 'GARMIN',
    });

    await sendDue();
    expect(sent).toHaveLength(1);
    expect(sent[0].subject.replace(/[\u202f\u00a0]/g, ' ')).toBe(
      'Ta semaine : 1 séance, 21,1 km, 100 m D+',
    );
    expect(sent[0].text).toContain('Rien de prévu pour l’instant.');
    expect(sent[0].text).toContain('Planifie ta semaine: https://app.example');
    expect(sent[0].text).toContain(
      "Analyses issues en partie de données d'appareils Garmin.",
    );
  });

  it('stops after three weeks without activity or session', async () => {
    const quiet = await createUser();
    await addActivity(quiet.athlete!.athleteId, ago(22 * DAY));
    await addSession(quiet.athlete!.athleteId, ago(23 * DAY), 'Old plan');
    // Nothing done lately, but a session planned this week: still written to
    const planning = await createUser();
    await addActivity(planning.athlete!.athleteId, ago(40 * DAY));
    await addSession(planning.athlete!.athleteId, ago(-2 * DAY), 'Comeback');
    // Never anything at all
    await createUser();

    expect(await sendDue()).toEqual([
      { userId: planning.userId, monday: MONDAY },
    ]);
  });

  it('writes to nobody who turned it off, or before 7:00 their time', async () => {
    const off = await createUser({ emailWeekly: false });
    const newYork = await createUser({ timeZone: 'America/New_York' });
    for (const user of [off, newYork]) {
      await addActivity(user.athlete!.athleteId, ago(2 * DAY));
    }
    expect(await sendDue()).toEqual([]);

    // 7:05 in New York
    const later = new Date('2026-11-23T12:05:00Z');
    expect(await sendDue(later)).toEqual([
      { userId: newYork.userId, monday: MONDAY },
    ]);
    // Turned off once queued: the job sends nothing
    expect(
      await service.send({ userId: off.userId, monday: MONDAY }, later),
    ).toBe(false);
  });

  it('gives the claim back when sending fails, for the retry', async () => {
    const { userId, athlete } = await createUser();
    await addActivity(athlete!.athleteId, ago(2 * DAY));
    failNext = true;
    await expect(service.send({ userId, monday: MONDAY }, NOW)).rejects.toThrow(
      'The provider is down',
    );
    expect(await prisma.lifecycleEmail.count()).toBe(0);
    expect(await service.send({ userId, monday: MONDAY }, NOW)).toBe(true);
    expect(
      await prisma.lifecycleEmail.findMany({
        select: { kind: true, ref: true },
      }),
    ).toEqual([{ kind: 'WEEKLY_RECAP', ref: MONDAY }]);
  });

  it('shows the Supporter bar on their week, to those who asked for news', async () => {
    env.STRIPE_SECRET_KEY = 'sk_test';
    const users = [];
    for (let i = 0; i < 4; i++) {
      const user = await createUser({ emailNewsConsentAt: ago(30 * DAY) });
      await addActivity(user.athlete!.athleteId, ago(2 * DAY));
      users.push(user);
    }
    const noConsent = await createUser();
    await addActivity(noConsent.athlete!.athleteId, ago(2 * DAY));
    // A Supporter counts, and never sees the bar
    await prisma.subscription.create({
      data: {
        userId: users[0].userId,
        plan: 'SUPPORTER',
        status: 'active',
      },
    });

    await sendDue();
    const withBar = sent
      .filter((email) => email.text?.includes('thanks to its Supporters'))
      .map((email) => email.to);
    const expected = users
      .slice(1)
      .filter((user) => showsSupporterBar(MONDAY, user.userId))
      .map((user) => `runner${user.userId}@example.com`);
    expect(expected).toHaveLength(1);
    expect(withBar).toEqual(expected);
    expect(sent.find((email) => withBar.includes(email.to))?.text).toContain(
      'thanks to its Supporters: 1 out of a goal of 100.',
    );
  });

  it('sends nothing without a signature', async () => {
    const { athlete } = await createUser();
    await addActivity(athlete!.athleteId, ago(2 * DAY));
    env.EMAIL_SIGNATURE = undefined;
    expect(await sendDue()).toEqual([]);
  });
});
