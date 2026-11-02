import { useCoachDashboardQuery } from '@/api/coach';
import {
  alertText,
  formTone,
} from '@/components/coach-dashboard/coach-dashboard-format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTitle } from '@/components/ui/page-title';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getPath } from '@/routes/paths';
import { getDateFnsLocale } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import { formatDistanceToNowStrict } from 'date-fns';
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { CoachDashboardAthleteRowDto } from '@openathlete/shared';

type Row = CoachDashboardAthleteRowDto;

function formatSeconds(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatMeters(meters: number): string {
  if (!meters) return '0 km';
  const km = meters / 1000;
  return km % 1 === 0 ? `${km} km` : `${km.toFixed(1)} km`;
}

type PeriodType = 'week' | 'month' | 'year';

function getPeriodDates(period: PeriodType): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();

  switch (period) {
    case 'week':
      start.setDate(end.getDate() - 6); // Last 7 days
      break;
    case 'month':
      start.setMonth(end.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(end.getFullYear() - 1);
      break;
  }

  start.setHours(0, 0, 0, 0);
  return { start, end };
}

const name = (row: Row) =>
  `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() || row.email || '';

const athletePath = (page: 'calendar' | 'metrics', row: Row) =>
  `${getPath(['dashboard', page])}/${row.athleteId}`;

function ComplianceBadge({ row }: { row: Row }) {
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
function Form({ row }: { row: Row }) {
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

function LastActivity({ row }: { row: Row }) {
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

function Actions({ row }: { row: Row }) {
  return (
    <div className="flex items-center">
      <Button variant="ghost" size="icon" asChild title={m.view_calendar()}>
        <Link to={athletePath('calendar', row)} aria-label={m.view_calendar()}>
          <Calendar className="h-4 w-4" />
        </Link>
      </Button>
      <Button variant="ghost" size="icon" asChild title={m.metrics()}>
        <Link to={athletePath('metrics', row)} aria-label={m.metrics()}>
          <Activity className="h-4 w-4" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        asChild
        title={m.messages()}
        className="relative"
      >
        <Link to={getPath(['dashboard', 'messages'])} aria-label={m.messages()}>
          <MessageCircle className="h-4 w-4" />
          {row.unreadMessages > 0 && (
            <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground">
              {row.unreadMessages}
            </span>
          )}
        </Link>
      </Button>
    </div>
  );
}

/** The athletes to look at first, each alert in one line. */
function Watchlist({ rows }: { rows: Row[] }) {
  const flagged = rows.filter(
    (row) => row.alerts.length > 0 || row.unreadMessages > 0,
  );
  return (
    <Card data-coach-watchlist>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4" />
          {m.coach_watch_title()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {flagged.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            {m.coach_watch_none()}
          </p>
        ) : (
          <ul className="divide-y">
            {flagged.map((row) => (
              <li
                key={row.athleteId}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2"
              >
                <Link
                  to={athletePath('calendar', row)}
                  className="font-medium hover:underline"
                >
                  {name(row)}
                </Link>
                {row.alerts.map((alert) => (
                  <Badge
                    key={alert.type}
                    variant="outline"
                    data-coach-alert={alert.type}
                    className={cn(
                      alert.type === 'pain' &&
                        'border-red-300 text-red-700 dark:text-red-300',
                    )}
                  >
                    {alertText(alert)}
                  </Badge>
                ))}
                {row.unreadMessages > 0 && (
                  <Badge variant="secondary">
                    {m.coach_unread_messages({ count: row.unreadMessages })}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function CoachDashboardView() {
  const [period, setPeriod] = useState<PeriodType>('week');
  const { start, end } = getPeriodDates(period);
  const { data, isLoading } = useCoachDashboardQuery(start, end);
  const rows = data?.athletes ?? [];

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <PageTitle>{m.coach_dashboard()}</PageTitle>
          <p className="text-muted-foreground">{m.coach_dashboard_title()}</p>
        </div>
        <Select
          value={period}
          onValueChange={(value) => setPeriod(value as PeriodType)}
        >
          <SelectTrigger className="w-35">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">{m.week()}</SelectItem>
            <SelectItem value="month">{m.month()}</SelectItem>
            <SelectItem value="year">{m.year()}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <>
          <Watchlist rows={rows} />

          {/* Wide screens: one row per athlete, no horizontal scroll */}
          <div className="hidden md:block rounded-lg border">
            <table className="w-full table-fixed text-sm" data-coach-table>
              <colgroup>
                <col />
                <col className="w-28" />
                <col className="w-20" />
                <col className="w-24" />
                <col className="w-28" />
                <col className="w-30" />
              </colgroup>
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-2 py-3 font-medium">{m.athlete()}</th>
                  <th className="px-2 py-3 font-medium">
                    {m.coach_column_sessions()}
                  </th>
                  <th className="px-2 py-3 font-medium">
                    {m.coach_column_volume()}
                  </th>
                  <th className="px-2 py-3 font-medium">
                    {m.coach_column_form()}
                  </th>
                  <th className="px-2 py-3 font-medium">{m.last_activity()}</th>
                  <th className="px-2 py-3 font-medium sr-only">
                    {m.actions()}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.athleteId}
                    className="border-b last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-2 py-3">
                      <div className="font-medium truncate">{name(row)}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {row.email}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums">
                          {row.completedSessions}/{row.plannedSessions}
                        </span>
                        <ComplianceBadge row={row} />
                      </div>
                    </td>
                    <td className="px-2 py-3 tabular-nums">
                      <div>{formatSeconds(row.completedTime)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatMeters(row.completedDistance)}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <Form row={row} />
                    </td>
                    <td className="px-2 py-3">
                      <LastActivity row={row} />
                    </td>
                    <td className="px-2 py-3">
                      <Actions row={row} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phones: a card per athlete */}
          <div className="grid gap-3 md:hidden">
            {rows.map((row) => (
              <Card key={row.athleteId}>
                <CardContent className="space-y-3 pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium">{name(row)}</div>
                      <LastActivity row={row} />
                    </div>
                    <Actions row={row} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {m.coach_column_sessions()}
                      </div>
                      <span className="tabular-nums">
                        {row.completedSessions}/{row.plannedSessions}
                      </span>{' '}
                      <ComplianceBadge row={row} />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {m.coach_column_volume()}
                      </div>
                      <div className="tabular-nums">
                        {formatSeconds(row.completedTime)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {m.coach_column_form()}
                      </div>
                      <Form row={row} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
