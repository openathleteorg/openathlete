import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { cn } from '@/utils/shadcn';
import {
  formStatusLabel,
  formStatusTextClass,
  formatForm,
  getFormStatus,
} from '@/utils/training-form';
import { getISOWeek } from 'date-fns';
import { Clock, Gauge, LucideIcon, Mountain, Route } from 'lucide-react';
import { useMemo } from 'react';

import {
  CalendarWeekLoadSummary,
  EVENT_TYPE,
  Event,
} from '@openathlete/shared';

import { Skeleton } from '../ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { CalendarWeekActions } from './calendar-week-actions';
import { CalendarWeekLoadBars } from './calendar-week-load-bars';
import { useCalendarContext } from './hooks/use-calendar-context';
import { complianceDotClass } from './utils/compliance';
import { nextRaceCountdown } from './utils/races';
import { getWeekKey } from './utils/week';
import {
  PlannedDone,
  formatCompactDuration,
  formatCompactKilometers,
  progressOf,
  summarizeWeek,
} from './utils/week-summary';

interface P {
  events: Event[];
  week: Date[];
  /** Show the week number and the week's "…" menu above the summary */
  withActions?: boolean;
}

const loadFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});
const formatLoad = (value: number) => loadFormatter.format(Math.round(value));

function ProgressBar({ progress }: { progress: number }) {
  const percent = Math.round(progress * 100);
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.min(percent, 100)}
      aria-label={m.calendar_week_progress({ percent })}
      title={m.calendar_week_progress({ percent })}
      className="relative mt-1 h-1 overflow-hidden rounded-full bg-muted"
    >
      <div
        className="h-full rounded-full bg-primary/80 transition-[width] duration-500"
        style={{ width: `${Math.min(progress, 1) * 100}%` }}
      />
    </div>
  );
}

/**
 * A row label: an icon where the summary is narrow (month column on a
 * laptop), the word where there is room. Screen readers always get the word.
 */
function RowLabel({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
  return (
    <span
      className="flex min-w-0 items-center text-muted-foreground"
      title={label}
    >
      <Icon aria-hidden className="size-3.5 shrink-0 @[11rem]:hidden" />
      <span className="sr-only @[11rem]:not-sr-only @[11rem]:truncate">
        {label}
      </span>
    </span>
  );
}

function VolumeRow({
  label,
  icon,
  values,
  format,
  unit,
}: {
  label: string;
  icon: LucideIcon;
  values: PlannedDone;
  format: (value: number) => string;
  unit?: string;
}) {
  const progress = progressOf(values);
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-1">
        <RowLabel label={label} icon={icon} />
        <span className="whitespace-nowrap tabular-nums">
          <span className="font-semibold">{format(values.done)}</span>
          {values.planned > 0 && (
            <span className="text-muted-foreground">
              {' / '}
              {format(values.planned)}
            </span>
          )}
          {unit && <span className="text-muted-foreground"> {unit}</span>}
        </span>
      </div>
      {progress !== null && <ProgressBar progress={progress} />}
    </div>
  );
}

/**
 * Done load (solid) and the load still planned (light) against the
 * recommended range of the week (band).
 */
function LoadRow({ load }: { load: CalendarWeekLoadSummary }) {
  const { actualLoad, estimatedLoad, plannedLoad, recommendedMin } = load;
  const recommendedMax = Math.max(load.recommendedMax, recommendedMin);
  const projected = actualLoad + estimatedLoad;
  const scale = Math.max(recommendedMax * 1.25, projected, plannedLoad, 1);
  const percent = (value: number) => `${(value / scale) * 100}%`;
  const inRange = projected >= recommendedMin && projected <= recommendedMax;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="min-w-0 cursor-default" data-week-load>
          <div className="flex items-baseline justify-between gap-1">
            <RowLabel label={m.load()} icon={Gauge} />
            <span className="whitespace-nowrap tabular-nums">
              <span className="font-semibold">{formatLoad(actualLoad)}</span>
              {plannedLoad > 0 && (
                <span className="text-muted-foreground">
                  {' / '}
                  {formatLoad(plannedLoad)}
                </span>
              )}
            </span>
          </div>
          <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            {recommendedMax > 0 && (
              <div
                aria-hidden
                className="absolute inset-y-0 bg-green-500/25"
                style={{
                  left: percent(recommendedMin),
                  width: percent(recommendedMax - recommendedMin),
                }}
              />
            )}
            <div
              aria-hidden
              className={cn(
                'absolute inset-y-0 left-0 rounded-full transition-[width] duration-500',
                inRange ? 'bg-green-500/40' : 'bg-primary/30',
              )}
              style={{ width: percent(projected) }}
            />
            <div
              aria-hidden
              className={cn(
                'absolute inset-y-0 left-0 rounded-full transition-[width] duration-500',
                inRange ? 'bg-green-600' : 'bg-primary',
              )}
              style={{ width: percent(actualLoad) }}
            />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {m.calendar_week_load_detail({
          done: formatLoad(actualLoad),
          remaining: formatLoad(estimatedLoad),
          min: formatLoad(recommendedMin),
          max: formatLoad(recommendedMax),
        })}
      </TooltipContent>
    </Tooltip>
  );
}

