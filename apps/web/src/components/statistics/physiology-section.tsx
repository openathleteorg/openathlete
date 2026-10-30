import { useStatisticsCardiacCostQuery } from '@/api/statistics';
import { m } from '@/paraglide/messages';

import { SPORT_TYPE, StatisticsCardiacCostDto } from '@openathlete/shared';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { SkeletonChart } from '../ui/skeleton';
import { referenceOutput } from './capacity-data';
import { MetricInfo } from './metric-info';
import { QuantileChart } from './quantile-chart';
import { QuickRead, QuickReadLine } from './quick-read';
import { StatSection } from './stat-section';
import { Period } from './statistics-period';

interface P {
  athleteId: number;
  period: Period | null;
  compared: Period | null;
  sport: SPORT_TYPE;
}

function Cost({
  data,
  before,
}: {
  data: StatisticsCardiacCostDto;
  before?: StatisticsCardiacCostDto;
}) {
  if (data.bins.length === 0) {
    return (
      <Card className="gap-0 py-0">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          {m.statistics_cost_empty()}
        </CardContent>
      </Card>
    );
  }
  const power = data.unit === 'power';
  const output = (value: number) => (power ? `${value} W` : `${value} km/h`);
  const reference = referenceOutput(data, before);
  const lines: QuickReadLine[] = [
    ...(reference?.current && reference.previous
      ? [
          {
            kind: 'observation' as const,
            text: m.statistics_cost_read({
              output: output(reference.bin),
              current: Math.round(reference.current),
              previous: Math.round(reference.previous),
            }),
          },
        ]
      : []),
    { kind: 'limit', text: m.statistics_cost_read_limit() },
  ];
  return (
    <div className="space-y-4">
      <QuickRead lines={lines} />
      <Card className="gap-0 py-0" data-cardiac-cost={data.unit}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
          <CardTitle className="text-sm font-medium">
            {m.statistics_cost_title()}{' '}
            <span className="font-normal text-muted-foreground">
              ({m.bpm()})
            </span>
          </CardTitle>
          <MetricInfo metric="cardiacCost" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <QuantileChart
            height="h-[320px]"
            label={m.statistics_series_period()}
            otherLabel={before ? m.statistics_series_compared() : undefined}
            points={data.bins.map(({ bin, ...quantiles }) => ({
              x: bin,
              ...quantiles,
              other: before?.bins.find((other) => other.bin === bin)?.median,
            }))}
            formatX={output}
            formatY={(value) => `${Math.round(value)}`}
            color="var(--chart-3)"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function CostData({
  athleteId,
  period,
  compared,
  sport,
  visible,
}: P & { visible: boolean }) {
  const { data } = useStatisticsCardiacCostQuery(
    {
      athleteId,
      sport,
      from: period?.start ?? new Date(0),
      to: period?.end ?? new Date(0),
    },
    visible && !!period,
  );
  const { data: before } = useStatisticsCardiacCostQuery(
    {
      athleteId,
      sport,
      from: compared?.start ?? new Date(0),
      to: compared?.end ?? new Date(0),
    },
    visible && !!compared,
  );
  if (!data) return <SkeletonChart className="h-[400px] rounded-xl" />;
  return <Cost data={data} before={compared ? before : undefined} />;
}

export function PhysiologySection(props: P) {
  return (
    <StatSection
      plain
      id="physiology"
      title={m.statistics_capacity_physiology()}
    >
      {(visible) => <CostData {...props} visible={visible} />}
    </StatSection>
  );
}
