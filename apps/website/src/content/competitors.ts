/**
 * The platforms with an "OpenAthlete vs" page, and what the pages say about
 * them. Every claim about a competitor points to the page it was read on, on
 * COMPARISONS_CHECKED_ON. A claim we could not verify has no row: better a
 * shorter table than a wrong one.
 *
 * Texts live in the message catalogs:
 * - row label: `compare_row_<topic>`
 * - competitor cell: `compare_<prefix>_row_<topic>`, or "Yes"/"No" when absent
 * - OpenAthlete cell: `compare_<prefix>_oa_<topic>`, else `compare_oa_<topic>`
 */
import { ATHLETE_PRICING, COACH_PRICING, PRICES_CHECKED_ON } from './pricing';

export const COMPARISONS_CHECKED_ON = PRICES_CHECKED_ON;

/** yes / partly / no ("—": not offered or not listed), info: a fact, no mark. */
export type Verdict = 'yes' | 'partial' | 'no' | 'info';

export type RowTopic =
  | 'owner'
  | 'purpose'
  | 'open_source'
  | 'self_host'
  | 'athlete_price'
  | 'workout_sync'
  | 'coach_price'
  | 'per_athlete_fee'
  | 'setup_fee'
  | 'coaching'
  | 'extra_coach'
  | 'club_plans'
  | 'schools'
  | 'plans'
  | 'human_coach'
  | 'ai'
  | 'load'
  | 'analysis'
  | 'api'
  | 'integrations'
  | 'mobile_apps'
  | 'marketplace'
  | 'indoor'
  | 'exercise_videos'
  | 'federation'
  | 'sports'
  | 'social'
  | 'languages';

export interface Source {
  label: string;
  url: string;
}

export interface ComparisonRow {
  topic: RowTopic;
  them: Verdict;
  oa: Verdict;
  /** Keys of the competitor's `sources`. */
  sources?: readonly string[];
}

export interface Competitor {
  slug: string;
  name: string;
  /** Message key prefix: `compare_<prefix>_…`. */
  prefix: string;
  /** Coaches compare coach plans; athletes compare yearly subscriptions. */
  audience: 'coach' | 'athlete';
  sources: Record<string, Source>;
  rows: readonly ComparisonRow[];
  betterOa: number;
  betterThem: number;
  faqs: number;
}

const OA_GITHUB: Source = {
  label: 'github.com/openathleteorg/openathlete',
  url: 'https://github.com/openathleteorg/openathlete',
};

const OPEN_ROWS: ComparisonRow[] = [
  { topic: 'open_source', them: 'no', oa: 'yes', sources: ['oa'] },
  { topic: 'self_host', them: 'no', oa: 'yes', sources: ['oa'] },
];

export const GARMIN_PRESS_RELEASE =
  'https://www.garmin.com/en-US/newsroom/press-release/corporate/garmin-acquires-trainingpeaks-and-trainheroic-leading-endurance-and-strength-training-platforms-for-athletes-and-coaches/';

const STRAVA_SUBSCRIBE: Source = {
  label: 'strava.com/subscribe',
  url: 'https://www.strava.com/subscribe',
};
const RUNNA_ACQUISITION: Source = {
  label: 'techbriefly.com, Apr 17, 2025',
  url: 'https://techbriefly.com/2025/04/17/strava-acquires-runna-app-expanding-training-features/',
};

