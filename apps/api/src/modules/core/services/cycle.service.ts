import { subject } from '@casl/ability';

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Cycle } from '@openathlete/database';
import { CreateCycleDto } from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { accessibleBy } from 'src/modules/auth/services/casl-prisma';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class CycleService {
  constructor(
    private prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
  ) {}

  async getMyCycles(user: AuthUser, isCoach: boolean, athleteId?: number) {
    if (isCoach && athleteId) {
      // For coaches, filter to specific athlete if provided
      const coachAthlete = user.coachAthletes?.find(
        (ca) => ca.athleteId === athleteId,
      );
      if (!coachAthlete) {
        throw new ForbiddenException('You are not coaching this athlete');
      }
    }

    const ability = await this.abilities.getFor({ user });

    const cycles = await this.prisma.cycle.findMany({
      where: {
        AND: [
          accessibleBy(ability, 'read').Cycle,
          athleteId
            ? { athleteId: athleteId }
            : isCoach
              ? {
                  athleteId: {
                    in: user.coachAthletes?.map((ca) => ca.athleteId) || [],
                  },
                }
              : { athleteId: user?.athlete?.athleteId || null },
        ],
      },
      include: {
        athlete: true,
      },
    });

    return cycles;
  }

  async getCycleById(user: AuthUser, cycleId: Cycle['cycleId']) {
    const ability = await this.abilities.getFor({ user });

    const cycle = await this.prisma.cycle.findFirst({
      where: {
        AND: [{ cycleId: cycleId }, accessibleBy(ability, 'read').Cycle],
      },
      include: {
        athlete: true,
      },
    });

    if (!cycle) {
      throw new NotFoundException('Cycle not found');
    }

    return cycle;
  }

  async createCycle(user: AuthUser, data: CreateCycleDto) {
    const ability = await this.abilities.getFor({ user });

    const finalAthleteId = data.athleteId || user?.athlete?.athleteId;

    if (!finalAthleteId) {
      throw new ForbiddenException('Athlete ID is required');
    }

    if (
      !ability.can(
        'create',
        subject('Cycle', { athleteId: finalAthleteId } as Cycle),
      )
    ) {
      throw new ForbiddenException('You are not allowed to create this cycle');
    }

    const { athleteId, ...rest } = data;
    const cycle = await this.prisma.cycle.create({
      data: {
        athleteId: finalAthleteId,
        ...rest,
      },
      include: {
        athlete: true,
      },
    });

    return cycle;
  }

  async updateCycle(
    user: AuthUser,
    cycleId: Cycle['cycleId'],
    data: Partial<CreateCycleDto>,
  ) {
    const ability = await this.abilities.getFor({ user });

    const cycle = await this.prisma.cycle.findFirst({
      where: {
        AND: [{ cycleId: cycleId }, accessibleBy(ability, 'update').Cycle],
      },
    });

    if (!cycle) {
      throw new NotFoundException('Cycle not found');
    }

    const updatedCycle = await this.prisma.cycle.update({
      where: { cycleId: cycleId },
      data: data,
      include: {
        athlete: true,
      },
    });

    return updatedCycle;
  }

  async deleteCycle(user: AuthUser, cycleId: Cycle['cycleId']) {
    const ability = await this.abilities.getFor({ user });

    const cycle = await this.prisma.cycle.findFirst({
      where: {
        AND: [{ cycleId: cycleId }, accessibleBy(ability, 'delete').Cycle],
      },
    });

    if (!cycle) {
      throw new NotFoundException('Cycle not found');
    }

    await this.prisma.cycle.delete({
      where: { cycleId: cycleId },
    });

    return { success: true };
  }
}
