import { z } from 'zod';

import { CYCLE_PHASE, PLAN_ANCHOR, PLAN_LEVEL, SPORT_TYPE } from '../../misc';
import {
  planCycleSchema,
  planWeekSchema,
  seoPlanDataSchema,
} from '../seo/seo-plan.dto';

// ============================================================================
// Training plan library
// ============================================================================
// A library plan is laid out by week number and weekday, not by dates: the
// format of the website plans. Applying it to an athlete turns it into
// cycles, weeks and sessions on their calendar.
// ============================================================================

/** Longest plan the library keeps: a season */
export const TRAINING_PLAN_MAX_WEEKS = 52;
/** Most athletes one apply request reaches (a club group) */
export const TRAINING_PLAN_APPLY_MAX_TARGETS = 100;

const dateKey = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a date as YYYY-MM-DD');

/**
 * Cycles of a library plan. Calendar blocks need no phase, and a plan saved
 * from the calendar keeps them as they are.
 */
export const trainingPlanCycleSchema = planCycleSchema.extend({
  description: z.string().default(''),
  phase: z.nativeEnum(CYCLE_PHASE).optional().nullable(),
  weeks: z.array(planWeekSchema).min(1),
});

export type TrainingPlanCycle = z.infer<typeof trainingPlanCycleSchema>;

/** The weeks follow each other in the order of the cycles */
export const trainingPlanContentSchema = z
  .object({ cycles: z.array(trainingPlanCycleSchema).min(1) })
  .refine(
    (content) => countPlanWeeks(content.cycles) <= TRAINING_PLAN_MAX_WEEKS,
    { message: `A plan has at most ${TRAINING_PLAN_MAX_WEEKS} weeks` },
  );

export type TrainingPlanContent = z.infer<typeof trainingPlanContentSchema>;

export function countPlanWeeks(cycles: { weeks: unknown[] }[]): number {
  return cycles.reduce((total, cycle) => total + cycle.weeks.length, 0);
}

const templateFields = {
  name: z.string().trim().min(1).max(120),
  description: z.string().max(5000).default(''),
  goal: z.string().max(200).default(''),
  sport: z.nativeEnum(SPORT_TYPE).optional().nullable(),
  level: z.nativeEnum(PLAN_LEVEL).optional().nullable(),
  folderId: z.number().int().positive().optional().nullable(),
};

/** A plan built from scratch or edited in the plan editor */
export const createTrainingPlanTemplateSchema = z.object({
  ...templateFields,
  content: trainingPlanContentSchema,
});

export type CreateTrainingPlanTemplateDto = z.infer<
  typeof createTrainingPlanTemplateSchema
>;

export const updateTrainingPlanTemplateSchema = z
  .object({
    ...templateFields,
    content: trainingPlanContentSchema,
  })
  .partial();

export type UpdateTrainingPlanTemplateDto = z.infer<
  typeof updateTrainingPlanTemplateSchema
>;

/**
 * A plan saved from a date range of an athlete's calendar: its planned
 * sessions and notes become week and weekday offsets, its blocks the cycles.
 */
export const createTrainingPlanFromCalendarSchema = z
  .object({
    ...templateFields,
    /** Whose calendar; the user's own when omitted */
    athleteId: z.number().int().positive().optional(),
    startDate: dateKey,
    endDate: dateKey,
    /** First day of the plan weeks, 0 = Sunday … 6 = Saturday */
    weekStartsOn: z.number().int().min(0).max(6).default(1),
  })
  .refine((dto) => dto.startDate <= dto.endDate, {
    message: 'startDate must not be after endDate',
    path: ['endDate'],
  });

export type CreateTrainingPlanFromCalendarDto = z.infer<
  typeof createTrainingPlanFromCalendarSchema
>;

/** The file a plan exports to, and imports from, between instances */
export const TRAINING_PLAN_FILE_FORMAT = 'openathlete-training-plan';

export const trainingPlanFileSchema = z.object({
  format: z.literal(TRAINING_PLAN_FILE_FORMAT),
  version: z.literal(1),
  plan: z.object({
    name: templateFields.name,
    description: templateFields.description,
    goal: templateFields.goal,
    sport: templateFields.sport,
    level: templateFields.level,
  }),
  content: trainingPlanContentSchema,
});

export type TrainingPlanFile = z.infer<typeof trainingPlanFileSchema>;

/** An exported plan, or a plan of the website, saved to the library */
export const importTrainingPlanSchema = z.object({
  file: z.union([trainingPlanFileSchema, seoPlanDataSchema]),
  folderId: templateFields.folderId,
});

export type ImportTrainingPlanDto = z.infer<typeof importTrainingPlanSchema>;

export const TRAINING_PLAN_CONFLICT_MODE = {
  /** Existing sessions stay next to the plan's */
  KEEP: 'KEEP',
  /** Planned sessions still to do in the plan's range go */
  REPLACE: 'REPLACE',
} as const;

export type TrainingPlanConflictMode =
  (typeof TRAINING_PLAN_CONFLICT_MODE)[keyof typeof TRAINING_PLAN_CONFLICT_MODE];

