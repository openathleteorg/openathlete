import {
  workout,
  workout_repeat,
  workout_step,
  workout_step_target,
} from '@openathlete/database';

import {
  type CreateWorkoutDto,
  type CreateWorkoutStepDto,
  type UpdateWorkoutDto,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  type WorkoutDto,
  type WorkoutRepeat,
  type WorkoutStepDto,
  type WorkoutStepTarget,
} from '../types/dtos/core/workout.dto';
import { SPORT_TYPE } from '../types/misc/core/sport-type.enum';
import type {
  NormalizedWorkout,
  NormalizedWorkoutStep,
  NormalizedWorkoutStepTarget,
} from '../types/workout-normalized';

// ----------------------------------------------------------------------------
// Normalization helpers (camelCase DTOs → clean Create DTOs)
// ----------------------------------------------------------------------------

function normalizeTarget(
  target: Partial<WorkoutStepTarget>,
): WorkoutStepTarget {
  return {
    workoutStepTargetId: target.workoutStepTargetId,
    targetType: target.targetType!,
    targetMin: target.targetMin ?? null,
    targetMax: target.targetMax ?? null,
    targetValue: target.targetValue ?? null,
    stepId: target.stepId,
    createdAt: target.createdAt,
    updatedAt: target.updatedAt,
  };
}

function normalizeStepForCreate(
  step: Partial<WorkoutStepDto>,
): CreateWorkoutStepDto {
  const base: CreateWorkoutStepDto = {
    stepType: step.stepType || WORKOUT_STEP_TYPE.STEADY,
    name: step.name ?? null,
    durationType: step.durationType || WORKOUT_DURATION_TYPE.OPEN,
    durationValue: step.durationValue ?? null,
    repeatTimes: null,
    restTime: null,
    notes: step.notes ?? null,
    targets: (step.targets || []).map((t: Partial<WorkoutStepTarget>) =>
      normalizeTarget(t),
    ),
    childSteps: undefined,
    repeatBlock: undefined,
  };

  // Prefer repeatBlock shape if present
  if (step.repeatBlock) {
    base.repeatBlock = {
      repetitions: step.repeatBlock.repetitions,
      childSteps: (step.repeatBlock.childSteps || []).map(
        (c: Partial<WorkoutStepDto>) => normalizeStepForCreate(c),
      ),
    };
  }

  // Legacy childSteps (without repeatBlock wrapper)
  if (!base.repeatBlock && step.childSteps) {
    base.repeatBlock = {
      repetitions: step.repeatTimes || 1,
      childSteps: (step.childSteps || []).map((c: Partial<WorkoutStepDto>) =>
        normalizeStepForCreate(c),
      ),
    } as WorkoutRepeat;
  }

  return base;
}

export function normalizeWorkoutForCreate(dto: {
  steps: Partial<WorkoutStepDto>[];
}): CreateWorkoutDto {
  return {
    steps: (dto.steps || []).map((s) => normalizeStepForCreate(s)),
  };
}

// ----------------------------------------------------------------------------
// Prisma mapping (DTOs → Prisma create/update inputs)
// Note: We use the current keys expected by the API service to avoid breaking changes.
// ----------------------------------------------------------------------------

// DB-supported enums (mirror prisma enums)
const SUPPORTED_TARGET_TYPES = new Set([
  'OPEN',
  'PACE',
  'HEARTRATE',
  'POWER',
  'CADENCE',
  'RPE',
  'WEIGHT',
  'ZONE',
]);

function mapTargetToPrismaCreate(target: WorkoutStepTarget) {
  if (!SUPPORTED_TARGET_TYPES.has(target.targetType)) {
    return null;
  }
  const toNum = (v: number | null | undefined | string): number | null =>
    v === null || v === undefined || v === '' || Number.isNaN(Number(v))
      ? null
      : Number(v);
  return {
    target_type: target.targetType,
    target_min: toNum(target.targetMin),
    target_max: toNum(target.targetMax),
    target_value: toNum(target.targetValue),
  };
}

function mapStepToPrismaCreate(step: CreateWorkoutStepDto, index?: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const base: any = {
    order_index: typeof index === 'number' ? index : 0,
    step_type: step.stepType,
    name: step.name ?? null,
    duration_type: step.durationType ?? WORKOUT_DURATION_TYPE.OPEN,
    duration_value: step.durationValue ?? null,
    notes: step.notes ?? null,
    targets: {
      create: (step.targets || [])
        .map(mapTargetToPrismaCreate)
        .filter((t) => t !== null),
    },
  };

  if (step.repeatBlock && step.repeatBlock.childSteps?.length) {
    base.repeat_block = {
      create: {
        repetitions: step.repeatBlock.repetitions,
        child_steps: {
          create: step.repeatBlock.childSteps.map((child, childIdx) => ({
            ...mapStepToPrismaCreate(child, childIdx),
          })),
        },
      },
    };
  }

  return base;
}

