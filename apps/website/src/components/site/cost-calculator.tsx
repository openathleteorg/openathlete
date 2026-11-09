'use client';

import {
  COACH_PRICING,
  PRICES_CHECKED_ON,
  formatPrice,
  openAthleteYearly,
} from '@/content/pricing';
import { useLocale, useMessageLocale } from '@/i18n/client';
import { m } from '@/paraglide/messages';
import { track } from '@/utils/analytics';
import { DATE_LOCALES, formatLongDate } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const MIN = 1;
const MAX = 60;

export function CostCalculator({
  defaultAthletes = 15,
  placement,
  tone = 'light',
}: {
  defaultAthletes?: number;
  placement: string;
  tone?: 'light' | 'dark';
}) {
  const ml = useMessageLocale();
  const locale = useLocale();
  const intl = DATE_LOCALES[locale];
  // Derived from the placement: useId drifted between server and client here
  const id = `cost-athletes-${placement}`;
  const [athletes, setAthletes] = useState(defaultAthletes);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onChange = (value: number) => {
    setAthletes(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => track('cost_calculator_changed', { athletes: value, placement }),
      800,
    );
  };

  const notes: Record<string, string> = {
    trainingpeaks: m.cost_tp_note({}, { locale: ml }),
    nolio: m.cost_nolio_note({}, { locale: ml }),
    'final-surge': m.cost_fs_note({}, { locale: ml }),
  };
  const ours = openAthleteYearly(athletes);
  const rows = COACH_PRICING.map((vendor) => ({
    ...vendor,
    amount: vendor.yearly(athletes),
  }));
  const max = Math.max(...rows.map((row) => row.amount), 1);
  const dark = tone === 'dark';

  return (
    <div
      className={cn(
        'rounded-3xl border p-6 sm:p-8',
        dark
          ? 'border-white/10 bg-white/[0.04]'
          : 'border-border bg-white shadow-[0_30px_60px_-40px_rgb(5_12_52/0.45)]',
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label
          htmlFor={id}
          className={cn(
            'text-sm font-medium',
            dark ? 'text-white/70' : 'text-muted-foreground',
          )}
        >
          {m.cost_athletes_label({}, { locale: ml })}
        </label>
        <output
          htmlFor={id}
          className="text-4xl font-semibold tracking-[-0.03em] tabular-nums"
        >
          {athletes}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={MIN}
        max={MAX}
        value={athletes}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          'mt-4 h-2 w-full cursor-pointer appearance-none rounded-full',
          '[&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-ink [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgb(5_12_52/0.35)]',
          '[&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-ink',
        )}
        style={{
          background: `linear-gradient(90deg, var(--sky) 0%, var(--orchid) ${((athletes - MIN) / (MAX - MIN)) * 100}%, ${dark ? 'rgb(255 255 255 / 0.12)' : '#e7e9f1'} ${((athletes - MIN) / (MAX - MIN)) * 100}%)`,
        }}
      />

      <div
        className={cn(
          'mt-8 flex items-center justify-between gap-4 rounded-2xl p-4',
          dark ? 'bg-white/[0.06]' : 'bg-paper',
        )}
      >
        <div>
          <p className="font-semibold">OpenAthlete</p>
          <p
            className={cn(
              'text-[0.82rem]',
              dark ? 'text-white/60' : 'text-muted-foreground',
            )}
          >
            {ours === 0
              ? m.cost_free_label({}, { locale: ml })
              : m.cost_supporter_label({}, { locale: ml })}
          </p>
        </div>
        <p className="text-right">
          <span className="text-3xl font-semibold tracking-[-0.03em] text-mint-strong tabular-nums">
            {formatPrice(ours, 'EUR', intl)}
          </span>
          <span
            className={cn(
              'block text-[0.75rem]',
              dark ? 'text-white/50' : 'text-muted-foreground',
            )}
          >
            {m.cost_per_year({}, { locale: ml })}
          </span>
        </p>
      </div>

      <ul className="mt-5 grid gap-5">
        {rows.map((row) => (
          <li key={row.id}>
            <div className="flex items-baseline justify-between gap-4">
              <p className="font-medium">{row.name}</p>
              <p className="text-lg font-medium tabular-nums">
                {formatPrice(row.amount, row.currency, intl)}
              </p>
            </div>
            <div
              className={cn(
                'mt-2 h-2 overflow-hidden rounded-full',
                dark ? 'bg-white/10' : 'bg-secondary',
              )}
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-coral to-coral-strong"
                initial={false}
                animate={{ width: `${(row.amount / max) * 100}%` }}
                transition={{ type: 'spring', stiffness: 140, damping: 22 }}
              />
            </div>
            <p
              className={cn(
                'mt-1.5 text-[0.78rem]',
                dark ? 'text-white/50' : 'text-muted-foreground',
              )}
            >
              {notes[row.id]}
            </p>
          </li>
        ))}
      </ul>

      <p
        className={cn(
          'mt-6 text-[0.75rem] leading-relaxed',
          dark ? 'text-white/45' : 'text-muted-foreground',
        )}
      >
        {m.cost_footnote(
          { date: formatLongDate(PRICES_CHECKED_ON, locale) },
          { locale: ml },
        )}{' '}
        {m.cost_sources({}, { locale: ml })}:{' '}
        {COACH_PRICING.map((vendor, index) => (
          <span key={vendor.id}>
            <a
              href={vendor.source}
              target="_blank"
              rel="noopener nofollow"
              className="underline underline-offset-2 hover:no-underline"
            >
              {vendor.name}
            </a>
            {index < COACH_PRICING.length - 1 ? ', ' : '.'}
          </span>
        ))}
      </p>
    </div>
  );
}
