import { useStatisticsLongRunsQuery } from '@/api/statistics';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { activityPath } from '@/routes/paths';
import { getDateFnsLocale } from '@/utils/locales';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';

import { SPORT_TYPE, SportGroup, formatDistance } from '@openathlete/shared';

import { TrainingLoadChart } from '../training-load';
import { Card, CardContent } from '../ui/card';
import { MetricInfo } from './metric-info';
import { StatSection } from './stat-section';
import { Period } from './statistics-period';

interface P {
  athleteId: number;
  period: Period | null;
  compared: Period | null;
  sport: SPORT_TYPE | null;
  group: SportGroup | null;
}

const isRunning = (sport: SPORT_TYPE | null) =>
  sport === SPORT_TYPE.RUNNING || sport === SPORT_TYPE.TRAIL_RUNNING;

/** Single runs far beyond the month's longest: the rest of the load is fine */
function LongRuns({
  athleteId,
  period,
  visible,
}: {
  athleteId: number;
  period: Period;
  visible: boolean;
}) {
  const locale = getDateFnsLocale(getLocale());
  const { data } = useStatisticsLongRunsQuery(
    { athleteId, from: period.start, to: period.end },
    visible,
  );
  if (!data?.runs.length) return null;
  return (
    <Card className="gap-0 py-0" data-long-runs>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{m.statistics_long_runs()}</p>
          <MetricInfo metric="longRun" />
        </div>
        <ul className="space-y-1 text-sm">
          {data.runs.map((run) => (
            <li key={run.eventId}>
              <Link
                to={activityPath(run.eventId)}
                className="flex min-h-11 items-center justify-between gap-2 hover:underline md:min-h-0"
              >
                <span>
                  {format(parseISO(run.date), 'PP', { locale })} ·{' '}
                  {formatDistance(run.distance)} {m.kilometers()}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {m.statistics_long_run_before({
                    distance: formatDistance(run.longest),
                  })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function LoadSection({ athleteId, period, compared, sport, group }: P) {
  return (
    <StatSection id="load" title={m.statistics_section_load()}>
      {(visible) => (
        <>
          <TrainingLoadChart
            athleteId={athleteId}
            period={period}
            compared={compared}
            sport={sport}
            group={group}
            enabled={visible}
          />
          {isRunning(sport) && period && (
            <LongRuns athleteId={athleteId} period={period} visible={visible} />
          )}
        </>
      )}
    </StatSection>
  );
}
