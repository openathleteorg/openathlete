import { subject } from '@casl/ability';

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { cycle } from '@openathlete/database';
import { CreateCycleDto, keysToCamel, keysToSnake } from '@openathlete/shared';

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
      const coachAthlete = user.coach_athletes?.find(
        (ca) => ca.athlete_id === athleteId,
      );
      if (!coachAthlete) {
        throw new ForbiddenException('You are not coaching this athlete');
      }
    }

    const ability = await this.abilities.getFor({ user });

    const cycles = await this.prisma.cycle.findMany({
      where: {
        AND: [
          accessibleBy(ability, 'read').cycle,
          athleteId
            ? { athlete_id: athleteId }
            : isCoach
              ? {
                  athlete_id: {
                    in: user.coach_athletes?.map((ca) => ca.athlete_id) || [],
                  },
                }
              : { athlete_id: user?.athlete?.athlete_id || null },
        ],
      },
      include: {
        athlete: true,
      },
    });

    return cycles.map((cycle) => keysToCamel(cycle));
  }

  async getCycleById(user: AuthUser, cycleId: cycle['cycle_id']) {
    const ability = await this.abilities.getFor({ user });

    const cycle = await this.prisma.cycle.findFirst({
      where: {
        AND: [{ cycle_id: cycleId }, accessibleBy(ability, 'read').cycle],
      },
      include: {
        athlete: true,
      },
    });

    if (!cycle) {
      throw new NotFoundException('Cycle not found');
    }

    return keysToCamel(cycle);
  }

  async createCycle(user: AuthUser, data: CreateCycleDto) {
    const ability = await this.abilities.getFor({ user });

    const { athlete_id, ...rest } = keysToSnake(data);

    const finalAthleteId = athlete_id || user?.athlete?.athlete_id;

    if (!finalAthleteId) {
      throw new ForbiddenException('Athlete ID is required');
    }

    if (
      !ability.can(
        'create',
        subject('cycle', { athlete_id: finalAthleteId } as cycle),
      )
    ) {
      throw new ForbiddenException('You are not allowed to create this cycle');
    }

    const cycle = await this.prisma.cycle.create({
      data: {
        athlete_id: finalAthleteId,
        ...rest,
      },
      include: {
        athlete: true,
      },
    });

    return keysToCamel(cycle);
  }

  async updateCycle(
    user: AuthUser,
    cycleId: cycle['cycle_id'],
    data: Partial<CreateCycleDto>,
  ) {
    const ability = await this.abilities.getFor({ user });

    const cycle = await this.prisma.cycle.findFirst({
      where: {
        AND: [{ cycle_id: cycleId }, accessibleBy(ability, 'update').cycle],
      },
    });

    if (!cycle) {
      throw new NotFoundException('Cycle not found');
    }

    const updateData = keysToSnake(data);

    const updatedCycle = await this.prisma.cycle.update({
      where: { cycle_id: cycleId },
      data: updateData,
      include: {
        athlete: true,
      },
    });

    return keysToCamel(updatedCycle);
  }

  async deleteCycle(user: AuthUser, cycleId: cycle['cycle_id']) {
    const ability = await this.abilities.getFor({ user });

    const cycle = await this.prisma.cycle.findFirst({
      where: {
        AND: [{ cycle_id: cycleId }, accessibleBy(ability, 'delete').cycle],
      },
    });

    if (!cycle) {
      throw new NotFoundException('Cycle not found');
    }

    await this.prisma.cycle.delete({
      where: { cycle_id: cycleId },
    });

    return { success: true };
  }
}
