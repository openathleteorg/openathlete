import { Job, UnrecoverableError } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger, Optional, forwardRef } from '@nestjs/common';

import { MetricType, SportType } from '@openathlete/database';
import {
  AiTask,
  TrainingZone,
  mapPrismaWorkoutToDto,
} from '@openathlete/shared';

import {
  trimpEstimationAgent,
  trimpEstimationOutputSchema,
} from 'src/mastra/agents';
import { AiModelResolverService, AiService } from 'src/modules/ai';
import { isRetryableAiError } from 'src/modules/ai/ai.errors';
import {
  estimatePlannedSessionTrimp,
  estimatePlannedTrimp,
  getHeartRateProfile,
} from 'src/modules/core/helpers/training-load';

import {
  fetchAthleteMetrics,
  fetchAthleteZones,
  getLatestMetrics,
} from '../../agent/services/event-ai-helpers';
import { CalendarWebSocketService } from '../../calendar/services/calendar-websocket.service';
import { PrismaService } from '../../prisma/services/prisma.service';
import { TrainingLoadEstimationJobData } from '../services/training-load-estimation.service';
import {
  buildAthleteMetricsSummary,
  buildTrainingZonesContext,
  describeWorkoutStructure,
  fetchFewShotExamples,
  formatFewShotExamples,
  formatGoalSummary,
} from '../utils/training-load-prompt.helpers';

type EventForAiFallback = {
  name: string;
  training: {
    sport: SportType;
    goalDistance: number | null;
    goalDuration: number | null;
    goalElevationGain: number | null;
    goalRpe: number | null;
    workout: Parameters<typeof mapPrismaWorkoutToDto>[0] | null;
  };
  athlete: { user: { gender: string | null } } | null;
};

@Processor('training-load-estimation', {
  concurrency: 2, // Limits concurrent calls on users' AI keys
})
export class TrainingLoadEstimationProcessor extends WorkerHost {
  private readonly logger = new Logger(TrainingLoadEstimationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiModelResolver: AiModelResolverService,
    private readonly aiService: AiService,
    @Optional()
    @Inject(forwardRef(() => CalendarWebSocketService))
    private readonly calendarWebSocketService?: CalendarWebSocketService,
  ) {
    super();
  }

