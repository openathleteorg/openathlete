import { useMemo, useState } from 'react';

import { useStatisticsIntensityQuery } from '@/api/statistics';

import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateFnsLocale } from '@/utils/locales';

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import { subWeeks } from 'date-fns';

import {
  SPORT_TYPE,
  SportGroup,
  StatisticsIntensityDto,
  formatDuration,
} from '@openathlete/shared';

import { cadenceFactor } from '../activity-analysis/tracks';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { SkeletonChart } from '../ui/skeleton';

import {
  IntensityUnit,
  intensityRows,
  intensityShares,
} from './intensity-data';

import { MetricInfo } from './metric-info';
import { StatChart } from './stat-chart';
import { bucketLabel, bucketTick } from './stat-chart-format';
import { StatSection } from './stat-section';
import { Period } from './statistics-period';
import { SegmentTabs } from './statistics-tabs';

import {
  calculatePolarizationIndex,
  classifyByPolarizationIndex,
  classifyDistribution,
  getRecommendation,
} from './intensity-analysis-utils';

import type {
  IntensityAnalysis,
  ZoneDistribution,
  RecommendationKey,
} from './intensity-analysis.types';

import { IntensityAnalysisChart } from './intensity-analysis-chart';
import { IntensityAnalysisRecommendation } from './intensity-analysis-recommendation';

type IntensityAnalysisPeriod = 4 | 8 | 12;

