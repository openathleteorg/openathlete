import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { ClubRole, Prisma } from '@openathlete/database';
import {
  CLUB_SESSION_HORIZON_DAYS,
  ClubSessionDto,
  ClubSessionForEventDto,
  CreateClubSessionDto,
  isClubCoach,
  isClubStaff,
  startOfDay,
} from '@openathlete/shared';

import { Language } from 'src/common/constants/languages.constant';
import {
  addDaysToDateKey,
  formatZoned,
  startOfZonedDay,
  validTimeZone,
  zonedInstant,
} from 'src/common/utils/time-zone';
import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { accessibleBy } from 'src/modules/auth/services/casl-prisma';
import { remapZonesForAthlete } from 'src/modules/core/helpers/workout-zones';
import { EventBulkService } from 'src/modules/core/services/event-bulk.service';
import {
  SOURCE_INCLUDE,
  SourceEvent,
  copyTo,
  stepsOf,
} from 'src/modules/core/services/event-copy';
import { EventService } from 'src/modules/core/services/event.service';
import { PushNotificationService } from 'src/modules/notification';
import { clubSessionNotification } from 'src/modules/notification/push/club-session';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { requireClubRole } from './club.service';

/** A Date column (@db.Date) as its YYYY-MM-DD */
const dayOf = (date: Date) => date.toISOString().slice(0, 10);
const asDay = (key: string) => new Date(`${key}T00:00:00Z`);
const localDay = (instant: Date, timeZone: string) =>
  formatZoned(instant, timeZone).slice(0, 10);

type Session = Prisma.ClubSessionGetPayload<{
  include: { club: { select: { name: true } } };
}>;

/** The days a session falls on between two local days, called off ones out */
export function occurrenceDays(
  session: Pick<
    Session,
    'firstDate' | 'weekly' | 'untilDate' | 'canceledDates'
  >,
  from: string,
  to: string,
): string[] {
  const canceled = new Set(session.canceledDates.map(dayOf));
  const last = session.untilDate ? dayOf(session.untilDate) : null;
  const days: string[] = [];
  let day = dayOf(session.firstDate);
  while (day <= to && (!last || day <= last)) {
    if (day >= from && !canceled.has(day)) days.push(day);
    if (!session.weekly) break;
    day = addDaysToDateKey(day, 7);
  }
  return days;
}

/**
 * Sessions a club holds at a place and time. Each occurrence becomes an
 * ordinary session in the calendar of each athlete it is for, a few weeks
 * ahead: it reaches their watch and calendar feed like any other, with
 * their own zones and thresholds. The club keeps them in step with the
 * session, its group and its called-off days; done ones stay.
 */
@Injectable()
export class ClubSessionService {
  private readonly logger = new Logger(ClubSessionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
    private readonly eventService: EventService,
    private readonly eventBulkService: EventBulkService,
    @Optional() private readonly push?: PushNotificationService,
  ) {}

  private async requireCoach(userId: number, clubId: number) {
    const role = await requireClubRole(this.prisma, clubId, userId);
    if (!isClubCoach(role)) {
      throw new ForbiddenException("Only the club's coaches plan its sessions");
    }
  }

  private async requireSession(clubId: number, clubSessionId: number) {
    const session = await this.prisma.clubSession.findFirst({
      where: { clubSessionId, clubId },
      include: { club: { select: { name: true } } },
    });
    if (!session) throw new NotFoundException('Club session not found');
    return session;
  }

  /** Who a session is for: the athletes of its group (and sub-groups) */
  private async recipients(session: Pick<Session, 'clubId' | 'groupId'>) {
    const members = await this.prisma.clubMember.findMany({
      where: { clubId: session.clubId, role: ClubRole.ATHLETE },
      select: {
        userId: true,
        user: {
          select: { language: true, athlete: { select: { athleteId: true } } },
        },
      },
    });
    let inGroup: Set<number> | null = null;
    if (session.groupId) {
      const groups = await this.prisma.athleteGroup.findMany({
        where: {
          OR: [
            { athleteGroupId: session.groupId },
            { parentId: session.groupId },
          ],
        },
        select: { members: { select: { athleteId: true } } },
      });
      inGroup = new Set(
        groups.flatMap((group) => group.members.map((m) => m.athleteId)),
      );
    }
    return members.flatMap((member) => {
      const athleteId = member.user.athlete?.athleteId;
      if (!athleteId || (inGroup && !inGroup.has(athleteId))) return [];
      return [
        { athleteId, userId: member.userId, language: member.user.language },
      ];
    });
  }

