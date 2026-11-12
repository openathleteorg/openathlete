import type { CreateWorkoutStepDto } from '../../types/dtos/core/workout.dto';
import type { TRAINING_ZONE_TYPE, WORKOUT_STEP_TYPE } from '../../types/misc';
import type { SPORT_TYPE } from '../../types/misc/core/sport-type.enum';
import type { WorkoutTextLocale } from './vocabulary';

/** One of the athlete's zones, as "Z3" names it: index 2 of its type */
export interface WorkoutTextZone {
  trainingZoneId: number;
  type: TRAINING_ZONE_TYPE;
  index: number;
}

export interface WorkoutTextContext {
  sport: SPORT_TYPE;
  /** The session athlete's zones; zone targets cannot be read without them */
  zones?: WorkoutTextZone[];
  /**
   * Type of the steps that do not say theirs, instead of reading it from
   * their place: editing one line keeps the type its step had
   */
  stepType?: WORKOUT_STEP_TYPE;
}

export interface WorkoutTextSerializeOptions extends WorkoutTextContext {
  /** Language of the step type words the text is written with */
  locale?: WorkoutTextLocale;
}

export type WorkoutTextIssueCode =
  | 'unknown_token'
  | 'missing_duration'
  | 'duplicate_duration'
  | 'duplicate_target'
  | 'zone_not_found'
  | 'zone_range'
  | 'ramp_unsupported'
  | 'repetitions_range'
  | 'empty_repeat'
  | 'unclosed_paren'
  | 'invalid_value'
  | 'nested_repeat_expanded'
  | 'ignored_line';

export interface WorkoutTextIssue {
  /** An error drops the step it is on; a warning keeps it */
  severity: 'error' | 'warning';
  code: WorkoutTextIssueCode;
  /** 0-based line, and columns [from, to) on it */
  line: number;
  from: number;
  to: number;
  /** The text the issue is about */
  text?: string;
}

export interface WorkoutTextResult {
  steps: CreateWorkoutStepDto[];
  issues: WorkoutTextIssue[];
}
