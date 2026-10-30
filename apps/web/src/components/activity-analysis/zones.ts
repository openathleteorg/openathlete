import { ZoneRange } from '@openathlete/shared';

export { timeInZones } from '@openathlete/shared';
export type { ZoneRange, ZoneTime } from '@openathlete/shared';

// Pace zones are stored in decimal minutes per kilometre
const paceToSpeed = (minutesPerKm: number) =>
  minutesPerKm > 0 ? 1000 / (minutesPerKm * 60) : 0;

/** A pace zone's bounds as speeds, the faster pace being the higher speed */
export function paceZoneAsSpeed<Z extends ZoneRange>(zone: Z): Z {
  const [a, b] = [paceToSpeed(zone.min), paceToSpeed(zone.max)];
  return { ...zone, min: Math.min(a, b), max: Math.max(a, b) };
}
