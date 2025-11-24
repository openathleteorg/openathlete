export interface GarminWorkout {
  ownerId?: number;
  workoutName: string;
  description: string;
  sport: string;
  poolLength: number | null;
  poolLengthUnit: 'YARD' | 'METER' | null;
  workoutProvider: string;
  workoutSourceId: string;
  isSessionTransitionEnabled: boolean;
  segments: GarminSegment[];
}

export interface GarminSegment {
  segmentOrder: number;
  sport: string;
  poolLength: number | null;
  poolLengthUnit: 'YARD' | 'METER' | null;
  steps: GarminStep[];
}

export type GarminStep = GarminWorkoutStep | GarminWorkoutRepeatStep;

export interface GarminWorkoutStep {
  type: 'WorkoutStep';
  stepOrder: number;
  intensity: string;
  description: string | null;
  durationType: string;
  durationValue: number | null;
  durationValueType: string | null;
  targetType: string | null;
  targetValue: number | null;
  targetValueLow: number | null;
  targetValueHigh: number | null;
  targetValueType: string | null;
  secondaryTargetType: string | null;
  secondaryTargetValue: number | null;
  secondaryTargetValueLow: number | null;
  secondaryTargetValueHigh: number | null;
  secondaryTargetValueType: string | null;
  strokeType: string | null;
  drillType: string | null;
  equipmentType: string | null;
  exerciseCategory: string | null;
  weightValue: number | null;
  weightDisplayUnit: string | null;
}

export interface GarminWorkoutRepeatStep {
  type: 'WorkoutRepeatStep';
  stepOrder: number;
  repeatType: string;
  repeatValue: number;
  skipLastRestStep: boolean;
  steps: GarminWorkoutStep[];
}
