import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { ActivitySegment, Prisma } from '@openathlete/database';
import {
  ActivityCorrection,
  ActivityStream,
  CompressedActivityStream,
  EVENT_TYPE,
  StoredActivityCorrection,
  StreamSummary,
  applyCorrections,
  correctedFigures,
  summarizeStream,
} from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { accessibleBy } from 'src/modules/auth/services/casl-prisma';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { QueueService } from 'src/modules/queue/queue.service';

import { storedCorrections } from '../helpers/activity-corrections';
import {
  compressActivityStream,
  uncompressActivityStream,
} from '../helpers/activity-stream';
import {
  roundCadence,
  roundDistance,
  roundElevation,
  roundHeartrate,
  roundPower,
  roundSpeed,
} from '../helpers/round-activity-values';
import { EventService } from './event.service';

/** The activity as recorded, kept beside originalStream */
interface OriginalSummary {
  startDate: string;
  endDate: string;
  distance: number;
  movingTime: number;
  averageSpeed: number;
  maxSpeed: number;
  elevationGain: number;
  averageHeartrate: number | null;
  maxHeartrate: number | null;
  averageWatts: number | null;
  maxWatts: number | null;
  weightedAverageWatts: number | null;
  averageCadence: number | null;
  segments: Omit<ActivitySegment, 'activitySegmentId' | 'eventActivityId'>[];
}

const ACTIVITY_SELECT = {
  eventActivityId: true,
  stream: true,
  originalStream: true,
  originalSummary: true,
  corrections: true,
  distance: true,
  movingTime: true,
  averageSpeed: true,
  maxSpeed: true,
  elevationGain: true,
  averageHeartrate: true,
  maxHeartrate: true,
  averageWatts: true,
  maxWatts: true,
  weightedAverageWatts: true,
  averageCadence: true,
  segments: true,
} as const;

type CorrectedEvent = {
  eventId: number;
  startDate: Date;
  endDate: Date;
  activity: Prisma.EventActivityGetPayload<{ select: typeof ACTIVITY_SELECT }>;
};

/**
 * Corrections of an activity's recording (spikes, crop, altitude): applied
 * over the recording as it came, which is kept from the first one on, so
 * any of them can be undone. The activity is then processed again for its
 * records, pace and load, without the AI or a notification.
 */
@Injectable()
export class ActivityCorrectionsService {
  private readonly logger = new Logger(ActivityCorrectionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
    private readonly queue: QueueService,
    private readonly events: EventService,
  ) {}

  async add(user: AuthUser, eventId: number, correction: ActivityCorrection) {
    const event = await this.findForUpdate(user, eventId);
    await this.apply(event, [
      ...storedCorrections(event.activity.corrections),
      { ...correction, at: new Date().toISOString() },
    ]);
    return this.events.getEventById(user, eventId);
  }

  /** Undoes one correction, or all of them without an index */
  async remove(user: AuthUser, eventId: number, index?: number) {
    const event = await this.findForUpdate(user, eventId);
    const corrections = storedCorrections(event.activity.corrections);
    if (index !== undefined && (index < 0 || index >= corrections.length))
      throw new NotFoundException('Correction not found');
    await this.apply(
      event,
      index === undefined ? [] : corrections.filter((_, i) => i !== index),
    );
    return this.events.getEventById(user, eventId);
  }

  private async findForUpdate(
    user: AuthUser,
    eventId: number,
  ): Promise<CorrectedEvent> {
    const ability = await this.abilities.getFor({ user });
    const event = await this.prisma.event.findFirst({
      where: {
        AND: [
          { eventId, type: EVENT_TYPE.ACTIVITY },
          accessibleBy(ability, 'update').Event,
        ],
      },
      select: {
        eventId: true,
        startDate: true,
        endDate: true,
        activity: { select: ACTIVITY_SELECT },
      },
    });
    if (!event?.activity?.stream)
      throw new NotFoundException('Activity not found');
    return event as CorrectedEvent;
  }

  private snapshot(event: CorrectedEvent): OriginalSummary {
    const { activity } = event;
    return {
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      distance: activity.distance,
      movingTime: activity.movingTime,
      averageSpeed: activity.averageSpeed,
      maxSpeed: activity.maxSpeed,
      elevationGain: activity.elevationGain,
      averageHeartrate: activity.averageHeartrate,
      maxHeartrate: activity.maxHeartrate,
      averageWatts: activity.averageWatts,
      maxWatts: activity.maxWatts,
      weightedAverageWatts: activity.weightedAverageWatts,
      averageCadence: activity.averageCadence,
      segments: activity.segments.map(
        ({ activitySegmentId: _id, eventActivityId: _activity, ...segment }) =>
          segment,
      ),
    };
  }

