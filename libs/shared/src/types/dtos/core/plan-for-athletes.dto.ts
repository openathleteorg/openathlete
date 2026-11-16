import { z } from 'zod';

/** A club's group, or a coach's selection: past that, plan by groups */
export const PLAN_FOR_ATHLETES_MAX_ATHLETES = 200;
/** A few weeks of sessions copied at once */
export const PLAN_FOR_ATHLETES_MAX_EVENTS = 60;

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const planForAthletesSourceSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('template'),
    eventTemplateId: z.number().int().positive(),
  }),
  /** Sessions of one calendar: they keep their days apart and their times */
  z.object({
    kind: z.literal('events'),
    eventIds: z
      .array(z.number().int().positive())
      .min(1)
      .max(PLAN_FOR_ATHLETES_MAX_EVENTS),
  }),
]);
export type PlanForAthletesSource = z.infer<typeof planForAthletesSourceSchema>;

export const planForAthletesDtoSchema = z.object({
  source: planForAthletesSourceSchema,
  athleteIds: z
    .array(z.number().int().positive())
    .min(1)
    .max(PLAN_FOR_ATHLETES_MAX_ATHLETES),
  /** The local day the first session lands on, for every athlete */
  date: dateKey,
  /**
   * Local start time for every session; absent, each keeps its own time.
   * Read in each athlete's time zone: 18:00 is 18:00 for everyone.
   */
  time: timeOfDay.optional(),
  /** The coach's time zone, for athletes who have none on file */
  timeZone: z.string().min(1).max(64),
});
export type PlanForAthletesDto = z.infer<typeof planForAthletesDtoSchema>;

/** What the coach should know before planning, athlete by athlete */
export const planForAthletesPreviewAthleteSchema = z.object({
  athleteId: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  /** Thresholds the percentage targets refer to, missing for this athlete */
  missingMetrics: z.array(z.string()),
  /** Zone targets this athlete has no zones for: those steps stay open */
  missingZones: z.boolean(),
  /** Sessions or races already planned on the days the copies land on */
  sameDayEvents: z.number(),
  /** Illness, injury or travel periods over those days */
  unavailable: z.array(z.enum(['ILLNESS', 'INJURY', 'TRAVEL'])),
});
export type PlanForAthletesPreviewAthleteDto = z.infer<
  typeof planForAthletesPreviewAthleteSchema
>;

export const planForAthletesPreviewSchema = z.object({
  /** Sessions each athlete will get */
  eventCount: z.number(),
  /** The local days they land on, first to last */
  dates: z.array(z.string()),
  athletes: z.array(planForAthletesPreviewAthleteSchema),
});
export type PlanForAthletesPreviewDto = z.infer<
  typeof planForAthletesPreviewSchema
>;

export const planForAthletesResultSchema = z.object({
  /** Undoes the whole operation: DELETE /event/batch/:batchId */
  batchId: z.string(),
  eventIds: z.array(z.number()),
});
export type PlanForAthletesResultDto = z.infer<
  typeof planForAthletesResultSchema
>;

export const eventBatchParamsSchema = z.object({
  batchId: z.string().uuid(),
});
export type EventBatchParamsDto = z.infer<typeof eventBatchParamsSchema>;

export const undoEventBatchResultSchema = z.object({
  deleted: z.number(),
  /** Sessions already done, or no longer the coach's to delete, stay */
  kept: z.number(),
});
export type UndoEventBatchResultDto = z.infer<
  typeof undoEventBatchResultSchema
>;
