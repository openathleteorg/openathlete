import { ZodValidationPipe } from 'nestjs-zod';

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import {
  CreateWorkoutStepDto,
  GenerateEventDto,
  GenerateEventResponseDto,
  generateEventDtoSchema,
} from '@openathlete/shared';
import { EVENT_TYPE } from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { EventGenerationService } from '../services/event-generation.service';

@Controller('agent/ai')
export class AIFeaturesController {
  constructor(
    private readonly eventGenerationService: EventGenerationService,
  ) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Post('events/generate')
  async generateEvent(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(generateEventDtoSchema)) dto: GenerateEventDto,
  ): Promise<GenerateEventResponseDto> {
    const athleteId = user.athlete?.athlete_id || user.user_id;

    // Generate training event
    const generatedEvent =
      await this.eventGenerationService.generateTrainingEvent(
        dto.prompt,
        new Date(dto.date),
        athleteId,
      );

    // Convert to CreateEventDto format
    const eventDate = new Date(dto.date);
    const startDate = new Date(eventDate);
    startDate.setHours(8, 0, 0, 0);

    const endDate = new Date(startDate);
    if (generatedEvent.goalDuration) {
      endDate.setSeconds(endDate.getSeconds() + generatedEvent.goalDuration);
    } else {
      endDate.setHours(9, 0, 0, 0); // Default 1 hour
    }

    const transformedWorkout = generatedEvent.workout
      ? {
          steps: generatedEvent.workout.steps.map((step) => {
            const baseStep: CreateWorkoutStepDto = {
              stepType: step.stepType,
              name: step.name ?? null,
              durationType: step.durationType ?? null,
              durationValue: step.durationValue ?? null,
              notes: step.notes ?? null,
              targets: [], // Empty targets for now - can be extended later
            };

            if (step.repeatBlock) {
              return {
                ...baseStep,
                repeatBlock: {
                  repetitions: step.repeatBlock.repetitions,
                  childSteps: step.repeatBlock.childSteps.map(
                    (childStep): CreateWorkoutStepDto => ({
                      stepType: childStep.stepType,
                      name: childStep.name ?? null,
                      durationType: childStep.durationType ?? null,
                      durationValue: childStep.durationValue ?? null,
                      notes: childStep.notes ?? null,
                      targets: [], // Empty targets for now
                    }),
                  ),
                },
              } as CreateWorkoutStepDto;
            }

            return baseStep;
          }),
        }
      : undefined;

    // Build result
    const result: GenerateEventResponseDto = {
      type: EVENT_TYPE.TRAINING,
      name: generatedEvent.name,
      description: generatedEvent.description || '',
      startDate,
      endDate,
      sport: generatedEvent.sport,
      goalDuration: generatedEvent.goalDuration,
      athleteId,
      ...(transformedWorkout ? { workout: transformedWorkout } : {}),
    };

    return result;
  }
}
