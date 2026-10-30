import { MetricType, SportType } from '@openathlete/database';

import type {
  PolarDailyActivity,
  PolarExercise,
  PolarNightlyRecharge,
  PolarPhysicalInfo,
  PolarSleep,
} from '../../core/types/connector';

export interface PolarMetricRecord {
  type: MetricType;
  date: Date;
  value: number;
}

/** Polar sports and detailed sports, as listed in its API appendix */
const POLAR_SPORTS: Record<string, SportType> = {
  RUNNING: SportType.RUNNING,
  ROAD_RUNNING: SportType.RUNNING,
  JOGGING: SportType.RUNNING,
  TRACK_AND_FIELD_RUNNING: SportType.RUNNING,
  TREADMILL_RUNNING: SportType.RUNNING,
  DUATHLON_RUNNING: SportType.RUNNING,
  TRIATHLON_RUNNING: SportType.RUNNING,
  TRAIL_RUNNING: SportType.TRAIL_RUNNING,
  CROSS_COUNTRY_RUNNING: SportType.TRAIL_RUNNING,
  ULTRARUNNING_RUNNING: SportType.TRAIL_RUNNING,
  OFFROADDUATHLON_RUNNING: SportType.TRAIL_RUNNING,
  OFFROADTRIATHLON_RUNNING: SportType.TRAIL_RUNNING,
  CYCLING: SportType.CYCLING,
  ROAD_BIKING: SportType.CYCLING,
  INDOOR_CYCLING: SportType.CYCLING,
  SPINNING: SportType.CYCLING,
  DUATHLON_CYCLING: SportType.CYCLING,
  TRIATHLON_CYCLING: SportType.CYCLING,
  GRAVEL: SportType.GRAVEL_RIDE,
  MOUNTAIN_BIKING: SportType.MOUNTAIN_BIKE_RIDE,
  OFFROADDUATHLON_CYCLING: SportType.MOUNTAIN_BIKE_RIDE,
  OFFROADTRIATHLON_CYCLING: SportType.MOUNTAIN_BIKE_RIDE,
  E_BIKE: SportType.E_BIKE_RIDE,
  PARASPORTS_HAND_CYCLING: SportType.HANDCYCLE,
  SWIMMING: SportType.SWIMMING,
  POOL_SWIMMING: SportType.SWIMMING,
  OPEN_WATER_SWIMMING: SportType.SWIMMING,
  TRIATHLON_SWIMMING: SportType.SWIMMING,
  OFFROADTRIATHLON_SWIMMING: SportType.SWIMMING,
  TRIATHLON: SportType.TRIATHLON,
  OFFROADTRIATHLON: SportType.TRIATHLON,
  DUATHLON: SportType.DUATHLON,
  OFFROADDUATHLON: SportType.DUATHLON,
  HIKING: SportType.HIKING,
  WALKING: SportType.WALK,
  NORDIC_WALKING: SportType.WALK,
  SNOWSHOE_TREKKING: SportType.SNOWSHOE,
  BACKCOUNTRY_SKIING: SportType.BACKCOUNTRY_SKI,
  DOWNHILL_SKIING: SportType.ALPINE_SKI,
  XC_SKIING_CLASSIC: SportType.NORDIC_SKI,
  XC_SKIING_FREESTYLE: SportType.NORDIC_SKI,
  ROLLER_SKIING_CLASSIC: SportType.ROLLER_SKI,
  ROLLER_SKIING_FREESTYLE: SportType.ROLLER_SKI,
  SNOWBOARDING: SportType.SNOWBOARD,
  ROWING: SportType.ROWING,
  INDOOR_ROWING: SportType.ROWING,
  WATERSPORTS_CANOEING: SportType.CANOEING,
  WATERSPORTS_KAYAKING: SportType.KAYAKING,
  WATERSPORTS_SAILING: SportType.SAIL,
  WATERSPORTS_KITESURFING: SportType.KITESURF,
  WATERSPORTS_WINDSURFING: SportType.WINDSURF,
  WATERSPORTS_SURFING: SportType.SURFING,
  SUP: SportType.STAND_UP_PADDLING,
  STRENGTH_TRAINING: SportType.STRENGTH,
  KETTLEBELL: SportType.STRENGTH,
  CORE: SportType.STRENGTH,
  CIRCUIT_TRAINING: SportType.CROSSFIT,
  FUNCTIONAL_TRAINING: SportType.CROSSFIT,
  HIIT: SportType.HIGH_INTENSITY_INTERVAL_TRAINING,
  CROSS_TRAINER: SportType.ELLIPTICAL,
  STAIR_WORKOUT: SportType.STAIR_STEPPER,
  VERTICALSPORTS_OUTCLIMBING: SportType.ROCK_CLIMBING,
  VERTICALSPORTS_WALLCLIMBING: SportType.ROCK_CLIMBING,
  CLIMBING: SportType.ROCK_CLIMBING,
  YOGA: SportType.YOGA,
  PILATES: SportType.PILATES,
  MOBILITY_DYNAMIC: SportType.MOBILITY,
  MOBILITY_STATIC: SportType.MOBILITY,
  STRETCHING: SportType.MOBILITY,
  ICE_SKATING: SportType.ICE_SKATE,
  INLINE_SKATING: SportType.INLINE_SKATE,
  ROLLER_BLADING: SportType.INLINE_SKATE,
  SKATEBOARDING: SportType.SKATEBOARD,
  BADMINTON: SportType.BADMINTON,
  GOLF: SportType.GOLF,
  PICKLEBALL: SportType.PICKLEBALL,
  SOCCER: SportType.SOCCER,
  SQUASH: SportType.SQUASH,
  TABLE_TENNIS: SportType.TABLE_TENNIS,
  TENNIS: SportType.TENNIS,
};

