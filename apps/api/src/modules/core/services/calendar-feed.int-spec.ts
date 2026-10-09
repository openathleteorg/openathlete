import { NotFoundException, UnauthorizedException } from '@nestjs/common';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import {
  COACH_ATHLETE_ID,
  COACH_USER_ID,
  DELETED_ATHLETE_ID,
  DELETED_USER_ID,
  accountFixtureSql,
} from 'src/modules/auth/services/account-deletion.fixture';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { CalendarFeedService } from './calendar-feed.service';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

const DAY = 24 * 3600 * 1000;

const userOf = (userId: number, athleteId: number | null) =>
  ({
    userId,
    email: `${userId}@example.com`,
    athlete: athleteId ? { athleteId } : null,
    coachAthletes: [],
  }) as unknown as AuthUser;

describe('calendar feed (PostgreSQL)', () => {
  let prisma: PrismaService;
  let feeds: CalendarFeedService;
  const athlete = userOf(DELETED_USER_ID, DELETED_ATHLETE_ID);
  const otherAthlete = userOf(COACH_USER_ID, COACH_ATHLETE_ID);

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    feeds = new CalendarFeedService(prisma);
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
  });

  const plan = (athleteId: number, name: string, daysFromNow: number) => {
    const startDate = new Date(Date.now() + daysFromNow * DAY);
    return prisma.event.create({
      data: {
        name,
        type: 'TRAINING',
        startDate,
        endDate: new Date(startDate.getTime() + 3600_000),
        athleteId,
        training: { create: { sport: 'RUNNING' } },
      },
    });
  };

  it('keeps the same token until it is regenerated', async () => {
    const token = await feeds.getOrCreateToken(athlete);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(await feeds.getOrCreateToken(athlete)).toBe(token);
    expect(await feeds.getOrCreateToken(otherAthlete)).not.toBe(token);
  });

  it('agrees on one token when two first requests race', async () => {
    const [first, second] = await Promise.all([
      feeds.getOrCreateToken(athlete),
      feeds.getOrCreateToken(athlete),
    ]);
    expect(second).toBe(first);
  });

  it("serves the athlete's own plan around today, with stable ids", async () => {
    const next = await plan(DELETED_ATHLETE_ID, 'Tempo next week', 7);
    await plan(DELETED_ATHLETE_ID, 'Two years ago', -730);
    await plan(COACH_ATHLETE_ID, 'Not mine', 7);
    const token = await feeds.getOrCreateToken(athlete);

    const feed = await feeds.renderFeed(token);

    expect(feed).toContain('BEGIN:VCALENDAR');
    expect(feed).toContain('SUMMARY:Tempo next week');
    expect(feed).toContain(`UID:openathlete-event-${next.eventId}`);
    expect(feed).not.toContain('Two years ago');
    expect(feed).not.toContain('Not mine');
    // Activities never show
    expect(feed).not.toContain('SUMMARY:Run');
  });

  it('revokes the previous URL when the token is regenerated', async () => {
    const old = await feeds.getOrCreateToken(athlete);
    const fresh = await feeds.regenerateToken(athlete);

    expect(fresh).not.toBe(old);
    await expect(feeds.renderFeed(old)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(feeds.renderFeed(fresh)).resolves.toContain('VCALENDAR');
  });

  it('refuses unknown, malformed and former Argon2 secrets', async () => {
    const formerSecret = Buffer.from(
      '$argon2id$v=19$m=65536,t=3,p=4$c2FsdA$aGFzaA',
    ).toString('base64');
    for (const token of [
      undefined,
      '',
      formerSecret,
      'a'.repeat(43), // well formed, but nobody's
    ]) {
      await expect(feeds.renderFeed(token)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    }
  });

  it('needs an athlete profile', async () => {
    await expect(
      feeds.getOrCreateToken(userOf(COACH_USER_ID, null)),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
