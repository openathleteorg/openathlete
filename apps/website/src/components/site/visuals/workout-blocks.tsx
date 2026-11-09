'use client';

import { cn } from '@/utils/shadcn';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Check, Watch } from 'lucide-react';
import { useRef } from 'react';

/** Zone colours, from easy to hard, as in the app's workout editor. */
const ZONES = [
  '#9fd3fb',
  '#6ec1fc',
  '#12a594',
  '#f2b13c',
  '#f4743b',
  '#e2582a',
];

type Step = { minutes: number; zone: number };

/** 15' warm-up, 5 × (4' Z4 / 2' Z1), 6' tempo, 14' cool-down: 1h05. */
const STEPS: Step[] = [
  { minutes: 15, zone: 1 },
  ...Array.from({ length: 5 }, () => [
    { minutes: 4, zone: 4 },
    { minutes: 2, zone: 0 },
  ]).flat(),
  { minutes: 6, zone: 3 },
  { minutes: 14, zone: 1 },
];

const TOTAL = STEPS.reduce((sum, step) => sum + step.minutes, 0);

export function WorkoutBlocks({
  title,
  meta,
  sentLabel,
  className,
}: {
  title: string;
  meta: string;
  sentLabel: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' });
  const reduce = useReducedMotion();
  const show = inView || reduce;

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-border bg-white p-5 shadow-[0_24px_48px_-28px_rgb(5_12_52/0.35)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.95rem] font-semibold text-ink">{title}</p>
          <p className="mt-0.5 font-mono text-[0.72rem] text-muted-foreground">
            {meta}
          </p>
        </div>
        <motion.span
          initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : 6 }}
          animate={show ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.5, duration: 0.4 }}
          className="flex items-center gap-1.5 rounded-full bg-mint/20 px-2.5 py-1 text-[0.72rem] font-medium text-mint-strong"
        >
          <Watch className="size-3.5" />
          {sentLabel}
          <Check className="size-3.5" />
        </motion.span>
      </div>
      <div className="mt-5 flex h-28 items-end gap-[3px]">
        {STEPS.map((step, index) => (
          <motion.div
            key={index}
            className="rounded-t-[4px]"
            style={{
              width: `${(step.minutes / TOTAL) * 100}%`,
              backgroundColor: ZONES[step.zone],
              transformOrigin: 'bottom',
            }}
            initial={{
              height: `${18 + step.zone * 16}%`,
              scaleY: reduce ? 1 : 0,
            }}
            animate={show ? { scaleY: 1 } : {}}
            transition={{
              delay: 0.05 * index,
              duration: 0.5,
              ease: [0.21, 0.65, 0.3, 1],
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[0.68rem] text-muted-foreground">
        <span>0:00</span>
        <span>
          {Math.floor(TOTAL / 60)}:{String(TOTAL % 60).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
