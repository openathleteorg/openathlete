import { randomBytes } from 'node:crypto';

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ClubRole } from '@openathlete/database';
import {
  ApiEnvSchemaType,
  ClubInvitationDto,
  EmailLanguage,
  InviteToClubDto,
  InviteToClubResultDto,
  isClubAdmin,
} from '@openathlete/shared';

import { SendEmailEvent } from 'src/events';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { requireClubRole } from './club.service';

const generateToken = () => randomBytes(16).toString('base64url');

/**
 * Personal invitations to a club: an admin imports a list (name, email,
 * group), each person gets an email with their own link, which joins them
 * once, into their group.
 */
@Injectable()
export class ClubInvitationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<ApiEnvSchemaType, true>,
    @Optional() private readonly emitter?: EventEmitter2,
  ) {}

  private async requireAdmin(userId: number, clubId: number) {
    const role = await requireClubRole(this.prisma, clubId, userId);
    if (!isClubAdmin(role)) {
      throw new ForbiddenException('Only the club admins invite people');
    }
  }

  private send(
    invitation: { email: string; token: string; role: ClubRole },
    club: { name: string },
    inviter: { firstName: string; lastName: string; language: string },
  ) {
    this.emitter?.emit(
      SendEmailEvent.SLUG,
      new SendEmailEvent({
        type: 'club-invitation',
        to: invitation.email,
        // Without an account, the invitee reads it in the inviter's language
        language: inviter.language as EmailLanguage,
        params: {
          clubName: club.name,
          inviterName: `${inviter.firstName} ${inviter.lastName}`.trim(),
          url: `${this.configService.get('APP_URL')}/club-join/${invitation.token}`,
          role: invitation.role === ClubRole.COACH ? 'COACH' : 'ATHLETE',
        },
      }),
    );
  }

  private async context(userId: number, clubId: number) {
    const [club, inviter] = await Promise.all([
      this.prisma.club.findUniqueOrThrow({
        where: { clubId },
        select: { name: true },
      }),
      this.prisma.user.findUniqueOrThrow({
        where: { userId },
        select: { firstName: true, lastName: true, language: true },
      }),
    ]);
    return { club, inviter };
  }

  async invite(
    userId: number,
    clubId: number,
    dto: InviteToClubDto,
  ): Promise<InviteToClubResultDto> {
    await this.requireAdmin(userId, clubId);
    const skipped: InviteToClubResultDto['skipped'] = [];

    const seen = new Set<string>();
    const people = dto.people.filter((person) => {
      if (seen.has(person.email)) {
        skipped.push({ email: person.email, reason: 'DUPLICATE' });
        return false;
      }
      seen.add(person.email);
      return true;
    });

    const [members, pending] = await Promise.all([
      this.prisma.clubMember.findMany({
        where: { clubId, user: { email: { in: [...seen] } } },
        select: { user: { select: { email: true } } },
      }),
      this.prisma.clubInvitation.findMany({
        where: { clubId, acceptedAt: null, email: { in: [...seen] } },
        select: { email: true },
      }),
    ]);
    const isMember = new Set(members.map((member) => member.user.email));
    const isInvited = new Set(pending.map((invitation) => invitation.email));
    const toInvite = people.filter((person) => {
      if (isMember.has(person.email)) {
        skipped.push({ email: person.email, reason: 'MEMBER' });
        return false;
      }
      if (isInvited.has(person.email)) {
        skipped.push({ email: person.email, reason: 'INVITED' });
        return false;
      }
      return true;
    });

    // Groups by name, created when the club has none by that name
    const groups = await this.prisma.athleteGroup.findMany({
      where: { clubId },
      select: { athleteGroupId: true, name: true },
    });
    const groupIds = new Map(
      groups.map((group) => [
        group.name.toLocaleLowerCase(),
        group.athleteGroupId,
      ]),
    );
    const groupsCreated: string[] = [];
    if (dto.role === 'ATHLETE') {
      for (const person of toInvite) {
        const name = person.group?.trim();
        if (!name || groupIds.has(name.toLocaleLowerCase())) continue;
        const created = await this.prisma.athleteGroup.create({
          data: { name, clubId },
          select: { athleteGroupId: true },
        });
        groupIds.set(name.toLocaleLowerCase(), created.athleteGroupId);
        groupsCreated.push(name);
      }
    }

    const role = dto.role === 'COACH' ? ClubRole.COACH : ClubRole.ATHLETE;
    const invitations = await this.prisma.$transaction(
      toInvite.map((person) =>
        this.prisma.clubInvitation.create({
          data: {
            clubId,
            invitedById: userId,
            email: person.email,
            firstName: person.firstName || null,
            lastName: person.lastName || null,
            role,
            token: generateToken(),
            groupId:
              role === ClubRole.ATHLETE && person.group
                ? (groupIds.get(person.group.trim().toLocaleLowerCase()) ??
                  null)
                : null,
          },
          select: { email: true, token: true, role: true },
        }),
      ),
    );

    const { club, inviter } = await this.context(userId, clubId);
    for (const invitation of invitations) this.send(invitation, club, inviter);
    return { invited: invitations.length, skipped, groupsCreated };
  }

  async listPending(
    userId: number,
    clubId: number,
  ): Promise<ClubInvitationDto[]> {
    await this.requireAdmin(userId, clubId);
    const invitations = await this.prisma.clubInvitation.findMany({
      where: { clubId, acceptedAt: null },
      orderBy: [{ sentAt: 'desc' }, { clubInvitationId: 'desc' }],
      select: {
        clubInvitationId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        sentAt: true,
        group: { select: { name: true } },
      },
    });
    return invitations.map(({ group, ...invitation }) => ({
      ...invitation,
      groupName: group?.name ?? null,
    }));
  }

  private async requirePending(clubId: number, clubInvitationId: number) {
    const invitation = await this.prisma.clubInvitation.findFirst({
      where: { clubInvitationId, clubId, acceptedAt: null },
      select: { email: true, token: true, role: true },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');
    return invitation;
  }

  async resend(
    userId: number,
    clubId: number,
    clubInvitationId: number,
  ): Promise<void> {
    await this.requireAdmin(userId, clubId);
    const invitation = await this.requirePending(clubId, clubInvitationId);
    await this.prisma.clubInvitation.update({
      where: { clubInvitationId },
      data: { sentAt: new Date() },
    });
    const { club, inviter } = await this.context(userId, clubId);
    this.send(invitation, club, inviter);
  }

  /** The invitation's link stops working */
  async revoke(
    userId: number,
    clubId: number,
    clubInvitationId: number,
  ): Promise<void> {
    await this.requireAdmin(userId, clubId);
    await this.requirePending(clubId, clubInvitationId);
    await this.prisma.clubInvitation.delete({ where: { clubInvitationId } });
  }
}
