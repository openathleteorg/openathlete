import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
  forwardRef,
} from '@nestjs/common';
import { BadRequestException as BadRequestException2 } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { InvitationStatus } from '@openathlete/database';
import { ApiEnvSchemaType } from '@openathlete/shared';

import { SendEmailEvent } from 'src/events';
import { AnalyticsService } from 'src/modules/analytics/analytics.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { FeatureAccessService } from 'src/modules/subscription';

/**
 * Whether the invitation is for this coach. One sent before the coach had
 * an account has no coachUserId: it names them by email until they answer.
 */
const isFor = (
  invitation: { coachUserId: number | null; email: string },
  coach: { userId: number; email: string },
) =>
  invitation.coachUserId === coach.userId ||
  (invitation.coachUserId === null &&
    invitation.email.toLowerCase() === coach.email.toLowerCase());

@Injectable()
export class CoachInvitationService {
  constructor(
    private readonly prisma: PrismaService,
    private configService: ConfigService<ApiEnvSchemaType, true>,
    private eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => FeatureAccessService))
    private featureAccessService: FeatureAccessService,
    @Optional() private readonly analytics?: AnalyticsService,
  ) {}

  private async reportLinked(coachUserId: number, athleteId: number) {
    await this.analytics?.capture(coachUserId, 'athlete_linked', {
      invited_by: 'athlete',
    });
    await this.analytics?.captureForAthlete(athleteId, 'coach_linked', {
      invited_by: 'athlete',
    });
  }

  async generateInvitationToken(): Promise<string> {
    return randomUUID();
  }

  async createInvitation(athleteUserId: number, email: string) {
    const normalizedEmail = email.toLowerCase();

    const athleteUser = await this.prisma.user.findUnique({
      where: { userId: athleteUserId },
      select: {
        userId: true,
        email: true,
        firstName: true,
        lastName: true,
        language: true,
      },
    });

    if (!athleteUser) {
      throw new NotFoundException('Athlete not found');
    }

    if (athleteUser.email.toLowerCase() === normalizedEmail) {
      throw new BadRequestException('You cannot invite yourself');
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // Check if coach is already linked to this athlete
      const athlete = await this.prisma.athlete.findUnique({
        where: { userId: athleteUserId },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      const existingLink = await this.prisma.coachAthlete.findFirst({
        where: {
          athleteId: athlete.athleteId,
          userId: existingUser.userId,
        },
      });

      if (existingLink) {
        throw new ConflictException('This coach is already linked to you');
      }

      // Check if there's already a pending invitation for this email from this athlete
      const existingInvitation = await this.prisma.coachInvitation.findFirst({
        where: {
          email: normalizedEmail,
          athleteUserId: athleteUserId,
          status: InvitationStatus.PENDING,
        },
      });

      if (existingInvitation) {
        throw new ConflictException(
          'An invitation has already been sent to this email',
        );
      }

      // Create invitation with PENDING status (user exists, needs to accept)
      const invitation = await this.prisma.coachInvitation.create({
        data: {
          email: normalizedEmail,
          athleteUserId: athleteUserId,
          coachUserId: existingUser.userId,
          status: InvitationStatus.PENDING,
        },
      });

      const invitationUrl = `${this.configService.get('APP_URL')}/dashboard/settings?tab=invitations`;

      // Send invitation email (coach exists, needs to accept)
      this.eventEmitter.emit(
        SendEmailEvent.SLUG,
        new SendEmailEvent({
          type: 'coach-invitation-existing',
          to: normalizedEmail,
          params: {
            athleteName: `${athleteUser.firstName} ${athleteUser.lastName}`,
            url: invitationUrl,
          },
        }),
      );

      await this.analytics?.capture(athleteUserId, 'coach_invited');

      return invitation;
    } else {
      // User doesn't exist, create invitation with token for account creation
      // Check if there's already a pending invitation for this email from this athlete
      const existingInvitation = await this.prisma.coachInvitation.findFirst({
        where: {
          email: normalizedEmail,
          athleteUserId: athleteUserId,
          status: InvitationStatus.PENDING,
        },
      });

      if (existingInvitation) {
        // Check if invitation is still valid (7 days)
        const now = new Date();
        const invitationDate = new Date(existingInvitation.createdAt);
        const diff = now.getTime() - invitationDate.getTime();
        const sevenDays = 60 * 60 * 24 * 7 * 1000;

        if (diff < sevenDays) {
          throw new ConflictException(
            'An invitation has already been sent to this email',
          );
        } else {
          // Delete expired invitation
          await this.prisma.coachInvitation.delete({
            where: {
              coachInvitationId: existingInvitation.coachInvitationId,
            },
          });
        }
      }

      const token = await this.generateInvitationToken();

      const invitation = await this.prisma.coachInvitation.create({
        data: {
          email: normalizedEmail,
          token,
          athleteUserId: athleteUserId,
          status: InvitationStatus.PENDING,
        },
      });

      const invitationUrl = `${this.configService.get('APP_URL')}/auth/create-account?coach-invitation=${token}`;

      // Send invitation email (coach doesn't exist, needs to create account)
      this.eventEmitter.emit(
        SendEmailEvent.SLUG,
        new SendEmailEvent({
          type: 'coach-invitation-new',
          to: normalizedEmail,
          params: {
            athleteName: `${athleteUser.firstName} ${athleteUser.lastName}`,
            url: invitationUrl,
          },
          // Used when the invitee has no account yet
          language: athleteUser.language,
        }),
      );

      await this.analytics?.capture(athleteUserId, 'coach_invited');

      return invitation;
    }
  }

  async verifyInvitationToken(token: string) {
    const invitation = await this.prisma.coachInvitation.findUnique({
      where: { token },
      include: {
        athleteUser: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // A link works once: an accepted or refused invitation is spent
    if (!invitation || invitation.status !== InvitationStatus.PENDING) {
      return null;
    }

    // Check if invitation is still valid (7 days)
    const now = new Date();
    const invitationDate = new Date(invitation.createdAt);
    const diff = now.getTime() - invitationDate.getTime();
    const sevenDays = 60 * 60 * 24 * 7 * 1000;

    if (diff > sevenDays) {
      await this.prisma.coachInvitation.delete({
        where: {
          coachInvitationId: invitation.coachInvitationId,
        },
      });
      return null;
    }

    return invitation;
  }

  async consumeInvitation(token: string, coachUserId: number) {
    const invitation = await this.verifyInvitationToken(token);

    if (!invitation) {
      throw new BadRequestException('Invalid or expired invitation token');
    }

    // Get athlete
    const athlete = await this.prisma.athlete.findUnique({
      where: { userId: invitation.athleteUserId },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    // Check athlete limit for coach
    const canAdd =
      await this.featureAccessService.checkAthleteLimit(coachUserId);
    if (!canAdd) {
      throw new BadRequestException2(
        'You have reached the maximum number of athletes for your subscription plan',
      );
    }

    // Claim the invitation and link the coach together: of two sign-ups
    // racing with one link, only the first gets in
    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.coachInvitation.updateMany({
        where: {
          coachInvitationId: invitation.coachInvitationId,
          token,
          status: InvitationStatus.PENDING,
        },
        data: {
          status: InvitationStatus.ACCEPTED,
          coachUserId: coachUserId,
          token: null,
        },
      });
      if (claimed.count !== 1) {
        throw new BadRequestException('Invalid or expired invitation token');
      }
      await tx.coachAthlete.create({
        data: {
          athleteId: athlete.athleteId,
          userId: coachUserId,
        },
      });
    });
    await this.reportLinked(coachUserId, athlete.athleteId);
  }

  private async coach(coachUserId: number) {
    const coach = await this.prisma.user.findUnique({
      where: { userId: coachUserId },
      select: { userId: true, email: true },
    });
    if (!coach) throw new NotFoundException('User not found');
    return coach;
  }

  async acceptInvitation(coachUserId: number, invitationId: number) {
    const invitation = await this.prisma.coachInvitation.findUnique({
      where: { coachInvitationId: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (!isFor(invitation, await this.coach(coachUserId))) {
      throw new BadRequestException('This invitation is not for you');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('This invitation is no longer pending');
    }

    // Get athlete
    const athlete = await this.prisma.athlete.findUnique({
      where: { userId: invitation.athleteUserId },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    // Check athlete limit for coach
    const canAdd =
      await this.featureAccessService.checkAthleteLimit(coachUserId);
    if (!canAdd) {
      throw new BadRequestException2(
        'You have reached the maximum number of athletes for your subscription plan',
      );
    }

    // Accept and link together: a double click links the coach once
    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.coachInvitation.updateMany({
        where: {
          coachInvitationId: invitation.coachInvitationId,
          status: InvitationStatus.PENDING,
        },
        data: { status: InvitationStatus.ACCEPTED, coachUserId },
      });
      if (claimed.count !== 1) {
        throw new BadRequestException('This invitation is no longer pending');
      }
      await tx.coachAthlete.create({
        data: {
          athleteId: athlete.athleteId,
          userId: coachUserId,
        },
      });
    });
    await this.reportLinked(coachUserId, athlete.athleteId);
  }

  async rejectInvitation(coachUserId: number, invitationId: number) {
    const invitation = await this.prisma.coachInvitation.findUnique({
      where: { coachInvitationId: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (!isFor(invitation, await this.coach(coachUserId))) {
      throw new BadRequestException('This invitation is not for you');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('This invitation is no longer pending');
    }

    // Update invitation status to REJECTED
    await this.prisma.coachInvitation.update({
      where: {
        coachInvitationId: invitation.coachInvitationId,
      },
      data: {
        status: InvitationStatus.REJECTED,
        coachUserId,
      },
    });
  }

  async getPendingInvitationsForCoach(coachUserId: number) {
    const coach = await this.coach(coachUserId);
    return await this.prisma.coachInvitation.findMany({
      where: {
        status: InvitationStatus.PENDING,
        OR: [
          { coachUserId },
          { coachUserId: null, email: coach.email.toLowerCase() },
        ],
      },
      include: {
        athleteUser: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getSentInvitationsForAthlete(athleteUserId: number) {
    return await this.prisma.coachInvitation.findMany({
      where: {
        athleteUserId: athleteUserId,
        status: InvitationStatus.PENDING,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async cancelInvitationByAthlete(athleteUserId: number, invitationId: number) {
    const invitation = await this.prisma.coachInvitation.findUnique({
      where: { coachInvitationId: invitationId },
    });

    if (!invitation || invitation.athleteUserId !== athleteUserId) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        'This invitation can no longer be cancelled',
      );
    }

    await this.prisma.coachInvitation.delete({
      where: { coachInvitationId: invitationId },
    });
  }
}
