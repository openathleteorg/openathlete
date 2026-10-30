import { useGetRecordsQuery } from '@/api/record';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { activityPath } from '@/routes/paths';
import { getDateFnsLocale } from '@/utils/locales';
import { format, subYears } from 'date-fns';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  BestRecordDto,
  RECORD_TYPE,
  SPORT_CONFIG,
  SPORT_TYPE,
  formatDuration,
  formatSpeed,
  formatSpeedUnit,
} from '@openathlete/shared';

import {
  RECORD_METRICS,
  formatRecordDistance,
  formatRecordDuration,
} from '../records/record-metrics';
import { RecordsCurveChart } from '../records/records-curve-chart';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Skeleton, SkeletonChart } from '../ui/skeleton';
import {
  missingDistances,
  racePredictions,
  recordCoherence,
  speedRecords,
} from './capacity-data';
import {
  CriticalFit,
  criticalFit,
  criticalSwimSpeed,
  parseSwimTime,
} from './critical-model';
import { MetricInfo } from './metric-info';
import { QuantileChart } from './quantile-chart';
import { QuickRead } from './quick-read';
import { StatSection } from './stat-section';
import { Period } from './statistics-period';
import { SegmentTabs } from './statistics-tabs';

interface P {
  athleteId: number;
  period: Period | null;
  compared: Period | null;
  sport: SPORT_TYPE | null;
}

const CURVES = [RECORD_TYPE.SPEED, RECORD_TYPE.POWER];

/** Riegel's exponents come from road running */
const RUNNING_FOR_COHERENCE = new Set([SPORT_TYPE.RUNNING]);

function CriticalCard({ fit, sport }: { fit: CriticalFit; sport: SPORT_TYPE }) {
  const unit = SPORT_CONFIG[sport].speedUnit;
  const isSpeed = fit.kind === 'speed';
  const value = isSpeed
    ? `${formatSpeed(fit.critical, unit)} ${formatSpeedUnit(unit)}`
    : `${Math.round(fit.critical)} W`;
  const range = isSpeed
    ? `${formatSpeed(fit.critical + fit.margin, unit)} – ${formatSpeed(Math.max(fit.critical - fit.margin, 0.1), unit)}`
    : `${Math.round(fit.critical - fit.margin)} – ${Math.round(fit.critical + fit.margin)} W`;
  return (
    <Card className="gap-0 py-0" data-critical={fit.kind}>
      <CardContent className="space-y-1 p-4">
        <div className="flex min-h-6 items-center justify-between gap-1">
          <span className="text-sm text-muted-foreground">
            {isSpeed
              ? m.statistics_critical_speed()
              : m.statistics_critical_power()}
          </span>
          <MetricInfo metric={isSpeed ? 'criticalSpeed' : 'criticalPower'} />
        </div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-sm text-muted-foreground tabular-nums">
          {m.statistics_critical_range({ range })}
        </p>
        <p className="text-xs text-muted-foreground">
          {m.statistics_critical_efforts({
            count: fit.efforts.length,
            efforts: fit.efforts
              .map(({ seconds }) => formatRecordDuration(Math.round(seconds)))
              .join(', '),
          })}
        </p>
      </CardContent>
    </Card>
  );
}

