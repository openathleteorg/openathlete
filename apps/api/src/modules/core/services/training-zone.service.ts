import { subject } from '@casl/ability';

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CreateTrainingZoneDto,
  UpdateTrainingZoneDto,
} from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
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
      where: { athleteId: athleteId },
    });
    if (!athlete) throw new NotFoundException('Athlete not found');
    if (!ability.can('read', subject('athlete', athlete))) {
      throw new ForbiddenException('Not allowed to access this athlete');
    }
    const zones = await this.prisma.trainingZone.findMany({
      where: { athleteId: athleteId },
      include: { values: true },
      orderBy: { index: 'asc' },
    });
    return zones;
  }

  async create(user: AuthUser, dto: CreateTrainingZoneDto) {
    const ability = await this.abilities.getFor({ user });
    // Check access to athlete
    const athlete = await this.prisma.athlete.findUnique({
      where: { athleteId: dto.athleteId },
    });
    if (!athlete) throw new NotFoundException('Athlete not found');
    if (!ability.can('update', subject('athlete', athlete))) {
      throw new ForbiddenException('Not allowed to update this athlete');
    }
    const existingCount = await this.prisma.trainingZone.count({
      where: { athleteId: dto.athleteId, type: dto.type },
    });
    const zone = await this.prisma.trainingZone.create({
      data: {
        name: dto.name,
        description: dto.description ?? '',
        index: existingCount,
        type: dto.type,
        color: dto.color,
        athleteId: dto.athleteId,
        values: {
          create: [{ min: dto.min, max: dto.max, sports: dto.sports }],
        },
      },
      include: { values: true },
    });
    return zone;
  }

  async update(
    user: AuthUser,
    trainingZoneId: number,
    dto: UpdateTrainingZoneDto,
  ) {
    const ability = await this.abilities.getFor({ user });
    const zone = await this.prisma.trainingZone.findUnique({
      where: { trainingZoneId: trainingZoneId },
      include: { values: true },
    });
    if (!zone) throw new NotFoundException('Training zone not found');
    const athlete = await this.prisma.athlete.findUnique({
      where: { athleteId: zone.athleteId },
    });
    if (!athlete) throw new NotFoundException('Athlete not found');
    if (!ability.can('update', subject('athlete', athlete))) {
      throw new ForbiddenException('Not allowed to update this athlete');
    }
    // For now, update only the first value
    const updatedZone = await this.prisma.trainingZone.update({
      where: { trainingZoneId: trainingZoneId },
      data: {
        name: dto.name,
        description: dto.description ?? '',
        color: dto.color,
        ...(dto.type && { type: dto.type }),
        values: {
          update: zone.values[0]
            ? [
                {
                  where: {
                    trainingZoneValueId: zone.values[0].trainingZoneValueId,
                  },
                  data: { min: dto.min, max: dto.max, sports: dto.sports },
                },
              ]
            : [],
        },
      },
      include: { values: true },
    });
    return updatedZone;
  }

  async delete(user: AuthUser, trainingZoneId: number) {
    const ability = await this.abilities.getFor({ user });
    const zone = await this.prisma.trainingZone.findUnique({
      where: { trainingZoneId: trainingZoneId },
    });
    if (!zone) throw new NotFoundException('Training zone not found');
    const athlete = await this.prisma.athlete.findUnique({
      where: { athleteId: zone.athleteId },
    });
    if (!athlete) throw new NotFoundException('Athlete not found');
    if (!ability.can('update', subject('athlete', athlete))) {
      throw new ForbiddenException('Not allowed to update this athlete');
    }
    await this.prisma.trainingZoneValue.deleteMany({
      where: { trainingZoneId: trainingZoneId },
    });
    await this.prisma.trainingZone.delete({
      where: { trainingZoneId: trainingZoneId },
    });
    return { success: true };
  }
}
