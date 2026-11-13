import { ClubRole, Prisma } from '@openathlete/database';

import { dissolveClubAccess } from './club-access';

type Tx = Prisma.TransactionClient;

/**
 * Before a club owner's account goes: each club they own passes to its
 * longest-standing admin, or is deleted when it has none. The members'
 * own data stays theirs either way; only the club's links and groups go.
 */
export async function releaseOwnedClubs(tx: Tx, userId: number) {
  const owned = await tx.clubMember.findMany({
    where: { userId, role: ClubRole.OWNER },
    select: { clubId: true },
  });
  for (const { clubId } of owned) {
    const successor = await tx.clubMember.findFirst({
      where: { clubId, role: ClubRole.ADMIN },
      orderBy: [{ createdAt: 'asc' }, { clubMemberId: 'asc' }],
      select: { clubMemberId: true },
    });
    if (successor) {
      await tx.clubMember.update({
        where: { clubMemberId: successor.clubMemberId },
        data: { role: ClubRole.OWNER },
      });
    } else {
      await dissolveClubAccess(tx, clubId);
      await tx.club.delete({ where: { clubId } });
    }
  }
}
