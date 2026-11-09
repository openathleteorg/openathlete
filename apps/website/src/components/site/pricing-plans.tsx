'use client';

import {
  BUY_ME_A_COFFEE_URL,
  SELF_HOSTING_DOCS_URL,
  SUPPORTER_MONTHLY_EUR,
  SUPPORTER_YEARLY_EUR,
} from '@/config';
import { formatPrice } from '@/content/pricing';
import { useLocale, useMessageLocale } from '@/i18n/client';
import { signupUrl, supporterUrl } from '@/lib/links';
import { m } from '@/paraglide/messages';
import { track } from '@/utils/analytics';
import { DATE_LOCALES } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Heart } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { buttonStyles } from './button';
import { CoffeeIcon } from './icons';
import { TrackedLink } from './tracked-link';

type Period = 'monthly' | 'yearly';

function Feature({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2.5 text-[0.92rem]">
      <Check className="mt-0.5 size-4 shrink-0 text-mint-strong" />
      <span>{children}</span>
    </li>
  );
}

function Price({ amount, suffix }: { amount: string; suffix: string }) {
  return (
    <p className="mt-6 flex items-baseline gap-1.5">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={amount}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="text-5xl font-semibold tracking-[-0.04em]"
        >
          {amount}
        </motion.span>
      </AnimatePresence>
      <span className="text-sm text-muted-foreground">{suffix}</span>
    </p>
  );
}

