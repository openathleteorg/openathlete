import { subject } from '@casl/ability';
import { randomUUID } from 'node:crypto';

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CycleKind,
  MetricType,
  Event as PrismaEvent,
} from '@openathlete/database';
import {
  PlanForAthletesDto,
  PlanForAthletesPreviewAthleteDto,
  PlanForAthletesPreviewDto,
  PlanForAthletesResultDto,
  PlanForAthletesSource,
  UndoEventBatchResultDto,
  startOfDay,
} from '@openathlete/shared';

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
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { requireLibraryItem } from '../helpers/template-library';
import { remapZonesForAthlete, zoneTargetIds } from '../helpers/workout-zones';
import { EventBulkService } from './event-bulk.service';
import {
  SHIFTABLE_TYPES,
  SOURCE_INCLUDE,
  SourceEvent,
  WorkoutSteps,
  copyTo,
  stepsOf,
} from './event-copy';
import { EventService } from './event.service';

const UNAVAILABLE_KINDS = [
  CycleKind.ILLNESS,
  CycleKind.INJURY,
  CycleKind.TRAVEL,
] as const;

/** Local date and time of an instant: { date: '2026-11-13', time: '18:30' } */
function localClock(instant: Date, timeZone: string) {
  const zoned = formatZoned(instant, timeZone);
  return { date: zoned.slice(0, 10), time: zoned.slice(11, 16) };
}

const daysBetween = (from: string, to: string) =>
  Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86_400_000,
  );

/** One session of the plan, placed relative to the first one */
type Slot = {
  event: SourceEvent;
  dayOffset: number;
  time: string;
  durationMs: number;
};

type TargetAthlete = {
  athleteId: number;
  firstName: string;
  lastName: string;
  timeZone: string;
};

/** The metrics percentage targets refer to: "95% VMA" needs a VMA */
function referencedMetrics(steps: WorkoutSteps | null): Set<string> {
  const metrics = new Set<string>();
  type Step = {
    targets?: { metricType?: string | null }[] | null;
    repeatBlock?: { childSteps?: Step[] | null } | null;
  };
  const visit = (step: Step) => {
    for (const target of step.targets ?? []) {
      if (target.metricType) metrics.add(target.metricType);
    }
    (step.repeatBlock?.childSteps ?? []).forEach(visit);
  };
  ((steps ?? []) as Step[]).forEach(visit);
  return metrics;
}

/**
 * Plans the same sessions for several athletes at once: from a template, or
 * from sessions of one calendar (copied days). Every copy is an ordinary
 * session of its athlete, with their own zones; percentage targets follow
 * their own thresholds when shown and sent to the watch. The copies share a
 * batch id, to undo the whole operation.
 */
