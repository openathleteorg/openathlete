import { subject } from '@casl/ability';

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CreateTrainingZoneDto,
  UpdateTrainingZoneDto,
  keysToCamel,
} from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { accessibleBy } from 'src/modules/auth/services/casl-prisma';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class TrainingZoneService {
  constructor(
    private prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
  ) {}

  async getAllForAthlete(user: AuthUser, athleteId: number) {
    const ability = await this.abilities.getFor({ user });
    // Check access to athlete
    const athlete = await this.prisma.athlete.findUnique({
      where: { athlete_id: athleteId },
    });
    if (!athlete) throw new NotFoundException('Athlete not found');
    if (!ability.can('read', subject('athlete', athlete))) {
      throw new ForbiddenException('Not allowed to access this athlete');
    }
    const zones = await this.prisma.training_zone.findMany({
      where: { athlete_id: athleteId },
      include: { values: true },
      orderBy: { index: 'asc' },
    });
    return zones.map(keysToCamel);
  }

  async create(user: AuthUser, dto: CreateTrainingZoneDto) {
    const ability = await this.abilities.getFor({ user });
    // Check access to athlete
    const athlete = await this.prisma.athlete.findUnique({
      where: { athlete_id: dto.athleteId },
    });
    if (!athlete) throw new NotFoundException('Athlete not found');
    if (!ability.can('update', subject('athlete', athlete))) {
      throw new ForbiddenException('Not allowed to update this athlete');
    }
    // Determine next index for HEARTRATE zones
    const existingCount = await this.prisma.training_zone.count({
      where: { athlete_id: dto.athleteId, type: 'HEARTRATE' },
    });
    const zone = await this.prisma.training_zone.create({
      data: {
        name: dto.name,
        description: dto.description ?? '',
        index: existingCount,
        type: 'HEARTRATE',
        color: dto.color,
        athlete_id: dto.athleteId,
        values: {
          create: [{ min: dto.min, max: dto.max, sports: dto.sports }],
        },
      },
      include: { values: true },
    });
    return keysToCamel(zone);
  }

  async update(
    user: AuthUser,
    trainingZoneId: number,
    dto: UpdateTrainingZoneDto,
  ) {
    const ability = await this.abilities.getFor({ user });
    const zone = await this.prisma.training_zone.findUnique({
      where: { training_zone_id: trainingZoneId },
      include: { values: true },
    });
    if (!zone) throw new NotFoundException('Training zone not found');
    const athlete = await this.prisma.athlete.findUnique({
      where: { athlete_id: zone.athlete_id },
    });
    if (!athlete) throw new NotFoundException('Athlete not found');
    if (!ability.can('update', subject('athlete', athlete))) {
      throw new ForbiddenException('Not allowed to update this athlete');
    }
    // For now, update only the first value
    const updatedZone = await this.prisma.training_zone.update({
      where: { training_zone_id: trainingZoneId },
      data: {
        name: dto.name,
        description: dto.description ?? '',
        color: dto.color,
        values: {
          update: zone.values[0]
            ? [
                {
                  where: {
                    training_zone_value_id:
                      zone.values[0].training_zone_value_id,
                  },
                  data: { min: dto.min, max: dto.max, sports: dto.sports },
                },
              ]
            : [],
        },
      },
      include: { values: true },
    });
    return keysToCamel(updatedZone);
  }

  async delete(user: AuthUser, trainingZoneId: number) {
    const ability = await this.abilities.getFor({ user });
    const zone = await this.prisma.training_zone.findUnique({
      where: { training_zone_id: trainingZoneId },
    });
    if (!zone) throw new NotFoundException('Training zone not found');
    const athlete = await this.prisma.athlete.findUnique({
      where: { athlete_id: zone.athlete_id },
    });
    if (!athlete) throw new NotFoundException('Athlete not found');
    if (!ability.can('update', subject('athlete', athlete))) {
      throw new ForbiddenException('Not allowed to update this athlete');
    }
    await this.prisma.training_zone_value.deleteMany({
      where: { training_zone_id: trainingZoneId },
    });
    await this.prisma.training_zone.delete({
      where: { training_zone_id: trainingZoneId },
    });
    return { success: true };
  }
}
