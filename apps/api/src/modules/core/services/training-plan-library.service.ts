import { subject } from '@casl/ability';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';

import {
  CycleKind,
  Event,
  EventType,
  PlanStatus,
  Prisma,
} from '@openathlete/database';
import {
  AppliedTrainingPlan,
  AppliedTrainingPlansQuery,
  ApplyTrainingPlanDto,
  CYCLE_PHASE,
  CreateTrainingPlanFromCalendarDto,
  CreateTrainingPlanTemplateDto,
  CreateWorkoutStepDto,
  ImportTrainingPlanDto,
  PLAN_ANCHOR,
  PLAN_LEVEL,
  PlanSession,
  SEOPlanData,
  SPORT_TYPE,
  ShiftTrainingPlanDto,
  TRAINING_PLAN_CONFLICT_MODE,
  TRAINING_PLAN_FILE_FORMAT,
  TrainingPlanApplyPreview,
  TrainingPlanApplyResult,
  TrainingPlanApplyTarget,
  TrainingPlanConflictMode,
  TrainingPlanContent,
  TrainingPlanFile,
  TrainingPlanRemoveResult,
  TrainingPlanTemplateDetail,
  TrainingPlanTemplateSummary,
  UpdateTrainingPlanTemplateDto,
  WorkoutStepTargetDto,
  countPlanWeeks,
  createWorkoutSchema,
  mapPrismaWorkoutToDto,
  mapWorkoutDtoToPrisma,
  trainingPlanContentSchema,
  trainingPlanFileSchema,
} from '@openathlete/shared';

import {
  addDaysToDateKey,
  addZonedDays,
  formatZoned,
  startOfZonedDay,
  validTimeZone,
  zonedClock,
  zonedInstant,
} from 'src/common/utils/time-zone';
import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { accessibleBy } from 'src/modules/auth/services/casl-prisma';
import { CalendarWebSocketService } from 'src/modules/calendar/services/calendar-websocket.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import {
  PlanRange,
  currentPlanWeek,
  daysBetweenDateKeys,
  isInRange,
  planRange,
  planSessionDateKey,
  weekStartOfDateKey,
  weekdayOfDateKey,
} from '../helpers/plan-dates';
import { remapZonesForAthlete } from '../helpers/workout-zones';
import { SOURCE_INCLUDE } from './event-copy';
import { EventService } from './event.service';

type Ability = Awaited<ReturnType<CaslAbilityFactory['getFor']>>;

/** Plans of the website have no time: they start at 09:00, as they always did */
const DEFAULT_START_TIME = '09:00';
const DEFAULT_SESSION_SECONDS = 3600;

/** What applying a plan needs, whether it comes from the library or the website */
export interface PlanToApply {
  name: string;
  description: string;
  goal: string;
  content: TrainingPlanContent;
  templateId: number | null;
}

export interface ApplyOptions {
  anchor: PLAN_ANCHOR;
  weekStartsOn: number;
  conflictMode: TrainingPlanConflictMode;
}

interface DatedSession {
  session: PlanSession;
  date: string;
  cycleIndex: number;
  weekIndex: number;
}

/**
 * The training plan library: plans laid out by week and weekday, applied to
 * athletes' calendars by start or end date, then moved or removed as a whole.
 */
