import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import {
  AiTask,
  CompressedActivityStream,
  EventWeatherSampleDto,
  SPORT_TYPE,
  TrainingZone,
  WorkoutDto,
} from '@openathlete/shared';

import { Language } from 'src/common/constants/languages.constant';
import { ActivityImportedEvent } from 'src/events';
import {
  activitySummaryAgent,
  activitySummaryOutputSchema,
} from 'src/mastra/agents';
import {
  buildMetricsContext,
  fetchAthleteMetrics,
  fetchAthleteZones,
  getLatestMetrics,
} from 'src/modules/agent/services/event-ai-helpers';
import { AiModelResolverService, AiService } from 'src/modules/ai';
import { isRetryableAiError } from 'src/modules/ai/ai.errors';
import { CalendarWebSocketService } from 'src/modules/calendar/services/calendar-websocket.service';
import { uncompressActivityStream } from 'src/modules/core/helpers/activity-stream';
import {
  analyseStream,
  buildActivitySummaryPrompt,
  summariseWeather,
} from 'src/modules/core/helpers/activity-summary-prompt';
import { EVENT_INCLUDES } from 'src/modules/core/services/event-includes';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import {
  buildTrainingZonesContext,
  describeWorkoutStructure,
} from 'src/modules/queue/utils/training-load-prompt.helpers';

const LANGUAGE_NAMES: Record<string, string> = {
  FR: 'French',
  EN: 'English',
  IT: 'Italian',
  ES: 'Spanish',
  PT_BR: 'Brazilian Portuguese',
  DE: 'German',
};

const RECENT_DAYS = 42;
const DAY_MS = 24 * 3600 * 1000;

/**
 * Writes what the AI reads in an activity once it is processed: the plan,
 * the streams, the conditions and the previous weeks, explained in a few
 * lines. Runs once per activity, on the athlete's or a coach's AI.
 */
@Injectable()
export class ActivitySummaryListener {
  private readonly logger = new Logger(ActivitySummaryListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiModelResolver: AiModelResolverService,
    private readonly aiService: AiService,
    private readonly calendarWebSocketService: CalendarWebSocketService,
  ) {}

