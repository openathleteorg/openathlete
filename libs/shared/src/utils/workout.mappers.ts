import {
  Workout,
  WorkoutRepeat,
  WorkoutStep,
  WorkoutStepTarget,
} from '@openathlete/database';

import {
  type CreateWorkoutDto,
  type CreateWorkoutStepDto,
  type UpdateWorkoutDto,
  type WorkoutDto,
  type WorkoutRepeatDto,
  type WorkoutStepDto,
  type WorkoutStepTargetDto,
} from '../types/dtos/core/workout.dto';
import {
  SPORT_TYPE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
} from '../types/misc';
import type {
  NormalizedWorkout,
  NormalizedWorkoutStep,
  NormalizedWorkoutStepTarget,
} from '../types/workout-normalized';

// ----------------------------------------------------------------------------
// Normalization helpers (camelCase DTOs → clean Create DTOs)
// ----------------------------------------------------------------------------

function normalizeTarget(
  target: Partial<WorkoutStepTargetDto>,
): WorkoutStepTargetDto {
  return {
    workoutStepTargetId: target.workoutStepTargetId,
    targetType: target.targetType!,
    targetMin: target.targetMin ?? null,
    targetMax: target.targetMax ?? null,
    targetValue: target.targetValue ?? null,
    metricType: target.metricType ?? null,
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
    targets: (step.targets || []).map((t: Partial<WorkoutStepTargetDto>) =>
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
    } as WorkoutRepeatDto;
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

function mapTargetToPrismaCreate(target: WorkoutStepTargetDto) {
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
    metric_type: target.metricType || null,
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

function mapPrismaTargetToDto(target: WorkoutStepTarget): WorkoutStepTargetDto {
  return {
    workoutStepTargetId: target.workoutStepTargetId,
    targetType: target.targetType,
    targetMin: target.targetMin ?? null,
    targetMax: target.targetMax ?? null,
    targetValue: target.targetValue ?? null,
    metricType: target.metricType ?? null,
    stepId: target.stepId,
    createdAt: target.createdAt ? new Date(target.createdAt) : undefined,
    updatedAt: target.updatedAt ? new Date(target.updatedAt) : undefined,
  } as WorkoutStepTargetDto;
}

function mapPrismaStepToDto(
  step: WorkoutStep & {
    targets?: WorkoutStepTarget[];
    repeatBlock?: WorkoutRepeat & { childSteps: WorkoutStep[] };
  },
): WorkoutStepDto {
  const dto: WorkoutStepDto = {
    workoutStepId: step.workoutStepId,
    orderIndex: step.orderIndex,
    stepType: step.stepType,
    name: step.name ?? null,
    notes: step.notes ?? null,
    durationType: step.durationType,
    durationValue: step.durationValue ?? null,
    durationTarget: step.durationTarget ?? null,
    workoutId: step.workoutId ?? undefined,
    repeatParentId: step.repeatParentId ?? undefined,
    targets: (step.targets || []).map(mapPrismaTargetToDto),
    repeatBlock: step.repeatBlock
      ? {
          workoutRepeatId: step.repeatBlock.workoutRepeatId,
          repetitions: step.repeatBlock.repetitions,
          stepId: step.repeatBlock.stepId,
          childSteps: (step.repeatBlock.childSteps || []).map(
            mapPrismaStepToDto,
          ),
          createdAt: step.repeatBlock.createdAt
            ? new Date(step.repeatBlock.createdAt)
            : undefined,
          updatedAt: step.repeatBlock.updatedAt
            ? new Date(step.repeatBlock.updatedAt)
            : undefined,
        }
      : null,
    createdAt: step.createdAt ? new Date(step.createdAt) : undefined,
    updatedAt: step.updatedAt ? new Date(step.updatedAt) : undefined,
  } as WorkoutStepDto;

  return dto;
}

export function mapPrismaWorkoutToDto(
  prismaWorkout: Workout & { steps: WorkoutStep[] },
): WorkoutDto {
  return {
    workoutId: prismaWorkout.workoutId,
    eventTrainingId: prismaWorkout.eventTrainingId,
    steps: (prismaWorkout.steps || []).map((s) => mapPrismaStepToDto(s)),
    createdAt: prismaWorkout.createdAt
      ? new Date(prismaWorkout.createdAt)
      : undefined,
    updatedAt: prismaWorkout.updatedAt
      ? new Date(prismaWorkout.updatedAt)
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
    // Sort child steps by their orderIndex to ensure correct order within repeat block
    const sortedChildren = [...(step.repeatBlock.childSteps || [])].sort(
      (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
    );
    for (let i = 0; i < reps; i += 1) {
      for (const child of sortedChildren) {
        flattenStep(child as WorkoutStepDto, accumulator);
      }
    }
    return;
  }

  const targets: NormalizedWorkoutStepTarget[] = (step.targets || []).map(
    (t: WorkoutStepTargetDto) => ({
      targetType: t.targetType,
      targetMin: t.targetMin ?? null,
      targetMax: t.targetMax ?? null,
      targetValue: t.targetValue ?? null,
      metricType: t.metricType ?? null,
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

  // Sort top-level steps by orderIndex before flattening
  const sortedSteps = [...(input.workout.steps || [])].sort(
    (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
  );

  for (const step of sortedSteps) {
    flattenStep(step as WorkoutStepDto, flatSteps);
  }

  // Assign new sequential orderIndex values (do NOT sort - flatten order is correct)
  // The flattenStep function already pushes steps in the correct execution order
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