interface P {
  athleteId: number;
  period: Period | null;
  compared: Period | null;
  sport: SPORT_TYPE | null;
  group: SportGroup | null;
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

const MODEL_LABELS = {
  POLARIZED: 'Polarized',
  PYRAMIDAL: 'Pyramidal',
  THRESHOLD: 'Threshold-based',
  INVERTED_PYRAMIDAL: 'Inverted pyramidal',
  MIXED: 'Mixed distribution',
} as const;

const POLARIZATION_LABELS = {
  POLARIZED: 'Polarized distribution',
  NON_POLARIZED: 'Non-polarized distribution',
  UNDEFINED: 'Classification unavailable',
} as const;

function Distribution({
  data,
  unit,
}: {
  data: StatisticsIntensityDto;
  unit: IntensityUnit;
}) {
  const locale = getDateFnsLocale(getLocale());
  const rows = intensityRows(data.buckets, unit);
  const hours = unit === 'hours';

  return (
    <Card className="gap-0 py-0" data-intensity data-intensity-unit={unit}>
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
              domain={hours ? [0, 'auto'] : [0, 100]}
              tick={{ fontSize: 11 }}
              tickFormatter={(value: number) =>
                hours
                  ? `${Math.round(value * 10) / 10} h`
                  : `${Math.round(value)}${m.percent_symbol()}`
              }
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
                      <span className="ml-auto font-medium tabular-nums text-foreground">
                        {hours
                          ? formatDuration(Math.round(Number(value) * 3600))
                          : `${Math.round(Number(value))}${m.percent_symbol()}`}
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

function periodShares({ buckets }: StatisticsIntensityDto) {
  return intensityShares(
    buckets.reduce(
      (sum, bucket) => ({
        ...sum,
        low: sum.low + bucket.low,
        middle: sum.middle + bucket.middle,
        high: sum.high + bucket.high,
      }),
      { ...buckets[0], low: 0, middle: 0, high: 0 },
    ),
  );
}

function Comparison({
  data,
  before,
}: {
  data: StatisticsIntensityDto;
  before: StatisticsIntensityDto;
}) {
  const [current, previous] = [periodShares(data), periodShares(before)];

  if (previous.low + previous.middle + previous.high === 0) return null;

  const line = (shares: typeof current) =>
    DOMAINS.map(({ key }) => `${Math.round(shares[key])}`).join(' / ');

  return (
    <p
      className="text-sm text-muted-foreground tabular-nums"
      data-intensity-compared
    >
      {m.statistics_intensity_compared({
        current: line(current),
        previous: line(previous),
      })}
    </p>
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

/**
 * Converts the actual API intensity totals into three-zone percentages.
 */
function toThreeZoneDistribution(
  data: StatisticsIntensityDto,
): ZoneDistribution {
  const totals = data.buckets.reduce(
    (sum, bucket) => ({
      low: sum.low + bucket.low,
      middle: sum.middle + bucket.middle,
      high: sum.high + bucket.high,
    }),
    { low: 0, middle: 0, high: 0 },
  );

  const shares = intensityShares({
    period: '',
    partial: false,
    ...totals,
  });

  return {
    z1: shares.low,
    z2: shares.middle,
    z3: shares.high,
  };
}

/**
 * Reads real training-load data from the existing statistics API.
 * Load values are TRIMP; CTL, ATL and TSB come from the API.
 */
function getTrainingLoadMetrics(data: StatisticsLoadDto | undefined) {
  if (!data?.points.length) {
    return {
      weeklyVolume: 0,
      previousWeeklyVolume: null as number | null,
      recentLoadTrend: 'STABLE' as const,
      recoveryStatus: 'UNKNOWN' as const,
      ctl: null as number | null,
      atl: null as number | null,
      tsb: null as number | null,
    };
  }

  const points = data.points.filter((point) => !point.projected);
  const latest = points.at(-1);
  const previous = points.at(-2);

  if (!latest) {
    return {
      weeklyVolume: 0,
      previousWeeklyVolume: null,
      recentLoadTrend: 'STABLE' as const,
      recoveryStatus: 'UNKNOWN' as const,
      ctl: null,
      atl: null,
      tsb: null,
    };
  }

  const weeklyVolume = latest.load;
  const previousWeeklyVolume = previous?.load ?? null;

  const recentLoadTrend =
    previousWeeklyVolume !== null &&
    weeklyVolume > previousWeeklyVolume * 1.15
      ? 'INCREASING'
      : 'STABLE';

  return {
    weeklyVolume,
    previousWeeklyVolume,
    recentLoadTrend,
    recoveryStatus: 'UNKNOWN' as const,
    ctl: latest.ctl,
    atl: latest.atl,
    tsb: latest.tsb,
  };
}

function IntensityAnalysis({
  data,
  analysisPeriod,
}: {
  data: StatisticsIntensityDto;
  analysisPeriod: IntensityAnalysisPeriod;
}) {

  const analysis = useMemo(() => {
    const distribution = toThreeZoneDistribution(data);

    const polarizationIndex =
      calculatePolarizationIndex(distribution);

    const polarizationClassification =
      classifyByPolarizationIndex(polarizationIndex);

    return {
      distribution,
      model: classifyDistribution(distribution),
      polarizationIndex,
      polarizationClassification,

      // No training load dependency.
      weeklyVolume: 0,
      previousWeeklyVolume: null,
      recoveryStatus: 'UNKNOWN',
      recentLoadTrend: 'STABLE',
      trainingHistoryWeeks: analysisPeriod,

      trainingLoad: null,

      references: {
        polarized: { z1: 75, z2: 5, z3: 20 },
        pyramidal: { z1: 70, z2: 20, z3: 10 },
      },
    } satisfies IntensityAnalysis;
  }, [data, analysisPeriod]);

  const hasTrainingData =
    analysis.distribution.z1 +
      analysis.distribution.z2 +
      analysis.distribution.z3 >
    0;

  if (!hasTrainingData) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold">
          Training intensity analysis
        </h3>

        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
          {MODEL_LABELS[analysis.model]}
        </span>
      </div>

      <IntensityAnalysisChart
        actual={analysis.distribution}
        polarized={analysis.references.polarized}
        pyramidal={analysis.references.pyramidal}
      />

      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Easy · Z1',
            value: analysis.distribution.z1,
            color: 'text-green-600',
          },
          {
            label: 'Threshold · Z2',
            value: analysis.distribution.z2,
            color: 'text-amber-600',
          },
          {
            label: 'High intensity · Z3',
            value: analysis.distribution.z3,
            color: 'text-red-600',
          },
        ].map((zone) => (
          <div
            key={zone.label}
            className="rounded-lg border p-3 text-center"
          >
            <p className="text-xs text-muted-foreground">
              {zone.label}
            </p>

            <p className={`mt-1 text-xl font-semibold ${zone.color}`}>
              {zone.value.toFixed(1)}%
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
	  <Card className="gap-0 py-0">
	    <CardContent className="p-3">
	      <p className="text-xs text-muted-foreground">
		Training distribution
	      </p>

	      <p className="mt-1 text-xl font-semibold">
		{MODEL_LABELS[analysis.model]}
	      </p>

	      <p className="text-xs text-muted-foreground">
		Based on your Z1 / Z2 / Z3 distribution
	      </p>
	    </CardContent>
	  </Card>

	  <Card className="gap-0 py-0">
	    <CardContent className="p-3">
	      <p className="text-xs text-muted-foreground">
		Analysis period
	      </p>

	      <p className="mt-1 text-xl font-semibold">
		{analysisPeriod} weeks
	      </p>
	    </CardContent>
	  </Card>
	</div>

      <IntensityAnalysisRecommendation analysis={analysis} />

	<p className="text-xs leading-relaxed text-muted-foreground">
	  Reference distributions are examples, not mandatory targets.
	  Recommendations are based on intensity distribution.
	</p>
    </div>
  );
}

function Intensity({
  athleteId,
  period,
  compared,
  sport,
  group,
  unit,
  visible,
}: P & { unit: IntensityUnit; visible: boolean }) {
  const [analysisPeriod, setAnalysisPeriod] =
    useState<IntensityAnalysisPeriod>(8);
    
  const params = {
    athleteId,
    from: period?.start ?? new Date(0),
    to: period?.end ?? new Date(0),
    sport: sport ?? undefined,
    group: group ?? undefined,
  };

  const { data } = useStatisticsIntensityQuery(
    params,
    visible && !!period,
  );

  const { data: before } = useStatisticsIntensityQuery(
    {
      athleteId,
      from: compared?.start ?? new Date(0),
      to: compared?.end ?? new Date(0),
      sport: sport ?? undefined,
      group: group ?? undefined,
    },
    visible && !!compared,
  );

  /**
   * Dedicated intensity query for TID analysis.
   *
   * The selected 4, 8 or 12-week period directly
   * changes the API date range.
   */
  const analysisParams = {
    athleteId,
    from: subWeeks(period?.end ?? new Date(), analysisPeriod),
    to: period?.end ?? new Date(),
    sport: sport ?? undefined,
    group: group ?? undefined,
  };

  const {
    data: analysisData,
    isLoading: isAnalysisLoading,
  } = useStatisticsIntensityQuery(
    analysisParams,
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

  const steady =
    sport && data.buckets.some((bucket) => bucket.steadyCount > 0);

  return (
    <div className="space-y-4">
      {data.defaultZones && (
        <p className="text-sm text-muted-foreground" data-default-zones>
          {m.statistics_intensity_default_zones()}
        </p>
      )}

      <Distribution data={data} unit={unit} />

      {compared && before && <Comparison data={data} before={before} />}

      {steady && <SteadyTrends data={data} sport={sport} />}

      <div className="space-y-4">
	  <div className="flex gap-2" aria-label="Analysis period">
	    {([4, 8, 12] as const).map((weeks) => (
	      <button
		key={weeks}
		type="button"
		onClick={() => setAnalysisPeriod(weeks)}
		aria-pressed={analysisPeriod === weeks}
		className={`rounded-full border px-4 py-2 text-sm transition-colors ${
		  analysisPeriod === weeks
		    ? 'border-primary bg-primary text-primary-foreground'
		    : 'hover:bg-muted'
		}`}
	      >
		{weeks} weeks
	      </button>
	    ))}
	  </div>

	  {isAnalysisLoading || !analysisData ? (
	    <SkeletonChart className="h-[300px] rounded-xl" />
	  ) : (
	    <IntensityAnalysis
	      data={analysisData}
	      analysisPeriod={analysisPeriod}
	    />
	  )}
	</div>
	
    </div>
  );
}

export function IntensitySection(props: P) {
  const [unit, setUnit] = useState<IntensityUnit>('share');

  return (
    <StatSection
      id="intensity"
      title={m.statistics_section_intensity()}
      actions={
        <SegmentTabs
          secondary
          label={m.statistics_section_intensity()}
          value={unit}
          onChange={setUnit}
          items={[
            { id: 'share', label: m.percent_symbol },
            { id: 'hours', label: m.duration },
          ]}
        />
      }
    >
      {(visible) => (
        <Intensity {...props} unit={unit} visible={visible} />
      )}
    </StatSection>
  );
}

