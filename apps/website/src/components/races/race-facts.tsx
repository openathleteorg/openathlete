import {
  capitalize,
  formatKm,
  formatMetres,
  formatRaceDays,
  raceText,
} from '@/lib/races/copy';
import type { Race } from '@/lib/races/types';
import { m } from '@/paraglide/messages';
import type { SupportedLocale } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import { ExternalLink } from 'lucide-react';

/** The facts card of a race page, with where each fact comes from. */
export function RaceFacts({
  race,
  locale,
}: {
  race: Race;
  locale: SupportedLocale;
}) {
  const gain =
    race.gainM !== undefined
      ? `${race.gainEstimate ? '≈ ' : ''}+${formatMetres(race.gainM, locale)} m${
          race.lossM !== undefined
            ? ` / −${formatMetres(race.lossM, locale)} m`
            : ''
        }`
      : undefined;

  const rows: {
    label: string;
    value: string;
    note?: string;
    mono?: boolean;
  }[] = [
    race.date
      ? {
          label: m.races_fact_date(),
          value: capitalize(formatRaceDays(race, locale)),
          note: raceText(race, 'period'),
        }
      : {
          label: m.races_fact_date(),
          value: m.races_fact_date_tba({ year: String(race.year) }),
          note: raceText(race, 'period'),
        },
    { label: m.races_fact_start(), value: raceText(race, 'start') },
    {
      label: m.races_fact_distance(),
      value: `${formatKm(race.distanceKm, locale)} km`,
      mono: true,
    },
    race.elevationText
      ? { label: m.races_fact_elevation(), value: raceText(race, 'elevation') }
      : gain
        ? {
            label: m.races_fact_elevation(),
            value: gain,
            mono: true,
            note: race.gainEstimate ? m.races_fact_gain_gps() : undefined,
          }
        : {
            label: m.races_fact_elevation(),
            value: m.races_fact_not_published(),
          },
    { label: m.races_fact_cutoff(), value: raceText(race, 'cutoff') },
    { label: m.races_fact_course(), value: raceText(race, 'course') },
    { label: m.races_fact_weather(), value: raceText(race, 'weather') },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_24px_48px_-32px_rgb(5_12_52/0.4)]">
      <div className="brand-gradient h-1.5" />
      <div className="flex items-baseline justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <p className="kicker text-muted-foreground">{m.races_facts_title()}</p>
        <p className="font-mono text-[0.78rem] text-muted-foreground">
          {race.year}
        </p>
      </div>
      <dl className="divide-y divide-border">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[6.5rem_1fr] gap-4 px-5 py-3.5 sm:grid-cols-[8rem_1fr] sm:px-6"
          >
            <dt className="text-[0.85rem] text-muted-foreground">
              {row.label}
            </dt>
            <dd>
              <span
                className={cn(
                  'block text-[0.95rem] leading-snug text-ink',
                  row.mono && 'font-mono font-semibold',
                )}
              >
                {row.value}
              </span>
              {row.note && (
                <span className="mt-1 block text-[0.85rem] leading-snug text-[#2b3354]">
                  {row.note}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <div className="border-t border-border bg-paper px-5 py-4 sm:px-6">
        <p className="text-[0.8rem] leading-relaxed text-muted-foreground">
          {m.races_checked()}
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
          <li>
            <a
              href={race.officialUrl}
              target="_blank"
              rel="noopener nofollow"
              className="inline-flex items-center gap-1 text-[0.85rem] font-semibold text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
            >
              {m.races_official_site()}
              <ExternalLink className="size-3" />
            </a>
          </li>
          {race.sources
            .filter((source) => source.url !== race.officialUrl)
            .map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener nofollow"
                  className="inline-flex items-center gap-1 text-[0.85rem] text-[#2b3354] underline decoration-ink/20 underline-offset-4 hover:decoration-ink"
                >
                  {source.label}
                  <ExternalLink className="size-3" />
                </a>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
