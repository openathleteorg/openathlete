import {
  Inject,
  Injectable,
  Logger,
  Optional,
  forwardRef,
} from '@nestjs/common';

import { EventTemplate } from '@openathlete/database';
import { CreateEventTemplateDto, Event, startOfDay } from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { CalendarWebSocketService } from 'src/modules/calendar/services/calendar-websocket.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { TrainingLoadEstimationService } from '../../queue/services/training-load-estimation.service';
import { EVENT_INCLUDES, EventService } from './event.service';

@Injectable()
export class EventTemplateService {
  private readonly logger = new Logger(EventTemplateService.name);

  constructor(
    private prisma: PrismaService,
    private eventService: EventService,
    @Optional()
    @Inject(forwardRef(() => TrainingLoadEstimationService))
    private trainingLoadEstimationService?: TrainingLoadEstimationService,
    @Optional()
    private readonly calendarWebSocketService?: CalendarWebSocketService,
  ) {}

  async getMyEventTemplates(user: AuthUser, search?: string) {
    const templates = await this.prisma.eventTemplate.findMany({
      where: {
        userId: user.userId,
        ...(search && {
          event: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        }),
      },
      include: {
        event: {
          include: EVENT_INCLUDES,
        },
        folder: true,
      },
    });
    return templates.map((t) => ({
      ...t,
      event: this.eventService.prismaEventToEvent(t.event),
    }));
  }

