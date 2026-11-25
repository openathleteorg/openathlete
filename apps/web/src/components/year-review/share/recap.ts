import { m } from '@/paraglide/messages';
import { sportTypeLabelMap } from '@/utils/label-map/core';
import { Units, unitsFor } from '@/utils/units';

import { YearReviewDto } from '@openathlete/shared';

import { formatClock, formatNumber, formatPercent, hours } from '../format';
import { PERSONA_NAMES } from '../persona';

/** Sports shown by name in the mix; the others go together */
const MIX_SPORTS = 4;

export interface Recap {
  title: string;
  /** The athlete's first name, or the year without one */
  accent: string;
  figures: { value: string; label: string }[];
  /** Time in motion each month, as shares of the busiest one */
  months: number[];
  bestMonth: number;
  mix: { label: string; share: number }[];
  /** Signs the shared image */
  persona: string;
  attribution: string | null;
}

/** What the recap card and the shared image both show, in the same words */
export function recap(
  review: YearReviewDto,
  units: Units = unitsFor('METRIC'),
): Recap {
  const { totals, highlight, records, longestStreak } = review;
  const busiest = Math.max(...review.months.map((month) => month.movingTime));
  const top = review.sports.slice(0, MIX_SPORTS);
  const others =
    totals.movingTime - top.reduce((sum, s) => sum + s.movingTime, 0);
  const [name, accent] = PERSONA_NAMES[review.persona.kind]();

  return {
    title: review.firstName
      ? m.year_review_recap_title()
      : m.year_review_recap_title_anonymous(),
    accent: review.firstName ?? String(review.year),
    figures: [
      {
        value: formatNumber(Math.round(units.distanceValue(totals.distance))),
        label:
          units.unitSystem === 'IMPERIAL'
            ? units.distanceLabel
            : m.year_review_recap_kilometers(),
      },
      {
        value: `${formatNumber(hours(totals.movingTime))} h`,
        label: m.year_review_recap_hours(),
      },
      highlight?.kind === 'RACE'
        ? { value: formatClock(highlight.duration), label: highlight.name }
        : {
            value: formatNumber(totals.activeDays),
            label: m.year_review_recap_active_days(),
          },
      records.improved > 1
        ? {
            value: formatNumber(records.improved),
            label: m.year_review_recap_records(),
          }
        : (longestStreak?.days ?? 0) > 1
          ? {
              value: formatNumber(longestStreak!.days),
              label: m.year_review_recap_streak(),
            }
          : {
              value: formatNumber(totals.activities),
              label: m.year_review_sessions(),
            },
    ],
    months: review.months.map((month) =>
      busiest ? month.movingTime / busiest : 0,
    ),
    bestMonth: review.months.findIndex((month) => month.movingTime === busiest),
    mix: [
      ...top.map((sport) => ({
        label: sportTypeLabelMap[sport.sport],
        share: sport.movingTime / totals.movingTime,
      })),
      ...(others > 0
        ? [
            {
              label: m.year_review_recap_other_sports(),
              share: others / totals.movingTime,
            },
          ]
        : []),
    ],
    persona: `${name} ${accent}`,
    attribution: review.garminSourced ? m.garmin_attribution_insights() : null,
  };
}

/** "Running 36 %" */
export const mixLabel = ({ label, share }: Recap['mix'][number]) =>
  `${label} ${formatPercent(share)}`;
