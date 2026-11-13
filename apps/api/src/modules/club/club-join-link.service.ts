import { randomBytes } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ClubRole, Prisma } from '@openathlete/database';
import {
  AcceptClubJoinLinkResponseDto,
  ApiEnvSchemaType,
  CLUB_JOIN_CODE_ALPHABET,
  ClubJoinLinkInfoDto,
  ClubJoinLinkKind,
  ClubJoinLinksDto,
  UpdateClubJoinLinksDto,
  isClubAdmin,
  isClubStaff,
} from '@openathlete/shared';

import { AnalyticsService } from 'src/modules/analytics/analytics.service';
import { coachDisplayName } from 'src/modules/auth/services/coach-join-link.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { lockClubAccess, syncClubAccess } from './club-access';
import { ensureCoachRole, requireClubRole } from './club.service';

const generateToken = () => randomBytes(16).toString('base64url');

const generateCode = () =>
  Array.from(
    randomBytes(8),
    (byte) => CLUB_JOIN_CODE_ALPHABET[byte % CLUB_JOIN_CODE_ALPHABET.length],
  ).join('');

const TOKEN_FIELD = {
  athlete: 'athleteJoinToken',
  staff: 'staffJoinToken',
} as const satisfies Record<ClubJoinLinkKind, keyof Prisma.ClubWhereInput>;

/**
 * A club's two shareable links: one for athletes, one for coaches. Like a
 * coach's own link, they are never spent; an admin rotates one to revoke it.
 */
