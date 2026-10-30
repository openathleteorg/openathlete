import {
  ActivityStream,
  SPORT_TYPE,
  ZoneRange,
  aerobicDecoupling,
  timeInZones,
} from '@openathlete/shared';

const RUNNING = new Set<string>([SPORT_TYPE.RUNNING, SPORT_TYPE.TRAIL_RUNNING]);
const CYCLING = new Set<string>([
  SPORT_TYPE.CYCLING,
  SPORT_TYPE.GRAVEL_RIDE,
  SPORT_TYPE.MOUNTAIN_BIKE_RIDE,
]);

export interface ActivityIntensity {
  /** Seconds below, between and above the thresholds; empty when unknown */
  seconds: number[];
  efficiencyFactor: number | null;
  decouplingPercent: number | null;
}

/**
 * Zones in the low, middle and high domains of the three-zone model. Five
 * zones split the usual way, 1-2, 3 and 4-5 (Seiler 2010); other counts keep
 * those proportions.
 */
export function threeZoneSplit(count: number): [number, number, number] | null {
  if (count < 3) return null;
  let side = Math.round((count * 2) / 5);
  if (count - 2 * side < 1) side -= 1;
  return [side, count - 2 * side, side];
}

function output(
  stream: ActivityStream,
  sport: string,
): { values: number[]; perMinute: boolean } | null {
  if (CYCLING.has(sport) && stream.watts?.length) {
    return { values: stream.watts, perMinute: false };
  }
  if (RUNNING.has(sport) && stream.gap?.length) {
    return { values: stream.gap, perMinute: true };
  }
  return null;
}

/**
 * What an activity's recording says of its intensity. `zones` are the
 * athlete's heart rate zones for the sport, lowest first, and `powerZones`
 * their power zones: on a bike with a power meter they win, as heart rate
 * lags behind short efforts.
 */
export function activityIntensity(
  stream: ActivityStream,
  sport: string,
  zones: ZoneRange[],
  powerZones: ZoneRange[] = [],
): ActivityIntensity {
  const { heartrate, time } = stream;
  const none = { seconds: [], efficiencyFactor: null, decouplingPercent: null };
  if (!heartrate?.length || !time?.length) return none;
  const end = Math.min(heartrate.length, time.length) - 1;
  if (end < 1) return none;

  const usePower =
    CYCLING.has(sport) &&
    !!stream.watts?.some((watts) => watts > 0) &&
    !!threeZoneSplit(powerZones.length);
  const sorted = usePower ? powerZones : zones;
  const split = threeZoneSplit(sorted.length);
  const inZones = split
    ? timeInZones(
        usePower ? stream.watts! : heartrate,
        time,
        sorted,
        [0, Math.min(end, (usePower ? stream.watts! : heartrate).length - 1)],
        (value) => value <= 0,
      )
    : [];
  const seconds = split
    ? [
        inZones.slice(0, split[0]),
        inZones.slice(split[0], split[0] + split[1]),
        inZones.slice(split[0] + split[1]),
      ].map((part) => part.reduce((sum, zone) => sum + zone.seconds, 0))
    : [];

  const produced = output(stream, sport);
  const decoupling =
    produced &&
    aerobicDecoupling(
      produced.values,
      heartrate,
      time,
      [0, Math.min(end, produced.values.length - 1)],
      (value) => value <= 0,
    );
  return {
    seconds,
    efficiencyFactor: decoupling
      ? decoupling.efficiencyFactor * (produced?.perMinute ? 60 : 1)
      : null,
    decouplingPercent: decoupling?.percent ?? null,
  };
}
