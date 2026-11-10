import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { accountFixtureSql } from 'src/modules/auth/services/account-deletion.fixture';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { CoachNoteService } from './coach-note.service';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

// The fixture: user 1002 (athlete 2002) coaches athlete 2001 (user 1001),
// and user 1001 coaches athlete 2002 back. Notes 9001-9004 are seeded.
const coach: AuthUser = {
  userId: 1002,
  email: 'coach@example.com',
  athlete: { athleteId: 2002 },
  coachAthletes: [{ athleteId: 2001 }],
};
const athlete: AuthUser = {
  userId: 1001,
  email: 'athlete@example.com',
  athlete: { athleteId: 2001 },
  coachAthletes: [],
};

describe('CoachNoteService (PostgreSQL)', () => {
  let prisma: PrismaService;
  let service: CoachNoteService;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    service = new CoachNoteService(prisma);
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

  const titles = (notes: { title: string }[]) => notes.map((n) => n.title);

  it("lists the coach's notes, never another user's", async () => {
    expect(titles(await service.list(coach)).sort()).toEqual([
      'Drills',
      'Knee',
    ]);
    expect(titles(await service.list(coach, 2001))).toEqual(['Knee']);
  });

  it('never shows the athlete what their coach wrote about them', async () => {
    // Athlete 2001 is the user's own profile: only their own notes about it
    expect(await service.list(athlete, 2001)).toEqual([]);
    expect(titles(await service.list(athlete))).toEqual(['Mine']);
  });

  it('puts pinned notes first, then the latest', async () => {
    const older = await service.create(coach, {
      title: 'Older',
      content: '',
      pinned: false,
    });
    await service.create(coach, { title: 'Newer', content: '', pinned: false });
    await service.update(coach, older.coachNoteId, { pinned: true });

    expect(titles(await service.list(coach)).slice(0, 2)).toEqual([
      'Older',
      'Newer',
    ]);
  });

  it('hides notes about an athlete the coach no longer coaches', async () => {
    const formerCoach = { ...coach, coachAthletes: [] };

    expect(titles(await service.list(formerCoach))).toEqual(['Drills']);
    await expect(service.list(formerCoach, 2001)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(
      service.update(formerCoach, 9001, { title: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    // Back when the coaching resumes
    expect(titles(await service.list(coach, 2001))).toEqual(['Knee']);
  });

  it('refuses notes about athletes the user does not coach', async () => {
    await expect(
      service.create(athlete, {
        title: 'Spy',
        content: '',
        pinned: false,
        athleteId: 2002,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.update(coach, 9002, { athleteId: 9999 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("cannot read, edit or delete another user's note", async () => {
    await expect(
      service.update(athlete, 9002, { title: 'Mine now' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.delete(athlete, 9001)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(await prisma.coachNote.count()).toBe(4);
  });

  it('moves a note between an athlete and the general notes', async () => {
    await service.update(coach, 9001, { athleteId: null });
    expect(titles(await service.list(coach, 2001))).toEqual([]);
    await service.update(coach, 9002, { athleteId: 2001 });
    expect(titles(await service.list(coach, 2001))).toEqual(['Drills']);
  });
});