  private async validate(clubId: number, dto: Partial<CreateClubSessionDto>) {
    if (dto.groupId) {
      const group = await this.prisma.athleteGroup.findFirst({
        where: { athleteGroupId: dto.groupId, clubId },
        select: { athleteGroupId: true },
      });
      if (!group) throw new BadRequestException('Not a group of this club');
    }
    if (dto.templateId) {
      const template = await this.prisma.eventTemplate.findFirst({
        where: { eventTemplateId: dto.templateId, clubId },
        select: { eventTemplateId: true },
      });
      if (!template) {
        throw new BadRequestException("Not a template of the club's library");
      }
    }
  }

  async create(
    user: AuthUser,
    clubId: number,
    dto: CreateClubSessionDto,
  ): Promise<ClubSessionDto> {
    await this.requireCoach(user.userId, clubId);
    await this.validate(clubId, dto);
    const session = await this.prisma.clubSession.create({
      data: {
        clubId,
        createdById: user.userId,
        title: dto.title,
        location: dto.location || null,
        notes: dto.notes || null,
        templateId: dto.templateId ?? null,
        groupId: dto.groupId ?? null,
        firstDate: asDay(dto.firstDate),
        weekly: dto.weekly,
        untilDate: dto.untilDate ? asDay(dto.untilDate) : null,
        startTime: dto.startTime,
        durationMinutes: dto.durationMinutes,
        timeZone: validTimeZone(dto.timeZone),
      },
      select: { clubSessionId: true },
    });
    await this.materialize(session.clubSessionId);
    return this.describe(session.clubSessionId);
  }

  async update(
    user: AuthUser,
    clubId: number,
    clubSessionId: number,
    dto: CreateClubSessionDto,
  ): Promise<ClubSessionDto> {
    await this.requireCoach(user.userId, clubId);
    const before = await this.requireSession(clubId, clubSessionId);
    await this.validate(clubId, dto);
    await this.prisma.clubSession.update({
      where: { clubSessionId },
      data: {
        title: dto.title,
        location: dto.location || null,
        notes: dto.notes || null,
        templateId: dto.templateId ?? null,
        groupId: dto.groupId ?? null,
        firstDate: asDay(dto.firstDate),
        weekly: dto.weekly,
        untilDate: dto.untilDate ? asDay(dto.untilDate) : null,
        startTime: dto.startTime,
        durationMinutes: dto.durationMinutes,
        timeZone: validTimeZone(dto.timeZone),
      },
    });
    // The coming occurrences are made again from the new session
    const informed = await this.removeUpcoming(clubSessionId);
    await this.materialize(clubSessionId);
    await this.notify(informed, 'changed', before, dayOf(before.firstDate));
    return this.describe(clubSessionId);
  }

  async delete(
    user: AuthUser,
    clubId: number,
    clubSessionId: number,
  ): Promise<void> {
    await this.requireCoach(user.userId, clubId);
    const session = await this.requireSession(clubId, clubSessionId);
    const informed = await this.removeUpcoming(clubSessionId);
    // Done occurrences stay in the athletes' history, without the session
    await this.prisma.clubSession.delete({ where: { clubSessionId } });
    const next = [...informed.values()][0]?.date;
    if (next) await this.notify(informed, 'canceled', session, next);
  }

  /** Calls one occurrence off: it leaves the athletes' calendars */
  async cancelOccurrence(
    user: AuthUser,
    clubId: number,
    clubSessionId: number,
    date: string,
  ): Promise<ClubSessionDto> {
    await this.requireCoach(user.userId, clubId);
    const session = await this.requireSession(clubId, clubSessionId);
    if (!occurrenceDays(session, date, date).length) {
      throw new BadRequestException('The session does not fall on that day');
    }
    await this.prisma.clubSession.update({
      where: { clubSessionId },
      data: { canceledDates: { push: asDay(date) } },
    });
    const informed = await this.removeUpcoming(clubSessionId, date);
    await this.notify(informed, 'canceled', session, date);
    return this.describe(clubSessionId);
  }

  /**
   * Deletes the occurrences still to do, from today or of one day, and
   * says who had them.
   */
  private async removeUpcoming(clubSessionId: number, onlyDay?: string) {
    const session = await this.prisma.clubSession.findUniqueOrThrow({
      where: { clubSessionId },
      select: { timeZone: true },
    });
    const today = localDay(new Date(), session.timeZone);
    const from = startOfZonedDay(onlyDay ?? today, session.timeZone);
    const to = onlyDay
      ? startOfZonedDay(addDaysToDateKey(onlyDay, 1), session.timeZone)
      : undefined;
    const events = await this.prisma.event.findMany({
      where: {
        clubSessionId,
        startDate: { gte: from, ...(to && { lt: to }) },
      },
      select: {
        eventId: true,
        startDate: true,
        training: { select: { relatedActivityId: true } },
        athlete: {
          select: { user: { select: { userId: true, language: true } } },
        },
      },
    });
    const informed = new Map<number, { language: string; date: string }>();
    for (const event of events) {
      if (event.training?.relatedActivityId) continue; // done: history now
      await this.eventService.removeEvent(event.eventId, { notify: false });
      if (event.athlete) {
        informed.set(event.athlete.user.userId, {
          language: event.athlete.user.language,
          date: localDay(event.startDate, session.timeZone),
        });
      }
    }
    return informed;
  }