  async process(job: Job<TrainingLoadEstimationJobData>) {
    const { eventId, eventTrainingId, athleteId } = job.data;

    try {
      this.logger.log(
        `Processing training load estimation for event ${eventId} (training ${eventTrainingId})...`,
      );

      const event = await this.prisma.event.findUnique({
        where: { eventId },
        include: {
          training: {
            include: {
              workout: {
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
              },
            },
          },
          athlete: {
            include: {
              user: { select: { gender: true } },
              metrics: {
                where: {
                  type: { in: [MetricType.HR_MAX, MetricType.HR_REST] },
                },
                orderBy: { date: 'desc' },
              },
              trainingZones: { include: { values: true } },
            },
          },
        },
      });

      if (!event?.training || !event.athlete) {
        throw new Error(`Event ${eventId} or training data not found`);
      }

      const profile = getHeartRateProfile(
        event.athlete.metrics,
        event.athlete.user.gender,
      );

      const deterministicEstimate = estimatePlannedSessionTrimp({
        goalDuration: event.training.goalDuration,
        goalRpe: event.training.goalRpe,
        sport: event.training.sport,
        workout: event.training.workout,
        zones: event.athlete.trainingZones,
        profile,
      });

      if (deterministicEstimate) {
        await this.saveAndNotify(
          eventId,
          eventTrainingId,
          athleteId,
          deterministicEstimate.value,
          deterministicEstimate.method,
        );
        return {
          success: true,
          eventId,
          eventTrainingId,
          trimp: deterministicEstimate.value,
          method: deterministicEstimate.method,
        };
      }

      const aiEstimate = await this.estimateWithAi(
        {
          name: event.name,
          training: event.training,
          athlete: event.athlete,
        },
        athleteId,
      );
      if (aiEstimate != null) {
        await this.saveAndNotify(
          eventId,
          eventTrainingId,
          athleteId,
          aiEstimate,
          'AI_FALLBACK',
        );
        return {
          success: true,
          eventId,
          eventTrainingId,
          trimp: aiEstimate,
          method: 'AI_FALLBACK',
        };
      }

      // If AI was not available or could not estimate, fall back to duration and RPE if available.
      if (
        event.training.goalDuration &&
        event.training.goalRpe != null &&
        profile
      ) {
        const fallbackValue = estimatePlannedTrimp(
          event.training.goalDuration,
          event.training.goalRpe,
          profile,
        );
        if (fallbackValue != null) {
          await this.saveAndNotify(
            eventId,
            eventTrainingId,
            athleteId,
            fallbackValue,
            'DURATION_RPE',
          );
          return {
            success: true,
            eventId,
            eventTrainingId,
            trimp: fallbackValue,
            method: 'DURATION_RPE',
          };
        }
      }

      await this.clearUnavailableEstimate(eventId, eventTrainingId, athleteId);
      return {
        success: true,
        eventId,
        eventTrainingId,
        trimp: null,
        method: null,
      };
    } catch (error) {
      this.logger.error(
        `Failed to estimate training load for event ${eventId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      this.calendarWebSocketService?.notifyTrainingLoadEstimationFailed(
        eventId,
        athleteId,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  private async saveAndNotify(
    eventId: number,
    eventTrainingId: number,
    athleteId: number,
    value: number,
    method: string,
  ): Promise<void> {
    await this.prisma.eventTraining.update({
      where: { eventTrainingId },
      data: { estimatedLoad: value },
    });
    this.logger.log(
      `✨ Training load estimated for event ${eventId}: ${value} TRIMP (${method})`,
    );
    this.calendarWebSocketService?.notifyTrainingLoadEstimationCompleted(
      eventId,
      athleteId,
      value,
    );
  }

  private async clearUnavailableEstimate(
    eventId: number,
    eventTrainingId: number,
    athleteId: number,
  ): Promise<void> {
    await this.prisma.eventTraining.update({
      where: { eventTrainingId },
      data: { estimatedLoad: null },
    });
    this.calendarWebSocketService?.notifyTrainingLoadEstimationCompleted(
      eventId,
      athleteId,
      null,
    );
  }

  private async estimateWithAi(
    event: EventForAiFallback,
    athleteId: number,
  ): Promise<number | null> {
    const model = await this.aiModelResolver.tryResolveForAthlete(
      AiTask.TRAINING_LOAD_ESTIMATION,
      athleteId,
    );
    if (!model) return null;

    const [metrics, zones, fewShotExamples] = await Promise.all([
      fetchAthleteMetrics(this.prisma, athleteId),
      fetchAthleteZones(this.prisma, athleteId),
      fetchFewShotExamples(this.prisma, athleteId, event.training.sport, 3),
    ]);
    const latestMetrics = getLatestMetrics(metrics);
    const workout = event.training.workout
      ? mapPrismaWorkoutToDto(event.training.workout)
      : null;
    const { summary: trainingZonesSummary, zoneLookup } =
      buildTrainingZonesContext(zones, event.training.sport);
    const prompt = [
      'ATHLETE PROFILE:',
      buildAthleteMetricsSummary(latestMetrics),
      `Gender: ${event.athlete?.user?.gender ?? 'Unspecified'}`,
      '',
      'TRAINING ZONES:',
      trainingZonesSummary,
      '',
      formatFewShotExamples(
        fewShotExamples,
        zoneLookup,
        zones as unknown as TrainingZone[],
      ),
      'CURRENT SESSION TO ESTIMATE:',
      `Name: ${event.name}`,
      `Sport: ${event.training.sport}`,
      `Goals: ${formatGoalSummary(event.training)}`,
      '',
      'WORKOUT STRUCTURE:',
      describeWorkoutStructure(
        workout,
        zoneLookup,
        zones as unknown as TrainingZone[],
      ),
    ].join('\n');

    try {
      const result = await this.aiService.generateObject(
        trimpEstimationAgent,
        model,
        prompt,
        trimpEstimationOutputSchema,
      );
      return result.trimp;
    } catch (error) {
      if (!isRetryableAiError(error)) {
        throw new UnrecoverableError(
          error instanceof Error ? error.message : String(error),
        );
      }
      throw error;
    }
  }
}
