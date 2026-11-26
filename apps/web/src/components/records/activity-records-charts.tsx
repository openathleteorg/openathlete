import { useGetRecordsQuery } from '@/api/record';
import { useUnits } from '@/hooks/use-units';
import { m } from '@/paraglide/messages';
import { Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';

import { SPORT_TYPE } from '@openathlete/shared';

import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { effortsBeatingPeriod } from './best-efforts';
import {
  ChartRecord,
  RECORD_METRICS,
  formatRecordPosition,
} from './record-metrics';
import { RecordsCurveChart } from './records-curve-chart';

const PERIODS = [42, 90] as const;
const DAY_MS = 24 * 3600 * 1000;

interface P {
  records: ChartRecord[];
  sport: SPORT_TYPE;
  athleteId?: number;
  /** When the activity started: the period compared ends there */
  startDate: Date;
}

/**
 * The best efforts of one activity against the best of the weeks before
 * it, one chart per kind of record, and the efforts it did better.
 */
export function ActivityRecordsCharts({
  records,
  sport,
  athleteId,
  startDate,
}: P) {
  const units = useUnits();
  const [days, setDays] = useState<(typeof PERIODS)[number]>(42);
  const to = useMemo(() => new Date(startDate), [startDate]);
  const from = useMemo(
    () => new Date(to.getTime() - days * DAY_MS),
    [to, days],
  );
  // Before the activity only: its own records would always be the best
  const { data: period = [] } = useGetRecordsQuery({
    sport,
    athleteId,
    from,
    to,
  });

  const metrics = RECORD_METRICS.filter((metric) =>
    records.some((record) => record.type === metric.type),
  );
  const beaten = useMemo(
    () => effortsBeatingPeriod(records, period),
    [records, period],
  );
  if (!metrics.length) return null;

  const series = [
    {
      key: 'activity',
      label: m.activity_best_efforts_this(),
      color: 'var(--chart-1)',
      records,
    },
    {
      key: 'period',
      label: m.activity_best_efforts_period({ days }),
      color: 'var(--chart-3)',
      records: period,
    },
  ];
  const beatenLabels = beaten.flatMap((record) => {
    const metric = RECORD_METRICS.find((item) => item.type === record.type);
    const at = record.distance ?? record.duration;
    return metric && at !== null
      ? [
          `${metric.title(sport)} ${formatRecordPosition(metric, at, units.unitSystem)}`,
        ]
      : [];
  });

  return (
    <Card className="col-span-2" data-best-efforts>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle>{m.activity_best_efforts_title()}</CardTitle>
        <div
          role="group"
          aria-label={m.activity_best_efforts_compare()}
          className="flex rounded-md border p-0.5"
        >
          {PERIODS.map((value) => (
            <Button
              key={value}
              size="sm"
              variant={value === days ? 'secondary' : 'ghost'}
              aria-pressed={value === days}
              className="h-8 px-3 text-xs"
              onClick={() => setDays(value)}
            >
              {m.activity_best_efforts_days({ days: value })}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {beatenLabels.length > 0 && (
          <p
            className="flex items-start gap-2 text-sm"
            data-best-efforts-beaten
          >
            <Trophy className="mt-0.5 size-4 shrink-0 text-yellow-500" />
            {m.activity_best_efforts_beaten({
              days,
              efforts: beatenLabels.join(', '),
            })}
          </p>
        )}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {metrics.map((metric) => (
            <div key={metric.type} className="space-y-2">
              <p className="text-sm font-medium">
                {metric.title(sport)} · {metric.unit(sport, units.unitSystem)}
              </p>
              <RecordsCurveChart
                metric={metric}
                sport={sport}
                series={series}
                className="h-[200px] w-full"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