  private async notify(
    users: Map<number, { language: string; date: string }>,
    change: 'canceled' | 'changed',
    session: Session,
    date: string,
  ) {
    if (!this.push) return;
    for (const [userId, { language }] of users) {
      const { title, body } = clubSessionNotification(
        language as Language,
        change,
        { club: session.club.name, title: session.title, date },
      );
      await this.push.sendPushNotification({
        userId,
        title,
        body,
        data: {
          type: 'club_session',
          clubSessionId: String(session.clubSessionId),
        },
      });
    }
  }

  /**
   * Puts the session's coming occurrences in its athletes' calendars, and
   * takes out those of athletes no longer concerned. Idempotent.
   */
  async materialize(clubSessionId: number): Promise<number> {
    const session = await this.prisma.clubSession.findUnique({
      where: { clubSessionId },
      include: {
        club: { select: { name: true } },
        template: { include: { event: { include: SOURCE_INCLUDE } } },
      },
    });
    if (!session) return 0;
    const today = localDay(new Date(), session.timeZone);
    const days = occurrenceDays(
      session,
      today,
      addDaysToDateKey(today, CLUB_SESSION_HORIZON_DAYS),
    );
    const athletes = await this.recipients(session);
    const wanted = new Set(
      days.flatMap((day) => athletes.map((a) => `${a.athleteId}|${day}`)),
    );

    const existing = await this.prisma.event.findMany({
      where: {
        clubSessionId,
        startDate: { gte: startOfZonedDay(today, session.timeZone) },
      },
      select: {
        eventId: true,
        athleteId: true,
        startDate: true,
        training: { select: { relatedActivityId: true } },
      },
    });
    const have = new Set<string>();
    for (const event of existing) {
      const key = `${event.athleteId}|${localDay(event.startDate, session.timeZone)}`;
      if (wanted.has(key) || event.training?.relatedActivityId) {
        have.add(key);
      } else {
        await this.eventService.removeEvent(event.eventId, { notify: false });
      }
    }

    const source = session.template?.event as SourceEvent | null | undefined;
    const created: number[] = [];
    for (const day of days) {
      const startDate = zonedInstant(day, session.startTime, session.timeZone);
      const endDate = new Date(
        startDate.getTime() + session.durationMinutes * 60_000,
      );
      for (const athlete of athletes) {
        if (have.has(`${athlete.athleteId}|${day}`)) continue;
        const data: Prisma.EventCreateInput = source
          ? {
              ...copyTo(source, {
                athleteId: athlete.athleteId,
                startDate,
                endDate,
                steps: stepsOf(source)
                  ? await remapZonesForAthlete(
                      this.prisma,
                      athlete.athleteId,
                      source.training?.sport,
                      stepsOf(source)!,
                    )
                  : null,
                keepLoad: false,
              }),
              name: session.title,
            }
          : {
              name: session.title,
              type: 'NOTE',
              startDate,
              endDate,
              athlete: { connect: { athleteId: athlete.athleteId } },
              note: { create: { description: session.notes ?? '' } },
            };
        const event = await this.prisma.event.create({
          data: { ...data, clubSession: { connect: { clubSessionId } } },
          select: { eventId: true },
        });
        created.push(event.eventId);
      }
    }

    if (created.length) {
      const copies = await this.eventBulkService.reload(created);
      this.eventBulkService.afterChange(copies);
      const todayStart = startOfDay(new Date());
      for (const copy of copies) {
        if (copy.type !== 'TRAINING' || !copy.training || !copy.athleteId) {
          continue;
        }
        await this.eventService.computeAndApplyPlannedTrainingLoad(
          copy.eventId,
          copy.athleteId,
          copy.training.eventTrainingId,
          copy.startDate > todayStart,
        );
      }
    }
    return created.length;
  }

