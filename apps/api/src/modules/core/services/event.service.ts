import { subject } from '@casl/ability';
import * as argon2 from 'argon2';
import ical, {
  ICalCalendarMethod,
  ICalEvent,
  ICalEventData,
} from 'ical-generator';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  event,
  event_activity,
  event_competition,
  event_note,
  event_training,
  event_type,
} from '@openathlete/database';
import {
  ActivityStream,
  ApiEnvSchemaType,
  CompressedActivityStream,
  CreateEventDto,
  DuplicateWorkoutDto,
  ReorderWorkoutStepsDto,
  UpdateEventDto,
  calculateWorkoutDistance,
  calculateWorkoutDuration,
  keysToCamel,
  keysToSnake,
} from '@openathlete/shared';

import { ActivityImportedEvent } from 'src/events';
import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { accessibleBy } from 'src/modules/auth/services/casl-prisma';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import {
  reductActivityStreamToResolution,
  uncompressActivityStream,
} from '../helpers/activity-stream';

export const EVENT_INCLUDES = {
  training: {
    include: {
      related_activity: {
        select: {
          event_id: true,
        },
      },
      workout: {
        include: {
          steps: {
            include: {
              targets: true,
              repeat_block: {
                include: {
                  child_steps: {
                    include: {
                      targets: true,
                    },
                    orderBy: {
                      order_index: 'asc' as const,
                    },
                  },
                },
              },
            },
            orderBy: {
              order_index: 'asc' as const,
            },
          },
        },
      },
    },
  },
  competition: {
    include: {
      related_activity: {
        select: {
          event_id: true,
        },
      },
    },
  },
  note: true,
  activity: {
    // select all fields except stream
    select: {
      event_activity_id: true,
      event_id: true,
      distance: true,
      elevation_gain: true,
      moving_time: true,
      average_speed: true,
      max_speed: true,
      average_cadence: true,
      average_watts: true,
      max_watts: true,
      weighted_average_watts: true,
      average_heartrate: true,
      max_heartrate: true,
      kilojoules: true,
      average_gap_speed: true,
      average_normalized_speed: true,
      rpe: true,
      external_id: true,
      sport: true,
      provider: true,
      description: true,
      records: true,
      equipment_id: true,
      equipment: {
        select: {
          equipment_id: true,
          name: true,
          type: true,
        },
      },
    },
  },
};
@Injectable()
export class EventService {
  HASH_PEPPER: Buffer | undefined;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService<ApiEnvSchemaType, true>,
    private readonly abilities: CaslAbilityFactory,
    private eventEmitter: EventEmitter2,
  ) {
    this.HASH_PEPPER = this.configService.get('HASH_PEPPER')
      ? Buffer.from(this.configService.get('HASH_PEPPER'))
      : undefined;
  }

  public prismaEventToEvent(
    event: event & {
      competition: event_competition | null;
      training: event_training | null;
      note: event_note | null;
      activity: Omit<event_activity, 'stream'> | null;
    },
  ) {
    const { competition, training, note, activity, ...rest } = event;

    return {
      ...rest,
      ...(training ? { ...training } : {}),
      ...(competition ? { ...competition } : {}),
      ...(note ? { ...note } : {}),
      ...(activity ? { ...activity } : {}),
    };
  }

  async getMyEvents(user: AuthUser, isCoach: boolean, athleteId?: number) {
    if (isCoach) {
      user.athlete = null;

      if (athleteId) {
        user.coach_athletes = user.coach_athletes?.filter(
          (athlete) => athlete.athlete_id === athleteId,
        );
      }
    } else {
      user.coach_athletes = undefined;
    }

    return this.getEventsOfAthlete(user).then((events) =>
      events.map((e) => keysToCamel(this.prismaEventToEvent(e))),
    );
  }

  async getEventById(user: AuthUser, eventId: event['event_id']) {
    const ability = await this.abilities.getFor({ user });

    const event = await this.prisma.event.findFirst({
      where: {
        AND: [{ event_id: eventId }, accessibleBy(ability, 'read').event],
      },
      include: EVENT_INCLUDES,
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return keysToCamel(this.prismaEventToEvent(event));
  }

  async getEventsOfAthlete(user: AuthUser) {
    const ability = await this.abilities.getFor({ user });
    return this.prisma.event.findMany({
      where: {
        AND: [
          accessibleBy(ability, 'read').event,
          {
            athlete_id: { not: null },
          },
        ],
      },
      include: EVENT_INCLUDES,
    });
  }

  async createEvent(user: AuthUser, data: CreateEventDto) {
    const ability = await this.abilities.getFor({ user });

    const workout = (data as any).workout;

    const snakeCaseData = keysToSnake(data);
    const { type, end_date, start_date, name, athlete_id, ...rest } =
      snakeCaseData;

    // Remove workout from rest if it exists (it shouldn't be passed to Prisma create)
    if ('workout' in rest) {
      delete (rest as any).workout;
    }

    const finalAthleteId = athlete_id || user?.athlete?.athlete_id;

    if (!finalAthleteId) {
      throw new Error('Athlete ID is required');
    }

    if (
      !ability.can(
        'create',
        subject('event', { athlete_id: finalAthleteId } as event),
      )
    ) {
      throw new ForbiddenException('You are not allowed to create this event');
    }

    const created = await this.prisma.event.create({
      data: {
        athlete_id: finalAthleteId,
        start_date,
        end_date,
        name,
        type,
        [type.toLocaleLowerCase()]: {
          create: rest,
        },
      },
      include: EVENT_INCLUDES,
    });

    if (type === 'TRAINING' && workout && created.training) {
      const workoutData = await this.prisma.workout.create({
        data: {
          event_training_id: created.training.event_training_id,
          steps: {
            create: (workout.steps || []).map((step) =>
              this.buildStepCreateData(step),
            ),
          },
        },
        include: {
          steps: {
            include: {
              targets: true,
              repeat_block: {
                include: {
                  child_steps: {
                    include: { targets: true },
                    orderBy: { order_index: 'asc' },
                  },
                },
              },
            },
            orderBy: { order_index: 'asc' },
          },
        },
      });

      // Calculate and update estimated metrics
      const workoutDto = this.mapWorkoutToDto(workoutData);
      const estimatedDuration = calculateWorkoutDuration(workoutDto);
      const totalDistance = calculateWorkoutDistance(workoutDto);

      await this.prisma.workout.update({
        where: { workout_id: workoutData.workout_id },
        data: {
          estimated_duration: estimatedDuration,
          total_distance: totalDistance,
        },
      });
    }

    return this.getEventById(user, created.event_id);
  }

  async updateEvent(
    user: AuthUser,
    eventId: event['event_id'],
    data: UpdateEventDto,
  ) {
    const ability = await this.abilities.getFor({ user });

    const event = await this.prisma.event.findFirst({
      where: {
        AND: [{ event_id: eventId }, accessibleBy(ability, 'update').event],
      },
      include: EVENT_INCLUDES,
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const workout = (data as any).workout;

    const snakeCaseData = keysToSnake(data);
    const { type, end_date, start_date, name, athlete_id, ...rest } =
      snakeCaseData;

    if ('workout' in rest) {
      delete (rest as any).workout;
    }

    // Check if RPE is being updated on an activity
    const isRpeUpdate =
      event.type === 'ACTIVITY' &&
      'rpe' in rest &&
      rest.rpe !== undefined &&
      rest.rpe !== null;

    const updatedEvent = await this.prisma.event.update({
      where: { event_id: eventId },
      data: {
        start_date,
        end_date,
        name,
        type,
        ...(type
          ? {
              [type.toLocaleLowerCase()]: {
                update: rest,
              },
            }
          : {}),
      },
    });

    // Handle workout updates for training events
    if (event.type === 'TRAINING' && event.training && workout) {
      const existingWorkout = await this.prisma.workout.findUnique({
        where: { event_training_id: event.training.event_training_id },
      });

      if (existingWorkout) {
        // Update existing workout
        if (workout.steps) {
          // Delete existing steps and create new ones
          await this.prisma.workout_step.deleteMany({
            where: { workout_id: existingWorkout.workout_id },
          });

          const updatedWorkout = await this.prisma.workout.update({
            where: { workout_id: existingWorkout.workout_id },
            data: {
              steps: {
                create: workout.steps.map((step) =>
                  this.buildStepCreateData(step),
                ),
              },
            },
            include: {
              steps: {
                include: {
                  targets: true,
                  repeat_block: {
                    include: {
                      child_steps: {
                        include: { targets: true },
                        orderBy: { order_index: 'asc' },
                      },
                    },
                  },
                },
                orderBy: { order_index: 'asc' },
              },
            },
          });

          // Recalculate metrics
          const workoutDto = this.mapWorkoutToDto(updatedWorkout);
          const estimatedDuration = calculateWorkoutDuration(workoutDto);
          const totalDistance = calculateWorkoutDistance(workoutDto);

          await this.prisma.workout.update({
            where: { workout_id: existingWorkout.workout_id },
            data: {
              estimated_duration: estimatedDuration,
              total_distance: totalDistance,
            },
          });
        }
      } else if (workout && workout.steps && workout.steps.length > 0) {
        const newWorkout = await this.prisma.workout.create({
          data: {
            event_training_id: event.training.event_training_id,
            steps: {
              create: workout.steps.map((step) =>
                this.buildStepCreateData(step),
              ),
            },
          },
          include: {
            steps: {
              include: {
                targets: true,
                repeat_block: {
                  include: {
                    child_steps: {
                      include: { targets: true },
                      orderBy: { order_index: 'asc' },
                    },
                  },
                },
              },
              orderBy: { order_index: 'asc' },
            },
          },
        });

        const workoutDto = this.mapWorkoutToDto(newWorkout);
        const estimatedDuration = calculateWorkoutDuration(workoutDto);
        const totalDistance = calculateWorkoutDistance(workoutDto);

        await this.prisma.workout.update({
          where: { workout_id: newWorkout.workout_id },
          data: {
            estimated_duration: estimatedDuration,
            total_distance: totalDistance,
          },
        });
      }
    }

    // If RPE was updated on an activity, trigger training load recalculation
    if (isRpeUpdate && event.activity) {
      this.eventEmitter.emit(
        ActivityImportedEvent.SLUG,
        new ActivityImportedEvent({
          eventActivityId: event.activity.event_activity_id,
          eventId: eventId,
        }),
      );
    }

    // Return the full updated event with all includes
    return this.getEventById(user, eventId);
  }

  async deleteEvent(user: AuthUser, eventId: event['event_id']) {
    const ability = await this.abilities.getFor({ user });

    const event = await this.prisma.event.findFirst({
      where: {
        AND: [{ event_id: eventId }, accessibleBy(ability, 'delete').event],
      },
      include: { activity: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await this.prisma.event_training.deleteMany({
      where: { event_id: eventId },
    });
    await this.prisma.event_competition.deleteMany({
      where: { event_id: eventId },
    });
    await this.prisma.event_note.deleteMany({
      where: { event_id: eventId },
    });
    await this.prisma.event_activity_weather.deleteMany({
      where: { event_activity: { event_id: eventId } },
    });
    await this.prisma.event_activity_normalization_factor.deleteMany({
      where: { normalization: { event_activity: { event_id: eventId } } },
    });
    await this.prisma.event_activity_normalization.deleteMany({
      where: { event_activity: { event_id: eventId } },
    });
    await this.prisma.record.deleteMany({
      where: { event_activity: { event: { event_id: eventId } } },
    });
    await this.prisma.event_activity.deleteMany({
      where: { event_id: eventId },
    });

    return this.prisma.event.delete({
      where: { event_id: eventId },
    });
  }

  async getEventStream(
    user: AuthUser,
    eventId: event['event_id'],
    resolution: number,
    keys?: (keyof ActivityStream)[],
  ) {
    const ability = await this.abilities.getFor({ user });

    const event = await this.prisma.event.findFirst({
      where: {
        AND: [{ event_id: eventId }, accessibleBy(ability, 'read').event],
      },
      include: { activity: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const activity = await this.prisma.event_activity.findUnique({
      where: { event_id: eventId },
      select: { stream: true },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    const compressedStream = activity.stream as CompressedActivityStream;
    const stream = uncompressActivityStream(compressedStream);

    if (!stream) {
      throw new NotFoundException('Stream not found');
    }

    const selectedStreams = keys ? keys : Object.keys(stream);

    const compressedStreams: ActivityStream = {};

    for (const key of selectedStreams) {
      if (!stream[key]) {
        continue;
      }

      compressedStreams[key] = reductActivityStreamToResolution(
        stream[key],
        resolution,
      );
    }

    return compressedStreams;
  }

  async getEventWeather(user: AuthUser, eventId: event['event_id']) {
    const ability = await this.abilities.getFor({ user });

    const evt = await this.prisma.event.findFirst({
      where: {
        AND: [{ event_id: eventId }, accessibleBy(ability, 'read').event],
      },
      include: { activity: true },
    });

    if (!evt) {
      throw new NotFoundException('Event not found');
    }

    const activity = await this.prisma.event_activity.findUnique({
      where: { event_id: eventId },
      select: { event_activity_id: true },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    const weather = await this.prisma.event_activity_weather.findUnique({
      where: { event_activity_id: activity.event_activity_id },
      select: { resolution_m: true, provider: true, samples: true },
    });

    if (!weather) {
      throw new NotFoundException('Weather not found');
    }

    // keysToCamel for API consistency
    return keysToCamel({
      resolution_m: weather.resolution_m,
      provider: weather.provider,
      samples: weather.samples,
    });
  }

  async getEventNormalization(user: AuthUser, eventId: event['event_id']) {
    const ability = await this.abilities.getFor({ user });

    const evt = await this.prisma.event.findFirst({
      where: {
        AND: [{ event_id: eventId }, accessibleBy(ability, 'read').event],
      },
      include: { activity: true },
    });

    if (!evt) {
      throw new NotFoundException('Event not found');
    }

    const activity = await this.prisma.event_activity.findUnique({
      where: { event_id: eventId },
      select: { event_activity_id: true, average_normalized_speed: true },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    const normalization =
      await this.prisma.event_activity_normalization.findUnique({
        where: { event_activity_id: activity.event_activity_id },
        include: { factors: true },
      });

    return {
      averageNormalizedSpeed: activity.average_normalized_speed,
      factors:
        normalization?.factors.map((f) => ({
          factor: f.factor,
          timeSeconds: f.time_seconds,
          percent: f.percent,
        })) ?? [],
    };
  }

  async setRelatedActivity(
    user: AuthUser,
    eventId: event['event_id'],
    activityId: event['event_id'],
  ): Promise<void> {
    const ability = await this.abilities.getFor({ user });

    const event = await this.prisma.event.findFirst({
      where: {
        AND: [{ event_id: eventId }, accessibleBy(ability, 'update').event],
      },
    });
    const activity = await this.prisma.event.findFirst({
      where: {
        AND: [{ event_id: activityId }, accessibleBy(ability, 'read').event],
      },
    });

    if (!event || !activity) {
      throw new NotFoundException();
    }

    if (
      event.type !== event_type.TRAINING &&
      event.type !== event_type.COMPETITION
    ) {
      throw new BadRequestException(
        'eventId must refer to a training or a competition',
      );
    }

    if (activity.type !== event_type.ACTIVITY) {
      throw new BadRequestException('activityId must refer to an activity');
    }

    if (event.type === 'COMPETITION') {
      await this.prisma.event_competition.update({
        where: { event_id: eventId },
        data: { related_activity: { connect: { event_id: activityId } } },
      });
    } else if (event.type === 'TRAINING') {
      await this.prisma.event_training.update({
        where: { event_id: eventId },
        data: { related_activity: { connect: { event_id: activityId } } },
      });
    }
  }

  async unsetRelatedActivity(
    user: AuthUser,
    eventId: event['event_id'],
  ): Promise<void> {
    const ability = await this.abilities.getFor({ user });

    const event = await this.prisma.event.findFirst({
      where: {
        AND: [{ event_id: eventId }, accessibleBy(ability, 'update').event],
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.type === 'COMPETITION') {
      await this.prisma.event_competition.update({
        where: { event_id: eventId },
        data: { related_activity: { disconnect: true } },
      });
    } else if (event.type === 'TRAINING') {
      await this.prisma.event_training.update({
        where: { event_id: eventId },
        data: { related_activity: { disconnect: true } },
      });
    }
  }

  async getIcalCalendar(base64Secret: string): Promise<string> {
    const secret = Buffer.from(base64Secret, 'base64').toString('utf-8');
    const users = await this.prisma.user.findMany({
      select: { user_id: true, athlete: { select: { athlete_id: true } } },
    });
    const user = await Promise.all(
      users.map(async (user) => {
        const isValid = await argon2.verify(secret, user.user_id.toString(), {
          secret: this.HASH_PEPPER,
        });
        return isValid ? user : null;
      }),
    ).then((results) => results.find((user) => user !== null));

    if (!user || !user.athlete?.athlete_id) {
      throw new UnauthorizedException();
    }

    const events = await this.prisma.event.findMany({
      where: {
        athlete_id: user.athlete.athlete_id,
        type: {
          not: event_type.ACTIVITY,
        },
      },
    });
    const calendar = ical({
      name: 'OpenAthlete',
      timezone: 'UTC',
      method: ICalCalendarMethod.PUBLISH,
    });
    events.forEach((event) => {
      const { start_date, end_date, name, type } = event;
      const eventType = type.toLowerCase();
      const eventData = {
        start: start_date,
        end: end_date,
        allDay: true,
        summary: name,
        description: `Type: ${eventType}`,
        uid: event.event_id,
      } as ICalEvent | ICalEventData;
      calendar.createEvent(eventData);
    });

    return calendar.toString();
  }

  async getMyIcalCalendarSecret(user: AuthUser): Promise<string> {
    const ability = await this.abilities.getFor({ user });

    const userEntity = await this.prisma.user.findFirst({
      where: {
        AND: [{ user_id: user.user_id }, accessibleBy(ability, 'read').user],
      },
      include: { athlete: true },
    });

    if (!userEntity?.athlete?.athlete_id) {
      throw new NotFoundException('Athlete not found');
    }

    const hash = await argon2.hash(userEntity.user_id.toString(), {
      secret: this.HASH_PEPPER,
    });

    return Buffer.from(hash).toString('base64');
  }

  async duplicateEvent(
    user: AuthUser,
    eventId: event['event_id'],
  ): Promise<event> {
    const ability = await this.abilities.getFor({ user });

    const event = await this.prisma.event.findFirst({
      where: {
        AND: [{ event_id: eventId }, accessibleBy(ability, 'read').event],
      },
      include: EVENT_INCLUDES,
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const { start_date, end_date, name, type, athlete_id } = event;

    return this.prisma.event.create({
      data: {
        start_date,
        end_date,
        name,
        type,
        athlete_id,
        [type.toLocaleLowerCase()]: {
          create: {
            ...event[type.toLocaleLowerCase()],
            event_training_id: undefined,
            event_competition_id: undefined,
            event_note_id: undefined,
            event_activity_id: undefined,
            event_id: undefined,
            related_activity_id: undefined,
            related_activity: undefined,
          },
        },
      },
      include: EVENT_INCLUDES,
    });
    // Note: Workout duplication is handled separately via WorkoutController
  }

  // ============================================================================
  // Workout-specific methods
  // ============================================================================

  /**
   * Reorder workout steps for a training event
   */
  async reorderWorkoutSteps(
    user: AuthUser,
    eventId: event['event_id'],
    data: ReorderWorkoutStepsDto,
  ) {
    const ability = await this.abilities.getFor({ user });

    const event = await this.prisma.event.findFirst({
      where: {
        AND: [{ event_id: eventId }, accessibleBy(ability, 'update').event],
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
      this.prisma.workout_step.update({
        where: { workout_step_id: stepId },
        data: { order_index: order },
      }),
    );

    await Promise.all(updatePromises);

    // Return updated event with workout
    return this.getEventById(user, eventId);
  }

  /**
   * Duplicate workout from one training to another
   */
  async duplicateWorkout(
    user: AuthUser,
    sourceEventId: event['event_id'],
    data: DuplicateWorkoutDto,
  ) {
    const ability = await this.abilities.getFor({ user });

    // Get source event with workout
    const sourceEvent = await this.prisma.event.findFirst({
      where: {
        AND: [{ event_id: sourceEventId }, accessibleBy(ability, 'read').event],
      },
      include: {
        training: {
          include: {
            workout: {
              include: {
                steps: {
                  include: {
                    targets: true,
                    repeat_block: {
                      include: {
                        child_steps: {
                          include: { targets: true },
                          orderBy: { order_index: 'asc' },
                        },
                      },
                    },
                  },
                  orderBy: { order_index: 'asc' },
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
          { event_id: data.targetTrainingId },
          accessibleBy(ability, 'update').event,
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

    // Create workout for target training
    const duplicatedWorkout = await this.prisma.workout.create({
      data: {
        event_training_id: targetEvent.training.event_training_id,
        steps: {
          create: sourceWorkout.steps.map((step) =>
            this.buildStepCreateData(step),
          ),
        },
      },
      include: {
        steps: {
          include: {
            targets: true,
            repeat_block: {
              include: {
                child_steps: {
                  include: { targets: true },
                  orderBy: { order_index: 'asc' },
                },
              },
            },
          },
          orderBy: { order_index: 'asc' },
        },
      },
    });

    // Calculate and update metrics
    const workoutDto = this.mapWorkoutToDto(duplicatedWorkout);
    const estimatedDuration = calculateWorkoutDuration(workoutDto);
    const totalDistance = calculateWorkoutDistance(workoutDto);

    await this.prisma.workout.update({
      where: { workout_id: duplicatedWorkout.workout_id },
      data: {
        estimated_duration: estimatedDuration,
        total_distance: totalDistance,
      },
    });

    // Return updated target event
    return this.getEventById(user, data.targetTrainingId);
  }

  /**
   * Helper method to build step create data for Prisma
   */
  private buildStepCreateData(step: any): any {
    console.log('[buildStepCreateData] Processing step:', {
      stepType: step.stepType || step.step_type,
      hasChildSteps: !!(step.childSteps && step.childSteps.length > 0),
      childStepsLength: step.childSteps?.length,
      hasRepeatBlock: !!(step.repeat_block || step.repeatBlock),
      repeatTimes: step.repeatTimes || step.repeat_times,
      repeatBlock: step.repeatBlock,
      step: JSON.stringify(step, null, 2),
    });

    const baseStep: any = {
      order_index: step.orderIndex || step.order_index || 0,
      step_type: step.stepType || step.step_type,
      name: step.name,
      duration_type: step.durationType || step.duration_type,
      duration_value: step.durationValue || step.duration_value,
      repeat_times: step.repeatTimes || step.repeat_times,
      rest_time: step.restTime || step.rest_time,
      notes: step.notes,
      targets: {
        create: (step.targets || []).map((target: any) => ({
          target_type: target.targetType || target.target_type,
          target_unit: target.targetUnit || target.target_unit,
          target_min_value: target.targetMinValue || target.target_min_value,
          target_max_value: target.targetMaxValue || target.target_max_value,
          target_value: target.targetValue || target.target_value,
        })),
      },
    };

    // Handle repeat blocks with child steps - support both camelCase and snake_case
    const repeatBlockData = step.repeatBlock || step.repeat_block;

    if (step.childSteps && step.childSteps.length > 0) {
      console.log(
        '[buildStepCreateData] Creating repeat block with',
        step.childSteps.length,
        'child steps',
      );
      baseStep.repeat_block = {
        create: {
          repetitions: step.repeatTimes || step.repeat_times || 1,
          child_steps: {
            create: step.childSteps.map((childStep: any, index: number) => ({
              ...this.buildStepCreateData(childStep),
              order_index: index,
            })),
          },
        },
      };
    } else if (repeatBlockData?.childSteps || repeatBlockData?.child_steps) {
      const childSteps =
        repeatBlockData.childSteps || repeatBlockData.child_steps;
      console.log(
        '[buildStepCreateData] Creating repeat block from repeatBlock object with',
        childSteps.length,
        'child steps',
      );
      baseStep.repeat_block = {
        create: {
          repetitions:
            repeatBlockData.repetitions ||
            step.repeatTimes ||
            step.repeat_times ||
            1,
          child_steps: {
            create: childSteps.map((childStep: any, index: number) => ({
              ...this.buildStepCreateData(childStep),
              order_index: index,
            })),
          },
        },
      };
    }

    return baseStep;
  }

  /**
   * Helper method to map Prisma workout to DTO
   */
  private mapWorkoutToDto(workout: any): any {
    return keysToCamel({
      ...workout,
      steps: workout.steps.map((step: any) => ({
        ...step,
        targets: step.targets || [],
        repeat_block: step.repeat_block
          ? {
              ...step.repeat_block,
              child_steps: step.repeat_block.child_steps || [],
            }
          : null,
      })),
    });
  }
}
