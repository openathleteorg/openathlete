import { subject } from '@casl/ability';

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { athlete, sport_type } from '@openathlete/database';
import { keysToCamel } from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { AthleteInvitationService } from 'src/modules/auth/services/athlete-invitation.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

const ATHLETE_INCLUDES = {
  training_zones: {
    include: {
      values: true,
    },
    orderBy: { index: 'asc' as const },
  },
  user: {
    select: {
      user_id: true,
      first_name: true,
      last_name: true,
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
  ) {}

  private async seedDefaultHeartrateZonesIfEmpty(athleteId: number) {
    const count = await this.prisma.training_zone.count({
      where: { athlete_id: athleteId },
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

    const allSports = Object.values(sport_type) as sport_type[];
    for (let i = 0; i < DEFAULT_HR_ZONES.length; i++) {
      const z = DEFAULT_HR_ZONES[i];
      // eslint-disable-next-line no-await-in-loop
      await this.prisma.training_zone.create({
        data: {
          name: z.name,
          description: z.description,
          index: i,
          type: 'HEARTRATE',
          color: z.color,
          athlete_id: athleteId,
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

  async getAthleteById(id: athlete['athlete_id'], user: AuthUser) {
    let athlete = await this.prisma.athlete.findUnique({
      where: { athlete_id: id },
      include: ATHLETE_INCLUDES,
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    const ability = await this.abilities.getFor({ user });
    if (!ability.can('read', subject('athlete', athlete))) {
      throw new ForbiddenException('Not allowed to access this athlete');
    }

    if (athlete.training_zones.length === 0) {
      await this.seedDefaultHeartrateZonesIfEmpty(athlete.athlete_id);
      athlete = await this.prisma.athlete.findUnique({
        where: { athlete_id: id },
        include: ATHLETE_INCLUDES,
      });
    }

    return keysToCamel(athlete);
  }

  async getAthleteByUserId(user: AuthUser) {
    let athlete = await this.prisma.athlete.findFirst({
      where: { user_id: user.user_id },
      include: ATHLETE_INCLUDES,
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    const ability = await this.abilities.getFor({ user });
    if (!ability.can('read', subject('athlete', athlete))) {
      throw new ForbiddenException('Not allowed to access this athlete');
    }

    if (athlete.training_zones.length === 0) {
      await this.seedDefaultHeartrateZonesIfEmpty(athlete.athlete_id);
      athlete = await this.prisma.athlete.findFirst({
        where: { user_id: user.user_id },
        include: ATHLETE_INCLUDES,
      });
    }

    return keysToCamel(athlete);
  }

  async getMyCoachedAthletes(userId: AuthUser['user_id']) {
    const athletes = await this.prisma.athlete.findMany({
      where: { coach_athletes: { some: { user_id: userId } } },
      include: ATHLETE_INCLUDES,
    });

    return athletes.map((athlete) => keysToCamel(athlete));
  }

  async getMyCoaches(userId: AuthUser['user_id']) {
    const users = await this.prisma.user.findMany({
      where: { coach_athletes: { some: { athlete_id: userId } } },
    });
    return users.map((user) => keysToCamel(user));
  }

  async inviteCoach(userId: AuthUser['user_id'], email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const athlete = await this.prisma.athlete.findUnique({
      where: { user_id: userId },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    await this.prisma.coach_athlete.create({
      data: {
        athlete_id: athlete.athlete_id,
        user_id: user.user_id,
      },
    });
  }

  async inviteAthlete(userId: AuthUser['user_id'], email: string) {
    await this.athleteInvitationService.createInvitation(userId, email);
  }

  async removeAthlete(
    userId: AuthUser['user_id'],
    athleteId: athlete['athlete_id'],
  ) {
    const athlete = await this.prisma.athlete.findUnique({
      where: { athlete_id: athleteId },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    await this.prisma.coach_athlete.deleteMany({
      where: { athlete_id: athleteId, user_id: userId },
    });
  }

  async removeCoach(userId: AuthUser['user_id'], coachId: athlete['user_id']) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: coachId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const athlete = await this.prisma.athlete.findUnique({
      where: { user_id: userId },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    await this.prisma.coach_athlete.deleteMany({
      where: { athlete_id: athlete.athlete_id, user_id: user.user_id },
    });
  }
}