/** In menu order: the footer lists them like this. */
export const COMPETITORS = [
  {
    slug: 'trainingpeaks',
    name: 'TrainingPeaks',
    prefix: 'tp',
    audience: 'coach',
    sources: {
      pricing: {
        label: 'trainingpeaks.com/pricing',
        url: 'https://www.trainingpeaks.com/pricing/',
      },
      coach: {
        label: 'trainingpeaks.com/pricing/for-coaches',
        url: 'https://www.trainingpeaks.com/pricing/for-coaches/',
      },
      garmin: {
        label: 'Garmin press release, Jul 22, 2026',
        url: GARMIN_PRESS_RELEASE,
      },
      oa: OA_GITHUB,
    },
    rows: [
      { topic: 'owner', them: 'info', oa: 'info', sources: ['garmin'] },
      ...OPEN_ROWS,
      {
        topic: 'athlete_price',
        them: 'info',
        oa: 'info',
        sources: ['pricing'],
      },
      {
        topic: 'workout_sync',
        them: 'partial',
        oa: 'yes',
        sources: ['pricing'],
      },
      { topic: 'coach_price', them: 'info', oa: 'info', sources: ['coach'] },
      {
        topic: 'per_athlete_fee',
        them: 'info',
        oa: 'info',
        sources: ['coach'],
      },
      { topic: 'setup_fee', them: 'info', oa: 'info', sources: ['coach'] },
      { topic: 'ai', them: 'no', oa: 'yes', sources: ['pricing', 'coach'] },
      { topic: 'load', them: 'yes', oa: 'yes', sources: ['pricing'] },
      { topic: 'mobile_apps', them: 'yes', oa: 'partial' },
      { topic: 'marketplace', them: 'yes', oa: 'no', sources: ['pricing'] },
      { topic: 'indoor', them: 'yes', oa: 'no', sources: ['pricing'] },
    ],
    betterOa: 4,
    betterThem: 4,
    faqs: 5,
  },
  {
    slug: 'nolio',
    name: 'Nolio',
    prefix: 'nolio',
    audience: 'coach',
    sources: {
      pricing: {
        label: 'nolio.io/en/pricing',
        url: 'https://www.nolio.io/en/pricing',
      },
      home: { label: 'nolio.io/en', url: 'https://www.nolio.io/en' },
      oa: OA_GITHUB,
    },
    rows: [
      { topic: 'owner', them: 'info', oa: 'info', sources: ['home'] },
      ...OPEN_ROWS,
      {
        topic: 'athlete_price',
        them: 'info',
        oa: 'info',
        sources: ['pricing'],
      },
      { topic: 'workout_sync', them: 'yes', oa: 'yes', sources: ['pricing'] },
      { topic: 'coach_price', them: 'info', oa: 'info', sources: ['pricing'] },
      { topic: 'extra_coach', them: 'yes', oa: 'yes', sources: ['pricing'] },
      { topic: 'club_plans', them: 'yes', oa: 'no', sources: ['pricing'] },
      { topic: 'ai', them: 'no', oa: 'yes', sources: ['home', 'pricing'] },
      { topic: 'mobile_apps', them: 'yes', oa: 'partial', sources: ['home'] },
      { topic: 'exercise_videos', them: 'yes', oa: 'no', sources: ['home'] },
      { topic: 'federation', them: 'yes', oa: 'no', sources: ['home'] },
    ],
    betterOa: 4,
    betterThem: 4,
    faqs: 5,
  },
  {
    slug: 'intervals-icu',
    name: 'intervals.icu',
    prefix: 'icu',
    audience: 'athlete',
    sources: {
      home: { label: 'intervals.icu', url: 'https://intervals.icu/' },
      oa: OA_GITHUB,
    },
    rows: [
      ...OPEN_ROWS,
      { topic: 'athlete_price', them: 'info', oa: 'info', sources: ['home'] },
      { topic: 'coaching', them: 'partial', oa: 'yes', sources: ['home'] },
      { topic: 'workout_sync', them: 'yes', oa: 'yes', sources: ['home'] },
      { topic: 'load', them: 'yes', oa: 'yes', sources: ['home'] },
      { topic: 'analysis', them: 'yes', oa: 'partial', sources: ['home'] },
      { topic: 'ai', them: 'partial', oa: 'yes', sources: ['home'] },
      { topic: 'api', them: 'yes', oa: 'yes', sources: ['home'] },
      { topic: 'integrations', them: 'yes', oa: 'partial', sources: ['home'] },
      { topic: 'mobile_apps', them: 'partial', oa: 'partial' },
      { topic: 'languages', them: 'yes', oa: 'partial', sources: ['home'] },
    ],
    betterOa: 4,
    betterThem: 3,
    faqs: 5,
  },
  {
    slug: 'final-surge',
    name: 'Final Surge',
    prefix: 'fs',
    audience: 'coach',
    sources: {
      pricing: {
        label: 'finalsurge.com/pricing',
        url: 'https://www.finalsurge.com/pricing',
      },
      coros: {
        label: 'blog.finalsurge.com, COROS sync',
        url: 'https://blog.finalsurge.com/sync-planned-structured-workouts-to-coros/',
      },
      oa: OA_GITHUB,
    },
    rows: [
      ...OPEN_ROWS,
      {
        topic: 'athlete_price',
        them: 'info',
        oa: 'info',
        sources: ['pricing'],
      },
      { topic: 'coach_price', them: 'info', oa: 'info', sources: ['pricing'] },
      {
        topic: 'per_athlete_fee',
        them: 'info',
        oa: 'info',
        sources: ['pricing'],
      },
      { topic: 'workout_sync', them: 'yes', oa: 'yes', sources: ['coros'] },
      { topic: 'schools', them: 'yes', oa: 'no', sources: ['pricing'] },
      {
        topic: 'mobile_apps',
        them: 'yes',
        oa: 'partial',
        sources: ['pricing'],
      },
    ],
    betterOa: 4,
    betterThem: 2,
    faqs: 4,
  },
  {
    slug: 'runna',
    name: 'Runna',
    prefix: 'runna',
    audience: 'athlete',
    sources: {
      pricing: {
        label: 'runna.com/pricing',
        url: 'https://www.runna.com/pricing',
      },
      strava: STRAVA_SUBSCRIBE,
      acquisition: RUNNA_ACQUISITION,
      oa: OA_GITHUB,
    },
    rows: [
      { topic: 'owner', them: 'info', oa: 'info', sources: ['acquisition'] },
      ...OPEN_ROWS,
      {
        topic: 'athlete_price',
        them: 'info',
        oa: 'info',
        sources: ['pricing', 'strava'],
      },
      { topic: 'plans', them: 'yes', oa: 'partial', sources: ['pricing'] },
      { topic: 'human_coach', them: 'no', oa: 'yes', sources: ['pricing'] },
      { topic: 'workout_sync', them: 'yes', oa: 'yes', sources: ['pricing'] },
      { topic: 'sports', them: 'partial', oa: 'yes', sources: ['pricing'] },
      {
        topic: 'mobile_apps',
        them: 'yes',
        oa: 'partial',
        sources: ['pricing'],
      },
    ],
    betterOa: 4,
    betterThem: 3,
    faqs: 4,
  },
  {
    slug: 'strava',
    name: 'Strava',
    prefix: 'strava',
    audience: 'athlete',
    sources: {
      subscribe: STRAVA_SUBSCRIBE,
      acquisition: RUNNA_ACQUISITION,
      oa: OA_GITHUB,
    },
    rows: [
      { topic: 'purpose', them: 'info', oa: 'info' },
      ...OPEN_ROWS,
      {
        topic: 'athlete_price',
        them: 'info',
        oa: 'info',
        sources: ['subscribe'],
      },
      { topic: 'social', them: 'yes', oa: 'no', sources: ['subscribe'] },
      {
        topic: 'plans',
        them: 'partial',
        oa: 'yes',
        sources: ['subscribe', 'acquisition'],
      },
      { topic: 'coaching', them: 'no', oa: 'yes' },
      { topic: 'load', them: 'partial', oa: 'yes', sources: ['subscribe'] },
      { topic: 'mobile_apps', them: 'yes', oa: 'partial' },
    ],
    betterOa: 4,
    betterThem: 3,
    faqs: 4,
  },
] as const satisfies readonly Competitor[];

