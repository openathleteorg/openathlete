import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { EventType } from '@openathlete/database';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import type { ExportSink } from 'src/modules/auth/services/account-export.service';
import { accessibleBy } from 'src/modules/auth/services/casl-prisma';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { EVENT_INCLUDES } from './event-includes';

export const CALENDAR_EXPORT_FORMAT = 'openathlete-calendar-export-v1';

/** Events are read and written in batches so long calendars stream. */
const EVENT_BATCH = 200;

/**
 * An athlete's planned calendar, as one JSON document, for a coach to keep
 * a copy of the programming they did. Planned events only (sessions with
 * their workouts, races, notes, questionnaires): recorded activities are the
 * athlete's own data and leave through their account export. Each event says
 * who planned it, when that was recorded.
 */
@Injectable()
export class AthleteCalendarExportService {
  private readonly logger = new Logger(AthleteCalendarExportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
  ) {}

  /** The athlete's name, once access is checked: the file is named after it. */
  async athleteFor(user: AuthUser, athleteId: number) {
    const ability = await this.abilities.getFor({ user });
    const athlete = await this.prisma.athlete.findFirst({
      where: { AND: [{ athleteId }, accessibleBy(ability, 'read').Athlete] },
      select: { user: { select: { firstName: true, lastName: true } } },
    });
    if (!athlete) throw new NotFoundException('Athlete not found');
    return athlete.user;
  }

  async export(user: AuthUser, athleteId: number, sink: ExportSink) {
    const athlete = await this.athleteFor(user, athleteId);
    const ability = await this.abilities.getFor({ user });
    const where = {
      AND: [
        { athleteId, type: { not: EventType.ACTIVITY } },
        accessibleBy(ability, 'read').Event,
      ],
    };

    sink.write('{');
    sink.write(`"format":${JSON.stringify(CALENDAR_EXPORT_FORMAT)},`);
    sink.write(`"exportedAt":${JSON.stringify(new Date().toISOString())},`);
    sink.write(`"athlete":${JSON.stringify(athlete)},`);
    sink.write('"events":[');
    let cursor: number | undefined;
    let first = true;
    let count = 0;
    for (;;) {
      const events = await this.prisma.event.findMany({
        where,
        orderBy: { eventId: 'asc' },
        take: EVENT_BATCH,
        ...(cursor ? { skip: 1, cursor: { eventId: cursor } } : {}),
        include: {
          ...EVENT_INCLUDES,
          createdBy: { select: { firstName: true, lastName: true } },
        },
      });
      for (const event of events) {
        const exported = {
          ...event,
          createdByMe: event.createdById === user.userId,
        };
        sink.write(`${first ? '' : ','}${JSON.stringify(exported)}`);
        first = false;
      }
      count += events.length;
      if (events.length < EVENT_BATCH) break;
      cursor = events[events.length - 1].eventId;
    }
    sink.write(']}');
    sink.end();
    this.logger.log(
      `Calendar export of athlete ${athleteId} by user ${user.userId}: ${count} events`,
    );
  }
}
