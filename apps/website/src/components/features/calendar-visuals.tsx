import { cn } from '@/utils/shadcn';
import { Flag, StickyNote, Thermometer } from 'lucide-react';

import { ZONE_COLORS } from './zone-colors';

const COMPLIANCE = {
  ok: '#12a594',
  close: '#f2b13c',
  off: '#f4743b',
  missed: '#e5484d',
} as const;

type Compliance = keyof typeof COMPLIANCE;

type Card =
  | {
      kind: 'session';
      title: string;
      meta: string;
      profile: number[];
      status?: Compliance;
      planned?: boolean;
    }
  | { kind: 'race'; title: string; meta: string }
  | { kind: 'note'; title: string };

export interface WeekLabels {
  days: string[];
  sessions: {
    threshold: string;
    easy: string;
    hills: string;
    long: string;
    race: string;
    rest: string;
    moved: string;
  };
  illness: string;
  summary: string;
  done: string;
  planned: string;
  load: string;
  form: string;
  legend: { ok: string; close: string; off: string; missed: string };
}

/**
 * One week drawn in code: done sessions with their compliance strip, a
 * fever across two days, a race on Sunday and the week summary on the side.
 */
export function WeekGrid({ labels }: { labels: WeekLabels }) {
  const s = labels.sessions;
  const days: Card[][] = [
    [{ kind: 'note', title: s.rest }],
    [
      {
        kind: 'session',
        title: s.threshold,
        meta: '1:05 · 12.4 km',
        profile: [1, 1, 4, 0, 4, 0, 4, 0, 4, 0, 4, 1],
        status: 'ok',
      },
    ],
    [
      {
        kind: 'session',
        title: s.easy,
        meta: '0:32 · 5.9 km',
        profile: [1, 1, 1, 1],
        status: 'close',
      },
    ],
    [
      {
        kind: 'session',
        title: s.hills,
        meta: '0:55',
        profile: [1, 5, 0, 5, 0, 5, 0, 5, 1],
        status: 'missed',
      },
    ],
    [],
    [
      {
        kind: 'session',
        title: s.long,
        meta: '1:20 · ' + s.moved,
        profile: [1, 1, 2, 2, 2, 1],
        planned: true,
      },
    ],
    [{ kind: 'race', title: s.race, meta: '10 km · B' }],
  ];

  return (
    <div className="shot p-3 sm:p-4">
      <div className="-mx-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
        <div className="grid min-w-[40rem] grid-cols-[repeat(7,minmax(0,1fr))] gap-1.5 sm:gap-2 lg:grid-cols-[repeat(7,minmax(0,1fr))_9.5rem]">
          {labels.days.map((day, index) => (
            <p
              key={day}
              className="pb-1 text-center font-mono text-[0.62rem] tracking-wide text-muted-foreground uppercase"
            >
              {day}
              <span className="ml-1 text-ink/70">{index + 10}</span>
            </p>
          ))}
          <p className="hidden pb-1 text-center font-mono text-[0.62rem] tracking-wide text-muted-foreground uppercase lg:block">
            {labels.summary}
          </p>

          {days.map((cards, index) => (
            <div
              key={index}
              className={cn(
                'relative flex min-h-36 flex-col gap-1.5 rounded-lg border border-border bg-paper/60 p-1 sm:p-1.5',
              )}
            >
              {(index === 3 || index === 4) && (
                <div
                  aria-hidden
                  className="absolute inset-0 rounded-lg opacity-70"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(-45deg, rgb(226 88 42 / 0.10) 0 6px, transparent 6px 12px)',
                  }}
                />
              )}
              {index === 3 && (
                <span className="relative flex w-max items-center gap-1 rounded-md bg-coral/20 px-1.5 py-0.5 text-[0.6rem] font-medium text-coral-strong sm:text-[0.66rem]">
                  <Thermometer className="size-3" />
                  <span className="hidden sm:inline">{labels.illness}</span>
                </span>
              )}
              {cards.map((card) => (
                <DayCard key={card.title} card={card} />
              ))}
            </div>
          ))}

          <div className="col-span-7 mt-1 grid grid-cols-3 gap-2 rounded-lg border border-border bg-white p-3 lg:col-span-1 lg:mt-0 lg:flex lg:flex-col lg:gap-3">
            <Stat
              label={labels.done}
              value="3:32"
              sub={`/ 5:47 ${labels.planned}`}
              bar={61}
            />
            <Stat label={labels.load} value="241" sub="/ 410 TRIMP" bar={59} />
            <div>
              <p className="font-mono text-[0.6rem] tracking-wide text-muted-foreground uppercase">
                {labels.form}
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-mint-strong">
                +6
              </p>
            </div>
          </div>
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 px-1 text-[0.7rem] text-muted-foreground">
        {(Object.keys(COMPLIANCE) as Compliance[]).map((key) => (
          <li key={key} className="flex items-center gap-1.5">
            <span
              className="h-2 w-3 rounded-sm"
              style={{ background: COMPLIANCE[key] }}
            />
            {labels.legend[key]}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  bar,
}: {
  label: string;
  value: string;
  sub: string;
  bar: number;
}) {
  return (
    <div>
      <p className="font-mono text-[0.6rem] tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">
        {value}
        <span className="ml-1 text-[0.7rem] font-normal text-muted-foreground">
          {sub}
        </span>
      </p>
      <div className="mt-1 h-1.5 rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-sky"
          style={{ width: `${bar}%` }}
        />
      </div>
    </div>
  );
}

function DayCard({ card }: { card: Card }) {
  if (card.kind === 'note') {
    return (
      <div className="relative flex items-center gap-1 rounded-md border border-border bg-white px-1.5 py-1 text-[0.62rem] text-muted-foreground sm:text-[0.7rem]">
        <StickyNote className="size-3 shrink-0" />
        <span className="truncate">{card.title}</span>
      </div>
    );
  }
  if (card.kind === 'race') {
    return (
      <div className="relative rounded-md border border-coral/40 bg-coral/10 px-1.5 py-1.5">
        <p className="flex items-center gap-1 text-[0.62rem] font-semibold text-coral-strong sm:text-[0.72rem]">
          <Flag className="size-3 shrink-0" />
          <span className="truncate">{card.title}</span>
        </p>
        <p className="mt-0.5 hidden font-mono text-[0.6rem] text-coral-strong/80 sm:block">
          {card.meta}
        </p>
      </div>
    );
  }
  const max = 5;
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md border bg-white',
        card.planned ? 'border-dashed border-ink/25' : 'border-border',
      )}
    >
      {card.status && (
        <span
          className="absolute inset-y-0 left-0 w-[3px]"
          style={{ background: COMPLIANCE[card.status] }}
        />
      )}
      <div className="py-1.5 pr-1 pl-2">
        <p className="truncate text-[0.62rem] leading-tight font-semibold sm:text-[0.72rem]">
          {card.title}
        </p>
        <p className="mt-0.5 hidden truncate font-mono text-[0.58rem] text-muted-foreground sm:block">
          {card.meta}
        </p>
        <div className="mt-1.5 flex h-5 items-end gap-px">
          {card.profile.map((zone, index) => (
            <span
              key={index}
              className="flex-1 rounded-t-[2px]"
              style={{
                height: `${25 + (zone / max) * 75}%`,
                background: ZONE_COLORS[zone],
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export interface SeasonLabels {
  phases: { base: string; recovery: string; specific: string; taper: string };
  raceA: string;
  raceB: string;
  week: string;
  load: string;
}

/**
 * Sixteen weeks of a season: training blocks as coloured bands, weekly load
 * as bars (every fourth week easier), two races with their priority.
 */
export function SeasonStrip({ labels }: { labels: SeasonLabels }) {
  const weeks = Array.from({ length: 16 }, (_, i) => {
    const recovery = i === 3 || i === 7 || i === 11;
    const taper = i >= 14;
    let load = 300 + i * 22;
    if (recovery) load *= 0.65;
    if (taper) load *= i === 15 ? 0.4 : 0.6;
    return Math.round(load);
  });
  const max = Math.max(...weeks);
  const phases = [
    { label: labels.phases.base, from: 0, to: 7, color: 'var(--sky)' },
    { label: labels.phases.recovery, from: 7, to: 8, color: 'var(--orchid)' },
    { label: labels.phases.specific, from: 8, to: 14, color: 'var(--coral)' },
    { label: labels.phases.taper, from: 14, to: 16, color: 'var(--mint)' },
  ];
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
      <div className="relative grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1">
        {phases.map((phase) => (
          <div
            key={phase.label}
            className="truncate rounded-md px-1.5 py-1 text-[0.62rem] font-medium text-ink sm:text-[0.72rem]"
            style={{
              gridColumn: `${phase.from + 1} / ${phase.to + 1}`,
              background: phase.color,
            }}
          >
            {phase.label}
          </div>
        ))}
      </div>
      <div className="mt-4 grid h-40 grid-cols-[repeat(16,minmax(0,1fr))] items-end gap-1">
        {weeks.map((load, index) => (
          <div
            key={index}
            className="relative flex h-full flex-col justify-end"
          >
            {(index === 9 || index === 15) && (
              <span
                className={cn(
                  'absolute -top-1 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded px-1 font-mono text-[0.6rem] font-semibold',
                  index === 15 ? 'bg-coral text-ink' : 'bg-white/15 text-white',
                )}
              >
                <Flag className="size-2.5" />
                {index === 15 ? 'A' : 'B'}
              </span>
            )}
            <div
              className="rounded-t-[3px] bg-white/25"
              style={{ height: `${(load / max) * 78}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[0.62rem] text-white/45">
        <span>{labels.week} 1</span>
        <span className="hidden sm:inline">
          {labels.raceB} · {labels.week} 10
        </span>
        <span>
          {labels.raceA} · {labels.week} 16
        </span>
      </div>
      <p className="mt-3 font-mono text-[0.62rem] text-white/40">
        {labels.load}
      </p>
    </div>
  );
}

/** The calendar feed as it shows up in a phone's calendar app. */
export function FeedCard({
  url,
  events,
}: {
  url: string;
  events: Array<{ day: string; title: string; detail: string }>;
}) {
  return (
    <div className="shot max-w-md">
      <div className="border-b border-border bg-paper px-4 py-3 font-mono text-[0.68rem] break-all text-muted-foreground">
        {url}
      </div>
      <ul className="divide-y divide-border">
        {events.map((event) => (
          <li key={event.title} className="flex gap-4 px-4 py-3">
            <span className="w-10 shrink-0 font-mono text-[0.7rem] text-muted-foreground uppercase">
              {event.day}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[0.9rem] font-medium">
                {event.title}
              </span>
              <span className="block truncate text-[0.78rem] text-muted-foreground">
                {event.detail}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
