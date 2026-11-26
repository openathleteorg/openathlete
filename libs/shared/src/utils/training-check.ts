/**
 * The training check: does the training work? A few questions, each answered
 * by comparing the last weeks with the weeks before, and left open rather
 * than answered on too little.
 *
 * Sources:
 * - Heart rate at a given submaximal output falls as endurance improves, and
 *   follows it from one's usual runs, without a test: Buchheit M (2014),
 *   Front Physiol 5:73, doi:10.3389/fphys.2014.00073; Vesterinen V et al.
 *   (2014), J Strength Cond Res 28(4):902-908,
 *   doi:10.1519/JSC.0000000000000349; Shushan T et al. (2023), Sports Med
 *   Open 9, doi:10.1186/s40798-023-00564-w.
 * - A change counts once it is worthwhile and clear of the noise. Buchheit
 *   (2014) reports that, for one athlete, authors have used 0.5 or 1 times
 *   the athlete's own variation as the smallest worthwhile change, that a
 *   change is unclear while its noise overlaps both zero and that change,
 *   and that averaging n measures divides the noise by the root of n. Here:
 *   half the spread between the athlete's runs, and clear of the noise
 *   left in the two medians at about four chances in five.
 * - For performance, Hopkins WG (2004), Sportscience 8:1-7, sets the
 *   smallest worthwhile change at 0.3 of the variation between an elite
 *   athlete's competitions, about 0.3 to 1 % of power. He does not speak of
 *   recreational athletes: taking the upper end, 1 %, for a critical speed
 *   or power read from training is our assumption.
 * - Drift of heart rate against output on long runs as durability: Maunder E
 *   et al. (2021), Sports Med, PMID 33886100; Smyth B et al. (2022), Sports
 *   Med 52:2283-2295, doi:10.1007/s40279-022-01680-5. They read it on
 *   marathons, on the flat.
 *
 * - Recovery: the week's mean of the logarithm of heart rate variability
 *   against the athlete's own range, half their day-to-day variation either
 *   side, as Plews DJ et al. (2012), Eur J Appl Physiol 112:3729-3741,
 *   doi:10.1007/s00421-012-2354-4, read it (on two triathletes). Bellenger
 *   CR et al. (2016), Sports Med 46:1461-1486, doi:10.1007/s40279-016-0484-2:
 *   resting variability rises with training that improves performance.
 *   Bosquet L et al. (2008), Br J Sports Med 42:709-714,
 *   doi:10.1136/bjsm.2007.042200: such changes only mean something next to
 *   other signs. So variability and resting heart rate have to agree here.
 * - A run more than 10 % longer than the longest of the 30 days before went
 *   with more overuse injuries: Frandsen JSB et al. (2025), Br J Sports Med
 *   59:1203-1210, doi:10.1136/bjsports-2024-109380. Exploratory, on
 *   self-reported injuries: shown as a note, never as a risk.
 *
 * What a trail runner's data taught us (2026-11, 24 runs of one athlete):
 * heart rate at the same power or grade-adjusted speed varied by 12 beats
 * a minute between runs over whole outings, whatever the smoothing, and by
 * about 4 on their flat stretches, close to the 3 % Buchheit reports for a
 * standard run. And the drift of a mountain run mostly shows the climb
 * coming before the descent, even at matched outputs. So heart rate is
 * compared on flat stretches only, durability on flat long runs only, and
 * the middle and spread are the median and the median deviation, which one
 * outing with a failing heart rate sensor does not move.
 */

/** Each window: the last six weeks, and the six before */
export const CHECK_WINDOW_DAYS = 42;
/** Runs a window needs before it is compared */
export const CHECK_MIN_RUNS = 4;
/** Long runs are rarer: two a window */
export const CHECK_MIN_LONG_RUNS = 2;
/** A change counts beyond this share of the spread between runs */
export const CHECK_NOISE_SHARE = 0.5;
/** A critical speed or power counts as moved beyond this share */
export const CHECK_MODEL_CHANGE = 0.01;
/** A long, steady run on the flat, where a drift of heart rate reads */
export const CHECK_LONG_RUN_SECONDS = 60 * 60;
export const CHECK_LOW_SHARE = 0.8;
/** Flat: climbing this share of the distance at most */
export const CHECK_FLAT_CLIMB = 0.02;