@Injectable()
export class ClubJoinLinkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<ApiEnvSchemaType, true>,
    @Optional() private readonly analytics?: AnalyticsService,
  ) {}

  private url(token: string) {
    return `${this.configService.get('APP_URL')}/club-join/${token}`;
  }

  private async requireAdmin(userId: number, clubId: number) {
    const role = await requireClubRole(this.prisma, clubId, userId);
    if (!isClubAdmin(role)) {
      throw new ForbiddenException('Only the club admins share its links');
    }
  }

  async getLinks(userId: number, clubId: number): Promise<ClubJoinLinksDto> {
    await this.requireAdmin(userId, clubId);
    const select = {
      athleteJoinToken: true,
      staffJoinToken: true,
      athleteJoinCode: true,
      athleteJoinExpiresAt: true,
      staffJoinExpiresAt: true,
      athleteJoinGroupId: true,
    } as const;
    let club = await this.prisma.club.findUniqueOrThrow({
      where: { clubId },
      select,
    });
    if (
      !club.athleteJoinToken ||
      !club.staffJoinToken ||
      !club.athleteJoinCode
    ) {
      // Conditional on each still missing: of two first visits at once,
      // both end with the same links
      await this.prisma.club.updateMany({
        where: { clubId, athleteJoinToken: null },
        data: { athleteJoinToken: generateToken() },
      });
      await this.prisma.club.updateMany({
        where: { clubId, staffJoinToken: null },
        data: { staffJoinToken: generateToken() },
      });
      await this.writeCode(clubId, null);
      club = await this.prisma.club.findUniqueOrThrow({
        where: { clubId },
        select,
      });
    }
    const athlete = club.athleteJoinToken as string;
    const staff = club.staffJoinToken as string;
    return {
      athlete: {
        token: athlete,
        url: this.url(athlete),
        code: club.athleteJoinCode as string,
        expiresAt: club.athleteJoinExpiresAt,
        groupId: club.athleteJoinGroupId,
      },
      staff: {
        token: staff,
        url: this.url(staff),
        expiresAt: club.staffJoinExpiresAt,
      },
    };
  }

  /**
   * A fresh code for the athlete link, retrying on the (rare) collision
   * with another club's. Conditional on the previous code, like the tokens.
   */
  private async writeCode(clubId: number, previous: string | null) {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await this.prisma.club.updateMany({
          where: { clubId, athleteJoinCode: previous },
          data: { athleteJoinCode: generateCode() },
        });
        return;
      } catch (error) {
        if (
          !(error instanceof Prisma.PrismaClientKnownRequestError) ||
          error.code !== 'P2002'
        ) {
          throw error;
        }
      }
    }
    throw new ConflictException('Could not create the join code, try again');
  }

  /** Replaces one link: the previous URL (and code) stops working at once. */
  async rotate(
    userId: number,
    clubId: number,
    kind: ClubJoinLinkKind,
  ): Promise<ClubJoinLinksDto> {
    await this.requireAdmin(userId, clubId);
    const club = await this.prisma.club.update({
      where: { clubId },
      data: { [TOKEN_FIELD[kind]]: generateToken() },
      select: { athleteJoinCode: true },
    });
    if (kind === 'athlete') await this.writeCode(clubId, club.athleteJoinCode);
    return this.getLinks(userId, clubId);
  }

  /** When the links stop working, and where athletes land */
  async updateLinks(
    userId: number,
    clubId: number,
    dto: UpdateClubJoinLinksDto,
  ): Promise<ClubJoinLinksDto> {
    await this.requireAdmin(userId, clubId);
    if (dto.athleteGroupId) {
      const group = await this.prisma.athleteGroup.findFirst({
        where: { athleteGroupId: dto.athleteGroupId, clubId },
        select: { athleteGroupId: true },
      });
      if (!group) throw new BadRequestException('Not a group of this club');
    }
    await this.prisma.club.update({
      where: { clubId },
      data: {
        ...(dto.athleteExpiresAt !== undefined && {
          athleteJoinExpiresAt: dto.athleteExpiresAt,
        }),
        ...(dto.staffExpiresAt !== undefined && {
          staffJoinExpiresAt: dto.staffExpiresAt,
        }),
        ...(dto.athleteGroupId !== undefined && {
          athleteJoinGroupId: dto.athleteGroupId,
        }),
      },
    });
    return this.getLinks(userId, clubId);
  }

  /** The athlete link a code stands for, to open its join page */
  async resolveCode(code: string): Promise<{ token: string }> {
    const club = await this.prisma.club.findFirst({
      where: {
        athleteJoinCode: code,
        athleteJoinToken: { not: null },
        OR: [
          { athleteJoinExpiresAt: null },
          { athleteJoinExpiresAt: { gt: new Date() } },
        ],
      },
      select: { athleteJoinToken: true },
    });
    if (!club) throw new NotFoundException('Unknown join code');
    return { token: club.athleteJoinToken as string };
  }

  /**
   * What a token opens: one of the club's two links while it has not
   * expired, or a personal invitation not yet used.
   */
  private async findByToken(token: string) {
    const now = new Date();
    const staffSelect = {
      where: { role: { not: ClubRole.ATHLETE } },
      orderBy: { createdAt: 'asc' as const },
      select: {
        role: true,
        user: { select: { firstName: true, lastName: true } },
      },
    };
    const club = await this.prisma.club.findFirst({
      where: {
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
            OR: [
              { staffJoinExpiresAt: null },
              { staffJoinExpiresAt: { gt: now } },
            ],
          },
        ],
      },
      select: {
        clubId: true,
        name: true,
        athleteJoinToken: true,
        athleteJoinGroupId: true,
        members: staffSelect,
      },
    });
    if (club) {
      const role =
        club.athleteJoinToken === token ? ClubRole.ATHLETE : ClubRole.COACH;
      return {
        club,
        role,
        groupId: role === ClubRole.ATHLETE ? club.athleteJoinGroupId : null,
        invitationId: null,
      };
    }

    const invitation = await this.prisma.clubInvitation.findFirst({
      where: { token, acceptedAt: null },
      select: {
        clubInvitationId: true,
        role: true,
        groupId: true,
        club: {
          select: {
            clubId: true,
            name: true,
            athleteJoinToken: true,
            athleteJoinGroupId: true,
            members: staffSelect,
          },
        },
      },
    });
    if (!invitation) throw new NotFoundException('Unknown join link');
    return {
      club: invitation.club,
      role:
        invitation.role === ClubRole.ATHLETE
          ? ClubRole.ATHLETE
          : ClubRole.COACH,
      groupId: invitation.groupId,
      invitationId: invitation.clubInvitationId,
    };
  }

  async getPublicInfo(token: string): Promise<ClubJoinLinkInfoDto> {
    const { club, role } = await this.findByToken(token);
    return {
      clubName: club.name,
      role,
      // The athlete is about to share their training with these people
      staff: club.members.map((member) => ({
        name: coachDisplayName(member.user.firstName, member.user.lastName),
        role: member.role,
      })),
    };
  }

  async accept(
    userId: number,
    token: string,
  ): Promise<AcceptClubJoinLinkResponseDto> {
    const { club, role, groupId, invitationId } = await this.findByToken(token);

    const result = await this.prisma.$transaction(async (tx) => {
      // Serializes a double submit, so the check below sees the first one
      await lockClubAccess(tx);
      const existing = await tx.clubMember.findUnique({
        where: { clubId_userId: { clubId: club.clubId, userId } },
        select: { role: true },
      });
      // A personal invitation is used once, even by a member
      if (invitationId) {
        const { count } = await tx.clubInvitation.updateMany({
          where: { clubInvitationId: invitationId, acceptedAt: null },
          data: { acceptedAt: new Date() },
        });
        if (count === 0) throw new NotFoundException('Unknown join link');
      }
      // Opening the link again, or the other link, changes nothing: roles
      // change through the admins
      if (existing) return { role: existing.role, alreadyMember: true };

      if (role === ClubRole.ATHLETE) {
        const athlete = await tx.athlete.findUnique({
          where: { userId },
          select: { athleteId: true },
        });
        if (!athlete) throw new BadRequestException('No athlete profile');
      } else {
        await ensureCoachRole(tx, userId);
      }

      await tx.clubMember.create({
        data: { clubId: club.clubId, userId, role },
      });
      // The group the link or invitation names, if it still exists
      if (role === ClubRole.ATHLETE && groupId) {
        const athlete = await tx.athlete.findUniqueOrThrow({
          where: { userId },
          select: { athleteId: true },
        });
        const group = await tx.athleteGroup.findFirst({
          where: { athleteGroupId: groupId, clubId: club.clubId },
          select: { athleteGroupId: true },
        });
        if (group) {
          await tx.athleteGroupMember.createMany({
            data: { athleteGroupId: groupId, athleteId: athlete.athleteId },
            skipDuplicates: true,
          });
        }
      }
      await syncClubAccess(tx, club.clubId);
      return { role, alreadyMember: false };
    });

    if (!result.alreadyMember) {
      await this.analytics?.capture(userId, 'club_joined', {
        role: isClubStaff(result.role) ? 'staff' : 'athlete',
      });
    }
    return { clubId: club.clubId, clubName: club.name, ...result };
  }
}