  private async apply(
    event: CorrectedEvent,
    corrections: StoredActivityCorrection[],
  ) {
    const { activity } = event;
    // The first change keeps the recording as it came
    const originalStream = (activity.originalStream ??
      activity.stream) as unknown as CompressedActivityStream;
    const original =
      (activity.originalSummary as unknown as OriginalSummary | null) ??
      this.snapshot(event);
    const originalStart = new Date(original.startDate);
    const originalEnd = new Date(original.endDate);

    let activityData: Prisma.EventActivityUpdateInput;
    let dates = { startDate: originalStart, endDate: originalEnd };
    let segments = original.segments;

    if (!corrections.length) {
      activityData = {
        gapVersion: 0,
        intensityVersion: 0,
        stream: originalStream as object,
        originalStream: Prisma.DbNull,
        originalSummary: Prisma.DbNull,
        corrections: Prisma.DbNull,
        ...this.figures(original, null, new Set()),
      };
    } else {
      const { stream, offsetSec } = applyCorrections(
        uncompressActivityStream(originalStream) as ActivityStream,
        corrections,
      );
      const figures = correctedFigures(corrections);
      const summary = summarizeStream(stream);
      activityData = {
        // The stream changed, or came back: the backfill adjusts it again
        gapVersion: 0,
        intensityVersion: 0,
        stream: compressActivityStream(stream) as object,
        originalStream: originalStream as object,
        originalSummary: original as unknown as Prisma.InputJsonValue,
        corrections: corrections as unknown as Prisma.InputJsonValue,
        ...this.figures(original, summary, figures),
      };
      if (offsetSec > 0 || figures.has('elapsedSec')) {
        const startDate = new Date(originalStart.getTime() + offsetSec * 1000);
        const elapsed =
          summary?.elapsedSec ??
          (originalEnd.getTime() - originalStart.getTime()) / 1000;
        dates = {
          startDate,
          endDate: new Date(startDate.getTime() + elapsed * 1000),
        };
        // Laps are timed from the start: move them with it, cut at the end
        segments = original.segments.flatMap((segment) => {
          const start = Math.max(0, segment.startTimeSeconds - offsetSec);
          const end = Math.min(elapsed, segment.endTimeSeconds - offsetSec);
          return end > start
            ? [
                {
                  ...segment,
                  startTimeSeconds: Math.round(start),
                  endTimeSeconds: Math.round(end),
                },
              ]
            : [];
        });
      }
    }

    const { eventActivityId } = activity;
    await this.prisma.$transaction(async (tx) => {
      await tx.eventActivity.update({
        where: { eventActivityId },
        data: activityData,
      });
      await tx.event.update({ where: { eventId: event.eventId }, data: dates });
      await tx.activitySegment.deleteMany({ where: { eventActivityId } });
      if (segments.length)
        await tx.activitySegment.createMany({
          data: segments.map((segment) => ({
            ...segment,
            eventActivityId,
          })) as Prisma.ActivitySegmentCreateManyInput[],
        });
    });

    // Records, pace and load follow the new recording; as for an import of
    // history, nothing asks the AI or notifies anyone again
    await this.queue
      .addActivityProcessingJob(eventActivityId, event.eventId, true)
      .catch((error: unknown) =>
        this.logger.warn(
          `Could not reprocess corrected activity ${eventActivityId}: ${String(error)}`,
        ),
      );
  }

  /** The summary columns: recomputed where a correction changed them */
  private figures(
    original: OriginalSummary,
    summary: StreamSummary | null,
    changed: Set<keyof StreamSummary>,
  ): Prisma.EventActivityUpdateInput {
    const pick = <T>(key: keyof StreamSummary, value: T, from: T): T =>
      summary && changed.has(key) && summary[key] !== undefined ? value : from;
    return {
      distance: pick(
        'distanceM',
        roundDistance(summary?.distanceM),
        original.distance,
      ),
      movingTime: pick(
        'movingTimeSec',
        Math.round(summary?.movingTimeSec ?? 0),
        original.movingTime,
      ),
      averageSpeed: pick(
        'averageSpeed',
        roundSpeed(summary?.averageSpeed) ?? 0,
        original.averageSpeed,
      ),
      maxSpeed: pick(
        'maxSpeed',
        roundSpeed(summary?.maxSpeed) ?? 0,
        original.maxSpeed,
      ),
      elevationGain: pick(
        'elevationGainM',
        roundElevation(summary?.elevationGainM),
        original.elevationGain,
      ),
      averageHeartrate: pick(
        'averageHeartrate',
        roundHeartrate(summary?.averageHeartrate) ?? null,
        original.averageHeartrate,
      ),
      maxHeartrate: pick(
        'maxHeartrate',
        roundHeartrate(summary?.maxHeartrate) ?? null,
        original.maxHeartrate,
      ),
      averageWatts: pick(
        'averageWatts',
        roundPower(summary?.averageWatts) ?? null,
        original.averageWatts,
      ),
      maxWatts: pick(
        'maxWatts',
        roundPower(summary?.maxWatts) ?? null,
        original.maxWatts,
      ),
      weightedAverageWatts: pick(
        'normalizedWatts',
        roundPower(summary?.normalizedWatts) ?? null,
        original.weightedAverageWatts,
      ),
      averageCadence: pick(
        'averageCadence',
        roundCadence(summary?.averageCadence) ?? null,
        original.averageCadence,
      ),
    };
  }
}
