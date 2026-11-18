import { RecordType } from '@openathlete/database';

interface PlausibleRecord {
  type: RecordType;
  distance?: number | null;
  duration?: number | null;
  value: number;
}

/**
 * Metres and a time about 3% under the world record, as GPS reads long. A faster "run" is a ride filed as a run, or a GPS jump: left in, it
 * would rewrite every curve built on the records.
 */
const FASTEST_RUN: [number, number][] = [
  [400, 42],
  [800, 98],
  [1000, 127],
  [1500, 200],
  [3000, 428],
  [5000, 733],
  [10000, 1525],
  [15000, 2385],
  [20000, 3200],
  [21097.5, 3350],
  [42195, 6955],
  [50000, 8700],
  [100000, 21000],
];

/** Seconds and the highest watts held, well above what elites reach */
const HIGHEST_POWER: [number, number][] = [
  [5, 2800],
  [15, 2400],
  [30, 1800],
  [60, 1300],
  [120, 1000],
  [300, 750],
  [600, 680],
  [1200, 640],
  [1800, 620],
  [3600, 600],
  [7200, 550],
];

/**
 * Seconds and the most metres climbed per hour: the best vertical-kilometre
 * runners reach about 2000 m/h over half an hour. Faster is a lift, a car or
 * an altimeter jump.
 */
const HIGHEST_VERTICAL_SPEED: [number, number][] = [
  [300, 2600],
  [600, 2400],
  [1200, 2300],
  [1800, 2200],
  [3600, 2000],
  [7200, 1700],
];

const HIGHEST_HEART_RATE = 230;
const RUNNING = new Set(['RUNNING', 'TRAIL_RUNNING']);

const lookup = (table: [number, number][], key: number | null | undefined) =>
  table.find(([at]) => at === key)?.[1];

/** The most metres an hour a human climbs over this many seconds */
export function highestVerticalSpeed(duration: number): number {
  // No record is kept at other durations
  return lookup(HIGHEST_VERTICAL_SPEED, duration) ?? 0;
}

/** Whether a human could have set this record */
export function isPlausibleRecord(
  { type, distance, duration, value }: PlausibleRecord,
  sport: string,
): boolean {
  if (type === 'HEARTRATE') return value <= HIGHEST_HEART_RATE;
  if (type === 'VERTICAL_SPEED') {
    return duration != null && value <= highestVerticalSpeed(duration);
  }
  if (type === 'POWER') {
    return value <= (lookup(HIGHEST_POWER, duration) ?? Infinity);
  }
  if (type === 'SPEED' && RUNNING.has(sport)) {
    return value >= (lookup(FASTEST_RUN, distance) ?? 0);
  }
  return true;
}
