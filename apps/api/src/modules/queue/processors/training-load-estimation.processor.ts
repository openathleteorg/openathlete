import { Job, Queue } from 'bullmq';

import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger, Optional, forwardRef } from '@nestjs/common';

import { mapPrismaWorkoutToDto } from '@openathlete/shared';

import { trimpEstimationAgent } from 'src/mastra/agents/trimp-estimation.agent';

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
  formatGoalSummary,
} from '../utils/training-load-prompt.helpers';

interface TrimpEstimationResult {
  duration_min: number;
  hr_avg: number;
  delta: number;
  trimp_banister: number;
  assumptions: string[];
  confidence: number;
  explanation: string;
}

@Processor('training-load-estimation', {
  concurrency: 2, // Max 2 concurrent jobs to avoid OpenAI rate limits
})
export class TrainingLoadEstimationProcessor extends WorkerHost {
  private readonly logger = new Logger(TrainingLoadEstimationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('training-load-estimation')
    private readonly trainingLoadEstimationQueue: Queue<TrainingLoadEstimationJobData>,
    @Optional()
    @Inject(forwardRef(() => CalendarWebSocketService))
    private readonly calendarWebSocketService?: CalendarWebSocketService,
  ) {
    super();
  }

  async process(job: Job<TrainingLoadEstimationJobData>) {
    const { eventId, eventTrainingId, athleteId } = job.data;

    // Notify that estimation started
    if (this.calendarWebSocketService) {
      this.calendarWebSocketService.notifyTrainingLoadEstimationStarted(
        eventId,
        athleteId,
      );
    }

    try {
      this.logger.log(
        `Processing training load estimation for event ${eventId} (training ${eventTrainingId})...`,
      );

      // Fetch event with workout and athlete data
      const event = await this.prisma.event.findUnique({
        where: { event_id: eventId },
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
                            include: {
                              targets: true,
                            },
                            orderBy: {
                              order_index: 'asc',
                            },
                          },
                        },
                      },
                    },
                    orderBy: {
                      order_index: 'asc',
                    },
                  },
                },
              },
            },
          },
          athlete: {
            include: {
              user: {
                select: {
                  gender: true,
                },
              },
            },
          },
        },
      });

      if (!event || !event.training) {
        throw new Error(`Event ${eventId} or training data not found`);
      }

      if (!event.athlete_id) {
        throw new Error(`Event ${eventId} has no athlete_id`);
      }

      // Fetch athlete metrics and training zones
      const [metrics, zones] = await Promise.all([
        fetchAthleteMetrics(this.prisma, athleteId),
        fetchAthleteZones(this.prisma, athleteId),
      ]);

      const latestMetrics = getLatestMetrics(metrics);

      // Build workout DTO
      const workoutDto = event.training.workout
        ? mapPrismaWorkoutToDto(event.training.workout)
        : null;

      const athleteMetricsSummary = buildAthleteMetricsSummary(latestMetrics);
      const { summary: trainingZonesSummary, zoneLookup } =
        buildTrainingZonesContext(zones, event.training.sport);
      const goalSummary = formatGoalSummary(event.training);
      const workoutStructure = describeWorkoutStructure(workoutDto, zoneLookup);

      const prompt = [
        'ATHLETE PROFILE:',
        athleteMetricsSummary,
        `Gender: ${event.athlete?.user?.gender ?? 'Unspecified'}`,
        '',
        'TRAINING ZONES:',
        trainingZonesSummary,
        '',
        'SESSION OVERVIEW:',
        `Name: ${event.name}`,
        `Sport: ${event.training.sport}`,
        `Goals: ${goalSummary}`,
        '',
        'WORKOUT STRUCTURE:',
        workoutStructure,
      ].join('\n');

      const response = await trimpEstimationAgent.generate(prompt);

      if (!response.text) {
        throw new Error('Agent returned no response');
      }

      // Parse JSON response
      let result: TrimpEstimationResult;
      try {
        // Try to extract JSON from the response (might have markdown code blocks)
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]) as TrimpEstimationResult;
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        this.logger.error(
          `Failed to parse agent response: ${response.text}`,
          parseError instanceof Error ? parseError.stack : undefined,
        );
        throw new Error(
          `Failed to parse TRIMP estimation result: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        );
      }

      // Validate result
      if (
        typeof result.trimp_banister !== 'number' ||
        isNaN(result.trimp_banister)
      ) {
        throw new Error(
          `Invalid TRIMP value in result: ${result.trimp_banister}`,
        );
      }

      // Save estimated_load to event_training
      await this.prisma.event_training.update({
        where: { event_training_id: eventTrainingId },
        data: {
          estimated_load: result.trimp_banister,
        },
      });

      this.logger.log(
        `✓ Training load estimated for event ${eventId}: ${result.trimp_banister} TRIMP`,
      );

      // Notify that estimation completed
      if (this.calendarWebSocketService) {
        this.calendarWebSocketService.notifyTrainingLoadEstimationCompleted(
          eventId,
          athleteId,
          result.trimp_banister,
        );
      }

      return {
        success: true,
        eventId,
        eventTrainingId,
        trimpBanister: result.trimp_banister,
        confidence: result.confidence,
      };
    } catch (error) {
      this.logger.error(
        `Failed to estimate training load for event ${eventId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Notify that estimation failed
      if (this.calendarWebSocketService) {
        this.calendarWebSocketService.notifyTrainingLoadEstimationFailed(
          eventId,
          athleteId,
          error instanceof Error ? error.message : String(error),
        );
      }

      throw error;
    }
  }
}
