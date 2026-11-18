import {
  ActivityStream,
  SPORT_TYPE,
  smoothAltitude,
} from '@openathlete/shared';

const RUNNING = new Set<string>([
  SPORT_TYPE.RUNNING,
  SPORT_TYPE.TRAIL_RUNNING,
  SPORT_TYPE.VIRTUAL_RUN,
]);

/** Slope is read over this distance, on smoothed altitude: shorter, it is noise */
const SEGMENT_M = 50;
/** Stretches steeper down than this are left out on both sides of a ratio */
const DOWNHILL_GRADE = -0.01;
/**
 * Running power already includes climbing, speed does not: their ratio is
 * only read where the run is about flat.
 */
const FLAT_GRADE = 0.02;
const MAX_GAP_SECONDS = 15;
const MIN_SECONDS = 600;

export interface ActivityEfficiency {
  /**
   * Metres per joule on the flat stretches: speed over power. Multiplied by
   * body mass it is running effectiveness (Coggan), in kg/N.
   */
  flatSpeedPerWatt: number | null;
  /** Watts per beat a minute off the descents: the efficiency factor of power */
  powerEfficiencyFactor: number | null;
}

const NONE: ActivityEfficiency = {
  flatSpeedPerWatt: null,
  powerEfficiencyFactor: null,
};

interface Totals {
  seconds: number;
  metres: number;
  /** Joules */
  work: number;
  /** Seconds with heart rate, and beats a minute times seconds */
  heartSeconds: number;
  heartSum: number;
  /** Seconds with power, for the average power */
  powerSeconds: number;
}

const empty = (): Totals => ({
  seconds: 0,
  metres: 0,
  work: 0,
  heartSeconds: 0,
  heartSum: 0,
  powerSeconds: 0,
});

/**
 * What a run turns its power into, on the same stretches for both sides of
 * each ratio: the run is cut into stretches of about 50 m, their slope read
 * on smoothed altitude (as the slope profile does), and a stretch counts
 * whole or not at all.
 * - Flat stretches (within ±2 %) give metres per joule: distance over the
 *   work done. Running power from Stryd, Garmin, COROS or Polar includes
 *   climbing, so nothing is added for it, and it is not compared with
 *   distance on a slope.
 * - Stretches that are not descents give the power efficiency factor,
 *   average power over average heart rate (Coggan; Friel, "Efficiency
 *   Factor and Decoupling", TrainingPeaks).
 * Without altitude, the whole run is taken as flat.
 */
export function activityEfficiency(
  stream: ActivityStream,
  activity: { sport: string },
): ActivityEfficiency {
  const { time, distance, watts, heartrate, altitude } = stream;
  if (!RUNNING.has(activity.sport) || !time?.length || !distance?.length)
    return NONE;
  if (!watts?.some((value) => value > 0)) return NONE;
  const n = Math.min(time.length, distance.length);
  const smooth =
    altitude && altitude.length >= n
      ? smoothAltitude(altitude.slice(0, n), distance.slice(0, n))
      : null;

  const flat = empty();
  const notDown = empty();
  let start = 0;
  let segment = empty();
  for (let i = 1; i < n; i++) {
    const dt = time[i] - time[i - 1];
    if (dt > 0 && dt <= MAX_GAP_SECONDS) {
      segment.seconds += dt;
      segment.metres += Math.max(distance[i] - distance[i - 1], 0);
      const power = watts[i];
      if (power > 0) {
        segment.work += power * dt;
        segment.powerSeconds += dt;
      }
      const heart = heartrate?.[i];
      if (heart && heart > 0) {
        segment.heartSum += heart * dt;
        segment.heartSeconds += dt;
      }
    }
    const metres = distance[i] - distance[start];
    if (metres < SEGMENT_M && i < n - 1) continue;
    const grade =
      smooth && metres > 0 ? (smooth[i] - smooth[start]) / metres : 0;
    // Only stretches with power all along count: a dropout would read as
    // free metres
    if (segment.powerSeconds >= segment.seconds * 0.9) {
      if (Math.abs(grade) <= FLAT_GRADE) add(flat, segment);
      if (grade >= DOWNHILL_GRADE) add(notDown, segment);
    }
    segment = empty();
    start = i;
  }

  const flatSpeedPerWatt =
    flat.powerSeconds >= MIN_SECONDS && flat.work > 0
      ? flat.metres / flat.work
      : null;
  const powerEfficiencyFactor =
    notDown.powerSeconds >= MIN_SECONDS && notDown.heartSeconds >= MIN_SECONDS
      ? notDown.work /
        notDown.powerSeconds /
        (notDown.heartSum / notDown.heartSeconds)
      : null;
  return { flatSpeedPerWatt, powerEfficiencyFactor };
}

function add(into: Totals, segment: Totals) {
  into.seconds += segment.seconds;
  into.metres += segment.metres;
  into.work += segment.work;
  into.heartSeconds += segment.heartSeconds;
  into.heartSum += segment.heartSum;
  into.powerSeconds += segment.powerSeconds;
}
