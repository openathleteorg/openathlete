import { m } from '@/paraglide/messages';

import {
  CoachTeamSize,
  TargetRaceDistance,
  TrainingGoal,
  WeeklyTrainingHours,
} from '@openathlete/shared';

export const RACE_DISTANCE_LABELS: Record<TargetRaceDistance, () => string> = {
  '5K': m.onboarding_race_5k,
  '10K': m.onboarding_race_10k,
  HALF_MARATHON: m.onboarding_race_half_marathon,
  MARATHON: m.onboarding_race_marathon,
  TRAIL: m.onboarding_race_trail,
  TRIATHLON: m.onboarding_race_triathlon,
  OTHER: m.onboarding_race_other,
};

export const TEAM_LABELS: Record<CoachTeamSize, () => string> = {
  STARTING: m.onboarding_team_starting,
  FROM_1_TO_5: m.onboarding_team_1_5,
  FROM_6_TO_20: m.onboarding_team_6_20,
  OVER_20: m.onboarding_team_over_20,
};

export const HOURS_LABELS: Record<WeeklyTrainingHours, () => string> = {
  UNDER_3: m.onboarding_hours_under_3,
  FROM_3_TO_6: m.onboarding_hours_3_6,
  FROM_6_TO_10: m.onboarding_hours_6_10,
  OVER_10: m.onboarding_hours_over_10,
};

export const GOAL_LABELS: Record<TrainingGoal, () => string> = {
  RACE: m.onboarding_goal_race_title,
  PROGRESS: m.onboarding_goal_progress_title,
  RESTART: m.onboarding_goal_restart_title,
  FOLLOW_COACH: m.onboarding_goal_follow_coach_title,
};
