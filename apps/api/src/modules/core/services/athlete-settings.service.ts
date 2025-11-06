import { subject } from '@casl/ability';

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  UpdateAthleteSettingsDto,
  keysToCamel,
} from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class AthleteSettingsService {
  constructor(
    private prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
  ) {}

  async getSettingsForAthlete(user: AuthUser, athleteId: number) {
    const ability = await this.abilities.getFor({ user });
    // Check access to athlete
    const athlete = await this.prisma.athlete.findUnique({
      where: { athlete_id: athleteId },
    });
    if (!athlete) throw new NotFoundException('Athlete not found');
    if (!ability.can('read', subject('athlete', athlete))) {
      throw new ForbiddenException('Not allowed to access this athlete');
    }

    // Get or create settings
    let settings = await this.prisma.athlete_settings.findUnique({
      where: { athlete_id: athleteId },
    });

    if (!settings) {
      settings = await this.prisma.athlete_settings.create({
        data: {
          athlete_id: athleteId,
          require_rpe: false,
          require_comment: false,
        },
      });
    }

    return keysToCamel(settings);
  }

  async updateSettings(
    user: AuthUser,
    athleteId: number,
    dto: UpdateAthleteSettingsDto,
  ) {
    const ability = await this.abilities.getFor({ user });
    // Check access to athlete
    const athlete = await this.prisma.athlete.findUnique({
      where: { athlete_id: athleteId },
    });
    if (!athlete) throw new NotFoundException('Athlete not found');
    if (!ability.can('update', subject('athlete', athlete))) {
      throw new ForbiddenException('Not allowed to update this athlete');
    }

    // Upsert settings
    const settings = await this.prisma.athlete_settings.upsert({
      where: { athlete_id: athleteId },
      create: {
        athlete_id: athleteId,
        require_rpe: dto.requireRpe ?? false,
        require_comment: dto.requireComment ?? false,
      },
      update: {
        ...(dto.requireRpe !== undefined && { require_rpe: dto.requireRpe }),
        ...(dto.requireComment !== undefined && {
          require_comment: dto.requireComment,
        }),
      },
    });

    return keysToCamel(settings);
  }
}