@Injectable()
export class EventBatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
    private readonly eventService: EventService,
    private readonly eventBulkService: EventBulkService,
  ) {}

  private async loadSources(
    user: AuthUser,
    source: PlanForAthletesSource,
  ): Promise<SourceEvent[]> {
    if (source.kind === 'template') {
      const template = await this.prisma.eventTemplate.findUnique({
        where: { eventTemplateId: source.eventTemplateId },
        include: { event: { include: SOURCE_INCLUDE } },
      });
      // The user's own templates, and those of their clubs' libraries
      await requireLibraryItem(this.prisma, user.userId, template, 'use');
      if (!template?.event) {
        throw new NotFoundException('Event template not found');
      }
      return [template.event];
    }

    const ability = await this.abilities.getFor({ user });
    const events = await this.prisma.event.findMany({
      where: {
        AND: [
          { eventId: { in: source.eventIds } },
          { type: { in: SHIFTABLE_TYPES } },
          accessibleBy(ability, 'read').Event,
        ],
      },
      include: SOURCE_INCLUDE,
      orderBy: { startDate: 'asc' },
    });
    if (events.length !== new Set(source.eventIds).size) {
      throw new NotFoundException('Some events cannot be copied');
    }
    return events;
  }

  /** Where each session lands, relative to the day of the first one */
  private slots(sources: SourceEvent[], dto: PlanForAthletesDto): Slot[] {
    const placed = sources.map((event) => {
      const timeZone = validTimeZone(
        event.athlete?.user.timeZone ?? dto.timeZone,
      );
      return { event, ...localClock(event.startDate, timeZone) };
    });
    const first = placed.reduce(
      (min, slot) => (slot.date < min ? slot.date : min),
      placed[0].date,
    );
    return placed.map(({ event, date, time }) => ({
      event,
      dayOffset: daysBetween(first, date),
      time: dto.time ?? time,
      durationMs: Math.max(
        0,
        event.endDate.getTime() - event.startDate.getTime(),
      ),
    }));
  }

  /** The athletes, each one the coach may plan for: all or nothing */
  private async loadAthletes(
    user: AuthUser,
    dto: PlanForAthletesDto,
  ): Promise<TargetAthlete[]> {
    const ability = await this.abilities.getFor({ user });
    const ids = [...new Set(dto.athleteIds)];
    for (const athleteId of ids) {
      if (
        !ability.can('create', subject('Event', { athleteId } as PrismaEvent))
      ) {
        throw new ForbiddenException(
          'You are not allowed to plan for some of these athletes',
        );
      }
    }
    const athletes = await this.prisma.athlete.findMany({
      where: { athleteId: { in: ids } },
      select: {
        athleteId: true,
        user: { select: { firstName: true, lastName: true, timeZone: true } },
      },
    });
    if (athletes.length !== ids.length) {
      throw new NotFoundException('Athlete not found');
    }
    const byId = new Map(athletes.map((a) => [a.athleteId, a]));
    return ids.map((athleteId) => {
      const { user: person } = byId.get(athleteId)!;
      return {
        athleteId,
        firstName: person.firstName,
        lastName: person.lastName,
        timeZone: validTimeZone(person.timeZone ?? dto.timeZone),
      };
    });
  }

  private datesFor(
    slot: Slot,
    athlete: TargetAthlete,
    dto: PlanForAthletesDto,
  ) {
    const startDate = zonedInstant(
      addDaysToDateKey(dto.date, slot.dayOffset),
      slot.time,
      athlete.timeZone,
    );
    return {
      startDate,
      endDate: new Date(startDate.getTime() + slot.durationMs),
    };
  }

  /** The workout of a session with the athlete's own zones */
  private async stepsFor(slot: Slot, athleteId: number) {
    const steps = stepsOf(slot.event);
    if (!steps) return null;
    return remapZonesForAthlete(
      this.prisma,
      athleteId,
      slot.event.training?.sport,
      steps,
    );
  }

  async preview(
    user: AuthUser,
    dto: PlanForAthletesDto,
  ): Promise<PlanForAthletesPreviewDto> {
    const sources = await this.loadSources(user, dto.source);
    const slots = this.slots(sources, dto);
    const athletes = await this.loadAthletes(user, dto);
    const lastOffset = Math.max(...slots.map((slot) => slot.dayOffset));
    const dates = [
      ...new Set(
        slots.map((slot) => addDaysToDateKey(dto.date, slot.dayOffset)).sort(),
      ),
    ];
    const metrics = new Set(
      slots.flatMap((slot) => [...referencedMetrics(stepsOf(slot.event))]),
    );
    const zoneTargetCount = slots.reduce(
      (count, slot) => count + zoneTargetIds(stepsOf(slot.event) ?? []).length,
      0,
    );

    const rows: PlanForAthletesPreviewAthleteDto[] = [];
    for (const athlete of athletes) {
      const from = startOfZonedDay(dto.date, athlete.timeZone);
      const to = startOfZonedDay(
        addDaysToDateKey(dto.date, lastOffset + 1),
        athlete.timeZone,
      );
      const [known, planned, periods] = await Promise.all([
        metrics.size
          ? this.prisma.athleteMetric.findMany({
              where: {
                athleteId: athlete.athleteId,
                type: { in: [...metrics] as MetricType[] },
              },
              distinct: ['type'],
              select: { type: true },
            })
          : [],
        this.prisma.event.findMany({
          where: {
            athleteId: athlete.athleteId,
            type: { in: ['TRAINING', 'COMPETITION'] },
            startDate: { gte: from, lt: to },
          },
          select: { startDate: true },
        }),
        this.prisma.cycle.findMany({
          where: {
            athleteId: athlete.athleteId,
            kind: { in: [...UNAVAILABLE_KINDS] },
            startDate: { lt: to },
            endDate: { gte: from },
          },
          select: { kind: true },
        }),
      ]);

      let remappedZones = 0;
      if (zoneTargetCount > 0) {
        for (const slot of slots) {
          remappedZones += zoneTargetIds(
            (await this.stepsFor(slot, athlete.athleteId)) ?? [],
          ).length;
        }
      }

      const landing = new Set(dates);
      const knownTypes = new Set<string>(known.map((metric) => metric.type));
      rows.push({
        athleteId: athlete.athleteId,
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        missingMetrics: [...metrics].filter((type) => !knownTypes.has(type)),
        missingZones: remappedZones < zoneTargetCount,
        sameDayEvents: planned.filter((event) =>
          landing.has(localClock(event.startDate, athlete.timeZone).date),
        ).length,
        unavailable: [
          ...new Set(
            periods.map(
              (period) => period.kind as (typeof UNAVAILABLE_KINDS)[number],
            ),
          ),
        ],
      });
    }

    return { eventCount: slots.length, dates, athletes: rows };
  }

  async plan(
    user: AuthUser,
    dto: PlanForAthletesDto,
  ): Promise<PlanForAthletesResultDto> {
    const sources = await this.loadSources(user, dto.source);
    const slots = this.slots(sources, dto);
    const athletes = await this.loadAthletes(user, dto);
    const batchId = randomUUID();

    // Zones are read before the transaction: the copies are written at once
    const inputs = [];
    for (const athlete of athletes) {
      for (const slot of slots) {
        inputs.push(
          copyTo(slot.event, {
            athleteId: athlete.athleteId,
            ...this.datesFor(slot, athlete, dto),
            steps: await this.stepsFor(slot, athlete.athleteId),
            // Another athlete, another load: estimated again below
            keepLoad: false,
            batchId,
          }),
        );
      }
    }
    const created = await this.prisma.$transaction(
      inputs.map((data) =>
        this.prisma.event.create({ data, select: { eventId: true } }),
      ),
    );
    const eventIds = created.map(({ eventId }) => eventId);

    const copies = await this.eventBulkService.reload(eventIds);
    this.eventBulkService.afterChange(copies);
    const today = startOfDay(new Date());
    for (const copy of copies) {
      if (copy.type !== 'TRAINING' || !copy.training || !copy.athleteId) {
        continue;
      }
      await this.eventService.computeAndApplyPlannedTrainingLoad(
        copy.eventId,
        copy.athleteId,
        copy.training.eventTrainingId,
        copy.startDate > today,
      );
    }

    return { batchId, eventIds };
  }

  /**
   * Deletes the sessions of an operation the user may still delete. Those
   * already done (an activity is linked) stay: they are history now.
   */
  async undo(
    user: AuthUser,
    batchId: string,
  ): Promise<UndoEventBatchResultDto> {
    const ability = await this.abilities.getFor({ user });
    const batch = await this.prisma.event.findMany({
      where: { batchId },
      select: {
        eventId: true,
        training: { select: { relatedActivityId: true } },
        competition: { select: { relatedActivityId: true } },
      },
    });
    if (batch.length === 0) throw new NotFoundException('Batch not found');

    const deletable = await this.prisma.event.findMany({
      where: {
        AND: [{ batchId }, accessibleBy(ability, 'delete').Event],
      },
      select: { eventId: true },
    });
    if (deletable.length === 0) throw new NotFoundException('Batch not found');
    const allowed = new Set(deletable.map((event) => event.eventId));

    let deleted = 0;
    for (const event of batch) {
      const done =
        event.training?.relatedActivityId ||
        event.competition?.relatedActivityId;
      if (!allowed.has(event.eventId) || done) continue;
      await this.eventService.removeEvent(event.eventId);
      deleted++;
    }
    return { deleted, kept: batch.length - deleted };
  }
}
