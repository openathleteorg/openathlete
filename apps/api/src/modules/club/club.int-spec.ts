import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { AccountDeletionService } from 'src/modules/auth/services/account-deletion.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { StripeService } from 'src/modules/subscription/services/stripe.service';

import { AthleteGroupService } from './athlete-group.service';
import { ClubJoinLinkService } from './club-join-link.service';
import { ClubService } from './club.service';

// Integration test: needs a migrated, disposable PostgreSQL database.
const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

describe('clubs (PostgreSQL)', () => {
  let prisma: PrismaService;
  let clubs: ClubService;
  let joinLinks: ClubJoinLinkService;
  let groups: AthleteGroupService;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    clubs = new ClubService(prisma);
    joinLinks = new ClubJoinLinkService(prisma, {
      get: () => 'http://localhost',
    } as unknown as ConfigService<ApiEnvSchemaType, true>);
    groups = new AthleteGroupService(prisma);
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
  });

  const signUp = async (name: string, roles: ('ATHLETE' | 'COACH')[]) => {
    const user = await prisma.user.create({
      data: {
        email: `${name}@example.com`,
        password: 'hash',
        firstName: name,
        lastName: 'Test',
        roles,
        athlete: { create: {} },
      },
      select: { userId: true, athlete: { select: { athleteId: true } } },
    });
    return { userId: user.userId, athleteId: user.athlete!.athleteId };
  };

  /** Every link, as "coach>athlete@club" with the club null for own links */
  const links = async () =>
    (
      await prisma.coachAthlete.findMany({
        select: { userId: true, athleteId: true, clubId: true },
        orderBy: [{ userId: 'asc' }, { athleteId: 'asc' }],
      })
    ).map((l) => `${l.userId}>${l.athleteId}@${l.clubId}`);

  /** A club with an owner, a coach and two athletes, all through links */
  const setUpClub = async () => {
    const owner = await signUp('owner', ['ATHLETE', 'COACH']);
    const coach = await signUp('coach', ['ATHLETE']);
    const ana = await signUp('ana', ['ATHLETE']);
    const ben = await signUp('ben', ['ATHLETE']);
    const { clubId } = await clubs.create(owner.userId, { name: 'Club' });
    const { athlete, staff } = await joinLinks.getLinks(owner.userId, clubId);
    await joinLinks.accept(coach.userId, staff.token);
    await joinLinks.accept(ana.userId, athlete.token);
    await joinLinks.accept(ben.userId, athlete.token);
    return { clubId, owner, coach, ana, ben, athlete, staff };
  };

  it('gives the club staff access to every athlete who joins', async () => {
    const { clubId, owner, coach, ana, ben } = await setUpClub();

    expect(await links()).toEqual([
      `${owner.userId}>${ana.athleteId}@${clubId}`,
      `${owner.userId}>${ben.athleteId}@${clubId}`,
      `${coach.userId}>${ana.athleteId}@${clubId}`,
      `${coach.userId}>${ben.athleteId}@${clubId}`,
    ]);
    // Joining through the staff link makes a coach of the user
    const { roles } = await prisma.user.findUniqueOrThrow({
      where: { userId: coach.userId },
    });
    expect(roles).toContain('COACH');
  });

  it('joins a double submit once', async () => {
    const owner = await signUp('owner', ['COACH']);
    const ana = await signUp('ana', ['ATHLETE']);
    const { clubId } = await clubs.create(owner.userId, { name: 'Club' });
    const { athlete } = await joinLinks.getLinks(owner.userId, clubId);

    const results = await Promise.all([
      joinLinks.accept(ana.userId, athlete.token),
      joinLinks.accept(ana.userId, athlete.token),
    ]);
    expect(results.map((r) => r.alreadyMember).sort()).toEqual([false, true]);
    expect(await prisma.clubMember.count({ where: { clubId } })).toBe(2);
    expect(await links()).toHaveLength(1);
  });

  it('stops a rotated link', async () => {
    const owner = await signUp('owner', ['COACH']);
    const ana = await signUp('ana', ['ATHLETE']);
    const { clubId } = await clubs.create(owner.userId, { name: 'Club' });
    const before = await joinLinks.getLinks(owner.userId, clubId);
    const after = await joinLinks.rotate(owner.userId, clubId, 'athlete');

    expect(after.athlete.token).not.toBe(before.athlete.token);
    expect(after.staff.token).toBe(before.staff.token);
    await expect(
      joinLinks.accept(ana.userId, before.athlete.token),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('limits an assistant to the athletes of their groups', async () => {
    const { clubId, owner, ana, ben, staff } = await setUpClub();
    const assistant = await signUp('assistant', ['ATHLETE']);
    await joinLinks.accept(assistant.userId, staff.token);
    await clubs.updateMemberRole(
      owner.userId,
      clubId,
      assistant.userId,
      'ASSISTANT',
    );
    const coachedBy = async (userId: number) =>
      (
        await prisma.coachAthlete.findMany({
          where: { userId },
          select: { athleteId: true },
        })
      ).map((l) => l.athleteId);
    expect(await coachedBy(assistant.userId)).toEqual([]);

    // Entrusted with a group, the assistant coaches its sub-groups too
    const track = await groups.create(owner.userId, { name: 'Track', clubId });
    const juniors = await groups.create(owner.userId, {
      name: 'Juniors',
      clubId,
      parentId: track.athleteGroupId,
    });
    await groups.addAthletes(owner.userId, juniors.athleteGroupId, [
      ana.athleteId,
    ]);
    await groups.setStaff(owner.userId, track.athleteGroupId, [
      assistant.userId,
    ]);
    expect(await coachedBy(assistant.userId)).toEqual([ana.athleteId]);

    // The assistant sees the club's staff and their own athletes only
    const seen = await clubs.get(assistant.userId, clubId);
    expect(seen.members.map((m) => m.userId)).not.toContain(ben.userId);
    expect(seen.members.map((m) => m.userId)).toContain(ana.userId);
    await expect(
      groups.create(assistant.userId, { name: 'Mine', clubId }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await groups.removeAthlete(
      owner.userId,
      juniors.athleteGroupId,
      ana.athleteId,
    );
    expect(await coachedBy(assistant.userId)).toEqual([]);
  });

  it('shows athletes the staff only, without emails', async () => {
    const { clubId, ana, ben } = await setUpClub();
    const seen = await clubs.get(ana.userId, clubId);

    expect(seen.members.map((m) => m.role).sort()).toEqual([
      'ATHLETE',
      'COACH',
      'OWNER',
    ]);
    expect(seen.members.map((m) => m.userId)).not.toContain(ben.userId);
    expect(seen.members.every((m) => m.email === null)).toBe(true);
    expect(seen.memberCount).toBeNull();
    await expect(groups.list(ana.userId, clubId)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('keeps the link a coach and athlete made themselves', async () => {
    const owner = await signUp('owner', ['COACH']);
    const ana = await signUp('ana', ['ATHLETE']);
    await prisma.coachAthlete.create({
      data: { userId: owner.userId, athleteId: ana.athleteId },
    });
    const { clubId } = await clubs.create(owner.userId, { name: 'Club' });
    const { athlete } = await joinLinks.getLinks(owner.userId, clubId);

    await joinLinks.accept(ana.userId, athlete.token);
    expect(await links()).toEqual([`${owner.userId}>${ana.athleteId}@null`]);

    await clubs.removeMember(ana.userId, clubId, ana.userId);
    expect(await links()).toEqual([`${owner.userId}>${ana.athleteId}@null`]);
  });

  it('moves a link to another club the coach and athlete share', async () => {
    const coach = await signUp('coach', ['COACH']);
    const ana = await signUp('ana', ['ATHLETE']);
    const a = await clubs.create(coach.userId, { name: 'A' });
    const b = await clubs.create(coach.userId, { name: 'B' });
    for (const clubId of [a.clubId, b.clubId]) {
      const { athlete } = await joinLinks.getLinks(coach.userId, clubId);
      await joinLinks.accept(ana.userId, athlete.token);
    }
    expect(await links()).toEqual([
      `${coach.userId}>${ana.athleteId}@${a.clubId}`,
    ]);

    await clubs.removeMember(ana.userId, a.clubId, ana.userId);
    expect(await links()).toEqual([
      `${coach.userId}>${ana.athleteId}@${b.clubId}`,
    ]);

    await clubs.delete(coach.userId, b.clubId);
    expect(await links()).toEqual([]);
  });

  it('takes an athlete out of the groups of a coach who no longer coaches them', async () => {
    const { clubId, coach, ana } = await setUpClub();
    const mine = await groups.create(coach.userId, { name: 'Mine' });
    await groups.addAthletes(coach.userId, mine.athleteGroupId, [
      ana.athleteId,
    ]);

    await clubs.removeMember(ana.userId, clubId, ana.userId);
    const [group] = await groups.list(coach.userId);
    expect(group.athleteIds).toEqual([]);
  });

  it('only lets a group hold athletes it may hold', async () => {
    const { clubId, owner, ana } = await setUpClub();
    const stranger = await signUp('stranger', ['ATHLETE']);
    const club = await groups.create(owner.userId, { name: 'Club', clubId });
    const own = await groups.create(owner.userId, { name: 'Own' });

    await expect(
      groups.addAthletes(owner.userId, club.athleteGroupId, [
        stranger.athleteId,
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      groups.addAthletes(owner.userId, own.athleteGroupId, [
        stranger.athleteId,
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
    // The owner coaches Ana through the club: their own group may hold her
    await groups.addAthletes(owner.userId, own.athleteGroupId, [ana.athleteId]);
    await expect(
      groups.create(owner.userId, {
        name: 'Too deep',
        parentId: (
          await groups.create(owner.userId, {
            name: 'Sub',
            parentId: own.athleteGroupId,
          })
        ).athleteGroupId,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lets only the owner manage admins, and never the owner', async () => {
    const { clubId, owner, coach, ana } = await setUpClub();
    await clubs.updateMemberRole(owner.userId, clubId, coach.userId, 'ADMIN');

    await expect(
      clubs.updateMemberRole(coach.userId, clubId, owner.userId, 'COACH'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      clubs.updateMemberRole(coach.userId, clubId, ana.userId, 'ADMIN'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      clubs.removeMember(owner.userId, clubId, owner.userId),
    ).rejects.toBeInstanceOf(BadRequestException);
    // An admin still runs the athletes
    await clubs.removeMember(coach.userId, clubId, ana.userId);
    expect(
      await prisma.coachAthlete.count({ where: { athleteId: ana.athleteId } }),
    ).toBe(0);
  });

  describe('when the owner deletes their account', () => {
    const deleteAccount = (userId: number) =>
      new AccountDeletionService(prisma, {
        cancelSubscriptionNow: jest.fn(),
      } as unknown as StripeService).deleteAccount(userId);

    it('hands the club to its admin', async () => {
      const { clubId, owner, coach, ana } = await setUpClub();
      await clubs.updateMemberRole(owner.userId, clubId, coach.userId, 'ADMIN');

      await deleteAccount(owner.userId);
      const club = await clubs.get(coach.userId, clubId);
      expect(club.role).toBe('OWNER');
      expect(await links()).toContain(
        `${coach.userId}>${ana.athleteId}@${clubId}`,
      );
    });

    it('deletes a club without an admin, keeping own links', async () => {
      const { clubId, owner, coach, ana } = await setUpClub();
      await prisma.coachAthlete.updateMany({
        where: { userId: coach.userId, athleteId: ana.athleteId },
        data: { clubId: null },
      });

      await deleteAccount(owner.userId);
      expect(await prisma.club.count({ where: { clubId } })).toBe(0);
      expect(await links()).toEqual([`${coach.userId}>${ana.athleteId}@null`]);
    });
  });
});
