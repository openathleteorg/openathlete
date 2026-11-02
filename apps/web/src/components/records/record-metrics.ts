import { m } from '@/paraglide/messages';

import {
  BestRecordDto,
  RECORD_TYPE,
  SPORT_CONFIG,
  SPORT_TYPE,
  SpeedUnit,
  formatDuration,
  formatSpeed,
  formatSpeedUnit,
  isPaceUnit,
} from '@openathlete/shared';

export type ChartRecord = Pick<
  BestRecordDto,
  'type' | 'distance' | 'duration' | 'value'
>;

/** How one kind of record is read: along distance or duration, in a unit. */
export interface RecordMetric {
  type: RECORD_TYPE;
  axis: 'distance' | 'duration';
  title: (sport: SPORT_TYPE) => string;
  unit: (sport: SPORT_TYPE) => string;
  /** The number plotted for a record */
  plotted: (record: ChartRecord, sport: SPORT_TYPE) => number;
  /** A plotted number, as written in the tooltip and on the axis */
  format: (plotted: number, sport: SPORT_TYPE) => string;
}

const speedUnit = (sport: SPORT_TYPE): SpeedUnit =>
  SPORT_CONFIG[sport]?.speedUnit ?? 'km/h';

export const RECORD_METRICS: RecordMetric[] = [
  {
    type: RECORD_TYPE.SPEED,
    axis: 'distance',
    // Pace sports read the time per kilometre, others the speed
    title: (sport) => (isPaceUnit(speedUnit(sport)) ? m.pace() : m.speed()),
    unit: (sport) => formatSpeedUnit(speedUnit(sport)),
    // Speeds are plotted in m/s and written in the sport's unit
    plotted: (record) => (record.distance ?? 0) / record.value,
    format: (speed, sport) => formatSpeed(speed, speedUnit(sport)),
  },
  {
    type: RECORD_TYPE.POWER,
    axis: 'duration',
    title: () => m.power(),
    unit: () => 'W',
    plotted: (record) => record.value,
    format: (watts) => `${Math.round(watts)}`,
  },
  {
    type: RECORD_TYPE.HEARTRATE,
    axis: 'duration',
    title: () => m.heart_rate(),
    unit: () => m.bpm(),
    plotted: (record) => record.value,
    format: (bpm) => `${Math.round(bpm)}`,
  },
  {
    type: RECORD_TYPE.ELEVATION_GAIN,
    axis: 'distance',
    title: () => m.elevation_gain(),
    unit: () => m.meters(),
    plotted: (record) => record.value,
    format: (metres) => `${Math.round(metres)}`,
  },
];

/** Where a record sits on its axis: metres or seconds. */
export function recordPosition(record: ChartRecord): number | null {
  return record.distance ?? record.duration;
}

/** "400 m", "1.5 km", "21.1 km" */
export function formatRecordDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  const km = metres / 1000;
  return `${Number.isInteger(km) ? km : km.toFixed(1)} km`;
}

/** "5 s", "1 min", "1 h" */
export function formatRecordDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  const hours = seconds / 3600;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} h`;
}

export function formatRecordPosition(
  metric: RecordMetric,
  position: number,
): string {
  return metric.axis === 'distance'
    ? formatRecordDistance(position)
    : formatRecordDuration(position);
}

/** The time a pace record took, for the table */
export function formatRecordTime(record: ChartRecord): string {
  return formatDuration(record.value);
}

/** A record's headline, and what qualifies it: a time and its pace, or watts. */
export function formatRecordValue(
  metric: RecordMetric,
  record: ChartRecord,
  sport: SPORT_TYPE,
): { value: string; unit: string } {
  const plotted = metric.format(metric.plotted(record, sport), sport);
  return metric.type === RECORD_TYPE.SPEED
    ? {
        value: formatRecordTime(record),
        unit: `${plotted} ${metric.unit(sport)}`,
      }
    : { value: plotted, unit: metric.unit(sport) };
}

export type CurveSeries<R extends ChartRecord = ChartRecord> = {
  key: string;
  records: R[];
};

export type CurvePoint = { position: number } & Record<string, number | null>;

/**
 * One point per distance or duration of the metric, one value per series:
 * null where a series has no record, so its line skips the point instead
 * of dropping to zero.
 */
export function curveData(
  metric: RecordMetric,
  series: CurveSeries[],
  sport: SPORT_TYPE,
): CurvePoint[] {
  const points = new Map<number, CurvePoint>();
  for (const { key, records } of series) {
    for (const record of records) {
      const position = recordPosition(record);
      if (record.type !== metric.type || position === null) continue;
      const point =
        points.get(position) ??
        (Object.fromEntries([
          ['position', position],
          ...series.map((s) => [s.key, null]),
        ]) as CurvePoint);
      point[key] = metric.plotted(record, sport);
      points.set(position, point);
    }
  }
  return [...points.values()].sort((a, b) => a.position - b.position);
}