@Injectable()
export class TrainingPlanLibraryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
    private readonly eventService: EventService,
    @Optional()
    private readonly calendarWebSocketService?: CalendarWebSocketService,
  ) {}

  // -------------------------------------------------------------------------
  // Library
  // -------------------------------------------------------------------------

  async listTemplates(user: AuthUser): Promise<TrainingPlanTemplateSummary[]> {
    const templates = await this.prisma.trainingPlanTemplate.findMany({
      where: { userId: user.userId },
      include: {
        _count: {
          select: { applied: { where: { status: PlanStatus.ACTIVE } } },
        },
      },
      orderBy: { name: 'asc' },
    });
    return templates.map((template) =>
      this.toSummary(template, template._count.applied),
    );
  }

  async getTemplate(
    user: AuthUser,
    templateId: number,
  ): Promise<TrainingPlanTemplateDetail> {
    const template = await this.findOwnTemplate(user, templateId);
    const active = await this.prisma.trainingPlan.count({
      where: { templateId, status: PlanStatus.ACTIVE },
    });
    return {
      ...this.toSummary(template, active),
      content: this.readContent(template.content),
    };
  }

  async createTemplate(user: AuthUser, dto: CreateTrainingPlanTemplateDto) {
    await this.checkFolder(user, dto.folderId);
    const created = await this.prisma.trainingPlanTemplate.create({
      data: {
        userId: user.userId,
        name: dto.name,
        description: dto.description,
        goal: dto.goal,
        sport: dto.sport ?? this.mainSport(dto.content),
        level: dto.level ?? null,
        folderId: dto.folderId ?? null,
        weeks: countPlanWeeks(dto.content.cycles),
        content: dto.content as Prisma.InputJsonValue,
      },
    });
    return this.getTemplate(user, created.trainingPlanTemplateId);
  }

  async updateTemplate(
    user: AuthUser,
    templateId: number,
    dto: UpdateTrainingPlanTemplateDto,
  ) {
    await this.findOwnTemplate(user, templateId);
    if (dto.folderId !== undefined) await this.checkFolder(user, dto.folderId);
    await this.prisma.trainingPlanTemplate.update({
      where: { trainingPlanTemplateId: templateId },
      data: {
        name: dto.name,
        description: dto.description,
        goal: dto.goal,
        sport: dto.sport,
        level: dto.level,
        folderId: dto.folderId,
        ...(dto.content && {
          weeks: countPlanWeeks(dto.content.cycles),
          content: dto.content as Prisma.InputJsonValue,
        }),
      },
    });
    return this.getTemplate(user, templateId);
  }

  /** Plans already applied stay on the calendars: only the link goes */
  async deleteTemplate(user: AuthUser, templateId: number) {
    await this.findOwnTemplate(user, templateId);
    await this.prisma.trainingPlanTemplate.delete({
      where: { trainingPlanTemplateId: templateId },
    });
  }

  async importTemplate(user: AuthUser, dto: ImportTrainingPlanDto) {
    const file = dto.file;
    if ('format' in file) {
      return this.createTemplate(user, {
        ...file.plan,
        folderId: dto.folderId,
        content: file.content,
      });
    }
    return this.createTemplate(user, {
      ...this.fromWebsitePlan(file),
      folderId: dto.folderId,
    });
  }

  async exportTemplate(
    user: AuthUser,
    templateId: number,
  ): Promise<TrainingPlanFile> {
    const template = await this.findOwnTemplate(user, templateId);
    return trainingPlanFileSchema.parse({
      format: TRAINING_PLAN_FILE_FORMAT,
      version: 1,
      plan: {
        name: template.name,
        description: template.description,
        goal: template.goal,
        sport: template.sport,
        level: template.level,
      },
      content: template.content,
    });
  }

  /**
   * Saves a date range of a calendar as a plan: its planned sessions and
   * notes become week and weekday offsets, its training blocks the cycles.
   * Done sessions are saved as planned. Races stay out: the next athlete's
   * race is somewhere else.
   */
  async createFromCalendar(
    user: AuthUser,
    dto: CreateTrainingPlanFromCalendarDto,
  ) {
    const athleteId = dto.athleteId ?? user.athlete?.athleteId;
    if (!athleteId) throw new BadRequestException('athleteId is required');
    const ability = await this.abilities.getFor({ user });
    const { timeZone } = await this.athleteOf(ability, athleteId, 'read');

    const firstWeekStart = weekStartOfDateKey(dto.startDate, dto.weekStartsOn);
    const lastWeekStart = weekStartOfDateKey(dto.endDate, dto.weekStartsOn);
    const weeks = daysBetweenDateKeys(firstWeekStart, lastWeekStart) / 7 + 1;
    if (weeks > 52) {
      throw new BadRequestException('A plan has at most 52 weeks');
    }
    const from = startOfZonedDay(dto.startDate, timeZone);
    const to = startOfZonedDay(addDaysToDateKey(dto.endDate, 1), timeZone);

    const [events, cycles] = await Promise.all([
      this.prisma.event.findMany({
        where: {
          AND: [
            { athleteId },
            { type: { in: [EventType.TRAINING, EventType.NOTE] } },
            { startDate: { gte: from, lt: to } },
            accessibleBy(ability, 'read').Event,
          ],
        },
        include: SOURCE_INCLUDE,
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.cycle.findMany({
        where: {
          athleteId,
          kind: CycleKind.TRAINING,
          startDate: { lt: to },
          endDate: { gte: from },
        },
      }),
    ]);

    // Each week goes to the shortest block covering its first day: a plan
    // block inside a season-long one wins
    const blockOfWeek = Array.from({ length: weeks }, (_, index) => {
      const day = startOfZonedDay(
        addDaysToDateKey(firstWeekStart, 7 * index),
        timeZone,
      );
      const covering = cycles
        .filter((cycle) => cycle.startDate <= day && cycle.endDate >= day)
        .sort(
          (a, b) =>
            a.endDate.getTime() -
            a.startDate.getTime() -
            (b.endDate.getTime() - b.startDate.getTime()),
        );
      return covering[0] ?? null;
    });

    const planCycles: TrainingPlanContent['cycles'] = [];
    for (let index = 0; index < weeks; index++) {
      const block = blockOfWeek[index];
      const previous = index > 0 ? blockOfWeek[index - 1] : undefined;
      if (index === 0 || block?.cycleId !== previous?.cycleId) {
        planCycles.push({
          name: block?.name ?? dto.name,
          description: block?.description ?? '',
          phase: (block?.phase as CYCLE_PHASE | null | undefined) ?? null,
          color: block?.color ?? null,
          weeks: [],
        });
      }
      planCycles[planCycles.length - 1].weeks.push({
        weekNumber: index + 1,
        theme: null,
        sessions: [],
      });
    }
    const allWeeks = planCycles.flatMap((cycle) => cycle.weeks);

    for (const event of events) {
      const local = formatZoned(event.startDate, timeZone);
      const date = local.slice(0, 10);
      const weekIndex = Math.floor(
        daysBetweenDateKeys(firstWeekStart, date) / 7,
      );
      const week = allWeeks[weekIndex];
      if (!week) continue;
      week.sessions.push(this.toPlanSession(event, date, local.slice(11, 16)));
    }

    const content = trainingPlanContentSchema.parse({ cycles: planCycles });
    return this.createTemplate(user, {
      name: dto.name,
      description: dto.description,
      goal: dto.goal,
      sport: dto.sport,
      level: dto.level,
      folderId: dto.folderId,
      content,
    });
  }

  // -------------------------------------------------------------------------
  // Applying
  // -------------------------------------------------------------------------

  async previewApply(
    user: AuthUser,
    templateId: number,
    dto: ApplyTrainingPlanDto,
  ): Promise<TrainingPlanApplyPreview[]> {
    const plan = await this.planOfTemplate(user, templateId);
    const ability = await this.abilities.getFor({ user });
    const previews: TrainingPlanApplyPreview[] = [];
    for (const target of dto.targets) {
      const athlete = await this.athleteOf(ability, target.athleteId, 'create');
      previews.push(
        await this.preview(plan, target, dto, athlete.timeZone, athlete.name),
      );
    }
    return previews;
  }

  /** Checks every athlete before applying to any of them */
  async checkApply(
    user: AuthUser,
    templateId: number,
    dto: ApplyTrainingPlanDto,
  ) {
    const plan = await this.planOfTemplate(user, templateId);
    const ability = await this.abilities.getFor({ user });
    for (const target of dto.targets) {
      const { timeZone } = await this.athleteOf(
        ability,
        target.athleteId,
        'create',
      );
      // A missing race fails now, not halfway through a background job
      await this.anchorDate(target, timeZone);
    }
    return plan;
  }

  /**
   * Applies a plan to one athlete: the plan, its cycles, weeks and sessions
   * in one transaction, so a failure leaves nothing behind. The caller has
   * checked that the user may plan for the athlete.
   */
  async applyToAthlete(
    plan: PlanToApply,
    target: TrainingPlanApplyTarget,
    options: ApplyOptions,
  ): Promise<TrainingPlanApplyResult> {
    const athlete = await this.prisma.athlete.findUniqueOrThrow({
      where: { athleteId: target.athleteId },
      select: { user: { select: { timeZone: true } } },
    });
    const timeZone = validTimeZone(athlete.user.timeZone);
    const { range, sessions, anchor } = await this.layOut(
      plan,
      target,
      options,
      timeZone,
    );
    const athleteId = target.athleteId;

    // Zone ids of another athlete become this one's; read before writing
    const workouts = await Promise.all(
      sessions.map(async ({ session }) => {
        const steps = session.workout?.steps;
        if (!steps?.length || session.kind === 'NOTE') return null;
        const parsed = createWorkoutSchema.safeParse({ steps });
        if (!parsed.success) return null;
        return remapZonesForAthlete(
          this.prisma,
          athleteId,
          session.sport,
          parsed.data.steps,
        );
      }),
    );

    const conflicts =
      options.conflictMode === TRAINING_PLAN_CONFLICT_MODE.REPLACE
        ? await this.conflictingSessions(athleteId, range, timeZone)
        : [];

    const startDate = startOfZonedDay(range.startDate, timeZone);
    const endDate = new Date(
      startOfZonedDay(addDaysToDateKey(range.endDate, 1), timeZone).getTime() -
        1,
    );

    const created = await this.prisma.$transaction(
      async (tx) => {
        const trainingPlan = await tx.trainingPlan.create({
          data: {
            athleteId,
            templateId: plan.templateId,
            name: plan.name,
            description: plan.description,
            goal: plan.goal || plan.name,
            startDate,
            endDate,
            status: PlanStatus.ACTIVE,
            // A race fixes the end, whatever the request said
            anchor,
            weekStartsOn: options.weekStartsOn,
          },
        });
        const eventIds: number[] = [];

        let weekIndex = 0;
        for (const [cycleIndex, cycleData] of plan.content.cycles.entries()) {
          const firstWeek = weekIndex;
          const lastWeek = weekIndex + cycleData.weeks.length - 1;
          const cycleStart = this.weekDay(range, firstWeek, 0);
          const cycleEnd = this.weekDay(range, lastWeek, 6);
          // Weeks wholly before the start or after the race make no block
          if (cycleEnd < range.startDate || cycleStart > range.endDate) {
            weekIndex += cycleData.weeks.length;
            continue;
          }
          const cycle = await tx.cycle.create({
            data: {
              athleteId,
              trainingPlanId: trainingPlan.trainingPlanId,
              name: cycleData.name,
              description: cycleData.description,
              phase: cycleData.phase ?? null,
              color: cycleData.color ?? null,
              startDate: this.dayStart(
                maxKey(cycleStart, range.startDate),
                timeZone,
              ),
              endDate: this.dayEnd(minKey(cycleEnd, range.endDate), timeZone),
            },
          });

          for (const weekData of cycleData.weeks) {
            const weekStart = this.weekDay(range, weekIndex, 0);
            const weekEnd = this.weekDay(range, weekIndex, 6);
            if (weekEnd < range.startDate || weekStart > range.endDate) {
              weekIndex++;
              continue;
            }
            const week = await tx.trainingWeek.create({
              data: {
                cycleId: cycle.cycleId,
                weekNumber: weekIndex + 1,
                startDate: this.dayStart(weekStart, timeZone),
                endDate: this.dayEnd(weekEnd, timeZone),
                theme: weekData.theme ?? null,
              },
            });
            for (const [index, dated] of sessions.entries()) {
              if (
                dated.cycleIndex !== cycleIndex ||
                dated.weekIndex !== weekIndex
              )
                continue;
              const event = await tx.event.create({
                data: this.eventData(
                  dated,
                  workouts[index],
                  timeZone,
                  athleteId,
                  trainingPlan.trainingPlanId,
                  week.trainingWeekId,
                ),
                select: { eventId: true },
              });
              eventIds.push(event.eventId);
            }
            weekIndex++;
          }
        }
        return { trainingPlanId: trainingPlan.trainingPlanId, eventIds };
      },
      { timeout: 60_000 },
    );

    // Old sessions go once the plan is saved: a failure keeps both rather
    // than neither
    for (const conflict of conflicts) {
      await this.eventService.removeEvent(conflict.eventId, { notify: false });
    }
    await this.afterSessionsChanged(athleteId, created.eventIds);

    return {
      athleteId,
      trainingPlanId: created.trainingPlanId,
      sessions: created.eventIds.length,
      replaced: conflicts.length,
    };
  }

  /** The website import: same path, weeks starting on the chosen day */
  async applyWebsitePlan(
    user: AuthUser,
    planData: SEOPlanData,
    startDate: string,
  ) {
    const athleteId = user.athlete?.athleteId;
    if (!athleteId) throw new BadRequestException('Athlete ID is required');
    const website = this.fromWebsitePlan(planData);
    return this.applyToAthlete(
      { ...website, templateId: null },
      { athleteId, date: startDate },
      {
        anchor: PLAN_ANCHOR.START,
        weekStartsOn: weekdayOfDateKey(startDate),
        conflictMode: TRAINING_PLAN_CONFLICT_MODE.KEEP,
      },
    );
  }

  async planOfTemplate(
    user: AuthUser,
    templateId: number,
  ): Promise<PlanToApply> {
    const template = await this.findOwnTemplate(user, templateId);
    return {
      name: template.name,
      description: template.description,
      goal: template.goal,
      content: this.readContent(template.content),
      templateId: template.trainingPlanTemplateId,
    };
  }

  // -------------------------------------------------------------------------
  // Applied plans
  // -------------------------------------------------------------------------

  async listApplied(
    user: AuthUser,
    query: AppliedTrainingPlansQuery,
  ): Promise<AppliedTrainingPlan[]> {
    const ability = await this.abilities.getFor({ user });
    const athleteIds = query.athleteId
      ? [query.athleteId]
      : [
          ...(user.athlete ? [user.athlete.athleteId] : []),
          ...(user.coachAthletes ?? []).map((link) => link.athleteId),
        ];
    const readable = athleteIds.filter((athleteId) =>
      ability.can('read', subject('Event', { athleteId } as Event)),
    );
    if (query.athleteId && readable.length === 0) {
      throw new ForbiddenException('You cannot see this athlete');
    }

    const plans = await this.prisma.trainingPlan.findMany({
      where: {
        athleteId: { in: readable },
        ...(!query.includeArchived && {
          status: { not: PlanStatus.ARCHIVED },
        }),
      },
      include: {
        athlete: { select: { user: { select: { timeZone: true } } } },
        cycles: { select: { weeks: { select: { trainingWeekId: true } } } },
        sessions: {
          select: {
            planModifiedAt: true,
            training: { select: { relatedActivityId: true } },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return plans.map((plan) => {
      const timeZone = validTimeZone(plan.athlete.user.timeZone);
      const startDate = zonedClock(plan.startDate, timeZone).date;
      const endDate = zonedClock(plan.endDate, timeZone).date;
      const today = zonedClock(new Date(), timeZone).date;
      const firstWeekStart = weekStartOfDateKey(startDate, plan.weekStartsOn);
      const totalWeeks =
        Math.floor(daysBetweenDateKeys(firstWeekStart, endDate) / 7) + 1;
      return {
        trainingPlanId: plan.trainingPlanId,
        athleteId: plan.athleteId,
        name: plan.name,
        goal: plan.goal,
        status:
          plan.status === PlanStatus.ACTIVE && endDate < today
            ? PlanStatus.COMPLETED
            : plan.status,
        templateId: plan.templateId,
        anchor: (plan.anchor as PLAN_ANCHOR | null) ?? null,
        startDate,
        endDate,
        currentWeek:
          today >= startDate && today <= endDate
            ? currentPlanWeek(firstWeekStart, totalWeeks, today)
            : null,
        weeks: totalWeeks,
        sessions: plan.sessions.length,
        done: plan.sessions.filter(
          (session) => session.training?.relatedActivityId,
        ).length,
        modified: plan.sessions.filter((session) => session.planModifiedAt)
          .length,
      };
    });
  }

  /**
   * Moves what is still to do of an applied plan by whole days, at the same
   * wall clock time: the race moved, the plan follows. Done sessions stay
   * where they were done.
   */
  async shiftApplied(
    user: AuthUser,
    trainingPlanId: number,
    { days }: ShiftTrainingPlanDto,
  ) {
    const { plan, timeZone } = await this.appliedPlanOf(user, trainingPlanId);
    const todayStart = startOfZonedDay(
      zonedClock(new Date(), timeZone).date,
      timeZone,
    );
    const toMove = await this.prisma.event.findMany({
      where: this.stillToDo(trainingPlanId, todayStart),
      include: { training: { include: { workout: true } } },
    });
    const moved = toMove.map((event) => ({
      event,
      startDate: addZonedDays(event.startDate, days, timeZone),
      endDate: addZonedDays(event.endDate, days, timeZone),
    }));
    if (moved.some(({ startDate }) => startDate < todayStart)) {
      throw new BadRequestException(
        'Sessions still to do cannot move into the past',
      );
    }

    const cycles = await this.prisma.cycle.findMany({
      where: { trainingPlanId },
      include: { weeks: true },
    });
    const shift = (date: Date) => addZonedDays(date, days, timeZone);

    await this.prisma.$transaction(async (tx) => {
      for (const { event, startDate, endDate } of moved) {
        await tx.event.update({
          where: { eventId: event.eventId },
          data: { startDate, endDate },
        });
      }
      for (const cycle of cycles) {
        // A block already under way keeps its start
        const started = cycle.startDate < todayStart;
        await tx.cycle.update({
          where: { cycleId: cycle.cycleId },
          data: {
            ...(!started && { startDate: shift(cycle.startDate) }),
            endDate: shift(cycle.endDate),
          },
        });
        for (const week of cycle.weeks) {
          if (week.startDate < todayStart) continue;
          await tx.trainingWeek.update({
            where: { trainingWeekId: week.trainingWeekId },
            data: {
              startDate: shift(week.startDate),
              endDate: shift(week.endDate),
            },
          });
        }
      }
      await tx.trainingPlan.update({
        where: { trainingPlanId },
        data: {
          ...(plan.startDate >= todayStart && {
            startDate: shift(plan.startDate),
          }),
          endDate: shift(plan.endDate),
        },
      });
    });

    await this.afterSessionsChanged(
      plan.athleteId,
      moved.map(({ event }) => event.eventId),
    );
    return { trainingPlanId, moved: moved.length };
  }

  /**
   * Removes an applied plan: its sessions still to do go, with their
   * workouts on the watch; what was done, and what is past, stays as the
   * athlete's history.
   */
  async removeApplied(
    user: AuthUser,
    trainingPlanId: number,
  ): Promise<TrainingPlanRemoveResult> {
    const { plan, timeZone } = await this.appliedPlanOf(user, trainingPlanId);
    const todayStart = startOfZonedDay(
      zonedClock(new Date(), timeZone).date,
      timeZone,
    );
    const toRemove = await this.prisma.event.findMany({
      where: this.stillToDo(trainingPlanId, todayStart),
      select: { eventId: true },
    });
    for (const { eventId } of toRemove) {
      await this.eventService.removeEvent(eventId, { notify: false });
    }

    const kept = await this.prisma.event.count({ where: { trainingPlanId } });
    const beforeToday = new Date(todayStart.getTime() - 1);
    await this.prisma.$transaction(async (tx) => {
      // Weeks cascade with their block; sessions only lose the week
      await tx.cycle.deleteMany({
        where: { trainingPlanId, startDate: { gte: todayStart } },
      });
      await tx.trainingWeek.deleteMany({
        where: { cycle: { trainingPlanId }, startDate: { gte: todayStart } },
      });
      await tx.cycle.updateMany({
        where: { trainingPlanId, endDate: { gte: todayStart } },
        data: { endDate: beforeToday },
      });
      if (kept === 0) {
        await tx.cycle.deleteMany({ where: { trainingPlanId } });
        await tx.trainingPlan.delete({ where: { trainingPlanId } });
      } else {
        await tx.trainingPlan.update({
          where: { trainingPlanId },
          data: {
            status: PlanStatus.ARCHIVED,
            ...(plan.endDate >= todayStart && { endDate: beforeToday }),
          },
        });
      }
    });

    this.calendarWebSocketService?.notifyWeeklyLoadUpdated(plan.athleteId, {
      eventId: toRemove[0]?.eventId ?? 0,
      reason: 'event_deleted',
    });
    return { trainingPlanId, removed: toRemove.length, kept };
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private async findOwnTemplate(user: AuthUser, templateId: number) {
    const template = await this.prisma.trainingPlanTemplate.findFirst({
      where: { trainingPlanTemplateId: templateId, userId: user.userId },
    });
    if (!template) throw new NotFoundException('Training plan not found');
    return template;
  }

  private async checkFolder(user: AuthUser, folderId?: number | null) {
    if (!folderId) return;
    const folder = await this.prisma.eventTemplateFolder.findFirst({
      where: { eventTemplateFolderId: folderId, userId: user.userId },
    });
    if (!folder) throw new NotFoundException('Folder not found');
  }

  private readContent(content: Prisma.JsonValue): TrainingPlanContent {
    return trainingPlanContentSchema.parse(content);
  }

  private toSummary(
    template: {
      trainingPlanTemplateId: number;
      name: string;
      description: string;
      goal: string;
      sport: string | null;
      level: string | null;
      weeks: number;
      folderId: number | null;
      content: Prisma.JsonValue;
      createdAt: Date;
      updatedAt: Date;
    },
    activeApplications: number,
  ): TrainingPlanTemplateSummary {
    const content = template.content as {
      cycles?: { weeks?: { sessions?: unknown[] }[] }[];
    };
    const sessions = (content.cycles ?? []).reduce(
      (total, cycle) =>
        total +
        (cycle.weeks ?? []).reduce(
          (count, week) => count + (week.sessions?.length ?? 0),
          0,
        ),
      0,
    );
    return {
      trainingPlanTemplateId: template.trainingPlanTemplateId,
      name: template.name,
      description: template.description,
      goal: template.goal,
      sport: (template.sport as SPORT_TYPE | null) ?? null,
      level: (template.level as PLAN_LEVEL | null) ?? null,
      weeks: template.weeks,
      sessions,
      folderId: template.folderId,
      activeApplications,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }

  /** The sport most sessions are of, for the library filters */
  private mainSport(content: TrainingPlanContent): SPORT_TYPE | null {
    const counts = new Map<SPORT_TYPE, number>();
    for (const cycle of content.cycles)
      for (const week of cycle.weeks)
        for (const session of week.sessions)
          if (session.kind !== 'NOTE')
            counts.set(session.sport, (counts.get(session.sport) ?? 0) + 1);
    let best: SPORT_TYPE | null = null;
    for (const [sport, count] of counts)
      if (!best || count > (counts.get(best) ?? 0)) best = sport;
    return best;
  }

  private fromWebsitePlan(file: SEOPlanData) {
    return {
      name: file.plan.name,
      description: file.plan.description,
      goal: file.plan.goal,
      sport: file.plan.sportType,
      level: null,
      content: trainingPlanContentSchema.parse({ cycles: file.cycles }),
    };
  }

  private toPlanSession(
    event: Prisma.EventGetPayload<{ include: typeof SOURCE_INCLUDE }>,
    date: string,
    time: string,
  ): PlanSession {
    const dayOfWeek = weekdayOfDateKey(date);
    if (event.type === EventType.NOTE || !event.training) {
      return {
        kind: 'NOTE',
        dayOfWeek,
        startTime: time,
        name: event.name,
        // A note has no sport; any value does, it is never shown
        sport: SPORT_TYPE.OTHER,
        description: event.note?.description ?? '',
      };
    }
    const training = event.training;
    return {
      dayOfWeek,
      startTime: time,
      name: event.name,
      sport: training.sport as SPORT_TYPE,
      description: training.description,
      goalDistance: training.goalDistance,
      goalDuration:
        training.goalDuration ??
        Math.round(
          (event.endDate.getTime() - event.startDate.getTime()) / 1000,
        ),
      goalElevationGain: training.goalElevationGain,
      // Stored from 0 to 1, plans count from 0 to 10
      goalRpe: training.goalRpe != null ? training.goalRpe * 10 : null,
      workout: training.workout
        ? { steps: planSteps(mapPrismaWorkoutToDto(training.workout).steps) }
        : null,
    };
  }

  /** The plan's days and the sessions that fall inside them */
  private async layOut(
    plan: PlanToApply,
    target: TrainingPlanApplyTarget,
    options: ApplyOptions,
    timeZone: string,
  ) {
    const { date, anchor } = await this.anchorDate(target, timeZone);
    const weeks = countPlanWeeks(plan.content.cycles);
    const range = planRange(
      anchor ?? options.anchor,
      date,
      weeks,
      options.weekStartsOn,
    );
    const sessions: DatedSession[] = [];
    let skipped = 0;
    let weekIndex = 0;
    for (const [cycleIndex, cycle] of plan.content.cycles.entries()) {
      for (const week of cycle.weeks) {
        for (const session of week.sessions) {
          const day = planSessionDateKey(
            range,
            weekIndex,
            session.dayOfWeek,
            options.weekStartsOn,
          );
          if (isInRange(range, day)) {
            sessions.push({ session, date: day, cycleIndex, weekIndex });
          } else {
            skipped++;
          }
        }
        weekIndex++;
      }
    }
    return { range, sessions, skipped, anchor: anchor ?? options.anchor };
  }

  /** A race fixes the end of the plan on its day */
  private async anchorDate(
    target: TrainingPlanApplyTarget,
    timeZone: string,
  ): Promise<{ date: string; anchor?: PLAN_ANCHOR }> {
    if (target.date) return { date: target.date };
    const race = await this.prisma.event.findFirst({
      where: {
        eventId: target.raceEventId,
        athleteId: target.athleteId,
        type: EventType.COMPETITION,
      },
      select: { startDate: true },
    });
    if (!race) throw new NotFoundException('Race not found');
    return {
      date: zonedClock(race.startDate, timeZone).date,
      anchor: PLAN_ANCHOR.END,
    };
  }

  private async preview(
    plan: PlanToApply,
    target: TrainingPlanApplyTarget,
    options: ApplyOptions,
    timeZone: string,
    athleteName: string,
  ): Promise<TrainingPlanApplyPreview> {
    const { range, sessions, skipped } = await this.layOut(
      plan,
      target,
      options,
      timeZone,
    );
    const from = startOfZonedDay(range.startDate, timeZone);
    const to = startOfZonedDay(addDaysToDateKey(range.endDate, 1), timeZone);
    const dated = (event: {
      eventId: number;
      name: string;
      startDate: Date;
    }) => ({
      eventId: event.eventId,
      name: event.name,
      date: zonedClock(event.startDate, timeZone).date,
    });

    const [conflicts, races, periods, overlapping] = await Promise.all([
      this.conflictingSessions(target.athleteId, range, timeZone),
      this.prisma.event.findMany({
        where: {
          athleteId: target.athleteId,
          type: EventType.COMPETITION,
          startDate: { gte: from, lt: to },
        },
        select: { eventId: true, name: true, startDate: true },
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.cycle.findMany({
        where: {
          athleteId: target.athleteId,
          kind: { not: CycleKind.TRAINING },
          startDate: { lt: to },
          endDate: { gte: from },
        },
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.trainingPlan.findMany({
        where: {
          athleteId: target.athleteId,
          status: PlanStatus.ACTIVE,
          startDate: { lt: to },
          endDate: { gte: from },
        },
        select: { trainingPlanId: true, name: true },
      }),
    ]);

    return {
      athleteId: target.athleteId,
      athleteName,
      startDate: range.startDate,
      endDate: range.endDate,
      sessions: sessions.length,
      skipped,
      conflicts: conflicts.map(dated),
      races: races.map(dated),
      periods: periods.map((period) => ({
        cycleId: period.cycleId,
        name: period.name,
        kind: period.kind,
        startDate: zonedClock(period.startDate, timeZone).date,
        endDate: zonedClock(period.endDate, timeZone).date,
      })),
      overlappingPlans: overlapping,
    };
  }

  /** Trainings still to do in the plan's days, which REPLACE removes */
  private conflictingSessions(
    athleteId: number,
    range: PlanRange,
    timeZone: string,
  ) {
    return this.prisma.event.findMany({
      where: {
        athleteId,
        type: EventType.TRAINING,
        training: { relatedActivityId: null },
        startDate: {
          gte: startOfZonedDay(range.startDate, timeZone),
          lt: startOfZonedDay(addDaysToDateKey(range.endDate, 1), timeZone),
        },
      },
      select: { eventId: true, name: true, startDate: true },
      orderBy: { startDate: 'asc' },
    });
  }

  private stillToDo(
    trainingPlanId: number,
    todayStart: Date,
  ): Prisma.EventWhereInput {
    return {
      trainingPlanId,
      startDate: { gte: todayStart },
      OR: [
        { type: EventType.NOTE },
        { type: EventType.TRAINING, training: { relatedActivityId: null } },
      ],
    };
  }

  private eventData(
    { session, date }: DatedSession,
    steps: CreateWorkoutStepDto[] | null,
    timeZone: string,
    athleteId: number,
    trainingPlanId: number,
    trainingWeekId: number,
  ): Prisma.EventUncheckedCreateInput {
    const startDate = zonedInstant(
      date,
      session.startTime ?? DEFAULT_START_TIME,
      timeZone,
    );
    const seconds =
      session.kind === 'NOTE'
        ? DEFAULT_SESSION_SECONDS
        : session.goalDuration || DEFAULT_SESSION_SECONDS;
    const base = {
      athleteId,
      trainingPlanId,
      trainingWeekId,
      name: session.name,
      startDate,
      endDate: new Date(startDate.getTime() + seconds * 1000),
    };
    if (session.kind === 'NOTE') {
      return {
        ...base,
        type: EventType.NOTE,
        note: { create: { description: session.description } },
      };
    }
    return {
      ...base,
      type: EventType.TRAINING,
      training: {
        create: {
          sport: session.sport,
          description: session.description,
          goalDistance: session.goalDistance ?? null,
          goalDuration: session.goalDuration ?? null,
          goalElevationGain: session.goalElevationGain ?? null,
          goalRpe: session.goalRpe != null ? session.goalRpe / 10 : null,
          ...(steps?.length && {
            workout: { create: mapWorkoutDtoToPrisma({ steps }) },
          }),
        },
      },
    };
  }

  /**
   * Side effects stay out of the transaction: watch exports through the
   * workout listener, load estimates, and the calendars' weekly load.
   */
  private async afterSessionsChanged(athleteId: number, eventIds: number[]) {
    if (eventIds.length === 0) return;
    const events = await this.prisma.event.findMany({
      where: { eventId: { in: eventIds } },
      include: { training: { include: { workout: true } } },
    });
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    for (const event of events) {
      if (!event.training) continue;
      if (event.training.workout) {
        this.eventService.emitWorkoutPlannedChanged(
          event.eventId,
          athleteId,
          event.training.workout.workoutId,
          event.startDate,
          event.training.sport,
        );
      }
      await this.eventService.computeAndApplyPlannedTrainingLoad(
        event.eventId,
        athleteId,
        event.training.eventTrainingId,
        event.startDate > todayStart,
      );
    }
    this.calendarWebSocketService?.notifyWeeklyLoadUpdated(athleteId, {
      eventId: eventIds[0],
      reason: 'event_updated',
    });
  }

  private async athleteOf(
    ability: Ability,
    athleteId: number,
    action: 'read' | 'create',
  ) {
    if (!ability.can(action, subject('Event', { athleteId } as Event))) {
      throw new ForbiddenException('You cannot plan for this athlete');
    }
    const athlete = await this.prisma.athlete.findUnique({
      where: { athleteId },
      select: {
        user: { select: { timeZone: true, firstName: true, lastName: true } },
      },
    });
    if (!athlete) throw new NotFoundException('Athlete not found');
    return {
      timeZone: validTimeZone(athlete.user.timeZone),
      name: `${athlete.user.firstName} ${athlete.user.lastName}`.trim(),
    };
  }

  private async appliedPlanOf(user: AuthUser, trainingPlanId: number) {
    const plan = await this.prisma.trainingPlan.findUnique({
      where: { trainingPlanId },
      include: {
        athlete: { select: { user: { select: { timeZone: true } } } },
      },
    });
    const ability = await this.abilities.getFor({ user });
    if (
      !plan ||
      !ability.can(
        'update',
        subject('Event', { athleteId: plan.athleteId } as Event),
      )
    ) {
      throw new NotFoundException('Training plan not found');
    }
    if (plan.status === PlanStatus.ARCHIVED) {
      throw new BadRequestException('This plan was removed');
    }
    return { plan, timeZone: validTimeZone(plan.athlete.user.timeZone) };
  }

  /** Day `day` (0-6, counted from the week start) of plan week `weekIndex` */
  private weekDay(range: PlanRange, weekIndex: number, day: number) {
    return addDaysToDateKey(range.firstWeekStart, 7 * weekIndex + day);
  }

  private dayStart(date: string, timeZone: string) {
    return startOfZonedDay(date, timeZone);
  }

  private dayEnd(date: string, timeZone: string) {
    return new Date(
      startOfZonedDay(addDaysToDateKey(date, 1), timeZone).getTime() - 1,
    );
  }
}

type StoredStep = ReturnType<typeof mapPrismaWorkoutToDto>['steps'][number];

/**
 * A stored workout as plan content: without the ids and timestamps of the
 * rows it was read from, which the plan schema refuses.
 */
function planSteps(steps: StoredStep[]): CreateWorkoutStepDto[] {
  return steps.map((step) => {
    const {
      workoutStepId: _id,
      workoutId: _workout,
      repeatParentId: _parent,
      orderIndex: _order,
      createdAt: _created,
      updatedAt: _updated,
      targets,
      repeatBlock,
      ...rest
    } = step;
    return {
      ...rest,
      targets: (targets ?? []).map((target: WorkoutStepTargetDto) => ({
        targetType: target.targetType,
        targetMin: target.targetMin ?? null,
        targetMax: target.targetMax ?? null,
        targetValue: target.targetValue ?? null,
        metricType: target.metricType ?? null,
      })),
      repeatBlock: repeatBlock
        ? {
            repetitions: repeatBlock.repetitions,
            kind: repeatBlock.kind,
            intervalSeconds: repeatBlock.intervalSeconds ?? null,
            timeCapSeconds: repeatBlock.timeCapSeconds ?? null,
            childSteps: planSteps(repeatBlock.childSteps as StoredStep[]),
          }
        : null,
    } as CreateWorkoutStepDto;
  });
}

function maxKey(a: string, b: string) {
  return a > b ? a : b;
}

function minKey(a: string, b: string) {
  return a < b ? a : b;
}
