import { subject } from '@casl/ability';

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  Athlete,
  Event,
  EventActivity,
  Prisma,
  RecordExclusion,
  SportType,
} from '@openathlete/database';
import {
  BestRecordDto,
  CreateRecordExclusionDto,
  GetRecordEffortsQueryDto,
  RECORD_TYPE,
  RecordEffortDto,
  RecordExclusionDto,
  RecordHistoryDto,
  YearBestRecordDto,
} from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

interface BestRecordRow {
  record_id: number;
  type: string;
  distance: number | null;
  duration: number | null;
  value: number;
  date: Date;
  event_id: number | null;
  activity_name: string | null;
}

interface EffortRow extends BestRecordRow {
  event_activity_id: number;
  exclusion_id: number | null;
}

// Keeps the records an exclusion does not cover
const notExcluded = Prisma.sql`NOT EXISTS (
  SELECT 1 FROM record_exclusion x
  WHERE x.event_activity_id = r.event_activity_id
    AND (x.type IS NULL OR (x.type = r.type AND (
      (x.distance IS NULL AND x.duration IS NULL)
      OR x.distance = r.distance OR x.duration = r.duration))))`;

// Pace records hold a time: lower is better
const bestFirst = Prisma.sql`CASE WHEN r.type = 'SPEED' THEN r.value ELSE -r.value END`;

const toBestRecord = (row: BestRecordRow): BestRecordDto => ({
  recordId: row.record_id,
  type: row.type as RECORD_TYPE,
  distance: row.distance,
  duration: row.duration,
  value: row.value,
  date: row.date,
  eventId: row.event_id,
  activityName: row.activity_name,
});

const toEffort = (row: EffortRow): RecordEffortDto => ({
  ...toBestRecord(row),
  eventActivityId: row.event_activity_id,
  exclusionId: row.exclusion_id,
});

const toExclusion = (
  exclusion: RecordExclusion & {
    eventActivity: EventActivity & { event: Event };
  },
): RecordExclusionDto => ({
  recordExclusionId: exclusion.recordExclusionId,
  eventActivityId: exclusion.eventActivityId,
  eventId: exclusion.eventActivity.eventId,
  activityName: exclusion.eventActivity.event.name,
  date: exclusion.eventActivity.event.startDate,
  type: exclusion.type as RECORD_TYPE | null,
  distance: exclusion.distance,
  duration: exclusion.duration,
});

