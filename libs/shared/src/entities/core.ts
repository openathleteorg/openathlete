import {
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
  workout_step,
} from '@openathlete/database';

import {
  ACTIVITY_SEGMENT_TYPE,
  EQUIPMENT_TYPE,
  EVENT_TYPE,
  SPORT_TYPE,
} from '../types/misc';
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

export type WorkoutStepEntity = ConvertKeysToCamelCase<workout_step>;

export interface WorkoutEntity extends ConvertKeysToCamelCase<workout> {
  steps: WorkoutStepEntity[];
}

export interface TrainingEvent
  extends ConvertKeysToCamelCase<event_training & event> {
  type: EVENT_TYPE.TRAINING;
  sport: SPORT_TYPE;
  relatedActivity?: ActivityEvent;
  workout?: WorkoutEntity;
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

// ActivitySegment type - will be properly typed after Prisma client generation
export interface ActivitySegment {
  activitySegmentId: number;
  segmentType: ACTIVITY_SEGMENT_TYPE;
  name?: string | null;
  orderIndex: number;
  startTimeSeconds: number;
  endTimeSeconds: number;
  distance?: number | null;
  elevationGain?: number | null;
  movingTime?: number | null;
  averageSpeed?: number | null;
  maxSpeed?: number | null;
  averageCadence?: number | null;
  averageWatts?: number | null;
  maxWatts?: number | null;
  weightedAverageWatts?: number | null;
  averageHeartrate?: number | null;
  maxHeartrate?: number | null;
  kilojoules?: number | null;
  averageGapSpeed?: number | null;
  averageNormalizedSpeed?: number | null;
  eventActivityId: number;
  workoutStepId?: number | null;
  workoutStep?: WorkoutStepEntity;
  createdAt: Date;
  updatedAt: Date;
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
