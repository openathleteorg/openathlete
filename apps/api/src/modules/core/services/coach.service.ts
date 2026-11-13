import { Injectable, Logger } from '@nestjs/common';

import {
  EventType,
  MetricType,
  TrainingLoadCalculationType,
} from '@openathlete/database';
import {
  CoachAlertDto,
  CoachDashboardAthleteRowDto,
  CoachDashboardResponseDto,
  CoachPeriodTotalsDto,
  DASHBOARD_METRIC_TYPES,
  coachDashboardResponseSchema,
  isOutsideThreshold,
} from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { TrainingLoadService } from './training-load.service';

/** No activity for this long makes an athlete inactive */
const INACTIVE_AFTER_DAYS = 7;
/** Pain reported this recently, and not resolved, is still worth a look */
const PAIN_WITHIN_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Daily metrics older than this are not shown, nor alerted on */
const METRIC_RECENT_DAYS = 7;

type Totals = {
  plannedSessions: number;
  completedSessions: number;
  plannedTime: number;
  completedTime: number;
  completedDistance: number;
  averageRpe: number | null;
  rpeSum: number;
  rpeCount: number;
};
const EMPTY_TOTALS: Totals = {
  plannedSessions: 0,
  completedSessions: 0,
  plannedTime: 0,
  completedTime: 0,
  completedDistance: 0,
  averageRpe: null,
  rpeSum: 0,
  rpeCount: 0,
};
const pickTotals = (totals: Totals): CoachPeriodTotalsDto => ({
  plannedSessions: totals.plannedSessions,
  completedSessions: totals.completedSessions,
  completedTime: totals.completedTime,
  completedDistance: totals.completedDistance,
});

@Injectable()
export class CoachService {
  private readonly logger = new Logger(CoachService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly trainingLoad: TrainingLoadService,
  ) {}

