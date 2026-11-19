import { EventType } from '@openathlete/database';
import { questionnaireClosesAt } from '@openathlete/shared';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

type Placed = { eventId: number; seriesId: string | null; startDate: Date };

/**
 * When each occurrence stops taking a first answer: when the next one of
 * its series opens, or a week after it opened. One query for them all.
 */
export async function closingDates(
  prisma: PrismaService,
  events: Placed[],
): Promise<Map<number, Date>> {
  const seriesIds = [
    ...new Set(
      events
        .map((event) => event.seriesId)
        .filter((id): id is string => id !== null),
    ),
  ];
  const earliest = events.reduce<Date | null>(
    (min, event) => (!min || event.startDate < min ? event.startDate : min),
    null,
  );
  const series =
    seriesIds.length && earliest
      ? await prisma.event.findMany({
          where: {
            seriesId: { in: seriesIds },
            type: EventType.QUESTIONNAIRE,
            startDate: { gt: earliest },
          },
          select: { seriesId: true, startDate: true },
          orderBy: { startDate: 'asc' },
        })
      : [];

  return new Map(
    events.map((event) => {
      const next =
        series.find(
          (other) =>
            other.seriesId === event.seriesId &&
            other.startDate > event.startDate,
        )?.startDate ?? null;
      return [event.eventId, questionnaireClosesAt(event.startDate, next)];
    }),
  );
}