export type CompetitorSlug = (typeof COMPETITORS)[number]['slug'];

export function findCompetitor(slug: string): Competitor | undefined {
  return COMPETITORS.find((competitor) => competitor.slug === slug);
}

/**
 * List prices quoted in the copy, from the vendors' pages on
 * COMPARISONS_CHECKED_ON (USD before tax, EUR as shown). Coach and athlete
 * figures already in pricing.ts are read from there.
 */
const athlete = (id: (typeof ATHLETE_PRICING)[number]['id']) =>
  ATHLETE_PRICING.find((entry) => entry.id === id)!.yearly;
const coach = (id: string, athletes: number) =>
  COACH_PRICING.find((entry) => entry.id === id)!.yearly(athletes);

export type Money = readonly [amount: number, currency: 'EUR' | 'USD'];

export const QUOTED_PRICES = {
  oaMonth: [5, 'EUR'],
  oaYear: [50, 'EUR'],
  tpMonth: [19.95, 'USD'],
  tpYear: [athlete('trainingpeaks'), 'USD'],
  tpCoach: [21.99, 'USD'],
  tpCoachUnlimited: [54.99, 'USD'],
  tpPerMax: [9, 'USD'],
  tpPerMin: [4.5, 'USD'],
  tpSetup: [99, 'USD'],
  tp30: [coach('trainingpeaks', 30), 'USD'],
  nolioPremium: [6.9, 'EUR'],
  nStarter: [19.9, 'EUR'],
  nClassic: [29.9, 'EUR'],
  nPro: [39.9, 'EUR'],
  nClassicYear: [coach('nolio', 25), 'EUR'],
  nProYear: [coach('nolio', 30), 'EUR'],
  nClubStarter: [29.9, 'EUR'],
  nClubClassic: [49.9, 'EUR'],
  nExtraCoach: [12, 'EUR'],
  icuMonth: [4, 'USD'],
  icuYear: [athlete('intervals-icu'), 'USD'],
  fsStarter: [19, 'USD'],
  fsPro: [39, 'USD'],
  runnaMonth: [19.99, 'USD'],
  runnaYear: [119.99, 'USD'],
  bundle: [139.99, 'EUR'],
  stravaYear: [athlete('strava'), 'EUR'],
  stravaFamily: [99.99, 'EUR'],
  stravaStudent: [29.99, 'EUR'],
  nolioYear: [athlete('nolio'), 'EUR'],
} as const satisfies Record<string, Money>;

