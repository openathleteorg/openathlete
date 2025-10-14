import { Injectable } from '@nestjs/common';

import { event_template } from '@openathlete/database';
import { CreateEventTemplateDto, keysToCamel } from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { EVENT_INCLUDES, EventService } from './event.service';

@Injectable()
export class EventTemplateService {
  constructor(
    private prisma: PrismaService,
    private eventService: EventService,
  ) {}

  async getMyEventTemplates(user: AuthUser) {
    const templates = await this.prisma.event_template.findMany({
      where: {
        user_id: user.user_id,
      },
      include: {
        event: {
          include: EVENT_INCLUDES,
        },
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
                    target_zone: t.target_zone,
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
                                  target_zone: t.target_zone,
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
}
