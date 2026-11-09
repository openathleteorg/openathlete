/**
 * Jack Daniels and Jimmy Gilbert's VDOT formulas, as in the app's records
 * page (apps/web/src/components/records/vdot.ts): keep both in step so the
 * paces printed here match the ones athletes see once signed in.
 */

// The formulas hold from about 1500 m to the marathon: shorter efforts are
// anaerobic, longer ones depend on fuelling
const MAX_DISTANCE = 42195;

/** Oxygen cost (ml/kg/min) of running at a speed in metres per minute. */
const oxygenCost = (metresPerMinute: number): number =>
  -4.6 + 0.182258 * metresPerMinute + 0.000104 * metresPerMinute ** 2;

/** The inverse of oxygenCost, as a speed in m/s. */
const speedAtOxygenCost = (cost: number): number => {
  const a = 0.000104;
  const b = 0.182258;
  const c = -4.6 - cost;
  return (-b + Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a) / 60;
};

/** The share of VO2max a runner can hold for a race lasting these minutes. */
const sustainableFraction = (minutes: number): number =>
  0.8 +
  0.1894393 * Math.exp(-0.012778 * minutes) +
  0.2989558 * Math.exp(-0.1932605 * minutes);

export function vdotFromPerformance(metres: number, seconds: number): number {
  const minutes = seconds / 60;
  return oxygenCost(metres / minutes) / sustainableFraction(minutes);
}

/** The marathon speed (m/s) this VDOT predicts. */
function marathonSpeed(vdot: number): number {
  let fastest = 3600;
  let slowest = 12 * 3600;
  // A longer time always gives a lower VDOT
  for (let i = 0; i < 40; i++) {
    const seconds = (fastest + slowest) / 2;
    if (vdotFromPerformance(MAX_DISTANCE, seconds) > vdot) fastest = seconds;
    else slowest = seconds;
  }
  return MAX_DISTANCE / slowest;
}

export interface TrainingPaces {
  easy: { slowest: number; fastest: number };
  marathon: number;
  threshold: number;
  interval: number;
  repetition: number;
}

/** Daniels' training intensities, as speeds in m/s. */
export function trainingPaces(vdot: number): TrainingPaces {
  const atShare = (share: number) => speedAtOxygenCost(vdot * share);
  return {
    easy: { slowest: atShare(0.59), fastest: atShare(0.74) },
    marathon: marathonSpeed(vdot),
    threshold: atShare(0.88),
    interval: atShare(0.975),
    repetition: atShare(1.05),
  };
}
