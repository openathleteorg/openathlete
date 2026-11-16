import { Prisma } from '@openathlete/database';

/**
 * The club whose athlete or staff link is this token, while it has not
 * expired.
 */
export function openClubLinkWhere(
  token: string,
  now: Date,
): Prisma.ClubWhereInput {
  return {
    OR: [
      {
        athleteJoinToken: token,
        OR: [
          { athleteJoinExpiresAt: null },
          { athleteJoinExpiresAt: { gt: now } },
        ],
      },
      {
        staffJoinToken: token,
        OR: [{ staffJoinExpiresAt: null }, { staffJoinExpiresAt: { gt: now } }],
      },
    ],
  };
}

/** A personal club invitation not yet used */
export function openClubInvitationWhere(
  token: string,
): Prisma.ClubInvitationWhereInput {
  return { token, acceptedAt: null };
}

type Db = {
  club: { count(args: { where: Prisma.ClubWhereInput }): Promise<number> };
  clubInvitation: {
    count(args: { where: Prisma.ClubInvitationWhereInput }): Promise<number>;
  };
};

/**
 * Whether a token still opens a club: on an invite-only instance, it lets
 * the person create the account they will join the club with.
 */
export async function opensAClub(db: Db, token: string): Promise<boolean> {
  if (
    (await db.club.count({ where: openClubLinkWhere(token, new Date()) })) > 0
  ) {
    return true;
  }
  return (
    (await db.clubInvitation.count({ where: openClubInvitationWhere(token) })) >
    0
  );
}
