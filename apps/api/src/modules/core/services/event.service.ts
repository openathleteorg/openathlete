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
  Inject,
  Injectable,
  NotFoundException,
  Optional,
  UnauthorizedException,
  forwardRef,
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
  EVENT_TYPE,
  ReorderWorkoutStepsDto,
  UpdateEventDto,
  calculateWorkoutDistance,
  calculateWorkoutDuration,
  createWorkoutSchema,
  keysToCamel,
  keysToSnake,
  mapPrismaWorkoutToDto,
  mapWorkoutDtoToPrisma,
  updateWorkoutSchema,
} from '@openathlete/shared';

import { ActivityImportedEvent, WorkoutPlannedChangedEvent } from 'src/events';
import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { accessibleBy } from 'src/modules/auth/services/casl-prisma';
import { CalendarWebSocketService } from 'src/modules/calendar/services/calendar-websocket.service';
import { MessageThreadService } from 'src/modules/messages/services/message-thread.service';
import { MessageService } from 'src/modules/messages/services/message.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { ProviderExportService } from '../../providers-sync/export.service';
import { TrainingLoadEstimationService } from '../../queue/services/training-load-estimation.service';
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
    private messageThreadService: MessageThreadService,
    private messageService: MessageService,
    private readonly providerExportService: ProviderExportService,
    @Optional()
    @Inject(forwardRef(() => TrainingLoadEstimationService))
    private trainingLoadEstimationService?: TrainingLoadEstimationService,
    @Optional()
    private readonly calendarWebSocketService?: CalendarWebSocketService,
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

  async getMyEvents(
    user: AuthUser,
    isCoach: boolean,
    athleteId?: number,
    startDate?: Date,
    endDate?: Date,
  ) {
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

    return this.getEventsOfAthlete(user, startDate, endDate).then((events) =>
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

  async getEventsOfAthlete(user: AuthUser, startDate?: Date, endDate?: Date) {
    const ability = await this.abilities.getFor({ user });

    // Build date filter if dates are provided
    const dateFilter =
      startDate && endDate
        ? {
            OR: [
              // Event starts within the range
              {
                start_date: {
                  gte: startDate,
                  lte: endDate,
                },
              },
              // Event ends within the range
              {
                end_date: {
                  gte: startDate,
                  lte: endDate,
                },
              },
              // Event spans across the range
              {
                AND: [
                  { start_date: { lte: startDate } },
                  { end_date: { gte: endDate } },
                ],
              },
            ],
          }
        : {};

    return this.prisma.event.findMany({
      where: {
        AND: [
          accessibleBy(ability, 'read').event,
          {
            athlete_id: { not: null },
          },
          dateFilter,
        ],
      },
      include: EVENT_INCLUDES,
    });
  }

  async createEvent(user: AuthUser, data: CreateEventDto) {
    const ability = await this.abilities.getFor({ user });

    const workout = data.type === 'TRAINING' ? data.workout : undefined;

    const snakeCaseData = keysToSnake(data);
    const { type, end_date, start_date, name, athlete_id, ...rest } =
      snakeCaseData;

    // Remove workout from rest if it exists (it shouldn't be passed to Prisma create)
    if ('workout' in rest) {
      delete rest.workout;
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
      const parsed = createWorkoutSchema.safeParse({
        steps: workout.steps || [],
      });
      if (!parsed.success) {
        throw new BadRequestException(parsed.error.format());
      }
      const stepsForCreate = parsed.data.steps;
      const workoutData = await this.prisma.workout.create({
        data: {
          event_training_id: created.training.event_training_id,
          ...mapWorkoutDtoToPrisma({ steps: stepsForCreate }),
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
      const workoutDto = mapPrismaWorkoutToDto(workoutData);
      const estimatedDuration = calculateWorkoutDuration(workoutDto);
      const totalDistance = calculateWorkoutDistance(workoutDto);

      await this.prisma.workout.update({
        where: { workout_id: workoutData.workout_id },
        data: {
          estimated_duration: estimatedDuration,
          total_distance: totalDistance,
        },
      });

      // Emit event for workout export sync if within 7 days
      this.emitWorkoutPlannedChanged(
        created.event_id,
        finalAthleteId,
        workoutData.workout_id,
        created.start_date,
        created.training.sport,
      );
    }

    // Schedule training load estimation for future training events
    if (
      type === 'TRAINING' &&
      created.training &&
      created.start_date > new Date() &&
      this.trainingLoadEstimationService
    ) {
      this.trainingLoadEstimationService
        .scheduleEstimation(
          created.event_id,
          created.training.event_training_id,
          finalAthleteId,
        )
        .catch((error) => {
          // Log but don't fail the request
          console.error(
            `Failed to schedule training load estimation: ${error instanceof Error ? error.message : String(error)}`,
          );
        });
    }

    return this.getEventById(user, created.event_id);
  }

  emitWorkoutPlannedChanged(
    eventId: number,
    athleteId: number,
    workoutId: number | null,
    startDate: Date,
    sport: string,
  ) {
    // Check if date is within next 7 days (UTC)
    const now = new Date();
    const endDate = new Date(now);
    endDate.setUTCDate(endDate.getUTCDate() + 7);
    endDate.setUTCHours(23, 59, 59, 999);

    const eventDate = new Date(startDate);
    eventDate.setUTCHours(0, 0, 0, 0);

    if (eventDate <= endDate && eventDate >= now) {
      this.eventEmitter.emit(
        WorkoutPlannedChangedEvent.SLUG,
        new WorkoutPlannedChangedEvent({
          eventId,
          athleteId,
          workoutId: workoutId ?? null,
          startDate: eventDate,
          sport,
        }),
      );
    }
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

    const isTemplate = Boolean(
      await this.prisma.event_template.findUnique({
        where: { event_id: eventId },
      }),
    );

    const workout =
      data.type === EVENT_TYPE.TRAINING ? data.workout : undefined;

    const snakeCaseData = keysToSnake(data);
    const { type, end_date, start_date, name, athlete_id, ...rest } =
      snakeCaseData;

    if ('workout' in rest) {
      delete rest.workout;
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
              ...mapWorkoutDtoToPrisma({ steps: workout.steps }),
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
          const workoutDto = mapPrismaWorkoutToDto(updatedWorkout);
          const estimatedDuration = calculateWorkoutDuration(workoutDto);
          const totalDistance = calculateWorkoutDistance(workoutDto);

          await this.prisma.workout.update({
            where: { workout_id: existingWorkout.workout_id },
            data: {
              estimated_duration: estimatedDuration,
              total_distance: totalDistance,
            },
          });

          // Emit event for workout export sync if within 7 days (skip for templates)
          if (!isTemplate) {
            this.emitWorkoutPlannedChanged(
              eventId,
              event.athlete_id!,
              existingWorkout.workout_id,
              updatedEvent.start_date,
              event.training.sport,
            );
          }
        }
      } else if (workout && workout.steps && workout.steps.length > 0) {
        const parsedUpdate = updateWorkoutSchema.safeParse(workout);
        if (!parsedUpdate.success) {
          throw new BadRequestException(parsedUpdate.error.format());
        }
        const newWorkout = await this.prisma.workout.create({
          data: {
            event_training_id: event.training.event_training_id,
            ...mapWorkoutDtoToPrisma({ steps: parsedUpdate.data.steps }),
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

        const workoutDto = mapPrismaWorkoutToDto(newWorkout);
        const estimatedDuration = calculateWorkoutDuration(workoutDto);
        const totalDistance = calculateWorkoutDistance(workoutDto);

        await this.prisma.workout.update({
          where: { workout_id: newWorkout.workout_id },
          data: {
            estimated_duration: estimatedDuration,
            total_distance: totalDistance,
          },
        });

        // Emit event for workout export sync if within 7 days (skip for templates)
        if (!isTemplate) {
          this.emitWorkoutPlannedChanged(
            eventId,
            event.athlete_id!,
            newWorkout.workout_id,
            updatedEvent.start_date,
            event.training.sport,
          );
        }
      }
    }

    // Schedule training load estimation for future training events (skip for templates)
    if (
      !isTemplate &&
      event.type === 'TRAINING' &&
      event.training &&
      updatedEvent.start_date > new Date() &&
      this.trainingLoadEstimationService
    ) {
      this.trainingLoadEstimationService
        .scheduleEstimation(
          eventId,
          event.training.event_training_id,
          event.athlete_id!,
        )
        .catch((error) => {
          // Log but don't fail the request
          console.error(
            `Failed to schedule training load estimation: ${error instanceof Error ? error.message : String(error)}`,
          );
        });
    }

    // If date changed and there's a workout, emit event for new date too (skip for templates)
    if (
      !isTemplate &&
      event.type === 'TRAINING' &&
      event.training?.workout &&
      (start_date || end_date) &&
      event.athlete_id
    ) {
      const finalStartDate = start_date ?? event.start_date;
      this.emitWorkoutPlannedChanged(
        eventId,
        event.athlete_id,
        event.training.workout.workout_id,
        finalStartDate,
        event.training.sport,
      );
    }

    // If RPE was updated on an activity, trigger training load recalculation (skip for templates)
    if (!isTemplate && isRpeUpdate && event.activity) {
      this.eventEmitter.emit(
        ActivityImportedEvent.SLUG,
        new ActivityImportedEvent({
          eventActivityId: event.activity.event_activity_id,
          eventId: eventId,
        }),
      );
    }

    if (
      event.type === 'ACTIVITY' &&
      event.activity &&
      'description' in rest &&
      rest.description !== undefined
    ) {
      const description = rest.description as string | null;
      const eventActivityId = event.activity.event_activity_id;

      try {
        const existingThread = await this.prisma.message_thread.findUnique({
          where: { event_activity_id: eventActivityId },
          include: {
            messages: {
              orderBy: { created_at: 'asc' },
              take: 1,
            },
          },
        });

        if (existingThread) {
          const firstMessage = existingThread.messages[0];
          if (firstMessage) {
            await this.messageService.updateMessage(
              user,
              firstMessage.message_id,
              {
                content: description || '',
              },
            );
          } else if (description) {
            await this.messageService.createMessage(user, {
              messageThreadId: existingThread.message_thread_id,
              content: description,
            });
          }
        } else if (description) {
          const eventWithAthlete = await this.prisma.event.findUnique({
            where: { event_id: eventId },
            include: {
              athlete: {
                include: {
                  coach_athletes: {
                    include: {
                      user: true,
                    },
                  },
                },
              },
            },
          });

          if (eventWithAthlete?.athlete) {
            const athlete = eventWithAthlete.athlete;
            const participantUserIds = [
              athlete.user_id,
              ...athlete.coach_athletes.map((ca) => ca.user_id),
            ];

            const thread = await this.messageThreadService.createThread(user, {
              eventActivityId,
              participantUserIds,
            });

            await this.messageService.createMessage(user, {
              messageThreadId: thread.message_thread_id,
              content: description,
            });
          }
        }
      } catch (error) {
        console.error(
          '[EventService] Error creating/updating comment thread:',
          error,
        );
      }
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
      include: {
        activity: true,
        training: {
          include: { workout: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.training?.workout?.workout_id) {
      await this.providerExportService.deleteExportsForWorkout({
        workoutId: event.training.workout.workout_id,
      });
    }

    await this.prisma.provider_workout_export.deleteMany({
      where: {
        workout: {
          event_training_id: eventId,
        },
      },
    });
    await this.prisma.workout.deleteMany({
      where: { event_training_id: eventId },
    });
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

    const deletedEvent = await this.prisma.event.delete({
      where: { event_id: eventId },
    });

    if (event.athlete_id) {
      this.calendarWebSocketService?.notifyWeeklyLoadUpdated(event.athlete_id, {
        eventId,
        reason: 'event_deleted',
      });
    }

    return deletedEvent;
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
      if (!stream[key as keyof typeof stream]) {
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

    const subEntityData = { ...event[type.toLocaleLowerCase()] };

    delete subEntityData.event_training_id;
    delete subEntityData.event_competition_id;
    delete subEntityData.event_note_id;
    delete subEntityData.event_activity_id;
    delete subEntityData.event_id;
    delete subEntityData.related_activity_id;
    delete subEntityData.related_activity;

    if (type === 'TRAINING') {
      delete subEntityData.workout;
    }

    return this.prisma.event.create({
      data: {
        start_date,
        end_date,
        name,
        type,
        athlete_id,
        [type.toLocaleLowerCase()]: {
          create: subEntityData,
        },
      },
      include: EVENT_INCLUDES,
    });
  }

  async duplicateEventComplete(
    user: AuthUser,
    eventId: event['event_id'],
    dto?: { startDate?: Date; endDate?: Date },
  ) {
    const ability = await this.abilities.getFor({ user });

    // Get original event
    const originalEvent = await this.prisma.event.findFirst({
      where: {
        AND: [{ event_id: eventId }, accessibleBy(ability, 'read').event],
      },
      include: EVENT_INCLUDES,
    });

    if (!originalEvent) {
      throw new NotFoundException('Event not found');
    }

    // Duplicate the event
    const duplicatedEvent = await this.duplicateEvent(user, eventId);

    // Override dates if provided
    if (dto?.startDate || dto?.endDate) {
      const updateData: Record<string, unknown> = {};
      if (dto.startDate) updateData.start_date = dto.startDate;
      if (dto.endDate) updateData.end_date = dto.endDate;

      await this.prisma.event.update({
        where: { event_id: duplicatedEvent.event_id },
        data: updateData,
      });
    }

    if (originalEvent.type === 'TRAINING' && originalEvent.training?.workout) {
      const originalWorkout = await this.prisma.workout.findUnique({
        where: { event_training_id: originalEvent.training.event_training_id },
        include: {
          steps: {
            include: {
              targets: true,
              repeat_block: {
                include: {
                  child_steps: {
                    include: { targets: true },
                  },
                },
              },
            },
            orderBy: { order_index: 'asc' },
          },
        },
      });

      if (originalWorkout) {
        const duplicatedEventWithIncludes = await this.prisma.event.findUnique({
          where: { event_id: duplicatedEvent.event_id },
          include: EVENT_INCLUDES,
        });

        if (duplicatedEventWithIncludes?.training) {
          const originalDto = mapPrismaWorkoutToDto(originalWorkout);
          await this.prisma.workout.create({
            data: {
              estimated_duration: originalWorkout.estimated_duration,
              total_distance: originalWorkout.total_distance,
              event_training_id:
                duplicatedEventWithIncludes.training.event_training_id,
              ...mapWorkoutDtoToPrisma({ steps: originalDto.steps }),
            },
          });
        }
      }
    }

    // Get the final duplicated event with updated dates
    const finalDuplicatedEvent = await this.prisma.event.findUnique({
      where: { event_id: duplicatedEvent.event_id },
      include: EVENT_INCLUDES,
    });

    // Schedule training load estimation for future training events
    if (
      originalEvent.type === 'TRAINING' &&
      finalDuplicatedEvent?.training &&
      finalDuplicatedEvent.start_date > new Date() &&
      this.trainingLoadEstimationService
    ) {
      this.trainingLoadEstimationService
        .scheduleEstimation(
          duplicatedEvent.event_id,
          finalDuplicatedEvent.training.event_training_id,
          originalEvent.athlete_id!,
        )
        .catch((error) => {
          // Log but don't fail the request
          console.error(
            `Failed to schedule training load estimation: ${error instanceof Error ? error.message : String(error)}`,
          );
        });
    }

    // Notify websocket for training load reload (same as updateEvent)
    if (originalEvent.type === 'TRAINING' && originalEvent.athlete_id) {
      this.calendarWebSocketService?.notifyWeeklyLoadUpdated(
        originalEvent.athlete_id,
        {
          eventId: duplicatedEvent.event_id,
          reason: 'event_updated',
        },
      );
    }

    return this.getEventById(user, duplicatedEvent.event_id);
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
    const sourceDto = mapPrismaWorkoutToDto(sourceWorkout);

    // Create workout for target training
    const duplicatedWorkout = await this.prisma.workout.create({
      data: {
        event_training_id: targetEvent.training.event_training_id,
        ...mapWorkoutDtoToPrisma({ steps: sourceDto.steps }),
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
    const workoutDto = mapPrismaWorkoutToDto(duplicatedWorkout);
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
   * Check if an event is validated based on athlete settings
   */
  private async isEventValidated(
    event: event & {
      competition: event_competition | null;
      training: event_training | null;
      note: event_note | null;
      activity: Omit<event_activity, 'stream'> | null;
    },
  ): Promise<boolean> {
    if (!event.athlete_id) return true; // No athlete, consider validated

    // Get athlete settings
    const settings = await this.prisma.athlete_settings.findUnique({
      where: { athlete_id: event.athlete_id },
    });

    // If no settings, consider validated
    if (!settings || (!settings.require_rpe && !settings.require_comment)) {
      return true;
    }

    // For ACTIVITY events, check RPE and comment
    if (event.type === event_type.ACTIVITY && event.activity) {
      const hasRpe =
        event.activity.rpe !== null && event.activity.rpe !== undefined;
      const hasComment =
        event.activity.description !== null &&
        event.activity.description !== undefined &&
        event.activity.description.trim() !== '';

      if (settings.require_rpe && !hasRpe) return false;
      if (settings.require_comment && !hasComment) return false;

      return true;
    }

    // For TRAINING events, check related activity
    if (
      event.type === event_type.TRAINING &&
      event.training?.related_activity_id
    ) {
      const relatedActivity = await this.prisma.event_activity.findUnique({
        where: { event_activity_id: event.training.related_activity_id },
      });

      if (!relatedActivity) return false;

      const hasRpe =
        relatedActivity.rpe !== null && relatedActivity.rpe !== undefined;
      const hasComment =
        relatedActivity.description !== null &&
        relatedActivity.description !== undefined &&
        relatedActivity.description.trim() !== '';

      if (settings.require_rpe && !hasRpe) return false;
      if (settings.require_comment && !hasComment) return false;

      return true;
    }

    // For COMPETITION events, check related activity
    if (
      event.type === event_type.COMPETITION &&
      event.competition?.related_activity_id
    ) {
      const relatedActivity = await this.prisma.event_activity.findUnique({
        where: { event_activity_id: event.competition.related_activity_id },
      });

      if (!relatedActivity) return false;

      const hasRpe =
        relatedActivity.rpe !== null && relatedActivity.rpe !== undefined;
      const hasComment =
        relatedActivity.description !== null &&
        relatedActivity.description !== undefined &&
        relatedActivity.description.trim() !== '';

      if (settings.require_rpe && !hasRpe) return false;
      if (settings.require_comment && !hasComment) return false;

      return true;
    }

    // For TRAINING and COMPETITION without related activity, they are not validated
    if (
      (event.type === event_type.TRAINING ||
        event.type === event_type.COMPETITION) &&
      !event.training?.related_activity_id &&
      !event.competition?.related_activity_id
    ) {
      return false;
    }

    return true;
  }

  /**
   * Get unvalidated sessions for an athlete
   */
  async getUnvalidatedSessions(
    user: AuthUser,
    athleteId: number,
    startDate?: Date,
    endDate?: Date,
  ) {
    const ability = await this.abilities.getFor({ user });

    // Check access to athlete
    const athlete = await this.prisma.athlete.findUnique({
      where: { athlete_id: athleteId },
    });
    if (!athlete) throw new NotFoundException('Athlete not found');
    if (!ability.can('read', subject('athlete', athlete))) {
      throw new ForbiddenException('Not allowed to access this athlete');
    }

    // Build date filter if dates are provided
    const dateFilter =
      startDate && endDate
        ? {
            OR: [
              {
                start_date: {
                  gte: startDate,
                  lte: endDate,
                },
              },
              {
                end_date: {
                  gte: startDate,
                  lte: endDate,
                },
              },
              {
                AND: [
                  { start_date: { lte: startDate } },
                  { end_date: { gte: endDate } },
                ],
              },
            ],
          }
        : {};

    // Get all events for the athlete
    const events = await this.prisma.event.findMany({
      where: {
        AND: [
          accessibleBy(ability, 'read').event,
          {
            athlete_id: athleteId,
            type: {
              in: [event_type.ACTIVITY],
            },
          },
          dateFilter,
        ],
      },
      include: EVENT_INCLUDES,
    });

    // Filter unvalidated events
    const unvalidatedEvents = [] as typeof events;
    for (const event of events) {
      const isValidated = await this.isEventValidated(event);
      if (!isValidated) {
        unvalidatedEvents.push(event);
      }
    }

    return unvalidatedEvents.map((e) =>
      keysToCamel(this.prismaEventToEvent(e)),
    );
  }

  // Legacy builder/mapper removed; mapping is handled in @openathlete/shared utils.
}