  /**
   * Keeps every running session's occurrences a few weeks ahead, and in
   * step with groups that changed. Idempotent: the API and the worker can
   * both run it.
   */
  @Cron('17 * * * *')
  async materializeAll(): Promise<void> {
    const running = await this.prisma.clubSession.findMany({
      where: {
        OR: [
          { untilDate: null, weekly: true },
          { untilDate: { gte: new Date(Date.now() - 2 * 86_400_000) } },
          { firstDate: { gte: new Date(Date.now() - 2 * 86_400_000) } },
        ],
      },
      select: { clubSessionId: true },
    });
    for (const { clubSessionId } of running) {
      try {
        await this.materialize(clubSessionId);
      } catch (error) {
        this.logger.error(
          `Club session ${clubSessionId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  private async describe(clubSessionId: number): Promise<ClubSessionDto> {
    const [described] = await this.describeMany({ clubSessionId });
    return described;
  }

  private async describeMany(
    where: Prisma.ClubSessionWhereInput,
  ): Promise<ClubSessionDto[]> {
    const sessions = await this.prisma.clubSession.findMany({
      where,
      orderBy: [{ firstDate: 'asc' }, { startTime: 'asc' }],
      include: {
        group: { select: { name: true } },
        template: { select: { event: { select: { name: true } } } },
        attendance: { select: { date: true, going: true } },
        club: { select: { name: true } },
      },
    });
    const result: ClubSessionDto[] = [];
    for (const session of sessions) {
      const today = localDay(new Date(), session.timeZone);
      const days = occurrenceDays(
        session,
        today,
        addDaysToDateKey(today, CLUB_SESSION_HORIZON_DAYS),
      );
      const invitedByDay = new Map<string, number>();
      const events = await this.prisma.event.findMany({
        where: {
          clubSessionId: session.clubSessionId,
          startDate: { gte: startOfZonedDay(today, session.timeZone) },
        },
        select: { startDate: true },
      });
      for (const event of events) {
        const day = localDay(event.startDate, session.timeZone);
        invitedByDay.set(day, (invitedByDay.get(day) ?? 0) + 1);
      }
      result.push({
        clubSessionId: session.clubSessionId,
        title: session.title,
        location: session.location,
        notes: session.notes,
        templateId: session.templateId,
        templateName: session.template?.event?.name ?? null,
        groupId: session.groupId,
        groupName: session.group?.name ?? null,
        firstDate: dayOf(session.firstDate),
        startTime: session.startTime,
        durationMinutes: session.durationMinutes,
        weekly: session.weekly,
        untilDate: session.untilDate ? dayOf(session.untilDate) : null,
        timeZone: session.timeZone,
        upcoming: days.map((day) => {
          const answers = session.attendance.filter(
            (answer) => dayOf(answer.date) === day,
          );
          return {
            date: day,
            invited: invitedByDay.get(day) ?? 0,
            going: answers.filter((answer) => answer.going).length,
            notGoing: answers.filter((answer) => !answer.going).length,
          };
        }),
      });
    }
    return result;
  }

  /** The club's sessions, for its staff */
  async list(user: AuthUser, clubId: number): Promise<ClubSessionDto[]> {
    const role = await requireClubRole(this.prisma, clubId, user.userId);
    if (!isClubStaff(role)) {
      throw new ForbiddenException("Only the club's staff sees its sessions");
    }
    return this.describeMany({ clubId });
  }

  /** The club session behind an event, for the athlete or their coaches */
  async forEvent(
    user: AuthUser,
    eventId: number,
  ): Promise<ClubSessionForEventDto> {
    const ability = await this.abilities.getFor({ user });
    const event = await this.prisma.event.findFirst({
      where: { AND: [{ eventId }, accessibleBy(ability, 'read').Event] },
      select: {
        startDate: true,
        athlete: { select: { userId: true } },
        clubSession: {
          include: { club: { select: { name: true } } },
        },
      },
    });
    if (!event?.clubSession || !event.athlete) {
      throw new NotFoundException('No club session for this event');
    }
    const session = event.clubSession;
    const date = localDay(event.startDate, session.timeZone);
    const answer = await this.prisma.clubSessionAttendance.findUnique({
      where: {
        clubSessionId_date_userId: {
          clubSessionId: session.clubSessionId,
          date: asDay(date),
          userId: event.athlete.userId,
        },
      },
      select: { going: true },
    });
    return {
      clubSessionId: session.clubSessionId,
      clubName: session.club.name,
      title: session.title,
      location: session.location,
      notes: session.notes,
      date,
      going: answer?.going ?? null,
    };
  }

  /** The athlete says whether they come, from the event in their calendar */
  async answer(
    user: AuthUser,
    eventId: number,
    going: boolean,
  ): Promise<ClubSessionForEventDto> {
    const event = await this.prisma.event.findFirst({
      where: { eventId, athlete: { userId: user.userId } },
      select: {
        startDate: true,
        clubSession: { select: { clubSessionId: true, timeZone: true } },
      },
    });
    if (!event?.clubSession) {
      throw new NotFoundException('No club session for this event');
    }
    const date = asDay(localDay(event.startDate, event.clubSession.timeZone));
    const clubSessionId = event.clubSession.clubSessionId;
    await this.prisma.clubSessionAttendance.upsert({
      where: {
        clubSessionId_date_userId: { clubSessionId, date, userId: user.userId },
      },
      create: { clubSessionId, date, userId: user.userId, going },
      update: { going },
    });
    return this.forEvent(user, eventId);
  }
}
