import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';

import { ClubRole, Prisma, UserRole } from '@openathlete/database';
import {
  ClubDetailDto,
  ClubMemberDto,
  ClubSummaryDto,
  CreateClubDto,
  UpdateClubDto,
  isClubAdmin,
  isClubStaff,
} from '@openathlete/shared';

import { AnalyticsService } from 'src/modules/analytics/analytics.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { dissolveClubAccess, syncClubAccess } from './club-access';

type Db = PrismaService | Prisma.TransactionClient;

/**
 * The club role a user has, or a 404: someone outside a club cannot even
 * learn that it exists.
 */
export async function requireClubRole(
  tx: Db,
  clubId: number,
  userId: number,
): Promise<ClubRole> {
  const member = await tx.clubMember.findUnique({
    where: { clubId_userId: { clubId, userId } },
    select: { role: true },
  });
  if (!member) throw new NotFoundException('Club not found');
  return member.role;
}

/** Staff roles act as coaches in the app, which needs the COACH user role */
export async function ensureCoachRole(tx: Db, userId: number) {
  const user = await tx.user.findUniqueOrThrow({
    where: { userId },
    select: { roles: true },
  });
  if (!user.roles.includes(UserRole.COACH)) {
    await tx.user.update({
      where: { userId },
      data: { roles: { push: UserRole.COACH } },
    });
  }
}

/**
 * Leaving a role behind: an athlete leaves the club's groups, an assistant
 * the groups entrusted to them.
 */
async function clearRoleData(
  tx: Db,
  clubId: number,
  userId: number,
  keep: ClubRole | null,
) {
  if (keep !== ClubRole.ATHLETE) {
    await tx.athleteGroupMember.deleteMany({
      where: { group: { clubId }, athlete: { userId } },
    });
  }
  if (keep !== ClubRole.ASSISTANT) {
    await tx.athleteGroupStaff.deleteMany({
      where: { group: { clubId }, userId },
    });
  }
}

