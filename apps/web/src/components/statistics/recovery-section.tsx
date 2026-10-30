import { useStatisticsRecoveryQuery } from '@/api/statistics';
import { m } from '@/paraglide/messages';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { SkeletonChart } from '../ui/skeleton';
import { MetricInfo } from './metric-info';
import { RecoveryPoint, recoveryTrend } from './recovery-data';
import { StatChart } from './stat-chart';
import { StatSection } from './stat-section';
import { Period } from './statistics-period';

interface P {
  athleteId: number;
  period: Period | null;
}

const localDay = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');

interface Series {
  key: string;
  title: string;
  unit?: string;
  value: (point: RecoveryPoint) => number | null;
  format: (value: number) => string;
  color: string;
  estimate?: boolean;
}

const SERIES = (): Series[] => [
  {
    key: 'hrv',
    title: m.statistics_recovery_hrv(),
    value: ({ hrv }) => hrv,
    format: (value) => value.toFixed(2),
    color: 'var(--chart-2)',
    estimate: true,
  },
  {
    key: 'resting',
    title: m.statistics_recovery_resting(),
    unit: m.bpm(),
    value: ({ restingHeartrate }) => restingHeartrate,
    format: (value) => `${Math.round(value)}`,
    color: 'var(--chart-3)',
  },
  {
    key: 'sleep',
    title: m.statistics_recovery_sleep(),
    unit: 'h',
    value: ({ sleepHours }) => sleepHours,
    format: (value) => value.toFixed(1),
    color: 'var(--chart-4)',
  },
];

function Recovery({ athleteId, period, visible }: P & { visible: boolean }) {
  const { data } = useStatisticsRecoveryQuery(
    {
      athleteId,
      from: period?.start ?? new Date(0),
      to: period?.end ?? new Date(0),
    },
    visible && !!period,
  );
  if (!data || !period) {
    return <SkeletonChart className="h-[280px] rounded-xl" />;
  }
  const points = recoveryTrend(data.days, localDay(period.start));
  const series = SERIES().filter((item) =>
    points.some((point) => item.value(point) !== null),
  );
  if (series.length === 0) {
    return (
      <Card className="gap-0 py-0">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          {m.statistics_recovery_empty()}
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" data-recovery>
      {series.map((item) => (
        <Card
          key={item.key}
          className="gap-0 py-0"
          data-recovery-series={item.key}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-sm font-medium">
              {item.title}
              {item.unit && (
                <span className="font-normal text-muted-foreground">
                  {' '}
                  ({item.unit})
                </span>
              )}
            </CardTitle>
            {item.estimate && <MetricInfo metric="hrvTrend" />}
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <StatChart
              label={item.title}
              granularity="day"
              color={item.color}
              formatValue={item.format}
              data={points.map((point) => ({
                period: point.date,
                partial: false,
                value: item.value(point),
              }))}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function RecoverySection(props: P) {
  return (
    <StatSection id="recovery" title={m.statistics_section_recovery()}>
      {(visible) => <Recovery {...props} visible={visible} />}
    </StatSection>
  );
}
