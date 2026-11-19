import { Prisma } from '@openathlete/database';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

/**
 * The questionnaires placed in calendars a user may read the answers of:
 * - their own, as the athlete who answers them;
 * - as a coach, those they wrote, for the athletes they still coach;
 * - as a club coach, those placed for the club, for the athletes the club
 *   entrusted to them.
 *
 * Read from the database rather than the token, so a coach who stopped
 * coaching an athlete stops reading their answers at once.
 */
export async function readableOccurrences(
  prisma: PrismaService,
  user: AuthUser,
): Promise<Prisma.EventQuestionnaireWhereInput> {
  const links = await prisma.coachAthlete.findMany({
    where: { userId: user.userId },
    select: { athleteId: true, clubId: true },
  });
  const coached = [...new Set(links.map((link) => link.athleteId))];
  const clubLinks = links.filter(
    (link): link is { athleteId: number; clubId: number } =>
      link.clubId !== null,
  );

  const or: Prisma.EventQuestionnaireWhereInput[] = [];
  if (user.athlete) {
    or.push({ event: { athleteId: user.athlete.athleteId } });
  }
  if (coached.length) {
    or.push({
      questionnaire: { coachUserId: user.userId },
      event: { athleteId: { in: coached } },
    });
  }
  for (const link of clubLinks) {
    or.push({ clubId: link.clubId, event: { athleteId: link.athleteId } });
  }
  // Matches nothing: Prisma reads an empty OR as false
  return { OR: or };
}

/** The athletes a user coaches, to check before reading as a coach */
export async function coachedAthleteIds(
  prisma: PrismaService,
  userId: number,
): Promise<Set<number>> {
  const links = await prisma.coachAthlete.findMany({
    where: { userId },
    select: { athleteId: true },
  });
  return new Set(links.map((link) => link.athleteId));
}
