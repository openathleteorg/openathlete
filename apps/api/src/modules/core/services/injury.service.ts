import { subject } from '@casl/ability';

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { athlete } from '@openathlete/database';
import { AthleteInjury, INJURY_STATUS, keysToCamel } from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class InjuryService {
  constructor(
    private prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
  ) {}

  /**
   * Get all injuries for the authenticated user or specific athlete
   */
  async getInjuries(
    user: AuthUser,
    athleteId?: athlete['athlete_id'],
  ): Promise<AthleteInjury[]> {
    const ability = await this.abilities.getFor({ user });

    // Determine which athlete's injuries to fetch
    let targetAthleteId: number;

    if (athleteId) {
      // Check if user can access this athlete's data
      const athlete = await this.prisma.athlete.findUnique({
        where: { athlete_id: athleteId },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      if (!ability.can('read', subject('athlete', athlete))) {
        throw new ForbiddenException('Not allowed to access this athlete');
      }

      targetAthleteId = athleteId;
    } else {
      // Use current user's athlete ID
      const athlete = await this.prisma.athlete.findFirst({
        where: {
          user: {
            user_id: user.user_id,
          },
        },
        select: {
          athlete_id: true,
        },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      targetAthleteId = athlete.athlete_id;
    }

    const injuries = await this.prisma.athlete_injury.findMany({
      where: {
        athlete_id: targetAthleteId,
      },
      orderBy: { updated_at: 'desc' },
    });

    // Map Prisma injury_status to shared INJURY_STATUS enum
    const mappedInjuries = injuries.map((injury) => ({
      ...injury,
      status: injury.status as INJURY_STATUS,
    }));

    return keysToCamel<AthleteInjury[]>(mappedInjuries);
  }
}
