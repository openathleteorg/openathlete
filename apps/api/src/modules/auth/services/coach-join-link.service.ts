import { randomBytes } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Prisma, UserRole } from '@openathlete/database';
import {
  AcceptCoachJoinLinkResponseDto,
  ApiEnvSchemaType,
  CoachJoinLinkDto,
  CoachJoinLinkInfoDto,
} from '@openathlete/shared';

import { AnalyticsService } from 'src/modules/analytics/analytics.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { FeatureAccessService } from 'src/modules/subscription';

/** Serializes the joins of one coach, so a double submit links them once */
const JOIN_LOCK_CLASS = 72470;

/** "Ana L.": enough to recognise the coach, without exposing their identity */
export const coachDisplayName = (firstName: string, lastName: string) => {
  const initial = lastName.trim().charAt(0).toUpperCase();
  return initial ? `${firstName.trim()} ${initial}.` : firstName.trim();
};

const generateToken = () => randomBytes(16).toString('base64url');

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === 'P2002';

/**
 * A coach's shareable join link: one URL, sent to a whole club group, that
 * links whoever opens it (with an account) to the coach. Unlike email
 * invitations it is never spent; the coach rotates it to revoke it.
 */
@Injectable()
export class CoachJoinLinkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<ApiEnvSchemaType, true>,
    @Inject(forwardRef(() => FeatureAccessService))
    private readonly featureAccessService: FeatureAccessService,
    @Optional() private readonly analytics?: AnalyticsService,
  ) {}

  private toLink(token: string): CoachJoinLinkDto {
    return { token, url: `${this.configService.get('APP_URL')}/join/${token}` };
  }

  private async findCoach(coachUserId: number) {
    const coach = await this.prisma.user.findUnique({
      where: { userId: coachUserId },
      select: { roles: true, coachJoinToken: true },
    });
    if (!coach) throw new NotFoundException('Coach not found');
    if (!coach.roles.includes(UserRole.COACH)) {
      throw new ForbiddenException('Only coaches have a join link');
    }
    return coach;
  }

  /**
   * Writes a fresh token, retrying on the (astronomically unlikely) collision
   * with another coach's.
   */
  private async writeToken(
    coachUserId: number,
    previous: string | null,
  ): Promise<string> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const token = generateToken();
      try {
        // Conditional on the previous token: of two first visits at once,
        // both end with the same link
        const { count } = await this.prisma.user.updateMany({
          where: { userId: coachUserId, coachJoinToken: previous },
          data: { coachJoinToken: token },
        });
        if (count === 1) return token;
        const current = await this.prisma.user.findUnique({
          where: { userId: coachUserId },
          select: { coachJoinToken: true },
        });
        if (current?.coachJoinToken) return current.coachJoinToken;
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
      }
    }
    throw new ConflictException('Could not create the join link, try again');
  }

  async getOrCreateLink(coachUserId: number): Promise<CoachJoinLinkDto> {
    const coach = await this.findCoach(coachUserId);
    if (coach.coachJoinToken) return this.toLink(coach.coachJoinToken);
    return this.toLink(await this.writeToken(coachUserId, null));
  }

  /** Replaces the token: the previous link stops working at once. */
  async rotateLink(coachUserId: number): Promise<CoachJoinLinkDto> {
    await this.findCoach(coachUserId);
    const token = generateToken();
    await this.prisma.user.update({
      where: { userId: coachUserId },
      data: { coachJoinToken: token },
    });
    return this.toLink(token);
  }

  private async findCoachByToken(token: string) {
    const coach = await this.prisma.user.findFirst({
      where: { coachJoinToken: token, roles: { has: UserRole.COACH } },
      select: { userId: true, firstName: true, lastName: true },
    });
    if (!coach) throw new NotFoundException('Unknown join link');
    return coach;
  }

  async getPublicInfo(token: string): Promise<CoachJoinLinkInfoDto> {
    const coach = await this.findCoachByToken(token);
    return { coachName: coachDisplayName(coach.firstName, coach.lastName) };
  }

  async accept(
    userId: number,
    token: string,
  ): Promise<AcceptCoachJoinLinkResponseDto> {
    const coach = await this.findCoachByToken(token);
    const coachName = coachDisplayName(coach.firstName, coach.lastName);

    if (coach.userId === userId) {
      throw new BadRequestException('You cannot join your own link');
    }

    const athlete = await this.prisma.athlete.findUnique({
      where: { userId },
      select: { athleteId: true },
    });
    if (!athlete) throw new NotFoundException('Athlete not found');

    const isLinked = () =>
      this.prisma.coachAthlete.findFirst({
        where: { userId: coach.userId, athleteId: athlete.athleteId },
        select: { coachAthleteId: true },
      });

    // Opening the link again, or from a second device, is not an error
    if (await isLinked()) return { coachName, alreadyLinked: true };

    const canAdd = await this.featureAccessService.checkAthleteLimit(
      coach.userId,
    );
    if (!canAdd) {
      throw new BadRequestException(
        'Coach has reached the maximum number of athletes for their subscription plan',
      );
    }

    // coach_athlete has no unique key: the lock makes check-then-create
    // atomic, so a double submit cannot link the coach twice
    const created = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${JOIN_LOCK_CLASS}::int, ${coach.userId}::int)`;
      const existing = await tx.coachAthlete.findFirst({
        where: { userId: coach.userId, athleteId: athlete.athleteId },
        select: { coachAthleteId: true },
      });
      if (existing) return false;
      await tx.coachAthlete.create({
        data: { userId: coach.userId, athleteId: athlete.athleteId },
      });
      return true;
    });

    if (created) {
      await this.analytics?.capture(coach.userId, 'athlete_linked', {
        invited_by: 'join_link',
      });
      await this.analytics?.captureForAthlete(
        athlete.athleteId,
        'coach_linked',
        { invited_by: 'join_link' },
      );
    }

    return { coachName, alreadyLinked: !created };
  }
}
