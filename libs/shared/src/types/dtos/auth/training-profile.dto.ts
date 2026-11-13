import { z } from 'zod';

import { SPORT_TYPE } from '../../misc/core/sport-type.enum';

export const TRAINING_GOALS = [
  'RACE',
  'PROGRESS',
  'RESTART',
  'FOLLOW_COACH',
] as const;
export const trainingGoalSchema = z.enum(TRAINING_GOALS);
export type TrainingGoal = z.infer<typeof trainingGoalSchema>;

export const WEEKLY_TRAINING_HOURS = [
  'UNDER_3',
  'FROM_3_TO_6',
  'FROM_6_TO_10',
  'OVER_10',
] as const;
export const weeklyTrainingHoursSchema = z.enum(WEEKLY_TRAINING_HOURS);
export type WeeklyTrainingHours = z.infer<typeof weeklyTrainingHoursSchema>;

export const COACH_TEAM_SIZES = [
  'STARTING',
  'FROM_1_TO_5',
  'FROM_6_TO_20',
  'OVER_20',
] as const;
export const coachTeamSizeSchema = z.enum(COACH_TEAM_SIZES);
export type CoachTeamSize = z.infer<typeof coachTeamSizeSchema>;

/** Sports offered as choices during onboarding, the most common first */
export const ONBOARDING_SPORTS = [
  SPORT_TYPE.RUNNING,
  SPORT_TYPE.TRAIL_RUNNING,
  SPORT_TYPE.CYCLING,
  SPORT_TYPE.SWIMMING,
  SPORT_TYPE.TRIATHLON,
  SPORT_TYPE.STRENGTH,
  SPORT_TYPE.NORDIC_SKI,
  SPORT_TYPE.ROWING,
  SPORT_TYPE.HIKING,
] as const;

/** Every sport stays accepted: the settings offer more than onboarding */
export const practicedSportsSchema = z
  .array(z.nativeEnum(SPORT_TYPE))
  .max(20)
  .transform((sports) => [...new Set(sports)]);

export const TARGET_RACE_DISTANCES = [
  '5K',
  '10K',
  'HALF_MARATHON',
  'MARATHON',
  'TRAIL',
  'TRIATHLON',
  'OTHER',
] as const;
export const targetRaceDistanceSchema = z.enum(TARGET_RACE_DISTANCES);
export type TargetRaceDistance = z.infer<typeof targetRaceDistanceSchema>;

/**
 * Sport and distance in metres of the race created from each choice. The
 * app sends a translated name; `name` is the fallback of older clients.
 */
export const TARGET_RACE_PRESETS: Record<
  TargetRaceDistance,
  { sport: SPORT_TYPE; distance: number | null; name: string }
> = {
  '5K': { sport: SPORT_TYPE.RUNNING, distance: 5000, name: '5K' },
  '10K': { sport: SPORT_TYPE.RUNNING, distance: 10000, name: '10K' },
  HALF_MARATHON: {
    sport: SPORT_TYPE.RUNNING,
    distance: 21097.5,
    name: 'Half marathon',
  },
  MARATHON: { sport: SPORT_TYPE.RUNNING, distance: 42195, name: 'Marathon' },
  TRAIL: { sport: SPORT_TYPE.TRAIL_RUNNING, distance: null, name: 'Trail' },
  TRIATHLON: {
    sport: SPORT_TYPE.TRIATHLON,
    distance: null,
    name: 'Triathlon',
  },
  OTHER: { sport: SPORT_TYPE.RUNNING, distance: null, name: 'Race' },
};

/** A race the athlete is preparing, added to their calendar */
export const targetRaceSchema = z.object({
  distance: targetRaceDistanceSchema,
  /** Day of the race on the athlete's calendar (YYYY-MM-DD) */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Shown as the event title; a default comes from the distance */
  name: z.string().trim().min(1).max(120).optional(),
});
export type TargetRaceDto = z.infer<typeof targetRaceSchema>;

/** What the athlete and coach told us about their training */
export const trainingProfileSchema = z.object({
  practicedSports: practicedSportsSchema.optional(),
  trainingGoal: trainingGoalSchema.nullable().optional(),
  weeklyTrainingHours: weeklyTrainingHoursSchema.nullable().optional(),
  coachTeamSize: coachTeamSizeSchema.nullable().optional(),
});
export type TrainingProfileDto = z.infer<typeof trainingProfileSchema>;
