import { Injectable } from '@nestjs/common';

import { event_type } from '@openathlete/database';
import {
  CoachDashboardAthleteRowDto,
  CoachDashboardResponseDto,
  coachDashboardResponseSchema,
} from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class CoachService {
  constructor(
    private prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
  ) {}

  private defaultPeriod(): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 28); // last 4 weeks
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  async getCoachDashboard(
    user: AuthUser,
    period?: { start?: Date; end?: Date },
  ): Promise<CoachDashboardResponseDto> {
    // Resolve period
    const { start, end } = (() => {
      if (period?.start && period?.end)
        return { start: period.start, end: period.end };
      return this.defaultPeriod();
    })();

    // Get coached athletes for this user
    const coachedAthletes = await this.prisma.athlete.findMany({
      where: { coach_athletes: { some: { user_id: user.user_id } } },
      include: {
        user: { select: { first_name: true, last_name: true, email: true } },
      },
    });

    const athleteIds = coachedAthletes.map((a) => a.athlete_id);
    if (athleteIds.length === 0) {
      return coachDashboardResponseSchema.parse({
        period: { start: start.toISOString(), end: end.toISOString() },
        athletes: [],
      });
    }

    // Planned training sessions within period
    const plannedByAthlete = await this.prisma.event.groupBy({
      by: ['athlete_id'],
      where: {
        athlete_id: { in: athleteIds },
        type: event_type.TRAINING,
        start_date: { gte: start, lte: end },
      },
      _count: { _all: true },
    });

    // Planned time: sum of workout estimated_duration when available
    const plannedTimeByAthleteRaw = await this.prisma.event.findMany({
      where: {
        athlete_id: { in: athleteIds },
        type: event_type.TRAINING,
        start_date: { gte: start, lte: end },
      },
      select: {
        athlete_id: true,
        training: {
          select: {
            workout: { select: { estimated_duration: true } },
          },
        },
      },
    });

    const plannedTimeByAthlete = plannedTimeByAthleteRaw.reduce(
      (acc, e) => {
        const aid = e.athlete_id as number;
        const duration = e.training?.workout?.estimated_duration ?? 0;
        acc[aid] = (acc[aid] || 0) + duration;
        return acc;
      },
      {} as Record<number, number>,
    );

    // Completed activity events within period with activity details
    const activities = await this.prisma.event.findMany({
      where: {
        athlete_id: { in: athleteIds },
        type: event_type.ACTIVITY,
        start_date: { gte: start, lte: end },
      },
      select: {
        athlete_id: true,
        start_date: true,
        end_date: true,
        activity: { select: { distance: true } },
      },
    });

    const completedByAthlete: Record<
      number,
      { count: number; time: number; distance: number; lastAt: string | null }
    > = {};
    for (const ev of activities) {
      const aid = ev.athlete_id as number;
      const startTs = new Date(ev.start_date).getTime();
      const endTs = new Date(ev.end_date).getTime();
      const time = Math.max(0, Math.floor((endTs - startTs) / 1000));
      const distance = ev.activity?.distance ?? 0;
      const iso = new Date(ev.end_date).toISOString();
      if (!completedByAthlete[aid]) {
        completedByAthlete[aid] = {
          count: 0,
          time: 0,
          distance: 0,
          lastAt: null,
        };
      }
      completedByAthlete[aid].count += 1;
      completedByAthlete[aid].time += time;
      completedByAthlete[aid].distance += distance;
      const prev = completedByAthlete[aid].lastAt;
      completedByAthlete[aid].lastAt = !prev || iso > prev ? iso : prev;
    }

    // Build rows
    const rows: CoachDashboardAthleteRowDto[] = coachedAthletes.map((a) => {
      const plannedCount =
        plannedByAthlete.find((p) => p.athlete_id === a.athlete_id)?._count
          ._all || 0;
      const plannedTime = plannedTimeByAthlete[a.athlete_id] || 0;
      const completed = completedByAthlete[a.athlete_id] || {
        count: 0,
        time: 0,
        distance: 0,
        lastAt: null,
      };
      const compliance =
        plannedCount > 0
          ? Math.round((completed.count / plannedCount) * 100)
          : 0;
      return {
        athleteId: a.athlete_id,
        firstName: a.user?.first_name ?? null,
        lastName: a.user?.last_name ?? null,
        email: a.user?.email ?? null,
        start: start.toISOString(),
        end: end.toISOString(),
        plannedSessions: plannedCount,
        completedSessions: completed.count,
        plannedTime: plannedTime,
        completedTime: completed.time,
        completedDistance: completed.distance,
        lastActivityAt: completed.lastAt,
        compliancePercent: compliance,
      };
    });

    return coachDashboardResponseSchema.parse({
      period: { start: start.toISOString(), end: end.toISOString() },
      athletes: rows,
    });
  }
}
