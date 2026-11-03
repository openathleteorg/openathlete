/**
 * Every pace chart page comes from this table. Adding a distance (10K, 5K)
 * means adding an entry here and its few distance-specific messages in
 * `copy.ts`; the pages, the hub, the sitemap and the social cards follow.
 */

export type PaceChartDistance = 'marathon' | 'half-marathon';

/** Race distances the tables refer to, as in the calculators. */
export type RaceId = '5k' | '10k' | 'half' | 'marathon';

export const RACE_METRES: Record<RaceId, number> = {
  '5k': 5000,
  '10k': 10000,
  half: 21097.5,
  marathon: 42195,
};

export interface FitTier {
  /** Applies to goals faster than this many seconds. */
  under: number;
  /** Peak weekly volume, in km: a coaching rule of thumb, not a statistic. */
  peakKm: readonly [number, number];
  runsPerWeek: readonly [number, number];
}

export interface KeyWorkout {
  warmUpKm: number;
  reps: number;
  repKm: number;
  /** Easy running between the reps. */
  floatKm: number;
  coolDownKm: number;
}

export interface DistanceSpec {
  slug: PaceChartDistance;
  race: RaceId;
  /** Goal times as URL slugs: '3-45' is 3h45. Fastest first. */
  goals: readonly string[];
  /** Other races shown with their Riegel equivalent. */
  equivalents: readonly RaceId[];
  /** Shorter races a runner can check the goal against. */
  benchmarks: readonly [RaceId, RaceId];
  workout: KeyWorkout;
  fit: readonly FitTier[];
  /** Folder of the matching plans in the plan catalogue, if any. */
  planDistance?: string;
}

const H = 3600;

export const PACE_CHARTS: readonly DistanceSpec[] = [
  {
    slug: 'marathon',
    race: 'marathon',
    goals: [
      '2-45',
      '3-00',
      '3-15',
      '3-30',
      '3-45',
      '4-00',
      '4-15',
      '4-30',
      '4-45',
      '5-00',
      '5-30',
      '6-00',
    ],
    equivalents: ['5k', '10k', 'half'],
    benchmarks: ['half', '10k'],
    // The classic marathon-pace long run: 15 km at goal pace inside 25 km
    workout: { warmUpKm: 4, reps: 3, repKm: 5, floatKm: 1, coolDownKm: 4 },
    fit: [
      { under: 3 * H, peakKm: [80, 110], runsPerWeek: [5, 7] },
      { under: 3.5 * H, peakKm: [65, 90], runsPerWeek: [5, 6] },
      { under: 4 * H, peakKm: [55, 75], runsPerWeek: [4, 5] },
      { under: 4.5 * H, peakKm: [40, 60], runsPerWeek: [4, 5] },
      { under: Infinity, peakKm: [35, 50], runsPerWeek: [3, 4] },
    ],
    planDistance: 'marathon',
  },
  {
    slug: 'half-marathon',
    race: 'half',
    goals: [
      '1-20',
      '1-30',
      '1-40',
      '1-45',
      '1-50',
      '2-00',
      '2-10',
      '2-15',
      '2-30',
    ],
    equivalents: ['5k', '10k', 'marathon'],
    benchmarks: ['10k', '5k'],
    workout: { warmUpKm: 3, reps: 3, repKm: 3, floatKm: 1, coolDownKm: 2 },
    fit: [
      { under: 1.5 * H, peakKm: [50, 70], runsPerWeek: [5, 6] },
      { under: 1.75 * H, peakKm: [40, 55], runsPerWeek: [4, 5] },
      { under: 2 * H, peakKm: [30, 45], runsPerWeek: [4, 5] },
      { under: Infinity, peakKm: [25, 35], runsPerWeek: [3, 4] },
    ],
    planDistance: 'half-marathon',
  },
];

export function distanceSpec(slug: string): DistanceSpec | undefined {
  return PACE_CHARTS.find((spec) => spec.slug === slug);
}

/** '3-45' → 13500 seconds. */
export function goalSeconds(slug: string): number {
  const [hours, minutes] = slug.split('-').map(Number);
  return hours * H + minutes * 60;
}

/** Every page, for generateStaticParams and the sitemap. */
export function paceChartPaths(): { distance: string; time: string }[] {
  return PACE_CHARTS.flatMap((spec) =>
    spec.goals.map((time) => ({ distance: spec.slug, time })),
  );
}