/** Dates in the TrainingPeaks ownership timeline. */
export const OWNERSHIP_TIMELINE = [
  {
    id: 'todays_plan',
    date: '2024-03-12',
    url: 'https://forums.zwift.com/t/todays-plan-shutting-down-march-2024/619179',
  },
  { id: 'runna', date: '2025-04-17', url: RUNNA_ACQUISITION.url },
  { id: 'garmin', date: '2026-07-22', url: GARMIN_PRESS_RELEASE },
  { id: 'today', date: null, url: OA_GITHUB.url },
] as const;

/**
 * The hub's summary table. A cell is a verdict with an optional note key
 * (`compare_hub_note_<note>`), or a price.
 */
export type HubColumn = 'openathlete' | CompetitorSlug;

export interface HubCell {
  verdict: Verdict;
  note?: string;
}

export const HUB_COLUMNS: readonly { slug: HubColumn; name: string }[] = [
  { slug: 'openathlete', name: 'OpenAthlete' },
  ...COMPETITORS.map(({ slug, name }) => ({ slug, name })),
];

const allNo = (overrides: Partial<Record<HubColumn, HubCell>>) =>
  Object.fromEntries(
    HUB_COLUMNS.map(({ slug }) => [slug, overrides[slug] ?? { verdict: 'no' }]),
  ) as Record<HubColumn, HubCell>;

