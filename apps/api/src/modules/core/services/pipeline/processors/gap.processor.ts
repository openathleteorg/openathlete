import { Injectable, Logger } from '@nestjs/common';

import { SportType } from '@openathlete/database';
import { InputJsonValue } from '@openathlete/database/generated/client/runtime/library';
import { ActivityStream } from '@openathlete/shared';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import {
  compressActivityStream,
  uncompressActivityStream,
} from '../../../helpers/activity-stream';
import { gradeAdjustedSpeed } from '../../../helpers/grade-adjusted-speed';
import { roundSpeed } from '../../../helpers/round-activity-values';
import { ActivityPipelineContext, ActivityProcessor } from '../types';

/**
 * Bump when the grade adjustment changes: activities computed with an older
 * version are recomputed in the background (GapBackfillService).
 */
export const GAP_VERSION = 1;

@Injectable()
export class GapProcessor implements ActivityProcessor {
  name = 'gap';
  private readonly logger = new Logger(GapProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  async run(ctx: ActivityPipelineContext) {
    const activity = await this.prisma.eventActivity.findUnique({
      where: { eventActivityId: ctx.eventActivityId },
      include: { event: true },
    });
    if (!activity || !activity.stream) return;

    if (
      activity.sport !== SportType.RUNNING &&
      activity.sport !== SportType.TRAIL_RUNNING
    ) {
      return;
    }

    this.logger.log(
      `GAP processor running for activity ${ctx.eventActivityId}`,
    );

    const stream = uncompressActivityStream(activity.stream as ActivityStream);
    const time = stream['time'] as number[] | undefined;
    const dist = stream['distance'] as number[] | undefined;
    const alt = stream['altitude'] as number[] | undefined;
    if (!time?.length || !dist?.length || !alt?.length) return;

    const n = Math.min(time.length, dist.length, alt.length);
    if (n < 2) return;

    const windowM = 10;
    const halfW = windowM / 2;
    let left = 0;
    let right = 0;

    const gapStream: number[] = new Array(n).fill(0);
    let sumGapSpeed = 0;
    let count = 0;

    for (let i = 0; i < n; i++) {
      while (left < i && dist[i] - dist[left] > halfW) left++;
      if (right < i) right = i;
      while (right < n - 1 && dist[right] - dist[i] < halfW) right++;

      let k0 = left;
      let k1 = right;
      if (k1 <= k0) {
        // fallback to nearest neighbors
        k0 = Math.max(0, i - 1);
        k1 = Math.min(n - 1, i + 1);
      }

      const dd = Math.max(0, dist[k1] - dist[k0]);
      const dt = Math.max(1e-6, time[k1] - time[k0]);
      const dAlt = (alt[k1] ?? alt[i]) - (alt[k0] ?? alt[i]);

      const v = dd / dt; // observed speed m/s over the window
      const grade = dd > 0 ? dAlt / dd : 0;
      const vGap = gradeAdjustedSpeed(v, Number.isFinite(grade) ? grade : 0);

      gapStream[i] = vGap;
      if (Number.isFinite(vGap)) {
        sumGapSpeed += vGap;
        count++;
      }
    }

    // Seed first value if missing
    if (!Number.isFinite(gapStream[0]) && n > 1) gapStream[0] = gapStream[1];

    const avgGap = count > 0 ? sumGapSpeed / count : null;

    const newStream = { ...stream, gap: gapStream } as ActivityStream;
    const compressed = compressActivityStream(newStream);

    await this.prisma.eventActivity.update({
      where: { eventActivityId: ctx.eventActivityId },
      data: {
        stream: compressed as InputJsonValue,
        averageGapSpeed: roundSpeed(avgGap) ?? undefined,
        gapVersion: GAP_VERSION,
        // Efficiency is built on it
        intensityVersion: 0,
      },
    });
  }
}
