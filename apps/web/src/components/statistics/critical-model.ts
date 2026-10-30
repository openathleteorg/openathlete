import { BestRecordDto, RECORD_TYPE, SPORT_TYPE } from '@openathlete/shared';

/** The hyperbolic model holds for efforts of a few minutes to about twenty */
const MIN_EFFORT_SECONDS = 120;
const MAX_EFFORT_SECONDS = 1200;
const MIN_EFFORTS = 3;

/** Two-sided 95% Student's t, by degrees of freedom */
const T_95 = [12.71, 4.3, 3.18, 2.78, 2.57, 2.45, 2.36, 2.31, 2.26, 2.23];

const CYCLING = new Set([
  SPORT_TYPE.CYCLING,
  SPORT_TYPE.GRAVEL_RIDE,
  SPORT_TYPE.MOUNTAIN_BIKE_RIDE,
]);

export interface CriticalFit {
  kind: 'speed' | 'power';
  /** m/s or watts */
  critical: number;
  /** Half width of the 95% interval, same unit */
  margin: number;
  /** Metres or joules above it */
  reserve: number;
  efforts: { seconds: number; work: number }[];
}

/**
 * Critical speed or power from an athlete's best efforts: work = reserve +
 * critical × time, fitted by least squares. Only running and cycling, the
 * sports it was tested in with this kind of data. Null without enough efforts.
 *
 * The efforts are bests from training, not maximal tests: the result is at
 * most what they show, and the interval says how well they agree.
 */
export function criticalFit(
  records: BestRecordDto[],
  sport: SPORT_TYPE,
): CriticalFit | null {
  const kind =
    sport === SPORT_TYPE.RUNNING
      ? 'speed'
      : CYCLING.has(sport)
        ? 'power'
        : null;
  if (!kind) return null;

  const efforts = records.flatMap((record) => {
    if (kind === 'speed') {
      if (record.type !== RECORD_TYPE.SPEED || !record.distance) return [];
      return [{ seconds: record.value, work: record.distance }];
    }
    if (record.type !== RECORD_TYPE.POWER || !record.duration) return [];
    return [{ seconds: record.duration, work: record.value * record.duration }];
  });
  const usable = efforts
    .filter(
      ({ seconds }) =>
        seconds >= MIN_EFFORT_SECONDS && seconds <= MAX_EFFORT_SECONDS,
    )
    .sort((a, b) => a.seconds - b.seconds);
  if (usable.length < MIN_EFFORTS) return null;

  const n = usable.length;
  const meanTime = usable.reduce((sum, e) => sum + e.seconds, 0) / n;
  const meanWork = usable.reduce((sum, e) => sum + e.work, 0) / n;
  const spread = usable.reduce(
    (sum, e) => sum + (e.seconds - meanTime) ** 2,
    0,
  );
  if (spread === 0) return null;
  const critical =
    usable.reduce(
      (sum, e) => sum + (e.seconds - meanTime) * (e.work - meanWork),
      0,
    ) / spread;
  const reserve = meanWork - critical * meanTime;
  if (critical <= 0 || reserve <= 0) return null;

  const residual = usable.reduce(
    (sum, e) => sum + (e.work - reserve - critical * e.seconds) ** 2,
    0,
  );
  const standardError = Math.sqrt(residual / (n - 2) / spread);
  const t = T_95[Math.min(n - 3, T_95.length - 1)];
  return {
    kind,
    critical,
    margin: t * standardError,
    reserve,
    efforts: usable,
  };
}

/**
 * Critical swim speed from a 200 m and a 400 m swum flat out, in m/s. Needs a
 * real test: the distance-time line says nothing on easy swims.
 */
export function criticalSwimSpeed(
  seconds200: number,
  seconds400: number,
): number | null {
  if (seconds200 <= 0 || seconds400 <= seconds200) return null;
  return 200 / (seconds400 - seconds200);
}

/** "3:05", or a number of seconds */
export function parseSwimTime(text: string): number | null {
  const match = /^\s*(?:(\d+):)?(\d{1,3})\s*$/.exec(text);
  if (!match) return null;
  const minutes = Number(match[1] ?? 0);
  const seconds = Number(match[2]);
  if (match[1] !== undefined && seconds >= 60) return null;
  return minutes * 60 + seconds;
}
