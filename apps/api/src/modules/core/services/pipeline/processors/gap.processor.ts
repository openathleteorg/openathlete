import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import {
  compressActivityStream,
  uncompressActivityStream,
} from '../../../helpers/activity-stream';
import { ActivityPipelineContext, ActivityProcessor } from '../types';

function stravaPolynomial(gradePct: number): number {
  return (
    0.990554879163107 +
    0.032844586542411 * gradePct +
    0.002148347700774 * Math.pow(gradePct, 2) -
    0.000004498739573 * Math.pow(gradePct, 3) -
    0.000000598866801 * Math.pow(gradePct, 4)
  );
}

@Injectable()
export class GapProcessor implements ActivityProcessor {
  name = 'gap';
  private readonly logger = new Logger(GapProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  async run(ctx: ActivityPipelineContext) {
    this.logger.log(
      `GAP processor running for activity ${ctx.eventActivityId}`,
    );
    const activity = await this.prisma.event_activity.findUnique({
      where: { event_activity_id: ctx.eventActivityId },
      include: { event: true },
    });
    if (!activity || !activity.stream) return;

    const stream = uncompressActivityStream(activity.stream as any);
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
      let gradePct = dd > 0 ? (dAlt / dd) * 100 : 0;
      // clamp unrealistic grades to reduce noise influence
      if (!Number.isFinite(gradePct)) gradePct = 0;
      gradePct = Math.max(-30, Math.min(30, gradePct));

      const timeRatio = stravaPolynomial(gradePct);
      // Convert observed speed to equivalent flat speed:
      // If uphill (timeRatio > 1), flat-equivalent speed should be higher
      const vGap = timeRatio > 0 ? v * timeRatio : v;

      gapStream[i] = vGap;
      if (Number.isFinite(vGap)) {
        sumGapSpeed += vGap;
        count++;
      }
    }

    // Seed first value if missing
    if (!Number.isFinite(gapStream[0]) && n > 1) gapStream[0] = gapStream[1];

    const avgGap = count > 0 ? sumGapSpeed / count : null;

    const newStream = { ...stream, gap: gapStream } as any;
    const compressed = compressActivityStream(newStream);

    await this.prisma.event_activity.update({
      where: { event_activity_id: ctx.eventActivityId },
      data: {
        stream: compressed as any,
        average_gap_speed: avgGap ?? undefined,
      },
    });
  }
}
