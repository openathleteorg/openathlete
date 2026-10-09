import { useSeasonEventsQuery } from '@/api/event';
import { useWeeklyLoadSummaryQuery } from '@/api/training-load';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getItem, setItem } from '@/utils/local-storage';
import { getDateFnsLocale } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import {
  formStatusTextClass,
  formatForm,
  getFormStatus,
} from '@/utils/training-form';
import { format, getISOWeek } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

import { CalendarWeekLoadSummary, Cycle } from '@openathlete/shared';

import { Skeleton } from '../ui/skeleton';
import { CalendarWeeklyLoadChart } from './calendar-weekly-load-chart';
import { CompetitionPriorityBadge } from './competition-priority-badge';
import { useCalendarContext } from './hooks/use-calendar-context';
import {
  cycleBackground,
  cycleKindIcon,
  isUnavailableKind,
} from './utils/cycle-kind';
import {
  SEASON_LENGTHS,
  SeasonLength,
  SeasonWeek,
  buildSeasonWeeks,
  seasonCycleSegments,
  seasonRange,
} from './utils/season';
import { getUtcWeekKey, getWeekEnd, getWeekStart } from './utils/week';
import { formatCompactDuration } from './utils/week-summary';

const SEASON_LENGTH_KEY = 'calendar_season_months';

type Drag =
  | { mode: 'create'; from: number; to: number }
  | { mode: 'resize'; cycle: Cycle; edge: 'start' | 'end'; to: number };

const COLUMNS =
  'grid grid-cols-[5.5rem_minmax(4rem,8rem)_minmax(0,1fr)_3.5rem] md:grid-cols-[7rem_minmax(5rem,9rem)_minmax(0,1fr)_minmax(7rem,11rem)_minmax(7rem,11rem)_4.5rem]';

/** Done over planned as a thin bar, planned as the track */
function Progress({
  done,
  planned,
  label,
}: {
  done: number;
  planned: number;
  label: string;
}) {
  const max = Math.max(done, planned);
  return (
    <div className="min-w-0 space-y-0.5" title={label}>
      <p className="truncate text-xs tabular-nums">{label}</p>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary/80"
          style={{ width: max ? `${(done / max) * 100}%` : 0 }}
        />
      </div>
    </div>
  );
}

function FormCell({ summary }: { summary?: CalendarWeekLoadSummary }) {
  if (summary?.tsb === undefined) return null;
  const status = getFormStatus(summary.tsb);
  return (
    <span
      className={cn(
        'text-sm font-semibold tabular-nums',
        formStatusTextClass[status],
        summary.formProjected && 'italic',
      )}
      title={
        summary.formProjected
          ? m.calendar_week_form_projected_detail()
          : m.calendar_week_form()
      }
    >
      {formatForm(summary.tsb)}
    </span>
  );
}

/**
 * The season at a glance: one row per week over 6 or 12 months, with its
 * cycles, races, volume and load done against planned, and the form it
 * ends on. Cycles are drawn, created (drag down the cycle column) and
 * resized (drag their ends) here.
 */
