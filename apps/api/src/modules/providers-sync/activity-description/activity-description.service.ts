import { isAxiosError } from 'axios';
import { UnrecoverableError } from 'bullmq';

import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';

import {
  ConnectorProvider,
  EventType,
  NormalizationFactor,
  RecordType,
  TrainingLoadCalculationType,
} from '@openathlete/database';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import {
  QueueService,
  StravaDescriptionJobData,
} from '../../queue/queue.service';
import {
  StravaProviderService,
  hasStravaWriteScope,
} from '../providers/strava.provider.service';
import {
  ActivityDescriptionFacts,
  PersonalBest,
  summarizeWeather,
} from './activity-description.facts';
import {
  mergeDescription,
  renderActivityDescription,
} from './activity-description.render';

const PB_DISTANCES_M = [42195, 21097.5, 10000, 5000, 1000];
const PB_POWER_DURATIONS_SEC = [3600, 1200, 300];
/**
 * A best among fewer efforts is no record: a new athlete's first activities
 * would all be personal bests
 */
const MIN_EARLIER_EFFORTS = 5;
/** Only fresh activities: an upload of an old one is not a moment to share */
const MAX_ACTIVITY_AGE_MS = 7 * 24 * 3600 * 1000;
/** Lets the training load, computed after processing, be ready */
export const AFTER_PROCESSING_DELAY_MS = 60_000;
/** The copy from another source may still be processing */
export const AFTER_DUPLICATE_DELAY_MS = 3 * 60_000;

export type DescriptionWriteResult =
  'written' | 'disabled' | 'nothing-to-say' | 'already-written';

/**
 * Writes OpenAthlete's analysis (weather, what the conditions cost, intensity,
 * records, comparisons) into the description of the athlete's new Strava
 * activities, after their own words.
 */
