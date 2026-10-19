import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { Event } from '@openathlete/database';
import {
  DuplicateWorkoutDto,
  ReorderWorkoutStepsDto,
  mapPrismaWorkoutToDto,
  mapWorkoutDtoToPrisma,
} from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { accessibleBy } from 'src/modules/auth/services/casl-prisma';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { EventService } from './event.service';

@Injectable()
export class WorkoutService {
  constructor(
    private readonly prisma: PrismaService,
    private abilities: CaslAbilityFactory,
    private moduleRef: ModuleRef,
  ) {}

  /**
   * Reorder workout steps for a training event
   */
  async reorderWorkoutSteps(
    user: AuthUser,
    eventId: Event['eventId'],
    data: ReorderWorkoutStepsDto,
  ) {
    const ability = await this.abilities.getFor({ user });

    const event = await this.prisma.event.findFirst({
      where: {
        AND: [{ eventId: eventId }, accessibleBy(ability, 'update').Event],
      },
      include: {
        training: {
          include: {
            workout: true,
          },
        },
      },
    });

    if (!event || !event.training?.workout) {
      throw new NotFoundException('Training event with workout not found');
    }

    // The event check only proves the caller may edit this workout: every
    // step must belong to it, or nothing is written
    const ownSteps = await this.workoutStepIds(
      event.training.workout.workoutId,
    );
    if (data.stepOrders.some(({ stepId }) => !ownSteps.has(stepId))) {
      throw new BadRequestException('Steps must belong to this workout');
    }

    await this.prisma.$transaction(
      data.stepOrders.map(({ stepId, order }) =>
        this.prisma.workoutStep.update({
          where: { workoutStepId: stepId },
          data: { orderIndex: order },
        }),
      ),
    );

    // Return updated event with workout
    const eventService = this.moduleRef.get(EventService, { strict: false });
    return eventService.getEventById(user, eventId);
  }

  /**
   * Ids of a workout's steps, nested ones included: steps inside a repeat
   * block point to it rather than to the workout.
   */
  private async workoutStepIds(workoutId: number): Promise<Set<number>> {
    const select = {
      workoutStepId: true,
      repeatBlock: { select: { workoutRepeatId: true } },
    } as const;
    const ids = new Set<number>();
    let level = await this.prisma.workoutStep.findMany({
      where: { workoutId },
      select,
    });
    // Repeats nest a few levels at most; the bound only guards bad data
    for (let depth = 0; level.length > 0 && depth < 10; depth++) {
      for (const step of level) ids.add(step.workoutStepId);
      const repeatIds = level.flatMap((step) =>
        step.repeatBlock ? [step.repeatBlock.workoutRepeatId] : [],
      );
      level = repeatIds.length
        ? await this.prisma.workoutStep.findMany({
            where: { repeatParentId: { in: repeatIds } },
            select,
          })
        : [];
    }
    return ids;
  }

  /**
   * Duplicate workout from one training to another
   */
  async duplicateWorkout(
    user: AuthUser,
    sourceEventId: Event['eventId'],
    data: DuplicateWorkoutDto,
  ) {
    const ability = await this.abilities.getFor({ user });

    // Get source event with workout
    const sourceEvent = await this.prisma.event.findFirst({
      where: {
        AND: [{ eventId: sourceEventId }, accessibleBy(ability, 'read').Event],
      },
      include: {
        training: {
          include: {
            workout: {
              include: {
                steps: {
                  include: {
                    targets: true,
                    repeatBlock: {
                      include: {
                        childSteps: {
                          include: { targets: true },
                          orderBy: { orderIndex: 'asc' },
                        },
                      },
                    },
                  },
                  orderBy: { orderIndex: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!sourceEvent || !sourceEvent.training?.workout) {
      throw new NotFoundException(
        'Source training event with workout not found',
      );
    }

    // Get target event
    const targetEvent = await this.prisma.event.findFirst({
      where: {
        AND: [
          { eventId: data.targetTrainingId },
          accessibleBy(ability, 'update').Event,
        ],
      },
      include: {
        training: {
          include: { workout: true },
        },
      },
    });

    if (!targetEvent || !targetEvent.training) {
      throw new NotFoundException('Target training event not found');
    }

    if (targetEvent.training.workout) {
      throw new BadRequestException('Target training already has a workout');
    }

    const sourceWorkout = sourceEvent.training.workout;
    const sourceDto = mapPrismaWorkoutToDto(sourceWorkout);

    await this.prisma.workout.create({
      data: {
        eventTrainingId: targetEvent.training.eventTrainingId,
        ...mapWorkoutDtoToPrisma({ steps: sourceDto.steps }),
      },
      include: {
        steps: {
          include: {
            targets: true,
            repeatBlock: {
              include: {
                childSteps: {
                  include: { targets: true },
                  orderBy: { orderIndex: 'asc' },
                },
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    // Return updated target event
    const eventService = this.moduleRef.get(EventService, { strict: false });
    return eventService.getEventById(user, data.targetTrainingId);
  }
}
