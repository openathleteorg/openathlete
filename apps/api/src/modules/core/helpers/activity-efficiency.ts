import { ActivityStream, SPORT_TYPE } from '@openathlete/shared';

const RUNNING = new Set<string>([
  SPORT_TYPE.RUNNING,
  SPORT_TYPE.TRAIL_RUNNING,
  SPORT_TYPE.VIRTUAL_RUN,
]);

/**
 * The factors of the athlete's WKO5 "Progression Efficiency" chart: a metre
 * climbed counts as 9 metres run, and climbing adds 0.14 W per m/h of
 * vertical speed to the power.
 */
export const CLIMB_DISTANCE_FACTOR = 9;
export const CLIMB_POWER_PER_VAM = 0.14;

/** Samples going down more than this are left out of power and heart rate */
const DOWNHILL_GRADE = -0.01;
const MAX_SAMPLE_SECONDS = 15;
const MIN_SECONDS = 600;

export interface ActivityEfficiency {
  /** Metres per joule */
  biomechanicalEfficiency: number | null;
  /** Joules per heartbeat */
  metabolicEfficiency: number | null;
  /** Metres per heartbeat */
  totalEfficiency: number | null;
}

const NONE: ActivityEfficiency = {
  biomechanicalEfficiency: null,
  metabolicEfficiency: null,
  totalEfficiency: null,
};

/** Time-weighted average of a channel over the samples not run downhill */
function averageNotDownhill(
  stream: ActivityStream,
  values: number[],
): number | null {
  const { time, distance, altitude } = stream;
  if (!time) return null;
  let sum = 0;
  let seconds = 0;
  const length = Math.min(time.length, values.length);
  for (let i = 1; i < length; i++) {
    const dt = time[i] - time[i - 1];
    if (!(dt > 0 && dt <= MAX_SAMPLE_SECONDS) || !(values[i] > 0)) continue;
    if (distance && altitude) {
      const dd = distance[i] - distance[i - 1];
      if (!(dd > 0)) continue;
      if ((altitude[i] - altitude[i - 1]) / dd < DOWNHILL_GRADE) continue;
    }
    sum += values[i] * dt;
    seconds += dt;
  }
  return seconds >= MIN_SECONDS ? sum / seconds : null;
}

/**
 * How well a run turns power and heartbeats into distance, climbing
 * included:
 * - biomechanical: metres per joule, (distance + 9 × climbing) per second
 *   over (power + 0.14 × VAM);
 * - metabolic: joules per heartbeat, (power + 0.14 × VAM) over beats per
 *   second;
 * - total: metres per heartbeat.
 * Power and heart rate are averaged off the descents, as the chart does.
 */
export function activityEfficiency(
  stream: ActivityStream,
  activity: {
    sport: string;
    distance: number;
    elevationGain: number;
    movingTime: number;
  },
): ActivityEfficiency {
  if (!RUNNING.has(activity.sport) || !(activity.movingTime > 0)) return NONE;
  const climbing = Math.max(activity.elevationGain, 0);
  const speed =
    (activity.distance + climbing * CLIMB_DISTANCE_FACTOR) /
    activity.movingTime;
  const vam = (climbing / activity.movingTime) * 3600;
  const power = stream.watts ? averageNotDownhill(stream, stream.watts) : null;
  const heartRate = stream.heartrate
    ? averageNotDownhill(stream, stream.heartrate)
    : null;
  const work = power !== null ? power + vam * CLIMB_POWER_PER_VAM : null;
  const beatsPerSecond = heartRate !== null ? heartRate / 60 : null;
  return {
    biomechanicalEfficiency: work ? speed / work : null,
    metabolicEfficiency: work && beatsPerSecond ? work / beatsPerSecond : null,
    totalEfficiency: beatsPerSecond ? speed / beatsPerSecond : null,
  };
}