@Injectable()
export class ClubService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly analytics?: AnalyticsService,
  ) {}

  async listMine(userId: number): Promise<ClubSummaryDto[]> {
    const memberships = await this.prisma.clubMember.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: {
        role: true,
        club: {
          select: {
            clubId: true,
            name: true,
            description: true,
            _count: { select: { members: true } },
          },
        },
      },
    });
    return memberships.map(({ role, club }) => ({
      clubId: club.clubId,
      name: club.name,
      description: club.description,
      role,
      memberCount: isClubStaff(role) ? club._count.members : null,
    }));
  }

  async create(userId: number, dto: CreateClubDto): Promise<ClubSummaryDto> {
    const club = await this.prisma.$transaction(async (tx) => {
      await ensureCoachRole(tx, userId);
      return tx.club.create({
        data: {
          name: dto.name,
          description: dto.description || null,
          members: { create: { userId, role: ClubRole.OWNER } },
        },
        select: { clubId: true, name: true, description: true },
      });
    });
    await this.analytics?.capture(userId, 'club_created');
    return { ...club, role: ClubRole.OWNER, memberCount: 1 };
  }

  async get(userId: number, clubId: number): Promise<ClubDetailDto> {
    const role = await requireClubRole(this.prisma, clubId, userId);
    const club = await this.prisma.club.findUniqueOrThrow({
      where: { clubId },
      select: {
        clubId: true,
        name: true,
        description: true,
        members: {
          orderBy: { createdAt: 'asc' },
          select: {
            role: true,
            createdAt: true,
            user: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
                email: true,
                athlete: { select: { athleteId: true } },
                athleteGroupStaff: {
                  where: { group: { clubId } },
                  select: { athleteGroupId: true },
                },
              },
            },
          },
        },
      },
    });

    // Athletes see the staff only. An assistant sees the athletes they
    // coach, as the club's links say: the same rule as everywhere else.
    let visibleAthletes: Set<number> | null = null;
    if (role === ClubRole.ATHLETE) {
      visibleAthletes = new Set();
    } else if (role === ClubRole.ASSISTANT) {
      const links = await this.prisma.coachAthlete.findMany({
        where: { userId },
        select: { athleteId: true },
      });
      visibleAthletes = new Set(links.map((link) => link.athleteId));
    }

    const members: ClubMemberDto[] = club.members
      .filter(
        (member) =>
          member.role !== ClubRole.ATHLETE ||
          member.user.userId === userId ||
          !visibleAthletes ||
          (member.user.athlete &&
            visibleAthletes.has(member.user.athlete.athleteId)),
      )
      .map((member) => ({
        userId: member.user.userId,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        email: isClubStaff(role) ? member.user.email : null,
        role: member.role,
        athleteId: member.user.athlete?.athleteId ?? null,
        groupIds: member.user.athleteGroupStaff.map(
          (staff) => staff.athleteGroupId,
        ),
        joinedAt: member.createdAt,
      }));

    return {
      clubId: club.clubId,
      name: club.name,
      description: club.description,
      role,
      memberCount: isClubStaff(role) ? club.members.length : null,
      members,
    };
  }

  async update(
    userId: number,
    clubId: number,
    dto: UpdateClubDto,
  ): Promise<ClubDetailDto> {
    const role = await requireClubRole(this.prisma, clubId, userId);
    if (!isClubAdmin(role)) {
      throw new ForbiddenException('Only the club admins can edit the club');
    }
    await this.prisma.club.update({
      where: { clubId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && {
          description: dto.description || null,
        }),
      },
    });
    return this.get(userId, clubId);
  }

  async requireOwner(userId: number, clubId: number): Promise<void> {
    const role = await requireClubRole(this.prisma, clubId, userId);
    if (role !== ClubRole.OWNER) {
      throw new ForbiddenException('Only the owner can delete the club');
    }
  }

  /** Callers stop the club's sessions first (ClubSessionService.stopAll) */
  async delete(userId: number, clubId: number): Promise<void> {
    await this.requireOwner(userId, clubId);
    await this.prisma.$transaction(async (tx) => {
      await dissolveClubAccess(tx, clubId);
      await tx.club.delete({ where: { clubId } });
    });
  }

  /**
   * The owner manages admins; admins manage everyone else. Nobody changes
   * the owner but through a transfer.
   */
  private assertCanManage(
    actorRole: ClubRole,
    targetRole: ClubRole,
    newRole?: ClubRole,
  ) {
    if (!isClubAdmin(actorRole)) {
      throw new ForbiddenException('Only the club admins manage members');
    }
    if (targetRole === ClubRole.OWNER) {
      throw new ForbiddenException('The owner changes through a transfer');
    }
    const touchesAdmin =
      targetRole === ClubRole.ADMIN || newRole === ClubRole.ADMIN;
    if (touchesAdmin && actorRole !== ClubRole.OWNER) {
      throw new ForbiddenException('Only the owner manages the admins');
    }
  }

  async updateMemberRole(
    actorUserId: number,
    clubId: number,
    targetUserId: number,
    newRole: ClubRole,
  ): Promise<ClubDetailDto> {
    if (newRole === ClubRole.OWNER) {
      throw new BadRequestException('Transfer the club to change its owner');
    }
    await this.prisma.$transaction(async (tx) => {
      const actorRole = await requireClubRole(tx, clubId, actorUserId);
      const targetRole = await requireClubRole(tx, clubId, targetUserId);
      this.assertCanManage(actorRole, targetRole, newRole);
      if (targetRole === newRole) return;
      if (newRole === ClubRole.ATHLETE) {
        const athlete = await tx.athlete.findUnique({
          where: { userId: targetUserId },
          select: { athleteId: true },
        });
        if (!athlete) {
          throw new BadRequestException('This member has no athlete profile');
        }
      } else {
        await ensureCoachRole(tx, targetUserId);
      }
      await tx.clubMember.update({
        where: { clubId_userId: { clubId, userId: targetUserId } },
        data: { role: newRole },
      });
      await clearRoleData(tx, clubId, targetUserId, newRole);
      await syncClubAccess(tx, clubId);
    });
    return this.get(actorUserId, clubId);
  }

  /** An admin removes a member, or a member leaves (targetUserId = self). */
  async removeMember(
    actorUserId: number,
    clubId: number,
    targetUserId: number,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const actorRole = await requireClubRole(tx, clubId, actorUserId);
      const targetRole = await requireClubRole(tx, clubId, targetUserId);
      if (actorUserId === targetUserId) {
        if (targetRole === ClubRole.OWNER) {
          throw new BadRequestException(
            'Transfer the club to another member before leaving it',
          );
        }
      } else {
        this.assertCanManage(actorRole, targetRole);
      }
      await clearRoleData(tx, clubId, targetUserId, null);
      await tx.clubMember.delete({
        where: { clubId_userId: { clubId, userId: targetUserId } },
      });
      await syncClubAccess(tx, clubId);
    });
  }

  /** The owner hands the club to a staff member and becomes an admin. */
  async transfer(
    actorUserId: number,
    clubId: number,
    targetUserId: number,
  ): Promise<ClubDetailDto> {
    await this.prisma.$transaction(async (tx) => {
      const actorRole = await requireClubRole(tx, clubId, actorUserId);
      if (actorRole !== ClubRole.OWNER) {
        throw new ForbiddenException('Only the owner can transfer the club');
      }
      if (actorUserId === targetUserId) {
        throw new BadRequestException('You already own this club');
      }
      const targetRole = await requireClubRole(tx, clubId, targetUserId);
      if (!isClubStaff(targetRole)) {
        throw new BadRequestException('Transfer the club to a coach');
      }
      await ensureCoachRole(tx, targetUserId);
      await tx.clubMember.update({
        where: { clubId_userId: { clubId, userId: targetUserId } },
        data: { role: ClubRole.OWNER },
      });
      await tx.clubMember.update({
        where: { clubId_userId: { clubId, userId: actorUserId } },
        data: { role: ClubRole.ADMIN },
      });
      await clearRoleData(tx, clubId, targetUserId, ClubRole.OWNER);
      await syncClubAccess(tx, clubId);
    });
    return this.get(actorUserId, clubId);
  }
}
