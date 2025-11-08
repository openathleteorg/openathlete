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
export class AthleteInvitationService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService<ApiEnvSchemaType, true>,
    private eventEmitter: EventEmitter2,
  ) {}

  async generateInvitationToken(): Promise<string> {
    return randomUUID();
  }

  async createInvitation(coachUserId: number, email: string) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      // Check if athlete is already linked to this coach
      const athlete = await this.prisma.athlete.findUnique({
        where: { user_id: existingUser.user_id },
      });

      if (athlete) {
        const existingLink = await this.prisma.coach_athlete.findFirst({
          where: {
            athlete_id: athlete.athlete_id,
            user_id: coachUserId,
          },
        });

        if (existingLink) {
          throw new ConflictException('This athlete is already linked to you');
        }

        // Check if there's already a pending invitation for this email from this coach
        const existingInvitation =
          await this.prisma.athlete_invitation.findFirst({
            where: {
              email: email.toLowerCase(),
              user_id: coachUserId,
              status: invitation_status.PENDING,
            },
          });

        if (existingInvitation) {
          throw new ConflictException(
            'An invitation has already been sent to this email',
          );
        }

        // Create invitation with PENDING status (user exists, needs to accept)
        const invitation = await this.prisma.athlete_invitation.create({
          data: {
            email: email.toLowerCase(),
            user_id: coachUserId,
            status: invitation_status.PENDING,
          },
        });

        // Get coach info for email
        const coach = await this.prisma.user.findUnique({
          where: { user_id: coachUserId },
          select: {
            first_name: true,
            last_name: true,
          },
        });

        if (!coach) {
          throw new NotFoundException('Coach not found');
        }

        const invitationUrl = `${this.configService.get('APP_URL')}/dashboard/settings?tab=invitations`;

        // Send invitation email (athlete exists, needs to accept)
        this.eventEmitter.emit(
          SendEmailEvent.SLUG,
          new SendEmailEvent({
            type: 'athlete-invitation-existing',
            to: email.toLowerCase(),
            params: {
              coachName: `${coach.first_name} ${coach.last_name}`,
              url: invitationUrl,
            },
          }),
        );

        return invitation;
      }
    }

    // User doesn't exist or is not an athlete, create invitation with token for account creation
    // Check if there's already a pending invitation for this email from this coach
    const existingInvitation = await this.prisma.athlete_invitation.findFirst({
      where: {
        email: email.toLowerCase(),
        user_id: coachUserId,
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
        await this.prisma.athlete_invitation.delete({
          where: {
            athlete_invitation_id: existingInvitation.athlete_invitation_id,
          },
        });
      }
    }

    const token = await this.generateInvitationToken();

    const invitation = await this.prisma.athlete_invitation.create({
      data: {
        email: email.toLowerCase(),
        token,
        user_id: coachUserId,
        // status is null = auto-accept on account creation
      },
    });

    // Get coach info for email
    const coach = await this.prisma.user.findUnique({
      where: { user_id: coachUserId },
      select: {
        first_name: true,
        last_name: true,
      },
    });

    if (!coach) {
      throw new NotFoundException('Coach not found');
    }

    const invitationUrl = `${this.configService.get('APP_URL')}/auth/create-account?invitation=${token}`;

    // Send invitation email (athlete doesn't exist, needs to create account)
    this.eventEmitter.emit(
      SendEmailEvent.SLUG,
      new SendEmailEvent({
        type: 'athlete-invitation',
        to: email.toLowerCase(),
        params: {
          coachName: `${coach.first_name} ${coach.last_name}`,
          url: invitationUrl,
        },
      }),
    );

    return invitation;
  }

  async verifyInvitationToken(token: string) {
    const invitation = await this.prisma.athlete_invitation.findUnique({
      where: { token },
      include: {
        user: {
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
      await this.prisma.athlete_invitation.delete({
        where: {
          athlete_invitation_id: invitation.athlete_invitation_id,
        },
      });
      return null;
    }

    return invitation;
  }

  async consumeInvitation(token: string, athleteUserId: number) {
    const invitation = await this.verifyInvitationToken(token);

    if (!invitation) {
      throw new BadRequestException('Invalid or expired invitation token');
    }

    // Get athlete
    const athlete = await this.prisma.athlete.findUnique({
      where: { user_id: athleteUserId },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    // Create coach-athlete link
    await this.prisma.coach_athlete.create({
      data: {
        athlete_id: athlete.athlete_id,
        user_id: invitation.user_id,
      },
    });

    // Delete invitation (one-time use)
    await this.prisma.athlete_invitation.delete({
      where: {
        athlete_invitation_id: invitation.athlete_invitation_id,
      },
    });
  }

  async acceptInvitation(athleteUserId: number, invitationId: number) {
    const invitation = await this.prisma.athlete_invitation.findUnique({
      where: { athlete_invitation_id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Verify the invitation is for this athlete's email
    const athlete = await this.prisma.athlete.findUnique({
      where: { user_id: athleteUserId },
      include: { user: true },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    if (athlete.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new BadRequestException('This invitation is not for you');
    }

    if (invitation.status !== invitation_status.PENDING) {
      throw new BadRequestException('This invitation is no longer pending');
    }

    // Create coach-athlete link
    await this.prisma.coach_athlete.create({
      data: {
        athlete_id: athlete.athlete_id,
        user_id: invitation.user_id,
      },
    });

    // Update invitation status to ACCEPTED
    await this.prisma.athlete_invitation.update({
      where: {
        athlete_invitation_id: invitation.athlete_invitation_id,
      },
      data: {
        status: invitation_status.ACCEPTED,
      },
    });
  }

  async rejectInvitation(athleteUserId: number, invitationId: number) {
    const invitation = await this.prisma.athlete_invitation.findUnique({
      where: { athlete_invitation_id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Verify the invitation is for this athlete's email
    const athlete = await this.prisma.athlete.findUnique({
      where: { user_id: athleteUserId },
      include: { user: true },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    if (athlete.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new BadRequestException('This invitation is not for you');
    }

    if (invitation.status !== invitation_status.PENDING) {
      throw new BadRequestException('This invitation is no longer pending');
    }

    // Update invitation status to REJECTED
    await this.prisma.athlete_invitation.update({
      where: {
        athlete_invitation_id: invitation.athlete_invitation_id,
      },
      data: {
        status: invitation_status.REJECTED,
      },
    });
  }

  async getPendingInvitationsForAthlete(athleteUserId: number) {
    const athlete = await this.prisma.athlete.findUnique({
      where: { user_id: athleteUserId },
      include: { user: true },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    return keysToCamel(
      await this.prisma.athlete_invitation.findMany({
        where: {
          email: athlete.user.email.toLowerCase(),
          status: invitation_status.PENDING,
        },
        include: {
          user: {
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
