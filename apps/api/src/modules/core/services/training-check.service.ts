import { subject } from '@casl/ability';

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@openathlete/database';
import {
  CHECK_FLAT_CLIMB,
  CHECK_LONG_RUN_SECONDS,
  CHECK_LOW_SHARE,
  CHECK_MIN_LONG_RUNS,
  CHECK_WINDOW_DAYS,
  FTP_MODEL_SPORTS,
  TrainingCheckDto,
  cardiacScores,
  compareModels,
  compareWindows,
} from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { RecordService } from './record.service';

const DAY_MS = 86_400_000;
/** A band of output read in passing says nothing */
const MIN_BAND_SECONDS = 60;
/** Power is the basis when nearly every run has it */
const POWER_SHARE = 0.8;
/** Width of the bands of activity_profile_bin: 10 W, half a km/h */
const POWER_BAND_W = 10;
const SPEED_BAND_MS = 0.5 / 3.6;

interface BandRow {
  activityId: number;
  current: boolean;
  kind: 'FLAT_POWER' | 'FLAT_SPEED';
  band: number;
  seconds: number;
  heartrate: number;
}

/**
 * The training check of a runner: whether the last six weeks went better
 * than the six before. The method and its sources are in training-check.ts
 * of the shared library.
 */
@Injectable()
export class TrainingCheckService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
    private readonly records: RecordService,
  ) {}

  async getCheck(
    user: AuthUser,
    /** Absent: the athlete asking */
    asked: number | undefined,
    now = new Date(),
  ): Promise<TrainingCheckDto> {
    const athlete = await this.prisma.athlete.findUnique({
      where: { athleteId: asked ?? user.athlete?.athleteId ?? 0 },
    });
    if (!athlete) throw new NotFoundException('Athlete not found');
    const { athleteId } = athlete;
    const ability = await this.abilities.getFor({ user });
    if (!ability.can('read', subject('Athlete', athlete))) {
      throw new ForbiddenException('Not allowed to access this athlete');
    }

    const split = new Date(now.getTime() - CHECK_WINDOW_DAYS * DAY_MS);
    const from = new Date(split.getTime() - CHECK_WINDOW_DAYS * DAY_MS);
    // The runs of both windows, as the end of a query joining `a` and `e`
    const runs = Prisma.sql`
      JOIN event e ON e.event_id = a.event_id
      WHERE e.athlete_id = ${athleteId}
        AND e.type = 'ACTIVITY'
        AND e.start_date >= ${from}
        AND e.start_date <= ${now}
        AND a.sport::text IN (${Prisma.join([...FTP_MODEL_SPORTS.running])})`;

    const [bands, longRuns, modelNow, modelBefore] = await Promise.all([
      this.prisma.$queryRaw<BandRow[]>`
        SELECT a.event_activity_id AS "activityId",
          e.start_date >= ${split} AS current,
          p.kind::text AS kind, p.bin AS band,
          p.seconds::float8 AS seconds, p.value::float8 AS heartrate
        FROM activity_profile_bin p
        JOIN event_activity a ON a.event_activity_id = p.event_activity_id
        ${runs}
          AND p.kind IN ('FLAT_POWER', 'FLAT_SPEED')
          AND p.seconds >= ${MIN_BAND_SECONDS}`,
      // Long, steady and flat: on a mountain run, the drift mostly shows
      // the climb coming before the descent
      this.prisma.$queryRaw<{ current: boolean; drift: number }[]>`
        SELECT e.start_date >= ${split} AS current,
          a.decoupling_percent::float8 AS drift
        FROM event_activity a
        ${runs}
          AND a.decoupling_percent IS NOT NULL
          AND a.moving_time >= ${CHECK_LONG_RUN_SECONDS}
          AND a.elevation_gain <= ${CHECK_FLAT_CLIMB} * a.distance
          AND a.intensity_seconds[1] >= ${CHECK_LOW_SHARE} * (
            a.intensity_seconds[1] + a.intensity_seconds[2] + a.intensity_seconds[3])`,
      this.records.runningCriticalAt(athleteId, now),
      this.records.runningCriticalAt(athleteId, split),
    ]);

    return {
      from,
      split,
      to: now,
      fitness: fitnessOf(bands),
      speed: speedOf(modelNow, modelBefore),
      durability: compareWindows(
        longRuns.filter((run) => run.current).map((run) => run.drift),
        longRuns.filter((run) => !run.current).map((run) => run.drift),
        { higherIsBetter: false, minCount: CHECK_MIN_LONG_RUNS },
      ),
    };
  }
}

/**
 * Heart rate at the same output on flat ground. On running power when
 * nearly every run has it, else on grade-adjusted speed.
 */
function fitnessOf(bands: BandRow[]): TrainingCheckDto['fitness'] {
  const runsWith = (kind: BandRow['kind']) =>
    new Set(
      bands.filter((row) => row.kind === kind).map((row) => row.activityId),
    ).size;
  const powered = runsWith('FLAT_POWER');
  const basis: BandRow['kind'] =
    powered > 0 && powered >= POWER_SHARE * runsWith('FLAT_SPEED')
      ? 'FLAT_POWER'
      : 'FLAT_SPEED';
  const { current, previous, referenceBand } = cardiacScores(
    bands.filter((row) => row.kind === basis),
  );
  return {
    ...compareWindows(current, previous, { higherIsBetter: false }),
    basis: basis === 'FLAT_POWER' ? 'POWER' : 'SPEED',
    reference:
      referenceBand === null
        ? null
        : // The middle of the band
          (referenceBand + 0.5) *
          (basis === 'FLAT_POWER' ? POWER_BAND_W : SPEED_BAND_MS),
  };
}

type Critical = { speed: number | null; power: number | null };

/** The same model on both dates: speed when it holds on both, else power */
function speedOf(now: Critical, before: Critical): TrainingCheckDto['speed'] {
  const kind =
    now.speed && before.speed
      ? 'speed'
      : now.power && before.power
        ? 'power'
        : null;
  if (!kind) {
    // What there is today, to show while the comparison is open
    const known = now.speed ? 'speed' : now.power ? 'power' : null;
    return {
      status: 'OPEN',
      kind: known,
      current: known ? now[known] : null,
      previous: null,
    };
  }
  return {
    status: compareModels(now[kind], before[kind]),
    kind,
    current: now[kind],
    previous: before[kind],
  };
}