export function CalendarSeasonView() {
  const {
    displayedMonth,
    athleteId,
    cycles,
    allowCreate,
    createCycle,
    viewCycle,
    updateCycleDates,
    setView,
    goToWeek,
  } = useCalendarContext();
  const [length, setLengthState] = useState<SeasonLength>(() =>
    Number(getItem(SEASON_LENGTH_KEY)) === 12 ? 12 : 6,
  );
  const setLength = (next: SeasonLength) => {
    setLengthState(next);
    setItem(SEASON_LENGTH_KEY, String(next));
  };

  const range = useMemo(
    () => seasonRange(displayedMonth, length),
    [displayedMonth, length],
  );
  const { data: events = [], isPending } = useSeasonEventsQuery(
    range.start,
    range.end,
    athleteId,
  );
  const loadStart = useMemo(() => getWeekStart(range.start), [range.start]);
  const loadEnd = useMemo(() => {
    const end = getWeekEnd(range.end);
    end.setUTCHours(23, 59, 59, 999);
    return end;
  }, [range.end]);
  const { data: summaries, isPending: summariesPending } =
    useWeeklyLoadSummaryQuery(loadStart, loadEnd, athleteId, true);
  const summaryByWeek = useMemo(
    () =>
      Object.fromEntries(
        (summaries ?? []).map((summary) => [
          getUtcWeekKey(summary.weekStart),
          summary,
        ]),
      ) as Record<string, CalendarWeekLoadSummary>,
    [summaries],
  );

  const weeks = useMemo(
    () => buildSeasonWeeks(displayedMonth, length, events),
    [displayedMonth, length, events],
  );

  const [drag, setDrag] = useState<Drag | null>(null);
  // Cycles as they will be once the drag ends, to preview it
  const shownCycles = useMemo(() => {
    if (drag?.mode !== 'resize') return cycles;
    return cycles.map((cycle) => {
      if (cycle.cycleId !== drag.cycle.cycleId) return cycle;
      const target = weeks[drag.to];
      return drag.edge === 'start'
        ? {
            ...cycle,
            startDate:
              target.start < new Date(cycle.endDate)
                ? target.start
                : cycle.startDate,
          }
        : {
            ...cycle,
            endDate:
              target.end > new Date(cycle.startDate)
                ? target.end
                : cycle.endDate,
          };
    });
  }, [cycles, drag, weeks]);
  const { lanes, byWeek } = useMemo(
    () => seasonCycleSegments(shownCycles, weeks),
    [shownCycles, weeks],
  );

  // A drag ends wherever the pointer is released
  useEffect(() => {
    if (!drag) return;
    const finish = () => {
      if (drag.mode === 'create') {
        const first = Math.min(drag.from, drag.to);
        const last = Math.max(drag.from, drag.to);
        createCycle(weeks[first].start, weeks[last].end);
      } else {
        const cycle = shownCycles.find((c) => c.cycleId === drag.cycle.cycleId);
        if (cycle) {
          updateCycleDates(
            cycle.cycleId,
            new Date(cycle.startDate),
            new Date(cycle.endDate),
          );
        }
      }
      setDrag(null);
    };
    window.addEventListener('mouseup', finish);
    return () => window.removeEventListener('mouseup', finish);
  }, [drag, weeks, shownCycles, createCycle, updateCycleDates]);

  const locale = getDateFnsLocale(getLocale());
  const today = new Date();
  const selecting = (index: number) =>
    drag?.mode === 'create' &&
    index >= Math.min(drag.from, drag.to) &&
    index <= Math.max(drag.from, drag.to);

  const openWeek = (week: SeasonWeek) => {
    // After setView, which goes to the week of the displayed month
    setView('week');
    goToWeek(week.start);
  };

  return (
    <div data-calendar-season className="space-y-4 px-4 md:px-0">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div
          role="radiogroup"
          aria-label={m.calendar_season_length()}
          className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1"
        >
          {SEASON_LENGTHS.map((months) => (
            <button
              key={months}
              type="button"
              role="radio"
              aria-checked={length === months}
              onClick={() => setLength(months)}
              className={cn(
                'rounded-sm px-3 py-1 text-sm transition-colors',
                length === months
                  ? 'bg-background font-medium shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {m.calendar_season_months({ months })}
            </button>
          ))}
        </div>
      </div>

      <div className="hidden md:block">
        <CalendarWeeklyLoadChart
          weeks={weeks.map((week) =>
            Array.from({ length: 7 }, (_, day) => {
              const date = new Date(week.start);
              date.setDate(date.getDate() + day);
              return date;
            }),
          )}
          weeklyLoadSummary={summaryByWeek}
          isLoading={summariesPending}
          hasScheduledActivities
        />
      </div>

      <div
        role="table"
        aria-label={m.calendar_view_season()}
        className="select-none overflow-hidden rounded-lg border text-sm shadow-sm"
      >
        <div
          role="row"
          className={cn(
            COLUMNS,
            'border-b bg-muted/50 text-xs font-semibold text-muted-foreground',
          )}
        >
          <span role="columnheader" className="px-2 py-2">
            {m.calendar_season_week()}
          </span>
          <span role="columnheader" className="px-2 py-2">
            {m.calendar_season_cycles()}
          </span>
          <span role="columnheader" className="px-2 py-2">
            {m.calendar_season_races()}
          </span>
          <span role="columnheader" className="hidden px-2 py-2 md:block">
            {m.duration()}
          </span>
          <span role="columnheader" className="hidden px-2 py-2 md:block">
            {m.calendar_display_load()}
          </span>
          <span role="columnheader" className="px-2 py-2 text-right">
            TSB
          </span>
        </div>
        {weeks.map((week, index) => {
          const summary = summaryByWeek[week.key];
          const current = today >= week.start && today <= week.end;
          const segments = byWeek[index];
          return (
            <div
              key={week.key}
              role="row"
              data-season-week={format(week.start, 'yyyy-MM-dd')}
              className={cn(
                COLUMNS,
                'min-h-10 border-b last:border-b-0',
                current && 'bg-primary/5',
                week.start.getDate() <= 7 &&
                  index > 0 &&
                  'border-t-2 border-t-border',
              )}
              onMouseEnter={() =>
                drag && setDrag({ ...drag, to: index } as Drag)
              }
            >
              <span role="cell" className="flex items-center px-2">
                <button
                  type="button"
                  onClick={() => openWeek(week)}
                  className={cn(
                    'rounded-sm text-left text-xs hover:underline focus-visible:underline',
                    current && 'font-semibold text-primary',
                  )}
                  title={m.calendar_season_open_week()}
                >
                  <span className="text-muted-foreground">
                    W{getISOWeek(week.start)}
                  </span>{' '}
                  {format(week.start, 'd MMM', { locale })}
                </button>
              </span>

              <span
                role="cell"
                className={cn(
                  'relative flex gap-0.5 px-1',
                  allowCreate && 'cursor-ns-resize',
                  selecting(index) && 'bg-blue-100 dark:bg-blue-950/50',
                )}
                data-season-cycles
                onMouseDown={(event) => {
                  if (!allowCreate || event.button !== 0) return;
                  if (
                    (event.target as HTMLElement).closest('[data-season-cycle]')
                  )
                    return;
                  setDrag({ mode: 'create', from: index, to: index });
                }}
              >
                {Array.from({ length: lanes }, (_, lane) => {
                  const segment = segments.find((s) => s.lane === lane);
                  if (!segment) return <span key={lane} className="flex-1" />;
                  const { cycle, isStart, isEnd } = segment;
                  const KindIcon = cycleKindIcon[cycle.kind];
                  return (
                    <span
                      key={lane}
                      data-season-cycle={cycle.cycleId}
                      className={cn(
                        'relative flex min-w-0 flex-1 cursor-pointer items-start overflow-hidden px-1 text-[11px] font-semibold text-white',
                        isStart ? 'mt-1 rounded-t-md' : '-mt-px',
                        isEnd ? 'mb-1 rounded-b-md' : '-mb-px',
                      )}
                      style={{ background: cycleBackground(cycle) }}
                      title={cycle.name}
                      onClick={() => viewCycle(cycle.cycleId)}
                    >
                      {isStart && (
                        <span className="flex min-w-0 items-center gap-1 pt-0.5">
                          {isUnavailableKind(cycle.kind) && (
                            <KindIcon aria-hidden className="size-3 shrink-0" />
                          )}
                          <span className="truncate">{cycle.name}</span>
                        </span>
                      )}
                      {allowCreate && isStart && (
                        <span
                          aria-hidden
                          className="absolute inset-x-0 top-0 h-1.5 cursor-ns-resize hover:bg-white/40"
                          onMouseDown={(event) => {
                            event.stopPropagation();
                            setDrag({
                              mode: 'resize',
                              cycle,
                              edge: 'start',
                              to: index,
                            });
                          }}
                        />
                      )}
                      {allowCreate && isEnd && (
                        <span
                          aria-hidden
                          data-season-cycle-end
                          className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize hover:bg-white/40"
                          onMouseDown={(event) => {
                            event.stopPropagation();
                            setDrag({
                              mode: 'resize',
                              cycle,
                              edge: 'end',
                              to: index,
                            });
                          }}
                        />
                      )}
                    </span>
                  );
                })}
              </span>

              <span
                role="cell"
                className="flex min-w-0 flex-wrap items-center gap-1 px-2 py-1"
              >
                {week.races.map((race) => (
                  <span
                    key={race.eventId}
                    className="flex min-w-0 items-center gap-1 rounded-sm bg-red-50 px-1.5 py-0.5 text-xs text-red-900 dark:bg-red-950/40 dark:text-red-100"
                    title={`${race.name} · ${format(new Date(race.startDate), 'EEEE d MMM', { locale })}`}
                  >
                    <CompetitionPriorityBadge priority={race.priority} />
                    <span className="truncate">{race.name}</span>
                  </span>
                ))}
              </span>

              <span role="cell" className="hidden items-center px-2 md:flex">
                {isPending ? (
                  <Skeleton className="h-4 w-full" />
                ) : (
                  (week.plannedSeconds > 0 || week.doneSeconds > 0) && (
                    <Progress
                      done={week.doneSeconds}
                      planned={week.plannedSeconds}
                      label={`${formatCompactDuration(week.doneSeconds)} / ${formatCompactDuration(week.plannedSeconds)}`}
                    />
                  )
                )}
              </span>

              <span role="cell" className="hidden items-center px-2 md:flex">
                {summariesPending ? (
                  <Skeleton className="h-4 w-full" />
                ) : (
                  summary &&
                  (summary.plannedLoad > 0 || summary.actualLoad > 0) && (
                    // Done over planned, as the week summaries read
                    <Progress
                      done={summary.actualLoad}
                      planned={summary.plannedLoad}
                      label={`${Math.round(summary.actualLoad)} / ${Math.round(summary.plannedLoad)}`}
                    />
                  )
                )}
              </span>

              <span role="cell" className="flex items-center justify-end px-2">
                <FormCell summary={summary} />
              </span>
            </div>
          );
        })}
      </div>
      {allowCreate && (
        <p className="text-xs text-muted-foreground">
          {m.calendar_season_hint()}
        </p>
      )}
    </div>
  );
}
