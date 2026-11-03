'use client';

import { cn } from '@/utils/shadcn';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowUp, X } from 'lucide-react';
import Image from 'next/image';

/**
 * The provider above, OpenAthlete below, and what travels between them:
 * activities down, planned workouts up (or a dashed, idle lane when the
 * provider's API takes none).
 */
export function SyncLink({
  name,
  logo,
  width,
  out,
  labels,
}: {
  name: string;
  logo: string;
  width: number;
  out: boolean;
  labels: { in: string; out: string; noOut: string };
}) {
  const height = 30;
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-white p-5 shadow-[0_30px_60px_-30px_rgb(5_12_52/0.35)] sm:p-7">
      <div aria-hidden className="dot-grid absolute inset-0 opacity-60" />
      <div className="relative">
        <Tile>
          <Image
            src={logo}
            alt={name}
            width={Math.round((width / 128) * height)}
            height={height}
            unoptimized
            priority
            className="w-auto"
            style={{ height }}
          />
        </Tile>
        <div className="grid h-44 grid-cols-2">
          <Lane direction="down" label={labels.in} icon={<ArrowDown />} />
          {out ? (
            <Lane direction="up" label={labels.out} icon={<ArrowUp />} />
          ) : (
            <IdleLane label={labels.noOut} />
          )}
        </div>
        <Tile>
          <Image
            src="/logo-mark.svg"
            alt=""
            width={34}
            height={24}
            unoptimized
          />
          <span className="text-lg font-semibold tracking-[-0.03em]">
            OpenAthlete
          </span>
        </Tile>
      </div>
    </div>
  );
}

function Tile({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-20 items-center justify-center gap-2.5 rounded-2xl border border-border bg-paper/80 backdrop-blur">
      {children}
    </div>
  );
}

function Lane({
  direction,
  label,
  icon,
}: {
  direction: 'up' | 'down';
  label: string;
  icon: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const color = direction === 'down' ? 'bg-sky' : 'bg-coral';
  return (
    <div className="relative flex items-center justify-center">
      <div
        className={cn(
          'absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 opacity-30',
          color,
        )}
      />
      {!reduce &&
        [0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className={cn(
              'absolute left-1/2 size-2 -translate-x-1/2 rounded-full',
              color,
            )}
            initial={{ top: direction === 'down' ? '0%' : '100%', opacity: 0 }}
            animate={{
              top: direction === 'down' ? ['0%', '100%'] : ['100%', '0%'],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              delay: i * 0.8,
              ease: 'linear',
            }}
          />
        ))}
      <span className="relative flex items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1 text-[0.74rem] font-medium whitespace-nowrap sm:px-3 sm:text-[0.78rem] shadow-[0_1px_2px_rgb(5_12_52/0.06)] [&_svg]:size-3.5">
        <span
          className={
            direction === 'down' ? 'text-sky-strong' : 'text-coral-strong'
          }
        >
          {icon}
        </span>
        {label}
      </span>
    </div>
  );
}

function IdleLane({ label }: { label: string }) {
  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute inset-y-0 left-1/2 border-l-2 border-dashed border-border" />
      <span className="relative flex items-center gap-1.5 rounded-full border border-dashed border-border bg-white px-2.5 py-1 text-[0.74rem] whitespace-nowrap sm:px-3 sm:text-[0.78rem] text-muted-foreground">
        <X className="size-3.5" />
        {label}
      </span>
    </div>
  );
}