/** Recovery reads the last week against the six before it */
export const CHECK_WEEK_DAYS = 7;
/** Mornings a week needs, and its baseline */
export const CHECK_MIN_WEEK_DAYS = 4;
export const CHECK_MIN_BASELINE_DAYS = 14;

/** A band of output counts with these runs in each window */
const MIN_BAND_RUNS = 2;
/** Time a run needs in such bands: flat stretches are short on a trail */
const MIN_RUN_SECONDS = 5 * 60;
/**
 * Bands below this share of the athlete's brisk output (the 90th percentile
 * of the bands by time) are walking or standing: heart rate there follows
 * what came before, not the output
 */
const FLOOR_SHARE = 0.5;

export type CheckStatus = 'BETTER' | 'SAME' | 'WORSE' | 'OPEN';

export interface CheckComparison {
  status: CheckStatus;
  /** Median of the last window, null without a value */
  current: number | null;
  previous: number | null;
  /** Spread between single values, each around the middle of its window */
  noise: number | null;
  /** Values in the last window, and in the one before */
  counts: [number, number];
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};

/** Scales a median absolute deviation to the standard deviation it estimates */
const DEVIATION_SCALE = 1.4826;
/** A median is less sure than a mean of as many values: its standard error */
const MEDIAN_ERROR = 1.2533;
/**
 * Standard errors a change has to clear: about four chances in five that it
 * is no accident. "Worse" on a coin toss would do more harm than waiting.
 */
const CLEAR = 1.2816;

/**
 * Compares the values of two windows. Open with too few of them; the same
 * when their medians differ by less than half the spread between single
 * values, or by less than the noise the two medians still carry, so that
 * noise is not read as progress.
 */
export function compareWindows(
  current: number[],
  previous: number[],
  {
    higherIsBetter,
    minCount = CHECK_MIN_RUNS,
  }: { higherIsBetter: boolean; minCount?: number },
): CheckComparison {
  const now = current.length ? median(current) : null;
  const before = previous.length ? median(previous) : null;
  const counts: [number, number] = [current.length, previous.length];
  if (
    now === null ||
    before === null ||
    current.length < minCount ||
    previous.length < minCount
  ) {
    return {
      status: 'OPEN',
      current: now,
      previous: before,
      noise: null,
      counts,
    };
  }
  // Each value against the middle of its own window: a real change between
  // the windows is not spread
  const noise =
    DEVIATION_SCALE *
    median([
      ...current.map((value) => Math.abs(value - now)),
      ...previous.map((value) => Math.abs(value - before)),
    ]);
  const change = now - before;
  // Worthwhile, and beyond what the two medians still carry of the noise:
  // with few runs, the second asks for more
  const threshold =
    noise *
    Math.max(
      CHECK_NOISE_SHARE,
      CLEAR *
        MEDIAN_ERROR *
        Math.sqrt(1 / current.length + 1 / previous.length),
    );
  const status: CheckStatus =
    change === 0 || Math.abs(change) <= threshold
      ? 'SAME'
      : change > 0 === higherIsBetter
        ? 'BETTER'
        : 'WORSE';
  return { status, current: now, previous: before, noise, counts };
}

/** Compares a critical speed or power with the one of six weeks before */
export function compareModels(
  current: number | null,
  previous: number | null,
): CheckStatus {
  if (!current || !previous) return 'OPEN';
  const change = current / previous - 1;
  if (Math.abs(change) <= CHECK_MODEL_CHANGE) return 'SAME';
  return change > 0 ? 'BETTER' : 'WORSE';
}

export interface CardiacBand {
  activityId: number;
  /** In the last window, or the one before */
  current: boolean;
  /** Band of output: a slice of speed or of power */
  band: number;
  seconds: number;
  /** Mean heart rate of the run in the band */
  heartrate: number;
}

