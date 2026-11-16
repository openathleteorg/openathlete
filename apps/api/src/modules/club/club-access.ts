import { ClubRole, Prisma } from '@openathlete/database';
import { CLUB_COACH_ROLES, CLUB_STAFF_ROLES } from '@openathlete/shared';

type Tx = Prisma.TransactionClient;

/**
 * Serializes every change of club access: a sync reads several clubs (see
 * relinkFromAnotherClub), so two syncs at once could both decide to create,
 * or both to drop, the same link.
 */
const CLUB_ACCESS_LOCK = 72471;

/**
 * Takes the lock until the transaction ends. Taking it again in the same
 * transaction is free, so callers can hold it across a check-then-write.
 */
export async function lockClubAccess(tx: Tx): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${CLUB_ACCESS_LOCK}::int, 0)`;
}

export type CoachingPair = { userId: number; athleteId: number };

const pairKey = (pair: CoachingPair) => `${pair.userId}:${pair.athleteId}`;

/**
 * Who the staff of a club coaches, as (staff user, athlete) pairs: OWNER,
 * ADMIN and COACH coach every athlete of the club, an ASSISTANT only the
 * athletes of the groups entrusted to them and of their sub-groups.
 */
export async function clubCoachingPairs(
  tx: Tx,
  clubId: number,
): Promise<Map<string, CoachingPair>> {
  const members = await tx.clubMember.findMany({
    where: { clubId },
    select: {
      userId: true,
      role: true,
      user: { select: { athlete: { select: { athleteId: true } } } },
    },
  });

  const athletes = new Map<number, number>(); // athleteId -> userId
  for (const member of members) {
    const athleteId = member.user.athlete?.athleteId;
    if (member.role === ClubRole.ATHLETE && athleteId) {
      athletes.set(athleteId, member.userId);
    }
  }

  const pairs = new Map<string, CoachingPair>();
  const add = (userId: number, athleteId: number) => {
    // Nobody coaches themselves
    if (athletes.get(athleteId) === userId) return;
    const pair = { userId, athleteId };
    pairs.set(pairKey(pair), pair);
  };

  for (const member of members) {
    if (!CLUB_COACH_ROLES.includes(member.role)) continue;
    for (const athleteId of athletes.keys()) add(member.userId, athleteId);
  }

  const assistants = new Set(
    members
      .filter((member) => member.role === ClubRole.ASSISTANT)
      .map((member) => member.userId),
  );
  if (assistants.size > 0) {
    const groups = await tx.athleteGroup.findMany({
      where: { clubId },
      select: {
        athleteGroupId: true,
        parentId: true,
        members: { select: { athleteId: true } },
        staff: { select: { userId: true } },
      },
    });
    const childrenOf = new Map<number, typeof groups>();
    for (const group of groups) {
      if (group.parentId === null) continue;
      childrenOf.set(group.parentId, [
        ...(childrenOf.get(group.parentId) ?? []),
        group,
      ]);
    }
    for (const group of groups) {
      const entrusted = group.staff
        .map((staff) => staff.userId)
        .filter((userId) => assistants.has(userId));
      if (entrusted.length === 0) continue;
      const athleteIds = [
        group,
        ...(childrenOf.get(group.athleteGroupId) ?? []),
      ]
        .flatMap((g) => g.members.map((member) => member.athleteId))
        .filter((athleteId) => athletes.has(athleteId));
      for (const userId of entrusted) {
        for (const athleteId of athleteIds) add(userId, athleteId);
      }
    }
  }

  return pairs;
}

/**
 * After a club drops a link, another club the coach and athlete share may
 * still grant it: the link then moves to that club instead of disappearing.
 */
async function relinkFromAnotherClub(
  tx: Tx,
  pair: CoachingPair,
  excludeClubId: number,
): Promise<boolean> {
  const athlete = await tx.athlete.findUnique({
    where: { athleteId: pair.athleteId },
    select: { userId: true },
  });
  if (!athlete) return false;

  const clubs = await tx.club.findMany({
    where: {
      clubId: { not: excludeClubId },
      AND: [
        {
          members: {
            some: { userId: athlete.userId, role: ClubRole.ATHLETE },
          },
        },
        {
          members: {
            some: { userId: pair.userId, role: { in: [...CLUB_STAFF_ROLES] } },
          },
        },
      ],
    },
    select: { clubId: true },
    orderBy: { clubId: 'asc' },
  });
  for (const { clubId } of clubs) {
    const pairs = await clubCoachingPairs(tx, clubId);
    if (pairs.has(pairKey(pair))) {
      await tx.coachAthlete.create({ data: { ...pair, clubId } });
      return true;
    }
  }
  return false;
}

/**
 * A coach who no longer coaches an athlete at all takes the athlete out of
 * their own groups, as when they part ways directly.
 */
export async function pruneCoachGroups(
  tx: Tx,
  pairs: CoachingPair[],
): Promise<void> {
  for (const pair of pairs) {
    const stillLinked = await tx.coachAthlete.findFirst({
      where: pair,
      select: { coachAthleteId: true },
    });
    if (stillLinked) continue;
    await tx.athleteGroupMember.deleteMany({
      where: {
        athleteId: pair.athleteId,
        group: { ownerUserId: pair.userId },
      },
    });
  }
}

/**
 * Makes the club's coach_athlete links match its members, roles and groups:
 * creates the missing ones, removes those it no longer grants. A pair the
 * coach and athlete already linked on their own, or through another club,
 * keeps that link: there is never more than one link per pair.
 */
export async function syncClubAccess(tx: Tx, clubId: number): Promise<void> {
  await lockClubAccess(tx);

  const wanted = await clubCoachingPairs(tx, clubId);
  const current = await tx.coachAthlete.findMany({
    where: { clubId },
    select: { coachAthleteId: true, userId: true, athleteId: true },
  });
  const currentKeys = new Set(current.map(pairKey));

  const stale = current.filter((link) => !wanted.has(pairKey(link)));
  if (stale.length > 0) {
    await tx.coachAthlete.deleteMany({
      where: {
        coachAthleteId: { in: stale.map((link) => link.coachAthleteId) },
      },
    });
    const dropped: CoachingPair[] = [];
    for (const link of stale) {
      const pair = { userId: link.userId, athleteId: link.athleteId };
      if (!(await relinkFromAnotherClub(tx, pair, clubId))) dropped.push(pair);
    }
    await pruneCoachGroups(tx, dropped);
  }

  const missing = [...wanted.values()].filter(
    (pair) => !currentKeys.has(pairKey(pair)),
  );
  if (missing.length === 0) return;
  const linked = await tx.coachAthlete.findMany({
    where: { OR: missing },
    select: { userId: true, athleteId: true },
  });
  const linkedKeys = new Set(linked.map(pairKey));
  const toCreate = missing.filter((pair) => !linkedKeys.has(pairKey(pair)));
  if (toCreate.length > 0) {
    await tx.coachAthlete.createMany({
      data: toCreate.map((pair) => ({ ...pair, clubId })),
    });
  }
}

/**
 * Removes every club link of a club, moving those another club still grants.
 * Run before deleting the club, whose cascade would otherwise drop them all.
 */
export async function dissolveClubAccess(
  tx: Tx,
  clubId: number,
): Promise<void> {
  await tx.clubMember.deleteMany({ where: { clubId } });
  await syncClubAccess(tx, clubId);
}

/**
 * Links a coach and an athlete who chose each other (invitation): a link a
 * club made becomes their own, so it outlives the club, and no second row
 * is created next to it.
 */
export async function linkCoachAndAthlete(
  tx: Tx,
  pair: CoachingPair,
): Promise<void> {
  const existing = await tx.coachAthlete.findFirst({
    where: pair,
    orderBy: { clubId: { sort: 'asc', nulls: 'first' } },
    select: { coachAthleteId: true, clubId: true },
  });
  if (!existing) {
    await tx.coachAthlete.create({ data: pair });
  } else if (existing.clubId !== null) {
    await tx.coachAthlete.update({
      where: { coachAthleteId: existing.coachAthleteId },
      data: { clubId: null },
    });
  }
}
