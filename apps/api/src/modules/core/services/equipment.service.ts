import { Injectable, NotFoundException } from '@nestjs/common';

import { Equipment, EquipmentType, SportType } from '@openathlete/database';
import { CreateEquipmentDto, UpdateEquipmentDto } from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

  async createEquipment(
    user: AuthUser,
    dto: CreateEquipmentDto,
  ): Promise<Equipment> {
    const athlete = await this.prisma.athlete.findFirst({
      where: {
        user: {
          userId: user.userId,
        },
      },
      select: {
        athleteId: true,
      },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    if (dto.isDefault) {
      await this.prisma.equipment.updateMany({
        where: {
          athleteId: athlete.athleteId,
          sports: {
            hasSome: dto.sports,
          },
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    return await this.prisma.equipment.create({
      data: {
        name: dto.name,
        type: dto.type as EquipmentType,
        sports: dto.sports as SportType[],
        isDefault: dto.isDefault,
        athlete: {
          connect: {
            athleteId: athlete.athleteId,
          },
        },
      },
    });
  }

  async updateEquipment(
    user: AuthUser,
    equipmentId: number,
    dto: UpdateEquipmentDto,
  ): Promise<Equipment> {
    const athlete = await this.prisma.athlete.findFirst({
      where: {
        user: {
          userId: user.userId,
        },
      },
      select: {
        athleteId: true,
      },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    const equipment = await this.prisma.equipment.findFirst({
      where: {
        equipmentId: equipmentId,
        athleteId: athlete.athleteId,
      },
    });

    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    if (dto.isDefault) {
      await this.prisma.equipment.updateMany({
        where: {
          athleteId: athlete.athleteId,
          equipmentId: {
            not: equipmentId,
          },
          sports: {
            hasSome: dto.sports || equipment.sports,
          },
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    return await this.prisma.equipment.update({
      where: {
        equipmentId: equipmentId,
      },
      data: {
        name: dto.name,
        type: dto.type as EquipmentType,
        sports: dto.sports as SportType[],
        isDefault: dto.isDefault,
      },
    });
  }

  async deleteEquipment(user: AuthUser, equipmentId: number): Promise<void> {
    const athlete = await this.prisma.athlete.findFirst({
      where: {
        user: {
          userId: user.userId,
        },
      },
      select: {
        athleteId: true,
      },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    const equipment = await this.prisma.equipment.findFirst({
      where: {
        equipmentId: equipmentId,
        athleteId: athlete.athleteId,
      },
    });

    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    await this.prisma.equipment.delete({
      where: {
        equipmentId: equipmentId,
      },
    });
  }

  async getMyEquipment(user: AuthUser): Promise<Equipment[]> {
    const athlete = await this.prisma.athlete.findFirst({
      where: {
        user: {
          userId: user.userId,
        },
      },
      select: {
        athleteId: true,
      },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    return await this.prisma.equipment.findMany({
      where: {
        athleteId: athlete.athleteId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getDefaultEquipmentForSport(
    user: AuthUser,
    sport: SportType,
  ): Promise<Equipment | null> {
    const athlete = await this.prisma.athlete.findFirst({
      where: {
        user: {
          userId: user.userId,
        },
      },
      select: {
        athleteId: true,
      },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    return await this.prisma.equipment.findFirst({
      where: {
        athleteId: athlete.athleteId,
        sports: {
          has: sport,
        },
        isDefault: true,
      },
    });
  }
}