/** The band below which 90 % of the time was spent; bands start at zero */
function briskBand(bands: Pick<CardiacBand, 'band' | 'seconds'>[]): number {
  const seconds = new Map<number, number>();
  let total = 0;
  for (const row of bands) {
    seconds.set(row.band, (seconds.get(row.band) ?? 0) + row.seconds);
    total += row.seconds;
  }
  let passed = 0;
  for (const [band, time] of [...seconds].sort(([a], [b]) => a - b)) {
    passed += time;
    if (passed >= total * 0.9) return band;
  }
  return 0;
}

/**
 * Heart rate of each run against the athlete's usual one at the same output
 * on flat ground, in beats a minute: negative when the heart beat slower than usual. Bands
 * are compared one by one, since heart rate rises with output and an easy
 * week would otherwise read as fitness. Only bands run in both windows
 * count, above walking pace, and runs with enough time in them.
 */
export function cardiacScores(bands: CardiacBand[]): {
  current: number[];
  previous: number[];
  /** The band with the most time, to name the output the answer is about */
  referenceBand: number | null;
} {
  const floor = briskBand(bands) * FLOOR_SHARE;
  const byBand = new Map<number, CardiacBand[]>();
  for (const row of bands) {
    if (row.band < floor) continue;
    byBand.set(row.band, [...(byBand.get(row.band) ?? []), row]);
  }
  const usual = new Map<number, number>();
  let referenceBand: number | null = null;
  let most = 0;
  for (const [band, rows] of byBand) {
    const now = rows.filter((row) => row.current).length;
    if (now < MIN_BAND_RUNS || rows.length - now < MIN_BAND_RUNS) continue;
    usual.set(band, median(rows.map((row) => row.heartrate)));
    const seconds = rows.reduce((sum, row) => sum + row.seconds, 0);
    if (seconds > most) {
      most = seconds;
      referenceBand = band;
    }
  }

  const runs = new Map<
    number,
    { current: boolean; seconds: number; beats: number }
  >();
  for (const row of bands) {
    const reference = usual.get(row.band);
    if (reference === undefined) continue;
    const run = runs.get(row.activityId) ?? {
      current: row.current,
      seconds: 0,
      beats: 0,
    };
    run.seconds += row.seconds;
    run.beats += (row.heartrate - reference) * row.seconds;
    runs.set(row.activityId, run);
  }
  const scores = { current: [] as number[], previous: [] as number[] };
  for (const run of runs.values()) {
    if (run.seconds < MIN_RUN_SECONDS) continue;
    scores[run.current ? 'current' : 'previous'].push(run.beats / run.seconds);
  }
  return { ...scores, referenceBand };
}

export type RangeState = 'LOW' | 'NORMAL' | 'HIGH';

export interface RangeSignal {
  state: RangeState;
  /** Mean of the week */
  week: number;
  /** The athlete's usual range, from the weeks before */
  low: number;
  high: number;
  /** Days measured in the week */
  days: number;
}

/**
 * Where the mean of a week of daily measures sits against the athlete's own
 * range of the weeks before: half their day-to-day spread either side, and
 * clear of the noise a week's mean still carries. Null with too few days.
 * `log` for heart rate variability, which is skewed: its logarithm is what
 * the literature averages.
 */
export function rangeSignal(
  week: number[],
  baseline: number[],
  { log = false }: { log?: boolean } = {},
): RangeSignal | null {
  if (
    week.length < CHECK_MIN_WEEK_DAYS ||
    baseline.length < CHECK_MIN_BASELINE_DAYS
  ) {
    return null;
  }
  const to = (value: number) => (log ? Math.log(value) : value);
  const from = (value: number) => (log ? Math.exp(value) : value);
  const mean = (values: number[]) =>
    values.reduce((sum, value) => sum + to(value), 0) / values.length;
  const usual = mean(baseline);
  const spread = Math.sqrt(
    baseline.reduce((sum, value) => sum + (to(value) - usual) ** 2, 0) /
      (baseline.length - 1),
  );
  const margin =
    spread *
    Math.max(
      CHECK_NOISE_SHARE,
      CLEAR * Math.sqrt(1 / week.length + 1 / baseline.length),
    );
  const now = mean(week);
  return {
    state:
      now < usual - margin ? 'LOW' : now > usual + margin ? 'HIGH' : 'NORMAL',
    week: from(now),
    low: from(usual - margin),
    high: from(usual + margin),
    days: week.length,
  };
}

