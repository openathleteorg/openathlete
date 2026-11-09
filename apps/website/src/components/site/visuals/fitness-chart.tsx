'use client';

import { cn } from '@/utils/shadcn';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useMemo, useRef } from 'react';

const DAYS = 126;
const W = 640;
const H = 260;
const PAD = { top: 18, right: 14, bottom: 26, left: 14 };

/**
 * A deterministic 18-week block: three loading weeks, one easier, then a
 * taper before race day. Fitness and fatigue are the usual 42 and 7-day
 * exponentially weighted averages of the daily load, as in the app.
 */
function simulate() {
  const loads: number[] = [];
  for (let day = 0; day < DAYS; day++) {
    const week = Math.floor(day / 7);
    const weekday = day % 7;
    const recovery = week % 4 === 3;
    const taper = day >= DAYS - 12;
    let base = 55 + week * 3.2;
    if (recovery) base *= 0.62;
    if (taper) base *= 0.45;
    const pattern = [0.55, 1.15, 0.8, 1.1, 0.35, 0.85, 1.55][weekday];
    // Small, fixed jitter so the curves do not look synthetic
    const jitter = 1 + 0.1 * Math.sin(day * 2.17) * Math.cos(day * 0.73);
    loads.push(Math.max(0, base * pattern * jitter));
  }
  let ctl = 38;
  let atl = 34;
  const fitness: number[] = [];
  const fatigue: number[] = [];
  const form: number[] = [];
  for (const load of loads) {
    form.push(ctl - atl);
    ctl += (load - ctl) / 42;
    atl += (load - atl) / 7;
    fitness.push(ctl);
    fatigue.push(atl);
  }
  return { loads, fitness, fatigue, form };
}

function toPath(values: number[], min: number, max: number) {
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  return values
    .map((value, index) => {
      const x = PAD.left + (index / (values.length - 1)) * innerW;
      const y = PAD.top + innerH - ((value - min) / (max - min)) * innerH;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function FitnessChart({
  labels,
  className,
  tone = 'light',
}: {
  labels: { fitness: string; fatigue: string; form: string; race: string };
  className?: string;
  tone?: 'light' | 'dark';
}) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' });
  const reduce = useReducedMotion();
  const show = inView || reduce;

  const { loads, fitness, fatigue, form, paths } = useMemo(() => {
    const data = simulate();
    const max = Math.max(...data.fatigue) * 1.08;
    return {
      ...data,
      paths: {
        fitness: toPath(data.fitness, 0, max),
        fatigue: toPath(data.fatigue, 0, max),
      },
    };
  }, []);

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const maxLoad = Math.max(...loads);
  const barW = innerW / DAYS;
  const last = DAYS - 1;
  const finalForm = Math.round(form[last]);
  const grid = tone === 'dark' ? 'rgb(255 255 255 / 0.08)' : '#e7e9f1';
  const text = tone === 'dark' ? 'rgb(255 255 255 / 0.6)' : '#5e6684';

  return (
    <div className={cn('w-full', className)}>
      <div
        className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[0.72rem]"
        style={{ color: text }}
      >
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-[#2f7fe0]" />
          {labels.fitness}{' '}
          <b className="font-medium">{Math.round(fitness[last])}</b>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-[#d05ab4]" />
          {labels.fatigue}{' '}
          <b className="font-medium">{Math.round(fatigue[last])}</b>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-[#12a594]" />
          {labels.form}{' '}
          <b className="font-medium">
            {finalForm > 0 ? `+${finalForm}` : finalForm}
          </b>
        </span>
      </div>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={`${labels.fitness}, ${labels.fatigue}, ${labels.form}`}
      >
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + innerH * (1 - ratio)}
            y2={PAD.top + innerH * (1 - ratio)}
            stroke={grid}
            strokeDasharray="2 4"
          />
        ))}
        {loads.map((load, index) => (
          <motion.rect
            key={index}
            x={PAD.left + index * barW + barW * 0.18}
            width={barW * 0.64}
            rx={1}
            fill={tone === 'dark' ? 'rgb(255 255 255 / 0.13)' : '#e4e7f2'}
            initial={false}
            animate={{
              height: show ? (load / maxLoad) * innerH * 0.42 : 0,
              y: show
                ? PAD.top + innerH - (load / maxLoad) * innerH * 0.42
                : PAD.top + innerH,
            }}
            transition={{ duration: 0.5, delay: 0.004 * index }}
          />
        ))}
        <motion.path
          d={paths.fatigue}
          fill="none"
          stroke="#d05ab4"
          strokeWidth={1.6}
          strokeLinejoin="round"
          initial={{ pathLength: reduce ? 1 : 0 }}
          animate={{ pathLength: show ? 1 : 0 }}
          transition={{ duration: 2, ease: 'easeInOut', delay: 0.3 }}
          opacity={0.85}
        />
        <motion.path
          d={paths.fitness}
          fill="none"
          stroke="#2f7fe0"
          strokeWidth={2.6}
          strokeLinecap="round"
          initial={{ pathLength: reduce ? 1 : 0 }}
          animate={{ pathLength: show ? 1 : 0 }}
          transition={{ duration: 2.2, ease: 'easeInOut', delay: 0.2 }}
        />
        <motion.g
          initial={{ opacity: reduce ? 1 : 0 }}
          animate={{ opacity: show ? 1 : 0 }}
          transition={{ delay: 2.3, duration: 0.4 }}
        >
          <line
            x1={W - PAD.right}
            x2={W - PAD.right}
            y1={PAD.top - 6}
            y2={H - PAD.bottom}
            stroke={tone === 'dark' ? '#ff8c5c' : '#e2582a'}
            strokeDasharray="3 3"
          />
          <text
            x={W - PAD.right - 6}
            y={PAD.top + 4}
            textAnchor="end"
            className="font-mono"
            fontSize={11}
            fill={tone === 'dark' ? '#ff8c5c' : '#e2582a'}
          >
            {labels.race}
          </text>
        </motion.g>
      </svg>
    </div>
  );
}
