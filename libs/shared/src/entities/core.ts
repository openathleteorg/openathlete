import {
  activity_segment,
  athlete,
  athlete_settings,
  connector_provider,
  cycle,
  equipment,
  event,
  event_activity,
  event_competition,
  event_note,
  event_template,
  event_template_folder,
  event_training,
  record,
  training_zone,
  training_zone_value,
  user,
  user_role,
  workout,
  workout_repeat,
  workout_step,
  workout_step_target,
} from '@openathlete/database';

import { EQUIPMENT_TYPE, EVENT_TYPE, SPORT_TYPE } from '../types/misc';
import { ConvertKeysToCamelCase } from '../utils/data.mapper';

export type UserRole = ConvertKeysToCamelCase<user_role>;

export type ConnectorProvider = ConvertKeysToCamelCase<connector_provider>;

export type TrainingZone = ConvertKeysToCamelCase<training_zone>;

export type TrainingZoneValue = ConvertKeysToCamelCase<training_zone_value>;

export interface User extends ConvertKeysToCamelCase<user> {
  roles: UserRole[];
  athlete?: Athlete;
}

export type Record = ConvertKeysToCamelCase<record>;

export interface Equipment extends ConvertKeysToCamelCase<equipment> {
  type: EQUIPMENT_TYPE;
  sports: SPORT_TYPE[];
}

export interface Athlete extends ConvertKeysToCamelCase<athlete> {
  user?: User;
  settings?: AthleteSettings;
}

export type AthleteSettings = ConvertKeysToCamelCase<athlete_settings>;

export interface WorkoutStep extends ConvertKeysToCamelCase<workout_step> {
  targets: WorkoutStepTarget[];
  activitySegments: ActivitySegment[];
  repeatParent?: WorkoutRepeat;
  repeatBlock?: WorkoutRepeat;
}

export interface WorkoutRepeat extends ConvertKeysToCamelCase<workout_repeat> {
  step: WorkoutStep;
  childSteps: WorkoutStep[];
}

export interface WorkoutStepTarget
  extends ConvertKeysToCamelCase<workout_step_target> {
  step: WorkoutStep;
}

export interface Workout extends ConvertKeysToCamelCase<workout> {
  steps: WorkoutStep[];
}

export interface TrainingEvent
  extends ConvertKeysToCamelCase<event_training & event> {
  type: EVENT_TYPE.TRAINING;
  sport: SPORT_TYPE;
  relatedActivity?: ActivityEvent;
  workout?: Workout;
}

export interface CompetitionEvent
  extends ConvertKeysToCamelCase<event & event_competition> {
  type: EVENT_TYPE.COMPETITION;
  sport: SPORT_TYPE;
  relatedActivity?: ActivityEvent;
}

export interface NoteEvent extends ConvertKeysToCamelCase<event_note & event> {
  type: EVENT_TYPE.NOTE;
}

export interface ActivitySegment
  extends ConvertKeysToCamelCase<activity_segment> {
  workoutStep?: WorkoutStep;
}

export interface ActivityEvent
  extends ConvertKeysToCamelCase<event & event_activity> {
  type: EVENT_TYPE.ACTIVITY;
  sport: SPORT_TYPE;
  records?: Record[];
  equipment?: Equipment;
  averageGapSpeed: number | null;
  averageNormalizedSpeed: number | null;
  segments?: ActivitySegment[];
}

export type Event =
  | TrainingEvent
  | CompetitionEvent
  | NoteEvent
  | ActivityEvent;

export interface EventTemplate extends ConvertKeysToCamelCase<event_template> {
  event?: Event;
  folder?: EventTemplateFolder;
}

export interface EventTemplateFolder
  extends ConvertKeysToCamelCase<event_template_folder> {
  _count?: {
    eventTemplates: number;
    childFolders: number;
  };
}

export interface Cycle extends ConvertKeysToCamelCase<cycle> {
  athlete?: Athlete;
}
