import { randomBytes } from 'node:crypto';

import {
  BadRequestException,
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
  ClubJoinLinkInfoDto,
  ClubJoinLinkKind,
  ClubJoinLinksDto,
  isClubAdmin,
  isClubStaff,
} from '@openathlete/shared';

import { AnalyticsService } from 'src/modules/analytics/analytics.service';
import { coachDisplayName } from 'src/modules/auth/services/coach-join-link.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { lockClubAccess, syncClubAccess } from './club-access';
import { ensureCoachRole, requireClubRole } from './club.service';

const generateToken = () => randomBytes(16).toString('base64url');

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
    let club = await this.prisma.club.findUniqueOrThrow({
      where: { clubId },
      select: { athleteJoinToken: true, staffJoinToken: true },
    });
    if (!club.athleteJoinToken || !club.staffJoinToken) {
      // Conditional on the tokens still missing: of two first visits at
      // once, both end with the same links
      await this.prisma.club.updateMany({
        where: { clubId, athleteJoinToken: null },
        data: { athleteJoinToken: generateToken() },
      });
      await this.prisma.club.updateMany({
        where: { clubId, staffJoinToken: null },
        data: { staffJoinToken: generateToken() },
      });
      club = await this.prisma.club.findUniqueOrThrow({
        where: { clubId },
        select: { athleteJoinToken: true, staffJoinToken: true },
      });
    }
    const athlete = club.athleteJoinToken as string;
    const staff = club.staffJoinToken as string;
    return {
      athlete: { token: athlete, url: this.url(athlete) },
      staff: { token: staff, url: this.url(staff) },
    };
  }

  /** Replaces one link: the previous URL stops working at once. */
  async rotate(
    userId: number,
    clubId: number,
    kind: ClubJoinLinkKind,
  ): Promise<ClubJoinLinksDto> {
    await this.requireAdmin(userId, clubId);
    await this.prisma.club.update({
      where: { clubId },
      data: { [TOKEN_FIELD[kind]]: generateToken() },
    });
    return this.getLinks(userId, clubId);
  }

  private async findByToken(token: string) {
    const club = await this.prisma.club.findFirst({
      where: { OR: [{ athleteJoinToken: token }, { staffJoinToken: token }] },
      select: {
        clubId: true,
        name: true,
        athleteJoinToken: true,
        members: {
          where: { role: { not: ClubRole.ATHLETE } },
          orderBy: { createdAt: 'asc' },
          select: {
            role: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!club) throw new NotFoundException('Unknown join link');
    const role =
      club.athleteJoinToken === token ? ClubRole.ATHLETE : ClubRole.COACH;
    return { club, role };
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
    const { club, role } = await this.findByToken(token);

    const result = await this.prisma.$transaction(async (tx) => {
      // Serializes a double submit, so the check below sees the first one
      await lockClubAccess(tx);
      const existing = await tx.clubMember.findUnique({
        where: { clubId_userId: { clubId: club.clubId, userId } },
        select: { role: true },
      });
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