/**
 * Recovery from heart rate variability and resting heart rate. One measure
 * alone decides; with both, they have to agree, as either can move for
 * reasons of its own. Lower variability and a higher resting heart rate
 * read as worse.
 */
export function recoveryStatus(
  variability: RangeSignal | null,
  restingHeartrate: RangeSignal | null,
): CheckStatus {
  const signs = [
    variability && { LOW: -1, NORMAL: 0, HIGH: 1 }[variability.state],
    restingHeartrate && { LOW: 1, NORMAL: 0, HIGH: -1 }[restingHeartrate.state],
  ].filter((sign): sign is number => sign !== null);
  if (signs.length === 0) return 'OPEN';
  if (signs.every((sign) => sign > 0)) return 'BETTER';
  if (signs.every((sign) => sign < 0)) return 'WORSE';
  return 'SAME';
}

/** Runs a band needs over the months of a history */
const MIN_SERIES_RUNS = 4;

/**
 * Heart rate of each run against the athlete's usual one at the same output
 * on flat ground, over a longer span than the check: one figure a run, in
 * beats a minute, to draw as a course. Bands count with enough runs over
 * the span, above walking pace.
 */
export function cardiacSeries(bands: Omit<CardiacBand, 'current'>[]): {
  scores: Map<number, number>;
  referenceBand: number | null;
} {
  const floor = briskBand(bands) * FLOOR_SHARE;
  const byBand = new Map<number, Omit<CardiacBand, 'current'>[]>();
  for (const row of bands) {
    if (row.band < floor) continue;
    byBand.set(row.band, [...(byBand.get(row.band) ?? []), row]);
  }
  const usual = new Map<number, number>();
  let referenceBand: number | null = null;
  let most = 0;
  for (const [band, rows] of byBand) {
    if (rows.length < MIN_SERIES_RUNS) continue;
    usual.set(band, median(rows.map((row) => row.heartrate)));
    const seconds = rows.reduce((sum, row) => sum + row.seconds, 0);
    if (seconds > most) {
      most = seconds;
      referenceBand = band;
    }
  }
  const runs = new Map<number, { seconds: number; beats: number }>();
  for (const row of bands) {
    const reference = usual.get(row.band);
    if (reference === undefined) continue;
    const run = runs.get(row.activityId) ?? { seconds: 0, beats: 0 };
    run.seconds += row.seconds;
    run.beats += (row.heartrate - reference) * row.seconds;
    runs.set(row.activityId, run);
  }
  const scores = new Map<number, number>();
  for (const [activityId, run] of runs) {
    if (run.seconds >= MIN_RUN_SECONDS) {
      scores.set(activityId, run.beats / run.seconds);
    }
  }
  return { scores, referenceBand };
}

/**
 * The answers read together, in one line. Ours, not a study's: fitter,
 * faster or lasting longer is progress, and recovery says what it costs.
 */
export type CheckSummary =
  | 'WORKING'
  | 'WORKING_COSTLY'
  | 'DECLINING'
  | 'DECLINING_TIRED'
  | 'MIXED'
  | 'STABLE'
  | 'STABLE_TIRED'
  | 'OPEN';

export function checkSummary(
  progress: CheckStatus[],
  recovery: CheckStatus,
): CheckSummary {
  const better = progress.includes('BETTER');
  const worse = progress.includes('WORSE');
  const tired = recovery === 'WORSE';
  if (better && worse) return 'MIXED';
  if (better) return tired ? 'WORKING_COSTLY' : 'WORKING';
  if (worse) return tired ? 'DECLINING_TIRED' : 'DECLINING';
  if (progress.every((status) => status === 'OPEN')) {
    return tired ? 'STABLE_TIRED' : 'OPEN';
  }
  return tired ? 'STABLE_TIRED' : 'STABLE';
}