  @OnEvent(ActivityImportedEvent.SLUG, { async: true })
  async handleActivityImport(event: ActivityImportedEvent) {
    const { eventActivityId, bulkImport } = event.payload;
    // A history import would spend a call per old activity nobody reads
    if (bulkImport) return;

    try {
      const activity = await this.prisma.eventActivity.findUnique({
        where: { eventActivityId },
        include: {
          event: {
            include: {
              athlete: { include: { user: { select: { language: true } } } },
            },
          },
          normalization: { include: { factors: true } },
          weather: true,
          feedbackQuestions: true,
          relatedTraining: {
            include: {
              event: { select: { name: true } },
              workout: EVENT_INCLUDES.training.include.workout,
            },
          },
          relatedCompetition: {
            include: { event: { select: { name: true } } },
          },
        },
      });
      const athleteId = activity?.event.athleteId;
      if (!activity || !athleteId) return;
      // Moving or rating the activity imports it again: one summary is enough
      if (activity.aiSummaryAt) return;

      const model = await this.aiModelResolver.tryResolveForAthlete(
        AiTask.ACTIVITY_SUMMARY,
        athleteId,
      );
      if (!model) return;

      const sport = activity.sport as SPORT_TYPE;
      const [metrics, zones, recent] = await Promise.all([
        fetchAthleteMetrics(this.prisma, athleteId),
        fetchAthleteZones(this.prisma, athleteId),
        this.prisma.eventActivity.aggregate({
          where: {
            sport: activity.sport,
            eventActivityId: { not: eventActivityId },
            event: {
              athleteId,
              startDate: {
                gte: new Date(
                  activity.event.startDate.getTime() - RECENT_DAYS * DAY_MS,
                ),
                lt: activity.event.startDate,
              },
            },
          },
          _count: true,
          _avg: { averageSpeed: true, averageHeartrate: true },
        }),
      ]);
      const { summary: zonesSummary, zoneLookup } = buildTrainingZonesContext(
        zones,
        activity.sport,
      );

      const training = activity.relatedTraining;
      const competition = activity.relatedCompetition;
      const stream = activity.stream
        ? uncompressActivityStream(
            activity.stream as unknown as CompressedActivityStream,
          )
        : null;

      const prompt = buildActivitySummaryPrompt({
        language:
          LANGUAGE_NAMES[
            activity.event.athlete?.user?.language ?? Language.FR
          ] ?? 'English',
        name: activity.event.name,
        sport,
        startDate: activity.event.startDate,
        distanceM: activity.distance,
        movingTimeSec: activity.movingTime,
        elapsedTimeSec: Math.round(
          (activity.event.endDate.getTime() -
            activity.event.startDate.getTime()) /
            1000,
        ),
        elevationGainM: activity.elevationGain,
        averageSpeed: activity.averageSpeed,
        averageGapSpeed: activity.averageGapSpeed,
        averageHeartrate: activity.averageHeartrate,
        maxHeartrate: activity.maxHeartrate,
        averageWatts: activity.averageWatts,
        normalizedWatts: activity.weightedAverageWatts,
        rpe: activity.rpe,
        feedback: activity.feedbackQuestions.flatMap((question) =>
          question.answerText
            ? [{ question: question.questionText, answer: question.answerText }]
            : [],
        ),
        plan: training
          ? {
              name: training.event.name,
              goalDurationSec: training.goalDuration,
              goalDistanceM: training.goalDistance,
              workout: describeWorkoutStructure(
                training.workout as unknown as WorkoutDto | null,
                zoneLookup,
                zones as unknown as TrainingZone[],
              ),
            }
          : competition
            ? {
                name: competition.event.name,
                goalDurationSec: competition.goalDuration,
                goalDistanceM: competition.goalDistance,
                workout: 'A race.',
              }
            : undefined,
        normalization: activity.normalization
          ? {
              normalizedSpeed: activity.normalization.averageNormalizedSpeed,
              factors: activity.normalization.factors.map((factor) => ({
                factor: factor.factor,
                seconds: factor.timeSeconds,
              })),
            }
          : undefined,
        weather: summariseWeather(
          activity.weather?.samples as unknown as
            EventWeatherSampleDto[] | undefined,
        ),
        stream: analyseStream(stream),
        recent: {
          count: recent._count,
          averageSpeed: recent._avg.averageSpeed ?? undefined,
          averageHeartrate: recent._avg.averageHeartrate ?? undefined,
        },
        athleteContext: [
          buildMetricsContext(getLatestMetrics(metrics)),
          zonesSummary,
        ].join('\n'),
      });

      const summary = await this.generate(prompt, model);
      await this.prisma.eventActivity.update({
        where: { eventActivityId },
        data: { aiSummary: summary, aiSummaryAt: new Date() },
      });
      this.calendarWebSocketService.notifyActivityProcessed(
        activity.eventId,
        athleteId,
      );
      this.logger.log(`Summarised activity ${eventActivityId}`);
    } catch (error) {
      this.logger.error(
        `Could not summarise activity ${eventActivityId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /** One retry for an answer that didn't fit the schema or a busy provider */
  private async generate(
    prompt: string,
    model: Parameters<AiService['generateObject']>[1],
  ) {
    try {
      return await this.aiService.generateObject(
        activitySummaryAgent,
        model,
        prompt,
        activitySummaryOutputSchema,
      );
    } catch (error) {
      if (!isRetryableAiError(error)) throw error;
      return this.aiService.generateObject(
        activitySummaryAgent,
        model,
        prompt,
        activitySummaryOutputSchema,
      );
    }
  }
}
