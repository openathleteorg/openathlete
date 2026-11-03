import { SectionHeading } from '@/components/site/layout-primitives';
import { Reveal } from '@/components/site/reveal';
import {
  ATHLETE_PRICING,
  PRICES_CHECKED_ON,
  formatPrice,
} from '@/content/pricing';
import { m } from '@/paraglide/messages';
import {
  DATE_LOCALES,
  type SupportedLocale,
  formatLongDate,
} from '@/utils/locales';
import { cn } from '@/utils/shadcn';

type AthleteVendor = (typeof ATHLETE_PRICING)[number]['id'];

/** Where each price was read, on PRICES_CHECKED_ON. */
const SOURCES: Partial<Record<AthleteVendor, string>> = {
  'intervals-icu': 'https://intervals.icu/',
  strava: 'https://www.strava.com/subscribe',
  nolio: 'https://www.nolio.io/en/pricing',
  runna: 'https://www.runna.com/pricing',
  trainingpeaks: 'https://www.trainingpeaks.com/pricing/',
};

function note(id: AthleteVendor): string {
  switch (id) {
    case 'openathlete':
      return m.pricing_page_athletes_note_openathlete();
    case 'intervals-icu':
      return m.pricing_page_athletes_note_intervals();
    case 'strava':
      return m.pricing_page_athletes_note_strava();
    case 'nolio':
      return m.pricing_page_athletes_note_nolio();
    case 'runna':
      return m.pricing_page_athletes_note_runna();
    case 'trainingpeaks':
      return m.pricing_page_athletes_note_tp();
  }
}

/** What a self-coached athlete pays per year for each platform's paid tier. */
export function AthletePrices({
  locale,
  heading = true,
  className,
}: {
  locale: SupportedLocale;
  heading?: boolean;
  className?: string;
}) {
  const intl = DATE_LOCALES[locale];
  const max = Math.max(...ATHLETE_PRICING.map((row) => row.yearly));
  const sourced = ATHLETE_PRICING.filter((row) => SOURCES[row.id]);

  return (
    <div className={className}>
      {heading && (
        <SectionHeading
          kicker={m.pricing_page_athletes_kicker()}
          title={m.pricing_page_athletes_title()}
          lead={m.pricing_page_athletes_lead()}
          size="side"
        />
      )}
      <Reveal
        className={cn(
          'rounded-3xl border border-border bg-white p-5 shadow-[0_30px_60px_-40px_rgb(5_12_52/0.45)] sm:p-7',
          heading && 'mt-10',
        )}
      >
        <ul className="grid gap-5">
          {ATHLETE_PRICING.map((row) => {
            const ours = row.id === 'openathlete';
            return (
              <li key={row.id}>
                <div className="flex items-baseline justify-between gap-4">
                  <p className={cn('font-medium', ours && 'font-semibold')}>
                    {row.name}
                  </p>
                  <p
                    className={cn(
                      'text-lg font-medium tabular-nums',
                      ours && 'text-2xl font-semibold text-mint-strong',
                    )}
                  >
                    {formatPrice(row.yearly, row.currency, intl)}
                  </p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                  {ours ? (
                    <div className="h-full w-1.5 rounded-full bg-mint-strong" />
                  ) : (
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-coral to-coral-strong"
                      style={{ width: `${(row.yearly / max) * 100}%` }}
                    />
                  )}
                </div>
                <p className="mt-1.5 text-[0.78rem] text-muted-foreground">
                  {note(row.id)}
                </p>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 text-[0.75rem] leading-relaxed text-muted-foreground">
          {m.cost_footnote({ date: formatLongDate(PRICES_CHECKED_ON, locale) })}{' '}
          {m.cost_sources()}:{' '}
          {sourced.map((row, index) => (
            <span key={row.id}>
              <a
                href={SOURCES[row.id]}
                target="_blank"
                rel="noopener nofollow"
                className="underline underline-offset-2 hover:no-underline"
              >
                {row.name}
              </a>
              {index < sourced.length - 1 ? ', ' : '.'}
            </span>
          ))}
        </p>
      </Reveal>
    </div>
  );
}
