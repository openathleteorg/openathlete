import { useGetMyAthleteQuery } from '@/api/athlete';
import {
  useGetMyEventsQuery,
  useGetUpcomingCompetitionsQuery,
} from '@/api/event';
import { useTrainingLoadMetrics } from '@/api/training-load';
import { TrainingLoadCalculationType } from '@/api/training-load/training-load.api';
import { useGetMeQuery } from '@/api/user';
import {
  complianceDotClass,
  getCompliance,
  isPlannedEvent,
  isShownCompliance,
} from '@/components/calendar/utils/compliance';
import { complianceLabel } from '@/components/calendar/utils/compliance-labels';
import { summarizeWeek } from '@/components/calendar/utils/week-summary';
import {
  formatCompactDuration,
  formatCompactKilometers,
} from '@/components/calendar/utils/week-summary';
import { SportIcon } from '@/components/sport-icon/sport-icon';
import { SectionLabel } from '@/components/ui/section-label';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppBar } from '@/hooks/use-app-bar';
import { useIsMobile } from '@/hooks/use-mobile';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { activityPath, getPath } from '@/routes/paths';
import { getDateFnsLocale } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import {
  formStatusDotClass,
  formStatusLabel,
  formStatusTextClass,
  formatForm,
  getFormStatus,
} from '@/utils/training-form';
import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  format,
  isSameDay,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import { ChevronRight, Flag } from 'lucide-react';
import { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { EVENT_TYPE, Event } from '@openathlete/shared';

function eventDuration(event: Event) {
  if (event.type === EVENT_TYPE.ACTIVITY) return event.movingTime;
  return isPlannedEvent(event) ? event.goalDuration : null;
}

function eventDistance(event: Event) {
  if (event.type === EVENT_TYPE.ACTIVITY) return event.distance;
  return isPlannedEvent(event) ? event.goalDistance : null;
}

function eventHref(event: Event) {
  return event.type === EVENT_TYPE.ACTIVITY
    ? activityPath(event.eventId)
    : `${getPath(['dashboard', 'calendar'])}?event=${event.eventId}`;
}

function EventRow({ event, showDay }: { event: Event; showDay?: boolean }) {
  const duration = eventDuration(event);
  const distance = eventDistance(event);
  const compliance = isPlannedEvent(event) ? getCompliance(event) : undefined;
  const facts = [
    showDay &&
      format(event.startDate, 'EEE d MMM', {
        locale: getDateFnsLocale(getLocale()),
      }),
    !!duration && formatCompactDuration(duration),
    !!distance && `${formatCompactKilometers(distance, getLocale())} km`,
  ].filter(Boolean);

  return (
    <Link
      to={eventHref(event)}
      data-today-event={event.eventId}
      className="flex min-h-16 items-center gap-3 px-4 py-3 active:bg-accent"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
        {'sport' in event && (
          <SportIcon sport={event.sport} className="size-5" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.9375rem] font-medium">
          {event.name}
        </span>
        <span className="block truncate text-sm text-muted-foreground">
          {facts.join(' · ')}
        </span>
      </span>
      {compliance && isShownCompliance(compliance) && (
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              'size-2 rounded-full',
              complianceDotClass[compliance.status],
            )}
          />
          <span className="sr-only">
            {complianceLabel[compliance.status]()}
          </span>
        </span>
      )}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
    </Link>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <SectionLabel>{title}</SectionLabel>
        {action}
      </div>
      {children}
    </section>
  );
}

const List = ({ children }: { children: React.ReactNode }) => (
  <div className="divide-y overflow-hidden rounded-2xl border bg-card">
    {children}
  </div>
);

