import { subject } from '@casl/ability';

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MetricType } from '@openathlete/database';
import { UpdateAthleteSettingsDto } from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class AthleteSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
  ) {}

  async getSettingsForAthlete(user: AuthUser, athleteId: number) {
    const ability = await this.abilities.getFor({ user });
    // Check access to athlete
    const athlete = await this.prisma.athlete.findUnique({
      where: { athleteId: athleteId },
    });
    if (!athlete) throw new NotFoundException('Athlete not found');
    if (!ability.can('read', subject('Athlete', athlete))) {
      throw new ForbiddenException('Not allowed to access this athlete');
    }

    // Get or create settings
    let settings = await this.prisma.athleteSettings.findUnique({
      where: { athleteId: athleteId },
    });

    if (!settings) {
      settings = await this.prisma.athleteSettings.create({
        data: {
          athleteId: athleteId,
          requireRpe: false,
          requireComment: false,
          requireFeedbackQuestions: true, // Default to true
        },
      });
    }

    return settings;
  }

  async updateSettings(
    user: AuthUser,
    athleteId: number,
    dto: UpdateAthleteSettingsDto,
  ) {
    const ability = await this.abilities.getFor({ user });
    // Check access to athlete
    const athlete = await this.prisma.athlete.findUnique({
      where: { athleteId: athleteId },
    });
    if (!athlete) throw new NotFoundException('Athlete not found');
    if (!ability.can('update', subject('Athlete', athlete))) {
      throw new ForbiddenException('Not allowed to update this athlete');
    }

    const pinnedMetrics = dto.pinnedMetrics && [
      ...new Set(dto.pinnedMetrics as MetricType[]),
    ];

    const dismissedRecordSuspects = dto.dismissedRecordSuspects && [
      ...new Set(dto.dismissedRecordSuspects),
    ];

    // Upsert settings
    const settings = await this.prisma.athleteSettings.upsert({
      where: { athleteId: athleteId },
      create: {
        athleteId: athleteId,
        requireRpe: dto.requireRpe ?? false,
        requireComment: dto.requireComment ?? false,
        requireFeedbackQuestions: dto.requireFeedbackQuestions ?? true,
        ...(pinnedMetrics && { pinnedMetrics }),
        ...(dismissedRecordSuspects && { dismissedRecordSuspects }),
      },
      update: {
        ...(dto.requireRpe !== undefined && { requireRpe: dto.requireRpe }),
        ...(dto.requireComment !== undefined && {
          requireComment: dto.requireComment,
        }),
        ...(dto.requireFeedbackQuestions !== undefined && {
          requireFeedbackQuestions: dto.requireFeedbackQuestions,
        }),
        ...(pinnedMetrics && { pinnedMetrics }),
        ...(dismissedRecordSuspects && { dismissedRecordSuspects }),
      },
    });

    return settings;
  }
}
