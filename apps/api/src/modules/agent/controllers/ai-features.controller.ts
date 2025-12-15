import { ZodValidationPipe } from 'nestjs-zod';

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import {
  CreateWorkoutStepDto,
  EVENT_TYPE,
  GenerateEventDto,
  GenerateEventResponseDto,
  ModifyEventDto,
  ModifyEventResponseDto,
  UpdateEventDto,
  generateEventDtoSchema,
  modifyEventDtoSchema,
} from '@openathlete/shared';
import { FeatureName } from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { FeatureAccessGuard, RequireFeature } from 'src/modules/subscription';

import { EventGenerationService } from '../services/event-generation.service';
import { EventModificationService } from '../services/event-modification.service';

@Controller('agent/ai')
export class AIFeaturesController {
  constructor(
    private readonly eventGenerationService: EventGenerationService,
    private readonly eventModificationService: EventModificationService,
  ) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard, FeatureAccessGuard)
  @RequireFeature(FeatureName.AI_GENERATION)
  @Post('events/generate')
  async generateEvent(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(generateEventDtoSchema)) dto: GenerateEventDto,
  ): Promise<GenerateEventResponseDto> {
    const athleteId = user.athlete?.athlete_id || user.user_id;

    const parsedDate = new Date(dto.date);
    const year = parsedDate.getFullYear();
    const month = parsedDate.getMonth();
    const day = parsedDate.getDate();
    const eventDate = new Date(year, month, day, 0, 0, 0, 0);

    const generatedEvent =
      await this.eventGenerationService.generateTrainingEvent(
        dto.prompt,
        eventDate,
        athleteId,
      );

    const startDate = new Date(year, month, day, 8, 0, 0, 0);

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
              targets: (step.targets || []).map((target) => ({
                targetType: target.targetType,
                targetMin: target.targetMin ?? null,
                targetMax: target.targetMax ?? null,
                targetValue: target.targetValue ?? null,
                metricType: target.metricType ?? null,
              })),
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
                      targets: (childStep.targets || []).map((target) => ({
                        targetType: target.targetType,
                        targetMin: target.targetMin ?? null,
                        targetMax: target.targetMax ?? null,
                        targetValue: target.targetValue ?? null,
                        metricType: target.metricType ?? null,
                      })),
                    }),
                  ),
                },
              } as CreateWorkoutStepDto;
            }

            return baseStep;
          }),
        }
      : undefined;

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

  @UseGuards(AuthGuard('jwt'), UserTypeGuard, FeatureAccessGuard)
  @RequireFeature(FeatureName.AI_GENERATION)
  @Post('events/modify')
  async modifyEvent(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(modifyEventDtoSchema)) dto: ModifyEventDto,
  ): Promise<ModifyEventResponseDto> {
    const athleteId = user.athlete?.athlete_id || user.user_id;

    const modifiedEvent =
      await this.eventModificationService.modifyTrainingEvent(
        dto.prompt,
        athleteId,
        dto.eventData,
      );

    const startDate = new Date(modifiedEvent.startDate);
    const endDate = new Date(modifiedEvent.endDate);

    const transformedWorkout = modifiedEvent.workout
      ? {
          steps: modifiedEvent.workout.steps.map((step) => {
            const baseStep: CreateWorkoutStepDto = {
              stepType: step.stepType,
              name: step.name ?? null,
              durationType: step.durationType ?? null,
              durationValue: step.durationValue ?? null,
              notes: step.notes ?? null,
              targets: (step.targets || []).map((target) => ({
                targetType: target.targetType,
                targetMin: target.targetMin ?? null,
                targetMax: target.targetMax ?? null,
                targetValue: target.targetValue ?? null,
                metricType: target.metricType ?? null,
              })),
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
                      targets: (childStep.targets || []).map((target) => ({
                        targetType: target.targetType,
                        targetMin: target.targetMin ?? null,
                        targetMax: target.targetMax ?? null,
                        targetValue: target.targetValue ?? null,
                        metricType: target.metricType ?? null,
                      })),
                    }),
                  ),
                },
              } as CreateWorkoutStepDto;
            }
            return baseStep;
          }),
        }
      : modifiedEvent.workout === null
        ? null
        : undefined;

    const result: ModifyEventResponseDto = {
      type: EVENT_TYPE.TRAINING,
      name: modifiedEvent.name,
      description: modifiedEvent.description || '',
      startDate,
      endDate,
      sport: modifiedEvent.sport,
      goalDuration: modifiedEvent.goalDuration ?? undefined,
      goalDistance: modifiedEvent.goalDistance ?? undefined,
      goalElevationGain: modifiedEvent.goalElevationGain ?? undefined,
      goalRpe: modifiedEvent.goalRpe ?? undefined,
      ...(transformedWorkout ? { workout: transformedWorkout } : {}),
    } as UpdateEventDto;

    return result;
  }
}
