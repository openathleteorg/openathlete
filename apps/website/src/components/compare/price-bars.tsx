'use client';

import { cn } from '@/utils/shadcn';
import { motion, useReducedMotion } from 'framer-motion';

export interface PriceBar {
  id: string;
  label: string;
  sub: string;
  /** Formatted price, in the vendor's currency. */
  display: string;
  /** Rough euro value, only for the bar length. */
  value: number;
  ours?: boolean;
}

/** Yearly prices as bars that grow when they scroll into view. */
export function PriceBars({
  bars,
  perYear,
}: {
  bars: PriceBar[];
  perYear: string;
}) {
  const reduce = useReducedMotion();
  const max = Math.max(...bars.map((bar) => bar.value), 1);
  return (
    <ul className="grid gap-5">
      {bars.map((bar, index) => (
        <li key={bar.id}>
          <div className="flex items-baseline justify-between gap-4">
            <p className="min-w-0">
              <span className="font-medium">{bar.label}</span>
              <span className="mt-0.5 block text-[0.8rem] text-muted-foreground">
                {bar.sub}
              </span>
            </p>
            <p
              className={cn(
                'shrink-0 text-right font-semibold tabular-nums',
                bar.ours ? 'text-2xl text-mint-strong' : 'text-lg',
              )}
            >
              {bar.display}
              <span className="ml-1 text-[0.72rem] font-normal text-muted-foreground">
                {perYear}
              </span>
            </p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
            <motion.div
              className={cn(
                'h-full rounded-full',
                bar.ours
                  ? 'bg-mint-strong'
                  : 'bg-gradient-to-r from-coral/70 to-coral-strong',
              )}
              initial={reduce ? false : { width: 0 }}
              whileInView={{
                width: `${Math.max((bar.value / max) * 100, bar.value > 0 ? 2 : 0.8)}%`,
              }}
              viewport={{ once: true }}
              transition={{
                duration: 0.9,
                delay: 0.1 + index * 0.08,
                ease: [0.21, 0.65, 0.3, 1],
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
