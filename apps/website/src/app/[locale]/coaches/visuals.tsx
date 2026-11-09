import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import {
  ArrowDown,
  Bandage,
  Check,
  KeyRound,
  MessageCircle,
  Minus,
  MoonStar,
  Sparkles,
  Watch,
  X,
} from 'lucide-react';

/** The "To watch" list of the coach dashboard, as the app shows it. */
export function WatchList({ className }: { className?: string }) {
  const alerts = [
    {
      icon: <Bandage />,
      text: m.coachespage_alert_1(),
      tone: 'text-coral-strong bg-coral/15',
    },
    {
      icon: <MoonStar />,
      text: m.coachespage_alert_2(),
      tone: 'text-orchid-strong bg-orchid/15',
    },
    {
      icon: <MessageCircle />,
      text: m.coachespage_alert_3(),
      tone: 'text-sky-strong bg-sky/20',
    },
  ];
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-white p-4 shadow-[0_24px_48px_-24px_rgb(5_12_52/0.45)]',
        className,
      )}
    >
      <p className="kicker text-muted-foreground">
        {m.coachespage_alert_title()}
      </p>
      <ul className="mt-3 grid gap-2">
        {alerts.map((alert) => (
          <li
            key={alert.text}
            className="flex items-center gap-2.5 text-[0.82rem]"
          >
            <span
              className={cn(
                'grid size-7 shrink-0 place-items-center rounded-lg [&_svg]:size-3.5',
                alert.tone,
              )}
            >
              {alert.icon}
            </span>
            {alert.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

const ROSTER = [
  {
    name: 'Léa M.',
    done: 4,
    planned: 5,
    compliance: 92,
    hours: '6h40',
    form: -8,
  },
  {
    name: 'Tom R.',
    done: 1,
    planned: 4,
    compliance: 31,
    hours: '1h10',
    form: 14,
  },
  {
    name: 'Inès K.',
    done: 6,
    planned: 6,
    compliance: 97,
    hours: '9h05',
    form: -15,
  },
  {
    name: 'Hugo B.',
    done: 3,
    planned: 4,
    compliance: 78,
    hours: '4h20',
    form: -3,
  },
  {
    name: 'Sara P.',
    done: 5,
    planned: 5,
    compliance: 88,
    hours: '7h30',
    form: 2,
  },
];

/** A sketch of the team overview table: done/planned, volume, compliance, form. */
export function RosterTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_30px_60px_-40px_rgb(5_12_52/0.45)]">
      <div className="grid grid-cols-[1.3fr_0.8fr_0.8fr_1.4fr_0.9fr] gap-3 border-b border-border bg-paper px-4 py-2.5 font-mono text-[0.62rem] tracking-wider text-muted-foreground uppercase sm:px-5">
        <span />
        <span>{m.coachespage_roster_sessions()}</span>
        <span>{m.coachespage_roster_volume()}</span>
        <span>{m.coachespage_roster_compliance()}</span>
        <span className="text-right">{m.home_load_form()}</span>
      </div>
      <ul className="divide-y divide-border">
        {ROSTER.map((row) => (
          <li
            key={row.name}
            className="grid grid-cols-[1.3fr_0.8fr_0.8fr_1.4fr_0.9fr] items-center gap-3 px-4 py-3 text-[0.82rem] sm:px-5"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky/40 to-orchid/40 text-[0.65rem] font-semibold">
                {row.name.slice(0, 1)}
              </span>
              <span className="truncate font-medium">{row.name}</span>
            </span>
            <span className="tabular-nums">
              {row.done}/{row.planned}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {row.hours}
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                <span
                  className={cn(
                    'block h-full rounded-full',
                    row.compliance >= 80
                      ? 'bg-mint-strong'
                      : row.compliance >= 50
                        ? 'bg-[#f2b13c]'
                        : 'bg-coral-strong',
                  )}
                  style={{ width: `${row.compliance}%` }}
                />
              </span>
              <span className="w-7 text-right text-[0.72rem] tabular-nums text-muted-foreground">
                {row.compliance}
              </span>
            </span>
            <span
              className={cn(
                'text-right font-medium tabular-nums',
                row.form < -10
                  ? 'text-coral-strong'
                  : row.form > 10
                    ? 'text-sky-strong'
                    : 'text-ink',
              )}
            >
              {row.form > 0
                ? `+${row.form}`
                : row.form.toString().replace('-', '−')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Support = boolean | null;

/** What each brand supports, from the connectors in the API. */
export function WatchMatrix() {
  const rows: Array<{
    name: string;
    activities: Support;
    workouts: Support;
    wellness: Support;
    note?: string;
    fresh?: boolean;
  }> = [
    { name: 'Garmin', activities: true, workouts: true, wellness: true },
    {
      name: 'COROS',
      activities: true,
      workouts: true,
      wellness: true,
      note: m.coachespage_watch_coros_note(),
      fresh: true,
    },
    { name: 'Suunto', activities: true, workouts: true, wellness: true },
    { name: 'Polar', activities: true, workouts: false, wellness: true },
    { name: 'Strava', activities: true, workouts: false, wellness: false },
    {
      name: m.coachespage_watch_files(),
      activities: true,
      workouts: null,
      wellness: null,
    },
  ];
  const cell = (value: Support) =>
    value === true ? (
      <span className="mx-auto grid size-7 place-items-center rounded-full bg-mint/25 text-mint-strong">
        <Check className="size-4" />
      </span>
    ) : value === false ? (
      <span className="mx-auto grid size-7 place-items-center rounded-full bg-secondary text-muted-foreground">
        <X className="size-3.5" />
      </span>
    ) : (
      <Minus className="mx-auto size-4 text-border" />
    );

  return (
    <div className="overflow-x-auto rounded-3xl border border-border bg-white">
      <table className="w-full text-left text-[0.88rem] sm:text-[0.92rem]">
        <thead>
          <tr className="border-b border-border bg-paper text-[0.7rem] leading-tight text-muted-foreground sm:text-[0.78rem]">
            <th className="px-4 py-3.5 font-medium sm:px-5" />
            <th className="px-1.5 py-3.5 text-center font-medium sm:px-3">
              {m.coachespage_watch_col_activities()}
            </th>
            <th className="px-1.5 py-3.5 text-center font-medium sm:px-3">
              <span className="inline-flex items-center gap-1.5">
                <Watch className="hidden size-3.5 sm:block" />
                {m.coachespage_watch_col_workouts()}
              </span>
            </th>
            <th className="px-1.5 py-3.5 text-center font-medium sm:px-3">
              {m.coachespage_watch_col_wellness()}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.name}>
              <th scope="row" className="px-4 py-3.5 font-medium sm:px-5">
                <span className="flex items-center gap-2">
                  {row.name}
                  {row.fresh && (
                    <span className="rounded-full bg-mint/25 px-2 py-px text-[0.66rem] font-medium text-mint-strong">
                      {m.coachespage_watch_new()}
                    </span>
                  )}
                </span>
                {row.note && (
                  <span className="block text-[0.74rem] font-normal text-muted-foreground">
                    {row.note}
                  </span>
                )}
              </th>
              <td className="px-1.5 py-3.5 sm:px-3">{cell(row.activities)}</td>
              <td className="px-1.5 py-3.5 sm:px-3">{cell(row.workouts)}</td>
              <td className="px-1.5 py-3.5 sm:px-3">{cell(row.wellness)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Which key pays for an athlete's background AI. */
export function AiKeyFlow() {
  const steps = [
    {
      icon: <Watch />,
      text: m.coachespage_ai_step_1(),
      accent: 'bg-white/10 text-white',
    },
    {
      icon: <KeyRound />,
      text: m.coachespage_ai_step_2(),
      accent: 'bg-sky/20 text-sky',
    },
    {
      icon: <KeyRound />,
      text: m.coachespage_ai_step_3(),
      accent: 'bg-orchid/25 text-orchid',
      highlight: true,
    },
    {
      icon: <Sparkles />,
      text: m.coachespage_ai_step_4(),
      accent: 'bg-mint/20 text-mint',
    },
  ];
  return (
    <ol className="grid gap-2">
      {steps.map((step, index) => (
        <li key={step.text} className="grid justify-items-center gap-2">
          <div
            className={cn(
              'flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5',
              step.highlight
                ? 'border-orchid/50 bg-orchid/10 shadow-[0_0_40px_-10px_var(--orchid)]'
                : 'border-white/10 bg-white/[0.04]',
            )}
          >
            <span
              className={cn(
                'grid size-9 shrink-0 place-items-center rounded-xl [&_svg]:size-4',
                step.accent,
              )}
            >
              {step.icon}
            </span>
            <span className="text-[0.95rem] text-white/90">{step.text}</span>
          </div>
          {index < steps.length - 1 && (
            <ArrowDown className="size-4 text-white/30" />
          )}
        </li>
      ))}
    </ol>
  );
}

/** Twelve athletes: the first five are free, the rest are covered by one plan. */
export function RosterDots() {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 14 }, (_, index) => (
          <span
            key={index}
            className={cn(
              'grid size-9 place-items-center rounded-full text-[0.7rem] font-semibold tabular-nums',
              index < 5 ? 'bg-mint/30 text-mint-strong' : 'bg-ink text-white',
            )}
          >
            {index + 1}
          </span>
        ))}
        <span className="grid h-9 place-items-center px-1 text-muted-foreground">
          …
        </span>
      </div>
      <div className="mt-4 grid gap-2 text-[0.88rem]">
        <p className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-mint/60" />
          {m.coachespage_price_free()}
        </p>
        <p className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-ink" />
          {m.coachespage_price_paid()}
        </p>
      </div>
    </div>
  );
}
