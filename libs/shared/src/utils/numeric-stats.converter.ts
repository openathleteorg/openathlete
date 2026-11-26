import { SpeedUnit } from '../types';
import { METERS_PER_MILE, MS_TO_MPH } from './units';

/**
 * Computes the pace in different units based on the distance and duration.
 *
 * @param distance The distance value to compute the pace for (in meters)
 * @param duration The duration value to compute the pace for (in seconds)
 * @param unit The unit to compute the pace in (m/s, km/h, mph, min/km, min/mi)
 * @returns The computed pace value
 */
export const convertSpeed = (
  distance: number,
  duration: number,
  unit: SpeedUnit = 'min/km',
): number => {
  if (distance === 0 || duration === 0) return 0;

  const pace = distance / duration; // in seconds per meter

  switch (unit) {
    case 'm/s':
      return pace;
    case 'km/h':
      return pace * 3.6;
    case 'mph':
      return pace * MS_TO_MPH;
    case 'min/km':
      // convert meter / seconds to minute / km
      return (pace * 60) / 1000;
    case 'min/mi':
      return pace / METERS_PER_MILE;
    default:
      return pace;
  }
};
