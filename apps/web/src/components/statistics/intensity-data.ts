import { StatisticsIntensityDto } from '@openathlete/shared';

type Bucket = StatisticsIntensityDto['buckets'][number];

/** How the intensity chart reads a bucket: shares of its time, or hours */
export type IntensityUnit = 'share' | 'hours';

export interface IntensityRow {
  period: string;
  partial: boolean;
  low: number;
  middle: number;
  high: number;
}

/** Shares of the bucket's time, in percent, to compare weeks of any volume */
export function intensityShares(bucket: Bucket): IntensityRow {
  const total = bucket.low + bucket.middle + bucket.high;
  const share = (value: number) => (total ? (value / total) * 100 : 0);
  return {
    period: bucket.period,
    partial: bucket.partial,
    low: share(bucket.low),
    middle: share(bucket.middle),
    high: share(bucket.high),
  };
}

/**
 * Hours spent in each domain: how much easy work a week holds, which shares
 * hide (80% of 3 hours is not 80% of 10)
 */
export function intensityHours(bucket: Bucket): IntensityRow {
  return {
    period: bucket.period,
    partial: bucket.partial,
    low: bucket.low / 3600,
    middle: bucket.middle / 3600,
    high: bucket.high / 3600,
  };
}

export function intensityRows(
  buckets: StatisticsIntensityDto['buckets'],
  unit: IntensityUnit,
): IntensityRow[] {
  return buckets.map(unit === 'share' ? intensityShares : intensityHours);
}
