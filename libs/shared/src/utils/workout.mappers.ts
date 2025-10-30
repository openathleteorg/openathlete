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

// ----------------------------------------------------------------------------
// Normalization helpers (camelCase DTOs → clean Create DTOs)
// ----------------------------------------------------------------------------

function normalizeTarget(
  target: Partial<WorkoutStepTarget>,
): WorkoutStepTarget {
  return {
    workoutStepTargetId: target.workoutStepTargetId,
    targetType: target.targetType!,
    targetZone: target.targetZone ?? null,
    targetMin: target.targetMin ?? null,
    targetMax: target.targetMax ?? null,
    targetValue: target.targetValue ?? null,
    unit: target.unit ?? null,
    stepId: target.stepId,
    createdAt: target.createdAt,
    updatedAt: target.updatedAt,
  };
}

function normalizeStepForCreate(
  step: Partial<WorkoutStepDto>,
): CreateWorkoutStepDto {
  const base: CreateWorkoutStepDto = {
    stepType: (step.stepType || WORKOUT_STEP_TYPE.STEADY) as any,
    name: step.name ?? null,
    durationType: (step.durationType || WORKOUT_DURATION_TYPE.OPEN) as any,
    durationValue: step.durationValue ?? null,
    repeatTimes: null,
    restTime: null,
    notes: step.notes ?? null,
    targets: (step.targets || []).map((t: Partial<WorkoutStepTarget>) =>
      normalizeTarget(t),
    ) as any,
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
  if (!base.repeatBlock && (step as any).childSteps) {
    base.repeatBlock = {
      repetitions: (step as any).repeatTimes || 1,
      childSteps: ((step as any).childSteps || []).map(
        (c: Partial<WorkoutStepDto>) => normalizeStepForCreate(c),
      ),
    } as WorkoutRepeat as any;
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

// DB-supported enums (mirror prisma enums). Strength extras are not supported in DB yet.
const SUPPORTED_TARGET_TYPES = new Set([
  'OPEN',
  'PACE',
  'SPEED',
  'HEARTRATE',
  'POWER',
  'CADENCE',
  'RPE',
]);
const SUPPORTED_UNITS = new Set([
  'MIN_PER_KM',
  'M_PER_S',
  'KM_PER_H',
  'BPM',
  'PERCENT_MAX_HR',
  'WATTS',
  'PERCENT_FTP',
  'RPM',
  'SPM',
  'RPE_SCALE',
]);

function mapTargetToPrismaCreate(target: any) {
  // Skip unsupported target types (e.g., WEIGHT, REPS_TARGET) until DB supports them
  if (!SUPPORTED_TARGET_TYPES.has(target.targetType)) {
    return null;
  }
  const unit = SUPPORTED_UNITS.has(target.unit) ? target.unit : null;
  return {
    target_type: target.targetType,
    target_unit: unit,
    target_min_value: target.targetMin ?? null,
    target_max_value: target.targetMax ?? null,
    target_value: target.targetValue ?? null,
  };
}

function mapStepToPrismaCreate(
  step: CreateWorkoutStepDto,
  index?: number,
): any {
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
        .filter((t: any) => t !== null),
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
): any {
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

function mapPrismaTargetToDto(target: any): WorkoutStepTarget {
  return {
    workoutStepTargetId: target.workout_step_target_id,
    targetType: target.target_type,
    targetZone: target.target_zone ?? null,
    targetMin: target.target_min ?? target.target_min_value ?? null,
    targetMax: target.target_max ?? target.target_max_value ?? null,
    targetValue: target.target_value ?? null,
    unit: target.unit ?? target.target_unit ?? null,
    stepId: target.step_id,
    createdAt: target.created_at ? new Date(target.created_at) : undefined,
    updatedAt: target.updated_at ? new Date(target.updated_at) : undefined,
  } as WorkoutStepTarget;
}

function mapPrismaStepToDto(step: any): WorkoutStepDto {
  const dto: WorkoutStepDto = {
    workoutStepId: step.workout_step_id,
    orderIndex: step.order_index,
    stepType: step.step_type,
    name: step.name ?? null,
    exerciseName: step.exercise_name ?? null,
    notes: step.notes ?? null,
    durationType: step.duration_type,
    durationValue: step.duration_value ?? null,
    durationTarget: step.duration_target ?? null,
    workoutId: step.workout_id ?? undefined,
    repeatParentId: step.repeat_parent_id ?? null,
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

export function mapPrismaWorkoutToDto(prismaWorkout: any): WorkoutDto {
  return {
    workoutId: prismaWorkout.workout_id,
    estimatedDuration: prismaWorkout.estimated_duration ?? null,
    totalDistance: prismaWorkout.total_distance ?? null,
    eventTrainingId: prismaWorkout.event_training_id,
    steps: (prismaWorkout.steps || []).map(mapPrismaStepToDto),
    createdAt: prismaWorkout.created_at
      ? new Date(prismaWorkout.created_at)
      : undefined,
    updatedAt: prismaWorkout.updated_at
      ? new Date(prismaWorkout.updated_at)
      : undefined,
  } as WorkoutDto;
}
