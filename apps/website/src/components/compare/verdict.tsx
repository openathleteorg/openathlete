import type { Verdict } from '@/content/competitors';
import { cn } from '@/utils/shadcn';
import { Check, Minus } from 'lucide-react';

/** ✓, half disc or dash. `info` cells carry a fact and no mark. */
export function VerdictMark({
  verdict,
  label,
  className,
  tone = 'light',
}: {
  verdict: Verdict;
  /** Accessible text: the legend for this verdict. */
  label?: string;
  className?: string;
  tone?: 'light' | 'dark';
}) {
  if (verdict === 'info') return null;
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        'grid size-5 shrink-0 place-items-center rounded-full',
        verdict === 'yes' && 'bg-mint/30 text-mint-strong',
        verdict === 'partial' && 'bg-[#f2b13c]/20 text-[#a86f00]',
        verdict === 'no' &&
          (tone === 'dark'
            ? 'bg-white/10 text-white/50'
            : 'bg-secondary text-muted-foreground'),
        className,
      )}
    >
      {verdict === 'yes' && <Check className="size-3" strokeWidth={3} />}
      {verdict === 'partial' && (
        <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
          <circle
            cx="6"
            cy="6"
            r="4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path d="M6 1.5a4.5 4.5 0 0 1 0 9z" fill="currentColor" />
        </svg>
      )}
      {verdict === 'no' && <Minus className="size-3" strokeWidth={3} />}
    </span>
  );
}
