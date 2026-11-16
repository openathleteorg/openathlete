import {
  formatMetricValue,
  hasOwnUnit,
} from '@/components/metrics/metric-stats';
import { Badge } from '@/components/ui/badge';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateFnsLocale } from '@/utils/locales';
import { getMetricUnit } from '@/utils/metric-unit';
import { cn } from '@/utils/shadcn';
import { formatDistanceToNowStrict } from 'date-fns';

import {
  CoachDashboardAthleteRowDto,
  CoachDashboardColumn,
  METRIC_TYPE,
} from '@openathlete/shared';

import {
  formTone,
  formatMeters,
  formatSeconds,
} from './coach-dashboard-format';

type Row = CoachDashboardAthleteRowDto;

export function ComplianceBadge({ row }: { row: Row }) {
  // Nothing was planned: there is nothing to comply with
  if (row.plannedSessions === 0) return null;
  const compliance = row.compliancePercent;
  return (
    <Badge
      className={cn(
        compliance >= 80
          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
          : compliance >= 50
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
            : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
      )}
    >
      {compliance}
      {m.percent_symbol()}
    </Badge>
  );
}

/** Fitness and fatigue, then form coloured by the training status zones. */
export function Form({ row }: { row: Row }) {
  if (!row.form) return <span className="text-muted-foreground">–</span>;
  const { ctl, atl, tsb } = row.form;
  const tone = formTone(tsb);
  return (
    <div
      className="flex flex-col text-sm"
      title={`${m.fitness_ctl()} ${ctl.toFixed(0)} · ${m.fatigue_atl()} ${atl.toFixed(0)} · ${m.tsb_balance()} ${tsb.toFixed(0)}`}
    >
      <span className="tabular-nums">
        {ctl.toFixed(0)} / {atl.toFixed(0)}
      </span>
      <span
        className={cn(
          'text-xs tabular-nums',
          tone === 'tired' && 'text-red-600 dark:text-red-400',
          tone === 'ready' && 'text-green-600 dark:text-green-400',
          tone === 'detraining' && 'text-blue-600 dark:text-blue-400',
        )}
      >
        {m.coach_form_value({ tsb: (tsb > 0 ? '+' : '') + tsb.toFixed(0) })}
      </span>
    </div>
  );
}

export function LastActivity({ row }: { row: Row }) {
  if (!row.lastActivityAt)
    return <span className="text-muted-foreground">–</span>;
  return (
    <span className="text-sm text-muted-foreground">
      {formatDistanceToNowStrict(new Date(row.lastActivityAt), {
        addSuffix: true,
        locale: getDateFnsLocale(getLocale()),
      })}
    </span>
  );
}

/** Up or down from the period before, in the figure's own format */
export function Delta({
  now,
  before,
  format = (value) => String(value),
}: {
  now: number;
  before: number;
  format?: (value: number) => string;
}) {
  const diff = now - before;
  if (diff === 0) {
    return <span className="text-xs text-muted-foreground">=</span>;
  }
  return (
    <span
      className="text-xs tabular-nums text-muted-foreground"
      title={m.coach_compare_before({ value: format(before) })}
      data-coach-delta
    >
      {diff > 0 ? '▲' : '▼'} {format(Math.abs(diff))}
    </span>
  );
}

/** One cell of the dashboard table, for the column the coach chose */
export function ColumnCell({
  column,
  row,
}: {
  column: CoachDashboardColumn;
  row: Row;
}) {
  const previous = row.previous;
  switch (column) {
    case 'sessions':
      return (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="tabular-nums">
              {row.completedSessions}/{row.plannedSessions}
            </span>
            <ComplianceBadge row={row} />
          </div>
          {previous && (
            <Delta
              now={row.completedSessions}
              before={previous.completedSessions}
            />
          )}
        </div>
      );
    case 'volume':
      return (
        <div className="flex flex-col tabular-nums">
          <span>{formatSeconds(row.completedTime)}</span>
          {previous ? (
            <Delta
              now={row.completedTime}
              before={previous.completedTime}
              format={formatSeconds}
            />
          ) : (
            <span className="text-xs text-muted-foreground">
              {formatMeters(row.completedDistance)}
            </span>
          )}
        </div>
      );
    case 'distance':
      return (
        <div className="flex flex-col tabular-nums">
          <span>{formatMeters(row.completedDistance)}</span>
          {previous && (
            <Delta
              now={row.completedDistance}
              before={previous.completedDistance}
              format={formatMeters}
            />
          )}
        </div>
      );
    case 'form':
      return <Form row={row} />;
    case 'rpe':
      return row.averageRpe === null ? (
        <span className="text-muted-foreground">–</span>
      ) : (
        <span className="tabular-nums">{row.averageRpe}</span>
      );
    case 'lastActivity':
      return <LastActivity row={row} />;
    default: {
      const type = column as METRIC_TYPE;
      const reading = row.metrics[type];
      if (!reading) return <span className="text-muted-foreground">–</span>;
      const flagged = row.alerts.some(
        (alert) => alert.type === 'threshold' && alert.metricType === type,
      );
      return (
        <span
          className={cn(
            'tabular-nums',
            flagged && 'font-semibold text-red-700 dark:text-red-300',
          )}
          title={reading.date}
        >
          {formatMetricValue(type, reading.value)}
          {!hasOwnUnit(type) && getMetricUnit(type) && (
            <span className="ml-0.5 text-xs text-muted-foreground">
              {getMetricUnit(type)}
            </span>
          )}
        </span>
      );
    }
  }
}
