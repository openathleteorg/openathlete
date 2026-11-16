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

/**
 * Before an author's account goes: the templates and folders they put in a
 * club's library stay there, now the club owner's to answer for.
 */
export async function handOverClubLibrary(tx: Tx, userId: number) {
  const authored = await tx.eventTemplate.findMany({
    where: { userId, clubId: { not: null } },
    select: { clubId: true },
    distinct: ['clubId'],
  });
  const folders = await tx.eventTemplateFolder.findMany({
    where: { userId, clubId: { not: null } },
    select: { clubId: true },
    distinct: ['clubId'],
  });
  const clubIds = new Set(
    [...authored, ...folders].map((item) => item.clubId as number),
  );
  for (const clubId of clubIds) {
    const owner = await tx.clubMember.findFirst({
      where: { clubId, role: ClubRole.OWNER, userId: { not: userId } },
      select: { userId: true },
    });
    if (!owner) continue;
    await tx.eventTemplate.updateMany({
      where: { userId, clubId },
      data: { userId: owner.userId },
    });
    await tx.eventTemplateFolder.updateMany({
      where: { userId, clubId },
      data: { userId: owner.userId },
    });
  }
}
