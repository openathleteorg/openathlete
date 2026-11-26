import { useTrainingCheckQuery } from '@/api/statistics';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getPath } from '@/routes/paths';
import { getDateLocale } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import { Link } from 'react-router-dom';

import {
  CHECK_MIN_BASELINE_DAYS,
  CHECK_MIN_LONG_RUNS,
  CHECK_MIN_RUNS,
  CHECK_MIN_WEEK_DAYS,
  CheckSummary,
  TrainingCheckDto,
  checkSummary,
} from '@openathlete/shared';

import { GarminAttribution } from '../garmin-attribution/garmin-attribution';
import { SectionLabel } from '../ui/section-label';
import { Skeleton } from '../ui/skeleton';
import { MetricInfo } from './metric-info';
import {
  CHECK_STATUS,
  type CheckLook,
  formatRunPace,
} from './training-check-look';

const number = (value: number, digits = 0) =>
  new Intl.NumberFormat(getLocale(), {
    maximumFractionDigits: digits,
  }).format(value);

const watts = (value: number) => `${number(value)} W`;
const percent = (value: number, digits = 1) => `${number(value, digits)} %`;

/** What the heart rate is compared at: watts, or a pace */
function fitnessLoad({ basis, reference }: TrainingCheckDto['fitness']) {
  if (reference === null) return '';
  return basis === 'POWER' ? watts(reference) : formatRunPace(reference);
}

function fitnessText(fitness: TrainingCheckDto['fitness']): string {
  const [current, previous] = fitness.counts;
  const load = fitnessLoad(fitness);
  if (
    fitness.status === 'OPEN' ||
    fitness.current === null ||
    fitness.previous === null
  ) {
    return m.check_fitness_open({ count: CHECK_MIN_RUNS, current, previous });
  }
  if (fitness.status === 'SAME') {
    return m.check_fitness_same({ load, current, previous });
  }
  // At least one beat: the answer said the change is real
  const beats = number(
    Math.max(1, Math.abs(Math.round(fitness.current - fitness.previous))),
  );
  return fitness.status === 'BETTER'
    ? m.check_fitness_better({ load, beats })
    : m.check_fitness_worse({ load, beats });
}

function speedText(speed: TrainingCheckDto['speed']): string {
  const format = speed.kind === 'speed' ? formatRunPace : watts;
  const name =
    speed.kind === 'speed'
      ? m.statistics_critical_speed()
      : m.statistics_critical_power();
  if (speed.current === null) return m.check_speed_open_none();
  const current = format(speed.current);
  if (speed.status === 'OPEN' || speed.previous === null) {
    return m.check_speed_open({ name, current });
  }
  if (speed.status === 'SAME') return m.check_speed_same({ name, current });
  const values = { name, current, previous: format(speed.previous) };
  return speed.status === 'BETTER'
    ? m.check_speed_better(values)
    : m.check_speed_worse(values);
}

function durabilityText(durability: TrainingCheckDto['durability']): string {
  const [current, previous] = durability.counts;
  if (
    durability.status === 'OPEN' ||
    durability.current === null ||
    durability.previous === null
  ) {
    return m.check_durability_open({
      count: CHECK_MIN_LONG_RUNS,
      current,
      previous,
    });
  }
  const values = {
    current: percent(durability.current),
    previous: percent(durability.previous),
  };
  if (durability.status === 'SAME') return m.check_durability_same(values);
  return durability.status === 'BETTER'
    ? m.check_durability_better(values)
    : m.check_durability_worse(values);
}

const SIGNAL_TEXT = {
  variability: {
    LOW: m.check_recovery_hrv_low,
    NORMAL: m.check_recovery_hrv_normal,
    HIGH: m.check_recovery_hrv_high,
  },
  restingHeartrate: {
    LOW: m.check_recovery_rhr_low,
    NORMAL: m.check_recovery_rhr_normal,
    HIGH: m.check_recovery_rhr_high,
  },
};

function recoveryText(recovery: TrainingCheckDto['recovery']): string {
  const parts = (['variability', 'restingHeartrate'] as const).flatMap(
    (key) => {
      const signal = recovery[key];
      if (!signal) return [];
      // Whole numbers, unless they would put a week outside its range on
      // the edge of it: "43, below 43 to 46"
      const whole = (value: number) => Math.round(value);
      const digits =
        signal.state !== 'NORMAL' &&
        (whole(signal.week) === whole(signal.low) ||
          whole(signal.week) === whole(signal.high))
          ? 1
          : 0;
      return [
        SIGNAL_TEXT[key][signal.state]({
          value: number(signal.week, digits),
          low: number(signal.low, digits),
          high: number(signal.high, digits),
        }),
      ];
    },
  );
  return parts.length
    ? parts.join(' ')
    : m.check_recovery_open({
        week: CHECK_MIN_WEEK_DAYS,
        before: CHECK_MIN_BASELINE_DAYS,
      });
}

