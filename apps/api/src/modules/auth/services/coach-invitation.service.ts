import { randomUUID } from 'crypto';

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { BadRequestException as BadRequestException2 } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { InvitationStatus } from '@openathlete/database';
import { ApiEnvSchemaType } from '@openathlete/shared';

import { SendEmailEvent } from 'src/events';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { FeatureAccessService } from 'src/modules/subscription';

@Injectable()
export class CoachInvitationService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService<ApiEnvSchemaType, true>,
    private eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => FeatureAccessService))
    private featureAccessService: FeatureAccessService,
  ) {}

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
        }),
      );

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

    if (!invitation) {
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

    // Create coach-athlete link
    await this.prisma.coachAthlete.create({
      data: {
        athleteId: athlete.athleteId,
        userId: coachUserId,
      },
    });

    // Update invitation status to ACCEPTED
    await this.prisma.coachInvitation.update({
      where: {
        coachInvitationId: invitation.coachInvitationId,
      },
      data: {
        status: InvitationStatus.ACCEPTED,
        coachUserId: coachUserId,
      },
    });
  }

  async acceptInvitation(coachUserId: number, invitationId: number) {
    const invitation = await this.prisma.coachInvitation.findUnique({
      where: { coachInvitationId: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.coachUserId !== coachUserId) {
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

    // Create coach-athlete link
    await this.prisma.coachAthlete.create({
      data: {
        athleteId: athlete.athleteId,
        userId: coachUserId,
      },
    });

    // Update invitation status to ACCEPTED
    await this.prisma.coachInvitation.update({
      where: {
        coachInvitationId: invitation.coachInvitationId,
      },
      data: {
        status: InvitationStatus.ACCEPTED,
      },
    });
  }

  async rejectInvitation(coachUserId: number, invitationId: number) {
    const invitation = await this.prisma.coachInvitation.findUnique({
      where: { coachInvitationId: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.coachUserId !== coachUserId) {
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
      },
    });
  }

  async getPendingInvitationsForCoach(coachUserId: number) {
    return await this.prisma.coachInvitation.findMany({
      where: {
        coachUserId: coachUserId,
        status: InvitationStatus.PENDING,
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
