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
  Logger,
  NotFoundException,
  Optional,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  ApiEnvSchemaType,
  CompressedActivityStream,
  CreateEventDto,
  DuplicateWorkoutDto,
  EVENT_TYPE,
  ReorderWorkoutStepsDto,
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
  HASH_PEPPER: Buffer | undefined;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService<ApiEnvSchemaType, true>,
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
  ) {
    this.HASH_PEPPER = this.configService.get('HASH_PEPPER')
      ? Buffer.from(this.configService.get('HASH_PEPPER'))
      : undefined;
  }

  public prismaEventToEvent(
    event: Event & {
      competition: EventCompetition | null;
      training: EventTraining | null;
      note: EventNote | null;
      activity:
        | (Omit<EventActivity, 'stream'> & {
            segments?: ActivitySegment[];
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
        subject('event', { athleteId: finalAthleteId } as Event),
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

    const { type, endDate, startDate, name, athleteId, ...rest } = data;

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

    // If RPE was updated on an activity, trigger training load recalculation (skip for templates)
    if (!isTemplate && isRpeUpdate && event.activity) {
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
            );
          } else if (description) {
            await this.messageService.createMessage(user, {
              messageThreadId: existingThread.messageThreadId,
              content: description,
            });
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

            await this.messageService.createMessage(user, {
              messageThreadId: thread.messageThreadId,
              content: description,
            });
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

    await this.prisma.providerWorkoutExport.deleteMany({
      where: {
        workout: {
          eventTrainingId: eventId,
        },
      },
    });
    await this.prisma.workout.deleteMany({
      where: { eventTrainingId: eventId },
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

    if (!weather) {
      throw new NotFoundException('Weather not found');
    }

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

    if (event.type === 'COMPETITION') {
      await this.prisma.eventCompetition.update({
        where: { eventId: eventId },
        data: { relatedActivity: { connect: { eventActivityId: activityId } } },
      });
    } else if (event.type === 'TRAINING') {
      await this.prisma.eventTraining.update({
        where: { eventId: eventId },
        data: { relatedActivity: { connect: { eventActivityId: activityId } } },
      });
    }
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

  async getIcalCalendar(base64Secret: string): Promise<string> {
    const secret = Buffer.from(base64Secret, 'base64').toString('utf-8');
    const users = await this.prisma.user.findMany({
      select: { userId: true, athlete: { select: { athleteId: true } } },
    });
    const user = await Promise.all(
      users.map(async (user) => {
        const isValid = await argon2.verify(secret, user.userId.toString(), {
          secret: this.HASH_PEPPER,
        });
        return isValid ? user : null;
      }),
    ).then((results) => results.find((user) => user !== null));

    if (!user || !user.athlete?.athleteId) {
      throw new UnauthorizedException();
    }

    const events = await this.prisma.event.findMany({
      where: {
        athleteId: user.athlete.athleteId,
        type: {
          not: EventType.ACTIVITY,
        },
      },
    });
    const calendar = ical({
      name: 'OpenAthlete',
      timezone: 'UTC',
      method: ICalCalendarMethod.PUBLISH,
    });
    events.forEach((event) => {
      const { startDate, endDate, name, type } = event;
      const eventType = type.toLowerCase();
      const eventData = {
        start: startDate,
        end: endDate,
        allDay: true,
        summary: name,
        description: `Type: ${eventType}`,
        uid: event.eventId,
      } as ICalEvent | ICalEventData;
      calendar.createEvent(eventData);
    });

    return calendar.toString();
  }

  async getMyIcalCalendarSecret(user: AuthUser): Promise<string> {
    const ability = await this.abilities.getFor({ user });

    const userEntity = await this.prisma.user.findFirst({
      where: {
        AND: [{ userId: user.userId }, accessibleBy(ability, 'read').User],
      },
      include: { athlete: true },
    });

    if (!userEntity?.athlete?.athleteId) {
      throw new NotFoundException('Athlete not found');
    }

    const hash = await argon2.hash(userEntity.userId.toString(), {
      secret: this.HASH_PEPPER,
    });

    return Buffer.from(hash).toString('base64');
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
      activity: Omit<EventActivity, 'stream'> | null;
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
    if (!ability.can('read', subject('athlete', athlete))) {
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
