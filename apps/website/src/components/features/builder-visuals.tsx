import { cn } from '@/utils/shadcn';
import { Check, Minus, Repeat } from 'lucide-react';
import Image from 'next/image';

import { ZONE_COLORS } from './zone-colors';

export interface StepRow {
  label: string;
  duration: string;
  target: string;
  zone: number;
}

/**
 * The step list of a structured workout, with a repeat block, as the
 * builder shows it.
 */
export function StepTree({
  title,
  meta,
  before,
  repeat,
  repeatLabel,
  after,
}: {
  title: string;
  meta: string;
  before: StepRow[];
  repeat: StepRow[];
  repeatLabel: string;
  after: StepRow[];
}) {
  return (
    <div className="shot p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3 border-b border-border pb-3">
        <p className="font-semibold">{title}</p>
        <p className="font-mono text-[0.72rem] text-muted-foreground">{meta}</p>
      </div>
      <ol className="mt-3 grid gap-2">
        {before.map((step) => (
          <Step key={step.label} step={step} />
        ))}
        <li className="rounded-xl border border-dashed border-ink/20 bg-paper/70 p-2">
          <p className="mb-2 flex items-center gap-1.5 px-1 font-mono text-[0.7rem] font-medium text-ink/70">
            <Repeat className="size-3.5" />
            {repeatLabel}
          </p>
          <ol className="grid gap-2">
            {repeat.map((step) => (
              <Step key={step.label} step={step} />
            ))}
          </ol>
        </li>
        {after.map((step) => (
          <Step key={step.label} step={step} />
        ))}
      </ol>
    </div>
  );
}

function Step({ step }: { step: StepRow }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-white py-2 pr-3 pl-2">
      <span
        className="h-8 w-1.5 shrink-0 rounded-full"
        style={{ background: ZONE_COLORS[step.zone] }}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[0.88rem] font-medium">{step.label}</span>
        <span className="block truncate font-mono text-[0.7rem] text-muted-foreground">
          {step.target}
        </span>
      </span>
      <span className="font-mono text-[0.8rem] tabular-nums">
        {step.duration}
      </span>
    </li>
  );
}

export interface DeviceRow {
  name: string;
  logo?: string;
  logoWidth?: number;
  sends: boolean;
  detail: string;
}

/** Which services receive planned workouts, and in what form. */
export function DeviceMatrix({
  rows,
  yes,
  no,
}: {
  rows: DeviceRow[];
  yes: string;
  no: string;
}) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-white">
      {rows.map((row) => (
        <li
          key={row.name}
          className={cn(
            'grid grid-cols-[6.5rem_1fr] items-center gap-x-4 gap-y-1 px-5 py-4 sm:grid-cols-[8rem_7rem_1fr] sm:px-6',
            !row.sends && 'bg-paper/60',
          )}
        >
          <span className="flex h-6 items-center">
            {row.logo ? (
              <Image
                src={row.logo}
                alt={row.name}
                width={Math.round(((row.logoWidth ?? 400) / 128) * 18)}
                height={18}
                unoptimized
                className={cn(
                  'h-[18px] w-auto',
                  !row.sends && 'opacity-50 grayscale',
                )}
              />
            ) : (
              <span className="font-medium">{row.name}</span>
            )}
          </span>
          <span
            className={cn(
              'flex w-max items-center gap-1 rounded-full px-2.5 py-1 text-[0.75rem] font-medium',
              row.sends
                ? 'bg-mint/20 text-mint-strong'
                : 'bg-secondary text-muted-foreground',
            )}
          >
            {row.sends ? (
              <Check className="size-3.5" />
            ) : (
              <Minus className="size-3.5" />
            )}
            {row.sends ? yes : no}
          </span>
          <span className="col-span-2 text-[0.88rem] leading-snug text-muted-foreground sm:col-span-1">
            {row.detail}
          </span>
        </li>
      ))}
    </ul>
  );
}