export function mapWorkoutDtoToPrisma(
  data: CreateWorkoutDto | UpdateWorkoutDto,
) {
  if (!('steps' in data) || !data.steps) return {};
  return {
    steps: {
      create: data.steps.map((s, idx) => mapStepToPrismaCreate(s, idx)),
    },
  };
}

// ----------------------------------------------------------------------------
// Prisma → DTO mapping (snake_case → camelCase)
// ----------------------------------------------------------------------------

function mapPrismaTargetToDto(target: workout_step_target): WorkoutStepTarget {
  return {
    workoutStepTargetId: target.workout_step_target_id,
    targetType: target.target_type,
    targetMin: target.target_min ?? null,
    targetMax: target.target_max ?? null,
    targetValue: target.target_value ?? null,
    stepId: target.step_id,
    createdAt: target.created_at ? new Date(target.created_at) : undefined,
    updatedAt: target.updated_at ? new Date(target.updated_at) : undefined,
  } as WorkoutStepTarget;
}

function mapPrismaStepToDto(
  step: workout_step & {
    targets?: workout_step_target[];
    repeat_block?: workout_repeat & { child_steps: workout_step[] };
  },
): WorkoutStepDto {
  const dto: WorkoutStepDto = {
    workoutStepId: step.workout_step_id,
    orderIndex: step.order_index,
    stepType: step.step_type,
    name: step.name ?? null,
    notes: step.notes ?? null,
    durationType: step.duration_type,
    durationValue: step.duration_value ?? null,
    durationTarget: step.duration_target ?? null,
    workoutId: step.workout_id ?? undefined,
    repeatParentId: step.repeat_parent_id ?? undefined,
    targets: (step.targets || []).map(mapPrismaTargetToDto),
    repeatBlock: step.repeat_block
      ? {
          workoutRepeatId: step.repeat_block.workout_repeat_id,
          repetitions: step.repeat_block.repetitions,
          stepId: step.repeat_block.step_id,
          childSteps: (step.repeat_block.child_steps || []).map(
            mapPrismaStepToDto,
          ),
          createdAt: step.repeat_block.created_at
            ? new Date(step.repeat_block.created_at)
            : undefined,
          updatedAt: step.repeat_block.updated_at
            ? new Date(step.repeat_block.updated_at)
            : undefined,
        }
      : null,
    createdAt: step.created_at ? new Date(step.created_at) : undefined,
    updatedAt: step.updated_at ? new Date(step.updated_at) : undefined,
  } as WorkoutStepDto;

  return dto;
}

export function mapPrismaWorkoutToDto(
  prismaWorkout: workout & { steps: workout_step[] },
): WorkoutDto {
  return {
    workoutId: prismaWorkout.workout_id,
    eventTrainingId: prismaWorkout.event_training_id,
    steps: (prismaWorkout.steps || []).map((s) => mapPrismaStepToDto(s)),
    createdAt: prismaWorkout.created_at
      ? new Date(prismaWorkout.created_at)
      : undefined,
    updatedAt: prismaWorkout.updated_at
      ? new Date(prismaWorkout.updated_at)
      : undefined,
  } as WorkoutDto;
}

// ----------------------------------------------------------------------------
// Normalization for provider export (flatten repeats)
// ----------------------------------------------------------------------------

function flattenStep(
  step: WorkoutStepDto,
  accumulator: NormalizedWorkoutStep[],
): void {
  if (step.stepType === WORKOUT_STEP_TYPE.REPEAT && step.repeatBlock) {
    const reps = step.repeatBlock.repetitions || 1;
    for (let i = 0; i < reps; i += 1) {
      for (const child of step.repeatBlock.childSteps || []) {
        flattenStep(child as WorkoutStepDto, accumulator);
      }
    }
    return;
  }

  const targets: NormalizedWorkoutStepTarget[] = (step.targets || []).map(
    (t: WorkoutStepTarget) => ({
      targetType: t.targetType,
      targetMin: t.targetMin ?? null,
      targetMax: t.targetMax ?? null,
      targetValue: t.targetValue ?? null,
    }),
  );

  const normalized: NormalizedWorkoutStep = {
    orderIndex: step.orderIndex,
    stepType: step.stepType,
    name: step.name ?? null,
    notes: step.notes ?? null,
    durationType: step.durationType,
    durationValue: step.durationValue ?? null,
    durationTarget: step.durationTarget ?? null,
    targets,
  };

  accumulator.push(normalized);
}

export function normalizeWorkoutForExport(input: {
  sport: SPORT_TYPE;
  title?: string | null;
  description?: string | null;
  workout: WorkoutDto;
}): NormalizedWorkout {
  const flatSteps: NormalizedWorkoutStep[] = [];
  for (const step of input.workout.steps || []) {
    flattenStep(step as WorkoutStepDto, flatSteps);
  }

  // Recompute orderIndex after flatten to ensure monotonic order
  flatSteps.sort((a, b) => a.orderIndex - b.orderIndex);
  flatSteps.forEach((s, idx) => {
    s.orderIndex = idx;
  });

  return {
    sport: input.sport,
    title: input.title ?? null,
    description: input.description ?? null,
    steps: flatSteps,
  };
}
