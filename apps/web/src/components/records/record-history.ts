import {
  BestRecordDto,
  RECORD_TYPE,
  RecordEffortDto,
  RecordHistoryDto,
  SPORT_TYPE,
} from '@openathlete/shared';

import { ChartRecord, RecordMetric, recordPosition } from './record-metrics';

// How far a record has to stand from the next activity's best to look wrong.
// GPS jumps show on short distances, and a sensor reads high for minutes on
// end; a long race beating training runs by a wide margin is simply a race
const SUSPECT_PACE_GAP = 0.1;
const SUSPECT_PACE_UP_TO = 5000;
const SUSPECT_HEART_RATE_GAP = 0.05;

/** The distances and durations athletes look at first, per record type. */
const HEADLINES: Partial<Record<RECORD_TYPE, number[]>> = {
  [RECORD_TYPE.SPEED]: [5000, 10000, 21097.5, 42195],
  [RECORD_TYPE.POWER]: [60, 300, 1200, 3600],
  [RECORD_TYPE.HEARTRATE]: [60, 300, 1200, 3600],
  [RECORD_TYPE.ELEVATION_GAIN]: [1000, 5000, 10000, 21097.5],
};

export const recordKey = (record: ChartRecord) =>
  `${record.type}:${recordPosition(record)}`;

/** Fraction between a value and the best one, whichever way is better. */
export const recordGap = (record: ChartRecord, best: ChartRecord) =>
  best.value === 0 ? 0 : Math.abs(record.value - best.value) / best.value;

/** The first of each distance or duration on the podium. */
export function allTimeRecords(history: RecordHistoryDto): RecordEffortDto[] {
  const bests = new Map<string, RecordEffortDto>();
  for (const record of history.podium) {
    const key = recordKey(record);
    if (!bests.has(key)) bests.set(key, record);
  }
  return [...bests.values()];
}

/** Years with a record, the latest first. */
export function recordYears(history: RecordHistoryDto): number[] {
  return [...new Set(history.years.map((record) => record.year))].sort(
    (a, b) => b - a,
  );
}

export const recordsOfYear = (history: RecordHistoryDto, year: number) =>
  history.years.filter((record) => record.year === year);

/**
 * Records standing far from the athlete's next best activity. A hint to check
 * them, not a verdict: an athlete can make a real jump.
 */
export function suspectRecords(podium: RecordEffortDto[]): RecordEffortDto[] {
  const places = new Map<string, RecordEffortDto[]>();
  for (const record of podium) {
    places.set(recordKey(record), [
      ...(places.get(recordKey(record)) ?? []),
      record,
    ]);
  }
  return [...places.values()].flatMap(([first, second]) => {
    if (!second) return [];
    const gap = Math.abs(first.value - second.value) / second.value;
    const position = recordPosition(first) ?? 0;
    const suspect =
      first.type === RECORD_TYPE.SPEED
        ? position <= SUSPECT_PACE_UP_TO && gap >= SUSPECT_PACE_GAP
        : first.type === RECORD_TYPE.HEARTRATE && gap >= SUSPECT_HEART_RATE_GAP;
    return suspect ? [first] : [];
  });
}

/** The positions to summarise a metric, among those the athlete has. */
export function headlinePositions(
  metric: RecordMetric,
  positions: number[],
): number[] {
  const headlines = (HEADLINES[metric.type] ?? []).filter((position) =>
    positions.includes(position),
  );
  return headlines.length > 0 ? headlines : positions.slice(-4);
}

/** Records set this year, the latest first: what the athlete just achieved. */
export function latestRecords(
  records: RecordEffortDto[],
  year: number,
  suspects: BestRecordDto[],
): RecordEffortDto[] {
  const flagged = new Set(suspects.map(recordKey));
  return records
    .filter(
      (record) =>
        new Date(record.date).getUTCFullYear() === year &&
        record.type !== RECORD_TYPE.HEARTRATE &&
        !flagged.has(recordKey(record)),
    )
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export interface ProgressPoint {
  time: number;
  value: number;
  /** The best so far */
  best: number;
}

/** Each effort over time with the record standing at that moment. */
export function recordProgress(
  metric: RecordMetric,
  efforts: RecordEffortDto[],
  sport: SPORT_TYPE,
): ProgressPoint[] {
  let best = -Infinity;
  return efforts
    .filter((effort) => effort.exclusionId === null)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
    .map((effort) => {
      // Plotted values read higher-is-better, pace included: speeds in m/s
      const value = metric.plotted(effort, sport);
      best = Math.max(best, value);
      return { time: +new Date(effort.date), value, best };
    });
}
