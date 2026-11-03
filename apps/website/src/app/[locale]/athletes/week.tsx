import { RevealGroup, RevealItem } from '@/components/site/reveal';
import { m } from '@/paraglide/messages';
import { DATE_LOCALES, type SupportedLocale } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import { Sparkles, Watch } from 'lucide-react';
import type { ReactNode } from 'react';

/** A Monday, to name the days of the week in each language. */
const MONDAY = Date.UTC(2026, 10, 2);

function weekday(
  locale: SupportedLocale,
  offset: number,
  style: 'long' | 'narrow',
) {
  return new Intl.DateTimeFormat(DATE_LOCALES[locale], {
    weekday: style,
    timeZone: 'UTC',
  }).format(new Date(MONDAY + offset * 86_400_000));
}

/** Zone colours, from easy to hard, as in the app's workout editor. */
const ZONE = ['#9fd3fb', '#6ec1fc', '#12a594', '#f2b13c', '#f4743b', '#e2582a'];

/** The week's sessions in minutes and their main zone; null is a rest day. */
const WEEK: Array<{ label: string; minutes: number; zone: number } | null> = [
  { label: "45'", minutes: 45, zone: 1 },
  { label: "5×4'", minutes: 65, zone: 4 },
  null,
  { label: "50'", minutes: 50, zone: 1 },
  null,
  { label: "8×1'", minutes: 55, zone: 5 },
  { label: '2h00', minutes: 120, zone: 2 },
];

