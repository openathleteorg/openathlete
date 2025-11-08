import { randomUUID } from 'crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { invitation_status } from '@openathlete/database';
import { ApiEnvSchemaType, keysToCamel } from '@openathlete/shared';

import { SendEmailEvent } from 'src/events';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class CoachInvitationService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService<ApiEnvSchemaType, true>,
    private eventEmitter: EventEmitter2,
  ) {}

  async generateInvitationToken(): Promise<string> {
    return randomUUID();
  }

  async createInvitation(athleteUserId: number, email: string) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      // Check if coach is already linked to this athlete
      const athlete = await this.prisma.athlete.findUnique({
        where: { user_id: athleteUserId },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      const existingLink = await this.prisma.coach_athlete.findFirst({
        where: {
          athlete_id: athlete.athlete_id,
          user_id: existingUser.user_id,
        },
      });

      if (existingLink) {
        throw new ConflictException('This coach is already linked to you');
      }

      // Check if there's already a pending invitation for this email from this athlete
      const existingInvitation = await this.prisma.coach_invitation.findFirst({
        where: {
          email: email.toLowerCase(),
          athlete_user_id: athleteUserId,
          status: invitation_status.PENDING,
        },
      });

      if (existingInvitation) {
        throw new ConflictException(
          'An invitation has already been sent to this email',
        );
      }

      // Create invitation with PENDING status (user exists, needs to accept)
      const invitation = await this.prisma.coach_invitation.create({
        data: {
          email: email.toLowerCase(),
          athlete_user_id: athleteUserId,
          coach_user_id: existingUser.user_id,
          status: invitation_status.PENDING,
        },
      });

      // Get athlete info for email
      const athleteUser = await this.prisma.user.findUnique({
        where: { user_id: athleteUserId },
        select: {
          first_name: true,
          last_name: true,
        },
      });

      if (!athleteUser) {
        throw new NotFoundException('Athlete not found');
      }

      const invitationUrl = `${this.configService.get('APP_URL')}/dashboard/settings?tab=invitations`;

      // Send invitation email (coach exists, needs to accept)
      this.eventEmitter.emit(
        SendEmailEvent.SLUG,
        new SendEmailEvent({
          type: 'coach-invitation-existing',
          to: email.toLowerCase(),
          params: {
            athleteName: `${athleteUser.first_name} ${athleteUser.last_name}`,
            url: invitationUrl,
          },
        }),
      );

      return invitation;
    } else {
      // User doesn't exist, create invitation with token for account creation
      // Check if there's already a pending invitation for this email from this athlete
      const existingInvitation = await this.prisma.coach_invitation.findFirst({
        where: {
          email: email.toLowerCase(),
          athlete_user_id: athleteUserId,
          status: invitation_status.PENDING,
        },
      });

      if (existingInvitation) {
        // Check if invitation is still valid (7 days)
        const now = new Date();
        const invitationDate = new Date(existingInvitation.created_at);
        const diff = now.getTime() - invitationDate.getTime();
        const sevenDays = 60 * 60 * 24 * 7 * 1000;

        if (diff < sevenDays) {
          throw new ConflictException(
            'An invitation has already been sent to this email',
          );
        } else {
          // Delete expired invitation
          await this.prisma.coach_invitation.delete({
            where: {
              coach_invitation_id: existingInvitation.coach_invitation_id,
            },
          });
        }
      }

      const token = await this.generateInvitationToken();

      const invitation = await this.prisma.coach_invitation.create({
        data: {
          email: email.toLowerCase(),
          token,
          athlete_user_id: athleteUserId,
          status: invitation_status.PENDING,
        },
      });

      // Get athlete info for email
      const athleteUser = await this.prisma.user.findUnique({
        where: { user_id: athleteUserId },
        select: {
          first_name: true,
          last_name: true,
        },
      });

      if (!athleteUser) {
        throw new NotFoundException('Athlete not found');
      }

      const invitationUrl = `${this.configService.get('APP_URL')}/auth/create-account?coach-invitation=${token}`;

      // Send invitation email (coach doesn't exist, needs to create account)
      this.eventEmitter.emit(
        SendEmailEvent.SLUG,
        new SendEmailEvent({
          type: 'coach-invitation-new',
          to: email.toLowerCase(),
          params: {
            athleteName: `${athleteUser.first_name} ${athleteUser.last_name}`,
            url: invitationUrl,
          },
        }),
      );

      return invitation;
    }
  }

  async verifyInvitationToken(token: string) {
    const invitation = await this.prisma.coach_invitation.findUnique({
      where: { token },
      include: {
        athlete_user: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (!invitation) {
      return null;
    }

    // Check if invitation is still valid (7 days)
    const now = new Date();
    const invitationDate = new Date(invitation.created_at);
    const diff = now.getTime() - invitationDate.getTime();
    const sevenDays = 60 * 60 * 24 * 7 * 1000;

    if (diff > sevenDays) {
      await this.prisma.coach_invitation.delete({
        where: {
          coach_invitation_id: invitation.coach_invitation_id,
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
      where: { user_id: invitation.athlete_user_id },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    // Create coach-athlete link
    await this.prisma.coach_athlete.create({
      data: {
        athlete_id: athlete.athlete_id,
        user_id: coachUserId,
      },
    });

    // Update invitation status to ACCEPTED
    await this.prisma.coach_invitation.update({
      where: {
        coach_invitation_id: invitation.coach_invitation_id,
      },
      data: {
        status: invitation_status.ACCEPTED,
        coach_user_id: coachUserId,
      },
    });
  }

  async acceptInvitation(coachUserId: number, invitationId: number) {
    const invitation = await this.prisma.coach_invitation.findUnique({
      where: { coach_invitation_id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.coach_user_id !== coachUserId) {
      throw new BadRequestException('This invitation is not for you');
    }

    if (invitation.status !== invitation_status.PENDING) {
      throw new BadRequestException('This invitation is no longer pending');
    }

    // Get athlete
    const athlete = await this.prisma.athlete.findUnique({
      where: { user_id: invitation.athlete_user_id },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    // Create coach-athlete link
    await this.prisma.coach_athlete.create({
      data: {
        athlete_id: athlete.athlete_id,
        user_id: coachUserId,
      },
    });

    // Update invitation status to ACCEPTED
    await this.prisma.coach_invitation.update({
      where: {
        coach_invitation_id: invitation.coach_invitation_id,
      },
      data: {
        status: invitation_status.ACCEPTED,
      },
    });
  }

  async rejectInvitation(coachUserId: number, invitationId: number) {
    const invitation = await this.prisma.coach_invitation.findUnique({
      where: { coach_invitation_id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.coach_user_id !== coachUserId) {
      throw new BadRequestException('This invitation is not for you');
    }

    if (invitation.status !== invitation_status.PENDING) {
      throw new BadRequestException('This invitation is no longer pending');
    }

    // Update invitation status to REJECTED
    await keysToCamel(
      await this.prisma.coach_invitation.update({
        where: {
          coach_invitation_id: invitation.coach_invitation_id,
        },
        data: {
          status: invitation_status.REJECTED,
        },
      }),
    );
  }

  async getPendingInvitationsForCoach(coachUserId: number) {
    return keysToCamel(
      await this.prisma.coach_invitation.findMany({
        where: {
          coach_user_id: coachUserId,
          status: invitation_status.PENDING,
        },
        include: {
          athlete_user: {
            select: {
              user_id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
    );
  }
}
