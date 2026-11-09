import { Injectable } from '@nestjs/common';

import { ActivityStream, ZoneRange } from '@openathlete/shared';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { activityIntensity } from '../../../helpers/activity-intensity';
import { activityProfile } from '../../../helpers/activity-profile';
import { uncompressActivityStream } from '../../../helpers/activity-stream';
import { ActivityPipelineContext, ActivityProcessor } from '../types';

/**
 * Bump when the figures below change: activities computed with an older
 * version are recomputed in the background (IntensityBackfillService).
 */
export const INTENSITY_VERSION = 4;

/** Reads the recording once, so statistics never have to. */
@Injectable()
export class IntensityProcessor implements ActivityProcessor {
  name = 'intensity';

  constructor(private readonly prisma: PrismaService) {}

  /** The athlete's zones of a kind for a sport, lowest first */
  private async zonesOf(
    athleteId: number,
    type: 'HEARTRATE' | 'POWER',
    sport: string,
  ): Promise<ZoneRange[]> {
    const zones = await this.prisma.trainingZone.findMany({
      where: { athleteId, type },
      include: { values: true },
    });
    const ranges = zones.flatMap(({ trainingZoneId, values }) => {
      const value =
        values.find(({ sports }) => (sports as string[]).includes(sport)) ??
        values.find(({ sports }) => sports.length === 0);
      return value
        ? [{ id: trainingZoneId, min: value.min, max: value.max }]
        : [];
    });
    // By threshold, not by creation: the domains split this order
    return ranges.sort((a, b) => a.min - b.min);
  }

  async run({ eventActivityId }: ActivityPipelineContext) {
    const activity = await this.prisma.eventActivity.findUnique({
      where: { eventActivityId },
      select: {
        stream: true,
        sport: true,
        event: { select: { athleteId: true } },
      },
    });
    if (!activity?.stream || !activity.event.athleteId) return;

    const { athleteId } = activity.event;
    const stream = uncompressActivityStream(activity.stream as ActivityStream);
    const { seconds, efficiencyFactor, decouplingPercent } = activityIntensity(
      stream,
      activity.sport,
      await this.zonesOf(athleteId, 'HEARTRATE', activity.sport),
      await this.zonesOf(athleteId, 'POWER', activity.sport),
    );
    const bins = activityProfile(stream, activity.sport);
    await this.prisma.$transaction(async (tx) => {
      // The pipeline and the backfill can refresh the same activity at once:
      // without the lock, both delete, then the second insert hits the bins
      // of the first and the whole refresh is lost
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(7138, ${eventActivityId}::int)`;
      await tx.activityProfileBin.deleteMany({ where: { eventActivityId } });
      await tx.activityProfileBin.createMany({
        data: bins.map((bin) => ({ ...bin, eventActivityId })),
      });
      await tx.eventActivity.update({
        where: { eventActivityId },
        data: {
          intensitySeconds: seconds,
          efficiencyFactor,
          decouplingPercent,
          intensityVersion: INTENSITY_VERSION,
        },
      });
    });
  }
}