/** What matters now: today's session, form, the week and the next race. */
function TodayScreen() {
  const { data: me } = useGetMeQuery();
  const { data: athlete } = useGetMyAthleteQuery();
  const athleteId = athlete?.athleteId;
  const { now, start, end, monday } = useMemo(() => {
    const date = new Date();
    return {
      now: date,
      monday: startOfWeek(date, { weekStartsOn: 1 }),
      start: startOfDay(addDays(date, -14)),
      end: endOfDay(addDays(date, 14)),
    };
  }, []);
  const { data: events, isPending } = useGetMyEventsQuery(
    undefined,
    undefined,
    start,
    end,
  );
  const { data: load } = useTrainingLoadMetrics(
    TrainingLoadCalculationType.TRIMP,
    now,
    athleteId,
  );
  const { data: races = [] } = useGetUpcomingCompetitionsQuery(
    false,
    athleteId,
  );

  const sorted = useMemo(
    () =>
      [...(events ?? [])]
        .filter((event) => event.type !== EVENT_TYPE.NOTE)
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime()),
    [events],
  );
  // A done session shows once, as its activity
  const shown = sorted.filter(
    (event) => !(isPlannedEvent(event) && event.relatedActivity),
  );
  const todayEvents = shown.filter((event) => isSameDay(event.startDate, now));
  const coming = shown
    .filter(
      (event) =>
        isPlannedEvent(event) &&
        differenceInCalendarDays(event.startDate, now) > 0,
    )
    .slice(0, 3);
  const recent = shown
    .filter(
      (event) =>
        event.type === EVENT_TYPE.ACTIVITY && !isSameDay(event.startDate, now),
    )
    .slice(-3)
    .reverse();
  const week = useMemo(
    () =>
      summarizeWeek(
        sorted.filter(
          (event) =>
            event.startDate >= monday && event.startDate < addDays(monday, 7),
        ),
      ),
    [sorted, monday],
  );
  const dateLabel = format(now, 'EEEE d MMMM', {
    locale: getDateFnsLocale(getLocale()),
  });
  const appBar = useMemo(
    () => ({
      titleContent: (
        <p className="truncate pl-1 text-[0.9375rem] font-medium text-muted-foreground first-letter:uppercase">
          {dateLabel}
        </p>
      ),
    }),
    [dateLabel],
  );
  useAppBar(appBar);
  const race = races[0];
  const form = load?.tsb;
  const formStatus = form === undefined ? undefined : getFormStatus(form);
  const weekProgress = week.duration.planned
    ? Math.min(1, week.duration.done / week.duration.planned)
    : 0;

  return (
    <div className="space-y-6 px-4 pt-2 pb-6">
      <h2 className="text-[1.75rem] leading-tight font-semibold tracking-tight">
        {m.today_greeting({ name: me?.firstName ?? '' })}
      </h2>

      <Section title={m.today_session()}>
        {isPending ? (
          <Skeleton className="h-20 rounded-2xl" />
        ) : todayEvents.length > 0 ? (
          <List>
            {todayEvents.map((event) => (
              <EventRow key={event.eventId} event={event} />
            ))}
          </List>
        ) : (
          <div className="rounded-2xl border bg-card px-4 py-5">
            <p className="font-medium">{m.today_rest_day()}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {m.today_rest_day_hint()}
            </p>
          </div>
        )}
      </Section>

      <div className="grid grid-cols-2 gap-3">
        <Link
          to={getPath(['dashboard', 'statistics'])}
          className="rounded-2xl border bg-card p-4 active:bg-accent"
        >
          <SectionLabel>{m.today_form()}</SectionLabel>
          {formStatus && form !== undefined ? (
            <>
              <p
                className={cn(
                  'mt-1 text-3xl font-semibold tracking-tight',
                  formStatusTextClass[formStatus],
                )}
              >
                {formatForm(form)}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <span
                  className={cn(
                    'size-2 rounded-full',
                    formStatusDotClass[formStatus],
                  )}
                />
                <span className="truncate">
                  {formStatusLabel[formStatus]()}
                </span>
              </p>
            </>
          ) : (
            <Skeleton className="mt-2 h-14 rounded-lg" />
          )}
        </Link>
        <Link
          to={getPath(['dashboard', 'calendar'])}
          className="flex flex-col rounded-2xl border bg-card p-4 active:bg-accent"
        >
          <SectionLabel>{m.today_this_week()}</SectionLabel>
          <p className="mt-1 text-3xl font-semibold tracking-tight">
            {formatCompactDuration(week.duration.done) || '0'}
          </p>
          {week.duration.planned > 0 ? (
            <>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {m.today_week_planned({
                  duration: formatCompactDuration(week.duration.planned),
                })}
              </p>
              <span className="mt-auto block h-1.5 overflow-hidden rounded-full bg-secondary">
                <span
                  className="block h-full rounded-full bg-primary"
                  style={{ width: `${weekProgress * 100}%` }}
                />
              </span>
            </>
          ) : (
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {m.today_week_nothing_planned()}
            </p>
          )}
        </Link>
      </div>

      {race && (
        <Link
          to={`${getPath(['dashboard', 'calendar'])}?event=${race.eventId}`}
          className="flex items-center gap-3 rounded-2xl bg-primary p-4 text-primary-foreground active:opacity-90"
        >
          <Flag className="size-5 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{race.name}</span>
            <span className="block text-sm opacity-75">
              {format(race.startDate, 'd MMMM yyyy', {
                locale: getDateFnsLocale(getLocale()),
              })}
            </span>
          </span>
          <span className="shrink-0 text-right">
            <span className="block text-2xl leading-none font-semibold">
              {differenceInCalendarDays(race.startDate, now)}
            </span>
            <span className="text-xs opacity-75">{m.today_days_left()}</span>
          </span>
        </Link>
      )}

      {coming.length > 0 && (
        <Section title={m.today_coming_up()}>
          <List>
            {coming.map((event) => (
              <EventRow key={event.eventId} event={event} showDay />
            ))}
          </List>
        </Section>
      )}

      {recent.length > 0 && (
        <Section title={m.today_recent()}>
          <List>
            {recent.map((event) => (
              <EventRow key={event.eventId} event={event} showDay />
            ))}
          </List>
        </Section>
      )}
    </div>
  );
}

export function TodayPage() {
  const isMobile = useIsMobile();
  return isMobile ? (
    <TodayScreen />
  ) : (
    <Navigate to={getPath(['dashboard', 'calendar'])} replace />
  );
}
