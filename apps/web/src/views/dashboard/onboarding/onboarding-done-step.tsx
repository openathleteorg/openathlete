import { useStatisticsVolumeQuery } from '@/api/statistics';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getPath } from '@/routes/paths';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { lastWeeksRange } from './onboarding-flow';
import { StepHeader } from './onboarding-steps';

function ImportedSummary({
  athleteId,
  range,
  importing,
}: {
  athleteId: number;
  range: { from: Date; to: Date };
  importing: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const { data: volume } = useStatisticsVolumeQuery(
    { athleteId, from: range.from, to: range.to },
    true,
  );
  const weeks = useMemo(
    () =>
      (volume?.buckets ?? []).map((bucket) => ({
        period: bucket.period,
        seconds: bucket.sports.reduce((sum, s) => sum + s.movingTime, 0),
        count: bucket.sports.reduce((sum, s) => sum + s.count, 0),
      })),
    [volume],
  );
  const count = weeks.reduce((sum, week) => sum + week.count, 0);
  const hours = Math.round(
    weeks.reduce((sum, week) => sum + week.seconds, 0) / 3600,
  );
  const max = Math.max(1, ...weeks.map((week) => week.seconds));
  const numbers = new Intl.NumberFormat(getLocale());

  if (count === 0) {
    return importing ? (
      <p className="bg-secondary rounded-xl px-4 py-3 text-sm">
        {m.onboarding_done_importing()}
      </p>
    ) : null;
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border px-4 py-4">
      <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {m.onboarding_done_weeks()}
      </span>
      <div className="flex gap-8">
        <div className="flex flex-col">
          <span className="text-2xl font-bold tabular-nums">
            {numbers.format(count)}
          </span>
          <span className="text-muted-foreground text-sm">
            {m.onboarding_done_activities()}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold tabular-nums">
            {numbers.format(hours)}
          </span>
          <span className="text-muted-foreground text-sm">
            {m.onboarding_done_hours()}
          </span>
        </div>
      </div>
      <div
        role="img"
        aria-label={m.onboarding_done_week_chart()}
        className="flex h-14 items-end gap-1"
      >
        {weeks.map((week, index) => (
          <motion.span
            key={week.period}
            className="bg-chart-5 flex-1 rounded-t-sm"
            style={{ minHeight: week.seconds > 0 ? 3 : 1 }}
            initial={reduceMotion ? false : { height: 0 }}
            animate={{ height: `${(week.seconds / max) * 100}%` }}
            transition={{ delay: index * 0.03, duration: 0.4 }}
          />
        ))}
      </div>
      {importing && (
        <p className="text-muted-foreground text-sm">
          {m.onboarding_done_importing()}
        </p>
      )}
    </div>
  );
}

function NextStep({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="bg-secondary hover:bg-accent flex min-h-12 items-center justify-between gap-3 rounded-xl px-4 text-sm font-medium"
    >
      {label}
      <ChevronRight className="text-muted-foreground size-4" />
    </Link>
  );
}

export function DoneStep({
  athlete,
  coach,
  athleteId,
  hasDevice,
  importing,
  race,
  onConnect,
}: {
  athlete: boolean;
  coach: boolean;
  athleteId: number | undefined;
  hasDevice: boolean;
  importing: boolean;
  race: { name: string; date: string } | null;
  onConnect: () => void;
}) {
  const range = useMemo(() => lastWeeksRange(), []);
  const raceDate = race
    ? new Intl.DateTimeFormat(getLocale(), {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(`${race.date}T12:00:00Z`))
    : null;

  return (
    <>
      <StepHeader
        title={
          athlete
            ? m.onboarding_done_title_athlete()
            : m.onboarding_done_title_coach()
        }
      />
      {athlete && athleteId !== undefined && hasDevice && (
        <ImportedSummary
          athleteId={athleteId}
          range={range}
          importing={importing}
        />
      )}
      {race && (
        <div className="flex flex-col gap-1 rounded-xl border px-4 py-4">
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {m.onboarding_done_race()}
          </span>
          <span className="font-semibold">
            {race.name} · {raceDate}
          </span>
          <span className="text-muted-foreground text-sm">
            {m.onboarding_done_race_added()}
          </span>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {m.onboarding_done_next()}
        </span>
        {athlete && !hasDevice && (
          <button
            type="button"
            onClick={onConnect}
            className="bg-secondary hover:bg-accent flex min-h-12 items-center justify-between gap-3 rounded-xl px-4 text-left text-sm font-medium"
          >
            {m.onboarding_done_todo_connect()}
            <ChevronRight className="text-muted-foreground size-4" />
          </button>
        )}
        {athlete && (
          <>
            <NextStep
              to={getPath(['dashboard', 'calendar', 'root'])}
              label={m.onboarding_done_todo_plan()}
            />
            <NextStep
              to={`${getPath(['dashboard', 'settings', 'root'])}?tab=training_zones`}
              label={m.onboarding_done_todo_zones()}
            />
          </>
        )}
        {coach && (
          <NextStep
            to={getPath(['dashboard', 'coach'])}
            label={m.onboarding_done_todo_athletes()}
          />
        )}
      </div>
    </>
  );
}
