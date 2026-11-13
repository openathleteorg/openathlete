import { m } from '@/paraglide/messages';
import { type ParaglideLocale } from '@/utils/locales';

import {
  type PaceChart,
  buildPaceChart,
  formatDuration,
  formatNumber,
  formatPace,
  goalLabel,
  goalMinutes,
} from './chart';
import { type PaceChartDistance, type RaceId, distanceSpec } from './data';

type Options = { locale: ParaglideLocale };

/** Values every message of a chart page is filled with. */
export interface ChartValues {
  time: string;
  /** Whole minutes for goals under the hour, for "50-minute 10K"; else ''. */
  minutes: string;
  pace: string;
  mile: string;
  speed: string;
  halfway: string;
}

export function chartValues(
  chart: PaceChart,
  locale: ParaglideLocale,
): ChartValues {
  return {
    time: goalLabel(chart.slug, locale),
    minutes: String(goalMinutes(chart.slug) ?? ''),
    pace: formatPace(chart.pace),
    mile: formatPace(chart.paceMile),
    speed: formatNumber(chart.speedKmh, locale),
    halfway: formatDuration(chart.halfway.even),
  };
}

const equivalent = (chart: PaceChart, race: RaceId) =>
  formatDuration(
    chart.equivalents.find((e) => e.race === race)?.seconds ??
      chart.benchmarks.find((b) => b.race === race)?.seconds ??
      0,
  );

/**
 * The few sentences whose grammar depends on the distance. A new distance
 * adds its entry here, and TypeScript points at the gap until it does.
 */
const DISTANCE_COPY: Record<
  PaceChartDistance,
  {
    h1: (v: ChartValues, o: Options) => string;
    meta: (v: ChartValues, o: Options) => string;
    faq1: (v: ChartValues, o: Options) => string;
    faq2: (
      chart: PaceChart,
      v: ChartValues,
      o: Options,
    ) => { question: string; answer: string };
    workoutTitle: (v: ChartValues, o: Options) => string;
    workoutBody: (v: ChartValues, o: Options) => string;
  }
> = {
  marathon: {
    h1: (v, o) => m.pacechart_marathon_h1(v, o),
    meta: (v, o) => m.pacechart_marathon_meta(v, o),
    faq1: (v, o) => m.pacechart_marathon_faq1_q(v, o),
    faq2: (chart, v, o) => ({
      question: m.pacechart_marathon_faq2_q(v, o),
      answer: m.pacechart_marathon_faq2_a(
        { half: equivalent(chart, 'half'), tenk: equivalent(chart, '10k') },
        o,
      ),
    }),
    workoutTitle: (v, o) => m.pacechart_marathon_wo_title(v, o),
    workoutBody: (v, o) => m.pacechart_marathon_wo_body(v, o),
  },
  'half-marathon': {
    h1: (v, o) => m.pacechart_half_h1(v, o),
    meta: (v, o) => m.pacechart_half_meta(v, o),
    faq1: (v, o) => m.pacechart_half_faq1_q(v, o),
    faq2: (chart, v, o) => ({
      question: m.pacechart_half_faq2_q(v, o),
      answer: m.pacechart_half_faq2_a(
        { tenk: equivalent(chart, '10k'), fivek: equivalent(chart, '5k') },
        o,
      ),
    }),
    workoutTitle: (v, o) => m.pacechart_half_wo_title(v, o),
    workoutBody: (v, o) => m.pacechart_half_wo_body(v, o),
  },
  '10k': {
    // "50-minute 10K" under the hour, "1:05 10K" from the hour
    h1: (v, o) =>
      v.minutes ? m.pacechart_10k_h1_min(v, o) : m.pacechart_10k_h1(v, o),
    meta: (v, o) => m.pacechart_10k_meta(v, o),
    faq1: (v, o) => m.pacechart_10k_faq1_q(v, o),
    faq2: (chart, v, o) => ({
      question: m.pacechart_10k_faq2_q(v, o),
      answer: m.pacechart_10k_faq2_a(
        { fivek: equivalent(chart, '5k'), half: equivalent(chart, 'half') },
        o,
      ),
    }),
    workoutTitle: (v, o) => m.pacechart_10k_wo_title(v, o),
    workoutBody: (v, o) => m.pacechart_10k_wo_body(v, o),
  },
  '5k': {
    h1: (v, o) => m.pacechart_5k_h1(v, o),
    meta: (v, o) => m.pacechart_5k_meta(v, o),
    faq1: (v, o) => m.pacechart_5k_faq1_q(v, o),
    faq2: (chart, v, o) => ({
      question: m.pacechart_5k_faq2_q(v, o),
      answer: m.pacechart_5k_faq2_a(
        { tenk: equivalent(chart, '10k'), half: equivalent(chart, 'half') },
        o,
      ),
    }),
    workoutTitle: (v, o) => m.pacechart_5k_wo_title(v, o),
    workoutBody: (v, o) => m.pacechart_5k_wo_body(v, o),
  },
};

export function distanceCopy(distance: PaceChartDistance) {
  return DISTANCE_COPY[distance];
}

export function raceLabel(race: RaceId, locale: ParaglideLocale): string {
  const o = { locale };
  switch (race) {
    case '5k':
      return m.tools_common_5k({}, o);
    case '10k':
      return m.tools_common_10k({}, o);
    case 'half':
      return m.tools_common_half({}, o);
    case 'marathon':
      return m.tools_common_marathon({}, o);
  }
}

/**
 * "Half marathon" → "half marathon" inside a sentence; "10K" stays. German
 * nouns keep their capital: "Halbmarathon".
 */
export function inSentence(label: string, locale: ParaglideLocale): string {
  if (locale === 'de') return label;
  const [first, second] = label;
  return second && second === second.toLocaleLowerCase(locale)
    ? first.toLocaleLowerCase(locale) + label.slice(1)
    : label;
}

/** Title of a chart page, for the social card. */
export function paceChartTitle(
  distance: string,
  slug: string,
  locale: ParaglideLocale,
): string | undefined {
  const spec = distanceSpec(distance);
  if (!spec || !spec.goals.includes(slug)) return undefined;
  const chart = buildPaceChart(spec, slug);
  return DISTANCE_COPY[spec.slug].h1(chartValues(chart, locale), { locale });
}
