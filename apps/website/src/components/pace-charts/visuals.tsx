import { cn } from '@/utils/shadcn';

/** The paper wristband runners print before a race, drawn in code. */
export function PaceBand({
  title,
  goal,
  note,
  rows,
  className,
}: {
  title: string;
  goal: string;
  note: string;
  rows: { label: string; time: string; strong?: boolean }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        'ink-band relative overflow-hidden rounded-[1.75rem] p-2 shadow-[0_30px_60px_-30px_rgb(5_12_52/0.6)]',
        className,
      )}
    >
      <div className="rounded-[1.4rem] border border-dashed border-white/20 px-5 py-5 sm:px-6">
        <div className="flex items-baseline justify-between gap-4">
          <p className="kicker text-ink-soft">{title}</p>
          <p className="font-mono text-[1.6rem] font-semibold tracking-[-0.02em] text-white">
            {goal}
          </p>
        </div>
        <ol className="mt-4 divide-y divide-white/10 font-mono text-[0.92rem]">
          {rows.map((row) => (
            <li
              key={row.label}
              className={cn(
                'flex items-center justify-between py-2',
                row.strong ? 'text-white' : 'text-white/75',
              )}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    row.strong ? 'bg-mint' : 'bg-sky/70',
                  )}
                />
                {row.label}
              </span>
              <span className={cn(row.strong && 'font-semibold')}>
                {row.time}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-4 font-mono text-[0.7rem] text-ink-soft">{note}</p>
      </div>
    </div>
  );
}

const STEP_STYLE = {
  warmUp: { color: '#9fd3fb', height: 34 },
  float: { color: '#9fd3fb', height: 34 },
  coolDown: { color: '#9fd3fb', height: 34 },
  goal: { color: '#f4743b', height: 82 },
} as const;

/** A session as blocks: width is time, height is intensity. */
export function WorkoutBars({
  steps,
}: {
  steps: { kind: keyof typeof STEP_STYLE; seconds: number }[];
}) {
  const total = steps.reduce((sum, step) => sum + step.seconds, 0);
  return (
    <div className="flex h-28 items-end gap-[3px]" aria-hidden>
      {steps.map((step, index) => (
        <div
          key={index}
          className="rounded-t-[5px]"
          style={{
            width: `${(step.seconds / total) * 100}%`,
            height: `${STEP_STYLE[step.kind].height}%`,
            backgroundColor: STEP_STYLE[step.kind].color,
          }}
        />
      ))}
    </div>
  );
}

/** The colour key of a step in the session list. */
export function StepDot({ kind }: { kind: keyof typeof STEP_STYLE }) {
  return (
    <span
      className="size-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: STEP_STYLE[kind].color }}
    />
  );
}

/**
 * Daniels' intensities on one speed axis, so the gap between easy and
 * repetition pace is visible at a glance.
 */
export function PaceScale({
  rows,
}: {
  rows: {
    label: string;
    description: string;
    pace: string;
    /** Speeds in m/s; a range when `from` is set. */
    from?: number;
    to: number;
    color: string;
  }[];
}) {
  const speeds = rows.flatMap((row) => [row.from ?? row.to, row.to]);
  const min = Math.min(...speeds) * 0.92;
  const max = Math.max(...speeds);
  const at = (speed: number) => ((speed - min) / (max - min)) * 100;

  return (
    <ul className="space-y-5">
      {rows.map((row) => {
        const start = row.from === undefined ? 0 : at(row.from);
        return (
          <li key={row.label}>
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-[1rem] font-semibold text-ink">{row.label}</p>
              <p className="font-mono text-[1rem] font-semibold whitespace-nowrap text-ink">
                {row.pace}
                <span className="ml-1 text-[0.75rem] font-normal text-muted-foreground">
                  /km
                </span>
              </p>
            </div>
            <div className="relative mt-2 h-2 rounded-full bg-ink/[0.06]">
              <div
                className="absolute inset-y-0 rounded-full"
                style={{
                  left: `${start}%`,
                  width: `${Math.max(at(row.to) - start, 2)}%`,
                  backgroundColor: row.color,
                }}
              />
            </div>
            <p className="mt-1.5 text-[0.88rem] leading-snug text-muted-foreground">
              {row.description}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