/** ISO 8601 duration, whose seconds may have decimals (PT1H2M3.5S) */
export function parsePolarDuration(duration: string | undefined): number {
  const match = duration?.match(
    /^PT(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?$/,
  );
  if (!match) return 0;
  const [, hours = '0', minutes = '0', seconds = '0'] = match;
  return Math.round(
    Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds),
  );
}

/**
 * Polar gives the time set on the watch, without a zone, and its offset from
 * UTC in minutes. Read as is, the session would move by the athlete's zone.
 */
export function polarStartDate(exercise: PolarExercise): Date {
  const local = new Date(`${exercise.start_time}Z`);
  return new Date(
    local.getTime() - (exercise.start_time_utc_offset ?? 0) * 60_000,
  );
}

/** The detailed sport is the one chosen on the watch: `sport` is often OTHER */
export function mapPolarSport(exercise: PolarExercise): SportType {
  return (
    POLAR_SPORTS[exercise.detailed_sport_info ?? ''] ??
    POLAR_SPORTS[exercise.sport ?? ''] ??
    SportType.OTHER
  );
}

/** ROAD_RUNNING becomes "Road running" */
export function polarActivityName(exercise: PolarExercise): string {
  const sport = [exercise.detailed_sport_info, exercise.sport].find(
    (value) => value && value !== 'OTHER',
  );
  if (!sport) return 'Polar activity';
  const words = sport.toLowerCase().replaceAll('_', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function push(
  target: PolarMetricRecord[],
  type: MetricType,
  day: string,
  value?: number | null,
) {
  if (value === undefined || value === null || !Number.isFinite(value)) return;
  target.push({ type, date: new Date(`${day}T00:00:00.000Z`), value });
}

const hours = (seconds?: number) =>
  seconds === undefined ? undefined : seconds / 3600;

export function mapPolarDailyActivity(
  days: PolarDailyActivity[],
): PolarMetricRecord[] {
  const metrics: PolarMetricRecord[] = [];
  for (const day of days) {
    if (!day.start_time) continue;
    // Local time: its date part is the athlete's day
    const date = day.start_time.slice(0, 10);
    push(metrics, MetricType.DAILY_STEPS, date, day.steps);
    push(metrics, MetricType.DAILY_CALORIES, date, day.calories);
    push(metrics, MetricType.DAILY_ACTIVE_CALORIES, date, day.active_calories);
    push(
      metrics,
      MetricType.DAILY_DISTANCE,
      date,
      day.distance_from_steps === undefined
        ? undefined
        : day.distance_from_steps / 1000,
    );
    if (day.active_duration) {
      push(
        metrics,
        MetricType.DAILY_ACTIVE_MINUTES,
        date,
        parsePolarDuration(day.active_duration) / 60,
      );
    }
  }
  return metrics;
}

export function mapPolarSleep(nights: PolarSleep[]): PolarMetricRecord[] {
  const metrics: PolarMetricRecord[] = [];
  for (const night of nights) {
    const stages = [
      night.light_sleep,
      night.deep_sleep,
      night.rem_sleep,
      night.unrecognized_sleep_stage,
    ].filter((stage) => stage !== undefined);
    if (stages.length > 0) {
      push(
        metrics,
        MetricType.SLEEP_DURATION,
        night.date,
        hours(stages.reduce((total, stage) => total + stage, 0)),
      );
    }
    push(
      metrics,
      MetricType.SLEEP_LIGHT_DURATION,
      night.date,
      hours(night.light_sleep),
    );
    push(
      metrics,
      MetricType.SLEEP_DEEP_DURATION,
      night.date,
      hours(night.deep_sleep),
    );
    push(
      metrics,
      MetricType.SLEEP_REM_DURATION,
      night.date,
      hours(night.rem_sleep),
    );
    push(
      metrics,
      MetricType.SLEEP_AWAKE_DURATION,
      night.date,
      hours(night.total_interruption_duration),
    );
    push(metrics, MetricType.SLEEP_SCORE, night.date, night.sleep_score);
  }
  return metrics;
}

export function mapPolarNightlyRecharge(
  recharges: PolarNightlyRecharge[],
): PolarMetricRecord[] {
  const metrics: PolarMetricRecord[] = [];
  for (const recharge of recharges) {
    push(
      metrics,
      MetricType.HRV_LAST_NIGHT_AVG,
      recharge.date,
      recharge.heart_rate_variability_avg,
    );
    push(
      metrics,
      MetricType.SLEEP_RESPIRATION_AVG,
      recharge.date,
      recharge.breathing_rate_avg,
    );
  }
  return metrics;
}

/** Dated by its last change: Polar keeps the current values only */
export function mapPolarPhysicalInfo(
  info: PolarPhysicalInfo,
  now: Date,
): PolarMetricRecord[] {
  const date = (info.modified ?? now.toISOString()).slice(0, 10);
  const metrics: PolarMetricRecord[] = [];
  push(metrics, MetricType.WEIGHT, date, info.weight);
  push(metrics, MetricType.HEIGHT, date, info.height);
  push(metrics, MetricType.HR_MAX, date, info.maximum_heart_rate);
  push(metrics, MetricType.HR_REST, date, info.resting_heart_rate);
  push(metrics, MetricType.VO2MAX, date, info.vo2_max);
  return metrics;
}
