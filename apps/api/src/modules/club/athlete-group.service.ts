import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ClubRole, Prisma } from '@openathlete/database';
import {
  AthleteGroupDto,
  CreateAthleteGroupDto,
  isClubCoach,
} from '@openathlete/shared';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { syncClubAccess } from './club-access';
import { requireClubRole } from './club.service';

type Db = PrismaService | Prisma.TransactionClient;

const groupSelect = {
  athleteGroupId: true,
  name: true,
  parentId: true,
  clubId: true,
  ownerUserId: true,
  members: { select: { athleteId: true }, orderBy: { createdAt: 'asc' } },
  staff: { select: { userId: true } },
} satisfies Prisma.AthleteGroupSelect;

type GroupRow = Prisma.AthleteGroupGetPayload<{ select: typeof groupSelect }>;

const toDto = (group: GroupRow): AthleteGroupDto => ({
  athleteGroupId: group.athleteGroupId,
  name: group.name,
  parentId: group.parentId,
  clubId: group.clubId,
  athleteIds: group.members.map((member) => member.athleteId),
  staffUserIds: group.staff.map((staff) => staff.userId),
});

/**
 * Groups sort athletes. A coach's own groups hold athletes they coach; a
 * club's groups hold its athletes, and entrust them to assistants. Being in
 * a group grants nothing by itself: access comes from coach_athlete links,
 * which the club recomputes when a group's assistants or athletes change.
 */
@Injectable()
export class AthleteGroupService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: number, clubId?: number): Promise<AthleteGroupDto[]> {
    if (clubId === undefined) {
      const groups = await this.prisma.athleteGroup.findMany({
        where: { ownerUserId: userId },
        orderBy: [{ name: 'asc' }, { athleteGroupId: 'asc' }],
        select: groupSelect,
      });
      return groups.map(toDto);
    }

