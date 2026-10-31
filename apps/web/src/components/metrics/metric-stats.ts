import { METRIC_TYPE, metricUnitMap } from '@openathlete/shared';

export interface MetricPoint {
  /** Calendar day, yyyy-MM-dd */
  day: string;
  value: number;
}

export type MetricStatus = 'better' | 'worse' | 'usual' | 'off_range' | null;

export interface MetricAnalysis {
  /** Values kept, oldest first */
  points: MetricPoint[];
  /** Mean of the last 7 values kept, at each value */
  trend: MetricPoint[];
  /** Days hidden from the chart and the figures */
  hiddenDays: Set<string>;
  /** Mean ± 1 SD of the last 60 values, once there are enough of them */
  baseline: { mean: number; low: number; high: number } | null;
  average7: number | null;
  min: number | null;
  max: number | null;
  last: MetricPoint | null;
  /** Average of the last 7 values against the baseline */
  deltaPercent: number | null;
  status: MetricStatus;
}

const BASELINE_WINDOW = 60;
const BASELINE_MIN_VALUES = 14;
const TREND_WINDOW = 7;
/** Half a standard deviation: day to day noise stays "usual" */
const MEANINGFUL_SHIFT = 0.5;
const OUTLIER_MIN_VALUES = 14;
const OUTLIER_DEVIATIONS = 6;

/** A watch reports 0 for these when it did not measure them */
const ZERO_MEANS_MISSING = new Set<METRIC_TYPE>([
  METRIC_TYPE.HR_MAX,
  METRIC_TYPE.HR_REST,
  METRIC_TYPE.HR_MIN_DAILY,
  METRIC_TYPE.HR_AVG_DAILY,
  METRIC_TYPE.HR_MAX_DAILY,
  METRIC_TYPE.RMSSD,
  METRIC_TYPE.HRV_LAST_NIGHT_AVG,
  METRIC_TYPE.HRV_LAST_NIGHT_5MIN_HIGH,
  METRIC_TYPE.PULSE_OX_AVG,
  METRIC_TYPE.PULSE_OX_MIN,
  METRIC_TYPE.SLEEP_DURATION,
  METRIC_TYPE.SLEEP_SCORE,
  METRIC_TYPE.SLEEP_SPO2_AVG,
  METRIC_TYPE.WEIGHT,
]);

/** Which way is better. A metric left out has no good direction of its own. */
const BETTER_DIRECTION: Partial<Record<METRIC_TYPE, 'up' | 'down'>> = {
  [METRIC_TYPE.HRV_LAST_NIGHT_AVG]: 'up',
  [METRIC_TYPE.RMSSD]: 'up',
  [METRIC_TYPE.SLEEP_DURATION]: 'up',
  [METRIC_TYPE.SLEEP_SCORE]: 'up',
  [METRIC_TYPE.SLEEP_DEEP_DURATION]: 'up',
  [METRIC_TYPE.BODY_BATTERY_CHARGED]: 'up',
  [METRIC_TYPE.VMA]: 'up',
  [METRIC_TYPE.VO2MAX]: 'up',
  [METRIC_TYPE.VO2MAX_CYCLING]: 'up',
  [METRIC_TYPE.FTP_CYCLING]: 'up',
  [METRIC_TYPE.FTP_RUNNING]: 'up',
  [METRIC_TYPE.CRITICAL_POWER_CYCLING]: 'up',
  [METRIC_TYPE.CRITICAL_POWER_RUNNING]: 'up',
  [METRIC_TYPE.HR_REST]: 'down',
  [METRIC_TYPE.HR_MIN_DAILY]: 'down',
  [METRIC_TYPE.STRESS_AVERAGE]: 'down',
  [METRIC_TYPE.FITNESS_AGE]: 'down',
};

const mean = (values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};

/** Sync glitches sit far outside anything else, such as a daily mean of 193 bpm */
function findOutliers(points: MetricPoint[]): Set<string> {
  if (points.length < OUTLIER_MIN_VALUES) return new Set();
  const values = points.map((point) => point.value);
  const center = median(values);
  // 1.4826: scales the median deviation to a standard deviation
  const spread =
    1.4826 * median(values.map((value) => Math.abs(value - center)));
  if (spread === 0) return new Set();
  return new Set(
    points
      .filter(
        (point) => Math.abs(point.value - center) > OUTLIER_DEVIATIONS * spread,
      )
      .map((point) => point.day),
  );
}

export function analyzeMetric(
  type: METRIC_TYPE,
  series: MetricPoint[],
): MetricAnalysis {
  const measured = ZERO_MEANS_MISSING.has(type)
    ? series.filter((point) => point.value > 0)
    : series;
  const outliers = findOutliers(measured);
  const points = measured.filter((point) => !outliers.has(point.day));
  const kept = new Set(points.map((point) => point.day));
  const hiddenDays = new Set(
    series.map((point) => point.day).filter((day) => !kept.has(day)),
  );

  const values = points.map((point) => point.value);
  const trend = points.map((point, index) => ({
    day: point.day,
    value: mean(values.slice(Math.max(0, index - TREND_WINDOW + 1), index + 1)),
  }));
  const last = points.at(-1) ?? null;
  const average7 = values.length ? mean(values.slice(-TREND_WINDOW)) : null;

  let baseline: MetricAnalysis['baseline'] = null;
  let deltaPercent: number | null = null;
  let status: MetricStatus = null;
  if (values.length >= BASELINE_MIN_VALUES && average7 !== null) {
    const window = values.slice(-BASELINE_WINDOW);
    const center = mean(window);
    const deviation = Math.sqrt(
      mean(window.map((value) => (value - center) ** 2)),
    );
    baseline = {
      mean: center,
      low: center - deviation,
      high: center + deviation,
    };
    deltaPercent = center ? ((average7 - center) / center) * 100 : null;

    const shift = deviation ? (average7 - center) / deviation : 0;
    const better = BETTER_DIRECTION[type];
    if (Math.abs(shift) < MEANINGFUL_SHIFT) status = 'usual';
    else if (!better) status = 'off_range';
    else status = shift > 0 === (better === 'up') ? 'better' : 'worse';
  }

  return {
    points,
    trend,
    hiddenDays,
    baseline,
    average7,
    min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null,
    last,
    deltaPercent,
    status,
  };
}

/** 8.15 hours reads 8 h 09, and a sensor's 39.89 needs no such precision */
export function formatMetricValue(type: METRIC_TYPE, value: number): string {
  if (metricUnitMap[type] === 'h') {
    const minutes = Math.round(value * 60);
    const rest = minutes % 60;
    return `${Math.floor(minutes / 60)} h ${String(rest).padStart(2, '0')}`;
  }
  const digits = Math.abs(value) >= 100 ? 0 : 1;
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: digits,
  }).format(value);
}

/** Durations already carry their unit in {@link formatMetricValue} */
export const hasOwnUnit = (type: METRIC_TYPE) => metricUnitMap[type] === 'h';

/** The API stores a metric at a calendar day: never shift it to local time */
export const toMetricDay = (date: string) => date.slice(0, 10);

/** For date-fns: noon stays on the same calendar day in every time zone */
export const metricDayToDate = (day: string) => new Date(`${day}T12:00:00`);

const MS_PER_DAY = 86_400_000;

export const metricDayNumber = (day: string) =>
  Date.parse(`${day}T00:00:00Z`) / MS_PER_DAY;
