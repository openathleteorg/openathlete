import { useStatisticsEfficiencyQuery } from '@/api/statistics';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateLocale } from '@/utils/locales';
import { useState } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
} from 'recharts';

import { SPORT_TYPE, StatisticsEfficiencyDto } from '@openathlete/shared';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { SkeletonChart } from '../ui/skeleton';
import {
  EFFICIENCY_WINDOW,
  EfficiencyKind,
  efficiencyPoints,
  trendChange,
} from './efficiency-data';
import { ExportButton } from './export-button';
import { MetricInfo } from './metric-info';
import { QuickRead, QuickReadLine } from './quick-read';
import { Period } from './statistics-period';
import { SegmentTabs } from './statistics-tabs';

const KINDS: {
  id: EfficiencyKind;
  label: () => string;
  unit: string;
  digits: number;
}[] = [
  { id: 'total', label: m.statistics_efficiency_total, unit: 'm', digits: 2 },
  {
    id: 'metabolic',
    label: m.statistics_efficiency_metabolic,
    unit: 'J',
    digits: 0,
  },
  {
    id: 'biomechanical',
    label: m.statistics_efficiency_biomechanical,
    unit: 'm/kJ',
    digits: 1,
  },
  { id: 'factor', label: m.statistics_efficiency, unit: '', digits: 2 },
];

const COLOR = 'var(--chart-2)';

function EfficiencyChart({
  data,
  kind,
}: {
  data: StatisticsEfficiencyDto;
  kind: (typeof KINDS)[number];
}) {
  const points = efficiencyPoints(data, kind.id);
  const day = new Intl.DateTimeFormat(getDateLocale(getLocale()), {
    day: 'numeric',
    month: 'short',
  });
  const format = (value: number) => value.toFixed(kind.digits);
  const change = trendChange(points);
  const lines: QuickReadLine[] = [
    ...(change
      ? [
          {
            kind: 'observation' as const,
            text: m.statistics_efficiency_read({
              change: `${change.change >= 0 ? '+' : ''}${(change.change * 100).toFixed(1)} %`,
              from: format(change.from),
              to: format(change.to),
              unit: kind.unit,
            }),
          },
        ]
      : []),
    { kind: 'limit', text: m.statistics_efficiency_read_limit() },
  ];
  if (points.length === 0) {
    return (
      <p className="p-6 text-center text-sm text-muted-foreground">
        {m.statistics_efficiency_empty()}
      </p>
    );
  }
  const labels: Record<string, string> = {
    value: m.statistics_efficiency_runs(),
    average: m.statistics_efficiency_average({ count: EFFICIENCY_WINDOW }),
    trend: m.statistics_efficiency_trend(),
  };
  return (
    <div className="space-y-3">
      <QuickRead lines={lines} />
      <ChartContainer
        config={{ value: { label: labels.value, color: COLOR } }}
        className="h-[300px] w-full"
        data-efficiency={kind.id}
      >
        <ComposedChart
          data={points}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="x"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(x: number) => day.format(new Date(x))}
            tick={{ fontSize: 11 }}
            minTickGap={32}
          />
          <YAxis
            width={48}
            domain={['auto', 'auto']}
            tick={{ fontSize: 11 }}
            tickFormatter={format}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideIndicator
                labelFormatter={(_, payload) => {
                  const point = payload?.[0]?.payload;
                  return point
                    ? `${point.name} · ${day.format(new Date(point.x))}`
                    : '';
                }}
                formatter={(value, name) => (
                  <div className="flex w-full items-center gap-2 text-xs text-muted-foreground">
                    {labels[String(name)] ?? String(name)}
                    <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
                      {format(Number(value))} {kind.unit}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Scatter
            dataKey="value"
            fill={COLOR}
            fillOpacity={0.45}
            isAnimationActive={false}
          />
          <Line
            dataKey="average"
            type="linear"
            stroke={COLOR}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            dataKey="trend"
            type="linear"
            stroke="var(--muted-foreground)"
            strokeDasharray="5 4"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ChartContainer>
      <div className="flex justify-end">
        <ExportButton
          name={`efficiency-${kind.id}`}
          header={['date', 'activity', kind.id, 'average', 'trend']}
          rows={() =>
            points.map((point) => [
              new Date(point.x).toISOString().slice(0, 10),
              point.name,
              point.value,
              point.average,
              point.trend,
            ])
          }
        />
      </div>
    </div>
  );
}

/** How the athlete's runs turn power and heartbeats into distance, over time */
export function EfficiencyCard({
  athleteId,
  period,
  sport,
  visible,
}: {
  athleteId: number;
  period: Period | null;
  sport: SPORT_TYPE;
  visible: boolean;
}) {
  const [chosen, setChosen] = useState<EfficiencyKind>('total');
  const { data } = useStatisticsEfficiencyQuery(
    {
      athleteId,
      sport,
      from: period?.start ?? new Date(0),
      to: period?.end ?? new Date(0),
    },
    visible && !!period,
  );
  if (!data) return <SkeletonChart className="h-[400px] rounded-xl" />;
  // Kinds without a single run stay out: no power meter, no metres per joule
  const kinds = KINDS.filter((kind) =>
    data.runs.some((run) => run[kind.id] !== null),
  );
  const kind = kinds.find((item) => item.id === chosen) ?? kinds[0];
  return (
    <Card className="gap-0 py-0" data-run-efficiency>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
        <CardTitle className="text-sm font-medium">
          {m.statistics_run_efficiency()}
        </CardTitle>
        <MetricInfo metric="runEfficiency" />
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        {kind ? (
          <>
            <SegmentTabs
              secondary
              label={m.statistics_run_efficiency()}
              value={kind.id}
              onChange={setChosen}
              items={kinds.map(({ id, label }) => ({ id, label }))}
            />
            <EfficiencyChart data={data} kind={kind} />
          </>
        ) : (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {m.statistics_efficiency_empty()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
