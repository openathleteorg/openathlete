import { subject } from '@casl/ability';

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Athlete, SportType } from '@openathlete/database';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { AthleteInvitationService } from 'src/modules/auth/services/athlete-invitation.service';
import { CoachInvitationService } from 'src/modules/auth/services/coach-invitation.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

const ATHLETE_INCLUDES = {
  trainingZones: {
    include: {
      values: true,
    },
    orderBy: { index: 'asc' as const },
  },
  user: {
    select: {
      userId: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
};

@Injectable()
export class AthleteService {
  constructor(
    private prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
    private athleteInvitationService: AthleteInvitationService,
    private coachInvitationService: CoachInvitationService,
  ) {}

  private async seedDefaultHeartrateZonesIfEmpty(athleteId: number) {
    const count = await this.prisma.trainingZone.count({
      where: { athleteId: athleteId },
    });
    if (count > 0) return;

    const DEFAULT_HR_ZONES = [
      {
        name: 'Zone 1',
        description: 'Recovery',
        min: 0,
        max: 131,
        color: '#9CA3AF', // gray-400
      },
      {
        name: 'Zone 2',
        description: 'Endurance',
        min: 132,
        max: 142,
        color: '#22C55E', // green-500
      },
      {
        name: 'Zone 3',
        description: 'Tempo',
        min: 143,
        max: 152,
        color: '#EAB308', // yellow-500
      },
      {
        name: 'Zone 4',
        description: 'Threshold',
        min: 153,
        max: 163,
        color: '#F97316', // orange-500
      },
      {
        name: 'Zone 5',
        description: 'VO2 Max',
        min: 164,
        max: 220,
        color: '#EF4444', // red-500
      },
    ];

    const allSports = Object.values(SportType) as SportType[];
    for (let i = 0; i < DEFAULT_HR_ZONES.length; i++) {
      const z = DEFAULT_HR_ZONES[i];
      await this.prisma.trainingZone.create({
        data: {
          name: z.name,
          description: z.description,
          index: i,
          type: 'HEARTRATE',
          color: z.color,
          athleteId: athleteId,
          values: {
            create: [
              {
                min: z.min,
                max: z.max,
                sports: allSports,
              },
            ],
          },
        },
      });
    }
  }

  async getAthleteById(id: Athlete['athleteId'], user: AuthUser) {
    let athlete = await this.prisma.athlete.findUnique({
      where: { athleteId: id },
      include: ATHLETE_INCLUDES,
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    const ability = await this.abilities.getFor({ user });
    if (!ability.can('read', subject('Athlete', athlete))) {
      throw new ForbiddenException('Not allowed to access this athlete');
    }

    if (athlete.trainingZones.length === 0) {
      await this.seedDefaultHeartrateZonesIfEmpty(athlete.athleteId);
      athlete = await this.prisma.athlete.findUnique({
        where: { athleteId: id },
        include: ATHLETE_INCLUDES,
      });
    }

    return athlete;
  }

  async getAthleteByUserId(user: AuthUser) {
    let athlete = await this.prisma.athlete.findFirst({
      where: { userId: user.userId },
      include: ATHLETE_INCLUDES,
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    const ability = await this.abilities.getFor({ user });
    if (!ability.can('read', subject('Athlete', athlete))) {
      throw new ForbiddenException('Not allowed to access this athlete');
    }

    if (athlete.trainingZones.length === 0) {
      await this.seedDefaultHeartrateZonesIfEmpty(athlete.athleteId);
      athlete = await this.prisma.athlete.findFirst({
        where: { userId: user.userId },
        include: ATHLETE_INCLUDES,
      });
    }

    return athlete;
  }

  async getMyCoachedAthletes(userId: AuthUser['userId']) {
    const athletes = await this.prisma.athlete.findMany({
      where: { coachAthletes: { some: { userId: userId } } },
      include: ATHLETE_INCLUDES,
    });

    return athletes;
  }

  async getMyCoaches(userId: AuthUser['userId']) {
    const users = await this.prisma.user.findMany({
      where: { coachAthletes: { some: { athleteId: userId } } },
    });
    return users;
  }

  async inviteCoach(userId: AuthUser['userId'], email: string) {
    await this.coachInvitationService.createInvitation(userId, email);
  }

  async inviteAthlete(userId: AuthUser['userId'], email: string) {
    await this.athleteInvitationService.createInvitation(userId, email);
  }

  async getSentAthleteInvitations(userId: AuthUser['userId']) {
    return this.athleteInvitationService.getSentInvitationsForCoach(userId);
  }

  async cancelAthleteInvitation(
    userId: AuthUser['userId'],
    invitationId: number,
  ) {
    await this.athleteInvitationService.cancelInvitation(userId, invitationId);
  }

  async getSentCoachInvitations(userId: AuthUser['userId']) {
    return this.coachInvitationService.getSentInvitationsForAthlete(userId);
  }

  async cancelCoachInvitation(
    userId: AuthUser['userId'],
    invitationId: number,
  ) {
    await this.coachInvitationService.cancelInvitationByAthlete(
      userId,
      invitationId,
    );
  }

  async removeAthlete(
    userId: AuthUser['userId'],
    athleteId: Athlete['athleteId'],
  ) {
    const athlete = await this.prisma.athlete.findUnique({
      where: { athleteId: athleteId },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    await this.prisma.coachAthlete.deleteMany({
      where: { athleteId: athleteId, userId: userId },
    });
  }

  async removeCoach(userId: AuthUser['userId'], coachId: Athlete['userId']) {
    const user = await this.prisma.user.findUnique({
      where: { userId: coachId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const athlete = await this.prisma.athlete.findUnique({
      where: { userId: userId },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    await this.prisma.coachAthlete.deleteMany({
      where: { athleteId: athlete.athleteId, userId: user.userId },
    });
  }
}