  async createEventTemplate(user: AuthUser, body: CreateEventTemplateDto) {
    const event = await this.eventService.duplicateEvent(user, body.eventId);

    await this.prisma.event.update({
      where: {
        eventId: event.eventId,
      },
      data: {
        athlete: {
          disconnect: true,
        },
      },
    });

    if (event.type === 'TRAINING') {
      await this.prisma.eventTraining.update({
        where: {
          eventId: event.eventId,
        },
        data: {
          estimatedLoad: null,
        },
      });
    }

    // Retrieve the duplicated event with includes to check for training
    const eventWithIncludes = await this.prisma.event.findUnique({
      where: { eventId: event.eventId },
      include: EVENT_INCLUDES,
    });

    // If training event, check and duplicate associated workout as template
    if (event.type === 'TRAINING' && eventWithIncludes?.training) {
      const originalWorkout = await this.prisma.workout.findUnique({
        where: {
          eventTrainingId: (
            await this.prisma.eventTraining.findUnique({
              where: { eventId: body.eventId },
            })
          )?.eventTrainingId,
        },
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
        // Duplicate workout to the template training
        await this.prisma.workout.create({
          data: {
            eventTrainingId: eventWithIncludes.training.eventTrainingId,
            steps: {
              create: originalWorkout.steps.map((step) => ({
                orderIndex: step.orderIndex,
                stepType: step.stepType,
                name: step.name,
                notes: step.notes,
                durationType: step.durationType,
                durationValue: step.durationValue,
                durationTarget: step.durationTarget,
                targets: {
                  create: step.targets.map((t) => ({
                    targetType: t.targetType,
                    targetMin: t.targetMin,
                    targetMax: t.targetMax,
                    targetValue: t.targetValue,
                  })),
                },
                repeatBlock: step.repeatBlock
                  ? {
                      create: {
                        repetitions: step.repeatBlock.repetitions,
                        childSteps: {
                          create: step.repeatBlock.childSteps.map(
                            (childStep) => ({
                              orderIndex: childStep.orderIndex,
                              stepType: childStep.stepType,
                              name: childStep.name,
                              notes: childStep.notes,
                              durationType: childStep.durationType,
                              durationValue: childStep.durationValue,
                              durationTarget: childStep.durationTarget,
                              targets: {
                                create: childStep.targets.map((t) => ({
                                  targetType: t.targetType,
                                  targetMin: t.targetMin,
                                  targetMax: t.targetMax,
                                  targetValue: t.targetValue,
                                })),
                              },
                            }),
                          ),
                        },
                      },
                    }
                  : undefined,
              })),
            },
          },
        });
      }
    }

    const eventTemplate = await this.prisma.eventTemplate.create({
      data: {
        userId: user.userId,
        eventId: event.eventId,
        folderId: body.folderId,
      },
    });

    return eventTemplate;
  }

  async deleteEventTemplate(
    user: AuthUser,
    eventTemplateId: EventTemplate['eventTemplateId'],
  ) {
    const eventTemplate = await this.prisma.eventTemplate.findUnique({
      where: {
        eventTemplateId: eventTemplateId,
      },
    });

    if (!eventTemplate) {
      throw new Error('Event template not found');
    }

    if (eventTemplate.userId !== user.userId) {
      throw new Error('Unauthorized');
    }

    await this.prisma.eventTemplate.delete({
      where: {
        eventTemplateId: eventTemplateId,
      },
    });
  }

  async updateEventTemplate(
    user: AuthUser,
    eventTemplateId: EventTemplate['eventTemplateId'],
    data: { folderId?: number | null },
  ) {
    const eventTemplate = await this.prisma.eventTemplate.findUnique({
      where: {
        eventTemplateId: eventTemplateId,
      },
    });

    if (!eventTemplate) {
      throw new Error('Event template not found');
    }

    if (eventTemplate.userId !== user.userId) {
      throw new Error('Unauthorized');
    }

    const updated = await this.prisma.eventTemplate.update({
      where: {
        eventTemplateId: eventTemplateId,
      },
      data: {
        folderId: data.folderId,
      },
      include: {
        event: {
          include: EVENT_INCLUDES,
        },
        folder: true,
      },
    });

    return {
      ...updated,
      event: this.eventService.prismaEventToEvent(updated.event),
    };
  }

  /**
   * Create an event from a template with specific dates and athlete
   * POST /api/event-template/:templateId/use
   */
  async useEventTemplate(
    user: AuthUser,
    eventTemplateId: EventTemplate['eventTemplateId'],
    dto: { startDate: Date; endDate: Date; athleteId?: number | null },
  ) {
    // Get the template
    const template = await this.prisma.eventTemplate.findUnique({
      where: {
        eventTemplateId: eventTemplateId,
      },
      include: {
        event: {
          include: EVENT_INCLUDES,
        },
      },
    });

    if (!template) {
      throw new Error('Event template not found');
    }

    if (template.userId !== user.userId) {
      throw new Error('Unauthorized');
    }

    if (!template.event) {
      throw new Error('Template event not found');
    }

    const templateEvent = template.event;

    // Prepare the event data from template
    const subEntityData: Record<string, unknown> = {
      ...templateEvent[
        templateEvent.type.toLocaleLowerCase() as Lowercase<Event['type']>
      ],
    };

    // Remove IDs and relations
    delete subEntityData.eventTrainingId;
    delete subEntityData.eventCompetitionId;
    delete subEntityData.eventNoteId;
    delete subEntityData.eventActivityId;
    delete subEntityData.eventId;
    delete subEntityData.relatedActivityId;
    delete subEntityData.relatedActivity;

    // Remove workout and estimatedLoad - will be duplicated/calculated separately
    if (templateEvent.type === 'TRAINING') {
      delete subEntityData.workout;
      delete subEntityData.estimatedLoad; // Don't copy estimatedLoad from template
    }

    // Create the new event from template
    const newEvent = await this.prisma.event.create({
      data: {
        startDate: dto.startDate,
        endDate: dto.endDate,
        name: templateEvent.name,
        type: templateEvent.type,
        athleteId: dto.athleteId,
        [templateEvent.type.toLocaleLowerCase()]: {
          create: subEntityData,
        },
      },
      include: EVENT_INCLUDES,
    });

    // If training event with workout, duplicate the workout
    if (templateEvent.type === 'TRAINING' && templateEvent.training?.workout) {
      const templateWorkout = await this.prisma.workout.findUnique({
        where: { eventTrainingId: templateEvent.training.eventTrainingId },
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

      if (templateWorkout && newEvent.training) {
        const createdWorkout = await this.prisma.workout.create({
          data: {
            eventTrainingId: newEvent.training.eventTrainingId,
            steps: {
              create: templateWorkout.steps.map((step) => ({
                orderIndex: step.orderIndex,
                stepType: step.stepType,
                name: step.name,
                notes: step.notes,
                durationType: step.durationType,
                durationValue: step.durationValue,
                durationTarget: step.durationTarget,
                targets: {
                  create: step.targets.map((t) => ({
                    targetType: t.targetType,
                    targetMin: t.targetMin,
                    targetMax: t.targetMax,
                    targetValue: t.targetValue,
                  })),
                },
                repeatBlock: step.repeatBlock
                  ? {
                      create: {
                        repetitions: step.repeatBlock.repetitions,
                        childSteps: {
                          create: step.repeatBlock.childSteps.map(
                            (childStep) => ({
                              orderIndex: childStep.orderIndex,
                              stepType: childStep.stepType,
                              name: childStep.name,
                              notes: childStep.notes,
                              durationType: childStep.durationType,
                              durationValue: childStep.durationValue,
                              durationTarget: childStep.durationTarget,
                              targets: {
                                create: childStep.targets.map((t) => ({
                                  targetType: t.targetType,
                                  targetMin: t.targetMin,
                                  targetMax: t.targetMax,
                                  targetValue: t.targetValue,
                                })),
                              },
                            }),
                          ),
                        },
                      },
                    }
                  : undefined,
              })),
            },
          },
        });

        // Emit event for workout export sync if within 7 days
        if (newEvent.athleteId && newEvent.training) {
          this.eventService.emitWorkoutPlannedChanged(
            newEvent.eventId,
            newEvent.athleteId,
            createdWorkout.workoutId,
            newEvent.startDate,
            newEvent.training.sport,
          );
        }
      }
    }

    // Schedule training load estimation for future training events
    if (
      newEvent.type === 'TRAINING' &&
      newEvent.training &&
      newEvent.startDate > startOfDay(new Date()) &&
      this.trainingLoadEstimationService &&
      newEvent.athleteId
    ) {
      this.trainingLoadEstimationService
        .scheduleEstimation(
          newEvent.eventId,
          newEvent.training.eventTrainingId,
          newEvent.athleteId,
        )
        .catch((error) => {
          // Log but don't fail the request
          this.logger.error(
            `Failed to schedule training load estimation: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error.stack : undefined,
          );
        });
    }

    // Return the complete event
    return this.eventService.getEventById(user, newEvent.eventId);
  }
}
