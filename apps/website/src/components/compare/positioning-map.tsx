'use client';

import { cn } from '@/utils/shadcn';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';

export interface MapPoint {
  id: string;
  name: string;
  sub: string;
  x: number;
  y: number;
  href?: string;
  highlight?: boolean;
}

/**
 * The market on two axes: price across, openness down. Points pop in one by
 * one, OpenAthlete last, with a slow pulse.
 */
export function PositioningMap({
  points,
  axes,
}: {
  points: MapPoint[];
  axes: { open: string; closed: string; cheap: string; expensive: string };
}) {
  const reduce = useReducedMotion();
  const ordered = [...points].sort(
    (a, b) => Number(a.highlight) - Number(b.highlight),
  );
  return (
    <div className="relative">
      <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] sm:aspect-[16/10]">
        <div className="dot-grid absolute inset-0 opacity-60" />
        {/* The open and cheap corner */}
        <div className="absolute -top-24 -left-24 size-[26rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--mint)_30%,transparent),transparent)]" />
        <div className="absolute -right-24 -bottom-24 size-[26rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--coral)_18%,transparent),transparent)]" />
        {/* Axes along the left and bottom edges */}
        <div className="absolute top-9 bottom-8 left-4 w-px bg-gradient-to-b from-mint/70 via-white/15 to-coral/70 sm:left-5" />
        <div className="absolute right-4 bottom-8 left-4 h-px bg-gradient-to-r from-mint/50 via-white/15 to-coral/60 sm:right-5 sm:left-5" />
        <span className="kicker absolute top-3 left-4 text-[0.62rem] text-mint sm:left-5">
          ↑ {axes.open}
        </span>
        <span className="kicker absolute bottom-10 left-7 text-[0.62rem] text-coral sm:left-8">
          ↓ {axes.closed}
        </span>
        <span className="kicker absolute bottom-2.5 left-4 text-[0.62rem] text-white/55 sm:left-5">
          ← {axes.cheap}
        </span>
        <span className="kicker absolute right-4 bottom-2.5 text-[0.62rem] text-white/55 sm:right-5">
          {axes.expensive} →
        </span>

        {ordered.map((point, index) => {
          const flip = point.x > 0.66;
          const body = (
            <>
              <span
                className={cn(
                  'relative grid shrink-0 place-items-center rounded-full',
                  point.highlight ? 'size-4' : 'size-2.5',
                )}
              >
                {point.highlight && !reduce && (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-mint"
                    animate={{ scale: [1, 2.6], opacity: [0.6, 0] }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: 'easeOut',
                      delay: 1.4,
                    }}
                  />
                )}
                <span
                  className={cn(
                    'size-full rounded-full',
                    point.highlight
                      ? 'brand-gradient ring-2 ring-white'
                      : 'bg-white/70 ring-4 ring-white/10',
                  )}
                />
              </span>
              <span className={cn('leading-tight', flip && 'text-right')}>
                <span
                  className={cn(
                    'block whitespace-nowrap',
                    point.highlight
                      ? 'text-[0.95rem] font-semibold text-white sm:text-base'
                      : 'text-[0.74rem] font-medium text-white/85 sm:text-[0.84rem]',
                    point.href && 'group-hover:underline',
                  )}
                >
                  {point.name}
                </span>
                <span
                  className={cn(
                    'mt-0.5 block text-[0.66rem] whitespace-nowrap sm:text-[0.72rem]',
                    point.highlight
                      ? 'text-mint'
                      : 'hidden text-white/45 sm:block',
                  )}
                >
                  {point.sub}
                </span>
              </span>
            </>
          );
          const className = cn(
            'group absolute flex -translate-y-1/2 items-center gap-2',
            flip && '-translate-x-full flex-row-reverse',
          );
          return (
            <motion.div
              key={point.id}
              className={cn(className, point.highlight && 'z-10')}
              style={{
                left: `calc(1.5rem + ${point.x} * (100% - 3rem) ${flip ? '+ 0.3rem' : '- 0.3rem'})`,
                top: `calc(2.4rem + ${point.y} * (100% - 6.2rem))`,
              }}
              initial={reduce ? false : { opacity: 0, scale: 0.6 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '0px 0px -15% 0px' }}
              transition={{
                duration: 0.45,
                delay: 0.15 + index * 0.08,
                ease: [0.21, 0.65, 0.3, 1],
              }}
            >
              {point.href ? (
                <Link
                  href={point.href}
                  className={cn(
                    'flex items-center gap-2',
                    flip && 'flex-row-reverse',
                  )}
                >
                  {body}
                </Link>
              ) : (
                body
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
