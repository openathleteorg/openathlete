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
export class AthleteInvitationService {
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

  async createInvitation(coachUserId: number, email: string) {
    const normalizedEmail = email.toLowerCase();

    const coachUser = await this.prisma.user.findUnique({
      where: { userId: coachUserId },
      select: {
        userId: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!coachUser) {
      throw new NotFoundException('Coach not found');
    }

    if (coachUser.email.toLowerCase() === normalizedEmail) {
      throw new BadRequestException('You cannot invite yourself');
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // Check if athlete is already linked to this coach
      const athlete = await this.prisma.athlete.findUnique({
        where: { userId: existingUser.userId },
      });

      if (athlete) {
        const existingLink = await this.prisma.coachAthlete.findFirst({
          where: {
            athleteId: athlete.athleteId,
            userId: coachUserId,
          },
        });

        if (existingLink) {
          throw new ConflictException('This athlete is already linked to you');
        }

        // Check if there's already a pending invitation for this email from this coach
        const existingInvitation =
          await this.prisma.athleteInvitation.findFirst({
            where: {
              email: normalizedEmail,
              userId: coachUserId,
              status: InvitationStatus.PENDING,
            },
          });

        if (existingInvitation) {
          throw new ConflictException(
            'An invitation has already been sent to this email',
          );
        }

        // Create invitation with PENDING status (user exists, needs to accept)
        const invitation = await this.prisma.athleteInvitation.create({
          data: {
            email: normalizedEmail,
            userId: coachUserId,
            status: InvitationStatus.PENDING,
          },
        });

        const invitationUrl = `${this.configService.get('APP_URL')}/dashboard/settings?tab=invitations`;

        // Send invitation email (athlete exists, needs to accept)
        this.eventEmitter.emit(
          SendEmailEvent.SLUG,
          new SendEmailEvent({
            type: 'athlete-invitation-existing',
            to: normalizedEmail,
            params: {
              coachName: `${coachUser.firstName} ${coachUser.lastName}`,
              url: invitationUrl,
            },
          }),
        );

        return invitation;
      }
    }

    // User doesn't exist or is not an athlete, create invitation with token for account creation
    // Check if there's already a pending invitation for this email from this coach
    const existingInvitation = await this.prisma.athleteInvitation.findFirst({
      where: {
        email: normalizedEmail,
        userId: coachUserId,
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
        await this.prisma.athleteInvitation.delete({
          where: {
            athleteInvitationId: existingInvitation.athleteInvitationId,
          },
        });
      }
    }

    const token = await this.generateInvitationToken();

    const invitation = await this.prisma.athleteInvitation.create({
      data: {
        email: normalizedEmail,
        token,
        userId: coachUserId,
        // status is null = auto-accept on account creation
      },
    });

    const invitationUrl = `${this.configService.get('APP_URL')}/auth/create-account?invitation=${token}`;

    // Send invitation email (athlete doesn't exist, needs to create account)
    this.eventEmitter.emit(
      SendEmailEvent.SLUG,
      new SendEmailEvent({
        type: 'athlete-invitation',
        to: normalizedEmail,
        params: {
          coachName: `${coachUser.firstName} ${coachUser.lastName}`,
          url: invitationUrl,
        },
      }),
    );

    return invitation;
  }

  async bulkCreateInvitations(coachUserId: number, emails: string[]) {
    const results = {
      successful: [] as string[],
      failed: [] as Array<{ email: string; error: string }>,
    };

    for (const email of emails) {
      try {
        await this.createInvitation(coachUserId, email);
        results.successful.push(email);
      } catch (error) {
        results.failed.push({
          email,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  async verifyInvitationToken(token: string) {
    const invitation = await this.prisma.athleteInvitation.findUnique({
      where: { token },
      include: {
        user: {
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
      await this.prisma.athleteInvitation.delete({
        where: {
          athleteInvitationId: invitation.athleteInvitationId,
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
      where: { userId: athleteUserId },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    // Check athlete limit for coach
    const canAdd = await this.featureAccessService.checkAthleteLimit(
      invitation.userId,
    );
    if (!canAdd) {
      throw new BadRequestException2(
        'Coach has reached the maximum number of athletes for their subscription plan',
      );
    }

    // Create coach-athlete link
    await this.prisma.coachAthlete.create({
      data: {
        athleteId: athlete.athleteId,
        userId: invitation.userId,
      },
    });

    // Delete invitation (one-time use)
    await this.prisma.athleteInvitation.delete({
      where: {
        athleteInvitationId: invitation.athleteInvitationId,
      },
    });
  }

  async acceptInvitation(athleteUserId: number, invitationId: number) {
    const invitation = await this.prisma.athleteInvitation.findUnique({
      where: { athleteInvitationId: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Verify the invitation is for this athlete's email
    const athlete = await this.prisma.athlete.findUnique({
      where: { userId: athleteUserId },
      include: { user: true },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    if (athlete.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new BadRequestException('This invitation is not for you');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('This invitation is no longer pending');
    }

    // Check athlete limit for coach
    const canAdd = await this.featureAccessService.checkAthleteLimit(
      invitation.userId,
    );
    if (!canAdd) {
      throw new BadRequestException2(
        'Coach has reached the maximum number of athletes for their subscription plan',
      );
    }

    // Create coach-athlete link
    await this.prisma.coachAthlete.create({
      data: {
        athleteId: athlete.athleteId,
        userId: invitation.userId,
      },
    });

    // Update invitation status to ACCEPTED
    await this.prisma.athleteInvitation.update({
      where: {
        athleteInvitationId: invitation.athleteInvitationId,
      },
      data: {
        status: InvitationStatus.ACCEPTED,
      },
    });
  }

  async rejectInvitation(athleteUserId: number, invitationId: number) {
    const invitation = await this.prisma.athleteInvitation.findUnique({
      where: { athleteInvitationId: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Verify the invitation is for this athlete's email
    const athlete = await this.prisma.athlete.findUnique({
      where: { userId: athleteUserId },
      include: { user: true },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    if (athlete.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new BadRequestException('This invitation is not for you');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('This invitation is no longer pending');
    }

    // Update invitation status to REJECTED
    await this.prisma.athleteInvitation.update({
      where: {
        athleteInvitationId: invitation.athleteInvitationId,
      },
      data: {
        status: InvitationStatus.REJECTED,
      },
    });
  }

  async getPendingInvitationsForAthlete(athleteUserId: number) {
    const athlete = await this.prisma.athlete.findUnique({
      where: { userId: athleteUserId },
      include: { user: true },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    return await this.prisma.athleteInvitation.findMany({
      where: {
        email: athlete.user.email.toLowerCase(),
        status: InvitationStatus.PENDING,
      },
      include: {
        user: {
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

  async getSentInvitationsForCoach(coachUserId: number) {
    return await this.prisma.athleteInvitation.findMany({
      where: {
        userId: coachUserId,
        OR: [{ status: InvitationStatus.PENDING }, { status: null }],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async cancelInvitation(coachUserId: number, invitationId: number) {
    const invitation = await this.prisma.athleteInvitation.findUnique({
      where: { athleteInvitationId: invitationId },
    });

    if (!invitation || invitation.userId !== coachUserId) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status && invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        'This invitation can no longer be cancelled',
      );
    }

    await this.prisma.athleteInvitation.delete({
      where: { athleteInvitationId: invitationId },
    });
  }
}
