import { DistanceUnit, SpeedUnit } from '../types';

/**
 * Formats a duration value to a human readable format.
 *
 * @param duration The duration value to format (in seconds)
 * @returns The formatted duration value
 */
export const formatDuration = (duration: number): string => {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = Math.floor(duration % 60);

  const paddedMinutes = minutes.toString().padStart(2, '0');
  const paddedSeconds = seconds.toString().padStart(2, '0');

  if (hours > 0) return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  else return `${minutes}:${paddedSeconds}`;
};

// Rounded, not truncated: 500 / (500 / 120) is 119.999... seconds, not 1:59
const formatPace = (seconds: number): string =>
  formatDuration(Math.round(seconds));

/**
 * Formats a speed value to a human readable format.
 *
 * @param speed The speed value to format (in m/s)
 * @param unit The unit to format the speed to
 * @returns The formatted speed value
 */
export const formatSpeed = (
  speed: number,
  unit: SpeedUnit = 'min/km',
): string => {
  switch (unit) {
    case 'm/s':
      return `${speed.toFixed(2)}`;
    case 'km/h':
      return `${(speed * 3.6).toFixed(2)}`;
    case 'mph':
      return `${(speed * 2.23694).toFixed(2)}`;
    case 'min/km':
      if (speed === 0) return '0';
      return formatPace(1000 / speed);
    case 'min/mi':
      if (speed === 0) return '0';
      return formatPace(1609.34 / speed);
    case 'min/100m':
      if (speed === 0) return '0';
      return formatPace(100 / speed);
    case 'min/500m':
      if (speed === 0) return '0';
      return formatPace(500 / speed);
    default:
      return `${speed.toFixed(2)}`;
  }
};

export const formatSpeedUnit = (unit: SpeedUnit): string => {
  switch (unit) {
    case 'm/s':
      return `m/s`;
    case 'km/h':
      return `km/h`;
    case 'mph':
      return 'mph';
    case 'min/km':
      return 'min/km';
    case 'min/mi':
      return 'min/mi';
    case 'min/100m':
      return 'min/100 m';
    case 'min/500m':
      return 'min/500 m';
  }
};

/** Whether the unit reads as time per distance rather than distance per time */
export const isPaceUnit = (unit: SpeedUnit): boolean => unit.startsWith('min/');

/**
 * The distance a pace refers to, also the length of a split: 100 m for
 * swimmers, 500 m for rowers, a mile in imperial units, a kilometre otherwise.
 */
export const paceDistanceMeters = (unit: SpeedUnit): number => {
  if (unit === 'min/100m') return 100;
  if (unit === 'min/500m') return 500;
  if (unit === 'min/mi' || unit === 'mph') return 1609.34;
  return 1000;
};

/**
 * Formats a distance value to a human readable format.
 *
 * @param distance The distance value to format (in meters)
 * @param unit The unit to format the distance to (m, yd, km, mi)
 * @returns The formatted distance value
 */
export const formatDistance = (
  distance: number,
  unit: DistanceUnit = 'km',
): string => {
  switch (unit) {
    case 'm':
      return `${distance.toFixed(0)}`;
    case 'km':
      return `${(distance / 1000).toFixed(2)}`;
    case 'mi':
      return `${(distance / 1609.34).toFixed(2)}`;
    case 'yd':
      return `${(distance * 1.09361).toFixed(0)}`;
    default:
      return `${distance.toFixed(0)}`;
  }
};