function designText(design: TrainingCheckDto['design']): string {
  if (design.status === 'OPEN') return m.check_design_open();
  const { longRun } = design;
  return [
    m.check_design_weeks({ weeks: design.weeks, of: design.of }),
    ...(design.easyShare === null
      ? []
      : [m.check_design_easy({ share: percent(design.easyShare * 100, 0) })]),
    longRun
      ? m.check_design_long_run({
          // A calendar day: read in UTC, as it was written
          date: new Intl.DateTimeFormat(getDateLocale(getLocale()), {
            day: 'numeric',
            month: 'short',
            timeZone: 'UTC',
          }).format(new Date(`${longRun.date}T00:00:00Z`)),
          percent: percent((longRun.distance / longRun.longest - 1) * 100, 0),
        })
      : m.check_design_steady(),
  ].join(' ');
}

function Row({
  question,
  status,
  text,
  id,
}: {
  question: string;
  status: CheckLook;
  text: string;
  id: string;
}) {
  const { icon: Icon, label, tint, text: tone } = CHECK_STATUS[status];
  return (
    <div
      className="flex items-center gap-3 border-b py-2.5"
      data-check={id}
      data-status={status}
    >
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full',
          tint,
        )}
      >
        <Icon className={cn('size-5', tone)} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{question}</div>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
      <span className={cn('shrink-0 text-xs font-semibold', tone)}>
        {label()}
      </span>
    </div>
  );
}

/**
 * The training check of a runner: a few plain questions, each answered by
 * comparing the last six weeks with the six before, or left open with what
 * is missing; then how the last week was coped with, and how the weeks
 * were built. Hidden from those who do not run.
 */
const SUMMARY: Record<CheckSummary, () => string> = {
  WORKING: m.check_summary_working,
  WORKING_COSTLY: m.check_summary_working_costly,
  DECLINING: m.check_summary_declining,
  DECLINING_TIRED: m.check_summary_declining_tired,
  MIXED: m.check_summary_mixed,
  STABLE: m.check_summary_stable,
  STABLE_TIRED: m.check_summary_stable_tired,
  OPEN: m.check_summary_open,
};

export function TrainingCheckCard({
  athleteId,
  link = true,
}: {
  athleteId?: number;
  /** Off on the page the link leads to */
  link?: boolean;
}) {
  const { data, isLoading } = useTrainingCheckQuery(athleteId);
  if (isLoading) return <Skeleton className="h-40 rounded-md" />;
  if (!data) return null;
  const { fitness, speed, durability, recovery, design } = data;
  const runs =
    fitness.counts[0] + fitness.counts[1] > 0 ||
    durability.counts[0] + durability.counts[1] > 0 ||
    speed.current !== null;
  if (!runs) return null;
  const summary = checkSummary(
    [fitness.status, speed.status, durability.status],
    recovery.status,
  );
  const historyPath = `${getPath(['dashboard', 'statistics'])}${athleteId ? `/${athleteId}` : ''}?view=check`;

  return (
    <div className="space-y-2 rounded-md border p-3" data-training-check>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="flex items-center gap-1">
          <SectionLabel>{m.check_title()}</SectionLabel>
          <MetricInfo metric="trainingCheck" />
        </span>
        <span className="text-xs text-muted-foreground">
          {m.check_period()}
        </span>
      </div>
      <div className="rounded-md bg-muted p-3" data-check-summary={summary}>
        <div className="text-base font-semibold">{SUMMARY[summary]()}</div>
        <p className="text-xs text-muted-foreground">
          {m.check_summary_note()}
        </p>
      </div>
      <div className="border-t">
        <Row
          id="fitness"
          question={m.check_fitness_question()}
          status={fitness.status}
          text={fitnessText(fitness)}
        />
        <Row
          id="speed"
          question={m.check_speed_question()}
          status={speed.status}
          text={speedText(speed)}
        />
        <Row
          id="durability"
          question={m.check_durability_question()}
          status={durability.status}
          text={durabilityText(durability)}
        />
        <Row
          id="recovery"
          question={m.check_recovery_question()}
          status={recovery.status}
          text={recoveryText(recovery)}
        />
        <Row
          id="design"
          question={m.check_design_question()}
          status={design.status}
          text={designText(design)}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>{m.check_flat_note()}</span>
        {link && (
          <Link to={historyPath} className="font-medium underline">
            {m.check_history_link()}
          </Link>
        )}
      </div>
      {/* Derived from activities, which Garmin devices may record */}
      <GarminAttribution athleteId={athleteId} />
    </div>
  );
}
