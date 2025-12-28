import {
  type ActivityFeedbackQuestion as PrismaActivityFeedbackQuestion,
  type ActivitySegment as PrismaActivitySegment,
  type Athlete as PrismaAthlete,
  type AthleteSettings as PrismaAthleteSettings,
  ConnectorProvider as PrismaConnectorProvider,
  type Cycle as PrismaCycle,
  type Equipment as PrismaEquipment,
  Event as PrismaEvent,
  type EventActivity as PrismaEventActivity,
  type EventCompetition as PrismaEventCompetition,
  type EventNote as PrismaEventNote,
  type EventTemplate as PrismaEventTemplate,
  type EventTemplateFolder as PrismaEventTemplateFolder,
  type EventTraining as PrismaEventTraining,
  type Record as PrismaRecord,
  type TrainingZone as PrismaTrainingZone,
  type TrainingZoneValue as PrismaTrainingZoneValue,
  type User as PrismaUser,
  UserRole as PrismaUserRole,
  type Workout as PrismaWorkout,
  type WorkoutRepeat as PrismaWorkoutRepeat,
  type WorkoutStep as PrismaWorkoutStep,
  type WorkoutStepTarget as PrismaWorkoutStepTarget,
} from '@openathlete/database';

import { EQUIPMENT_TYPE, EVENT_TYPE, SPORT_TYPE } from '../types/misc';

export type UserRole = PrismaUserRole;

export type ConnectorProvider = PrismaConnectorProvider;

export type TrainingZone = PrismaTrainingZone;

export type TrainingZoneValue = PrismaTrainingZoneValue;

export interface User extends PrismaUser {
  roles: UserRole[];
  athlete?: Athlete;
}

export type Record = PrismaRecord;

export interface Equipment extends PrismaEquipment {
  type: EQUIPMENT_TYPE;
  sports: SPORT_TYPE[];
}

export interface Athlete extends PrismaAthlete {
  user?: User;
  settings?: AthleteSettings;
}

export type AthleteSettings = PrismaAthleteSettings;

export interface WorkoutStep extends PrismaWorkoutStep {
  targets: WorkoutStepTarget[];
  activitySegments: ActivitySegment[];
  repeatParent?: WorkoutRepeat;
  repeatBlock?: WorkoutRepeat;
}

export interface WorkoutRepeat extends PrismaWorkoutRepeat {
  step: WorkoutStep;
  childSteps: WorkoutStep[];
}

export interface WorkoutStepTarget extends PrismaWorkoutStepTarget {
  step: WorkoutStep;
}

export interface Workout extends PrismaWorkout {
  steps: WorkoutStep[];
}

export type TrainingEvent = Omit<PrismaEventTraining, 'sport'> &
  Omit<PrismaEvent, 'type' | 'sport'> & {
    type: EVENT_TYPE.TRAINING;
    sport: SPORT_TYPE;
    relatedActivity?: ActivityEvent;
    workout?: Workout;
  };

export type CompetitionEvent = Omit<PrismaEvent, 'type' | 'sport'> &
  Omit<PrismaEventCompetition, 'sport'> & {
    type: EVENT_TYPE.COMPETITION;
    sport: SPORT_TYPE;
    relatedActivity?: ActivityEvent;
  };

export type NoteEvent = PrismaEventNote &
  Omit<PrismaEvent, 'type'> & {
    type: EVENT_TYPE.NOTE;
  };

export interface ActivitySegment extends PrismaActivitySegment {
  workoutStep?: WorkoutStep;
}

export type ActivityFeedbackQuestion = PrismaActivityFeedbackQuestion;

export type ActivityEvent = Omit<
  PrismaEvent,
  'type' | 'activity' | 'training' | 'competition' | 'note'
> &
  Omit<PrismaEventActivity, 'event' | 'sport'> & {
    type: EVENT_TYPE.ACTIVITY;
    sport: SPORT_TYPE;
    records?: Record[];
    equipment?: Equipment;
    segments?: ActivitySegment[];
    feedbackQuestions?: ActivityFeedbackQuestion[];
  };

export type Event =
  | TrainingEvent
  | CompetitionEvent
  | NoteEvent
  | ActivityEvent;

export interface EventTemplate extends PrismaEventTemplate {
  event?: Event;
  folder?: EventTemplateFolder;
}

export interface EventTemplateFolder extends PrismaEventTemplateFolder {
  _count?: {
    eventTemplates: number;
    childFolders: number;
  };
}

export interface Cycle extends PrismaCycle {
  athlete?: Athlete;
}
