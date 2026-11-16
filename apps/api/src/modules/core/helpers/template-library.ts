import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { isClubCoach, isClubStaff } from '@openathlete/shared';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

/**
 * Templates and their folders live in a library: the user's own, or a
 * club's. A club's coaches edit its library; its assistants use it (plan
 * from it) without changing it. Nobody else sees it.
 */
export type LibraryNeed = 'use' | 'edit';

type Db = Pick<PrismaService, 'clubMember'>;

/** A library item: whose it is, or which club's */
export type LibraryItem = { userId: number; clubId: number | null };

async function allows(
  db: Db,
  userId: number,
  clubId: number,
  need: LibraryNeed,
): Promise<boolean | null> {
  const member = await db.clubMember.findUnique({
    where: { clubId_userId: { clubId, userId } },
    select: { role: true },
  });
  if (!member) return null;
  return need === 'edit' ? isClubCoach(member.role) : isClubStaff(member.role);
}

/**
 * Checks the user may use or edit the library of `clubId` (null: their
 * own). Outsiders get a 404, staff without the right a 403.
 */
export async function requireLibrary(
  db: Db,
  userId: number,
  clubId: number | null,
  need: LibraryNeed,
): Promise<void> {
  if (clubId === null) return;
  const allowed = await allows(db, userId, clubId, need);
  if (allowed === null) throw new NotFoundException('Library not found');
  if (!allowed) {
    throw new ForbiddenException("Only the club's coaches edit its library");
  }
}

/** Checks the user may use or edit one item; a 404 for anyone else's. */
export async function requireLibraryItem(
  db: Db,
  userId: number,
  item: LibraryItem | null,
  need: LibraryNeed,
  what = 'Event template',
): Promise<void> {
  if (!item) throw new NotFoundException(`${what} not found`);
  if (item.clubId === null) {
    if (item.userId !== userId)
      throw new NotFoundException(`${what} not found`);
    return;
  }
  const allowed = await allows(db, userId, item.clubId, need);
  if (allowed === null) throw new NotFoundException(`${what} not found`);
  if (!allowed) {
    throw new ForbiddenException("Only the club's coaches edit its library");
  }
}

/** Where a library's items are: the user's own, or the club's */
export const libraryWhere = (userId: number, clubId: number | null) =>
  clubId === null ? { userId, clubId: null } : { clubId };
