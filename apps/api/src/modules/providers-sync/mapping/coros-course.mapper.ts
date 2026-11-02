import { SportType } from '@openathlete/database';
import type { WorkoutDto, WorkoutStepDto } from '@openathlete/shared';
import { WORKOUT_DURATION_TYPE, WORKOUT_STEP_TYPE } from '@openathlete/shared';

import type { SuuntoGuideContext } from './suunto-guide.mapper';
import { mapTargetToSuunto } from './suunto-guide.mapper';
import { truncateText } from './suunto-helpers';

/**
 * The `course` of the COROS tools. Its rules live in the tool descriptions
 * only, where the MCP server can tighten them, and a bad course can't be
 * deleted from the calendar: anything out of bounds stays out of it.
 */
export const COROS_SPORT = {
  RUNNING: 1,
  CYCLING: 2,
  TRAIL_RUNNING: 5,
} as const;

const SECTION_TYPE = { WARMUP: 1, TRAINING: 2, RECOVERY: 3, COOLDOWN: 4 };
const TARGET_TYPE = { DISTANCE: 1, TIME: 2, FREE: 4 };
const INTENSITY_TYPE = { HEART_RATE: 1, PACE: 2, POWER: 4 };

const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_REPEATS = 20;

const bpm: [number, number] = [30, 240];
const watts: [number, number] = [10, 2000];
const secondsPerKm: [number, number] = [120, 1499];

export interface CorosSection {
  sectionType: number;
  targetType: number;
  targetValue?: number;
  intensityType?: number;
  intensityValueStart?: number;
  intensityValueEnd?: number;
}

export interface CorosGroup {
  intervalGroup: true;
  repeats: number;
  sets: CorosSection[];
}

export interface CorosCourse {
  sportType: number;
  courseName: string;
  courseDescription: string;
  sections: (CorosSection | CorosGroup)[];
}

const CYCLING_SPORTS: SportType[] = [
  SportType.CYCLING,
  SportType.MOUNTAIN_BIKE_RIDE,
  SportType.GRAVEL_RIDE,
  SportType.E_BIKE_RIDE,
  SportType.E_MOUNTAIN_BIKE_RIDE,
  SportType.VIRTUAL_RIDE,
];

/** COROS creates running, trail running and cycling workouts only */
export function corosSportType(sport: SportType): number | null {
  if (sport === SportType.RUNNING || sport === SportType.VIRTUAL_RUN) {
    return COROS_SPORT.RUNNING;
  }
  if (sport === SportType.TRAIL_RUNNING) return COROS_SPORT.TRAIL_RUNNING;
  return CYCLING_SPORTS.includes(sport) ? COROS_SPORT.CYCLING : null;
}

type Range = { min?: number; max?: number; value?: number };

/** COROS takes ranges only: a single value gets a small margin around it */
function toRange({ min, max, value }: Range, margin: number): [number, number] {
  return min !== undefined && max !== undefined
    ? [min, max]
    : [(value ?? 0) - margin, (value ?? 0) + margin];
}

function inBounds(values: number[], low: number, high: number) {
  return values.every((value) => value >= low && value <= high);
}

function mapIntensity(
  step: WorkoutStepDto,
  sport: SportType,
  sportType: number,
  context: SuuntoGuideContext,
): { intensity: Partial<CorosSection>; note: string | null } {
  const target = step.targets?.[0];
  const { field, label } = mapTargetToSuunto(target, sport, context);
  const fallback = { intensity: {}, note: label };
  if (!field) return fallback;

  if (field.type === 'targetHeartRate' || field.type === 'targetPower') {
    const heartRate = field.type === 'targetHeartRate';
    const [start, end] = toRange(field, heartRate ? 2 : 5).map(Math.round);
    if (!inBounds([start, end], ...(heartRate ? bpm : watts))) return fallback;
    return {
      intensity: {
        intensityType: heartRate
          ? INTENSITY_TYPE.HEART_RATE
          : INTENSITY_TYPE.POWER,
        intensityValueStart: start,
        intensityValueEnd: end,
      },
      note: null,
    };
  }

  // COROS has no pace target on a bike, which the description keeps
  if (field.type === 'targetPace' && sportType !== COROS_SPORT.CYCLING) {
    // Speeds in m/s to whole s/km, slow to fast as COROS writes them
    const [slow, fast] = toRange(field, 0.02).map((speed) =>
      Math.round(1000 / speed),
    );
    if (!inBounds([slow, fast], ...secondsPerKm)) return fallback;
    return {
      intensity: {
        intensityType: INTENSITY_TYPE.PACE,
        intensityValueStart: slow,
        intensityValueEnd: fast,
      },
      note: null,
    };
  }
  return fallback;
}