function PlanVisual({ locale }: { locale: SupportedLocale }) {
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5">
        {WEEK.map((day, index) => (
          <div key={index} className="flex flex-col items-center gap-1.5">
            <span className="font-mono text-[0.62rem] text-muted-foreground uppercase">
              {weekday(locale, index, 'narrow')}
            </span>
            <div className="flex h-16 w-full items-end rounded-md bg-paper p-1">
              {day && (
                <div
                  className="w-full rounded-[3px]"
                  style={{
                    height: `${(day.minutes / 120) * 100}%`,
                    background: ZONE[day.zone],
                  }}
                />
              )}
            </div>
            <span className="font-mono text-[0.6rem] text-ink/70">
              {day?.label ?? '·'}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="relative h-1.5 flex-1 rounded-full bg-secondary">
          <div className="absolute inset-y-0 left-[38%] w-[30%] rounded-full bg-mint/35" />
          <div className="absolute top-1/2 left-[55%] size-3 -translate-1/2 rounded-full border-2 border-white bg-mint-strong shadow" />
        </div>
      </div>
      <p className="mt-2 text-[0.72rem] text-mint-strong">
        {m.athletes_week_mon_load()}
      </p>
    </div>
  );
}

/** 15' warm-up, 5 × (4' threshold, 2' easy), 10' cool-down. */
const INTERVALS = [
  { minutes: 15, zone: 1 },
  ...Array.from({ length: 5 }, () => [
    { minutes: 4, zone: 4 },
    { minutes: 2, zone: 0 },
  ]).flat(),
  { minutes: 10, zone: 1 },
];

function WatchVisual() {
  const total = INTERVALS.reduce((sum, step) => sum + step.minutes, 0);
  return (
    <div>
      <div className="flex h-20 items-end gap-[2px]">
        {INTERVALS.map((step, index) => (
          <div
            key={index}
            className="rounded-t-[3px]"
            style={{
              width: `${(step.minutes / total) * 100}%`,
              height: `${[30, 45, 60, 75, 92, 100][step.zone]}%`,
              background: ZONE[step.zone],
            }}
          />
        ))}
      </div>
      <p className="mt-3 flex w-fit items-center gap-1.5 rounded-full bg-mint/20 px-2.5 py-1 font-mono text-[0.68rem] text-mint-strong">
        <Watch className="size-3.5" />
        {m.athletes_week_tue_sent()}
      </p>
    </div>
  );
}

function ReadVisual() {
  return (
    <div className="rounded-xl border border-border bg-paper p-3.5">
      <p className="flex items-center gap-1.5 text-[0.78rem] font-semibold">
        <Sparkles className="size-3.5 text-orchid-strong" />
        {m.athletes_week_thu_read()}
      </p>
      <ul className="mt-2 grid gap-1.5 text-[0.76rem] text-ink/80">
        {[
          m.athletes_week_thu_finding_1(),
          m.athletes_week_thu_finding_2(),
          m.athletes_week_thu_finding_3(),
        ].map((finding) => (
          <li key={finding} className="flex gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-orchid" />
            {finding}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FormVisual() {
  const values = [
    { label: m.home_load_fitness(), value: '58', className: 'text-sky-strong' },
    {
      label: m.home_load_fatigue(),
      value: '71',
      className: 'text-coral-strong',
    },
    {
      label: m.home_load_form(),
      value: '−13',
      className: 'text-orchid-strong',
    },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {values.map((item) => (
        <div
          key={item.label}
          className="rounded-xl bg-paper px-2 py-3 text-center"
        >
          <p
            className={cn(
              'text-2xl font-semibold tracking-[-0.03em] tabular-nums',
              item.className,
            )}
          >
            {item.value}
          </p>
          <p className="mt-0.5 truncate text-[0.68rem] text-muted-foreground">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function Day({
  name,
  index,
  title,
  body,
  visual,
}: {
  name: string;
  index: number;
  title: string;
  body: string;
  visual: ReactNode;
}) {
  return (
    <RevealItem className="relative flex flex-col pl-10 lg:pt-12 lg:pl-0">
      {/* The rail: vertical on phones, horizontal from lg */}
      <span
        aria-hidden
        className="absolute top-1 left-[0.4rem] grid size-3.5 place-items-center rounded-full border-2 border-white bg-ink shadow-[0_0_0_4px_rgb(5_12_52/0.08)] lg:top-[0.3rem] lg:left-0"
      />
      <p className="kicker text-sky-strong">
        <span className="text-muted-foreground">0{index + 1} · </span>
        {name}
      </p>
      <h3 className="mt-2 text-[1.2rem] leading-snug font-semibold tracking-[-0.02em]">
        {title}
      </h3>
      <p className="mt-2 text-[0.94rem] leading-relaxed text-muted-foreground">
        {body}
      </p>
      <div className="hidden flex-1 lg:block" />
      <div className="mt-5 rounded-2xl border border-border bg-white p-4 shadow-[0_20px_40px_-30px_rgb(5_12_52/0.4)]">
        {visual}
      </div>
    </RevealItem>
  );
}

/** Monday plan, Tuesday intervals, Thursday analysis, Sunday long run. */
export function AthleteWeek({ locale }: { locale: SupportedLocale }) {
  return (
    <div className="relative mt-14">
      <div
        aria-hidden
        className="absolute top-2 bottom-2 left-[0.8rem] w-px bg-gradient-to-b from-sky via-orchid to-coral lg:top-[0.72rem] lg:right-0 lg:bottom-auto lg:left-0 lg:h-px lg:w-auto lg:bg-gradient-to-r"
      />
      <RevealGroup
        className="grid gap-12 lg:grid-cols-4 lg:gap-7"
        stagger={0.12}
      >
        <Day
          index={0}
          name={weekday(locale, 0, 'long')}
          title={m.athletes_week_mon_title()}
          body={m.athletes_week_mon_body()}
          visual={<PlanVisual locale={locale} />}
        />
        <Day
          index={1}
          name={weekday(locale, 1, 'long')}
          title={m.athletes_week_tue_title()}
          body={m.athletes_week_tue_body()}
          visual={<WatchVisual />}
        />
        <Day
          index={2}
          name={weekday(locale, 3, 'long')}
          title={m.athletes_week_thu_title()}
          body={m.athletes_week_thu_body()}
          visual={<ReadVisual />}
        />
        <Day
          index={3}
          name={weekday(locale, 6, 'long')}
          title={m.athletes_week_sun_title()}
          body={m.athletes_week_sun_body()}
          visual={<FormVisual />}
        />
      </RevealGroup>
    </div>
  );
}
