import { subject } from '@casl/ability';

import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
  forwardRef,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  ActivitySegment,
  Event,
  EventActivity,
  EventCompetition,
  EventNote,
  EventTraining,
  EventType,
  Prisma,
} from '@openathlete/database';
import {
  ActivityStream,
  CompressedActivityStream,
  CreateEventDto,
  DuplicateWorkoutDto,
  EVENT_TYPE,
  ReorderWorkoutStepsDto,
  SPORT_TYPE,
  SeasonEvent,
  UpdateEventDto,
  createWorkoutSchema,
  mapPrismaWorkoutToDto,
  mapWorkoutDtoToPrisma,
  startOfDay,
  updateWorkoutSchema,
} from '@openathlete/shared';

import {
  ActivityFeedbackCompletedEvent,
  ActivityImportedEvent,
  WorkoutPlannedChangedEvent,
} from 'src/events';
import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { accessibleBy } from 'src/modules/auth/services/casl-prisma';
import { CalendarWebSocketService } from 'src/modules/calendar/services/calendar-websocket.service';
import { MessageThreadService } from 'src/modules/messages/services/message-thread.service';
import { MessageService } from 'src/modules/messages/services/message.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { CoachActivityNoticeEvent } from '../../../events/coach-activity-notice.event';
import { ProviderExportService } from '../../providers-sync/export.service';
import { TrainingLoadEstimationService } from '../../queue/services/training-load-estimation.service';
import {
  reductActivityStreamToResolution,
  uncompressActivityStream,
} from '../helpers/activity-stream';
import { EVENT_INCLUDES } from './event-includes';
import { WorkoutService } from './workout.service';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
    private eventEmitter: EventEmitter2,
    private messageThreadService: MessageThreadService,
    private messageService: MessageService,
    private readonly providerExportService: ProviderExportService,
    @Inject(forwardRef(() => WorkoutService))
    private workoutService: WorkoutService,
    @Optional()
    @Inject(forwardRef(() => TrainingLoadEstimationService))
    private trainingLoadEstimationService?: TrainingLoadEstimationService,
    @Optional()
    private readonly calendarWebSocketService?: CalendarWebSocketService,
  ) {}

  public prismaEventToEvent(
    event: Event & {
      competition: EventCompetition | null;
      training: EventTraining | null;
      note: EventNote | null;
      activity:
        | (Omit<EventActivity, 'stream' | 'recordsVersion'> & {
            segments?: ActivitySegment[];
            trainingLoadEntries?: Array<{ value: number }>;
            feedbackQuestions?: Array<{
              activityFeedbackQuestionId: number;
              questionText: string;
              qcmOptions: unknown;
              answerText: string | null;
              createdAt: Date;
              updatedAt: Date;
            }>;
          })
        | null;
    },
  ) {
    const { competition, training, note, activity, ...rest } = event;
    const { trainingLoadEntries, ...activityFields } = activity ?? {};

    return {
      ...rest,
      ...(training ? { ...training } : {}),
      ...(competition ? { ...competition } : {}),
      ...(note ? { ...note } : {}),
      ...(activity
        ? {
            ...activityFields,
            // Null until the activity is processed
            trainingLoad: trainingLoadEntries?.length
              ? trainingLoadEntries.reduce((sum, entry) => sum + entry.value, 0)
              : null,
          }
        : {}),
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
        user.coachAthletes = user.coachAthletes?.filter(
          (athlete) => athlete.athleteId === athleteId,
        );
      }
    } else {
      user.coachAthletes = undefined;
    }

    return this.getEventsOfAthlete(user, startDate, endDate).then((events) =>
      events.map((e) => this.prismaEventToEvent(e)),
    );
  }

  async getUpcomingCompetitions(
    user: AuthUser,
    isCoach: boolean,
    athleteId?: number,
  ) {
    if (isCoach) {
      user.athlete = null;

      if (athleteId) {
        user.coachAthletes = user.coachAthletes?.filter(
          (athlete) => athlete.athleteId === athleteId,
        );
      }
    } else {
      user.coachAthletes = undefined;
    }

    const ability = await this.abilities.getFor({ user });
    const now = startOfDay(new Date());

    const events = await this.prisma.event.findMany({
      where: {
        AND: [
          accessibleBy(ability, 'read').Event,
          {
            athleteId: { not: null },
          },
          {
            type: EVENT_TYPE.COMPETITION,
          },
          {
            startDate: {
              gte: now,
            },
          },
        ],
      },
      include: EVENT_INCLUDES,
      orderBy: {
        startDate: 'asc',
      },
    });

    return events.map((e) => this.prismaEventToEvent(e));
  }

  /**
   * Planned sessions, races and activities of one athlete between two
   * dates, reduced to what the season view sums up.
   */
  async getSeasonEvents(
    user: AuthUser,
    startDate: Date,
    endDate: Date,
    athleteId?: number,
  ): Promise<SeasonEvent[]> {
    const targetAthleteId = athleteId ?? user.athlete?.athleteId;
    if (!targetAthleteId) {
      throw new BadRequestException('athleteId is required');
    }
    const ability = await this.abilities.getFor({ user });
    const goals = {
      select: {
        sport: true,
        goalDuration: true,
        goalDistance: true,
        relatedActivityId: true,
      },
    };
    const events = await this.prisma.event.findMany({
      where: {
        AND: [
          accessibleBy(ability, 'read').Event,
          { athleteId: targetAthleteId },
          { type: { in: ['TRAINING', 'COMPETITION', 'ACTIVITY'] } },
          { startDate: { gte: startDate, lte: endDate } },
        ],
      },
      select: {
        eventId: true,
        type: true,
        name: true,
        startDate: true,
        training: goals,
        competition: { select: { ...goals.select, priority: true } },
        activity: { select: { sport: true, movingTime: true, distance: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    return events.map((event) => {
      const planned = event.training ?? event.competition;
      return {
        eventId: event.eventId,
        type: event.type as SeasonEvent['type'],
        name: event.name,
        startDate: event.startDate,
        sport: (planned?.sport ?? event.activity?.sport) as SPORT_TYPE,
        plannedSeconds: planned?.goalDuration ?? null,
        plannedMeters: planned?.goalDistance ?? null,
        doneSeconds: event.activity?.movingTime ?? null,
        doneMeters: event.activity?.distance ?? null,
        done: Boolean(planned?.relatedActivityId),
        priority: (event.competition?.priority ??
          null) as SeasonEvent['priority'],
      };
    });
  }

  async getEventById(user: AuthUser, eventId: Event['eventId']) {
    const ability = await this.abilities.getFor({ user });

    const event = await this.prisma.event.findFirst({
      where: {
        AND: [{ eventId: eventId }, accessibleBy(ability, 'read').Event],
      },
      include: EVENT_INCLUDES,
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.prismaEventToEvent(event);
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
                startDate: {
                  gte: startDate,
                  lte: endDate,
                },
              },
              // Event ends within the range
              {
                endDate: {
                  gte: startDate,
                  lte: endDate,
                },
              },
              // Event spans across the range
              {
                AND: [
                  { startDate: { lte: startDate } },
                  { endDate: { gte: endDate } },
                ],
              },
            ],
          }
        : {};

    return this.prisma.event.findMany({
      where: {
        AND: [
          accessibleBy(ability, 'read').Event,
          {
            athleteId: { not: null },
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

    const { type, endDate, startDate, name, athleteId, ...rest } = data;

    // Remove workout from rest if it exists (it shouldn't be passed to Prisma create)
    if ('workout' in rest) {
      delete rest.workout;
    }

    const finalAthleteId = athleteId || user?.athlete?.athleteId;

    if (!finalAthleteId) {
      throw new Error('Athlete ID is required');
    }

    if (
      !ability.can(
        'create',
        subject('Event', { athleteId: finalAthleteId } as Event),
      )
    ) {
      throw new ForbiddenException('You are not allowed to create this event');
    }

    const created = await this.prisma.event.create({
      data: {
        athleteId: finalAthleteId,
        startDate,
        endDate,
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
          eventTrainingId: created.training.eventTrainingId,
          ...mapWorkoutDtoToPrisma({ steps: stepsForCreate }),
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

      // Emit event for workout export sync if within 7 days
      this.emitWorkoutPlannedChanged(
        created.eventId,
        finalAthleteId,
        workoutData.workoutId,
        created.startDate,
        created.training.sport,
      );
    }

    // Schedule training load estimation for future training events
    if (
      type === 'TRAINING' &&
      created.training &&
      created.startDate > startOfDay(new Date()) &&
      this.trainingLoadEstimationService
    ) {
      this.trainingLoadEstimationService
        .scheduleEstimation(
          created.eventId,
          created.training.eventTrainingId,
          finalAthleteId,
        )
        .catch((error) => {
          // Log but don't fail the request
          this.logger.error(
            `Failed to schedule training load estimation: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error.stack : undefined,
          );
        });
    }

    if (created.type === 'ACTIVITY')
      this.eventEmitter.emit(
        CoachActivityNoticeEvent.SLUG,
        new CoachActivityNoticeEvent({
          eventId: created.eventId,
          kind: 'ACTIVITY',
          deliveryKey: `import:${created.eventId}`,
        }),
      );
    return this.getEventById(user, created.eventId);
  }

  emitWorkoutPlannedChanged(
    eventId: number,
    athleteId: number,
    workoutId: number | null,
    startDate: Date,
    sport: string,
  ) {
    const eventDate = new Date(startDate);
    eventDate.setUTCHours(0, 0, 0, 0);

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

  async updateEvent(
    user: AuthUser,
    eventId: Event['eventId'],
    data: UpdateEventDto,
  ) {
    const ability = await this.abilities.getFor({ user });

    const event = await this.prisma.event.findFirst({
      where: {
        AND: [{ eventId: eventId }, accessibleBy(ability, 'update').Event],
      },
      include: EVENT_INCLUDES,
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const isTemplate = Boolean(
      await this.prisma.eventTemplate.findUnique({
        where: { eventId: eventId },
      }),
    );

    const workout =
      data.type === EVENT_TYPE.TRAINING ? data.workout : undefined;

    const {
      type,
      startDate,
      endDate: requestedEndDate,
      name,
      athleteId,
      ...rest
    } = data;
    let endDate = requestedEndDate;

    if ('workout' in rest) {
      delete rest.workout;
    }

    if (event.type === 'ACTIVITY') {
      // An activity lasts what was recorded: moving it keeps its duration
      if (startDate && !endDate) {
        endDate = new Date(
          startDate.getTime() +
            (event.endDate.getTime() - event.startDate.getTime()),
        );
      }
      if ('equipmentId' in rest && rest.equipmentId != null) {
        const equipment = await this.prisma.equipment.findFirst({
          where: { equipmentId: rest.equipmentId, athleteId: event.athleteId! },
        });
        if (!equipment) {
          throw new BadRequestException(
            "The equipment does not belong to the activity's athlete",
          );
        }
      }
    }
    const activityMoved =
      event.type === 'ACTIVITY' &&
      !!startDate &&
      startDate.getTime() !== event.startDate.getTime();

    // Check if RPE is being updated on an activity
    const isRpeUpdate =
      event.type === 'ACTIVITY' &&
      'rpe' in rest &&
      rest.rpe !== undefined &&
      rest.rpe !== null;

    const updatedEvent = await this.prisma.event.update({
      where: { eventId: eventId },
      data: {
        startDate,
        endDate,
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
        where: { eventTrainingId: event.training.eventTrainingId },
      });

      if (existingWorkout) {
        // Update existing workout
        if (workout.steps) {
          // Delete existing steps and create new ones
          await this.prisma.workoutStep.deleteMany({
            where: { workoutId: existingWorkout.workoutId },
          });

          await this.prisma.workout.update({
            where: { workoutId: existingWorkout.workoutId },
            data: {
              ...mapWorkoutDtoToPrisma({ steps: workout.steps }),
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

          // Emit event for workout export sync if within 7 days (skip for templates)
          if (!isTemplate) {
            this.emitWorkoutPlannedChanged(
              eventId,
              event.athleteId!,
              existingWorkout.workoutId,
              updatedEvent.startDate,
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
            eventTrainingId: event.training.eventTrainingId,
            ...mapWorkoutDtoToPrisma({ steps: parsedUpdate.data.steps }),
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

        // Emit event for workout export sync if within 7 days (skip for templates)
        if (!isTemplate) {
          this.emitWorkoutPlannedChanged(
            eventId,
            event.athleteId!,
            newWorkout.workoutId,
            updatedEvent.startDate,
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
      updatedEvent.startDate > startOfDay(new Date()) &&
      this.trainingLoadEstimationService &&
      event.training.estimatedLoad === null
    ) {
      this.trainingLoadEstimationService
        .scheduleEstimation(
          eventId,
          event.training.eventTrainingId,
          event.athleteId!,
        )
        .catch((error) => {
          // Log but don't fail the request
          this.logger.error(
            `Failed to schedule training load estimation: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error.stack : undefined,
          );
        });
    }

    // If date changed and there's a workout, emit event for new date too (skip for templates)
    if (
      !isTemplate &&
      event.type === 'TRAINING' &&
      event.training?.workout &&
      (startDate || endDate) &&
      event.athleteId
    ) {
      const finalStartDate = startDate ?? event.startDate;
      this.emitWorkoutPlannedChanged(
        eventId,
        event.athleteId,
        event.training.workout.workoutId,
        finalStartDate,
        event.training.sport,
      );
    }

    // Records and daily loads are dated by the activity
    if (!isTemplate && activityMoved && event.activity) {
      await this.prisma.record.updateMany({
        where: { eventActivityId: event.activity.eventActivityId },
        data: { date: startDate },
      });
    }

    // If RPE was updated on an activity, or it moved to another day, trigger
    // training load recalculation (skip for templates)
    if (!isTemplate && (isRpeUpdate || activityMoved) && event.activity) {
      this.eventEmitter.emit(
        ActivityImportedEvent.SLUG,
        new ActivityImportedEvent({
          eventActivityId: event.activity.eventActivityId,
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
      const eventActivityId = event.activity.eventActivityId;

      try {
        const existingThread = await this.prisma.messageThread.findUnique({
          where: { eventActivityId: eventActivityId },
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              take: 1,
            },
          },
        });

        if (existingThread) {
          const firstMessage = existingThread.messages[0];
          if (firstMessage) {
            await this.messageService.updateMessage(
              user,
              firstMessage.messageId,
              {
                content: description || '',
              },
              false,
            );
          } else if (description) {
            await this.messageService.createMessage(
              user,
              {
                messageThreadId: existingThread.messageThreadId,
                content: description,
              },
              false,
            );
          }
        } else if (description) {
          const eventWithAthlete = await this.prisma.event.findUnique({
            where: { eventId: eventId },
            include: {
              athlete: {
                include: {
                  coachAthletes: {
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
              athlete.userId,
              ...athlete.coachAthletes.map((ca) => ca.userId),
            ];

            const thread = await this.messageThreadService.createThread(user, {
              eventActivityId,
              participantUserIds,
            });

            await this.messageService.createMessage(
              user,
              {
                messageThreadId: thread.messageThreadId,
                content: description,
              },
              false,
            );
          }
        }
      } catch (error) {
        this.logger.error(
          `Error creating/updating comment thread: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
      }

      if (
        event.type === 'ACTIVITY' &&
        event.activity &&
        isRpeUpdate &&
        description &&
        description.trim() !== ''
      ) {
        const eventActivityId = event.activity.eventActivityId;
        this.eventEmitter.emit(
          ActivityFeedbackCompletedEvent.SLUG,
          new ActivityFeedbackCompletedEvent({
            eventActivityId,
            eventId,
            trigger: 'rpe_comment_updated',
          }),
        );
      }
    }

    if (!isTemplate && event.type === 'ACTIVITY' && event.activity) {
      const changed = (kind: 'RPE' | 'COMMENT') =>
        this.eventEmitter.emit(
          CoachActivityNoticeEvent.SLUG,
          new CoachActivityNoticeEvent({
            eventId,
            kind,
            actorUserId: user.userId,
            deliveryKey: `edit:${eventId}:${updatedEvent.updatedAt.toISOString()}`,
            rpe:
              'rpe' in rest && rest.rpe != null
                ? Math.round(rest.rpe * 10)
                : null,
          }),
        );
      if (
        'rpe' in rest &&
        rest.rpe !== undefined &&
        rest.rpe !== event.activity.rpe
      )
        changed('RPE');
      if (
        'description' in rest &&
        rest.description !== undefined &&
        rest.description !== event.activity.description
      )
        changed('COMMENT');
    }

    // Return the full updated event with all includes
    return this.getEventById(user, eventId);
  }

  async deleteEvent(user: AuthUser, eventId: Event['eventId']) {
    const ability = await this.abilities.getFor({ user });

    const event = await this.prisma.event.findFirst({
      where: {
        AND: [{ eventId: eventId }, accessibleBy(ability, 'delete').Event],
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

    if (event.training?.workout?.workoutId) {
      await this.providerExportService.deleteExportsForWorkout({
        workoutId: event.training.workout.workoutId,
      });
    }

    // Workouts belong to the event's training (eventTrainingId is not the
    // event id); deleting the training cascades to them
    await this.prisma.providerWorkoutExport.deleteMany({
      where: { workout: { eventTraining: { eventId } } },
    });
    await this.prisma.eventTraining.deleteMany({
      where: { eventId: eventId },
    });
    await this.prisma.eventCompetition.deleteMany({
      where: { eventId: eventId },
    });
    await this.prisma.eventNote.deleteMany({
      where: { eventId: eventId },
    });
    await this.prisma.eventActivityWeather.deleteMany({
      where: { eventActivity: { eventId: eventId } },
    });
    await this.prisma.eventActivityNormalizationFactor.deleteMany({
      where: { normalization: { eventActivity: { eventId: eventId } } },
    });
    await this.prisma.eventActivityNormalization.deleteMany({
      where: { eventActivity: { eventId: eventId } },
    });
    await this.prisma.record.deleteMany({
      where: { eventActivity: { event: { eventId: eventId } } },
    });
    await this.prisma.activityFeedbackQuestion.deleteMany({
      where: { activity: { eventId: eventId } },
    });
    await this.prisma.activityFeedbackEmbedding.deleteMany({
      where: { activity: { eventId: eventId } },
    });
    await this.prisma.eventActivity.deleteMany({
      where: { eventId: eventId },
    });

    const deletedEvent = await this.prisma.event.delete({
      where: { eventId: eventId },
    });

    if (event.athleteId) {
      this.calendarWebSocketService?.notifyWeeklyLoadUpdated(event.athleteId, {
        eventId,
        reason: 'event_deleted',
      });
    }

    return deletedEvent;
  }

  async getEventStream(
    user: AuthUser,
    eventId: Event['eventId'],
    resolution: number,
    keys?: (keyof ActivityStream)[],
  ) {
    const ability = await this.abilities.getFor({ user });

    const event = await this.prisma.event.findFirst({
      where: {
        AND: [{ eventId: eventId }, accessibleBy(ability, 'read').Event],
      },
      include: { activity: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const activity = await this.prisma.eventActivity.findUnique({
      where: { eventId: eventId },
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

    const selectedStreams = keys
      ? keys
      : (Object.keys(stream) as (keyof ActivityStream)[]);

    const compressedStreams: Partial<ActivityStream> = {};

    for (const key of selectedStreams) {
      const streamValue = stream[key];
      if (!streamValue) {
        continue;
      }

      const reduced = reductActivityStreamToResolution(streamValue, resolution);
      (compressedStreams as Record<string, unknown>)[key] = reduced;
    }

    return compressedStreams as ActivityStream;
  }

  async getEventWeather(user: AuthUser, eventId: Event['eventId']) {
    const ability = await this.abilities.getFor({ user });

    const evt = await this.prisma.event.findFirst({
      where: {
        AND: [{ eventId: eventId }, accessibleBy(ability, 'read').Event],
      },
      include: { activity: true },
    });

    if (!evt) {
      throw new NotFoundException('Event not found');
    }

    const activity = await this.prisma.eventActivity.findUnique({
      where: { eventId: eventId },
      select: { eventActivityId: true },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    const weather = await this.prisma.eventActivityWeather.findUnique({
      where: { eventActivityId: activity.eventActivityId },
      select: { resolutionM: true, provider: true, samples: true },
    });

    // Not fetched yet, or not available offline: nothing to show, no error
    if (!weather) return null;

    return {
      resolutionM: weather.resolutionM,
      provider: weather.provider,
      samples: weather.samples,
    };
  }

  async getEventNormalization(user: AuthUser, eventId: Event['eventId']) {
    const ability = await this.abilities.getFor({ user });

    const evt = await this.prisma.event.findFirst({
      where: {
        AND: [{ eventId: eventId }, accessibleBy(ability, 'read').Event],
      },
      include: { activity: true },
    });

    if (!evt) {
      throw new NotFoundException('Event not found');
    }

    const activity = await this.prisma.eventActivity.findUnique({
      where: { eventId: eventId },
      select: { eventActivityId: true, averageNormalizedSpeed: true },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    const normalization =
      await this.prisma.eventActivityNormalization.findUnique({
        where: { eventActivityId: activity.eventActivityId },
        include: { factors: true },
      });

    return {
      averageNormalizedSpeed: activity.averageNormalizedSpeed,
      factors:
        normalization?.factors.map((f) => ({
          factor: f.factor,
          timeSeconds: f.timeSeconds,
          percent: f.percent,
        })) ?? [],
    };
  }

  async setRelatedActivity(
    user: AuthUser,
    eventId: Event['eventId'],
    activityId: Event['eventId'],
  ): Promise<void> {
    const ability = await this.abilities.getFor({ user });

    const event = await this.prisma.event.findFirst({
      where: {
        AND: [{ eventId: eventId }, accessibleBy(ability, 'update').Event],
      },
    });
    const activity = await this.prisma.event.findFirst({
      where: {
        AND: [{ eventId: activityId }, accessibleBy(ability, 'read').Event],
      },
    });

    if (!event || !activity) {
      throw new NotFoundException();
    }

    if (
      event.type !== EventType.TRAINING &&
      event.type !== EventType.COMPETITION
    ) {
      throw new BadRequestException(
        'eventId must refer to a training or a competition',
      );
    }

    if (activity.type !== EventType.ACTIVITY) {
      throw new BadRequestException('activityId must refer to an activity');
    }

    const eventActivity = await this.prisma.eventActivity.findUnique({
      where: { eventId: activityId },
    });

    if (!eventActivity) {
      throw new BadRequestException(
        'The activity event does not have a corresponding EventActivity record',
      );
    }

    // A coach reads several athletes: never mix one's activity with another's plan
    if (activity.athleteId !== event.athleteId) {
      throw new BadRequestException(
        'The activity and the session belong to different athletes',
      );
    }

    // An activity is the outcome of a single session: linking it here moves
    // it from the session it was linked to, if any (relatedActivityId is
    // unique, so connecting it twice would fail)
    const { eventActivityId } = eventActivity;
    const elsewhere = {
      where: { relatedActivityId: eventActivityId, NOT: { eventId } },
      data: { relatedActivityId: null },
    };
    const link = {
      where: { eventId },
      data: { relatedActivity: { connect: { eventActivityId } } },
    };
    await this.prisma.$transaction([
      this.prisma.eventTraining.updateMany(elsewhere),
      this.prisma.eventCompetition.updateMany(elsewhere),
      event.type === EventType.COMPETITION
        ? this.prisma.eventCompetition.update(link)
        : this.prisma.eventTraining.update(link),
    ]);
  }

  async unsetRelatedActivity(
    user: AuthUser,
    eventId: Event['eventId'],
  ): Promise<void> {
    const ability = await this.abilities.getFor({ user });

    const event = await this.prisma.event.findFirst({
      where: {
        AND: [{ eventId: eventId }, accessibleBy(ability, 'update').Event],
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.type === 'COMPETITION') {
      await this.prisma.eventCompetition.update({
        where: { eventId: eventId },
        data: { relatedActivity: { disconnect: true } },
      });
    } else if (event.type === 'TRAINING') {
      await this.prisma.eventTraining.update({
        where: { eventId: eventId },
        data: { relatedActivity: { disconnect: true } },
      });
    }
  }

  async duplicateEvent(
    user: AuthUser,
    eventId: Event['eventId'],
  ): Promise<Event> {
    const ability = await this.abilities.getFor({ user });

    const event = await this.prisma.event.findFirst({
      where: {
        AND: [{ eventId: eventId }, accessibleBy(ability, 'read').Event],
      },
      include: EVENT_INCLUDES,
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const { startDate, endDate, name, type, athleteId } = event;

    const subEntityData: Record<string, unknown> = {
      ...event[type.toLocaleLowerCase() as Lowercase<Event['type']>],
    };

    delete subEntityData.eventTrainingId;
    delete subEntityData.eventCompetitionId;
    delete subEntityData.eventNoteId;
    delete subEntityData.eventActivityId;
    delete subEntityData.eventId;
    delete subEntityData.relatedActivityId;
    delete subEntityData.relatedActivity;
    // The comment thread stays with the original session (it is unique)
    delete subEntityData.messageThreadId;

    if (type === 'TRAINING') {
      delete subEntityData.workout;
      delete subEntityData.estimatedLoad;
    }

    return this.prisma.event.create({
      data: {
        startDate,
        endDate,
        name,
        type,
        athleteId,
        [type.toLocaleLowerCase()]: {
          create: subEntityData,
        },
      },
      include: EVENT_INCLUDES,
    });
  }

  async duplicateEventComplete(
    user: AuthUser,
    eventId: Event['eventId'],
    dto?: { startDate?: Date; endDate?: Date },
  ) {
    const ability = await this.abilities.getFor({ user });

    // Get original event
    const originalEvent = await this.prisma.event.findFirst({
      where: {
        AND: [{ eventId: eventId }, accessibleBy(ability, 'read').Event],
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
      const updateData: Prisma.EventUpdateInput = {};
      if (dto.startDate) updateData.startDate = dto.startDate;
      if (dto.endDate) updateData.endDate = dto.endDate;

      await this.prisma.event.update({
        where: { eventId: duplicatedEvent.eventId },
        data: updateData,
      });
    }

    if (originalEvent.type === 'TRAINING' && originalEvent.training?.workout) {
      const originalWorkout = await this.prisma.workout.findUnique({
        where: { eventTrainingId: originalEvent.training.eventTrainingId },
        include: {
          steps: {
            include: {
              targets: true,
              repeatBlock: {
                include: {
                  childSteps: {
                    include: { targets: true },
                  },
                },
              },
            },
            orderBy: { orderIndex: 'asc' },
          },
        },
      });

      if (originalWorkout) {
        const duplicatedEventWithIncludes = await this.prisma.event.findUnique({
          where: { eventId: duplicatedEvent.eventId },
          include: EVENT_INCLUDES,
        });

        if (duplicatedEventWithIncludes?.training) {
          const originalDto = mapPrismaWorkoutToDto(originalWorkout);
          await this.prisma.workout.create({
            data: {
              eventTrainingId:
                duplicatedEventWithIncludes.training.eventTrainingId,
              ...mapWorkoutDtoToPrisma({ steps: originalDto.steps }),
            },
          });
        }
      }
    }

    // Get the final duplicated event with updated dates
    const finalDuplicatedEvent = await this.prisma.event.findUnique({
      where: { eventId: duplicatedEvent.eventId },
      include: EVENT_INCLUDES,
    });

    // Schedule training load estimation for future training events
    if (
      originalEvent.type === 'TRAINING' &&
      finalDuplicatedEvent?.training &&
      finalDuplicatedEvent.startDate > startOfDay(new Date()) &&
      this.trainingLoadEstimationService
    ) {
      this.trainingLoadEstimationService
        .scheduleEstimation(
          duplicatedEvent.eventId,
          finalDuplicatedEvent.training.eventTrainingId,
          originalEvent.athleteId!,
        )
        .catch((error) => {
          // Log but don't fail the request
          this.logger.error(
            `Failed to schedule training load estimation: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error.stack : undefined,
          );
        });
    }

    // Notify websocket for training load reload (same as updateEvent)
    if (originalEvent.type === 'TRAINING' && originalEvent.athleteId) {
      this.calendarWebSocketService?.notifyWeeklyLoadUpdated(
        originalEvent.athleteId,
        {
          eventId: duplicatedEvent.eventId,
          reason: 'event_updated',
        },
      );
    }

    return this.getEventById(user, duplicatedEvent.eventId);
  }

  // ============================================================================
  // Workout-specific methods (delegated to WorkoutService)
  // ============================================================================

  /**
   * Reorder workout steps for a training event
   */
  async reorderWorkoutSteps(
    user: AuthUser,
    eventId: Event['eventId'],
    data: ReorderWorkoutStepsDto,
  ) {
    return this.workoutService.reorderWorkoutSteps(user, eventId, data);
  }

  /**
   * Duplicate workout from one training to another
   */
  async duplicateWorkout(
    user: AuthUser,
    sourceEventId: Event['eventId'],
    data: DuplicateWorkoutDto,
  ) {
    return this.workoutService.duplicateWorkout(user, sourceEventId, data);
  }

  /**
   * Check if an event is validated based on athlete settings
   */
  private async isEventValidated(
    event: Event & {
      competition: EventCompetition | null;
      training: EventTraining | null;
      note: EventNote | null;
      activity: Omit<EventActivity, 'stream' | 'recordsVersion'> | null;
    },
  ): Promise<boolean> {
    if (!event.athleteId) return true; // No athlete, consider validated

    // Get athlete settings
    const settings = await this.prisma.athleteSettings.findUnique({
      where: { athleteId: event.athleteId },
    });

    // If no settings, consider validated
    if (!settings || (!settings.requireRpe && !settings.requireComment)) {
      return true;
    }

    // For ACTIVITY events, check RPE and comment
    if (event.type === EVENT_TYPE.ACTIVITY && event.activity) {
      const hasRpe =
        event.activity.rpe !== null && event.activity.rpe !== undefined;
      const hasComment =
        event.activity.description !== null &&
        event.activity.description !== undefined &&
        event.activity.description.trim() !== '';

      if (settings.requireRpe && !hasRpe) return false;
      if (settings.requireComment && !hasComment) return false;

      return true;
    }

    // For TRAINING events, check related activity
    if (
      event.type === EVENT_TYPE.TRAINING &&
      event.training?.relatedActivityId
    ) {
      const relatedActivity = await this.prisma.eventActivity.findUnique({
        where: { eventActivityId: event.training.relatedActivityId },
      });

      if (!relatedActivity) return false;

      const hasRpe =
        relatedActivity.rpe !== null && relatedActivity.rpe !== undefined;
      const hasComment =
        relatedActivity.description !== null &&
        relatedActivity.description !== undefined &&
        relatedActivity.description.trim() !== '';

      if (settings.requireRpe && !hasRpe) return false;
      if (settings.requireComment && !hasComment) return false;

      return true;
    }

    // For COMPETITION events, check related activity
    if (
      event.type === EVENT_TYPE.COMPETITION &&
      event.competition?.relatedActivityId
    ) {
      const relatedActivity = await this.prisma.eventActivity.findUnique({
        where: { eventActivityId: event.competition.relatedActivityId },
      });

      if (!relatedActivity) return false;

      const hasRpe =
        relatedActivity.rpe !== null && relatedActivity.rpe !== undefined;
      const hasComment =
        relatedActivity.description !== null &&
        relatedActivity.description !== undefined &&
        relatedActivity.description.trim() !== '';

      if (settings.requireRpe && !hasRpe) return false;
      if (settings.requireComment && !hasComment) return false;

      return true;
    }

    // For TRAINING and COMPETITION without related activity, they are not validated
    if (
      (event.type === EVENT_TYPE.TRAINING ||
        event.type === EVENT_TYPE.COMPETITION) &&
      !event.training?.relatedActivityId &&
      !event.competition?.relatedActivityId
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
      where: { athleteId: athleteId },
    });
    if (!athlete) throw new NotFoundException('Athlete not found');
    if (!ability.can('read', subject('Athlete', athlete))) {
      throw new ForbiddenException('Not allowed to access this athlete');
    }

    // Build date filter if dates are provided
    const dateFilter =
      startDate && endDate
        ? {
            OR: [
              {
                startDate: {
                  gte: startDate,
                  lte: endDate,
                },
              },
              {
                endDate: {
                  gte: startDate,
                  lte: endDate,
                },
              },
              {
                AND: [
                  { startDate: { lte: startDate } },
                  { endDate: { gte: endDate } },
                ],
              },
            ],
          }
        : {};

    // Get all events for the athlete
    const events = await this.prisma.event.findMany({
      where: {
        AND: [
          accessibleBy(ability, 'read').Event,
          {
            athleteId: athleteId,
            type: {
              in: [EVENT_TYPE.ACTIVITY],
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

    return unvalidatedEvents.map((e) => this.prismaEventToEvent(e));
  }
}