  /** Fitness, fatigue and form today; null when the athlete has no load. */
  private async form(user: AuthUser, athleteId: number, now: Date) {
    try {
      const metrics = await this.trainingLoad.getTrainingLoadMetrics(
        user,
        TrainingLoadCalculationType.TRIMP,
        now,
        athleteId,
      );
      if (metrics.ctl === 0 && metrics.atl === 0) return null;
      return {
        ctl: metrics.ctl,
        atl: metrics.atl,
        tsb: metrics.tsb,
      };
    } catch (error) {
      // One athlete's load must not take the whole dashboard down
      this.logger.warn(
        `Form of athlete ${athleteId} unavailable: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  private defaultPeriod(): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 28); // last 4 weeks
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  /** Sessions planned and done, volume and mean RPE, athlete by athlete */
  private async periodTotals(athleteIds: number[], start: Date, end: Date) {
    const [planned, activities] = await Promise.all([
      this.prisma.event.findMany({
        where: {
          athleteId: { in: athleteIds },
          type: EventType.TRAINING,
          startDate: { gte: start, lte: end },
        },
        select: {
          athleteId: true,
          training: { select: { goalDuration: true } },
        },
      }),
      this.prisma.event.findMany({
        where: {
          athleteId: { in: athleteIds },
          type: EventType.ACTIVITY,
          startDate: { gte: start, lte: end },
        },
        select: {
          athleteId: true,
          startDate: true,
          endDate: true,
          activity: { select: { distance: true, rpe: true } },
        },
      }),
    ]);
    const totals = new Map<number, Totals>();
    const of = (athleteId: number) => {
      let entry = totals.get(athleteId);
      if (!entry) {
        entry = { ...EMPTY_TOTALS, rpeSum: 0, rpeCount: 0 };
        totals.set(athleteId, entry);
      }
      return entry;
    };
    for (const event of planned) {
      const entry = of(event.athleteId as number);
      entry.plannedSessions += 1;
      entry.plannedTime += event.training?.goalDuration ?? 0;
    }
    for (const event of activities) {
      const entry = of(event.athleteId as number);
      entry.completedSessions += 1;
      entry.completedTime += Math.max(
        0,
        Math.floor(
          (event.endDate.getTime() - event.startDate.getTime()) / 1000,
        ),
      );
      entry.completedDistance += event.activity?.distance ?? 0;
      if (event.activity?.rpe != null) {
        entry.rpeSum += event.activity.rpe;
        entry.rpeCount += 1;
      }
    }
    for (const entry of totals.values()) {
      entry.averageRpe = entry.rpeCount
        ? Math.round((entry.rpeSum / entry.rpeCount) * 10) / 10
        : null;
    }
    return totals;
  }

  /**
   * The latest value of each metric type per athlete, over the last days:
   * an old weight or a month-old sleep says nothing about this morning.
   */
  private async latestMetrics(
    athleteIds: number[],
    types: MetricType[],
    now: Date,
  ) {
    const rows = await this.prisma.athleteMetric.findMany({
      where: {
        athleteId: { in: athleteIds },
        type: { in: types },
        date: { gte: new Date(now.getTime() - METRIC_RECENT_DAYS * DAY_MS) },
      },
      orderBy: [{ athleteId: 'asc' }, { type: 'asc' }, { date: 'desc' }],
      distinct: ['athleteId', 'type'],
      select: { athleteId: true, type: true, value: true, date: true },
    });
    const byAthlete = new Map<
      number,
      Record<string, { value: number; date: string }>
    >();
    for (const row of rows) {
      const entry = byAthlete.get(row.athleteId) ?? {};
      entry[row.type] = {
        value: row.value,
        date: row.date.toISOString().slice(0, 10),
      };
      byAthlete.set(row.athleteId, entry);
    }
    return byAthlete;
  }

  async getCoachDashboard(
    user: AuthUser,
    period?: { start?: Date; end?: Date },
    options: { comparePrevious?: boolean } = {},
  ): Promise<CoachDashboardResponseDto> {
    // Resolve period
    const { start, end } = (() => {
      if (period?.start && period?.end)
        return { start: period.start, end: period.end };
      return this.defaultPeriod();
    })();

    // Get coached athletes for this user
    const coachedAthletes = await this.prisma.athlete.findMany({
      where: { coachAthletes: { some: { userId: user.userId } } },
      include: {
        user: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const athleteIds = coachedAthletes.map((a) => a.athleteId);
    if (athleteIds.length === 0) {
      return coachDashboardResponseSchema.parse({
        period: { start: start.toISOString(), end: end.toISOString() },
        athletes: [],
      });
    }

    const totals = await this.periodTotals(athleteIds, start, end);
    // The period of the same length just before, to compare with
    const previousTotals = options.comparePrevious
      ? await this.periodTotals(
          athleteIds,
          new Date(start.getTime() - (end.getTime() - start.getTime()) - 1),
          new Date(start.getTime() - 1),
        )
      : null;

    const now = new Date();
    const athleteUserIds = coachedAthletes.map((a) => a.userId);
    const [lastActivities, injuries, unread, forms] = await Promise.all([
      // The latest activity ever: an inactive athlete has none in the period
      this.prisma.event.groupBy({
        by: ['athleteId'],
        where: {
          athleteId: { in: athleteIds },
          type: EventType.ACTIVITY,
          startDate: { lte: now },
        },
        _max: { endDate: true },
      }),
      this.prisma.athleteInjury.findMany({
        where: {
          athleteId: { in: athleteIds },
          status: { not: 'RESOLVED' },
          updatedAt: {
            gte: new Date(now.getTime() - PAIN_WITHIN_DAYS * DAY_MS),
          },
        },
        orderBy: { painScore: 'desc' },
        select: { athleteId: true, location: true, painScore: true },
      }),
      // Messages from each athlete, in conversations the coach is part of
      this.prisma.message.groupBy({
        by: ['senderId'],
        where: {
          senderId: { in: athleteUserIds },
          thread: { participants: { some: { userId: user.userId } } },
          readReceipts: { none: { userId: user.userId } },
        },
        _count: { _all: true },
      }),
      Promise.all(athleteIds.map((id) => this.form(user, id, now))),
    ]);
    const thresholds = await this.prisma.coachMetricThreshold.findMany({
      where: { coachUserId: user.userId, athleteId: { in: athleteIds } },
      select: { athleteId: true, metricType: true, min: true, max: true },
    });
    const metrics = await this.latestMetrics(
      athleteIds,
      [
        ...new Set<MetricType>([
          ...(DASHBOARD_METRIC_TYPES as readonly MetricType[]),
          ...thresholds.map((threshold) => threshold.metricType),
        ]),
      ],
      now,
    );

    // Build rows
    const rows: CoachDashboardAthleteRowDto[] = coachedAthletes.map(
      (a, index) => {
        const lastActivity =
          lastActivities.find((l) => l.athleteId === a.athleteId)?._max
            .endDate ?? null;
        const form = forms[index];
        const alerts: CoachAlertDto[] = [];
        const pain = injuries.find((i) => i.athleteId === a.athleteId);
        if (pain) {
          alerts.push({
            type: 'pain',
            location: pain.location,
            painScore: pain.painScore,
          });
        }
        const idleDays = lastActivity
          ? Math.floor((now.getTime() - lastActivity.getTime()) / DAY_MS)
          : null;
        if (idleDays === null || idleDays >= INACTIVE_AFTER_DAYS) {
          alerts.push({ type: 'inactive', days: idleDays });
        }
        const own = totals.get(a.athleteId) ?? EMPTY_TOTALS;
        const latest = metrics.get(a.athleteId) ?? {};
        for (const threshold of thresholds) {
          if (threshold.athleteId !== a.athleteId) continue;
          const reading = latest[threshold.metricType];
          if (!reading) continue;
          if (isOutsideThreshold(reading.value, threshold)) {
            alerts.push({
              type: 'threshold',
              metricType: threshold.metricType,
              value: reading.value,
              min: threshold.min,
              max: threshold.max,
              date: reading.date,
            });
          }
        }
        const compliance =
          own.plannedSessions > 0
            ? Math.round((own.completedSessions / own.plannedSessions) * 100)
            : 0;
        return {
          athleteId: a.athleteId,
          firstName: a.user?.firstName ?? null,
          lastName: a.user?.lastName ?? null,
          email: a.user?.email ?? null,
          start: start.toISOString(),
          end: end.toISOString(),
          plannedSessions: own.plannedSessions,
          completedSessions: own.completedSessions,
          plannedTime: own.plannedTime,
          completedTime: own.completedTime,
          completedDistance: own.completedDistance,
          lastActivityAt: lastActivity?.toISOString() ?? null,
          compliancePercent: compliance,
          form,
          alerts,
          unreadMessages:
            unread.find((u) => u.senderId === a.userId)?._count._all ?? 0,
          averageRpe: own.averageRpe,
          metrics: latest,
          previous: previousTotals
            ? pickTotals(previousTotals.get(a.athleteId) ?? EMPTY_TOTALS)
            : null,
        };
      },
    );

    // Athletes who need attention first
    rows.sort(
      (a, b) =>
        b.alerts.length - a.alerts.length ||
        `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`,
        ),
    );

    return coachDashboardResponseSchema.parse({
      period: { start: start.toISOString(), end: end.toISOString() },
      athletes: rows,
    });
  }
}
