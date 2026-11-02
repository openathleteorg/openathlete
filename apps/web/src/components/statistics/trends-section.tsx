import { useStatisticsTrendsQuery } from '@/api/statistics';
import { m } from '@/paraglide/messages';
import { ReactNode } from 'react';

import {
  SPORT_TYPE,
  StatisticsTrendsDto,
  formatDistance,
  formatSpeed,
  formatSpeedUnit,
  getSportConfig,
} from '@openathlete/shared';

import { cadenceFactor } from '../activity-analysis/tracks';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton, SkeletonChart } from '../ui/skeleton';
import { ExportButton } from './export-button';
import { MetricInfo } from './metric-info';
import { StatChart } from './stat-chart';
import { StatSection } from './stat-section';
import { Period } from './statistics-period';

type Bucket = StatisticsTrendsDto['buckets'][number];

interface P {
  athleteId: number;
  period: Period | null;
  compared: Period | null;
  sport: SPORT_TYPE | null;
}

interface Trend {
  key: string;
  title: string;
  info?: ReactNode;
  value: (bucket: Bucket) => number | null;
  format: (value: number) => string;
  unit: string;
  color: string;
}

/** The figures that mean something for a sport, in the order it reads them */
function sportTrends(sport: SPORT_TYPE): Trend[] {
  const config = getSportConfig(sport);
  const speedUnit = formatSpeedUnit(config.speedUnit);
  const speed = (value: number) => formatSpeed(value, config.speedUnit);
  const trends: (Trend | false)[] = [
    config.showSpeed && {
      key: 'speed',
      title: config.speedLabel === 'pace' ? m.pace() : m.average_speed(),
      value: (bucket) => bucket.averageSpeed,
      format: speed,
      unit: speedUnit,
      color: 'var(--chart-1)',
    },
    config.showGap && {
      key: 'gap',
      title: m.gap(),
      info: <MetricInfo metric="gap" />,
      value: (bucket) => bucket.averageGapSpeed,
      format: speed,
      unit: speedUnit,
      color: 'var(--chart-2)',
    },
    config.showHeartrate && {
      key: 'heartrate',
      title: m.average_heart_rate(),
      value: (bucket) => bucket.averageHeartrate,
      format: (value) => `${Math.round(value)}`,
      unit: 'bpm',
      color: 'var(--chart-3)',
    },
    config.showPower && {
      key: 'power',
      title: m.average_power(),
      value: (bucket) => bucket.averageWatts,
      format: (value) => `${Math.round(value)}`,
      unit: 'W',
      color: 'var(--chart-4)',
    },
    {
      key: 'cadence',
      title: m.average_cadence(),
      value: (bucket) =>
        bucket.averageCadence === null
          ? null
          : bucket.averageCadence * cadenceFactor(sport),
      format: (value) => `${Math.round(value)}`,
      unit: cadenceFactor(sport) === 2 ? m.steps_per_minute() : 'rpm',
      color: 'var(--chart-5)',
    },
    config.showPower && {
      key: 'weightedPower',
      title: m.statistics_weighted_power(),
      value: (bucket) => bucket.weightedWatts,
      format: (value) => `${Math.round(value)}`,
      unit: 'W',
      color: 'var(--chart-1)',
    },
    config.showElevation && {
      key: 'verticalSpeed',
      title: m.statistics_vertical_speed(),
      value: (bucket) => bucket.verticalSpeed,
      format: (value) => `${Math.round(value)}`,
      unit: m.statistics_metres_per_hour(),
      color: 'var(--chart-3)',
    },
    config.showDistance && {
      key: 'distance',
      title: m.average_distance_per_activity(),
      value: (bucket) => bucket.distancePerActivity,
      format: (value) => formatDistance(value),
      unit: m.kilometers(),
      color: 'var(--chart-1)',
    },
    config.showElevation && {
      key: 'elevation',
      title: m.average_elevation_gain_per_activity(),
      value: (bucket) => bucket.elevationPerActivity,
      format: (value) => `${Math.round(value)}`,
      unit: m.short_elevation_gain(),
      color: 'var(--chart-2)',
    },
  ];
  return trends.filter((trend): trend is Trend => !!trend);
}

function TrendsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }, (_, index) => (
        <Card key={index} className="gap-0 py-0">
          <CardHeader className="p-4 pb-2">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <SkeletonChart className="h-[200px]" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Trends({
  athleteId,
  period,
  compared,
  sport,
  visible,
}: Omit<P, 'sport'> & { sport: SPORT_TYPE; visible: boolean }) {
  const { data, isFetching } = useStatisticsTrendsQuery(
    {
      athleteId,
      from: period?.start ?? new Date(0),
      to: period?.end ?? new Date(0),
      sport,
    },
    visible && !!period,
  );
  const { data: previous } = useStatisticsTrendsQuery(
    {
      athleteId,
      from: compared?.start ?? new Date(0),
      to: compared?.end ?? new Date(0),
      sport,
    },
    visible && !!compared,
  );
  if (!data) return <TrendsSkeleton />;

  // Up always means more, or faster: paces are drawn as speeds
  const trends = sportTrends(sport).filter((trend) =>
    // Null or zero everywhere: flat ground, no sensor, nothing to read
    data.buckets.some((bucket) => !!trend.value(bucket)),
  );
  if (trends.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {m.no_data_for_period()}
      </p>
    );
  }
  return (
    <div
      className={`grid grid-cols-1 gap-4 transition-opacity md:grid-cols-2 ${isFetching ? 'opacity-70' : ''}`}
    >
      <div className="flex justify-end md:col-span-2">
        <ExportButton
          name="trends"
          header={['period', ...trends.map(({ key }) => key)]}
          rows={() =>
            data.buckets.map((bucket) => [
              bucket.period,
              ...trends.map((trend) => trend.value(bucket)),
            ])
          }
        />
      </div>
      {trends.map((trend) => (
        <Card key={trend.key} data-trend={trend.key} className="gap-0 py-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-sm font-medium">
              {trend.title}{' '}
              <span className="font-normal text-muted-foreground">
                ({trend.unit})
              </span>
            </CardTitle>
            {trend.info}
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <StatChart
              label={trend.title}
              granularity={data.granularity}
              color={trend.color}
              formatValue={trend.format}
              formatTooltip={(value) => `${trend.format(value)} ${trend.unit}`}
              comparedLabel={
                compared ? m.statistics_series_compared() : undefined
              }
              data={data.buckets.map((bucket, index) => {
                // Periods have the same length: buckets line up by rank
                const before = compared && previous?.buckets[index];
                return {
                  period: bucket.period,
                  partial: bucket.partial,
                  value: trend.value(bucket),
                  compared: before ? trend.value(before) : null,
                };
              })}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Averages mix badly across sports: they read on one. */
export function TrendsSection({
  athleteId,
  period,
  compared,
  sport,
}: Omit<P, 'sport'> & { sport: SPORT_TYPE }) {
  return (
    <StatSection id="trends" title={m.statistics_section_trends()}>
      {(visible) => (
        <Trends
          athleteId={athleteId}
          period={period}
          compared={compared}
          sport={sport}
          visible={visible}
        />
      )}
    </StatSection>
  );
}
