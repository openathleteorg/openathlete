import { Injectable, Logger } from '@nestjs/common';

import { ConnectorProvider, MetricType } from '@openathlete/database';
import type { NormalizedWorkout } from '@openathlete/shared';
import { mapPrismaWorkoutToDto } from '@openathlete/shared';

import { PrismaService } from '../../prisma/services/prisma.service';
import {
  COROS_SPORT,
  CorosCourse,
  corosSportType,
  mapWorkoutToCorosCourse,
} from '../mapping/coros-course.mapper';
import { parseIdInPlan } from '../mapping/coros-text.parser';
import type { SuuntoZone } from '../mapping/suunto-guide.mapper';
import type {
  DeletePlannedWorkoutInput,
  ProviderAdapter,
  UpsertPlannedWorkoutInput,
  UpsertPlannedWorkoutResult,
} from '../provider-adapter.interface';
import { CorosProviderService } from '../providers/coros.provider.service';

/** Metrics that percentage targets refer to */
const REFERENCE_METRICS: MetricType[] = [
  MetricType.VMA,
  MetricType.FTP_RUNNING,
  MetricType.FTP_CYCLING,
  MetricType.CRITICAL_POWER_RUNNING,
  MetricType.CRITICAL_POWER_CYCLING,
  MetricType.HR_MAX,
  MetricType.HR_REST,
  MetricType.HR_RESERVE,
];

const compact = (date: string) => date.replaceAll('-', '');

/**
 * Sessions on the COROS calendar. They are named by date and idInPlan, a
 * counter that isn't unique on its own and may change with each update. The
 * MCP server can neither move nor delete one, so a write must not be repeated
 * blindly: a duplicate only goes away by hand in the COROS app.
 */
@Injectable()
export class CorosAdapter implements ProviderAdapter {
  private readonly logger = new Logger(CorosAdapter.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly corosProviderService: CorosProviderService,
  ) {}

  getProvider(): 'coros' {
    return 'coros';
  }

  canExport(normalized: NormalizedWorkout): boolean {
    return corosSportType(normalized.sport) !== null;
  }

  private findAccount(athleteId: number) {
    return this.prisma.providerAccount.findFirst({
      where: {
        athleteId,
        provider: ConnectorProvider.COROS,
        status: 'active',
      },
    });
  }

  private async buildCourse(
    input: UpsertPlannedWorkoutInput,
  ): Promise<CorosCourse> {
    const workout = await this.prisma.workout.findUnique({
      where: { workoutId: input.workoutId },
      include: {
        steps: {
          include: {
            targets: true,
            repeatBlock: {
              include: {
                childSteps: {
                  include: { targets: true },
                  orderBy: { orderIndex: 'asc' },
                },
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
    if (!workout) throw new Error('Workout not found');

    const [metrics, zones] = await Promise.all([
      this.prisma.athleteMetric.findMany({
        where: { athleteId: input.athleteId, type: { in: REFERENCE_METRICS } },
        orderBy: [{ type: 'asc' }, { date: 'desc' }],
        distinct: ['type'],
        select: { type: true, value: true },
      }),
      this.prisma.trainingZone.findMany({
        where: { athleteId: input.athleteId },
        select: {
          trainingZoneId: true,
          type: true,
          values: { select: { min: true, max: true, sports: true } },
        },
      }),
    ]);

    const course = mapWorkoutToCorosCourse(
      mapPrismaWorkoutToDto(workout),
      input.normalized.sport,
      input.normalized.title ?? null,
      input.normalized.description ?? null,
      {
        metrics: Object.fromEntries(
          metrics.map((metric) => [metric.type, { value: metric.value }]),
        ),
        zones: zones as SuuntoZone[],
      },
    );
    if (!course) throw new Error('Workout has nothing to send to COROS');
    return course;
  }

  /**
   * The id of a session of this name already on that date: an earlier send
   * may have gone through without us getting the answer.
   */
  private async findScheduled(
    account: Parameters<CorosProviderService['callTool']>[0],
    date: string,
    name: string,
  ): Promise<string | null> {
    const text = await this.corosProviderService.callTool(
      account,
      'queryTrainingSchedule',
      { startDate: date, endDate: date },
    );
    const position = text.indexOf(name);
    return position < 0 ? null : parseIdInPlan(text.slice(position));
  }

  async upsertPlannedWorkout(
    input: UpsertPlannedWorkoutInput,
  ): Promise<UpsertPlannedWorkoutResult> {
    const account = await this.findAccount(input.athleteId);
    if (!account) throw new Error('No active COROS account found for athlete');

    const course = await this.buildCourse(input);
    const date = compact(input.date);

    // The id only means something on the date it was given for
    const idInPlan =
      (input.previousScheduleId === date ? input.previousExternalId : null) ??
      (await this.findScheduled(account, date, course.courseName));

    const text = idInPlan
      ? await this.corosProviderService.callTool(
          account,
          'updateScheduledWorkout',
          { date, idInPlan, course },
        )
      : await this.corosProviderService.callTool(
          account,
          'createScheduledWorkout',
          { date, course },
        );

    const externalId = parseIdInPlan(text) ?? idInPlan;
    if (!externalId) {
      // The next run finds it by name instead of sending a second copy
      throw new Error('COROS gave no id for the workout it saved');
    }
    return { externalId, scheduleId: date };
  }

  /**
   * COROS can't delete a session yet. Rather than leaving a stale workout on
   * the watch, turn it into one that says so, for the athlete to remove.
   */
  async deletePlannedWorkout(input: DeletePlannedWorkoutInput): Promise<void> {
    if (!input.externalId || !input.date) return;
    if (input.date < new Date().toISOString().slice(0, 10)) return;

    const account = await this.findAccount(input.athleteId);
    if (!account) return;

    const course: CorosCourse = {
      sportType: COROS_SPORT.RUNNING,
      courseName: 'Cancelled in OpenAthlete',
      courseDescription:
        'This session moved or was removed in OpenAthlete. Delete it in the COROS app.',
      sections: [{ sectionType: 2, targetType: 4 }],
    };
    await this.corosProviderService.callTool(
      account,
      'updateScheduledWorkout',
      { date: compact(input.date), idInPlan: input.externalId, course },
    );
    this.logger.debug(
      `Marked COROS session ${input.externalId} as cancelled for athlete ${input.athleteId}`,
    );
  }
}
