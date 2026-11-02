import { useStatisticsDurabilityQuery } from '@/api/statistics';
import { m } from '@/paraglide/messages';
import { useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  Scatter,
  XAxis,
  YAxis,
} from 'recharts';

import { SPORT_TYPE, StatisticsDurabilityDto } from '@openathlete/shared';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer } from '../ui/chart';
import { SkeletonChart } from '../ui/skeleton';
import { MetricInfo } from './metric-info';
import { QuickRead, QuickReadLine } from './quick-read';
import { StatSection } from './stat-section';
import { Period } from './statistics-period';
import { SegmentTabs } from './statistics-tabs';

interface P {
  athleteId: number;
  period: Period | null;
  sport: SPORT_TYPE;
}

type Kind = StatisticsDurabilityDto['outings'][number]['kind'];

const KIND_LABELS: Record<Kind, () => string> = {
  DRIFT_PACE: m.statistics_drift_pace,
  DRIFT_POWER: m.statistics_drift_power,
  DRIFT_HEARTRATE: m.statistics_drift_heartrate,
};

function DriftChart({
  data,
  kind,
}: {
  data: StatisticsDurabilityDto;
  kind: Kind;
}) {
  const outings = data.outings
    .filter((outing) => outing.kind === kind)
    .map(({ hours, percent }) => ({ hours, percent }));
  const classes = (
    data.series.find((series) => series.kind === kind)?.classes ?? []
  ).map(({ fromHours, low, median, high }) => ({
    hours: fromHours + 0.25,
    median,
    band: [low, high],
  }));
  return (
    <ChartContainer
      config={{
        median: { label: KIND_LABELS[kind](), color: 'var(--chart-1)' },
      }}
      className="h-[320px] w-full"
    >
      <ComposedChart margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="hours"
          type="number"
          domain={[1, 'dataMax']}
          tick={{ fontSize: 11 }}
          tickFormatter={(value: number) => `${Math.round(value * 10) / 10} h`}
          allowDuplicatedCategory={false}
        />
        <YAxis
          dataKey="percent"
          width={40}
          tick={{ fontSize: 11 }}
          tickFormatter={(value: number) =>
            `${Math.round(value)}${m.percent_symbol()}`
          }
        />
        <ReferenceLine y={0} stroke="var(--border)" />
        <Scatter
          data={outings}
          dataKey="percent"
          fill="var(--muted-foreground)"
          fillOpacity={0.5}
          isAnimationActive={false}
        />
        <Area
          data={classes}
          dataKey="band"
          type="linear"
          stroke="none"
          fill="var(--chart-1)"
          fillOpacity={0.15}
          isAnimationActive={false}
        />
        <Line
          data={classes}
          dataKey="median"
          type="linear"
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={{ r: 3 }}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ChartContainer>
  );
}

function Durability({ data }: { data: StatisticsDurabilityDto }) {
  const kinds = [...new Set(data.outings.map(({ kind }) => kind))];
  const [chosen, setChosen] = useState<Kind>();
  const kind = chosen && kinds.includes(chosen) ? chosen : kinds[0];
  if (!kind) {
    return (
      <Card className="gap-0 py-0">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          {m.statistics_durability_empty()}
        </CardContent>
      </Card>
    );
  }
  const classes =
    data.series.find((series) => series.kind === kind)?.classes ?? [];
  const last = classes.at(-1);
  const lines: QuickReadLine[] = [
    ...(last
      ? [
          {
            kind: 'observation' as const,
            text: m.statistics_durability_read({
              what: KIND_LABELS[kind](),
              percent: last.median.toFixed(1),
              hours: last.fromHours,
              count: last.count,
            }),
          },
        ]
      : []),
    { kind: 'limit', text: m.statistics_durability_read_limit() },
  ];
  return (
    <div className="space-y-4">
      <QuickRead lines={lines} />
      <Card className="gap-0 py-0" data-durability>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
          <CardTitle className="text-sm font-medium">
            {m.statistics_durability_title()}
          </CardTitle>
          <MetricInfo metric="drift" />
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          <SegmentTabs
            secondary
            label={m.statistics_durability_title()}
            value={kind}
            onChange={setChosen}
            items={kinds.map((id) => ({ id, label: KIND_LABELS[id] }))}
          />
          <DriftChart data={data} kind={kind} />
        </CardContent>
      </Card>
    </div>
  );
}

function DurabilityData({
  athleteId,
  period,
  sport,
  visible,
}: P & { visible: boolean }) {
  const { data } = useStatisticsDurabilityQuery(
    {
      athleteId,
      sport,
      from: period?.start ?? new Date(0),
      to: period?.end ?? new Date(0),
    },
    visible && !!period,
  );
  if (!data) return <SkeletonChart className="h-[400px] rounded-xl" />;
  return <Durability data={data} />;
}

export function EnduranceSection(props: P) {
  return (
    <StatSection plain id="endurance" title={m.statistics_capacity_endurance()}>
      {(visible) => <DurabilityData {...props} visible={visible} />}
    </StatSection>
  );
}