    const role = await requireClubRole(this.prisma, clubId, userId);
    if (role === ClubRole.ATHLETE) {
      throw new ForbiddenException("Only the club's staff sees its groups");
    }
    const groups = await this.prisma.athleteGroup.findMany({
      where: {
        clubId,
        // An assistant sees the groups entrusted to them and their
        // sub-groups, not how the rest of the club is organised
        ...(role === ClubRole.ASSISTANT && {
          OR: [
            { staff: { some: { userId } } },
            { parent: { staff: { some: { userId } } } },
          ],
        }),
      },
      orderBy: [{ name: 'asc' }, { athleteGroupId: 'asc' }],
      select: groupSelect,
    });
    return groups.map(toDto);
  }

  /** The group, if the user may change it: its owner, or a club coach. */
  private async requireManageable(
    tx: Db,
    userId: number,
    athleteGroupId: number,
  ): Promise<GroupRow> {
    const group = await tx.athleteGroup.findUnique({
      where: { athleteGroupId },
      select: groupSelect,
    });
    if (!group) throw new NotFoundException('Group not found');
    if (group.clubId !== null) {
      const member = await tx.clubMember.findUnique({
        where: { clubId_userId: { clubId: group.clubId, userId } },
        select: { role: true },
      });
      if (!member) throw new NotFoundException('Group not found');
      if (!isClubCoach(member.role)) {
        throw new ForbiddenException("Only the club's coaches edit its groups");
      }
    } else if (group.ownerUserId !== userId) {
      throw new NotFoundException('Group not found');
    }
    return group;
  }

  async create(
    userId: number,
    dto: CreateAthleteGroupDto,
  ): Promise<AthleteGroupDto> {
    const clubId = dto.clubId ?? null;
    if (clubId !== null) {
      const role = await requireClubRole(this.prisma, clubId, userId);
      if (!isClubCoach(role)) {
        throw new ForbiddenException("Only the club's coaches create groups");
      }
    }
    const parentId = dto.parentId ?? null;
    if (parentId !== null) {
      const parent = await this.requireManageable(
        this.prisma,
        userId,
        parentId,
      );
      if (parent.clubId !== clubId) {
        throw new BadRequestException(
          'A sub-group belongs where its group does',
        );
      }
      if (parent.parentId !== null) {
        throw new BadRequestException('Sub-groups have no sub-groups');
      }
    }
    const group = await this.prisma.athleteGroup.create({
      data: {
        name: dto.name,
        parentId,
        clubId,
        ownerUserId: clubId === null ? userId : null,
      },
      select: groupSelect,
    });
    return toDto(group);
  }

  async rename(
    userId: number,
    athleteGroupId: number,
    name: string,
  ): Promise<AthleteGroupDto> {
    await this.requireManageable(this.prisma, userId, athleteGroupId);
    const group = await this.prisma.athleteGroup.update({
      where: { athleteGroupId },
      data: { name },
      select: groupSelect,
    });
    return toDto(group);
  }

  async delete(userId: number, athleteGroupId: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const group = await this.requireManageable(tx, userId, athleteGroupId);
      // Sub-groups, members and assistants cascade
      await tx.athleteGroup.delete({ where: { athleteGroupId } });
      if (group.clubId !== null) await syncClubAccess(tx, group.clubId);
    });
  }

  /**
   * Athletes the group may hold: those the coach coaches, for their own
   * group; the club's athletes, for a club group.
   */
  private async assertEligible(tx: Db, group: GroupRow, athleteIds: number[]) {
    const eligible =
      group.clubId !== null
        ? await tx.athlete.findMany({
            where: {
              athleteId: { in: athleteIds },
              user: {
                clubMemberships: {
                  some: { clubId: group.clubId, role: ClubRole.ATHLETE },
                },
              },
            },
            select: { athleteId: true },
          })
        : await tx.athlete.findMany({
            where: {
              athleteId: { in: athleteIds },
              coachAthletes: { some: { userId: group.ownerUserId as number } },
            },
            select: { athleteId: true },
          });
    if (eligible.length !== new Set(athleteIds).size) {
      throw new BadRequestException(
        group.clubId !== null
          ? 'Only athletes of the club can join its groups'
          : 'Only athletes you coach can join your groups',
      );
    }
  }

  async addAthletes(
    userId: number,
    athleteGroupId: number,
    athleteIds: number[],
  ): Promise<AthleteGroupDto> {
    return this.prisma.$transaction(async (tx) => {
      const group = await this.requireManageable(tx, userId, athleteGroupId);
      await this.assertEligible(tx, group, athleteIds);
      await tx.athleteGroupMember.createMany({
        data: athleteIds.map((athleteId) => ({ athleteGroupId, athleteId })),
        skipDuplicates: true,
      });
      if (group.clubId !== null) await syncClubAccess(tx, group.clubId);
      return toDto(
        await tx.athleteGroup.findUniqueOrThrow({
          where: { athleteGroupId },
          select: groupSelect,
        }),
      );
    });
  }

  async removeAthlete(
    userId: number,
    athleteGroupId: number,
    athleteId: number,
  ): Promise<AthleteGroupDto> {
    return this.prisma.$transaction(async (tx) => {
      const group = await this.requireManageable(tx, userId, athleteGroupId);
      await tx.athleteGroupMember.deleteMany({
        where: { athleteGroupId, athleteId },
      });
      if (group.clubId !== null) await syncClubAccess(tx, group.clubId);
      return toDto(
        await tx.athleteGroup.findUniqueOrThrow({
          where: { athleteGroupId },
          select: groupSelect,
        }),
      );
    });
  }

  /** Replaces the assistants entrusted with a club group. */
  async setStaff(
    userId: number,
    athleteGroupId: number,
    userIds: number[],
  ): Promise<AthleteGroupDto> {
    return this.prisma.$transaction(async (tx) => {
      const group = await this.requireManageable(tx, userId, athleteGroupId);
      if (group.clubId === null) {
        throw new BadRequestException('Only club groups have assistants');
      }
      const unique = [...new Set(userIds)];
      const assistants = await tx.clubMember.count({
        where: {
          clubId: group.clubId,
          userId: { in: unique },
          role: ClubRole.ASSISTANT,
        },
      });
      if (assistants !== unique.length) {
        throw new BadRequestException(
          'Only assistants of the club are entrusted with groups',
        );
      }
      await tx.athleteGroupStaff.deleteMany({ where: { athleteGroupId } });
      await tx.athleteGroupStaff.createMany({
        data: unique.map((staffUserId) => ({
          athleteGroupId,
          userId: staffUserId,
        })),
      });
      await syncClubAccess(tx, group.clubId);
      return toDto(
        await tx.athleteGroup.findUniqueOrThrow({
          where: { athleteGroupId },
          select: groupSelect,
        }),
      );
    });
  }
}