function sectionType(step: WorkoutStepDto, inGroup: boolean): number {
  if (step.stepType === WORKOUT_STEP_TYPE.INTERVAL_REST) {
    return SECTION_TYPE.RECOVERY;
  }
  if (inGroup) return SECTION_TYPE.TRAINING;
  if (step.stepType === WORKOUT_STEP_TYPE.WARMUP) return SECTION_TYPE.WARMUP;
  if (step.stepType === WORKOUT_STEP_TYPE.COOLDOWN) {
    return SECTION_TYPE.COOLDOWN;
  }
  return SECTION_TYPE.TRAINING;
}

/** Whole meters or seconds; anything else ends on the lap button */
function mapGoal(step: WorkoutStepDto): Partial<CorosSection> {
  const value = Math.round(step.durationValue ?? 0);
  if (value > 0 && step.durationType === WORKOUT_DURATION_TYPE.TIME) {
    return { targetType: TARGET_TYPE.TIME, targetValue: value };
  }
  if (value > 0 && step.durationType === WORKOUT_DURATION_TYPE.DISTANCE) {
    return { targetType: TARGET_TYPE.DISTANCE, targetValue: value };
  }
  return { targetType: TARGET_TYPE.FREE };
}

const byOrder = (a: WorkoutStepDto, b: WorkoutStepDto) =>
  a.orderIndex - b.orderIndex;

export function mapWorkoutToCorosCourse(
  workout: WorkoutDto,
  sport: SportType,
  title: string | null,
  description: string | null,
  context: SuuntoGuideContext = {},
): CorosCourse | null {
  let sportType = corosSportType(sport);
  if (sportType === null) return null;

  // Trail has no time targets. A run that moves on by itself is closer to the
  // plan than a trail session the athlete steps through by hand
  const steps = [...(workout.steps || [])].sort(byOrder);
  const allSteps = steps.flatMap((step) =>
    step.stepType === WORKOUT_STEP_TYPE.REPEAT
      ? (step.repeatBlock?.childSteps ?? [])
      : [step],
  );
  if (
    sportType === COROS_SPORT.TRAIL_RUNNING &&
    allSteps.some((step) => mapGoal(step).targetType === TARGET_TYPE.TIME)
  ) {
    sportType = COROS_SPORT.RUNNING;
  }

  const notes: string[] = [];
  const toSection = (step: WorkoutStepDto, inGroup: boolean): CorosSection => {
    const { intensity, note } = mapIntensity(step, sport, sportType, context);
    if (note) notes.push(note);
    return {
      sectionType: sectionType(step, inGroup),
      ...(mapGoal(step) as Pick<CorosSection, 'targetType'>),
      ...intensity,
    };
  };

  const sections: CorosCourse['sections'] = [];
  for (const step of steps) {
    if (step.stepType !== WORKOUT_STEP_TYPE.REPEAT) {
      sections.push(toSection(step, false));
      continue;
    }
    const sets = [...(step.repeatBlock?.childSteps ?? [])]
      .filter((child) => child.stepType !== WORKOUT_STEP_TYPE.REPEAT)
      .sort(byOrder)
      .map((child) => toSection(child, true));
    if (sets.length === 0) continue;
    // Longer repeats continue in further groups
    let left = Math.max(1, Math.round(step.repeatBlock?.repetitions || 1));
    while (left > 0) {
      const repeats = Math.min(left, MAX_REPEATS);
      sections.push({ intervalGroup: true, repeats, sets });
      left -= repeats;
    }
  }
  if (sections.length === 0) return null;

  const courseName = truncateText(title, MAX_NAME_LENGTH) || 'Workout';
  const targets = [...new Set(notes)].join(', ');
  return {
    sportType,
    courseName,
    courseDescription:
      truncateText(
        [description, targets].filter(Boolean).join('\n'),
        MAX_DESCRIPTION_LENGTH,
      ) || courseName,
    sections,
  };
}
