/**
 * The running plans the generator writes (`scripts/training-plans`), and the
 * figures their pages derive from them. One entry per URL:
 * `/training-plans/running/{distance}/{variant}`.
 */
export type RunningDistance = '10k' | 'half-marathon' | 'marathon';

export interface RunningPlanSpec {
  distance: RunningDistance;
  /** URL slug: '50min', '1h45'. Pace charts match plans on `3h30`-style slugs. */
  variant: string;
  goalSeconds: number;
  weeks: number;
  runsPerWeek: 3 | 4 | 5;
  /**
   * Share of VMA held over the race at this level. Slower runners hold a
   * smaller share: it gives the VMA each plan is written for.
   */
  vmaShare: number;
}

export const RACE_METRES: Record<RunningDistance, number> = {
  '10k': 10000,
  'half-marathon': 21097.5,
  marathon: 42195,
};

const H = 3600;
const MIN = 60;

export const RUNNING_PLAN_SPECS: readonly RunningPlanSpec[] = [
  {
    distance: '10k',
    variant: '40min',
    goalSeconds: 40 * MIN,
    weeks: 10,
    runsPerWeek: 5,
    vmaShare: 0.9,
  },
  {
    distance: '10k',
    variant: '45min',
    goalSeconds: 45 * MIN,
    weeks: 10,
    runsPerWeek: 4,
    vmaShare: 0.89,
  },
  {
    distance: '10k',
    variant: '50min',
    goalSeconds: 50 * MIN,
    weeks: 10,
    runsPerWeek: 4,
    vmaShare: 0.87,
  },
  {
    distance: '10k',
    variant: '1h00',
    goalSeconds: H,
    weeks: 10,
    runsPerWeek: 3,
    vmaShare: 0.85,
  },
  {
    distance: 'half-marathon',
    variant: '1h30',
    goalSeconds: 1.5 * H,
    weeks: 12,
    runsPerWeek: 5,
    vmaShare: 0.83,
  },
  {
    distance: 'half-marathon',
    variant: '1h45',
    goalSeconds: 1.75 * H,
    weeks: 12,
    runsPerWeek: 4,
    vmaShare: 0.8,
  },
  {
    distance: 'half-marathon',
    variant: '2h00',
    goalSeconds: 2 * H,
    weeks: 12,
    runsPerWeek: 3,
    vmaShare: 0.78,
  },
  {
    distance: 'marathon',
    variant: '3h00',
    goalSeconds: 3 * H,
    weeks: 16,
    runsPerWeek: 5,
    vmaShare: 0.8,
  },
  {
    distance: 'marathon',
    variant: '3h30',
    goalSeconds: 3.5 * H,
    weeks: 16,
    runsPerWeek: 5,
    vmaShare: 0.78,
  },
  {
    distance: 'marathon',
    variant: '3h45',
    goalSeconds: 3.75 * H,
    weeks: 16,
    runsPerWeek: 4,
    vmaShare: 0.77,
  },
  {
    distance: 'marathon',
    variant: '4h00',
    goalSeconds: 4 * H,
    weeks: 16,
    runsPerWeek: 4,
    vmaShare: 0.76,
  },
  {
    distance: 'marathon',
    variant: '4h15',
    goalSeconds: 4.25 * H,
    weeks: 16,
    runsPerWeek: 4,
    vmaShare: 0.75,
  },
  {
    distance: 'marathon',
    variant: '4h30',
    goalSeconds: 4.5 * H,
    weeks: 16,
    runsPerWeek: 4,
    vmaShare: 0.74,
  },
  {
    distance: 'marathon',
    variant: '5h00',
    goalSeconds: 5 * H,
    weeks: 16,
    runsPerWeek: 3,
    vmaShare: 0.72,
  },
  {
    distance: 'marathon',
    variant: '5h30',
    goalSeconds: 5.5 * H,
    weeks: 16,
    runsPerWeek: 3,
    vmaShare: 0.7,
  },
];

export function runningPlanSpec(
  distance: string,
  variant: string,
): RunningPlanSpec | undefined {
  return RUNNING_PLAN_SPECS.find(
    (spec) => spec.distance === distance && spec.variant === variant,
  );
}

/** Race speed in km/h. */
export function goalSpeedKmh(spec: RunningPlanSpec): number {
  return (RACE_METRES[spec.distance] / spec.goalSeconds) * 3.6;
}

/** The VMA (km/h) a plan is written for, to half a km/h. */
export function referenceVma(spec: RunningPlanSpec): number {
  return Math.round((goalSpeedKmh(spec) / spec.vmaShare) * 2) / 2;
}

/** Seconds per km at a share of a VMA in km/h. */
export function paceAtShare(vmaKmh: number, share: number): number {
  return 3600 / (vmaKmh * share);
}

/** Order of distances on hub pages. */
export const DISTANCE_ORDER: readonly RunningDistance[] = [
  '10k',
  'half-marathon',
  'marathon',
];
