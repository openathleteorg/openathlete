import { subject } from '@casl/ability';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EventTemplate, Event as PrismaEvent } from '@openathlete/database';
import { CreateEventTemplateDto, Event, startOfDay } from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import {
  libraryWhere,
  requireLibrary,
  requireLibraryItem,
} from '../helpers/template-library';
import { remapZonesForAthlete } from '../helpers/workout-zones';
import { EVENT_INCLUDES } from './event-includes';
import { EventService } from './event.service';

@Injectable()
export class EventTemplateService {
  constructor(
    private readonly prisma: PrismaService,
    private eventService: EventService,
    private readonly abilities: CaslAbilityFactory,
  ) {}

  async getMyEventTemplates(
    user: AuthUser,
    search?: string,
    clubId: number | null = null,
  ) {
    await requireLibrary(this.prisma, user.userId, clubId, 'use');
    const templates = await this.prisma.eventTemplate.findMany({
      where: {
        ...libraryWhere(user.userId, clubId),
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

  /** A folder of the same library, or a 400: never another one's */
  private async assertFolderIn(
    folderId: number | null | undefined,
    userId: number,
    clubId: number | null,
  ) {
    if (folderId === null || folderId === undefined) return;
    const folder = await this.prisma.eventTemplateFolder.findFirst({
      where: {
        eventTemplateFolderId: folderId,
        ...libraryWhere(userId, clubId),
      },
      select: { eventTemplateFolderId: true },
    });
    if (!folder) {
      throw new BadRequestException('The folder is not in this library');
    }
  }

  async createEventTemplate(user: AuthUser, body: CreateEventTemplateDto) {
    const clubId = body.clubId ?? null;
    await requireLibrary(this.prisma, user.userId, clubId, 'edit');
    await this.assertFolderIn(body.folderId, user.userId, clubId);
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
        clubId,
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

    await requireLibraryItem(this.prisma, user.userId, eventTemplate, 'edit');

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

    await requireLibraryItem(this.prisma, user.userId, eventTemplate, 'edit');
    await this.assertFolderIn(
      data.folderId,
      eventTemplate!.userId,
      eventTemplate!.clubId,
    );

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

    // The user's own templates, and those of the clubs they coach in
    await requireLibraryItem(this.prisma, user.userId, template, 'use');
    if (!template) throw new NotFoundException('Event template not found');

    if (!template.event) {
      throw new NotFoundException('Template event not found');
    }

    const templateEvent = template.event;

    // The template is the caller's; the calendar it goes into must be one
    // they may plan in, as for any new event. Checked before any write.
    const athleteId = dto.athleteId ?? user.athlete?.athleteId;
    if (!athleteId) {
      throw new BadRequestException('athleteId is required');
    }
    const ability = await this.abilities.getFor({ user });
    if (
      !ability.can('create', subject('Event', { athleteId } as PrismaEvent))
    ) {
      throw new ForbiddenException('You are not allowed to create this event');
    }

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
        athleteId,
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
        // The template keeps the zones of the session it was made from: the
        // athlete it is applied to gets their own equivalent zones
        const templateSteps = await remapZonesForAthlete(
          this.prisma,
          athleteId,
          newEvent.training.sport,
          templateWorkout.steps,
        );
        const createdWorkout = await this.prisma.workout.create({
          data: {
            eventTrainingId: newEvent.training.eventTrainingId,
            steps: {
              create: templateSteps.map((step) => ({
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

    // Compute training load or schedule AI estimation for created training events
    if (
      newEvent.type === 'TRAINING' &&
      newEvent.training &&
      newEvent.athleteId
    ) {
      const isFuture = newEvent.startDate > startOfDay(new Date());
      await this.eventService.computeAndApplyPlannedTrainingLoad(
        newEvent.eventId,
        newEvent.athleteId,
        newEvent.training.eventTrainingId,
        isFuture,
      );
    }

    // Return the complete event
    return this.eventService.getEventById(user, newEvent.eventId);
  }
}
