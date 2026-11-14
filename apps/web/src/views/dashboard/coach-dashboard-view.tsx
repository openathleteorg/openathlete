import { useCoachDashboardQuery } from '@/api/coach';
import {
  GroupFilterOption,
  useGroupFilterOptions,
} from '@/components/clubs/use-group-filter';
import {
  ColumnCell,
  LastActivity,
} from '@/components/coach-dashboard/coach-dashboard-cells';
import {
  alertText,
  columnLabel,
  formTone,
  formatSeconds,
} from '@/components/coach-dashboard/coach-dashboard-format';
import { CompareAthletesDialog } from '@/components/coach-dashboard/compare-athletes-dialog';
import { summarizeGroup } from '@/components/coach-dashboard/group-summary';
import { ThresholdsDialog } from '@/components/coach-dashboard/thresholds-dialog';
import { useCoachDashboardSettings } from '@/components/coach-dashboard/use-coach-dashboard-settings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { MetricTile } from '@/components/ui/metric-tile';
import { PageTitle } from '@/components/ui/page-title';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { cn } from '@/utils/shadcn';
import {
  Activity,
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle2,
  Columns3,
  MessageCircle,
  NotebookPen,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import {
  COACH_DASHBOARD_COLUMNS,
  CoachDashboardAthleteRowDto,
  CoachDashboardColumn,
} from '@openathlete/shared';

type Row = CoachDashboardAthleteRowDto;

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

const athletePath = (page: 'calendar' | 'metrics' | 'notes', row: Row) =>
  `${getPath(['dashboard', page])}/${row.athleteId}`;

function Actions({ row }: { row: Row }) {
  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        size="icon"
        className="max-md:size-11"
        asChild
        title={m.view_calendar()}
      >
        <Link to={athletePath('calendar', row)} aria-label={m.view_calendar()}>
          <Calendar className="h-4 w-4" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="max-md:size-11"
        asChild
        title={m.metrics()}
      >
        <Link to={athletePath('metrics', row)} aria-label={m.metrics()}>
          <Activity className="h-4 w-4" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="max-md:size-11"
        asChild
        title={m.coach_notes()}
      >
        <Link to={athletePath('notes', row)} aria-label={m.coach_notes()}>
          <NotebookPen className="h-4 w-4" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        asChild
        title={m.messages()}
        className="relative max-md:size-11"
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
/** How the athletes shown did over the period, all together */
function GroupTiles({ rows, label }: { rows: Row[]; label: string }) {
  const summary = summarizeGroup(rows);
  const tone =
    summary.averageTsb === null ? null : formTone(summary.averageTsb);
  return (
    <section aria-label={label} className="space-y-2" data-group-summary>
      <h2 className="text-sm font-medium text-muted-foreground">{label}</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <MetricTile label={m.athletes()} value={summary.athletes} />
        <MetricTile
          label={m.coach_column_sessions()}
          value={`${summary.completedSessions}/${summary.plannedSessions}`}
          caption={
            summary.compliancePercent === null
              ? undefined
              : `${summary.compliancePercent}${m.percent_symbol()}`
          }
        />
        <MetricTile
          label={m.coach_column_volume()}
          value={formatSeconds(summary.completedTime)}
        />
        <MetricTile
          label={m.coach_group_average_form()}
          value={
            summary.averageTsb === null
              ? '–'
              : `${summary.averageTsb > 0 ? '+' : ''}${summary.averageTsb.toFixed(0)}`
          }
          valueClassName={cn(
            tone === 'tired' && 'text-red-600 dark:text-red-400',
            tone === 'ready' && 'text-green-600 dark:text-green-400',
            tone === 'detraining' && 'text-blue-600 dark:text-blue-400',
          )}
        />
        <MetricTile
          label={m.coach_group_to_watch()}
          value={summary.toWatch}
          className="col-span-2 sm:col-span-1"
        />
      </div>
    </section>
  );
}

/** Each group side by side, to pick the one that needs a look */
function GroupsOverview({
  rows,
  groups,
  onSelect,
}: {
  rows: Row[];
  groups: GroupFilterOption[];
  onSelect: (value: string) => void;
}) {
  // Groups of a single club or of the coach alone need no club name
  const oneSource = new Set(groups.map((group) => group.club)).size <= 1;
  return (
    <Card data-groups-overview>
      <CardHeader>
        <CardTitle className="text-base">{m.coach_groups_overview()}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {groups.map((group) => {
            const summary = summarizeGroup(
              rows.filter((row) => group.athleteIds.has(row.athleteId)),
            );
            return (
              <li key={group.value}>
                <button
                  type="button"
                  className="flex min-h-11 w-full flex-wrap items-center gap-x-4 gap-y-1 py-2 text-left text-sm hover:bg-muted/40"
                  onClick={() => onSelect(group.value)}
                  data-groups-overview-row={group.label}
                >
                  {/* Its own line on a phone, where the figures follow */}
                  <span className="min-w-0 flex-1 truncate font-medium max-sm:basis-full">
                    {oneSource ? group.name : group.label}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {m.coach_group_athletes({ count: summary.athletes })}
                  </span>
                  <span className="tabular-nums">
                    {summary.compliancePercent === null
                      ? '–'
                      : `${summary.compliancePercent}${m.percent_symbol()}`}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatSeconds(summary.completedTime)}
                  </span>
                  {summary.toWatch > 0 && (
                    <Badge variant="outline">
                      <AlertTriangle className="size-3" />
                      {summary.toWatch}
                    </Badge>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

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
                  // A finger-sized target on a phone
                  className="inline-flex items-center font-medium hover:underline max-md:min-h-11"
                >
                  {name(row)}
                </Link>
                {row.alerts.map((alert, index) =>
                  alert.type === 'threshold' ? (
                    // Opens the metric, to see where the value comes from
                    <Badge
                      key={`${alert.type}-${index}`}
                      variant="outline"
                      data-coach-alert={alert.type}
                      className="border-red-300 text-red-700 max-md:py-1.5 dark:text-red-300"
                      asChild
                    >
                      <Link to={athletePath('metrics', row)}>
                        {alertText(alert)}
                      </Link>
                    </Badge>
                  ) : (
                    <Badge
                      key={`${alert.type}-${index}`}
                      variant="outline"
                      data-coach-alert={alert.type}
                      className={cn(
                        alert.type === 'pain' &&
                          'border-red-300 text-red-700 dark:text-red-300',
                      )}
                    >
                      {alertText(alert)}
                    </Badge>
                  ),
                )}
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
  const [comparePrevious, setComparePrevious] = useState(false);
  const { data, isLoading } = useCoachDashboardQuery(
    start,
    end,
    undefined,
    comparePrevious,
  );
  const { settings, updateSettings } = useCoachDashboardSettings();
  // Kept in the order of the full list, whatever the order of the clicks
  const columns = COACH_DASHBOARD_COLUMNS.filter((column) =>
    settings.columns.includes(column),
  );
  const toggleColumn = (column: CoachDashboardColumn) =>
    updateSettings((current) => ({
      columns: current.columns.includes(column)
        ? current.columns.filter((value) => value !== column)
        : [...current.columns, column],
    }));
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const togglePicked = (athleteId: number) =>
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(athleteId)) next.delete(athleteId);
      else next.add(athleteId);
      return next;
    });
  const [comparing, setComparing] = useState(false);
  const [editingThresholds, setEditingThresholds] = useState(false);
  const groupOptions = useGroupFilterOptions();
  const [groupFilter, setGroupFilter] = useState('all');
  const selectedGroup = groupOptions.find(
    (option) => option.value === groupFilter,
  );
  const allRows = data?.athletes ?? [];
  const rows = selectedGroup
    ? allRows.filter((row) => selectedGroup.athleteIds.has(row.athleteId))
    : allRows;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <PageTitle>{m.coach_dashboard()}</PageTitle>
          <p className="text-muted-foreground">{m.coach_dashboard_title()}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {groupOptions.length > 0 && (
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger
                className="w-48 max-w-full"
                aria-label={m.groups_filter_label()}
                data-group-filter
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{m.groups_filter_all()}</SelectItem>
                {groupOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" data-coach-columns>
                <Columns3 className="h-4 w-4" />
                {m.coach_columns()}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 space-y-1">
              {COACH_DASHBOARD_COLUMNS.map((column) => (
                <label
                  key={column}
                  className="flex min-h-9 cursor-pointer items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={settings.columns.includes(column)}
                    onCheckedChange={() => toggleColumn(column)}
                  />
                  {columnLabel(column)}
                </label>
              ))}
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            onClick={() => setEditingThresholds(true)}
            data-coach-thresholds
          >
            <Bell className="h-4 w-4" />
            {m.coach_thresholds_button()}
          </Button>
          <Button variant="outline" asChild>
            <Link to={getPath(['dashboard', 'notes'])}>
              <NotebookPen className="h-4 w-4" />
              {m.coach_notes()}
            </Link>
          </Button>
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
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={comparePrevious}
            onCheckedChange={setComparePrevious}
            data-compare-previous
          />
          {m.coach_compare_previous()}
        </label>
        {picked.size > 0 && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={picked.size < 2}
              onClick={() => setComparing(true)}
              data-compare-athletes-button
            >
              {m.coach_compare_athletes({ count: picked.size })}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPicked(new Set())}
            >
              {m.plan_for_athletes_clear()}
            </Button>
          </div>
        )}
      </div>
      <CompareAthletesDialog
        open={comparing}
        onClose={() => setComparing(false)}
        rows={allRows.filter((row) => picked.has(row.athleteId))}
      />
      <ThresholdsDialog
        open={editingThresholds}
        onClose={() => setEditingThresholds(false)}
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <>
          {groupOptions.length > 0 && (
            <GroupTiles
              rows={rows}
              label={selectedGroup?.label ?? m.groups_filter_all()}
            />
          )}
          {!selectedGroup && groupOptions.length > 0 && (
            <GroupsOverview
              rows={allRows}
              groups={groupOptions}
              onSelect={setGroupFilter}
            />
          )}
          <Watchlist rows={rows} />

          {/* Wide screens: one row per athlete, no horizontal scroll */}
          <div className="hidden md:block rounded-lg border">
            <table className="w-full table-fixed text-sm" data-coach-table>
              <colgroup>
                <col className="w-10" />
                <col />
                {columns.map((column) => (
                  <col key={column} className="w-28" />
                ))}
                <col className="w-30" />
              </colgroup>
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-2 py-3 font-medium">
                    <span className="sr-only">{m.coach_compare_select()}</span>
                  </th>
                  <th className="px-2 py-3 font-medium">{m.athlete()}</th>
                  {columns.map((column) => (
                    <th
                      key={column}
                      className="px-2 py-3 font-medium"
                      data-coach-column={column}
                    >
                      {columnLabel(column)}
                    </th>
                  ))}
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
                    data-coach-row={name(row)}
                  >
                    <td className="px-2 py-3">
                      <Checkbox
                        checked={picked.has(row.athleteId)}
                        onCheckedChange={() => togglePicked(row.athleteId)}
                        aria-label={m.coach_compare_pick({ name: name(row) })}
                      />
                    </td>
                    <td className="px-2 py-3">
                      <div className="font-medium truncate">{name(row)}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {row.email}
                      </div>
                    </td>
                    {columns.map((column) => (
                      <td key={column} className="px-2 py-3">
                        <ColumnCell column={column} row={row} />
                      </td>
                    ))}
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
                    {columns
                      .filter((column) => column !== 'lastActivity')
                      .map((column) => (
                        <div key={column}>
                          <div className="text-xs text-muted-foreground">
                            {columnLabel(column)}
                          </div>
                          <ColumnCell column={column} row={row} />
                        </div>
                      ))}
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