export function PricingPlans({
  placement,
  showCoffee = true,
}: {
  placement: string;
  showCoffee?: boolean;
}) {
  const ml = useMessageLocale();
  const locale = useLocale();
  const intl = DATE_LOCALES[locale];
  const [period, setPeriod] = useState<Period>('yearly');

  const choose = (next: Period) => {
    setPeriod(next);
    track('pricing_period_changed', { period: next, placement });
  };

  const supporterAmount =
    period === 'yearly'
      ? formatPrice(SUPPORTER_YEARLY_EUR, 'EUR', intl)
      : formatPrice(SUPPORTER_MONTHLY_EUR, 'EUR', intl);

  return (
    <div>
      <div className="flex justify-center">
        <div
          role="radiogroup"
          className="inline-flex items-center rounded-full border border-border bg-white p-1 shadow-[0_1px_2px_rgb(5_12_52/0.05)]"
        >
          {(['monthly', 'yearly'] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={period === option}
              onClick={() => choose(option)}
              className={cn(
                'relative flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors',
                period === option ? 'text-white' : 'text-ink/70 hover:text-ink',
              )}
            >
              {period === option && (
                <motion.span
                  layoutId={`period-${placement}`}
                  className="absolute inset-0 rounded-full bg-ink"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">
                {option === 'monthly'
                  ? m.plans_monthly({}, { locale: ml })
                  : m.plans_yearly({}, { locale: ml })}
              </span>
              {option === 'yearly' && (
                <span
                  className={cn(
                    'relative rounded-full px-1.5 py-px text-[0.68rem]',
                    period === 'yearly'
                      ? 'bg-mint text-ink'
                      : 'bg-mint/25 text-mint-strong',
                  )}
                >
                  {m.plans_yearly_save({}, { locale: ml })}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid items-stretch gap-5 lg:grid-cols-3">
        <article className="flex flex-col rounded-3xl border border-border bg-white p-7">
          <h3 className="text-lg font-semibold">
            {m.plans_free_name({}, { locale: ml })}
          </h3>
          <p className="mt-1 text-[0.92rem] text-muted-foreground">
            {m.plans_free_pitch({}, { locale: ml })}
          </p>
          <Price
            amount={formatPrice(0, 'EUR', intl)}
            suffix={m.plans_forever({}, { locale: ml })}
          />
          <ul className="mt-7 grid gap-3">
            <Feature>{m.plans_free_1({}, { locale: ml })}</Feature>
            <Feature>{m.plans_free_2({}, { locale: ml })}</Feature>
            <Feature>{m.plans_free_3({}, { locale: ml })}</Feature>
            <Feature>{m.plans_free_4({}, { locale: ml })}</Feature>
          </ul>
          <div className="flex-1" />
          <TrackedLink
            href={signupUrl(`${placement}_plan_free`)}
            event="cta_clicked"
            properties={{ placement, cta: 'signup', plan: 'free' }}
            className={buttonStyles({
              variant: 'secondary',
              className: 'mt-8 w-full',
            })}
          >
            {m.plans_free_cta({}, { locale: ml })}
          </TrackedLink>
        </article>

        <article className="relative flex flex-col overflow-hidden rounded-3xl bg-ink p-7 text-white shadow-[0_40px_80px_-30px_rgb(5_12_52/0.7)] lg:-my-3 lg:py-10">
          <div className="brand-gradient absolute inset-x-0 top-0 h-1" />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-orchid/25 blur-3xl"
          />
          <div className="relative flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">
              {m.plans_supporter_name({}, { locale: ml })}
            </h3>
            <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[0.72rem] font-medium">
              <Heart className="size-3 fill-coral text-coral" />
              {m.plans_supporter_badge({}, { locale: ml })}
            </span>
          </div>
          <p className="relative mt-1 text-[0.92rem] text-white/65">
            {m.plans_supporter_pitch({}, { locale: ml })}
          </p>
          <Price
            amount={supporterAmount}
            suffix={
              period === 'yearly'
                ? m.plans_per_year({}, { locale: ml })
                : m.plans_per_month({}, { locale: ml })
            }
          />
          <ul className="relative mt-7 grid gap-3 [&_svg]:text-mint">
            <Feature>{m.plans_supporter_1({}, { locale: ml })}</Feature>
            <Feature>{m.plans_supporter_2({}, { locale: ml })}</Feature>
            <Feature>{m.plans_supporter_3({}, { locale: ml })}</Feature>
            <Feature>{m.plans_supporter_4({}, { locale: ml })}</Feature>
          </ul>
          <div className="flex-1" />
          <TrackedLink
            href={supporterUrl(`${placement}_plan_supporter`)}
            event="supporter_clicked"
            properties={{ placement, period }}
            className={buttonStyles({
              variant: 'light',
              className: 'relative mt-8 w-full',
            })}
          >
            {m.plans_supporter_cta({}, { locale: ml })}
          </TrackedLink>
          <p className="relative mt-3 text-center text-[0.75rem] text-white/50">
            {m.plans_supporter_vat({}, { locale: ml })}
          </p>
        </article>

        <article className="flex flex-col rounded-3xl border border-border bg-white p-7">
          <h3 className="text-lg font-semibold">
            {m.plans_selfhost_name({}, { locale: ml })}
          </h3>
          <p className="mt-1 text-[0.92rem] text-muted-foreground">
            {m.plans_selfhost_pitch({}, { locale: ml })}
          </p>
          <Price
            amount={formatPrice(0, 'EUR', intl)}
            suffix={m.plans_forever({}, { locale: ml })}
          />
          <ul className="mt-7 grid gap-3">
            <Feature>{m.plans_selfhost_1({}, { locale: ml })}</Feature>
            <Feature>{m.plans_selfhost_2({}, { locale: ml })}</Feature>
            <Feature>{m.plans_selfhost_3({}, { locale: ml })}</Feature>
            <Feature>{m.plans_selfhost_4({}, { locale: ml })}</Feature>
          </ul>
          <div className="flex-1" />
          <TrackedLink
            href={SELF_HOSTING_DOCS_URL}
            event="self_host_clicked"
            properties={{ placement }}
            className={buttonStyles({
              variant: 'secondary',
              className: 'mt-8 w-full',
            })}
          >
            {m.plans_selfhost_cta({}, { locale: ml })}
          </TrackedLink>
        </article>
      </div>

      {showCoffee && (
        <div className="mx-auto mt-10 flex max-w-2xl flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-5 text-center sm:flex-row sm:text-left">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#ffdd00]/30 text-ink">
            <CoffeeIcon className="size-5" />
          </span>
          <div className="flex-1">
            <p className="font-medium">
              {m.plans_coffee_title({}, { locale: ml })}
            </p>
            <p className="text-[0.88rem] text-muted-foreground">
              {m.plans_coffee_body({}, { locale: ml })}
            </p>
          </div>
          <TrackedLink
            href={BUY_ME_A_COFFEE_URL}
            event="donation_clicked"
            properties={{ placement }}
            className={buttonStyles({ variant: 'coffee', size: 'sm' })}
          >
            {m.plans_coffee_cta({}, { locale: ml })}
          </TrackedLink>
        </div>
      )}
    </div>
  );
}
