import { useTrainingCheckQuery } from '@/api/statistics';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateLocale } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import {
  ArrowDown,
  ArrowUp,
  Check,
  CircleDashed,
  Equal,
  TriangleAlert,
} from 'lucide-react';

import {
  CHECK_MIN_BASELINE_DAYS,
  CHECK_MIN_LONG_RUNS,
  CHECK_MIN_RUNS,
  CHECK_MIN_WEEK_DAYS,
  CheckStatus,
  TrainingCheckDto,
  formatSpeed,
  formatSpeedUnit,
} from '@openathlete/shared';

import { GarminAttribution } from '../garmin-attribution/garmin-attribution';
import { SectionLabel } from '../ui/section-label';
import { Skeleton } from '../ui/skeleton';
import { MetricInfo } from './metric-info';

// Arrows and words carry the answer; the tints differ in lightness as well
type Look = CheckStatus | TrainingCheckDto['design']['status'];
const STATUS: Record<
  Look,
  { icon: typeof ArrowUp; label: () => string; tint: string; text: string }
> = {
  BETTER: {
    icon: ArrowUp,
    label: m.check_status_better,
    tint: 'bg-teal-100 dark:bg-teal-950',
    text: 'text-teal-800 dark:text-teal-300',
  },
  SAME: {
    icon: Equal,
    label: m.check_status_same,
    tint: 'bg-muted',
    text: 'text-muted-foreground',
  },
  WORSE: {
    icon: ArrowDown,
    label: m.check_status_worse,
    tint: 'bg-orange-100 dark:bg-orange-950',
    text: 'text-orange-800 dark:text-orange-300',
  },
  // How the weeks were built has no better or worse: fine, or one note
  FINE: {
    icon: Check,
    label: m.check_status_fine,
    tint: 'bg-muted',
    text: 'text-muted-foreground',
  },
  NOTE: {
    icon: TriangleAlert,
    label: m.check_status_note,
    tint: 'bg-orange-100 dark:bg-orange-950',
    text: 'text-orange-800 dark:text-orange-300',
  },
  OPEN: {
    icon: CircleDashed,
    label: m.check_status_open,
    tint: 'border border-dashed',
    text: 'text-muted-foreground',
  },
};

const number = (value: number, digits = 0) =>
  new Intl.NumberFormat(getLocale(), {
    maximumFractionDigits: digits,
  }).format(value);

const watts = (value: number) => `${number(value)} W`;
/** A speed in m/s as a pace */
const formatRunPace = (speed: number) =>
  `${formatSpeed(speed, 'min/km')} ${formatSpeedUnit('min/km')}`;
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
  status: Look;
  text: string;
  id: string;
}) {
  const { icon: Icon, label, tint, text: tone } = STATUS[status];
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
export function TrainingCheckCard({ athleteId }: { athleteId?: number }) {
  const { data, isLoading } = useTrainingCheckQuery(athleteId);
  if (isLoading) return <Skeleton className="h-40 rounded-md" />;
  if (!data) return null;
  const { fitness, speed, durability, recovery, design } = data;
  const runs =
    fitness.counts[0] + fitness.counts[1] > 0 ||
    durability.counts[0] + durability.counts[1] > 0 ||
    speed.current !== null;
  if (!runs) return null;

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
      <p className="text-xs text-muted-foreground">{m.check_flat_note()}</p>
      {/* Derived from activities, which Garmin devices may record */}
      <GarminAttribution athleteId={athleteId} />
    </div>
  );
}
