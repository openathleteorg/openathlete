import { Injectable } from '@nestjs/common';

import { CompressedActivityStream } from '@openathlete/shared';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { uncompressActivityStream } from '../helpers/activity-stream';
import { computeRecords } from '../helpers/record';
import { isPlausibleRecord } from '../helpers/record-plausibility';

/**
 * Bump when computeRecords changes: activities computed with an older
 * version are recomputed in the background (RecordsBackfillService).
 */
export const RECORDS_VERSION = 3;

@Injectable()
export class ActivityRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Replaces the records of an activity with ones from its current stream. */
  async refresh(eventActivityId: number): Promise<number> {
    const activity = await this.prisma.eventActivity.findUnique({
      where: { eventActivityId },
      select: {
        stream: true,
        sport: true,
        event: { select: { athleteId: true, startDate: true } },
      },
    });
    if (!activity) return 0;
    const { athleteId, startDate } = activity.event;
    const records =
      activity.stream && athleteId
        ? computeRecords(
            uncompressActivityStream(
              activity.stream as CompressedActivityStream,
            ),
          ).filter((record) => isPlausibleRecord(record, activity.sport))
        : [];

    await this.prisma.$transaction(async (tx) => {
      // The pipeline and the backfill can refresh the same activity at once
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(7137, ${eventActivityId}::int)`;
      await tx.record.deleteMany({ where: { eventActivityId } });
      if (records.length > 0 && athleteId) {
        await tx.record.createMany({
          data: records.map((record) => ({
            ...record,
            eventActivityId,
            athleteId,
            date: startDate,
          })),
        });
      }
      await tx.eventActivity.update({
        where: { eventActivityId },
        data: { recordsVersion: RECORDS_VERSION },
      });
    });
    return records.length;
  }
}
