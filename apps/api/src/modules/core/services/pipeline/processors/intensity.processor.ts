import { Injectable } from '@nestjs/common';

import { ActivityStream, ZoneRange } from '@openathlete/shared';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { activityIntensity } from '../../../helpers/activity-intensity';
import { uncompressActivityStream } from '../../../helpers/activity-stream';
import { ActivityPipelineContext, ActivityProcessor } from '../types';

/**
 * Bump when the figures below change: activities computed with an older
 * version are recomputed in the background (IntensityBackfillService).
 */
export const INTENSITY_VERSION = 1;

/** Reads the recording once, so statistics never have to. */
@Injectable()
export class IntensityProcessor implements ActivityProcessor {
  name = 'intensity';

  constructor(private readonly prisma: PrismaService) {}

  /** The athlete's heart rate zones for a sport, lowest first */
  private async heartRateZones(
    athleteId: number,
    sport: string,
  ): Promise<ZoneRange[]> {
    const zones = await this.prisma.trainingZone.findMany({
      where: { athleteId, type: 'HEARTRATE' },
      include: { values: true },
      orderBy: { index: 'asc' },
    });
    return zones.flatMap(({ trainingZoneId, values }) => {
      const value =
        values.find(({ sports }) => (sports as string[]).includes(sport)) ??
        values.find(({ sports }) => sports.length === 0);
      return value
        ? [{ id: trainingZoneId, min: value.min, max: value.max }]
        : [];
    });
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

    const { seconds, efficiencyFactor, decouplingPercent } = activityIntensity(
      uncompressActivityStream(activity.stream as ActivityStream),
      activity.sport,
      await this.heartRateZones(activity.event.athleteId, activity.sport),
    );
    await this.prisma.eventActivity.update({
      where: { eventActivityId },
      data: {
        intensitySeconds: seconds,
        efficiencyFactor,
        decouplingPercent,
        intensityVersion: INTENSITY_VERSION,
      },
    });
  }
}