const applyTargetSchema = z
  .object({
    athleteId: z.number().int().positive(),
    /** The day the anchor falls on, in the athlete's time zone */
    date: dateKey.optional(),
    /** A race of the athlete: the plan ends on its day */
    raceEventId: z.number().int().positive().optional(),
  })
  .refine((target) => Boolean(target.date) !== Boolean(target.raceEventId), {
    message: 'Give either date or raceEventId',
  });

export type TrainingPlanApplyTarget = z.infer<typeof applyTargetSchema>;

export const applyTrainingPlanSchema = z.object({
  targets: z
    .array(applyTargetSchema)
    .min(1)
    .max(TRAINING_PLAN_APPLY_MAX_TARGETS)
    .refine(
      (targets) =>
        new Set(targets.map((target) => target.athleteId)).size ===
        targets.length,
      { message: 'An athlete appears once' },
    ),
  /** START: the date is the first day; END: the last one (race day) */
  anchor: z.nativeEnum(PLAN_ANCHOR).default(PLAN_ANCHOR.START),
  /** First day of the plan weeks, 0 = Sunday … 6 = Saturday */
  weekStartsOn: z.number().int().min(0).max(6).default(1),
  conflictMode: z
    .enum([
      TRAINING_PLAN_CONFLICT_MODE.KEEP,
      TRAINING_PLAN_CONFLICT_MODE.REPLACE,
    ])
    .default(TRAINING_PLAN_CONFLICT_MODE.KEEP),
});

export type ApplyTrainingPlanDto = z.infer<typeof applyTrainingPlanSchema>;

export const shiftTrainingPlanSchema = z.object({
  /** Calendar days, in the athlete's time zone: 7 is a week later */
  days: z
    .number()
    .int()
    .min(-366)
    .max(366)
    .refine((days) => days !== 0, { message: 'days must not be 0' }),
});

export type ShiftTrainingPlanDto = z.infer<typeof shiftTrainingPlanSchema>;

export const appliedTrainingPlansQuerySchema = z.object({
  athleteId: z.coerce.number().int().positive().optional(),
  /** Also the plans that ended or were removed */
  includeArchived: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

export type AppliedTrainingPlansQuery = z.infer<
  typeof appliedTrainingPlansQuerySchema
>;

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

export interface TrainingPlanTemplateSummary {
  trainingPlanTemplateId: number;
  name: string;
  description: string;
  goal: string;
  sport: SPORT_TYPE | null;
  level: PLAN_LEVEL | null;
  weeks: number;
  sessions: number;
  folderId: number | null;
  /** Athletes it is applied to right now */
  activeApplications: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingPlanTemplateDetail extends TrainingPlanTemplateSummary {
  content: TrainingPlanContent;
}

export interface TrainingPlanDatedItem {
  eventId: number;
  name: string;
  /** YYYY-MM-DD in the athlete's time zone */
  date: string;
}

export interface TrainingPlanApplyPreview {
  athleteId: number;
  athleteName: string;
  /** First and last day of the plan (YYYY-MM-DD) */
  startDate: string;
  endDate: string;
  /** Sessions and notes the plan adds */
  sessions: number;
  /** Plan sessions that fall before the start or after the race */
  skipped: number;
  /** Sessions still to do already planned in the range */
  conflicts: TrainingPlanDatedItem[];
  races: TrainingPlanDatedItem[];
  /** Travel, illness and injury periods in the range */
  periods: {
    cycleId: number;
    name: string;
    kind: string;
    startDate: string;
    endDate: string;
  }[];
  /** Another plan of the library already applied over these dates */
  overlappingPlans: { trainingPlanId: number; name: string }[];
}

export interface TrainingPlanApplyResult {
  athleteId: number;
  trainingPlanId: number;
  sessions: number;
  /** Sessions removed because conflictMode was REPLACE */
  replaced: number;
}

/** Applying to several athletes runs in the background */
export type TrainingPlanApplyResponse =
  | { status: 'done'; results: TrainingPlanApplyResult[] }
  | { status: 'queued'; jobId: string };

export interface TrainingPlanApplyJobStatus {
  jobId: string;
  state: 'waiting' | 'active' | 'completed' | 'failed' | 'unknown';
  results: TrainingPlanApplyResult[];
  error: string | null;
}

export interface AppliedTrainingPlan {
  trainingPlanId: number;
  athleteId: number;
  name: string;
  goal: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  templateId: number | null;
  anchor: PLAN_ANCHOR | null;
  /** YYYY-MM-DD in the athlete's time zone */
  startDate: string;
  endDate: string;
  /** Week of the plan today (1-based), null before it starts or after it */
  currentWeek: number | null;
  weeks: number;
  sessions: number;
  /** Sessions with a matching activity */
  done: number;
  /** Sessions changed by hand since the plan was applied */
  modified: number;
}

export interface TrainingPlanRemoveResult {
  trainingPlanId: number;
  /** Sessions still to do that were removed */
  removed: number;
  /** Sessions kept: done ones, and past ones */
  kept: number;
}