function FormRow({ load }: { load: CalendarWeekLoadSummary }) {
  if (load.tsb === undefined || load.ctl === undefined) return null;
  const status = getFormStatus(load.tsb);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="flex cursor-default items-baseline justify-between gap-1"
          data-week-form
        >
          <span className="truncate text-muted-foreground">
            {m.calendar_week_form()}
            {load.formProjected && (
              <span className="italic">
                {' '}
                · {m.calendar_week_form_projected()}
              </span>
            )}
          </span>
          <span
            className={cn(
              'font-semibold tabular-nums',
              formStatusTextClass[status],
            )}
          >
            {formatForm(load.tsb)}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        <p className="font-medium">{formStatusLabel[status]()}</p>
        <p>
          {m.calendar_week_form_detail({
            ctl: Math.round(load.ctl),
            atl: Math.round(load.atl ?? 0),
          })}
        </p>
        {load.formProjected && <p>{m.calendar_week_form_projected_detail()}</p>}
      </TooltipContent>
    </Tooltip>
  );
}

function SessionCounts({
  sessions,
}: {
  sessions: { done: number; missed: number; pending: number };
}) {
  const items = [
    {
      key: 'done',
      count: sessions.done,
      dot: complianceDotClass.complete,
      label: m.calendar_week_sessions_done,
    },
    {
      key: 'missed',
      count: sessions.missed,
      dot: complianceDotClass.missed,
      label: m.calendar_week_sessions_missed,
    },
    {
      key: 'pending',
      count: sessions.pending,
      dot: complianceDotClass.pending,
      label: m.calendar_week_sessions_pending,
    },
  ].filter(({ count }) => count > 0);

  if (!items.length) return null;

  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1" data-week-sessions>
      {items.map(({ key, count, dot, label }) => (
        <li
          key={key}
          className="flex items-center gap-1 tabular-nums"
          title={label({ count })}
        >
          <span aria-hidden className={cn('size-2 rounded-full', dot)} />
          <span aria-hidden>{count}</span>
          <span className="sr-only">{label({ count })}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Done against planned for the week: volumes, load and sessions, then the
 * form at the end of the week. Fits the narrow column of the month view and
 * spreads into a row in wider places (week view).
 */
export function CalendarWeekSummary({ events, week, withActions }: P) {
  const {
    weeklyLoadSummary,
    weeklyLoadSummaryLoading,
    estimatingEvents,
    allowCreate,
    events: allEvents,
    display,
    dailyForm,
  } = useCalendarContext();
  const shown = display.summary;
  const weekLoad = weeklyLoadSummary[getWeekKey(week[0])];
  const totals = useMemo(() => summarizeWeek(events), [events]);
  const countdown = useMemo(
    () => (withActions ? nextRaceCountdown(allEvents, week[0]) : null),
    [withActions, allEvents, week],
  );
  const locale = getLocale();

  // The AI estimate of a session of this week is on its way
  const isLoadLoading =
    weeklyLoadSummaryLoading ||
    events.some(
      (event) =>
        event.type === EVENT_TYPE.TRAINING &&
        estimatingEvents.has(event.eventId),
    );

  const hasDistance = totals.distance.planned > 0 || totals.distance.done > 0;
  const hasElevation =
    totals.elevation.planned > 0 || totals.elevation.done > 0;

  return (
    // The container query lays it out by the room it gets, not the screen
    <div data-week-summary className="@container h-full w-full">
      <div className="flex h-full min-h-32 select-none flex-col gap-2 p-2 text-xs @md:min-h-0">
        {withActions && (
          <div className="-mt-1 -mb-1 flex items-center justify-between">
            <span className="flex min-w-0 items-center gap-2 font-medium text-muted-foreground">
              {m.calendar_week_number({ week: getISOWeek(week[0]) })}
              {countdown && (
                <span
                  className="truncate text-red-600 dark:text-red-400"
                  title={m.calendar_week_until_race_detail({
                    name: countdown.race.name,
                    weeks: countdown.weeks,
                  })}
                >
                  {m.calendar_week_until_race({
                    priority: 'A',
                    weeks: countdown.weeks,
                  })}
                </span>
              )}
            </span>
            {allowCreate && (
              <CalendarWeekActions weekStart={week[0]} events={events} />
            )}
          </div>
        )}
        <div className="grid gap-2 @md:grid-cols-4 @md:gap-4">
          {shown.duration && (
            <VolumeRow
              label={m.duration()}
              icon={Clock}
              values={totals.duration}
              format={formatCompactDuration}
            />
          )}
          {shown.distance && hasDistance && (
            <VolumeRow
              label={m.distance()}
              icon={Route}
              values={totals.distance}
              format={(meters) => formatCompactKilometers(meters, locale)}
              unit="km"
            />
          )}
          {shown.elevation && hasElevation && (
            <VolumeRow
              label={m.elevation_gain()}
              icon={Mountain}
              values={totals.elevation}
              format={(meters) => String(Math.round(meters))}
              unit="m"
            />
          )}
          {shown.load &&
            (isLoadLoading ? (
              <Skeleton className="h-6 w-full" />
            ) : (
              weekLoad && (
                <div className="space-y-1">
                  <LoadRow load={weekLoad} />
                  <CalendarWeekLoadBars week={week} dailyForm={dailyForm} />
                </div>
              )
            ))}
        </div>
        <div className="mt-auto flex flex-col gap-1.5 @md:mt-0 @md:flex-row @md:items-center @md:justify-between">
          <SessionCounts sessions={totals.sessions} />
          {shown.form && !isLoadLoading && weekLoad && (
            <FormRow load={weekLoad} />
          )}
        </div>
      </div>
    </div>
  );
}
