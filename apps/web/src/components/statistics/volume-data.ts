import {
  M_TO_FT,
  SPORT_TYPE,
  StatisticsVolumeDto,
  UnitSystem,
} from '@openathlete/shared';

export type VolumeMetric =
  'movingTime' | 'distance' | 'elevationGain' | 'count';

/** Sports with their own bar segment; the rest share one */
const MAX_SPORTS = 4;
// Not 'OTHER': that is a sport of its own
export const OTHER_SPORTS = 'OTHER_SPORTS' as const;

export type VolumeSeries = SPORT_TYPE | typeof OTHER_SPORTS;

export type VolumeRow = { period: string; partial: boolean } & Partial<
  Record<VolumeSeries, number>
>;

const scaleFor = (metric: VolumeMetric, unitSystem: UnitSystem): number => {
  switch (metric) {
    case 'movingTime':
      return 1 / 3600;
    case 'distance':
      return unitSystem === 'IMPERIAL' ? 1 / 1609.34 : 1 / 1000;
    case 'elevationGain':
      return unitSystem === 'IMPERIAL' ? M_TO_FT : 1;
    case 'count':
      return 1;
  }
};

/**
 * One row per bucket, one value per sport, in display units: hours,
 * kilometres/miles, metres/feet or activities. The sports with the most volume
 * over the period come first; beyond four, they are summed as "other".
 */
export function volumeChartData(
  buckets: StatisticsVolumeDto['buckets'],
  metric: VolumeMetric,
  unitSystem: UnitSystem = 'METRIC',
): { rows: VolumeRow[]; series: VolumeSeries[] } {
  const scale = scaleFor(metric, unitSystem);
  const totals = new Map<SPORT_TYPE, number>();
  for (const bucket of buckets) {
    for (const sport of bucket.sports) {
      totals.set(sport.sport, (totals.get(sport.sport) ?? 0) + sport[metric]);
    }
  }
  const ranked = [...totals.entries()]
    .filter(([, total]) => total > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([sport]) => sport);
  const own = new Set(
    ranked.length > MAX_SPORTS ? ranked.slice(0, MAX_SPORTS - 1) : ranked,
  );
  const series: VolumeSeries[] = [
    ...own,
    ...(own.size < ranked.length ? [OTHER_SPORTS as VolumeSeries] : []),
  ];

  const rows = buckets.map(({ period, partial, sports }) => {
    const row: VolumeRow = { period, partial };
    for (const sport of sports) {
      const key = own.has(sport.sport) ? sport.sport : OTHER_SPORTS;
      if (!series.includes(key)) continue;
      row[key] = (row[key] ?? 0) + sport[metric] * scale;
    }
    return row;
  });
  return { rows, series };
}

/** All sports of each bucket, in the display units of the chart */
export function chartTotals(
  buckets: StatisticsVolumeDto['buckets'],
  metric: VolumeMetric,
  unitSystem: UnitSystem = 'METRIC',
): number[] {
  const scale = scaleFor(metric, unitSystem);
  return bucketTotals(buckets, metric).map((total) => total * scale);
}

/** A figure per bucket, for a sparkline */
export function bucketTotals(
  buckets: StatisticsVolumeDto['buckets'],
  metric: VolumeMetric,
): number[] {
  return buckets.map(({ sports }) =>
    sports.reduce((sum, sport) => sum + sport[metric], 0),
  );
}
