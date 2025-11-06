import { randomUUID } from 'crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ApiEnvSchemaType } from '@openathlete/shared';

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
      }
    }

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

    // Send invitation email
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
}
