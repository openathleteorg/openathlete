import { Inject, Injectable, Optional, forwardRef } from '@nestjs/common';

import { event_template } from '@openathlete/database';
import {
  CreateEventTemplateDto,
  keysToCamel,
  startOfDay,
} from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { CalendarWebSocketService } from 'src/modules/calendar/services/calendar-websocket.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { TrainingLoadEstimationService } from '../../queue/services/training-load-estimation.service';
import { EVENT_INCLUDES, EventService } from './event.service';

@Injectable()
export class EventTemplateService {
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
    const templates = await this.prisma.event_template.findMany({
      where: {
        user_id: user.user_id,
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
    return templates.map((t) =>
      keysToCamel({
        ...t,
        event: this.eventService.prismaEventToEvent(t.event),
      }),
    );
  }

  async createEventTemplate(user: AuthUser, body: CreateEventTemplateDto) {
    const event = await this.eventService.duplicateEvent(user, body.eventId);

    await this.prisma.event.update({
      where: {
        event_id: event.event_id,
      },
      data: {
        athlete: {
          disconnect: true,
        },
      },
    });

    // Retrieve the duplicated event with includes to check for training
    const eventWithIncludes = await this.prisma.event.findUnique({
      where: { event_id: event.event_id },
      include: EVENT_INCLUDES,
    });

    // If training event, check and duplicate associated workout as template
    if (event.type === 'TRAINING' && eventWithIncludes?.training) {
      const originalWorkout = await this.prisma.workout.findUnique({
        where: {
          event_training_id: (
            await this.prisma.event_training.findUnique({
              where: { event_id: body.eventId },
            })
          )?.event_training_id,
        },
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
        // Duplicate workout to the template training
        await this.prisma.workout.create({
          data: {
            estimated_duration: originalWorkout.estimated_duration,
            total_distance: originalWorkout.total_distance,
            event_training_id: eventWithIncludes.training.event_training_id,
            steps: {
              create: originalWorkout.steps.map((step) => ({
                order_index: step.order_index,
                step_type: step.step_type,
                name: step.name,
                exercise_name: step.exercise_name,
                notes: step.notes,
                duration_type: step.duration_type,
                duration_value: step.duration_value,
                duration_target: step.duration_target,
                targets: {
                  create: step.targets.map((t) => ({
                    target_type: t.target_type,
                    target_min: t.target_min,
                    target_max: t.target_max,
                    target_value: t.target_value,
                    unit: t.unit,
                  })),
                },
                repeat_block: step.repeat_block
                  ? {
                      create: {
                        repetitions: step.repeat_block.repetitions,
                        child_steps: {
                          create: step.repeat_block.child_steps.map(
                            (childStep) => ({
                              order_index: childStep.order_index,
                              step_type: childStep.step_type,
                              name: childStep.name,
                              exercise_name: childStep.exercise_name,
                              notes: childStep.notes,
                              duration_type: childStep.duration_type,
                              duration_value: childStep.duration_value,
                              duration_target: childStep.duration_target,
                              targets: {
                                create: childStep.targets.map((t) => ({
                                  target_type: t.target_type,
                                  target_min: t.target_min,
                                  target_max: t.target_max,
                                  target_value: t.target_value,
                                  unit: t.unit,
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

    const eventTemplate = await this.prisma.event_template.create({
      data: {
        user_id: user.user_id,
        event_id: event.event_id,
        folder_id: body.folderId,
      },
    });

    return keysToCamel(eventTemplate);
  }

  async deleteEventTemplate(
    user: AuthUser,
    eventTemplateId: event_template['event_template_id'],
  ) {
    const eventTemplate = await this.prisma.event_template.findUnique({
      where: {
        event_template_id: eventTemplateId,
      },
    });

    if (!eventTemplate) {
      throw new Error('Event template not found');
    }

    if (eventTemplate.user_id !== user.user_id) {
      throw new Error('Unauthorized');
    }

    await this.prisma.event_template.delete({
      where: {
        event_template_id: eventTemplateId,
      },
    });
  }

  async updateEventTemplate(
    user: AuthUser,
    eventTemplateId: event_template['event_template_id'],
    data: { folderId?: number | null },
  ) {
    const eventTemplate = await this.prisma.event_template.findUnique({
      where: {
        event_template_id: eventTemplateId,
      },
    });

    if (!eventTemplate) {
      throw new Error('Event template not found');
    }

    if (eventTemplate.user_id !== user.user_id) {
      throw new Error('Unauthorized');
    }

    const updated = await this.prisma.event_template.update({
      where: {
        event_template_id: eventTemplateId,
      },
      data: {
        folder_id: data.folderId,
      },
      include: {
        event: {
          include: EVENT_INCLUDES,
        },
        folder: true,
      },
    });

    return keysToCamel({
      ...updated,
      event: this.eventService.prismaEventToEvent(updated.event),
    });
  }

  /**
   * Create an event from a template with specific dates and athlete
   * POST /api/event-template/:templateId/use
   */
  async useEventTemplate(
    user: AuthUser,
    eventTemplateId: event_template['event_template_id'],
    dto: { startDate: Date; endDate: Date; athleteId?: number | null },
  ) {
    // Get the template
    const template = await this.prisma.event_template.findUnique({
      where: {
        event_template_id: eventTemplateId,
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

    if (template.user_id !== user.user_id) {
      throw new Error('Unauthorized');
    }

    if (!template.event) {
      throw new Error('Template event not found');
    }

    const templateEvent = template.event;

    // Prepare the event data from template
    const subEntityData = {
      ...templateEvent[templateEvent.type.toLocaleLowerCase()],
    };

    // Remove IDs and relations
    delete subEntityData.event_training_id;
    delete subEntityData.event_competition_id;
    delete subEntityData.event_note_id;
    delete subEntityData.event_activity_id;
    delete subEntityData.event_id;
    delete subEntityData.related_activity_id;
    delete subEntityData.related_activity;

    // Remove workout - will be duplicated separately
    if (templateEvent.type === 'TRAINING') {
      delete subEntityData.workout;
    }

    // Create the new event from template
    const newEvent = await this.prisma.event.create({
      data: {
        start_date: dto.startDate,
        end_date: dto.endDate,
        name: templateEvent.name,
        type: templateEvent.type,
        athlete_id: dto.athleteId,
        [templateEvent.type.toLocaleLowerCase()]: {
          create: subEntityData,
        },
      },
      include: EVENT_INCLUDES,
    });

    // If training event with workout, duplicate the workout
    if (templateEvent.type === 'TRAINING' && templateEvent.training?.workout) {
      const templateWorkout = await this.prisma.workout.findUnique({
        where: { event_training_id: templateEvent.training.event_training_id },
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

      if (templateWorkout && newEvent.training) {
        const createdWorkout = await this.prisma.workout.create({
          data: {
            estimated_duration: templateWorkout.estimated_duration,
            total_distance: templateWorkout.total_distance,
            event_training_id: newEvent.training.event_training_id,
            steps: {
              create: templateWorkout.steps.map((step) => ({
                order_index: step.order_index,
                step_type: step.step_type,
                name: step.name,
                exercise_name: step.exercise_name,
                notes: step.notes,
                duration_type: step.duration_type,
                duration_value: step.duration_value,
                duration_target: step.duration_target,
                targets: {
                  create: step.targets.map((t) => ({
                    target_type: t.target_type,
                    target_min: t.target_min,
                    target_max: t.target_max,
                    target_value: t.target_value,
                    unit: t.unit,
                  })),
                },
                repeat_block: step.repeat_block
                  ? {
                      create: {
                        repetitions: step.repeat_block.repetitions,
                        child_steps: {
                          create: step.repeat_block.child_steps.map(
                            (childStep) => ({
                              order_index: childStep.order_index,
                              step_type: childStep.step_type,
                              name: childStep.name,
                              exercise_name: childStep.exercise_name,
                              notes: childStep.notes,
                              duration_type: childStep.duration_type,
                              duration_value: childStep.duration_value,
                              duration_target: childStep.duration_target,
                              targets: {
                                create: childStep.targets.map((t) => ({
                                  target_type: t.target_type,
                                  target_min: t.target_min,
                                  target_max: t.target_max,
                                  target_value: t.target_value,
                                  unit: t.unit,
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
        if (newEvent.athlete_id && newEvent.training) {
          this.eventService.emitWorkoutPlannedChanged(
            newEvent.event_id,
            newEvent.athlete_id,
            createdWorkout.workout_id,
            newEvent.start_date,
            newEvent.training.sport,
          );
        }
      }
    }

    // Schedule training load estimation for future training events
    if (
      newEvent.type === 'TRAINING' &&
      newEvent.training &&
      newEvent.start_date > startOfDay(new Date()) &&
      this.trainingLoadEstimationService &&
      newEvent.athlete_id
    ) {
      this.trainingLoadEstimationService
        .scheduleEstimation(
          newEvent.event_id,
          newEvent.training.event_training_id,
          newEvent.athlete_id,
        )
        .catch((error) => {
          // Log but don't fail the request
          console.error(
            `Failed to schedule training load estimation: ${error instanceof Error ? error.message : String(error)}`,
          );
        });
    }

    // Return the complete event
    return this.eventService.getEventById(user, newEvent.event_id);
  }
}