/** Whether the records agree: which distance sits behind the others */
function CoherenceCard({ records }: { records: BestRecordDto[] }) {
  const anchors = speedRecords(records)
    .map(({ distance }) => distance!)
    .filter((distance) => distance < 21097.5)
    .sort((a, b) => a - b);
  const [chosen, setChosen] = useState<number>();
  const anchor = chosen && anchors.includes(chosen) ? chosen : anchors[0];
  const points = anchor ? recordCoherence(records, anchor) : [];
  if (points.filter(({ actual }) => actual !== null).length < 2) return null;
  const missing = missingDistances(records).map(formatRecordDistance);
  return (
    <Card className="gap-0 py-0 md:col-span-2" data-coherence>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
        <CardTitle className="text-sm font-medium">
          {m.statistics_coherence_title()}
        </CardTitle>
        <MetricInfo metric="recordCoherence" />
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        <SegmentTabs
          secondary
          label={m.statistics_coherence_title()}
          value={String(anchor)}
          onChange={(value) => setChosen(Number(value))}
          items={anchors.map((distance) => ({
            id: String(distance),
            label: () => formatRecordDistance(distance),
          }))}
        />
        <QuantileChart
          label={m.statistics_coherence_expected()}
          otherLabel={m.statistics_coherence_actual()}
          otherAsDots
          points={points.map((point) => ({
            x: point.distance / 1000,
            low: point.fast,
            median: point.expected,
            high: point.slow,
            other: point.actual,
          }))}
          logX
          formatX={(km) => formatRecordDistance(km * 1000)}
          formatY={(seconds) => formatDuration(Math.round(seconds))}
        />
        {missing.length > 0 && (
          <QuickRead
            lines={[
              {
                kind: 'limit',
                text: m.statistics_coherence_missing({
                  distances: missing.join(', '),
                }),
              },
            ]}
          />
        )}
      </CardContent>
    </Card>
  );
}

