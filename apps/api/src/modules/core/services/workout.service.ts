import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';

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
    private prisma: PrismaService,
    private abilities: CaslAbilityFactory,
    @Inject(forwardRef(() => EventService))
    private eventService: EventService,
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

    // Reorder steps based on the provided order
    const updatePromises = data.stepOrders.map(({ stepId, order }) =>
      this.prisma.workoutStep.update({
        where: { workoutStepId: stepId },
        data: { orderIndex: order },
      }),
    );

    await Promise.all(updatePromises);

    // Return updated event with workout
    return this.eventService.getEventById(user, eventId);
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
    return this.eventService.getEventById(user, data.targetTrainingId);
  }
}
