import { useStatisticsIntensityQuery } from '@/api/statistics';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateFnsLocale } from '@/utils/locales';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';

import { SPORT_TYPE, StatisticsIntensityDto } from '@openathlete/shared';

import { cadenceFactor } from '../activity-analysis/tracks';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { SkeletonChart } from '../ui/skeleton';
import { MetricInfo } from './metric-info';
import { StatChart } from './stat-chart';
import { bucketLabel, bucketTick } from './stat-chart-format';
import { StatSection } from './stat-section';
import { Period } from './statistics-period';

type Bucket = StatisticsIntensityDto['buckets'][number];

interface P {
  athleteId: number;
  period: Period | null;
  sport: SPORT_TYPE | null;
}

const DOMAINS = [
  { key: 'low', color: 'var(--chart-2)', label: m.statistics_intensity_low },
  {
    key: 'middle',
    color: 'var(--chart-4)',
    label: m.statistics_intensity_middle,
  },
  { key: 'high', color: 'var(--chart-1)', label: m.statistics_intensity_high },
] as const;

/** Shares of the bucket's time, in percent, to compare weeks of any volume */
function intensityShares(bucket: Bucket) {
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

function Distribution({ data }: { data: StatisticsIntensityDto }) {
  const locale = getDateFnsLocale(getLocale());
  const rows = data.buckets.map(intensityShares);
  return (
    <Card className="gap-0 py-0" data-intensity>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {DOMAINS.map(({ key, color, label }) => (
            <span key={key} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: color }}
              />
              <span className="text-muted-foreground">{label()}</span>
            </span>
          ))}
          <MetricInfo metric="intensityDistribution" />
        </div>
        <ChartContainer
          config={Object.fromEntries(
            DOMAINS.map(({ key, color, label }) => [
              key,
              { label: label(), color },
            ]),
          )}
          className="h-[240px] w-full"
        >
          <BarChart data={rows} margin={{ top: 8, right: 8, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="period"
              tickFormatter={(value: string) =>
                bucketTick(value, data.granularity, locale)
              }
              tick={{ fontSize: 11 }}
              minTickGap={16}
            />
            <YAxis
              width={48}
              domain={[0, 100]}
              tick={{ fontSize: 11 }}
              tickFormatter={(value: number) => `${value}${m.percent_symbol()}`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as
                      (typeof rows)[number] | undefined;
                    return row
                      ? bucketLabel(row.period, data.granularity, locale)
                      : '';
                  }}
                  formatter={(value, name) => (
                    <div className="flex w-full items-center gap-2 text-xs text-muted-foreground">
                      {DOMAINS.find(({ key }) => key === name)?.label()}
                      <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
                        {Math.round(Number(value))}
                        {m.percent_symbol()}
                      </span>
                    </div>
                  )}
                />
              }
            />
            {DOMAINS.map(({ key, color }) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="intensity"
                fill={color}
                isAnimationActive={false}
              >
                {rows.map((row) => (
                  <Cell key={row.period} fillOpacity={row.partial ? 0.45 : 1} />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function SteadyTrends({
  data,
  sport,
}: {
  data: StatisticsIntensityDto;
  sport: SPORT_TYPE;
}) {
  const running = cadenceFactor(sport) === 2;
  const unit = running
    ? m.statistics_efficiency_unit_run()
    : m.statistics_efficiency_unit_bike();
  const trend = (
    key: 'efficiency' | 'decoupling',
    format: (value: number) => string,
    tooltip: (value: number) => string,
    color: string,
  ) => ({
    data: data.buckets.map((bucket) => ({
      period: bucket.period,
      partial: bucket.partial,
      value: bucket[key],
    })),
    format,
    tooltip,
    color,
  });
  const cards = [
    {
      key: 'efficiency' as const,
      title: m.statistics_efficiency(),
      unit,
      ...trend(
        'efficiency',
        (value) => value.toFixed(2),
        (value) => `${value.toFixed(2)} ${unit}`,
        'var(--chart-2)',
      ),
    },
    {
      key: 'decoupling' as const,
      title: m.statistics_decoupling(),
      unit: m.percent_symbol(),
      ...trend(
        'decoupling',
        (value) => value.toFixed(1),
        (value) => `${value.toFixed(1)}${m.percent_symbol()}`,
        'var(--chart-3)',
      ),
    },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {cards.map((card) => (
        <Card key={card.key} className="gap-0 py-0" data-steady={card.key}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}{' '}
              <span className="font-normal text-muted-foreground">
                ({card.unit})
              </span>
            </CardTitle>
            <MetricInfo metric={card.key} />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <StatChart
              label={card.title}
              granularity={data.granularity}
              color={card.color}
              data={card.data}
              formatValue={card.format}
              formatTooltip={card.tooltip}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Intensity({
  athleteId,
  period,
  sport,
  visible,
}: P & { visible: boolean }) {
  const { data } = useStatisticsIntensityQuery(
    {
      athleteId,
      from: period?.start ?? new Date(0),
      to: period?.end ?? new Date(0),
      sport: sport ?? undefined,
    },
    visible && !!period,
  );
  if (!data) return <SkeletonChart className="h-[300px] rounded-xl" />;
  if (!data.buckets.some((b) => b.low + b.middle + b.high > 0)) {
    return (
      <Card className="gap-0 py-0">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          {m.statistics_intensity_empty()}
        </CardContent>
      </Card>
    );
  }
  const steady = sport && data.buckets.some((bucket) => bucket.steadyCount > 0);
  return (
    <div className="space-y-4">
      {data.defaultZones && (
        <p className="text-sm text-muted-foreground" data-default-zones>
          {m.statistics_intensity_default_zones()}
        </p>
      )}
      <Distribution data={data} />
      {steady && <SteadyTrends data={data} sport={sport} />}
    </div>
  );
}

export function IntensitySection(props: P) {
  return (
    <StatSection id="intensity" title={m.statistics_section_intensity()}>
      {(visible) => <Intensity {...props} visible={visible} />}
    </StatSection>
  );
}
