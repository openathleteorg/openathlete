import { cn } from '@/utils/shadcn';
import { Lock, Mic, Sparkles } from 'lucide-react';

/** The "Read of the session" card shown on an activity. */
export function SessionRead({
  label,
  headline,
  findings,
  suggestion,
  className,
}: {
  label: string;
  headline: string;
  findings: string[];
  suggestion: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-white p-5 shadow-[0_24px_48px_-28px_rgb(5_12_52/0.35)] sm:p-6',
        className,
      )}
    >
      <p className="flex items-center gap-2 font-mono text-[0.7rem] tracking-wide text-orchid-strong uppercase">
        <Sparkles className="size-3.5" />
        {label}
      </p>
      <p className="mt-3 text-lg leading-snug font-semibold">{headline}</p>
      <ul className="mt-4 grid gap-2.5">
        {findings.map((finding, index) => (
          <li
            key={finding}
            className="flex gap-3 text-[0.92rem] leading-snug text-ink/80"
          >
            <span className="mt-0.5 font-mono text-[0.72rem] text-muted-foreground">
              0{index + 1}
            </span>
            {finding}
          </li>
        ))}
      </ul>
      <p className="mt-4 rounded-xl bg-paper px-3.5 py-2.5 text-[0.9rem] leading-snug">
        {suggestion}
      </p>
    </div>
  );
}

/** Post-activity questions with suggested answers and a voice option. */
export function QuestionsCard({
  question,
  choices,
  selected,
  voice,
  noted,
  className,
}: {
  question: string;
  choices: string[];
  selected: number;
  voice: string;
  noted: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-white p-5 shadow-[0_24px_48px_-28px_rgb(5_12_52/0.35)]',
        className,
      )}
    >
      <p className="text-[0.95rem] font-medium">{question}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {choices.map((choice, index) => (
          <span
            key={choice}
            className={cn(
              'rounded-full border px-3 py-1 text-[0.82rem]',
              index === selected
                ? 'border-ink bg-ink text-white'
                : 'border-border text-ink/80',
            )}
          >
            {choice}
          </span>
        ))}
        <span className="flex items-center gap-1.5 rounded-full border border-dashed border-ink/25 px-3 py-1 text-[0.82rem] text-muted-foreground">
          <Mic className="size-3.5" />
          {voice}
        </span>
      </div>
      <p className="mt-4 rounded-lg bg-coral/10 px-3 py-2 font-mono text-[0.72rem] text-coral-strong">
        {noted}
      </p>
    </div>
  );
}

export interface ModelRow {
  feature: string;
  model: string;
  inherited?: boolean;
}

/** Settings › AI, drawn in code: one model per feature, a usage meter. */
export function ModelPanel({
  title,
  rows,
  keyLabel,
  usageLabel,
  usageOwn,
  usageIncluded,
}: {
  title: string;
  rows: ModelRow[];
  keyLabel: string;
  usageLabel: string;
  usageOwn: string;
  usageIncluded: string;
}) {
  return (
    <div className="shot">
      <div className="flex items-center justify-between border-b border-border bg-paper px-5 py-3">
        <p className="text-[0.9rem] font-semibold">{title}</p>
        <span className="flex items-center gap-1.5 font-mono text-[0.7rem] text-muted-foreground">
          <Lock className="size-3.5" />
          {keyLabel}
        </span>
      </div>
      <ul className="divide-y divide-border">
        {rows.map((row) => (
          <li
            key={row.feature}
            className="flex items-center justify-between gap-4 px-5 py-3"
          >
            <span className="text-[0.88rem]">{row.feature}</span>
            <span
              className={cn(
                'shrink-0 rounded-md border px-2.5 py-1 font-mono text-[0.72rem]',
                row.inherited
                  ? 'border-dashed border-border text-muted-foreground'
                  : 'border-border bg-white',
              )}
            >
              {row.model}
            </span>
          </li>
        ))}
      </ul>
      <div className="border-t border-border px-5 py-4">
        <p className="font-mono text-[0.68rem] tracking-wide text-muted-foreground uppercase">
          {usageLabel}
        </p>
        <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-secondary">
          <div className="bg-sky" style={{ width: '62%' }} />
          <div className="bg-orchid" style={{ width: '14%' }} />
        </div>
        <div className="mt-2 flex gap-4 text-[0.75rem] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-sky" />
            {usageOwn}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-orchid" />
            {usageIncluded}
          </span>
        </div>
      </div>
    </div>
  );
}