export const HUB_ROWS: readonly {
  topic: string;
  cells: Record<HubColumn, HubCell>;
}[] = [
  { topic: 'open_source', cells: allNo({ openathlete: { verdict: 'yes' } }) },
  { topic: 'self_host', cells: allNo({ openathlete: { verdict: 'yes' } }) },
  {
    topic: 'athlete_free',
    cells: allNo({
      openathlete: { verdict: 'yes', note: 'every_feature' },
      trainingpeaks: { verdict: 'partial', note: 'basic_no_sync' },
      nolio: { verdict: 'yes' },
      'intervals-icu': { verdict: 'yes' },
      'final-surge': { verdict: 'yes' },
      strava: { verdict: 'yes', note: 'not_planner' },
    }),
  },
  {
    topic: 'workout_sync',
    cells: allNo({
      openathlete: { verdict: 'yes', note: 'gsc' },
      trainingpeaks: { verdict: 'partial', note: 'premium' },
      nolio: { verdict: 'yes' },
      'intervals-icu': { verdict: 'yes' },
      'final-surge': { verdict: 'yes', note: 'gc' },
      runna: { verdict: 'yes' },
    }),
  },
  {
    topic: 'coaching',
    cells: allNo({
      openathlete: { verdict: 'yes' },
      trainingpeaks: { verdict: 'yes' },
      nolio: { verdict: 'yes' },
      'intervals-icu': { verdict: 'yes' },
      'final-surge': { verdict: 'yes' },
    }),
  },
  {
    topic: 'byok',
    cells: allNo({
      openathlete: { verdict: 'yes' },
      'intervals-icu': { verdict: 'partial', note: 'connector' },
    }),
  },
  {
    topic: 'mobile_apps',
    cells: {
      openathlete: { verdict: 'partial', note: 'soon' },
      trainingpeaks: { verdict: 'yes' },
      nolio: { verdict: 'yes' },
      'intervals-icu': { verdict: 'partial', note: 'third_party' },
      'final-surge': { verdict: 'yes' },
      runna: { verdict: 'yes' },
      strava: { verdict: 'yes' },
    },
  },
];

/** Price rows of the hub table: amount (null: not applicable) and note. */
export const HUB_PRICE_ROWS: readonly {
  topic: string;
  cells: Record<
    HubColumn,
    { price: Money | null; note?: string; noteVar?: keyof typeof QUOTED_PRICES }
  >;
}[] = [
  {
    topic: 'athlete_year',
    cells: {
      openathlete: { price: [0, 'EUR'], note: 'supporter_optional' },
      trainingpeaks: { price: QUOTED_PRICES.tpYear, note: 'premium_tax' },
      nolio: { price: [0, 'EUR'], note: 'premium_price', noteVar: 'nolioYear' },
      'intervals-icu': {
        price: [0, 'USD'],
        note: 'supporter_price',
        noteVar: 'icuYear',
      },
      'final-surge': { price: [0, 'USD'] },
      runna: { price: QUOTED_PRICES.runnaYear },
      strava: {
        price: [0, 'EUR'],
        note: 'subscription_price',
        noteVar: 'stravaYear',
      },
    },
  },
  {
    topic: 'coach10',
    cells: {
      openathlete: { price: [50, 'EUR'], note: 'unlimited' },
      trainingpeaks: {
        price: [coach('trainingpeaks', 10), 'USD'],
        note: 'tp_premium',
      },
      nolio: { price: [coach('nolio', 10), 'EUR'], note: 'nolio_classic' },
      'intervals-icu': { price: [0, 'USD'], note: 'teams' },
      'final-surge': {
        price: [coach('final-surge', 10), 'USD'],
        note: 'fs_pro',
      },
      runna: { price: null },
      strava: { price: null },
    },
  },
];

/** Positioning map: x from cheaper (0) to pricier (1), y from open (0) to locked in (1). */
export const LANDSCAPE = [
  { id: 'oa', name: 'OpenAthlete', x: 0.1, y: 0.12, highlight: true },
  { id: 'gc', name: 'Golden Cheetah', x: 0.07, y: 0.3 },
  { id: 'icu', name: 'intervals.icu', x: 0.27, y: 0.41, slug: 'intervals-icu' },
  { id: 'tredict', name: 'Tredict', x: 0.36, y: 0.54 },
  { id: 'tr', name: 'TrainerRoad', x: 0.93, y: 0.36 },
  { id: 'fs', name: 'Final Surge', x: 0.58, y: 0.5, slug: 'final-surge' },
  { id: 'nolio', name: 'Nolio', x: 0.42, y: 0.63, slug: 'nolio' },
  { id: 'tp', name: 'TrainingPeaks', x: 0.84, y: 0.71, slug: 'trainingpeaks' },
  { id: 'runna', name: 'Strava + Runna', x: 0.7, y: 0.79, slug: 'runna' },
  { id: 'ai', name: 'Humango, Athletica…', x: 0.93, y: 0.94 },
  { id: 'locked', name: 'Garmin Connect, COROS', x: 0.1, y: 0.87 },
] as const;