@Injectable()
export class RecordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
  ) {}

  /** The athlete whose records the user asked for, once allowed to read them. */
  private async targetAthleteId(
    user: AuthUser,
    athleteId?: Athlete['athleteId'],
  ): Promise<number> {
    if (!athleteId) {
      if (!user.athlete?.athleteId) {
        throw new NotFoundException('Athlete not found');
      }
      return user.athlete.athleteId;
    }

    const athlete = await this.prisma.athlete.findUnique({
      where: { athleteId },
    });
    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }
    const ability = await this.abilities.getFor({ user });
    if (!ability.can('read', subject('Athlete', athlete))) {
      throw new ForbiddenException('Not allowed to access this athlete');
    }
    return athleteId;
  }

  /**
   * Sports with records, the most frequent first: a records curve only
   * makes sense for one sport.
   */
  async getRecordSports(
    user: AuthUser,
    athleteId?: Athlete['athleteId'],
  ): Promise<SportType[]> {
    const targetAthleteId = await this.targetAthleteId(user, athleteId);
    const rows = await this.prisma.$queryRaw<{ sport: SportType }[]>`
      SELECT a.sport FROM record r
      JOIN event_activity a ON a.event_activity_id = r.event_activity_id
      WHERE r.athlete_id = ${targetAthleteId}
      GROUP BY a.sport
      ORDER BY count(DISTINCT a.event_activity_id) DESC, a.sport`;
    return rows.map((row) => row.sport);
  }

  /**
   * Best record at each distance or duration, for one sport, among the
   * activities between `from` (included) and `to` (excluded).
   */
  async getRecords(
    user: AuthUser,
    {
      sport,
      athleteId,
      from,
      to,
    }: {
      sport?: SportType;
      athleteId?: Athlete['athleteId'];
      from?: Date;
      to?: Date;
    },
  ): Promise<BestRecordDto[]> {
    const targetAthleteId = await this.targetAthleteId(user, athleteId);

    // Keeps the best of each record kind
    const rows = await this.prisma.$queryRaw<BestRecordRow[]>`
      SELECT DISTINCT ON (r.type, r.distance, r.duration)
        r.record_id, r.type, r.distance, r.duration, r.value, r.date,
        a.event_id, e.name AS activity_name
      FROM record r
      LEFT JOIN event_activity a
        ON a.event_activity_id = r.event_activity_id
      LEFT JOIN event e ON e.event_id = a.event_id
      WHERE r.athlete_id = ${targetAthleteId}
        AND ${notExcluded}
        ${sport ? Prisma.sql`AND a.sport = ${sport}::sport_type` : Prisma.empty}
        ${from ? Prisma.sql`AND r.date >= ${from}` : Prisma.empty}
        ${to ? Prisma.sql`AND r.date < ${to}` : Prisma.empty}
      ORDER BY r.type, r.distance, r.duration, ${bestFirst}`;

    return rows.map(toBestRecord);
  }

  /** What the records page reads for a sport, in one round trip. */
  async getHistory(
    user: AuthUser,
    {
      sport,
      athleteId,
    }: { sport: SportType; athleteId?: Athlete['athleteId'] },
  ): Promise<RecordHistoryDto> {
    const targetAthleteId = await this.targetAthleteId(user, athleteId);

    const [years, podium] = await Promise.all([
      this.prisma.$queryRaw<(BestRecordRow & { year: number })[]>`
        SELECT DISTINCT ON (year, r.type, r.distance, r.duration)
          EXTRACT(YEAR FROM r.date)::int AS year,
          r.record_id, r.type, r.distance, r.duration, r.value, r.date,
          a.event_id, e.name AS activity_name
        FROM record r
        JOIN event_activity a ON a.event_activity_id = r.event_activity_id
        LEFT JOIN event e ON e.event_id = a.event_id
        WHERE r.athlete_id = ${targetAthleteId}
          AND a.sport = ${sport}::sport_type
          AND ${notExcluded}
        ORDER BY year, r.type, r.distance, r.duration, ${bestFirst}`,
      this.prisma.$queryRaw<EffortRow[]>`
        SELECT * FROM (
          SELECT
            r.record_id, r.type, r.distance, r.duration, r.value, r.date,
            a.event_id, e.name AS activity_name, r.event_activity_id,
            NULL::int AS exclusion_id,
            row_number() OVER (
              PARTITION BY r.type, r.distance, r.duration ORDER BY ${bestFirst}
            ) AS place
          FROM record r
          JOIN event_activity a ON a.event_activity_id = r.event_activity_id
          LEFT JOIN event e ON e.event_id = a.event_id
          WHERE r.athlete_id = ${targetAthleteId}
            AND a.sport = ${sport}::sport_type
            AND ${notExcluded}
        ) ranked
        WHERE place <= 2
        ORDER BY type, distance, duration, place`,
    ]);

    return {
      years: years.map((row): YearBestRecordDto => ({
        ...toBestRecord(row),
        year: row.year,
      })),
      podium: podium.map(toEffort),
    };
  }

  /**
   * Every activity's effort at one distance or duration, the best first,
   * excluded ones included so that they can be restored.
   */
  async getEfforts(
    user: AuthUser,
    { sport, athleteId, type, distance, duration }: GetRecordEffortsQueryDto,
  ): Promise<RecordEffortDto[]> {
    const targetAthleteId = await this.targetAthleteId(user, athleteId);
    const rows = await this.prisma.$queryRaw<EffortRow[]>`
      SELECT
        r.record_id, r.type, r.distance, r.duration, r.value, r.date,
        a.event_id, e.name AS activity_name, r.event_activity_id,
        (
          SELECT min(x.record_exclusion_id) FROM record_exclusion x
          WHERE x.event_activity_id = r.event_activity_id
            AND (x.type IS NULL OR (x.type = r.type AND (
              (x.distance IS NULL AND x.duration IS NULL)
              OR x.distance = r.distance OR x.duration = r.duration)))
        ) AS exclusion_id
      FROM record r
      JOIN event_activity a ON a.event_activity_id = r.event_activity_id
      LEFT JOIN event e ON e.event_id = a.event_id
      WHERE r.athlete_id = ${targetAthleteId}
        AND a.sport = ${sport}::sport_type
        AND r.type = ${type}::record_type
        ${distance === undefined ? Prisma.empty : Prisma.sql`AND r.distance = ${distance}`}
        ${duration === undefined ? Prisma.empty : Prisma.sql`AND r.duration = ${duration}`}
      ORDER BY ${bestFirst}`;
    return rows.map(toEffort);
  }

  /** The athlete's exclusions for a sport, the latest first. */
  async getExclusions(
    user: AuthUser,
    {
      sport,
      athleteId,
    }: { sport: SportType; athleteId?: Athlete['athleteId'] },
  ): Promise<RecordExclusionDto[]> {
    const targetAthleteId = await this.targetAthleteId(user, athleteId);
    const exclusions = await this.prisma.recordExclusion.findMany({
      where: {
        eventActivity: { sport, event: { athleteId: targetAthleteId } },
      },
      include: { eventActivity: { include: { event: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return exclusions.map(toExclusion);
  }

  /** Sets an effort aside. Excluding the same one twice changes nothing. */
  async createExclusion(
    user: AuthUser,
    { eventActivityId, type, distance, duration }: CreateRecordExclusionDto,
  ): Promise<RecordExclusionDto> {
    const activity = await this.prisma.eventActivity.findUnique({
      where: { eventActivityId },
      include: { event: true },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    await this.assertCanEdit(user, activity.event);

    const scope = {
      eventActivityId,
      type: type ?? null,
      distance: distance ?? null,
      duration: duration ?? null,
    };
    const include = { eventActivity: { include: { event: true } } };
    const existing = await this.prisma.recordExclusion.findFirst({
      where: scope,
      include,
    });
    const exclusion =
      existing ??
      (await this.prisma.recordExclusion.create({ data: scope, include }));
    return toExclusion(exclusion);
  }

  /** Gives an excluded effort back to the records. */
  async deleteExclusion(
    user: AuthUser,
    recordExclusionId: number,
  ): Promise<void> {
    const exclusion = await this.prisma.recordExclusion.findUnique({
      where: { recordExclusionId },
      include: { eventActivity: { include: { event: true } } },
    });
    if (!exclusion) throw new NotFoundException('Exclusion not found');
    await this.assertCanEdit(user, exclusion.eventActivity.event);
    await this.prisma.recordExclusion.delete({ where: { recordExclusionId } });
  }

  private async assertCanEdit(user: AuthUser, event: Event): Promise<void> {
    const ability = await this.abilities.getFor({ user });
    if (!ability.can('update', subject('Event', event))) {
      throw new ForbiddenException('Not allowed to edit these records');
    }
  }
}