@Injectable()
export class ActivityDescriptionService {
  private readonly logger = new Logger(ActivityDescriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => QueueService))
    private readonly queueService: QueueService,
    @Inject(forwardRef(() => StravaProviderService))
    private readonly strava: StravaProviderService,
  ) {}

  async buildFacts(
    eventActivityId: number,
  ): Promise<ActivityDescriptionFacts | null> {
    const activity = await this.prisma.eventActivity.findUnique({
      where: { eventActivityId },
      select: {
        eventActivityId: true,
        sport: true,
        distance: true,
        movingTime: true,
        elevationGain: true,
        intensitySeconds: true,
        decouplingPercent: true,
        kilojoules: true,
        event: { select: { athleteId: true, startDate: true } },
        weather: { select: { samples: true } },
        normalization: {
          select: { factors: { select: { factor: true, timeSeconds: true } } },
        },
        trainingLoadEntries: {
          where: {
            calculation: {
              type: TrainingLoadCalculationType.TRIMP,
              isActive: true,
            },
          },
          select: { value: true },
          take: 1,
        },
      },
    });
    if (!activity?.event.athleteId) return null;

    const costOf = (factor: NormalizationFactor) =>
      activity.normalization?.factors.find((f) => f.factor === factor)
        ?.timeSeconds ?? 0;
    const intensity = activity.intensitySeconds;

    return {
      seed: activity.eventActivityId,
      sport: activity.sport,
      distanceM: activity.distance,
      movingTimeSec: activity.movingTime,
      elevationGainM: activity.elevationGain,
      weather: summarizeWeather(activity.weather?.samples),
      conditionCosts: activity.normalization
        ? {
            slopeSec: costOf(NormalizationFactor.SLOPE),
            temperatureSec: costOf(NormalizationFactor.TEMPERATURE),
            altitudeSec: costOf(NormalizationFactor.ALTITUDE),
          }
        : null,
      intensitySeconds:
        intensity.length === 3
          ? [intensity[0], intensity[1], intensity[2]]
          : null,
      decouplingPercent: activity.decouplingPercent,
      personalBests: await this.personalBests(
        activity.eventActivityId,
        activity.event.athleteId,
        activity.sport,
        activity.event.startDate,
      ),
      trimp: activity.trainingLoadEntries[0]?.value ?? null,
      kilojoules: activity.kilojoules,
    };
  }

  /** The activity's records that beat every earlier one in the same sport */
  private async personalBests(
    eventActivityId: number,
    athleteId: number,
    sport: ActivityDescriptionFacts['sport'],
    startDate: Date,
  ): Promise<PersonalBest[]> {
    const records = await this.prisma.record.findMany({
      where: {
        eventActivityId,
        OR: [
          { type: RecordType.SPEED, distance: { in: PB_DISTANCES_M } },
          {
            type: RecordType.POWER,
            duration: { in: PB_POWER_DURATIONS_SEC },
          },
        ],
      },
      select: { type: true, distance: true, duration: true, value: true },
    });

    const bests: PersonalBest[] = [];
    for (const record of records) {
      const earlier = await this.prisma.record.aggregate({
        where: {
          athleteId,
          type: record.type,
          distance: record.distance,
          duration: record.duration,
          date: { lt: startDate },
          eventActivity: { sport },
        },
        _max: { value: true },
        _count: true,
      });
      const previous = earlier._max.value;
      if (
        earlier._count < MIN_EARLIER_EFFORTS ||
        previous === null ||
        record.value <= previous
      ) {
        continue;
      }
      if (record.type === RecordType.SPEED && record.distance) {
        bests.push({
          kind: 'distance',
          distanceM: record.distance,
          timeSec: record.distance / record.value,
        });
      } else if (record.type === RecordType.POWER && record.duration) {
        bests.push({
          kind: 'power',
          durationSec: record.duration,
          watts: record.value,
        });
      }
    }
    // The longest effort is the proudest
    return bests.sort(
      (a, b) =>
        (b.kind === 'distance' ? b.distanceM : b.durationSec) -
        (a.kind === 'distance' ? a.distanceM : a.durationSec),
    );
  }

  /**
   * Queues the description of a Strava activity when the athlete wants it.
   * `eventActivityId` is the saved activity it reads, which may come from
   * another source when the Strava copy was skipped as a duplicate.
   */
  async schedule(params: {
    athleteId: number;
    stravaActivityId: string;
    eventActivityId: number;
    startDate: Date;
    delayMs: number;
  }): Promise<boolean> {
    if (Date.now() - params.startDate.getTime() > MAX_ACTIVITY_AGE_MS) {
      return false;
    }
    const account = await this.prisma.providerAccount.findFirst({
      where: {
        athleteId: params.athleteId,
        provider: ConnectorProvider.STRAVA,
        status: 'active',
        activityDescriptionEnabled: true,
      },
      select: { providerAccountId: true, scopes: true },
    });
    if (!account || !hasStravaWriteScope(account.scopes)) return false;

    await this.queueService.addStravaDescriptionJob(
      {
        providerAccountId: account.providerAccountId,
        stravaActivityId: params.stravaActivityId,
        eventActivityId: params.eventActivityId,
      },
      params.delayMs,
    );
    return true;
  }

  /** After a Strava activity was imported and processed */
  async scheduleAfterProcessing(eventActivityId: number): Promise<boolean> {
    const activity = await this.prisma.eventActivity.findUnique({
      where: { eventActivityId },
      select: {
        provider: true,
        externalId: true,
        event: { select: { athleteId: true, startDate: true } },
      },
    });
    if (
      activity?.provider !== ConnectorProvider.STRAVA ||
      !activity.event.athleteId
    ) {
      return false;
    }
    return this.schedule({
      athleteId: activity.event.athleteId,
      stravaActivityId: activity.externalId,
      eventActivityId,
      startDate: activity.event.startDate,
      delayMs: AFTER_PROCESSING_DELAY_MS,
    });
  }

  async write(job: StravaDescriptionJobData): Promise<DescriptionWriteResult> {
    const account = await this.prisma.providerAccount.findUnique({
      where: { providerAccountId: job.providerAccountId },
      include: {
        athlete: { include: { user: { select: { language: true } } } },
      },
    });
    // Turned off or disconnected since the job was queued
    if (
      !account ||
      account.status !== 'active' ||
      !account.activityDescriptionEnabled ||
      !hasStravaWriteScope(account.scopes)
    ) {
      return 'disabled';
    }

    const facts = await this.buildFacts(job.eventActivityId);
    const language =
      account.activityDescriptionLanguage ?? account.athlete.user.language;
    const block = facts && renderActivityDescription(facts, language);
    if (!block) return 'nothing-to-say';

    try {
      // Read again just before writing: the athlete may have typed their own
      // description since the upload, and it must stay
      const current = await this.strava.getActivityDescription(
        account,
        job.stravaActivityId,
      );
      const merged = mergeDescription(current, block);
      if (merged === null) return 'already-written';
      await this.strava.updateActivityDescription(
        account,
        job.stravaActivityId,
        merged,
      );
    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      // Write access revoked, or the activity deleted: a retry can't help
      if (status === 401 || status === 403 || status === 404) {
        throw new UnrecoverableError(
          `Strava refused to update activity ${job.stravaActivityId} (HTTP ${status})`,
        );
      }
      throw error;
    }
    this.logger.log(
      `Wrote the description of Strava activity ${job.stravaActivityId}`,
    );
    return 'written';
  }

  /** What the athlete's latest activity would read like, for Settings */
  async preview(
    athleteId: number,
    language: string | null | undefined,
  ): Promise<string | null> {
    const recent = await this.prisma.eventActivity.findMany({
      where: { event: { athleteId, type: EventType.ACTIVITY } },
      orderBy: { event: { startDate: 'desc' } },
      select: { eventActivityId: true },
      take: 10,
    });
    for (const { eventActivityId } of recent) {
      const facts = await this.buildFacts(eventActivityId);
      const text = facts && renderActivityDescription(facts, language);
      if (text) return text;
    }
    return null;
  }
}
