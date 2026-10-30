import {
  useStatisticsOverviewQuery,
  useStatisticsVolumeQuery,
} from '@/api/statistics';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { sportTypeLabelMap } from '@/utils/label-map/core';
import { getDateFnsLocale } from '@/utils/locales';
import { useState } from 'react';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from 'recharts';

import {
  SPORT_TYPE,
  SportGroup,
  formatDistance,
  formatDuration,
} from '@openathlete/shared';

import { SportDistributionChart } from '../charts/sport-distribution-chart';
import { Card, CardContent } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { SkeletonChart } from '../ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { bucketLabel, bucketTick } from './stat-chart-format';
import { StatSection } from './stat-section';
import { Period } from './statistics-period';
import {
  OTHER_SPORTS,
  VolumeMetric,
  VolumeRow,
  VolumeSeries,
  chartTotals,
  volumeChartData,
} from './volume-data';

interface P {
  athleteId: number;
  period: Period | null;
  compared: Period | null;
  sport: SPORT_TYPE | null;
  group: SportGroup | null;
}

const color = (index: number) => `var(--chart-${(index % 5) + 1})`;

export function VolumeSection({
  athleteId,
  period,
  compared,
  sport,
  group,
}: P) {
  const [metric, setMetric] = useState<VolumeMetric>('movingTime');
  return (
    <StatSection
      id="volume"
      title={m.statistics_section_volume()}
      actions={
        <Tabs
          value={metric}
          onValueChange={(value) => setMetric(value as VolumeMetric)}
        >
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="movingTime">{m.duration()}</TabsTrigger>
            <TabsTrigger value="distance">{m.distance()}</TabsTrigger>
            <TabsTrigger value="elevationGain">
              {m.elevation_gain()}
            </TabsTrigger>
            <TabsTrigger value="count">{m.statistics_activities()}</TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
      {(visible) => (
        <VolumeCharts
          athleteId={athleteId}
          period={period}
          compared={compared}
          sport={sport}
          group={group}
          metric={metric}
          visible={visible}
        />
      )}
    </StatSection>
  );
}

function VolumeCharts({
  athleteId,
  period,
  compared,
  sport,
  group,
  metric,
  visible,
}: P & { metric: VolumeMetric; visible: boolean }) {
  const params = {
    athleteId,
    from: period?.start ?? new Date(0),
    to: period?.end ?? new Date(0),
    sport: sport ?? undefined,
    group: group ?? undefined,
  };
  const enabled = visible && !!period;
  const { data: volume, isFetching } = useStatisticsVolumeQuery(
    params,
    enabled,
  );
  // The same totals as the summary: no second request without a comparison
  const { data: overview } = useStatisticsOverviewQuery(params, enabled);
  const { data: before } = useStatisticsVolumeQuery(
    {
      ...params,
      from: compared?.start ?? new Date(0),
      to: compared?.end ?? new Date(0),
    },
    enabled && !!compared,
  );
  const locale = getDateFnsLocale(getLocale());

  const { rows: bars, series } = volumeChartData(volume?.buckets ?? [], metric);
  const granularity = volume?.granularity ?? 'week';
  // Periods have the same length: buckets line up by rank
  const totals = before && compared ? chartTotals(before.buckets, metric) : [];
  // Day by day, rest days turn the line into noise
  const overlaid = !!compared && granularity !== 'day';
  const rows = bars.map((row, index) => ({
    ...row,
    compared: totals[index],
  }));
  const unit: Record<VolumeMetric, string> = {
    movingTime: 'h',
    distance: m.kilometers(),
    elevationGain: m.short_elevation_gain(),
    count: '',
  };
  const seriesLabel = (key: VolumeSeries | 'compared') =>
    key === 'compared'
      ? m.statistics_series_compared()
      : key === OTHER_SPORTS
        ? m.other_sports()
        : sportTypeLabelMap[key];
  const formatValue = (value: number) =>
    metric === 'movingTime' ? value.toFixed(1) : `${Math.round(value)}`;
  const formatSlice: Record<VolumeMetric, (value: number) => string> = {
    movingTime: formatDuration,
    distance: (value) => `${formatDistance(value)} ${m.kilometers()}`,
    elevationGain: (value) => `${Math.round(value)} ${m.meters()}`,
    count: (value) => `${value}`,
  };
  const showPie = !sport && (overview?.sports.length ?? 0) > 1;

  return (
    <div
      className={`grid grid-cols-1 gap-4 transition-opacity md:grid-cols-3 ${isFetching ? 'opacity-70' : ''}`}
      data-volume
    >
      <Card
        className={`gap-0 py-0 ${showPie ? 'md:col-span-2' : 'md:col-span-3'}`}
      >
        <CardContent className="space-y-3 p-4">
          {!volume ? (
            <SkeletonChart className="h-[300px]" />
          ) : series.length === 0 ? (
            <p className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              {m.no_data_for_period()}
            </p>
          ) : (
            <>
              <ul className="flex min-h-5 flex-wrap gap-x-4 gap-y-1 text-sm">
                {series.map((key, index) => (
                  <li key={key} className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: color(index) }}
                    />
                    <span className="text-muted-foreground">
                      {seriesLabel(key)}
                    </span>
                  </li>
                ))}
                {overlaid && (
                  <li className="flex items-center gap-1.5">
                    <span className="w-4 border-t-2 border-dashed border-muted-foreground" />
                    <span className="text-muted-foreground">
                      {seriesLabel('compared')}
                    </span>
                  </li>
                )}
                {rows.some((row) => row.partial) && (
                  <li className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-muted-foreground/40" />
                    <span className="text-muted-foreground">
                      {m.statistics_partial_period()}
                    </span>
                  </li>
                )}
              </ul>
              <ChartContainer
                config={Object.fromEntries(
                  series.map((key, index) => [
                    key,
                    { label: seriesLabel(key), color: color(index) },
                  ]),
                )}
                className="h-[272px] w-full"
              >
                <ComposedChart
                  data={rows}
                  margin={{ top: 8, right: 8, left: 0 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="period"
                    tickFormatter={(value: string) =>
                      bucketTick(value, granularity, locale)
                    }
                    tick={{ fontSize: 11 }}
                    minTickGap={16}
                  />
                  <YAxis
                    width={40}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value: number) =>
                      `${Math.round(value * 10) / 10}`
                    }
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_, payload) => {
                          const row = payload?.[0]?.payload as
                            VolumeRow | undefined;
                          if (!row) return '';
                          const text = bucketLabel(
                            row.period,
                            granularity,
                            locale,
                          );
                          return row.partial
                            ? `${text} (${m.statistics_partial_period()})`
                            : text;
                        }}
                        formatter={(value, name) => (
                          <div className="flex w-full items-center gap-2 text-xs text-muted-foreground">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-sm"
                              style={{
                                backgroundColor:
                                  name === 'compared'
                                    ? 'var(--muted-foreground)'
                                    : color(
                                        series.indexOf(name as VolumeSeries),
                                      ),
                              }}
                            />
                            {seriesLabel(name as VolumeSeries | 'compared')}
                            <span className="ml-auto font-medium tabular-nums text-foreground">
                              {formatValue(Number(value))} {unit[metric]}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  {series.map((key, index) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      stackId="volume"
                      fill={color(index)}
                      isAnimationActive={false}
                    >
                      {rows.map((row) => (
                        <Cell
                          key={row.period}
                          fillOpacity={row.partial ? 0.45 : 1}
                        />
                      ))}
                    </Bar>
                  ))}
                  {overlaid && (
                    <Line
                      dataKey="compared"
                      type="linear"
                      stroke="var(--muted-foreground)"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      connectNulls
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}
                </ComposedChart>
              </ChartContainer>
            </>
          )}
        </CardContent>
      </Card>
      {showPie && overview && (
        <Card className="gap-0 py-0">
          <CardContent className="p-0 pt-4">
            <SportDistributionChart
              sports={overview.sports}
              colorOrder={series.filter(
                (key): key is SPORT_TYPE => key !== OTHER_SPORTS,
              )}
              keyToUse={metric}
              formatter={formatSlice[metric]}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
