import { subject } from '@casl/ability';

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  Athlete,
  Record as PrismaRecord,
  RecordType,
  SportType,
} from '@openathlete/database';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class RecordService {
  constructor(
    private prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
  ) {}

  async getRecords(
    user: AuthUser,
    sport?: SportType,
    athleteId?: Athlete['athleteId'],
  ): Promise<PrismaRecord[]> {
    const ability = await this.abilities.getFor({ user });

    // Determine which athlete's records to fetch
    let targetAthleteId: number;

    if (athleteId) {
      // Check if user can access this athlete's data
      const athlete = await this.prisma.athlete.findUnique({
        where: { athleteId: athleteId },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      if (!ability.can('read', subject('Athlete', athlete))) {
        throw new ForbiddenException('Not allowed to access this athlete');
      }

      targetAthleteId = athleteId;
    } else {
      // Use current user's athlete ID
      if (!user.athlete?.athleteId) {
        throw new NotFoundException('Athlete not found');
      }
      targetAthleteId = user.athlete.athleteId;
    }

    const records = await this.prisma.record.findMany({
      where: {
        athleteId: targetAthleteId,
        ...(sport && {
          eventActivity: {
            sport,
          },
        }),
      },
    });

    const bestRecords = records.reduce(
      (acc, record) => {
        const { type, distance } = record;
        if (!acc[type]) {
          acc[type] = {};
        }
        if (!acc[type][distance]) {
          acc[type][distance] = record;
        } else {
          if (record.type === 'SPEED') {
            if (record.value < acc[type][distance].value) {
              acc[type][distance] = record;
            }
          } else {
            if (record.value > acc[type][distance].value) {
              acc[type][distance] = record;
            }
          }
        }
        return acc;
      },
      {} as Record<RecordType, Record<string, PrismaRecord>>,
    );

    const bestRecordsArray = Object.values(bestRecords).flatMap((type) =>
      Object.values(type),
    );

    return bestRecordsArray;
  }
}
