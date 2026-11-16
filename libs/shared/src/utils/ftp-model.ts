import type { ModeledFtpDto } from '../types/dtos/core/records.dto';
import { SPORT_TYPE } from '../types/misc/core/sport-type.enum';

/** Days of activities an FTP is modelled from */
export const FTP_MODEL_DAYS = 90;

/** Power efforts an FTP can be read from, with the share of their power it is */
export const FTP_MODEL_EFFORTS = [
  { duration: 3600, factor: 1 },
  { duration: 1200, factor: 0.95 },
] as const;

/**
 * Sports whose power counts. E-bikes are left out: the motor's watts are
 * not the rider's.
 */
export const FTP_MODEL_SPORTS = {
  running: [
    SPORT_TYPE.RUNNING,
    SPORT_TYPE.TRAIL_RUNNING,
    SPORT_TYPE.VIRTUAL_RUN,
  ],
  cycling: [
    SPORT_TYPE.CYCLING,
    SPORT_TYPE.GRAVEL_RIDE,
    SPORT_TYPE.MOUNTAIN_BIKE_RIDE,
    SPORT_TYPE.VIRTUAL_RIDE,
  ],
} as const;

export interface PowerEffort {
  /** Seconds */
  duration: number;
  /** Watts */
  value: number;
  date: Date;
  eventId: number | null;
  activityName: string | null;
}

/**
 * FTP as the higher of the best hour and 95% of the best 20 minutes. An hour
 * at threshold is the definition; 20 minutes go a little above it, which the
 * 5% takes back. Null without any of these efforts.
 */
export function modelFtp(efforts: PowerEffort[]): ModeledFtpDto | null {
  let best: ModeledFtpDto | null = null;
  for (const { duration, factor } of FTP_MODEL_EFFORTS) {
    for (const effort of efforts) {
      if (effort.duration !== duration || !(effort.value > 0)) continue;
      const value = Math.round(effort.value * factor);
      if (best && best.value >= value) continue;
      best = {
        value,
        duration,
        power: Math.round(effort.value),
        factor,
        date: effort.date,
        eventId: effort.eventId,
        activityName: effort.activityName,
      };
    }
  }
  return best;
}