/** Ranges only, from a best of the last year: a single time would mislead */
function PredictionsCard({ athleteId }: { athleteId: number }) {
  const from = useMemo(() => subYears(new Date(), 1), []);
  const { data } = useGetRecordsQuery({
    sport: SPORT_TYPE.RUNNING,
    athleteId,
    from,
  });
  const prediction = data && racePredictions(data);
  if (!prediction || prediction.races.length === 0) return null;
  return (
    <Card className="gap-0 py-0 md:col-span-2" data-predictions>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
        <CardTitle className="text-sm font-medium">
          {m.statistics_predictions_title()}
        </CardTitle>
        <MetricInfo metric="racePrediction" />
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-0">
        <p className="text-sm text-muted-foreground">
          {m.statistics_predictions_from({
            distance: formatRecordDistance(prediction.anchor),
          })}
        </p>
        <ul className="divide-y text-sm tabular-nums">
          {prediction.races.map(({ distance, fast, slow }) => (
            <li key={distance} className="flex justify-between py-1.5">
              <span>{formatRecordDistance(distance)}</span>
              <span className="font-medium">
                {formatDuration(Math.round(fast))} –{' '}
                {formatDuration(Math.round(slow))}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/** Computed on the spot from a test the swimmer did: nothing is stored */
function CriticalSwimCard() {
  const [times, setTimes] = useState({ short: '', long: '' });
  const short = parseSwimTime(times.short);
  const long = parseSwimTime(times.long);
  const speed = short && long ? criticalSwimSpeed(short, long) : null;
  return (
    <Card className="gap-0 py-0 md:col-span-2" data-critical-swim>
      <CardContent className="space-y-3 p-4">
        <div className="flex min-h-6 items-center justify-between gap-1">
          <span className="text-sm text-muted-foreground">
            {m.statistics_critical_swim()}
          </span>
          <MetricInfo metric="criticalSwimSpeed" />
        </div>
        <p className="text-sm text-muted-foreground">
          {m.statistics_critical_swim_help()}
        </p>
        <div className="grid grid-cols-2 gap-2 md:max-w-sm">
          <Input
            aria-label={m.statistics_critical_swim_200()}
            placeholder={m.statistics_critical_swim_200()}
            className="h-11 md:h-9"
            inputMode="numeric"
            value={times.short}
            onChange={(event) =>
              setTimes({ ...times, short: event.target.value })
            }
          />
          <Input
            aria-label={m.statistics_critical_swim_400()}
            placeholder={m.statistics_critical_swim_400()}
            className="h-11 md:h-9"
            inputMode="numeric"
            value={times.long}
            onChange={(event) =>
              setTimes({ ...times, long: event.target.value })
            }
          />
        </div>
        {speed && (
          <p className="text-2xl font-bold tabular-nums">
            {formatDuration(Math.round(100 / speed))}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              {m.statistics_per_100m()}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Performance({
  athleteId,
  period,
  compared,
  sport,
  visible,
}: Omit<P, 'sport' | 'period'> & {
  period: Period;
  sport: SPORT_TYPE;
  visible: boolean;
}) {
  const locale = getDateFnsLocale(getLocale());
  const query = (from?: Date, to?: Date) => ({ sport, athleteId, from, to });
  const current = useGetRecordsQuery(query(period.start, period.end), {
    enabled: visible,
    keepPrevious: true,
  });
  const previous = useGetRecordsQuery(query(compared?.start, compared?.end), {
    enabled: visible && !!compared,
    keepPrevious: true,
  });
  const allTime = useGetRecordsQuery(query(), { enabled: visible });

  if (!current.data || !allTime.data) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton className="h-[120px] rounded-xl md:col-span-2" />
        <SkeletonChart className="h-[340px] rounded-xl" />
        <SkeletonChart className="h-[340px] rounded-xl" />
      </div>
    );
  }

  const series = [
    {
      key: 'period',
      label: m.statistics_series_period(),
      color: 'var(--chart-1)',
      records: current.data,
    },
    ...(compared && previous.data
      ? [
          {
            key: 'compared',
            label: m.statistics_series_compared(),
            color: 'var(--chart-2)',
            records: previous.data,
          },
        ]
      : []),
    {
      key: 'allTime',
      label: m.all_time(),
      color: 'var(--chart-4)',
      records: allTime.data,
    },
  ];
  const metrics = RECORD_METRICS.filter(
    (metric) =>
      CURVES.includes(metric.type) &&
      allTime.data.some((record) => record.type === metric.type),
  );
  const fit = criticalFit(current.data, sport);
  // An all-time best set during the period is a new record
  const newRecords = allTime.data
    .filter(
      (record) =>
        CURVES.includes(record.type) &&
        new Date(record.date) >= period.start &&
        new Date(record.date) <= period.end,
    )
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 6);

  const swimming = sport === SPORT_TYPE.SWIMMING;
  if (metrics.length === 0 && !swimming) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {m.no_data_for_period()}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {swimming && <CriticalSwimCard />}
      {RUNNING_FOR_COHERENCE.has(sport) && (
        <>
          <PredictionsCard athleteId={athleteId} />
          <CoherenceCard records={allTime.data} />
        </>
      )}
      {fit && <CriticalCard fit={fit} sport={sport} />}
      {newRecords.length > 0 && (
        <Card
          className={`gap-0 py-0 ${fit ? '' : 'md:col-span-2'}`}
          data-new-records
        >
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium">
              {m.statistics_new_records()}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ul className="space-y-1 text-sm">
              {newRecords.map((record) => {
                const label = record.distance
                  ? formatRecordDistance(record.distance)
                  : formatRecordDuration(record.duration ?? 0);
                const row = (
                  <>
                    <span className="font-medium">{label}</span>
                    <span className="text-muted-foreground">
                      {format(new Date(record.date), 'PP', { locale })}
                    </span>
                  </>
                );
                return (
                  <li key={record.recordId}>
                    {record.eventId ? (
                      <Link
                        to={activityPath(record.eventId)}
                        className="flex min-h-11 items-center justify-between gap-2 hover:underline md:min-h-0"
                      >
                        {row}
                      </Link>
                    ) : (
                      <span className="flex justify-between gap-2">{row}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
      {metrics.map((metric) => (
        <Card
          key={metric.type}
          className={`gap-0 py-0 ${metrics.length === 1 ? 'md:col-span-2' : ''}`}
        >
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title(sport)}{' '}
              <span className="font-normal text-muted-foreground">
                ({metric.unit(sport)})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <RecordsCurveChart metric={metric} sport={sport} series={series} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** What the athlete can do, for one sport: curves mix badly across sports. */
export function PerformanceSection({
  athleteId,
  period,
  compared,
  sport,
}: Omit<P, 'sport'> & { sport: SPORT_TYPE }) {
  return (
    <StatSection
      plain
      id="performance"
      title={m.statistics_section_performance()}
    >
      {(visible) =>
        period && (
          <Performance
            athleteId={athleteId}
            period={period}
            compared={compared}
            sport={sport}
            visible={visible}
          />
        )
      }
    </StatSection>
  );
}
