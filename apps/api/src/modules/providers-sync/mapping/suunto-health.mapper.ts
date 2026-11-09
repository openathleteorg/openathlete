import { MetricType } from '@openathlete/database';

import type {
  SuuntoAggregatedActivityData,
  SuuntoDailyActivityEntry,
  SuuntoRecoveryEntry,
  SuuntoSleepEntry,
} from '../../core/types/connector';

export interface SuuntoMetricRecord {
  type: MetricType;
  date: Date;
  value: number;
}

function round(value: number, precision = 2): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

function push(
  target: SuuntoMetricRecord[],
  type: MetricType,
  day: string,
  value?: number | null,
) {
  if (value === undefined || value === null || !Number.isFinite(value)) return;
  target.push({ type, date: new Date(`${day}T00:00:00.000Z`), value });
}

const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/**
 * The user's local day of a Suunto timestamp. Suunto writes timestamps with
 * the user's offset ("2024-12-10T00:50:00.000+02:00"), so the date before
 * the "T" is the day the watch shows; UTC would put that sample on the 9th.
 */
export function suuntoLocalDay(timestamp?: string | null): string | null {
  if (!timestamp) return null;
  const match = /^(\d{4}-\d{2}-\d{2})T/.exec(timestamp);
  if (match) return match[1];
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function groupByDay<T extends { timestamp: string }>(
  entries: T[],
  dayOf: (entry: T) => string | null = (entry) =>
    suuntoLocalDay(entry.timestamp),
): Map<string, T[]> {
  const days = new Map<string, T[]>();
  for (const entry of entries) {
    const day = dayOf(entry);
    if (!day) continue;
    days.set(day, [...(days.get(day) ?? []), entry]);
  }
  return days;
}

/** The offset of a Suunto timestamp, in minutes */
function offsetMinutes(timestamp: string): number | null {
  if (/Z$/.test(timestamp)) return 0;
  const match = /([+-])(\d{2}):?(\d{2})$/.exec(timestamp);
  if (!match) return null;
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === '-' ? -minutes : minutes;
}

/** The local day of an epoch time, at the offset of a sample */
function dayAt(time: number, sampleTimestamp?: string): string {
  const offset = sampleTimestamp ? offsetMinutes(sampleTimestamp) : null;
  return new Date(time + (offset ?? 0) * 60_000).toISOString().slice(0, 10);
}

/**
 * The samples of a request start at its "from" time, part way through a
 * day: that day is incomplete and is left out, rather than saving a part of
 * its heart rate or recovery as the day's value.
 */
function completeDays<T extends { timestamp: string }>(
  days: Map<string, T[]>,
  from?: number,
): [string, T[]][] {
  const entries = [...days.entries()];
  if (from === undefined) return entries;
  const firstDay = dayAt(from, entries[0]?.[1][0]?.timestamp);
  return entries.filter(([day]) => day > firstDay);
}

/** Daily steps and calories, as Suunto aggregates them per day */
export function mapSuuntoDailyStatistics(
  data: SuuntoAggregatedActivityData[],
  /** Start of the request, in epoch milliseconds */
  from?: number,
): SuuntoMetricRecord[] {
  const days = new Map<string, { steps?: number; joules?: number }>();
  for (const aggregated of data ?? []) {
    if (
      aggregated.Name !== 'stepcount' &&
      aggregated.Name !== 'energyconsumption'
    ) {
      continue;
    }
    for (const source of aggregated.Sources ?? []) {
      for (const sample of source.Samples ?? []) {
        const day = suuntoLocalDay(sample.TimeISO8601);
        if (
          day &&
          from !== undefined &&
          day <= dayAt(from, sample.TimeISO8601)
        ) {
          continue;
        }
        // A day can come twice, once with no value: that one is no data,
        // not zero steps
        const value =
          sample.Value === null || sample.Value === undefined
            ? NaN
            : Number(sample.Value);
        if (!day || !Number.isFinite(value)) continue;
        const stats = days.get(day) ?? {};
        if (aggregated.Name === 'stepcount') {
          stats.steps = (stats.steps ?? 0) + value;
        } else {
          stats.joules = (stats.joules ?? 0) + value;
        }
        days.set(day, stats);
      }
    }
  }

  const metrics: SuuntoMetricRecord[] = [];
  for (const [day, stats] of days) {
    push(metrics, MetricType.DAILY_STEPS, day, stats.steps);
    push(
      metrics,
      MetricType.DAILY_CALORIES,
      day,
      stats.joules === undefined ? undefined : round(stats.joules / 4184, 0),
    );
  }
  return metrics;
}

/**
 * Daily heart rate and SpO2 from the 24/7 samples. Steps and calories come
 * from the daily statistics, which Suunto computes over the whole day.
 */
export function mapSuuntoActivitySamples(
  entries: SuuntoDailyActivityEntry[],
  /** Start of the request, in epoch milliseconds */
  from?: number,
): SuuntoMetricRecord[] {
  const metrics: SuuntoMetricRecord[] = [];
  for (const [day, samples] of completeDays(groupByDay(entries ?? []), from)) {
    const data = samples.map((sample) => sample.entryData ?? {});
    const hr = data
      .map((d) => d.HR)
      .filter(finite)
      .filter((v) => v > 0);
    // Each sample averages several minutes: its own min and max are the
    // day's extremes, not the averages
    const hrMin = data
      .map((d) => d.HRExt?.Min ?? d.HR)
      .filter(finite)
      .filter((v) => v > 0);
    const hrMax = data
      .map((d) => d.HRExt?.Max ?? d.HR)
      .filter(finite)
      .filter((v) => v > 0);
    const spo2 = data
      .map((d) => d.SpO2)
      .filter(finite)
      .filter((v) => v > 0);

    if (hr.length > 0) {
      push(
        metrics,
        MetricType.HR_AVG_DAILY,
        day,
        round(hr.reduce((sum, v) => sum + v, 0) / hr.length, 0),
      );
    }
    if (hrMin.length > 0) {
      push(metrics, MetricType.HR_MIN_DAILY, day, Math.min(...hrMin));
    }
    if (hrMax.length > 0) {
      push(metrics, MetricType.HR_MAX_DAILY, day, Math.max(...hrMax));
    }
    if (spo2.length > 0) {
      const percents = spo2.map((v) => v * 100);
      push(
        metrics,
        MetricType.PULSE_OX_AVG,
        day,
        round(percents.reduce((sum, v) => sum + v, 0) / percents.length, 1),
      );
      push(
        metrics,
        MetricType.PULSE_OX_MIN,
        day,
        round(Math.min(...percents), 1),
      );
    }
  }
  return metrics;
}

/**
 * Sleep, on the day the athlete wakes up, as Garmin dates it. A night can
 * be split into several segments, which add up; naps count apart, so they
 * never replace the night.
 */
export function mapSuuntoSleep(
  entries: SuuntoSleepEntry[],
): SuuntoMetricRecord[] {
  const nights = groupByDay(
    entries ?? [],
    (entry) =>
      suuntoLocalDay(entry.entryData?.BedtimeEnd) ??
      suuntoLocalDay(entry.timestamp),
  );

  const metrics: SuuntoMetricRecord[] = [];
  for (const [day, segments] of nights) {
    const data = segments.map((segment) => segment.entryData ?? {});
    const naps = data.filter((d) => d.IsNap);
    const sleeps = data.filter((d) => !d.IsNap);

    if (naps.length > 0) {
      push(
        metrics,
        MetricType.NAP_DURATION,
        day,
        round(naps.reduce((sum, d) => sum + (d.Duration ?? 0), 0) / 3600),
      );
    }
    if (sleeps.length === 0) continue;

    const sum = (pick: (d: (typeof data)[number]) => number | undefined) => {
      const values = sleeps.map(pick).filter(finite);
      return values.length > 0
        ? values.reduce((total, v) => total + v, 0)
        : undefined;
    };
    const hours = (seconds?: number) =>
      seconds === undefined ? undefined : round(seconds / 3600);

    const deep = sum((d) => d.DeepSleepDuration);
    const light = sum((d) => d.LightSleepDuration);
    const rem = sum((d) => d.REMSleepDuration);
    const awake = sum((d) =>
      [
        d.SleepOnsetLatencyDuration,
        d.WakeAfterSleepOnsetDuration,
        d.WakeBeforeOffBedDuration,
      ].some(finite)
        ? (d.SleepOnsetLatencyDuration ?? 0) +
          (d.WakeAfterSleepOnsetDuration ?? 0) +
          (d.WakeBeforeOffBedDuration ?? 0)
        : undefined,
    );
    // Duration includes the time awake in bed: sleep is the stages, when the
    // watch stages the whole night. Older watches (Suunto 9 Baro...) send
    // only deep sleep, which is a part of the night, not all of it: without
    // light sleep, sleep is the time in bed less the time awake.
    const staged =
      light !== undefined ? (deep ?? 0) + light + (rem ?? 0) : undefined;
    const inBed = sum((d) => d.Duration);
    const asleep =
      staged ??
      (inBed === undefined ? undefined : Math.max(0, inBed - (awake ?? 0)));

    push(metrics, MetricType.SLEEP_DURATION, day, hours(asleep));
    push(metrics, MetricType.SLEEP_DEEP_DURATION, day, hours(deep));
    push(metrics, MetricType.SLEEP_LIGHT_DURATION, day, hours(light));
    push(metrics, MetricType.SLEEP_REM_DURATION, day, hours(rem));
    push(metrics, MetricType.SLEEP_AWAKE_DURATION, day, hours(awake));

    // The score of the main segment
    const main = [...sleeps].sort(
      (a, b) => (b.Duration ?? 0) - (a.Duration ?? 0),
    )[0];
    if (finite(main.SleepQualityScore) && main.SleepQualityScore > 0) {
      push(metrics, MetricType.SLEEP_SCORE, day, main.SleepQualityScore);
    }

    // Night HRV, weighted by how many samples each segment averaged
    const hrv = sleeps.filter((d) => finite(d.AvgHRV) && d.AvgHRV! > 0);
    if (hrv.length > 0) {
      const weight = (d: (typeof data)[number]) =>
        finite(d.AvgHRVSampleCount) && d.AvgHRVSampleCount > 0
          ? d.AvgHRVSampleCount
          : 1;
      const total = hrv.reduce((sum, d) => sum + weight(d), 0);
      push(
        metrics,
        MetricType.HRV_LAST_NIGHT_AVG,
        day,
        round(
          hrv.reduce((sum, d) => sum + d.AvgHRV! * weight(d), 0) / total,
          0,
        ),
      );
    }
  }
  return metrics;
}

/**
 * Suunto's resources (0-1) through the day, as the energy charged and
 * drained, like Garmin's Body Battery: the sum of the rises and of the
 * falls between consecutive samples, in points out of 100.
 */
export function mapSuuntoRecovery(
  entries: SuuntoRecoveryEntry[],
  /** Start of the request, in epoch milliseconds */
  from?: number,
): SuuntoMetricRecord[] {
  const metrics: SuuntoMetricRecord[] = [];
  for (const [day, samples] of completeDays(groupByDay(entries ?? []), from)) {
    const balances = samples
      .map((sample) => ({
        time: new Date(sample.timestamp).getTime(),
        balance: sample.entryData?.Balance,
      }))
      .filter(
        (sample): sample is { time: number; balance: number } =>
          Number.isFinite(sample.time) && finite(sample.balance),
      )
      .sort((a, b) => a.time - b.time);
    if (balances.length < 2) continue;

    let charged = 0;
    let drained = 0;
    for (let i = 1; i < balances.length; i += 1) {
      const delta = (balances[i].balance - balances[i - 1].balance) * 100;
      if (delta > 0) charged += delta;
      else drained -= delta;
    }
    push(metrics, MetricType.BODY_BATTERY_CHARGED, day, round(charged, 0));
    push(metrics, MetricType.BODY_BATTERY_DRAINED, day, round(drained, 0));
  }
  return metrics;
}
